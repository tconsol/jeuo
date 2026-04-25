const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const Match = require('../models/Match');

const populate = [
  { path: 'teams.home.players', select: 'name avatar' },
  { path: 'teams.away.players', select: 'name avatar' },
  { path: 'venue', select: 'name location' },
  { path: 'tournament', select: 'name sport' },
  { path: 'activity', select: 'title' },
];

// GET /api/v1/matches/my
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const matches = await Match.find({
      $or: [
        { scorers: userId },
        { 'teams.home.players': userId },
        { 'teams.away.players': userId },
      ],
    })
      .sort({ scheduledAt: -1 })
      .populate(populate)
      .lean();
    res.json({ success: true, data: { matches } });
  } catch (err) { next(err); }
});

// GET /api/v1/matches/live
router.get('/live', async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live' })
      .sort({ startedAt: -1 })
      .populate(populate)
      .lean();
    res.json({ success: true, data: { matches } });
  } catch (err) { next(err); }
});

// GET /api/v1/matches?status=completed&sport=cricket&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const { sport, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (sport) filter.sport = sport;
    if (status) {
      // Allow comma-separated statuses e.g. status=live,paused
      filter.status = status.includes(',') ? { $in: status.split(',') } : status;
    }

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate(populate)
        .lean(),
      Match.countDocuments(filter),
    ]);

    res.json({ success: true, data: { matches, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

// GET /api/v1/matches/:id
router.get('/:id', async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate(populate)
      .lean();

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: { match } });
  } catch (err) { next(err); }
});

module.exports = router;
