const mongoose = require('mongoose');

/**
 * SCORING EVENT MODEL
 *
 * Every scoring action is stored as an immutable event.
 * The match score is DERIVED by replaying events — never stored directly.
 * This ensures full audit trail, undo capability, and idempotency.
 *
 * Idempotency: Each event has a unique `idempotencyKey` (clientId + timestamp)
 * to prevent duplicate events from retries or offline sync.
 */
const eventSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  scorer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Idempotency key: prevents duplicate event processing
  idempotencyKey: { type: String, required: true },

  // Event sequence number within the match (monotonically increasing)
  sequence: { type: Number, required: true },

  // Sport-specific event type
  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'],
  },

  /**
   * EVENT TYPES BY SPORT:
   *
   * CRICKET: delivery, wicket, extra, end_over, end_innings, penalty_run
   * FOOTBALL: goal, assist, foul, yellow_card, red_card, substitution, penalty, corner, offside, half_time, full_time
   * BASKETBALL: field_goal_2pt, field_goal_3pt, free_throw, rebound, assist, steal, block, turnover, foul, timeout, quarter_end
   * TENNIS: point, ace, double_fault, game_end, set_end, tiebreak_point
   * BADMINTON: rally_point, service_fault, let
   * TABLE_TENNIS: rally_point, service_fault, let, timeout
   * VOLLEYBALL: rally_point, service_ace, service_error, attack_point, block_point, timeout, substitution, set_end
   */
  type: { type: String, required: true },

  // Which team this event applies to
  team: { type: String, enum: ['home', 'away'], required: true },

  // Player involved (if applicable)
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  secondaryPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // e.g., assisting player, fielder

  // Sport-specific payload
  payload: {
    // ---- CRICKET ----
    runs: Number,           // 0,1,2,3,4,6
    isExtra: Boolean,
    extraType: { type: String, enum: ['wide', 'no_ball', 'bye', 'leg_bye', 'penalty'] },
    extraRuns: Number,
    wicketType: { type: String, enum: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired', 'timed_out', 'obstructing_field', 'hit_ball_twice'] },
    bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fielder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overNumber: Number,
    ballInOver: Number,
    strikerSwap: Boolean,   // did batsmen swap ends

    // ---- FOOTBALL ----
    minute: Number,
    isOwnGoal: Boolean,
    isPenalty: Boolean,
    cardType: { type: String, enum: ['yellow', 'red', 'second_yellow'] },
    substitutedIn: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    substitutedOut: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ---- BASKETBALL ----
    points: Number,         // 1, 2, or 3
    isMade: Boolean,        // shot made or missed
    reboundType: { type: String, enum: ['offensive', 'defensive'] },
    foulType: { type: String, enum: ['personal', 'technical', 'flagrant'] },
    quarter: Number,

    // ---- TENNIS ----
    servingTeam: { type: String, enum: ['home', 'away'] },
    currentSet: Number,
    currentGame: Number,
    isTiebreak: Boolean,
    isAce: Boolean,
    isDoubleFault: Boolean,

    // ---- BADMINTON / TABLE TENNIS ----
    currentGameNumber: Number,
    isServiceFault: Boolean,

    // ---- VOLLEYBALL ----
    setNumber: Number,
    pointType: { type: String, enum: ['attack', 'block', 'ace', 'error', 'tip'] },
  },

  // Edit tracking
  isUndone: { type: Boolean, default: false },
  undoneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  undoneAt: Date,
  editOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // if this replaces another event

  // Offline sync
  clientTimestamp: Date,    // when the event was created on client
  syncedAt: Date,           // when it was synced to server

  // Metadata
  version: { type: Number, default: 1 }, // scoring logic version
}, {
  timestamps: true,
});

// Ensure idempotency
eventSchema.index({ match: 1, idempotencyKey: 1 }, { unique: true });
eventSchema.index({ match: 1, sequence: 1 });
eventSchema.index({ match: 1, type: 1 });
eventSchema.index({ match: 1, isUndone: 1 });

module.exports = mongoose.model('Event', eventSchema);
