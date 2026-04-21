const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/scoring.controller');
const { authenticate } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');

// Rate limiting for scoring events — max 30 events per minute per user
const scoringLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => `scoring_${req.user?._id || req.ip}`,
  message: { success: false, message: 'Too many scoring events. Please slow down.' },
});

router.get('/:matchId', ctrl.getScore);
router.get('/:matchId/events', ctrl.getEvents);
router.get('/:matchId/commentary', ctrl.getCommentary);
router.post('/:matchId/events', authenticate, requireSubscription('manage_scoring'), scoringLimiter, ctrl.recordEvent);
router.post('/:matchId/undo', authenticate, requireSubscription('manage_scoring'), scoringLimiter, ctrl.undoLastEvent);
router.post('/:matchId/start', authenticate, requireSubscription('manage_scoring'), ctrl.startMatch);
router.post('/:matchId/end', authenticate, requireSubscription('manage_scoring'), ctrl.endMatch);
router.post('/:matchId/toss', authenticate, requireSubscription('manage_scoring'), ctrl.recordToss);
router.post('/:matchId/toss-decision', authenticate, requireSubscription('manage_scoring'), ctrl.setTossDecision);
router.post('/:matchId/players', authenticate, requireSubscription('manage_scoring'), ctrl.setMatchPlayers);
router.post('/:matchId/scorer', authenticate, requireSubscription('manage_scoring'), ctrl.addScorer);
router.delete('/:matchId/scorer/:scorerId', authenticate, requireSubscription('manage_scoring'), ctrl.removeScorer);
router.put('/:matchId/live-link', authenticate, requireSubscription('manage_scoring'), ctrl.setLiveLink);
router.post('/:matchId/substitute', authenticate, requireSubscription('manage_scoring'), ctrl.substitutePlayer);
router.post('/:matchId/confirm-result', authenticate, ctrl.confirmResult);
router.post('/:matchId/rematch', authenticate, requireSubscription('manage_scoring'), ctrl.rematch);

module.exports = router;
