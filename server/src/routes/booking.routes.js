const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');

// Owner routes (before :id)
router.get('/owner', authenticate, authorize('owner', 'admin'), ctrl.getOwnerBookings);
router.get('/owner/revenue', authenticate, authorize('owner', 'admin'), ctrl.getOwnerRevenue);

router.post('/lock', authenticate, requireSubscription('book_venue'), ctrl.lockSlot);
router.post('/confirm', authenticate, requireSubscription('book_venue'), ctrl.confirmBooking);
router.get('/my', authenticate, ctrl.getMyBookings);
router.get('/:id', authenticate, ctrl.getById);
router.post('/:id/cancel', authenticate, ctrl.cancel);

module.exports = router;
