const { User, Venue, Booking, Match, Tournament, AuditLog } = require('../models');
const VenueService = require('../services/venue.service');
const { AppError } = require('../middleware/error');

/* ─── Dashboard Stats ─── */
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalVenues, totalBookings, activeMatches, pendingVenues, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Venue.countDocuments(),
      Booking.countDocuments(),
      Match.countDocuments({ status: 'live' }),
      Venue.countDocuments({ isApproved: false }),
      Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Sport distribution
    const sportDistribution = await Venue.aggregate([
      { $unwind: '$sports' },
      { $group: { _id: '$sports', count: { $sum: 1 } } },
      { $project: { sport: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // User signups last 7 days
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const signupChart = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // Recent activity (last 10 audit logs)
    const recentActivity = await AuditLog.find()
      .populate('actor', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const formattedActivity = recentActivity.map(a => ({
      description: `${a.actor?.name || 'System'}   ${a.action}`,
      createdAt: a.createdAt,
    }));

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalVenues, activeMatches, totalBookings, pendingVenues, totalRevenue },
        sportDistribution,
        signupChart,
        recentActivity: formattedActivity,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/* ─── User Management ─── */
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      const s = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password -devices').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: { users, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'admin_action',
      entity: { type: 'User', id: user._id },
      changes: { after: { isActive: user.isActive } },
    });

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/* ─── Venue Management ─── */
exports.getPendingVenues = async (req, res, next) => {
  try {
    const venues = await Venue.find({ isApproved: false })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: { venues } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

exports.approveVenue = async (req, res, next) => {
  try {
    const venue = await VenueService.approve(req.params.id);
    if (!venue) return next(new AppError('Venue not found', 404));

    await AuditLog.create({
      actor: req.user._id,
      action: 'venue_approval',
      entity: { type: 'Venue', id: venue._id },
      changes: { after: { isApproved: true } },
    });

    res.json({ success: true, data: { venue } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

exports.rejectVenue = async (req, res, next) => {
  try {
    const venue = await VenueService.deactivate(req.params.id);
    if (!venue) return next(new AppError('Venue not found', 404));
    res.json({ success: true, data: { venue } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/* ─── Audit Log ─── */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email')
        .skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, data: { logs, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/* ─── Ban / Unban ─── */
exports.banUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    user.isBanned = true;
    user.isActive = false;
    user.banReason = req.body.reason || 'Banned by admin';
    await user.save();
    await AuditLog.create({ actor: req.user._id, action: 'user_ban', resource: { type: 'User', id: user._id }, details: { reason: user.banReason } });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    user.isBanned = false;
    user.isActive = true;
    user.banReason = undefined;
    await user.save();
    await AuditLog.create({ actor: req.user._id, action: 'user_unban', resource: { type: 'User', id: user._id } });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/* ─── Analytics ─── */
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const [totalUsers, totalVenues, totalBookings, totalRevenue] = await Promise.all([
      User.countDocuments(),
      Venue.countDocuments({ isApproved: true }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    ]);
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });
    res.json({ success: true, data: {
      totalUsers, totalVenues, totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      userGrowth: `+${newUsersThisMonth}`,
    }});
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

exports.getUserGrowth = async (req, res, next) => {
  try {
    const days = req.query.range === '7d' ? 7 : req.query.range === '90d' ? 90 : 30;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, users: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', users: 1, _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    const days = req.query.range === '7d' ? 7 : req.query.range === '90d' ? 90 : 30;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const data = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, _id: 0 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

exports.getSportDistribution = async (req, res, next) => {
  try {
    const data = await Booking.aggregate([
      { $group: { _id: '$sport', count: { $sum: 1 } } },
      { $project: { sport: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};
