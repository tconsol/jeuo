const { User, Venue, Booking, Match, Tournament, AuditLog } = require('../models');
const VenueService = require('../services/venue.service');
const { AppError } = require('../middleware/error');

/* ─── Dashboard Stats ─── */
exports.getDashboard = async (req, res, next) => {
  try {
    const [users, venues, bookings, matches, tournaments] = await Promise.all([
      User.countDocuments(),
      Venue.countDocuments(),
      Booking.countDocuments(),
      Match.countDocuments(),
      Tournament.countDocuments(),
    ]);
    res.json({ success: true, data: { users, venues, bookings, matches, tournaments } });
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
