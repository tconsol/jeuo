const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendOtpSchema, verifyOtpSchema, googleAuthSchema } = require('../validators/auth.validator');

router.post('/send-otp', validate(sendOtpSchema), ctrl.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), ctrl.verifyOtp);
router.post('/login', ctrl.emailLogin);
router.post('/google', validate(googleAuthSchema), ctrl.googleAuth);
router.post('/refresh', ctrl.refreshToken);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
