const TournamentService = require('../services/tournament.service');
const { AppError } = require('../middleware/error');

exports.create = async (req, res, next) => {
  try {
    const tournament = await TournamentService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getById = async (req, res, next) => {
  try {
    const tournament = await TournamentService.findById(req.params.id);
    if (!tournament) return next(new AppError('Tournament not found', 404));
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.search = async (req, res, next) => {
  try {
    const result = await TournamentService.search(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.registerTeam = async (req, res, next) => {
  try {
    const tournament = await TournamentService.registerTeam(req.params.id, req.body);
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.generateFixtures = async (req, res, next) => {
  try {
    const tournament = await TournamentService.generateFixtures(req.params.id, req.user._id);
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
