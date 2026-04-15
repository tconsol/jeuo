const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

router.get('/search', authenticate, ctrl.searchUsers);
router.get('/profile/:id?', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);
router.post('/playpals/:id', authenticate, ctrl.addPlaypal);
router.delete('/playpals/:id', authenticate, ctrl.removePlaypal);
router.post('/follow/:id', authenticate, ctrl.follow);
router.delete('/follow/:id', authenticate, ctrl.unfollow);
router.get('/:id/followers', authenticate, ctrl.getFollowers);
router.get('/:id/following', authenticate, ctrl.getFollowing);
router.get('/:id/stats', authenticate, ctrl.getStats);

module.exports = router;
