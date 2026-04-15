const router = require('express').Router();
const ctrl = require('../controllers/venue.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Owner routes (BEFORE :id to avoid capture)
router.get('/owner/my-venues', authenticate, authorize('owner'), ctrl.getOwnerVenues);
router.get('/owner/stats', authenticate, authorize('owner'), ctrl.getOwnerStats);

router.get('/', ctrl.search);
router.get('/:id', ctrl.getById);
router.get('/:id/slots', ctrl.getAvailableSlots);
router.post('/', authenticate, authorize('owner', 'admin'), ctrl.create);
router.put('/:id', authenticate, authorize('owner', 'admin'), ctrl.update);

module.exports = router;
