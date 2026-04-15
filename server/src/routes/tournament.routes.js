const router = require('express').Router();
const ctrl = require('../controllers/tournament.controller');
const { authenticate } = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');

router.use(featureGate('tournaments'));

router.get('/', ctrl.search);
router.get('/:id', ctrl.getById);
router.get('/:id/fixtures', ctrl.getFixtures);
router.get('/:id/standings', ctrl.getStandings);
router.post('/', authenticate, ctrl.create);
router.post('/:id/register', authenticate, ctrl.registerTeam);
router.post('/:id/fixtures', authenticate, ctrl.generateFixtures);

module.exports = router;
