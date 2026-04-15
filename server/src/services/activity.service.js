const { Activity, Match, User } = require('../models');
const { getQueue } = require('../config/queue');
const logger = require('../config/logger');

class ActivityService {
  static async create(data, creatorId) {
    const activity = new Activity({
      ...data,
      creator: creatorId,
      players: [{ user: creatorId, status: 'approved' }],
      currentPlayers: 1,
    });
    await activity.save();
    logger.info({ activityId: activity._id, creatorId }, 'Activity created');
    return activity;
  }

  static async findById(id) {
    return Activity.findById(id)
      .populate('creator', 'name avatar')
      .populate('venue', 'name location address')
      .populate('players.user', 'name avatar skillLevels');
  }

  static async search({ sport, lat, lng, radius = 10000, date, page = 1, limit = 20 }) {
    const filter = { visibility: 'public', status: { $in: ['upcoming', 'in_progress'] } };
    if (sport) filter.sport = sport;
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: dayStart, $lte: dayEnd };
    }

    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('creator', 'name avatar')
        .populate('venue', 'name location address')
        .skip(skip).limit(limit).sort({ date: 1 }).lean(),
      Activity.countDocuments(filter),
    ]);

    return { activities, total, page, pages: Math.ceil(total / limit) };
  }

  static async joinRequest(activityId, userId) {
    const activity = await Activity.findById(activityId);
    if (!activity) throw new Error('Activity not found');

    const existing = activity.players.find(p => p.user.toString() === userId.toString());
    if (existing) throw new Error('Already in this activity');

    if (activity.currentPlayers >= activity.maxPlayers) {
      // Add to waitlist
      activity.players.push({ user: userId, status: 'waitlisted' });
      await activity.save();
      return { status: 'waitlisted' };
    }

    const status = activity.isPublic ? 'approved' : 'pending';
    activity.players.push({ user: userId, status });
    if (status === 'approved') activity.currentPlayers += 1;
    await activity.save();

    // Notify creator
    const queue = getQueue('notification');
    await queue.add('activity-join', {
      userId: activity.creator,
      type: 'activity',
      title: 'New Join Request',
      message: `A player wants to join your ${activity.sport} game`,
      data: { activityId: activity._id },
    });

    return { status };
  }

  static async approvePlayer(activityId, creatorId, playerId) {
    const activity = await Activity.findOne({ _id: activityId, creator: creatorId });
    if (!activity) throw new Error('Activity not found or not authorized');

    const player = activity.players.find(p => p.user.toString() === playerId);
    if (!player) throw new Error('Player not found in activity');
    if (player.status !== 'pending') throw new Error('Player is not pending approval');

    player.status = 'approved';
    activity.currentPlayers += 1;
    await activity.save();

    const queue = getQueue('notification');
    await queue.add('activity-approved', {
      userId: playerId,
      type: 'activity',
      title: 'Request Approved',
      message: `You've been approved to join the ${activity.sport} game`,
      data: { activityId: activity._id },
    });

    return activity;
  }

  static async removePlayer(activityId, creatorId, playerId) {
    const activity = await Activity.findOne({ _id: activityId, creator: creatorId });
    if (!activity) throw new Error('Activity not found or not authorized');

    const idx = activity.players.findIndex(p => p.user.toString() === playerId);
    if (idx === -1) throw new Error('Player not found');

    const wasApproved = activity.players[idx].status === 'approved';
    activity.players.splice(idx, 1);
    if (wasApproved) activity.currentPlayers -= 1;

    // Promote from waitlist
    const waitlisted = activity.players.find(p => p.status === 'waitlisted');
    if (waitlisted && activity.currentPlayers < activity.maxPlayers) {
      waitlisted.status = 'approved';
      activity.currentPlayers += 1;
    }

    await activity.save();
    return activity;
  }

  static async createMatch(activityId, creatorId) {
    const activity = await Activity.findOne({ _id: activityId, creator: creatorId })
      .populate('players.user', 'name');
    if (!activity) throw new Error('Activity not found or not authorized');

    const approvedPlayers = activity.players.filter(p => p.status === 'approved');

    const match = new Match({
      activity: activity._id,
      sport: activity.sport,
      players: approvedPlayers.map(p => p.user._id),
      scorers: [creatorId],
      status: 'upcoming',
      config: activity.config || {},
    });

    await match.save();
    activity.match = match._id;
    await activity.save();

    return match;
  }
}

module.exports = ActivityService;
