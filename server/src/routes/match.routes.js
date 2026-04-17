const router = require('express').Router();
const { auth, authenticate } = require('../middleware/auth');
const Match = require('../models/Match');

// GET /api/v1/matches/my - matches where logged-in user is a scorer or player
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const matches = await Match.find({
      status: { $in: ['scheduled', 'live', 'paused'] },
      $or: [
        { scorers: userId },
        { 'teams.home.players': userId },
        { 'teams.away.players': userId },
      ],
    })
      .sort({ scheduledAt: 1 })
      .populate('venue', 'name location')
      .lean();
    res.json({ success: true, data: { matches } });
  } catch (err) { next(err); }
});

// GET /api/v1/matches/live - all live matches
router.get('/live', async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live' })
      .sort({ startedAt: -1 })
      .populate('teams.home.players', 'name')
      .populate('teams.away.players', 'name')
      .populate('venue', 'name location')
      .lean();
    res.json({ matches });
  } catch (err) { next(err); }
});

// GET /api/v1/matches - list matches (public)
router.get('/', async (req, res, next) => {
  try {
    const { sport, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (sport) filter.sport = sport;
    if (status) filter.status = status;

    const matches = await Match.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('teams.home.players', 'name')
      .populate('teams.away.players', 'name')
      .lean();

    const total = await Match.countDocuments(filter);
    res.json({ matches, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/v1/matches/:id
router.get('/:id', async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teams.home.players', 'name phone')
      .populate('teams.away.players', 'name phone')
      .populate('venue', 'name address')
      .populate('activity', 'title')
      .lean();

    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json({ match });
  } catch (err) { next(err); }
});

module.exports = router;
