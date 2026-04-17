const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/:id/read', ctrl.markRead);
router.patch('/:id/read', ctrl.markRead);
router.put('/read-all', ctrl.markAllRead);
router.patch('/read-all', ctrl.markAllRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
