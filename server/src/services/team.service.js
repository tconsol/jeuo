const { Team, User } = require('../models');
const NotificationService = require('./notification.service');
const logger = require('../config/logger');

class TeamService {
  static async create(data, ownerId) {
    const team = new Team({
      ...data,
      owner: ownerId,
      captain: ownerId,
      players: [{ user: ownerId, role: 'player', status: 'active' }],
    });
    await team.save();
    logger.info({ teamId: team._id, ownerId }, 'Team created');
    return team;
  }

  static async findById(id) {
    return Team.findById(id)
      .populate('owner', 'name avatar')
      .populate('captain', 'name avatar')
      .populate('players.user', 'name avatar email phone sports');
  }

  static async findByUser(userId) {
    return Team.find({
      $or: [
        { owner: userId },
        { 'players.user': userId, 'players.status': 'active' },
      ],
    })
      .populate('owner', 'name avatar')
      .populate('players.user', 'name avatar')
      .sort({ updatedAt: -1 })
      .lean();
  }

  static async search({ query, sport, page = 1, limit = 20 }) {
    const filter = { isPublic: true };
    if (sport) filter.sport = sport;
    if (query) filter.$text = { $search: query };

    const skip = (page - 1) * limit;
    const [teams, total] = await Promise.all([
      Team.find(filter)
        .populate('owner', 'name avatar')
        .skip(skip).limit(limit).sort({ 'stats.winPercentage': -1 }).lean(),
      Team.countDocuments(filter),
    ]);

    return { teams, total, page, pages: Math.ceil(total / limit) };
  }

  static async addPlayer(teamId, ownerId, playerData) {
    const team = await Team.findOne({ _id: teamId, owner: ownerId });
    if (!team) throw new Error('Team not found or not authorized');

    const existing = team.players.find(p => p.user.toString() === playerData.userId);
    if (existing) {
      if (existing.status === 'removed') {
        existing.status = 'invited';
        existing.joinedAt = new Date();
        await team.save();
      } else {
        throw new Error('Player already in team');
      }
    } else {
      team.players.push({
        user: playerData.userId,
        role: playerData.role || 'player',
        jerseyNumber: playerData.jerseyNumber,
        status: 'invited',
      });
      await team.save();
    }

    // Send invite notification
    await NotificationService.create({
      user: playerData.userId,
      type: 'team_invite',
      title: 'Team Invite',
      body: `You have been invited to join ${team.name}.`,
      data: { teamId: team._id, teamName: team.name },
    });

    return team;
  }

  static async acceptInvite(teamId, userId) {
    const team = await Team.findById(teamId);
    if (!team) throw new Error('Team not found');

    const player = team.players.find(p => p.user.toString() === userId.toString() && p.status === 'invited');
    if (!player) throw new Error('No pending invite found');

    player.status = 'active';
    player.joinedAt = new Date();
    await team.save();

    // Notify team owner
    await NotificationService.create({
      user: team.owner,
      type: 'team_invite_accepted',
      title: 'Invite Accepted',
      body: `A player has accepted your invite to join ${team.name}.`,
      data: { teamId: team._id, userId },
    });

    return team;
  }

  static async rejectInvite(teamId, userId) {
    const team = await Team.findById(teamId);
    if (!team) throw new Error('Team not found');

    const player = team.players.find(p => p.user.toString() === userId.toString() && p.status === 'invited');
    if (!player) throw new Error('No pending invite found');

    player.status = 'removed';
    await team.save();

    // Notify team owner
    await NotificationService.create({
      user: team.owner,
      type: 'team_invite_rejected',
      title: 'Invite Rejected',
      body: `A player has declined your invite to ${team.name}.`,
      data: { teamId: team._id, userId },
    });

    return team;
  }

  static async removePlayer(teamId, ownerId, playerId) {
    const team = await Team.findOne({ _id: teamId, owner: ownerId });
    if (!team) throw new Error('Team not found or not authorized');
    if (playerId === ownerId.toString()) throw new Error('Cannot remove team owner');

    const player = team.players.find(p => p.user.toString() === playerId);
    if (!player) throw new Error('Player not found');
    player.status = 'removed';
    await team.save();
    return team;
  }

  static async searchPlayers({ query, sport }) {
    const filter = { isActive: true };
    if (query) {
      filter.$or = [
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ];
    }
    return User.find(filter)
      .select('name avatar email phone sports location rating')
      .limit(20)
      .lean();
  }

  static async update(teamId, ownerId, data) {
    const team = await Team.findOneAndUpdate(
      { _id: teamId, owner: ownerId },
      { $set: data },
      { new: true }
    );
    if (!team) throw new Error('Team not found or not authorized');
    return team;
  }

  static async transferOwnership(teamId, currentOwnerId, newOwnerId) {
    const team = await Team.findOne({ _id: teamId, owner: currentOwnerId });
    if (!team) throw new Error('Team not found or not authorized');

    const newOwnerInTeam = team.players.find(p => p.user.toString() === newOwnerId);
    if (!newOwnerInTeam) throw new Error('New owner must be a team member');

    team.owner = newOwnerId;
    team.captain = newOwnerId;
    await team.save();
    return team;
  }

  static async getStats(teamId) {
    const team = await Team.findById(teamId).lean();
    if (!team) throw new Error('Team not found');
    return team.stats;
  }

  static async delete(teamId, ownerId) {
    const team = await Team.findOneAndDelete({ _id: teamId, owner: ownerId });
    if (!team) throw new Error('Team not found or not authorized');
    return team;
  }
}

module.exports = TeamService;
