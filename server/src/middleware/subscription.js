/**
 * Subscription-based permission middleware.
 * 
 * Tiers:
 * - free:    Read-only venues, join games by paying, view live scores, see own matches
 * - pro:     + Book venues, create activities, manage teams, start scoring, cancel bookings
 * - premium: + Create tournaments, send team invites for tournaments
 */

const PERMISSIONS = {
  free: [
    'view_venues',
    'view_activities',
    'join_activity',
    'view_live_scores',
    'view_matches',
    'view_tournaments',
    'view_profile',
    'edit_profile',
    'view_notifications',
  ],
  pro: [
    // All free permissions +
    'book_venue',
    'cancel_booking',
    'create_activity',
    'manage_activity',
    'create_team',
    'manage_team',
    'add_players',
    'start_scoring',
    'manage_scoring',
    'add_scorer',
    'view_team_stats',
  ],
  premium: [
    // All pro permissions +
    'create_tournament',
    'manage_tournament',
    'send_tournament_invite',
    'join_tournament',
  ],
};

/**
 * Get all permissions for a subscription tier.
 */
function getPermissions(plan) {
  const perms = new Set(PERMISSIONS.free);
  if (plan === 'pro' || plan === 'premium') {
    PERMISSIONS.pro.forEach(p => perms.add(p));
  }
  if (plan === 'premium') {
    PERMISSIONS.premium.forEach(p => perms.add(p));
  }
  return perms;
}

/**
 * Middleware to check if user has required subscription permission.
 * Usage: requireSubscription('create_activity')
 */
const requireSubscription = (...requiredPerms) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Admins bypass subscription checks
    if (req.user.role === 'admin') return next();

    const plan = req.user.subscription?.plan || 'free';
    const isActive = plan === 'free' || req.user.subscription?.isActive;

    // If subscription expired, treat as free
    const effectivePlan = isActive ? plan : 'free';
    const userPerms = getPermissions(effectivePlan);

    const missing = requiredPerms.filter(p => !userPerms.has(p));
    if (missing.length > 0) {
      const planNeeded = PERMISSIONS.premium.some(p => missing.includes(p)) ? 'Premium' :
                         PERMISSIONS.pro.some(p => missing.includes(p)) ? 'Pro' : 'Free';
      return res.status(403).json({
        success: false,
        message: `This feature requires a ${planNeeded} subscription`,
        requiredPlan: planNeeded.toLowerCase(),
        missingPermissions: missing,
      });
    }

    next();
  };
};

/**
 * Calculate cancellation refund percentage based on booking date.
 * Policy: 3+ days = 100%, 2 days = 50%, 1 day = 20%, same day = 0%
 */
function calculateRefundPercentage(bookingDate) {
  const now = new Date();
  const booking = new Date(bookingDate);
  const diffTime = booking.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 3) return 100;
  if (diffDays >= 2) return 50;
  if (diffDays >= 1) return 20;
  return 0;
}

module.exports = { requireSubscription, getPermissions, calculateRefundPercentage, PERMISSIONS };
