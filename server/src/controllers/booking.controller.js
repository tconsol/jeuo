const BookingService = require('../services/booking.service');
const { AppError } = require('../middleware/error');

exports.lockSlot = async (req, res, next) => {
  try {
    const { venueId, date, slot, court } = req.body;
    const lock = await BookingService.lockSlot(req.user._id, venueId, date, slot, court);
    res.json({ success: true, data: lock });
  } catch (err) {
    next(new AppError(err.message, err.statusCode || 409));
  }
};

exports.confirmBooking = async (req, res, next) => {
  try {
    const { bookingId, lockToken, paymentId } = req.body;
    const booking = await BookingService.confirmBooking(bookingId, lockToken, paymentId);
    res.status(201).json({ success: true, data: { booking } });
  } catch (err) {
    next(new AppError(err.message, err.statusCode || 400));
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('venue', 'name location sports images')
        .sort({ date: -1 })
        .skip(skip).limit(limit).lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, data: { bookings, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { Booking } = require('../models');
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
      .populate('venue', 'name location sports images courts');
    if (!booking) return next(new AppError('Booking not found', 404));
    res.json({ success: true, data: { booking } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const result = await BookingService.cancelBooking(req.params.id, req.user._id, req.body.reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getOwnerBookings = async (req, res, next) => {
  try {
    const Venue = require('../models/Venue');
    const { Booking } = require('../models');
    const venues = await Venue.find({ owner: req.user._id }).select('_id').lean();
    const venueIds = venues.map(v => v._id);

    const filter = { venue: { $in: venueIds } };
    if (req.query.status) filter.status = req.query.status;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('venue', 'name location')
        .populate('user', 'name email phone')
        .sort({ date: -1 })
        .skip(skip).limit(limit).lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, data: { bookings, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getOwnerRevenue = async (req, res, next) => {
  try {
    const Venue = require('../models/Venue');
    const { Booking } = require('../models');
    const venues = await Venue.find({ owner: req.user._id }).select('_id').lean();
    const venueIds = venues.map(v => v._id);

    const period = req.query.period || 'month';
    const now = new Date();
    let startDate;
    if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'month') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (period === 'year') startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    else startDate = new Date(0);

    const match = { venue: { $in: venueIds }, paymentStatus: 'paid' };
    if (startDate) match.createdAt = { $gte: startDate };

    const [totalResult, recentBookings] = await Promise.all([
      Booking.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            revenue: { $sum: '$totalAmount' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true, data: {
        totalRevenue: totalResult[0]?.total || 0,
        totalBookings: totalResult[0]?.count || 0,
        period,
        chart: recentBookings,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
