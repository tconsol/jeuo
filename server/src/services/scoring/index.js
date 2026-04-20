/**
 * Scoring Engine Orchestrator
 *
 * Routes events to the correct sport-specific scoring engine.
 * Provides a unified API for all scoring operations.
 */

const CricketScoring = require('./cricket.scoring');
const FootballScoring = require('./football.scoring');
const BasketballScoring = require('./basketball.scoring');
const TennisScoring = require('./tennis.scoring');
const RacketScoring = require('./badminton.scoring');
const VolleyballScoring = require('./volleyball.scoring');

const Event = require('../../models/Event');
const Match = require('../../models/Match');
const AuditLog = require('../../models/AuditLog');
const { getRedis } = require('../../config/redis');
const logger = require('../../config/logger');

const ENGINES = {
  cricket: CricketScoring,
  football: FootballScoring,
  basketball: BasketballScoring,
  tennis: TennisScoring,
  badminton: RacketScoring,
  table_tennis: RacketScoring,
  volleyball: VolleyballScoring,
};

class ScoringService {
  /**
   * Get the scoring engine for a given sport.
   */
  static getEngine(sport) {
    const engine = ENGINES[sport];
    if (!engine) throw new Error(`No scoring engine for sport: ${sport}`);
    return engine;
  }

  /**
   * Initialize scoring state for a match.
   */
  static createInitialState(sport, format) {
    const engine = this.getEngine(sport);
    if (sport === 'badminton' || sport === 'table_tennis') {
      return engine.createInitialState({ ...format, sport });
    }
    return engine.createInitialState(format);
  }

  /**
   * Record a scoring event for a match.
   * Validates, persists the event, recomputes score, updates match.
   * Publishes real-time update via Redis pub/sub.
   */
  static async recordEvent(matchId, eventData, scorerId) {
    const match = await Match.findById(matchId)
      .populate('teams.home.players', 'name')
      .populate('teams.away.players', 'name');
    if (!match) throw new Error('Match not found');
    if (match.status !== 'live' && match.status !== 'paused') {
      throw new Error('Match is not live');
    }

    // Check scorer is authorized
    if (!match.scorers.some(s => s.toString() === scorerId.toString())) {
      throw new Error('Not authorized to score this match');
    }

    // Get next sequence number
    const lastEvent = await Event.findOne({ match: matchId })
      .sort({ sequence: -1 })
      .select('sequence')
      .lean();
    const sequence = lastEvent ? lastEvent.sequence + 1 : 1;

    // Create event
    const event = new Event({
      match: matchId,
      sport: match.sport,
      type: eventData.type,
      team: eventData.team,
      player: eventData.player,
      payload: eventData.data || {},
      scorer: scorerId,
      sequence,
      idempotencyKey: eventData.idempotencyKey || `${matchId}-${sequence}-${Date.now()}`,
      clientTimestamp: eventData.offlineCreatedAt || null,
    });

    await event.save();

    // Recompute full score from events
    const allEvents = await Event.find({ match: matchId, isUndone: false })
      .sort({ sequence: 1 })
      .lean();

    const engine = this.getEngine(match.sport);
    const format = match.format || {};
    const mappedEvents = allEvents.map(e => ({
      type: e.type,
      team: e.team,
      player: e.player,
      payload: e.payload,
      isUndone: e.isUndone,
    }));

    let newScore;
    if (typeof engine.deriveScoreFromEvents === 'function') {
      newScore = engine.deriveScoreFromEvents(mappedEvents, format);
    } else if (typeof engine.computeScore === 'function') {
      newScore = engine.computeScore(mappedEvents, format);
    } else {
      throw new Error('No score computation method found for sport: ' + match.sport);
    }

    // Auto-generate commentary for cricket
    if (match.sport === 'cricket' && (event.type === 'delivery' || event.type === 'wicket')) {
      const commentary = this.generateCommentary(match, event.toObject(), newScore);
      if (commentary) {
        await Match.findByIdAndUpdate(matchId, {
          $push: { commentary: { $each: [commentary], $slice: -200 } }
        });
      }
    }

    // Update match score snapshot
    const updated = await Match.findByIdAndUpdate(
      matchId,
      {
        $set: { scoreSnapshot: newScore },
        $inc: { scoringVersion: 1 },
      },
      { new: true }
    );

    // ── Auto Match End Detection ──
    let autoEnded = false;
    if (match.sport === 'cricket' && newScore) {
      const totalOvers = match.format?.overs || 20;
      const currentInnings = newScore.currentInningsData || {};
      const prevInnings = newScore.innings?.[0];
      // Check if second innings team has chased target
      if (prevInnings && currentInnings.runs > prevInnings.runs) {
        autoEnded = true;
      }
      // Check if all wickets fallen (10 out)
      if (currentInnings.wickets >= 10) {
        autoEnded = true;
      }
      // Check if all overs bowled in current innings
      if (currentInnings.overs >= totalOvers) {
        // If first innings, switch innings (handled by engine)
        // If second innings, match ends
        if (newScore.currentInnings >= 2 || (prevInnings && currentInnings.overs >= totalOvers)) {
          autoEnded = true;
        }
      }
    }
    if (match.sport === 'football' && newScore) {
      const halfDuration = match.format?.halfDuration || 45;
      if (newScore.minute >= halfDuration * 2) autoEnded = true;
    }
    if (match.sport === 'basketball' && newScore) {
      const quarters = match.format?.quarters || 4;
      if (newScore.quarter > quarters) autoEnded = true;
    }

    if (autoEnded) {
      await this.endMatch(matchId, scorerId);
    }

    // Publish real-time score update
    try {
      const redis = getRedis();
      await redis.publish(`match:${matchId}:score`, JSON.stringify({
        event: event.toObject(),
        score: newScore,
        scoreVersion: updated.scoringVersion,
      }));
    } catch (err) {
      logger.warn({ matchId, err: err.message }, 'Failed to publish score update');
    }

    return { event: event.toObject(), score: newScore, scoreVersion: updated.scoringVersion };
  }

  /**
   * Undo the last event of a match.
   */
  static async undoLastEvent(matchId, scorerId) {
    const lastEvent = await Event.findOne({
      match: matchId,
      isUndone: false,
    }).sort({ sequence: -1 });

    if (!lastEvent) throw new Error('No events to undo');

    lastEvent.isUndone = true;
    lastEvent.undoneBy = scorerId;
    await lastEvent.save();

    // Log audit
    await AuditLog.create({
      actor: scorerId,
      action: 'score_undo',
      entity: { type: 'Event', id: lastEvent._id },
      changes: { before: lastEvent.toObject(), after: { isUndone: true } },
    });

    // Recompute score
    const match = await Match.findById(matchId);
    const allEvents = await Event.find({ match: matchId, isUndone: false })
      .sort({ sequence: 1 })
      .lean();

    const engine = this.getEngine(match.sport);
    const format = match.format || {};
    const mappedEvents = allEvents.map(e => ({
      type: e.type,
      team: e.team,
      player: e.player,
      payload: e.payload,
      isUndone: e.isUndone,
    }));

    let newScore;
    if (typeof engine.deriveScoreFromEvents === 'function') {
      newScore = engine.deriveScoreFromEvents(mappedEvents, format);
    } else if (typeof engine.computeScore === 'function') {
      newScore = engine.computeScore(mappedEvents, format);
    } else {
      throw new Error('No score computation method found');
    }

    await Match.findByIdAndUpdate(matchId, {
      $set: { scoreSnapshot: newScore },
      $inc: { scoringVersion: 1 },
    });

    // Publish undo update
    try {
      const redis = getRedis();
      await redis.publish(`match:${matchId}:score`, JSON.stringify({
        type: 'undo',
        score: newScore,
      }));
    } catch (err) {
      logger.warn({ matchId, err: err.message }, 'Failed to publish undo update');
    }

    return { undoneEvent: lastEvent.toObject(), score: newScore };
  }

  /**
   * Get full match score state.
   */
  static async getMatchScore(matchId) {
    const match = await Match.findById(matchId)
      .populate('teams.home.players', 'name avatar')
      .populate('teams.away.players', 'name avatar')
      .populate('scorers', 'name')
      .populate('venue', 'name location images isIndoor surfaceType')
      .lean();
    if (!match) throw new Error('Match not found');
    const events = await Event.find({ match: matchId, isUndone: false })
      .sort({ sequence: 1 })
      .lean();
    return {
      match,
      score: match.scoreSnapshot || null,
      events,
    };
  }

  /**
   * Get all events for a match (for replay / timeline).
   */
  static async getMatchEvents(matchId, { includeUndone = false } = {}) {
    const filter = { match: matchId };
    if (!includeUndone) filter.isUndone = false;
    return Event.find(filter).sort({ sequence: 1 }).lean();
  }

  /**
   * Start a match — validates teams, players, and toss before allowing start.
   */
  static async startMatch(matchId, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'scheduled') {
      throw new Error('Match can only be started from scheduled status');
    }

    // ── Match Validation ──
    if (!match.scorers?.length) {
      throw new Error('At least one scorer must be assigned before starting');
    }
    if (!match.scorers.some(s => s.toString() === scorerId.toString())) {
      throw new Error('Only an assigned scorer can start the match');
    }
    if (!match.teams?.home?.name || !match.teams?.away?.name) {
      throw new Error('Both teams must be set before starting');
    }
    // Cricket requires toss before start
    if (match.sport === 'cricket' && !match.toss?.wonBy) {
      throw new Error('Toss must be completed before starting a cricket match');
    }
    // Check minimum players for team sports
    const homeCount = match.teams.home.players?.length || 0;
    const awayCount = match.teams.away.players?.length || 0;
    const minPlayers = { cricket: 2, football: 5, basketball: 3, volleyball: 4, badminton: 1, tennis: 1, table_tennis: 1 };
    const min = minPlayers[match.sport] || 1;
    if (homeCount < min || awayCount < min) {
      throw new Error(`Each team needs at least ${min} player(s) for ${match.sport}`);
    }
    // Duplicate match prevention — same teams, same day, overlapping time
    const sameDay = new Date(match.scheduledAt);
    sameDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(sameDay);
    nextDay.setDate(nextDay.getDate() + 1);
    const duplicate = await Match.findOne({
      _id: { $ne: matchId },
      sport: match.sport,
      status: { $in: ['scheduled', 'live'] },
      scheduledAt: { $gte: sameDay, $lt: nextDay },
      'teams.home.name': match.teams.home.name,
      'teams.away.name': match.teams.away.name,
    });
    if (duplicate) {
      throw new Error('A match between these teams is already scheduled today');
    }

    const engine = this.getEngine(match.sport);
    const format = match.format || {};
    const initialScore = this.createInitialState(match.sport, format);

    match.status = 'live';
    match.startedAt = new Date();
    match.scoreSnapshot = initialScore;
    match.scoringVersion = 0;
    await match.save();

    try {
      const redis = getRedis();
      await redis.publish(`match:${matchId}:status`, JSON.stringify({
        status: 'live',
        startedAt: match.startedAt,
      }));
    } catch (err) {
      logger.warn({ matchId }, 'Failed to publish match start');
    }

    return match.toObject();
  }

  /**
   * End a match.
   */
  static async endMatch(matchId, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'live' && match.status !== 'paused') {
      throw new Error('Match must be live or paused to end');
    }

    match.status = 'completed';
    match.completedAt = new Date();

    // Auto-generate result summary
    const score = match.scoreSnapshot;
    if (score && match.sport === 'cricket') {
      const ci = score.currentInningsData || {};
      const prevInnings = score.innings?.[0];
      if (prevInnings && ci.runs > prevInnings.runs) {
        const wicketsLeft = 10 - ci.wickets;
        match.result = {
          winner: ci.battingTeam === 'home' ? 'home' : 'away',
          summary: `${ci.battingTeam === 'home' ? match.teams.home.name : match.teams.away.name} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}`,
        };
      } else if (prevInnings && prevInnings.runs > ci.runs) {
        const margin = prevInnings.runs - ci.runs;
        match.result = {
          winner: prevInnings.battingTeam === 'home' ? 'home' : 'away',
          summary: `${prevInnings.battingTeam === 'home' ? match.teams.home.name : match.teams.away.name} won by ${margin} run${margin > 1 ? 's' : ''}`,
        };
      }
    }

    await match.save();

    try {
      const redis = getRedis();
      await redis.publish(`match:${matchId}:status`, JSON.stringify({
        status: 'completed',
        completedAt: match.completedAt,
        finalScore: match.scoreSnapshot,
        result: match.result,
      }));
    } catch (err) {
      logger.warn({ matchId }, 'Failed to publish match end');
    }

    return match.toObject();
  }

  /**
   * Record toss result for a match.
   */
  static async recordToss(matchId, tossData, userId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'scheduled') throw new Error('Toss can only be done before match starts');

    // Only scorer or team captain can do toss
    const isScorer = match.scorers.some(s => s.toString() === userId.toString());
    const isCaptain = match.teams.home.captain?.toString() === userId.toString() ||
                      match.teams.away.captain?.toString() === userId.toString();
    if (!isScorer && !isCaptain) throw new Error('Not authorized to record toss');

    // Simulate coin toss
    const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const callingTeam = tossData.callingTeam; // 'home' or 'away'
    const callerChoice = tossData.call; // 'heads' or 'tails'
    const wonBy = callerChoice === coinResult ? callingTeam : (callingTeam === 'home' ? 'away' : 'home');

    match.toss = {
      wonBy,
      decision: tossData.decision || null, // 'bat' or 'bowl' - set later if not provided
      coinResult,
      callingTeam,
      callerChoice,
    };
    await match.save();

    return { toss: match.toss, coinResult };
  }

  /**
   * Set toss decision (bat/bowl) after toss is won.
   */
  static async setTossDecision(matchId, decision, userId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (!match.toss?.wonBy) throw new Error('Toss not done yet');

    match.toss.decision = decision; // 'bat' or 'bowl'
    await match.save();

    return match.toss;
  }

  /**
   * Set match players (striker, non-striker, bowler) for current innings.
   */
  static async setMatchPlayers(matchId, playerData, userId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'live') throw new Error('Match must be live');

    const state = match.scoreSnapshot || {};
    const innings = state.currentInningsData;
    if (!innings) throw new Error('No active innings');

    if (playerData.striker) innings.batsmen.striker = playerData.striker;
    if (playerData.nonStriker) innings.batsmen.nonStriker = playerData.nonStriker;
    if (playerData.bowler) innings.currentBowler = playerData.bowler;
    if (playerData.battingTeam) innings.battingTeam = playerData.battingTeam;
    if (playerData.bowlingTeam) innings.bowlingTeam = playerData.bowlingTeam;

    match.scoreSnapshot = state;
    match.markModified('scoreSnapshot');
    await match.save();

    return match.scoreSnapshot;
  }

  /**
   * Add a scorer to a match.
   */
  static async addScorer(matchId, scorerUserId, requestingUserId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    const isExistingScorer = match.scorers.some(s => s.toString() === requestingUserId.toString());
    const isCaptain = match.teams.home.captain?.toString() === requestingUserId.toString() ||
                      match.teams.away.captain?.toString() === requestingUserId.toString();
    if (!isExistingScorer && !isCaptain) throw new Error('Not authorized to add scorers');

    if (match.scorers.some(s => s.toString() === scorerUserId.toString())) {
      throw new Error('User is already a scorer');
    }

    match.scorers.push(scorerUserId);
    await match.save();
    return match;
  }

  /**
   * Generate auto-commentary for an event.
   */
  static generateCommentary(match, event, scoreState) {
    const innings = scoreState?.currentInningsData;
    if (!innings) return null;

    const players = {};
    // Build player name map from teams
    [...(match.teams?.home?.players || []), ...(match.teams?.away?.players || [])].forEach(p => {
      if (p && p._id) players[p._id.toString()] = p.name || 'Unknown';
    });

    const batsmanName = players[innings.batsmen?.striker] || 'Batsman';
    const bowlerName = players[innings.currentBowler] || 'Bowler';
    const payload = event.payload || {};
    const oversStr = `${Math.floor(innings.totalBalls / 6)}.${innings.totalBalls % 6}`;

    let text = '';
    let type = 'normal';

    if (event.type === 'delivery') {
      const runs = payload.runs || 0;
      if (payload.isExtra) {
        switch (payload.extraType) {
          case 'wide': text = `Wide ball! ${runs > 1 ? `${runs} runs added.` : ''}`; type = 'extra'; break;
          case 'no_ball': text = `No ball! ${batsmanName} scores ${runs} off the free hit.`; type = 'extra'; break;
          case 'bye': text = `Bye! ${runs} run${runs > 1 ? 's' : ''} taken.`; type = 'extra'; break;
          case 'leg_bye': text = `Leg bye! ${runs} run${runs > 1 ? 's' : ''}.`; type = 'extra'; break;
        }
      } else if (runs === 0) {
        const dots = ['Dot ball.', 'Good delivery, no run.', 'Tight bowling, dot.', `${bowlerName} keeps it tight.`];
        text = dots[Math.floor(Math.random() * dots.length)];
      } else if (runs === 1) {
        text = `${batsmanName} takes a quick single.`;
      } else if (runs === 2) {
        text = `${batsmanName} pushes for two runs.`;
      } else if (runs === 3) {
        text = `Good running! Three runs taken by ${batsmanName}.`;
      } else if (runs === 4) {
        const shots = payload.shotArea ? ` through ${payload.shotArea}` : '';
        text = `FOUR! ${batsmanName} finds the boundary${shots} off ${bowlerName}!`;
        type = 'boundary';
      } else if (runs === 6) {
        const shots = payload.shotArea ? ` towards ${payload.shotArea}` : '';
        text = `SIX! ${batsmanName} smashes it${shots} off ${bowlerName}! What a shot!`;
        type = 'six';
      }
    } else if (event.type === 'wicket') {
      type = 'wicket';
      switch (payload.wicketType) {
        case 'bowled': text = `BOWLED! ${bowlerName} knocks over the stumps! ${batsmanName} has to walk.`; break;
        case 'caught': text = `CAUGHT! ${batsmanName} is out caught${payload.fielder ? ' by ' + (players[payload.fielder] || 'fielder') : ''}! ${bowlerName} strikes!`; break;
        case 'lbw': text = `LBW! ${bowlerName} traps ${batsmanName} in front of the wickets!`; break;
        case 'run_out': text = `RUN OUT! ${batsmanName} is caught short of the crease!`; break;
        case 'stumped': text = `STUMPED! Quick work behind the stumps! ${batsmanName} is out!`; break;
        default: text = `WICKET! ${batsmanName} is dismissed!`; break;
      }
    }

    if (!text) return null;

    return {
      over: oversStr,
      text,
      type,
      timestamp: new Date(),
      eventId: event._id,
    };
  }

  /**
   * Substitute a player mid-match.
   */
  static async substitutePlayer(matchId, subData, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'live' && match.status !== 'paused') {
      throw new Error('Substitutions only allowed during live match');
    }
    if (!match.scorers.some(s => s.toString() === scorerId.toString())) {
      throw new Error('Not authorized');
    }

    const { team, playerOut, playerIn, reason, minute } = subData;
    const teamObj = match.teams[team];
    if (!teamObj) throw new Error('Invalid team');

    // Remove old player and add new one
    const outIdx = teamObj.players.findIndex(p => p.toString() === playerOut);
    if (outIdx === -1) throw new Error('Player not in team');

    teamObj.players[outIdx] = playerIn;
    match.substitutions.push({ team, playerOut, playerIn, reason, minute });
    await match.save();

    try {
      const redis = getRedis();
      await redis.publish(`match:${matchId}:score`, JSON.stringify({
        type: 'substitution', team, playerOut, playerIn,
      }));
    } catch (err) {
      logger.warn({ matchId }, 'Failed to publish substitution');
    }

    return match.toObject();
  }

  /**
   * Confirm match result (by opposing captain).
   */
  static async confirmResult(matchId, userId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'completed') throw new Error('Match must be completed first');
    if (match.result?.confirmed) throw new Error('Result already confirmed');

    // Only opposing team captain can confirm
    const isHomeCaptain = match.teams.home.captain?.toString() === userId.toString();
    const isAwayCaptain = match.teams.away.captain?.toString() === userId.toString();
    const isAdmin = false; // caller checks admin role separately
    if (!isHomeCaptain && !isAwayCaptain && !isAdmin) {
      throw new Error('Only a team captain can confirm the result');
    }

    match.result.confirmed = true;
    match.result.confirmedBy = userId;
    await match.save();

    return match.toObject();
  }

  /**
   * Rematch — clone a completed match as a new scheduled match.
   */
  static async rematch(matchId, userId) {
    const original = await Match.findById(matchId).lean();
    if (!original) throw new Error('Match not found');
    if (original.status !== 'completed') throw new Error('Can only rematch completed matches');

    const newMatch = new Match({
      sport: original.sport,
      venue: original.venue,
      format: original.format,
      teams: {
        home: { name: original.teams.home.name, players: original.teams.home.players, captain: original.teams.home.captain },
        away: { name: original.teams.away.name, players: original.teams.away.players, captain: original.teams.away.captain },
      },
      scorers: original.scorers,
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
    });
    await newMatch.save();
    return newMatch.toObject();
  }
}

module.exports = ScoringService;
