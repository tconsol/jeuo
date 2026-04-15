const UserService = require('../services/user.service');
const { AppError } = require('../middleware/error');

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user._id;
    const user = await UserService.getProfile(userId);
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await UserService.updateProfile(req.user._id, req.body);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const result = await UserService.searchUsers(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.addPlaypal = async (req, res, next) => {
  try {
    await UserService.addPlaypal(req.user._id, req.params.id);
    res.json({ success: true, message: 'Playpal added' });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.removePlaypal = async (req, res, next) => {
  try {
    await UserService.removePlaypal(req.user._id, req.params.id);
    res.json({ success: true, message: 'Playpal removed' });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.follow = async (req, res, next) => {
  try {
    await UserService.follow(req.user._id, req.params.id);
    res.json({ success: true, message: 'Followed' });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.unfollow = async (req, res, next) => {
  try {
    await UserService.unfollow(req.user._id, req.params.id);
    res.json({ success: true, message: 'Unfollowed' });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const followers = await UserService.getFollowers(req.params.id || req.user._id, req.query);
    res.json({ success: true, data: { followers } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const following = await UserService.getFollowing(req.params.id || req.user._id, req.query);
    res.json({ success: true, data: { following } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await UserService.getStats(req.params.id || req.user._id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
