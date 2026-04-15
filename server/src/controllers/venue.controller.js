const VenueService = require('../services/venue.service');
const { AppError } = require('../middleware/error');

exports.create = async (req, res, next) => {
  try {
    const venue = await VenueService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: { venue } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getById = async (req, res, next) => {
  try {
    const venue = await VenueService.findById(req.params.id);
    if (!venue) return next(new AppError('Venue not found', 404));
    res.json({ success: true, data: { venue } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.search = async (req, res, next) => {
  try {
    const result = await VenueService.search(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.update = async (req, res, next) => {
  try {
    const venue = await VenueService.update(req.params.id, req.user._id, req.body);
    res.json({ success: true, data: { venue } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const courts = await VenueService.getAvailableSlots(req.params.id, req.query.date);
    res.json({ success: true, data: { courts } });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getOwnerVenues = async (req, res, next) => {
  try {
    const result = await VenueService.getOwnerVenues(req.user._id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getOwnerStats = async (req, res, next) => {
  try {
    const Venue = require('../models/Venue');
    const Booking = require('../models/Booking');
    const venues = await Venue.find({ owner: req.user._id }).lean();
    const venueIds = venues.map(v => v._id);
    const totalBookings = await Booking.countDocuments({ venue: { $in: venueIds } });
    const revenueResult = await Booking.aggregate([
      { $match: { venue: { $in: venueIds }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    res.json({
      success: true,
      data: {
        totalVenues: venues.length,
        totalBookings,
        totalRevenue: revenueResult[0]?.total || 0,
        activeVenues: venues.filter(v => v.isActive).length,
      },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};
