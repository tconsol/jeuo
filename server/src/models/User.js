const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true },

  name: { type: String, required: true, trim: true },
  avatar: String,
  bio: String,

  role: {
    type: String,
    enum: ['player', 'owner', 'trainer', 'admin'],
    default: 'player',
  },

  // Player profile
  sports: [{
    sport: { type: String, enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'] },
    skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'professional'] },
    position: String,
  }],

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    city: String,
    state: String,
  },

  // Social
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  playpals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Ratings
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },

  // Reliability
  gamesPlayed: { type: Number, default: 0 },
  gamesNoShow: { type: Number, default: 0 },
  reliabilityScore: { type: Number, default: 100 },

  // Preferences
  preferences: {
    notifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
  },

  // Session tracking
  devices: [{
    deviceId: String,
    deviceType: String,
    lastActive: Date,
    refreshToken: { type: String, select: false },
  }],

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.index({ 'location': '2dsphere' });
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateRating = function (newRating) {
  this.totalRatings += 1;
  this.ratingSum += newRating;
  this.rating = this.ratingSum / this.totalRatings;
};

userSchema.virtual('reliabilityPercentage').get(function () {
  if (this.gamesPlayed === 0) return 100;
  return Math.round(((this.gamesPlayed - this.gamesNoShow) / this.gamesPlayed) * 100);
});

module.exports = mongoose.model('User', userSchema);
