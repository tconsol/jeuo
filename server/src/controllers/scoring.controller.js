const ScoringService = require('../services/scoring');
const { AppError } = require('../middleware/error');

exports.recordEvent = async (req, res, next) => {
  try {
    const result = await ScoringService.recordEvent(req.params.matchId, req.body, req.user._id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.undoLastEvent = async (req, res, next) => {
  try {
    const result = await ScoringService.undoLastEvent(req.params.matchId, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getScore = async (req, res, next) => {
  try {
    const score = await ScoringService.getMatchScore(req.params.matchId);
    res.json({ success: true, data: score });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    const events = await ScoringService.getMatchEvents(req.params.matchId, {
      includeUndone: req.query.includeUndone === 'true',
    });
    res.json({ success: true, data: { events } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.startMatch = async (req, res, next) => {
  try {
    const match = await ScoringService.startMatch(req.params.matchId, req.user._id);
    res.json({ success: true, data: { match } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.endMatch = async (req, res, next) => {
  try {
    const match = await ScoringService.endMatch(req.params.matchId, req.user._id);
    res.json({ success: true, data: { match } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
