const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    required: true,
    enum: [
      'score_edit', 'score_undo', 'booking_create', 'booking_cancel',
      'venue_approve', 'venue_reject', 'user_ban', 'user_unban',
      'refund_process', 'admin_action', 'payment_capture',
      'tournament_create', 'match_complete', 'dispute_resolve',
    ],
  },
  resource: {
    type: { type: String }, // 'Match', 'Booking', 'User', etc.
    id: mongoose.Schema.Types.ObjectId,
  },
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
}, {
  timestamps: true,
});

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
