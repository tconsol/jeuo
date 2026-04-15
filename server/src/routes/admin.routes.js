const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/users', ctrl.getUsers);
router.put('/users/:id/toggle-active', ctrl.toggleUserActive);
router.patch('/users/:id/ban', ctrl.banUser);
router.patch('/users/:id/unban', ctrl.unbanUser);
router.get('/venues/pending', ctrl.getPendingVenues);
router.put('/venues/:id/approve', ctrl.approveVenue);
router.put('/venues/:id/reject', ctrl.rejectVenue);
router.get('/audit-logs', ctrl.getAuditLogs);

// Analytics
router.get('/analytics/overview', ctrl.getAnalyticsOverview);
router.get('/analytics/user-growth', ctrl.getUserGrowth);
router.get('/analytics/revenue', ctrl.getRevenueChart);
router.get('/analytics/sports', ctrl.getSportDistribution);

module.exports = router;
