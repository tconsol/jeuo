const TournamentService = require('../services/tournament.service');
const { AppError } = require('../middleware/error');

exports.updateStatus = async (req, res, next) => {
  try {
    const tournament = await TournamentService.updateStatus(req.params.id, req.body.status, req.user._id);
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

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

exports.getFixtures = async (req, res, next) => {
  try {
    const Match = require('../models/Match');
    const fixtures = await Match.find({ tournament: req.params.id })
      .populate('teams.home.players teams.away.players', 'name avatar')
      .sort({ date: 1 })
      .lean();
    res.json({ success: true, data: { fixtures } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getStandings = async (req, res, next) => {
  try {
    const tournament = await TournamentService.findById(req.params.id);
    if (!tournament) return next(new AppError('Tournament not found', 404));
    // Build standings from teams array
    const standings = (tournament.teams || []).map(team => ({
      name: team.name,
      played: team.played || 0,
      won: team.won || 0,
      lost: team.lost || 0,
      drawn: team.drawn || 0,
      points: team.points || 0,
    })).sort((a, b) => b.points - a.points);
    res.json({ success: true, data: { standings } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

// Team request endpoints
exports.requestJoinTournament = async (req, res, next) => {
  try {
    const tournament = await TournamentService.requestJoinTournament(
      req.params.id,
      req.body,
      req.user._id
    );
    res.status(201).json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.approveTeamRequest = async (req, res, next) => {
  try {
    const tournament = await TournamentService.approveTeamRequest(
      req.params.id,
      parseInt(req.params.requestIndex),
      req.user._id
    );
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.rejectTeamRequest = async (req, res, next) => {
  try {
    const tournament = await TournamentService.rejectTeamRequest(
      req.params.id,
      parseInt(req.params.requestIndex),
      req.user._id,
      req.body.reason
    );
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getMyTournaments = async (req, res, next) => {
  try {
    const tournaments = await TournamentService.findByCreator(req.user._id);
    res.json({ success: true, data: { tournaments } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.addTeamDirectly = async (req, res, next) => {
  try {
    const tournament = await TournamentService.addTeamDirectly(req.params.id, req.body.teamId, req.user._id);
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.removeTeam = async (req, res, next) => {
  try {
    const tournament = await TournamentService.removeTeamFromTournament(req.params.id, req.params.teamId, req.user._id);
    res.json({ success: true, data: { tournament } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.deleteTournament = async (req, res, next) => {
  try {
    await TournamentService.deleteTournament(req.params.id, req.user._id);
    res.json({ success: true, data: { message: 'Tournament deleted' } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getTeamRequests = async (req, res, next) => {
  try {
    const tournament = await TournamentService.findById(req.params.id);
    if (!tournament) return next(new AppError('Tournament not found', 404));

    // Only creator can see requests
    if (tournament.creator.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    res.json({ success: true, data: { teamRequests: tournament.teamRequests || [] } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
