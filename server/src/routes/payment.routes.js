const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

router.post('/booking/:bookingId/order', authenticate, ctrl.createBookingOrder);
router.post('/verify', authenticate, ctrl.verifyPayment);
router.post('/webhook', ctrl.webhook); // No auth — Razorpay calls this

module.exports = router;
