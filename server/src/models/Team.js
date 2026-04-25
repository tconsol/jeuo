const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  shortName: { type: String, trim: true, maxlength: 5 },
  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'],
  },

  // Ownership
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  viceCaptain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Members
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper', 'goalkeeper', 'defender', 'midfielder', 'forward', 'setter', 'libero', 'player'], default: 'player' },
    jerseyNumber: Number,
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'invited', 'removed'], default: 'active' },
  }],

  // Stats (aggregated from matches)
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winPercentage: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },     // cricket
    totalGoals: { type: Number, default: 0 },     // football
    totalPoints: { type: Number, default: 0 },    // basketball/volleyball
    recentForm: [{ type: String, enum: ['W', 'L', 'D'] }], // last 5 results
  },

  // Appearance
  logo: String,
  color: { type: String, default: '#6366f1' },

  // Visibility
  isPublic: { type: Boolean, default: true },

  // Location
  location: {
    city: String,
    state: String,
  },

  description: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

teamSchema.index({ owner: 1 });
teamSchema.index({ sport: 1 });
teamSchema.index({ name: 'text' });
teamSchema.index({ 'players.user': 1 });

teamSchema.virtual('activePlayerCount').get(function () {
  return this.players.filter(p => p.status === 'active').length;
});

module.exports = mongoose.model('Team', teamSchema);
