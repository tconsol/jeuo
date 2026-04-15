const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

  title: { type: String, required: true, trim: true },
  sport: {
    type: String,
    required: true,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'],
  },

  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: String,
  duration: Number, // minutes

  // Location (can be different from venue)
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: String,
    city: String,
  },

  // Players
  maxPlayers: { type: Number, required: true },
  minPlayers: { type: Number, default: 2 },
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['confirmed', 'pending', 'rejected', 'waitlisted'], default: 'pending' },
    team: { type: String, enum: ['A', 'B', 'none'], default: 'none' },
    joinedAt: { type: Date, default: Date.now },
  }],
  waitlist: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],

  // Settings
  visibility: { type: String, enum: ['public', 'private', 'friends_only'], default: 'public' },
  requireApproval: { type: Boolean, default: false },
  skillLevel: { type: String, enum: ['any', 'beginner', 'intermediate', 'advanced'] , default: 'any' },
  costPerPlayer: { type: Number, default: 0 },
  splitPayment: { type: Boolean, default: false },

  // Match linking
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },

  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
    default: 'upcoming',
  },

  description: String,
  rules: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

activitySchema.index({ location: '2dsphere' });
activitySchema.index({ sport: 1, date: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ creator: 1 });

activitySchema.virtual('currentPlayerCount').get(function () {
  return this.players.filter(p => p.status === 'confirmed').length;
});

activitySchema.virtual('isFull').get(function () {
  return this.currentPlayerCount >= this.maxPlayers;
});

module.exports = mongoose.model('Activity', activitySchema);
