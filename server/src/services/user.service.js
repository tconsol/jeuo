const { User } = require('../models');

class UserService {
  static async getProfile(userId) {
    return User.findById(userId)
      .select('-password -devices')
      .populate('playpals', 'name avatar skillLevels')
      .lean();
  }

  static async updateProfile(userId, updates) {
    const allowed = ['name', 'avatar', 'sports', 'skillLevels', 'bio', 'location'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }
    return User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true })
      .select('-password -devices');
  }

  static async searchUsers({ query, sport, page = 1, limit = 20 }) {
    const filter = { isActive: true };
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }
    if (sport) filter.sports = sport;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select('name avatar sports skillLevels stats')
        .skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  static async addPlaypal(userId, playpalId) {
    if (userId.toString() === playpalId.toString()) throw new Error('Cannot add yourself');

    const [user, pal] = await Promise.all([
      User.findById(userId),
      User.findById(playpalId),
    ]);
    if (!pal) throw new Error('User not found');

    if (!user.playpals.includes(playpalId)) {
      user.playpals.push(playpalId);
      await user.save();
    }
    return { success: true };
  }

  static async removePlaypal(userId, playpalId) {
    await User.findByIdAndUpdate(userId, { $pull: { playpals: playpalId } });
    return { success: true };
  }

  static async follow(userId, targetId) {
    if (userId.toString() === targetId.toString()) throw new Error('Cannot follow yourself');

    await Promise.all([
      User.findByIdAndUpdate(userId, { $addToSet: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: userId } }),
    ]);
    return { success: true };
  }

  static async unfollow(userId, targetId) {
    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { followers: userId } }),
    ]);
    return { success: true };
  }

  static async getFollowers(userId, { page = 1, limit = 20 } = {}) {
    const user = await User.findById(userId)
      .populate({ path: 'followers', select: 'name avatar', options: { skip: (page - 1) * limit, limit } });
    return user?.followers || [];
  }

  static async getFollowing(userId, { page = 1, limit = 20 } = {}) {
    const user = await User.findById(userId)
      .populate({ path: 'following', select: 'name avatar', options: { skip: (page - 1) * limit, limit } });
    return user?.following || [];
  }

  static async getStats(userId) {
    const user = await User.findById(userId).select('stats reliabilityScore').lean();
    if (!user) throw new Error('User not found');
    return { stats: user.stats, reliabilityScore: user.reliabilityScore };
  }
}

module.exports = UserService;
