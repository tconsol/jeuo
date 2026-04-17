const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'booking_confirmed', 'booking_cancelled', 'booking_reminder',
      'activity_invite', 'activity_joined', 'activity_full', 'activity_cancelled',
      'match_started', 'match_completed', 'score_update', 'match_reminder',
      'payment_success', 'payment_failed', 'refund_processed',
      'follow_request', 'playpal_request',
      'tournament_invite', 'tournament_update',
      'wallet_credit', 'wallet_debit',
      'team_invite', 'team_invite_accepted', 'team_invite_rejected',
      'team_player_added', 'team_player_removed',
      'dispute_raised', 'dispute_resolved', 'dispute_comment',
      'subscription_upgrade', 'subscription_expired',
      'system', 'chat_message',
    ],
    required: true,
  },
  title: { type: String, required: true },
  body: String,
  data: mongoose.Schema.Types.Mixed, // extra context
  isRead: { type: Boolean, default: false },
  readAt: Date,

  // Delivery channels
  channels: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
  },
  deliveryStatus: {
    push: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    email: { type: String, enum: ['pending', 'sent', 'failed', 'na'], default: 'na' },
    sms: { type: String, enum: ['pending', 'sent', 'failed', 'na'], default: 'na' },
  },
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
