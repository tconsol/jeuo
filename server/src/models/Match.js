const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },

  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'],
  },

  // Match format configuration
  format: {
    // Cricket
    overs: Number,          // T20=20, ODI=50, Test=unlimited
    innings: Number,        // 1 or 2

    // Football
    halfDuration: Number,   // minutes per half (45)
    extraTime: Boolean,
    penalties: Boolean,

    // Basketball
    quarterDuration: Number, // minutes (12 NBA, 10 FIBA)
    quarters: Number,        // typically 4

    // Tennis
    sets: Number,            // best of 3 or 5
    tiebreakAt: Number,      // 6 (standard) or 12 (Wimbledon final set pre-2019)
    superTiebreak: Boolean,  // 10-point tiebreak in final set
    noAd: Boolean,           // no-advantage scoring

    // Badminton / Table Tennis
    pointsToWin: Number,     // 21 for badminton, 11 for table tennis
    bestOf: Number,          // games/sets

    // Volleyball
    setsToWin: Number,       // 3 (out of 5)
    pointsPerSet: Number,    // 25 (15 for final set)
  },

  teams: {
    home: {
      name: { type: String, default: 'Team A' },
      players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    away: {
      name: { type: String, default: 'Team B' },
      players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },

  scorers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Toss
  toss: {
    wonBy: { type: String, enum: ['home', 'away'] },
    decision: String, // bat, bowl, serve, kick-off side
  },

  // Computed score snapshot (derived from events for quick reads)
  scoreSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Match state (derived from events)
  state: { type: mongoose.Schema.Types.Mixed, default: {} },

  status: {
    type: String,
    enum: ['scheduled', 'live', 'paused', 'completed', 'abandoned', 'cancelled'],
    default: 'scheduled',
  },

  // Scoring version for versioned logic
  scoringVersion: { type: Number, default: 1 },

  result: {
    winner: { type: String, enum: ['home', 'away', 'draw', 'tie', 'abandoned', null] },
    summary: String, // "Team A won by 5 wickets"
    margin: String,
    playerOfMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  startedAt: Date,
  completedAt: Date,
  scheduledAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

matchSchema.index({ sport: 1, status: 1 });
matchSchema.index({ tournament: 1 });
matchSchema.index({ activity: 1 });

module.exports = mongoose.model('Match', matchSchema);
