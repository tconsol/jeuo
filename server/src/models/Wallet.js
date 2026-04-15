const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR' },

  transactions: [{
    type: {
      type: String,
      enum: ['credit', 'debit', 'cashback', 'refund', 'bonus', 'penalty'],
      required: true,
    },
    amount: { type: Number, required: true },
    description: String,
    reference: String,        // booking ID, payment ID, etc.
    referenceModel: String,   // 'Booking', 'Payment', etc.
    balanceAfter: Number,
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Wallet', walletSchema);
