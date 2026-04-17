const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },

  date: { type: Date, required: true },
  slot: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  sport: { type: String, required: true },
  court: { type: Number, default: 1 },

  // Pricing
  basePrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  walletAmountUsed: { type: Number, default: 0 },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partially_refunded', 'failed'],
    default: 'pending',
  },
  paymentId: String,
  razorpayOrderId: String,

  // Status
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'no_show', 'locked'],
    default: 'locked',
  },

  // Recurring
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly'] },
    endDate: Date,
    parentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  },

  // Cancellation
  cancelledAt: Date,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: String,
  refundAmount: { type: Number, default: 0 },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'processed', 'failed'],
    default: 'none',
  },
  refundPercentage: { type: Number, default: 0 },

  // Cancellation policy (auto-calculated)
  cancellationPolicy: {
    // 3+ days before: 100% refund, 2 days: 50%, 1 day: 20%, match day: 0%
    type: { type: String, enum: ['flexible', 'moderate', 'strict'], default: 'moderate' },
    rules: [{
      daysBefore: Number,
      refundPercent: Number,
    }],
  },

  // Lock mechanism for concurrency control
  lockedUntil: Date,
  lockToken: String,

  notes: String,
}, {
  timestamps: true,
});

// Critical: Prevent double booking with compound unique index
bookingSchema.index(
  { venue: 1, date: 1, 'slot.startTime': 1, court: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);
bookingSchema.index({ user: 1, date: 1 });
bookingSchema.index({ venue: 1, status: 1 });
bookingSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
