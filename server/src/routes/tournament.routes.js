const router = require('express').Router();
const ctrl = require('../controllers/tournament.controller');
const { authenticate } = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const { requireSubscription } = require('../middleware/subscription');

router.use(featureGate('tournaments'));

router.get('/', ctrl.search);
router.get('/:id', ctrl.getById);
router.get('/:id/fixtures', ctrl.getFixtures);
router.get('/:id/standings', ctrl.getStandings);
router.post('/', authenticate, requireSubscription('create_tournament'), ctrl.create);
router.post('/:id/register', authenticate, ctrl.registerTeam);
router.post('/:id/fixtures', authenticate, requireSubscription('create_tournament'), ctrl.generateFixtures);

module.exports = router;
