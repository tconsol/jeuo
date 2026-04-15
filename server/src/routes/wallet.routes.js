const router = require('express').Router();
const ctrl = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');

router.use(authenticate);
router.use(featureGate('wallet'));

router.get('/balance', ctrl.getBalance);
router.get('/transactions', ctrl.getTransactions);

module.exports = router;
