const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },

  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  // Razorpay
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true },
  razorpaySignature: String,

  // Split payments
  splits: [{
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    settled: { type: Boolean, default: false },
  }],

  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'],
    default: 'created',
  },

  // Refund tracking
  refunds: [{
    amount: Number,
    razorpayRefundId: String,
    reason: String,
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    retryCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    processedAt: Date,
  }],

  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

paymentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
