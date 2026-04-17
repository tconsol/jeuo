const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  againstTeam: { type: String, enum: ['home', 'away'] },
  type: {
    type: String,
    enum: ['score_dispute', 'player_misconduct', 'rule_violation', 'umpire_decision', 'other'],
    required: true,
  },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  evidence: [{ url: String, type: { type: String, enum: ['image', 'video', 'text'] }, description: String }],
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'rejected', 'escalated'],
    default: 'open',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  resolution: {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decision: String,
    action: { type: String, enum: ['no_action', 'score_corrected', 'match_replayed', 'player_banned', 'warning_issued'] },
    resolvedAt: Date,
    notes: String,
  },
  matchFrozen: { type: Boolean, default: false },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

disputeSchema.index({ match: 1, status: 1 });
disputeSchema.index({ raisedBy: 1 });
disputeSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Dispute', disputeSchema);
