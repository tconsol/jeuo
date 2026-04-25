const router = require('express').Router();
const ctrl = require('../controllers/tournament.controller');
const { authenticate } = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const { requireSubscription } = require('../middleware/subscription');

router.use(featureGate('tournaments'));

router.get('/', ctrl.search);
router.get('/my', authenticate, ctrl.getMyTournaments);
router.get('/:id', ctrl.getById);
router.get('/:id/fixtures', ctrl.getFixtures);
router.get('/:id/standings', ctrl.getStandings);
router.post('/', authenticate, requireSubscription('create_tournament'), ctrl.create);
router.patch('/:id/status', authenticate, ctrl.updateStatus);
router.post('/:id/register', authenticate, ctrl.registerTeam);
router.post('/:id/fixtures', authenticate, requireSubscription('create_tournament'), ctrl.generateFixtures);

// Team request flow (new)
router.post('/:id/team-request', authenticate, ctrl.requestJoinTournament);
router.post('/:id/team-requests/:requestIndex/approve', authenticate, ctrl.approveTeamRequest);
router.post('/:id/team-requests/:requestIndex/reject', authenticate, ctrl.rejectTeamRequest);
router.get('/:id/team-requests', authenticate, ctrl.getTeamRequests);
router.post('/:id/add-team', authenticate, ctrl.addTeamDirectly);
router.delete('/:id/teams/:teamId', authenticate, ctrl.removeTeam);
router.delete('/:id', authenticate, ctrl.deleteTournament);

module.exports = router;
