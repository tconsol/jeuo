const { Match, Event, Tournament } = require('../models');
const logger = require('../config/logger');

/**
 * UNIVERSAL SCORING SERVICE
 *
 * Handles event recording, score calculation, and undo logic
 * for all sports (cricket, football, basketball, etc.)
 */
class ScoringService {
  /**
   * Record a scoring event (immutable, with idempotency)
   */
  static async recordEvent(matchId, eventData, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    // Get sequence number
    const lastEvent = await Event.findOne({ match: matchId, isUndone: false })
      .sort({ sequence: -1 });
    const sequence = (lastEvent?.sequence || 0) + 1;

    // Check idempotency
    const existing = await Event.findOne({
      match: matchId,
      idempotencyKey: eventData.idempotencyKey,
      isUndone: false,
    });
    if (existing) return this._recalculateScore(matchId);

    // Create event
    const event = new Event({
      match: matchId,
      scorer: scorerId,
      sequence,
      sport: match.sport,
      type: eventData.type,
      team: eventData.team,
      player: eventData.player,
      secondaryPlayer: eventData.secondaryPlayer,
      payload: eventData.payload || {},
      idempotencyKey: eventData.idempotencyKey,
      clientTimestamp: eventData.clientTimestamp || new Date(),
    });

    await event.save();

    // Recalculate match score
    const updatedScore = await this._recalculateScore(matchId);

    // Broadcast via socket
    const { getIO } = require('../realtime');
    const io = getIO();
    if (io) {
      io.to(`match:${matchId}`).emit('scoreUpdate', {
        score: updatedScore,
        event: event.toObject(),
      });
    }

    return { score: updatedScore, event };
  }

  /**
   * Undo the last event
   */
  static async undoLastEvent(matchId, scorerId) {
    const lastEvent = await Event.findOne({
      match: matchId,
      isUndone: false,
    }).sort({ sequence: -1 });

    if (!lastEvent) throw new Error('No events to undo');

    lastEvent.isUndone = true;
    lastEvent.undoneBy = scorerId;
    lastEvent.undoneAt = new Date();
    await lastEvent.save();

    return this._recalculateScore(matchId);
  }

  /**
   * Recalculate score by replaying all active (non-undone) events
   */
  static async _recalculateScore(matchId) {
    const match = await Match.findById(matchId);
    const events = await Event.find({
      match: matchId,
      isUndone: false,
    }).sort({ sequence: 1 });

    // Initialize score state
    const score = this._initializeScoreState(match.sport, match.format);

    // Replay events
    for (const event of events) {
      this._applyEvent(score, event, match.sport);
    }

    // Update match with score snapshot
    match.scoreSnapshot = score;
    match.state = score;
    await match.save();

    return score;
  }

  /**
   * Initialize score state based on sport
   */
  static _initializeScoreState(sport, format) {
    switch (sport) {
      case 'cricket':
        return {
          innings: [
            { team: 'home', runs: 0, wickets: 0, overs: 0, balls: 0, ballsFaced: [], extras: 0 },
            { team: 'away', runs: 0, wickets: 0, overs: 0, balls: 0, ballsFaced: [], extras: 0 },
          ],
          currentInnings: 0,
          toss: {},
          commentary: [],
        };
      case 'football':
        return {
          homeGoals: 0,
          awayGoals: 0,
          halfTime: false,
          fullTime: false,
          penalties: null,
          extraTime: false,
        };
      case 'basketball':
        return {
          quarters: [0, 0, 0, 0],
          homeScore: 0,
          awayScore: 0,
          currentQuarter: 0,
        };
      default:
        return {};
    }
  }

  /**
   * Apply a single event to the score state
   */
  static _applyEvent(score, event, sport) {
    if (sport === 'cricket') {
      this._applyCricketEvent(score, event);
    } else if (sport === 'football') {
      this._applyFootballEvent(score, event);
    } else if (sport === 'basketball') {
      this._applyBasketballEvent(score, event);
    }
  }

  /**
   * Apply cricket-specific events
   */
  static _applyCricketEvent(score, event) {
    const { type, team, payload } = event;
    const teamIndex = team === 'home' ? 0 : 1;
    const innings = score.innings[teamIndex];

    switch (type) {
      case 'delivery':
        this._processCricketDelivery(innings, payload);
        break;
      case 'wicket':
        innings.wickets += 1;
        if (payload.runs) innings.runs += payload.runs;
        break;
      case 'extra':
        innings.extras += payload.extraRuns || 1;
        innings.runs += payload.extraRuns || 1;
        if (payload.extraType !== 'bye' && payload.extraType !== 'leg_bye') {
          innings.balls += 1; // Wide/No-ball count as balls
        }
        break;
      case 'end_over':
        innings.overs = Math.floor(payload.ballInOver / 6);
        innings.balls = payload.ballInOver % 6;
        break;
      case 'players_set':
        // Set up batting/bowling teams
        break;
    }
  }

  /**
   * Process cricket delivery (ball bowled)
   */
  static _processCricketDelivery(innings, payload) {
    const { runs = 0, extraType, isExtra, extraRuns = 0 } = payload;

    if (isExtra) {
      innings.runs += runs + extraRuns;
      innings.extras += extraRuns;
      // Wides and no-balls count as balls
      if (extraType === 'wide' || extraType === 'no_ball') {
        innings.balls += 1;
      }
    } else {
      innings.runs += runs;
      innings.balls += 1;
    }

    // Update over/ball counters
    innings.overs = Math.floor(innings.balls / 6);
  }

  static _applyFootballEvent(score, event) {
    const { type, team, payload } = event;
    if (type === 'goal') {
      if (team === 'home') score.homeGoals += 1;
      else score.awayGoals += 1;
      if (payload.isOwnGoal) {
        if (team === 'home') score.awayGoals += 1;
        else score.homeGoals += 1;
      }
    }
  }

  static _applyBasketballEvent(score, event) {
    const { type, team, payload } = event;
    if (type === 'field_goal_2pt' || type === 'field_goal_3pt' || type === 'free_throw') {
      if (payload.isMade) {
        const points = payload.points || (type === 'free_throw' ? 1 : type === 'field_goal_3pt' ? 3 : 2);
        if (team === 'home') score.homeScore += points;
        else score.awayScore += points;
      }
    }
  }

  /**
   * Get current match score
   */
  static async getMatchScore(matchId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    return match.scoreSnapshot || {};
  }

  /**
   * Get all match events
   */
  static async getMatchEvents(matchId, options = {}) {
    const filter = { match: matchId };
    if (!options.includeUndone) {
      filter.isUndone = false;
    }
    return Event.find(filter).sort({ sequence: 1 }).populate('player', 'name avatar');
  }

  /**
   * Start match
   */
  static async startMatch(matchId, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    match.status = 'live';
    await match.save();
    return match;
  }

  /**
   * End match
   */
  static async endMatch(matchId, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    match.status = 'completed';
    await match.save();

    // Update tournament points if part of tournament
    if (match.tournament) {
      await this._updateTournamentPoints(match.tournament, match);
    }

    return match;
  }

  /**
   * Record toss
   */
  static async recordToss(matchId, tossData, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    match.toss = tossData;
    await match.save();
    return match;
  }

  /**
   * Set toss decision
   */
  static async setTossDecision(matchId, decision, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (!match.toss) throw new Error('Toss not recorded yet');
    match.toss.decision = decision;
    await match.save();
    return match.toss;
  }

  /**
   * Set match players (XI lineup)
   */
  static async setMatchPlayers(matchId, playerData, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    if (playerData.team === 'home') {
      match.teams.home.players = playerData.players;
    } else {
      match.teams.away.players = playerData.players;
    }

    await match.save();

    // Record event for audit trail
    const event = new Event({
      match: matchId,
      scorer: scorerId,
      type: 'players_set',
      sport: match.sport,
      sequence: await Event.countDocuments({ match: matchId, isUndone: false }),
      payload: playerData,
      idempotencyKey: `players_set_${Date.now()}`,
    });

    await event.save();
    return this._recalculateScore(matchId);
  }

  /**
   * Add a scorer (match operator)
   */
  static async addScorer(matchId, userId, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    // Only match creator or existing scorer can add new scorer
    const isAuthorized = match.scorers.some(s => s.toString() === scorerId.toString());
    if (!isAuthorized) throw new Error('Not authorized to add scorers');

    if (!match.scorers.includes(userId)) {
      match.scorers.push(userId);
      await match.save();
    }

    return match;
  }

  /**
   * Update tournament points table after match completion
   */
  static async _updateTournamentPoints(tournamentId, match) {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return;

    const score = match.scoreSnapshot;
    if (!score) return;

    // Determine winner based on sport-specific logic
    let winner, loser;
    if (match.sport === 'cricket') {
      const homeRuns = score.innings[0]?.runs || 0;
      const awayRuns = score.innings[1]?.runs || 0;
      winner = homeRuns > awayRuns ? 'home' : 'away';
      loser = winner === 'home' ? 'away' : 'home';
    } else if (match.sport === 'football') {
      if (score.homeGoals > score.awayGoals) {
        winner = 'home';
        loser = 'away';
      } else if (score.awayGoals > score.homeGoals) {
        winner = 'away';
        loser = 'home';
      } else {
        winner = loser = null; // Draw
      }
    } else {
      return; // Other sports not yet implemented
    }

    // Update points table
    const homeTeam = match.teams.home;
    const awayTeam = match.teams.away;

    const updateTeamStats = (teamId, won, lost, isDraw) => {
      let entry = tournament.pointsTable.find(e =>
        e.team?.toString() === teamId?.toString()
      );
      if (!entry) {
        entry = {
          team: teamId,
          teamName: tournament.teams.find(t => t._id?.toString() === teamId?.toString())?.name,
          played: 0,
          won: 0,
          lost: 0,
          drawn: 0,
          points: 0,
          netRunRate: 0,
        };
        tournament.pointsTable.push(entry);
      }

      entry.played += 1;
      if (won) {
        entry.won += 1;
        entry.points += 2; // Standard cricket points
      } else if (lost) {
        entry.lost += 1;
      } else if (isDraw) {
        entry.drawn += 1;
        entry.points += 1;
      }
    };

    if (!winner) {
      // Draw
      updateTeamStats(homeTeam.captain, false, false, true);
      updateTeamStats(awayTeam.captain, false, false, true);
    } else {
      const winnerTeam = winner === 'home' ? homeTeam : awayTeam;
      const loserTeam = loser === 'home' ? homeTeam : awayTeam;
      updateTeamStats(winnerTeam.captain, true, false, false);
      updateTeamStats(loserTeam.captain, false, true, false);
    }

    // Calculate NRR if cricket
    if (match.sport === 'cricket') {
      this._calculateCricketNRR(tournament);
    }

    // Sort points table
    tournament.pointsTable.sort((a, b) => b.points - a.points);

    await tournament.save();
  }

  /**
   * Calculate Net Run Rate for cricket tournaments
   */
  static _calculateCricketNRR(tournament) {
    const scoresByTeam = {}; // Team -> { runsFor, runsAgainst, oversFor, oversAgainst }

    tournament.pointsTable.forEach(entry => {
      scoresByTeam[entry.team.toString()] = {
        runsFor: 0,
        runsAgainst: 0,
        oversFor: 0,
        oversAgainst: 0,
      };
    });

    // Aggregate scores from all matches
    // This would require querying all matches in tournament
    // For now, simplified version

    tournament.pointsTable.forEach(entry => {
      const stats = scoresByTeam[entry.team.toString()];
      if (stats.oversFor > 0) {
        entry.netRunRate = (stats.runsFor - stats.runsAgainst) / stats.oversFor;
      }
    });
  }
}

module.exports = ScoringService;
