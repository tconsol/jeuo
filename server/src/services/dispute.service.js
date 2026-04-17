const Dispute = require('../models/Dispute');
const Match = require('../models/Match');
const NotificationService = require('./notification.service');

class DisputeService {
  static async create(matchId, userId, data) {
    const match = await Match.findById(matchId);
    if (!match) throw Object.assign(new Error('Match not found'), { status: 404 });

    const dispute = await Dispute.create({
      match: matchId,
      raisedBy: userId,
      type: data.type,
      title: data.title,
      description: data.description,
      againstTeam: data.againstTeam,
      evidence: data.evidence || [],
      priority: data.priority || 'medium',
    });

    // Freeze match scoring if critical
    if (data.priority === 'critical' || data.priority === 'high') {
      dispute.matchFrozen = true;
      await dispute.save();
      await Match.updateOne({ _id: matchId }, { $set: { status: 'paused' } });
    }

    // Notify scorers and captains
    const notifyUsers = [...(match.scorers || [])];
    if (match.teams?.home?.captain) notifyUsers.push(match.teams.home.captain);
    if (match.teams?.away?.captain) notifyUsers.push(match.teams.away.captain);
    for (const uid of [...new Set(notifyUsers.map(String))]) {
      if (uid !== String(userId)) {
        await NotificationService.create({
          user: uid,
          type: 'dispute_raised',
          title: 'Dispute Raised',
          body: `A ${data.type.replace('_', ' ')} dispute has been raised for your match.`,
          data: { disputeId: dispute._id, matchId },
        });
      }
    }

    return dispute;
  }

  static async getByMatch(matchId) {
    return Dispute.find({ match: matchId })
      .populate('raisedBy', 'name email avatar')
      .populate('resolution.resolvedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  static async getById(id) {
    return Dispute.findById(id)
      .populate('raisedBy', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .populate('resolution.resolvedBy', 'name email');
  }

  static async getUserDisputes(userId, query = {}) {
    const filter = { raisedBy: userId };
    if (query.status) filter.status = query.status;
    return Dispute.find(filter)
      .populate('match', 'sport teams status')
      .sort({ createdAt: -1 })
      .limit(query.limit || 20);
  }

  static async addComment(disputeId, userId, text) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw Object.assign(new Error('Dispute not found'), { status: 404 });
    dispute.comments.push({ user: userId, text });
    return dispute.save();
  }

  static async resolve(disputeId, adminId, data) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw Object.assign(new Error('Dispute not found'), { status: 404 });

    dispute.status = 'resolved';
    dispute.resolution = {
      resolvedBy: adminId,
      decision: data.decision,
      action: data.action || 'no_action',
      resolvedAt: new Date(),
      notes: data.notes,
    };

    // Unfreeze match if was frozen
    if (dispute.matchFrozen) {
      dispute.matchFrozen = false;
      const match = await Match.findById(dispute.match);
      if (match && match.status === 'paused') {
        await Match.updateOne({ _id: dispute.match }, { $set: { status: 'live' } });
      }
    }

    await dispute.save();

    // Notify the raiser
    await NotificationService.create({
      user: dispute.raisedBy,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      body: `Your dispute has been resolved: ${data.decision}`,
      data: { disputeId: dispute._id },
    });

    return dispute;
  }

  static async reject(disputeId, adminId, reason) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw Object.assign(new Error('Dispute not found'), { status: 404 });

    dispute.status = 'rejected';
    dispute.resolution = {
      resolvedBy: adminId,
      decision: reason,
      action: 'no_action',
      resolvedAt: new Date(),
    };

    if (dispute.matchFrozen) {
      dispute.matchFrozen = false;
      await Match.updateOne({ _id: dispute.match }, { $set: { status: 'live' } });
    }

    await dispute.save();
    return dispute;
  }

  static async getAll(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    return Dispute.find(filter)
      .populate('raisedBy', 'name email')
      .populate('match', 'sport teams status')
      .sort({ createdAt: -1 })
      .skip(query.skip || 0)
      .limit(query.limit || 20);
  }
}

module.exports = DisputeService;
