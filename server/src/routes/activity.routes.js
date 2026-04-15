const router = require('express').Router();
const ctrl = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', ctrl.search);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, ctrl.create);
router.post('/:id/join', authenticate, ctrl.join);
router.post('/:id/approve', authenticate, ctrl.approvePlayer);
router.delete('/:id/players/:playerId', authenticate, ctrl.removePlayer);
router.post('/:id/match', authenticate, ctrl.createMatch);

module.exports = router;
