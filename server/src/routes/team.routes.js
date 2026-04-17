const router = require('express').Router();
const ctrl = require('../controllers/team.controller');
const { authenticate } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');

// Public
router.get('/search', ctrl.search);
router.get('/search-players', authenticate, ctrl.searchPlayers);
router.get('/:id', ctrl.getById);

// Authenticated
router.get('/', authenticate, ctrl.getMyTeams);
router.post('/', authenticate, requireSubscription('create_team'), ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.post('/:id/players', authenticate, requireSubscription('add_players'), ctrl.addPlayer);
router.post('/:id/accept-invite', authenticate, ctrl.acceptInvite);
router.post('/:id/reject-invite', authenticate, ctrl.rejectInvite);
router.delete('/:id/players/:playerId', authenticate, ctrl.removePlayer);
router.post('/:id/transfer', authenticate, ctrl.transferOwnership);
router.delete('/:id', authenticate, ctrl.delete);

module.exports = router;
