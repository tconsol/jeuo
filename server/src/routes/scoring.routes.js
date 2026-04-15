const router = require('express').Router();
const ctrl = require('../controllers/scoring.controller');
const { authenticate } = require('../middleware/auth');

router.get('/:matchId', ctrl.getScore);
router.get('/:matchId/events', ctrl.getEvents);
router.post('/:matchId/events', authenticate, ctrl.recordEvent);
router.post('/:matchId/undo', authenticate, ctrl.undoLastEvent);
router.post('/:matchId/start', authenticate, ctrl.startMatch);
router.post('/:matchId/end', authenticate, ctrl.endMatch);

module.exports = router;
