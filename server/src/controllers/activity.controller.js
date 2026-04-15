const ActivityService = require('../services/activity.service');
const { AppError } = require('../middleware/error');

exports.create = async (req, res, next) => {
  try {
    const activity = await ActivityService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: { activity } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getById = async (req, res, next) => {
  try {
    const activity = await ActivityService.findById(req.params.id);
    if (!activity) return next(new AppError('Activity not found', 404));
    res.json({ success: true, data: { activity } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.search = async (req, res, next) => {
  try {
    const result = await ActivityService.search(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.join = async (req, res, next) => {
  try {
    const result = await ActivityService.joinRequest(req.params.id, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.approvePlayer = async (req, res, next) => {
  try {
    const activity = await ActivityService.approvePlayer(req.params.id, req.user._id, req.body.playerId);
    res.json({ success: true, data: { activity } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.removePlayer = async (req, res, next) => {
  try {
    const activity = await ActivityService.removePlayer(req.params.id, req.user._id, req.params.playerId);
    res.json({ success: true, data: { activity } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.createMatch = async (req, res, next) => {
  try {
    const match = await ActivityService.createMatch(req.params.id, req.user._id);
    res.status(201).json({ success: true, data: { match } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
