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
    const result = await ScoringService.getMatchScore(req.params.matchId);
    res.json({ success: true, data: result });
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

exports.recordToss = async (req, res, next) => {
  try {
    const result = await ScoringService.recordToss(req.params.matchId, req.body, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.setTossDecision = async (req, res, next) => {
  try {
    const result = await ScoringService.setTossDecision(req.params.matchId, req.body.decision, req.user._id);
    res.json({ success: true, data: { toss: result } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.setMatchPlayers = async (req, res, next) => {
  try {
    const result = await ScoringService.setMatchPlayers(req.params.matchId, req.body, req.user._id);
    res.json({ success: true, data: { score: result } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.addScorer = async (req, res, next) => {
  try {
    const result = await ScoringService.addScorer(req.params.matchId, req.body.userId, req.user._id);
    res.json({ success: true, data: { match: result } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getCommentary = async (req, res, next) => {
  try {
    const Match = require('../models/Match');
    const match = await Match.findById(req.params.matchId).select('commentary').lean();
    if (!match) throw new Error('Match not found');
    res.json({ success: true, data: { commentary: match.commentary || [] } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.substitutePlayer = async (req, res, next) => {
  try {
    const result = await ScoringService.substitutePlayer(req.params.matchId, req.body, req.user._id);
    res.json({ success: true, data: { match: result } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.confirmResult = async (req, res, next) => {
  try {
    const result = await ScoringService.confirmResult(req.params.matchId, req.user._id);
    res.json({ success: true, data: { match: result } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.rematch = async (req, res, next) => {
  try {
    const result = await ScoringService.rematch(req.params.matchId, req.user._id);
    res.status(201).json({ success: true, data: { match: result } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
