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
    const match = await Match.findById(matchId);
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
      eventType: eventData.eventType,
      team: eventData.team,
      player: eventData.player,
      data: eventData.data || {},
      scorer: scorerId,
      sequence,
      idempotencyKey: eventData.idempotencyKey || `${matchId}-${sequence}-${Date.now()}`,
      offlineCreatedAt: eventData.offlineCreatedAt || null,
    });

    await event.save();

    // Recompute full score from events
    const allEvents = await Event.find({ match: matchId, isUndone: false })
      .sort({ sequence: 1 })
      .lean();

    const engine = this.getEngine(match.sport);
    const format = match.config || {};
    const mappedEvents = allEvents.map(e => ({
      type: e.eventType,
      team: e.team,
      player: e.player,
      payload: e.data,
      isUndone: e.isUndone,
    }));

    let newScore;
    if (match.sport === 'cricket') {
      newScore = engine.computeScore(mappedEvents, format);
    } else {
      newScore = engine.deriveScoreFromEvents(mappedEvents, format);
    }

    // Atomically update match score with version check
    const updated = await Match.findOneAndUpdate(
      { _id: matchId, scoreVersion: match.scoreVersion },
      {
        $set: { currentScore: newScore },
        $inc: { scoreVersion: 1 },
      },
      { new: true }
    );

    if (!updated) {
      // Concurrent update — retry
      throw new Error('Concurrent score update detected. Please retry.');
    }

    // Publish real-time score update
    try {
      const redis = getRedis();
      await redis.publish(`match:${matchId}:score`, JSON.stringify({
        event: event.toObject(),
        score: newScore,
        scoreVersion: updated.scoreVersion,
      }));
    } catch (err) {
      logger.warn({ matchId, err: err.message }, 'Failed to publish score update');
    }

    return { event: event.toObject(), score: newScore, scoreVersion: updated.scoreVersion };
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
    const format = match.config || {};
    const mappedEvents = allEvents.map(e => ({
      type: e.eventType,
      team: e.team,
      player: e.player,
      payload: e.data,
      isUndone: e.isUndone,
    }));

    let newScore;
    if (match.sport === 'cricket') {
      newScore = engine.computeScore(mappedEvents, format);
    } else {
      newScore = engine.deriveScoreFromEvents(mappedEvents, format);
    }

    await Match.findByIdAndUpdate(matchId, {
      $set: { currentScore: newScore },
      $inc: { scoreVersion: 1 },
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
    const match = await Match.findById(matchId).lean();
    if (!match) throw new Error('Match not found');
    return {
      sport: match.sport,
      status: match.status,
      score: match.currentScore,
      scoreVersion: match.scoreVersion,
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
   * Start a match.
   */
  static async startMatch(matchId, scorerId) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'upcoming') {
      throw new Error('Match can only be started from upcoming status');
    }

    const engine = this.getEngine(match.sport);
    const format = match.config || {};
    const initialScore = this.createInitialState(match.sport, format);

    match.status = 'live';
    match.startedAt = new Date();
    match.currentScore = initialScore;
    match.scoreVersion = 0;
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
    await match.save();

    try {
      const redis = getRedis();
      await redis.publish(`match:${matchId}:status`, JSON.stringify({
        status: 'completed',
        completedAt: match.completedAt,
        finalScore: match.currentScore,
      }));
    } catch (err) {
      logger.warn({ matchId }, 'Failed to publish match end');
    }

    return match.toObject();
  }
}

module.exports = ScoringService;
