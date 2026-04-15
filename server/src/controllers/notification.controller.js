const NotificationService = require('../services/notification.service');
const { AppError } = require('../middleware/error');

exports.getNotifications = async (req, res, next) => {
  try {
    const result = await NotificationService.getUserNotifications(req.user._id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await NotificationService.markRead(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await NotificationService.markAllRead(req.user._id);
    res.json({ success: true });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await NotificationService.deleteNotification(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
