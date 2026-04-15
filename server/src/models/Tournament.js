const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
  round: Number,
  matchNumber: Number,
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  teamHome: { type: String },
  teamAway: { type: String },
  scheduledAt: Date,
  status: { type: String, enum: ['scheduled', 'completed', 'bye'], default: 'scheduled' },
  winner: String,
});

const pointsTableEntrySchema = new mongoose.Schema({
  teamName: String,
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  netRunRate: { type: Number, default: 0 },   // cricket
  goalDifference: { type: Number, default: 0 }, // football
  setRatio: { type: Number, default: 0 },      // volleyball
});

const tournamentSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'],
  },
  description: String,
  banner: String,
  rules: String,

  // Format
  format: {
    type: String,
    enum: ['single_elimination', 'double_elimination', 'round_robin', 'group_knockout', 'league'],
    default: 'single_elimination',
  },
  maxTeams: { type: Number, required: true },
  playersPerTeam: Number,

  // Match format config
  matchFormat: mongoose.Schema.Types.Mixed,

  // Teams
  teams: [{
    name: String,
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    seed: Number,
    group: String, // for group_knockout format
  }],

  // Fixtures & brackets
  fixtures: [fixtureSchema],
  pointsTable: [pointsTableEntrySchema],

  // Groups (for group_knockout format)
  groups: [{
    name: String,
    teams: [String],
  }],

  // Venue
  venues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }],

  // Schedule
  startDate: { type: Date, required: true },
  endDate: Date,
  registrationDeadline: Date,

  // Entry fee
  entryFee: { type: Number, default: 0 },
  prizePool: { type: Number, default: 0 },

  // Location
  location: {
    city: String,
    state: String,
  },

  status: {
    type: String,
    enum: ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
  },

  isPublic: { type: Boolean, default: true },
}, {
  timestamps: true,
});

tournamentSchema.index({ sport: 1, status: 1 });
tournamentSchema.index({ creator: 1 });
tournamentSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
