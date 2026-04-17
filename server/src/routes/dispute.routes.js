const router = require('express').Router();
const ctrl = require('../controllers/dispute.controller');
const { authenticate, authorize } = require('../middleware/auth');

// User routes
router.get('/my', authenticate, ctrl.getMyDisputes);
router.get('/match/:matchId', authenticate, ctrl.getByMatch);
router.post('/match/:matchId', authenticate, ctrl.create);
router.get('/:id', authenticate, ctrl.getById);
router.post('/:id/comment', authenticate, ctrl.addComment);

// Admin routes
router.get('/', authenticate, authorize('admin'), ctrl.getAll);
router.post('/:id/resolve', authenticate, authorize('admin'), ctrl.resolve);
router.post('/:id/reject', authenticate, authorize('admin'), ctrl.reject);

module.exports = router;
