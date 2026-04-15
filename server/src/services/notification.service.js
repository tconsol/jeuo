const { Notification, User } = require('../models');
const { getRedis } = require('../config/redis');
const logger = require('../config/logger');

class NotificationService {
  static async create({ userId, type, title, message, data = {}, channel = 'in_app' }) {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      channel,
    });

    // Push real-time notification
    try {
      const redis = getRedis();
      await redis.publish(`user:${userId}:notifications`, JSON.stringify({
        id: notification._id,
        type,
        title,
        message,
        data,
        createdAt: notification.createdAt,
      }));
    } catch (err) {
      logger.warn({ userId, err: err.message }, 'Failed to publish notification');
    }

    return notification;
  }

  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const filter = { user: userId };
    if (unreadOnly) filter.isRead = false;

    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount, page, pages: Math.ceil(total / limit) };
  }

  static async markRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  static async markAllRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return { success: true };
  }

  static async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({ _id: notificationId, user: userId });
  }

  /**
   * Send push notification via Firebase Cloud Messaging (placeholder for integration).
   */
  static async sendPush(userId, title, body, data = {}) {
    const user = await User.findById(userId).select('devices').lean();
    if (!user?.devices?.length) return;

    const tokens = user.devices
      .filter(d => d.pushToken)
      .map(d => d.pushToken);

    if (tokens.length === 0) return;

    // TODO: Integrate with Firebase Admin SDK
    // const message = { notification: { title, body }, data, tokens };
    // await admin.messaging().sendMulticast(message);

    logger.info({ userId, tokenCount: tokens.length }, 'Push notification queued');
  }
}

module.exports = NotificationService;
