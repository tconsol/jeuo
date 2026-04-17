const TeamService = require('../services/team.service');
const { AppError } = require('../middleware/error');

exports.create = async (req, res, next) => {
  try {
    const team = await TeamService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getById = async (req, res, next) => {
  try {
    const team = await TeamService.findById(req.params.id);
    if (!team) return next(new AppError('Team not found', 404));
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getMyTeams = async (req, res, next) => {
  try {
    const teams = await TeamService.findByUser(req.user._id);
    res.json({ success: true, data: { teams } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.search = async (req, res, next) => {
  try {
    const result = await TeamService.search(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.addPlayer = async (req, res, next) => {
  try {
    const team = await TeamService.addPlayer(req.params.id, req.user._id, req.body);
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.removePlayer = async (req, res, next) => {
  try {
    const team = await TeamService.removePlayer(req.params.id, req.user._id, req.params.playerId);
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.searchPlayers = async (req, res, next) => {
  try {
    const players = await TeamService.searchPlayers(req.query);
    res.json({ success: true, data: { players } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.update = async (req, res, next) => {
  try {
    const team = await TeamService.update(req.params.id, req.user._id, req.body);
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.transferOwnership = async (req, res, next) => {
  try {
    const team = await TeamService.transferOwnership(req.params.id, req.user._id, req.body.newOwnerId);
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.delete = async (req, res, next) => {
  try {
    await TeamService.delete(req.params.id, req.user._id);
    res.json({ success: true, message: 'Team deleted' });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.acceptInvite = async (req, res, next) => {
  try {
    const team = await TeamService.acceptInvite(req.params.id, req.user._id);
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.rejectInvite = async (req, res, next) => {
  try {
    const team = await TeamService.rejectInvite(req.params.id, req.user._id);
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
