const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "06:00"
  endTime: { type: String, required: true },   // "07:00"
  price: { type: Number, required: true },
  sport: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
});

const venueSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: String,
  images: [String],

  // Location with geospatial index
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    pincode: String,
  },

  // Sports & facilities
  sports: [{
    type: String,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'],
  }],
  amenities: [String], // parking, changing_room, water, washroom, floodlights, etc.
  surfaceType: String,  // grass, turf, clay, concrete, wood
  isIndoor: { type: Boolean, default: false },

  // Capacity
  maxPlayers: Number,
  courtCount: { type: Number, default: 1 },

  // Timing
  openTime: String,  // "06:00"
  closeTime: String, // "23:00"
  offDays: [Number], // 0=Sunday, 1=Monday, etc.

  // Pricing
  slots: [slotSchema],
  weekendPriceMultiplier: { type: Number, default: 1.2 },
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'moderate',
  },
  cancellationHours: { type: Number, default: 24 },

  // Ratings
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },

  // Status
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  // Contact
  contactPhone: String,
  contactEmail: String,
  website: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

venueSchema.index({ location: '2dsphere' });
venueSchema.index({ sports: 1 });
venueSchema.index({ 'location.city': 1 });
venueSchema.index({ isApproved: 1, isActive: 1 });
venueSchema.index({ rating: -1 });

venueSchema.methods.updateRating = function (newRating) {
  this.totalRatings += 1;
  this.ratingSum += newRating;
  this.rating = this.ratingSum / this.totalRatings;
};

module.exports = mongoose.model('Venue', venueSchema);
