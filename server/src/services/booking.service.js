const mongoose = require('mongoose');
const { Booking, Venue } = require('../models');
const { getRedis } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class BookingService {
  /**
   * Lock a slot temporarily while user completes payment.
   * Uses a lock token to prevent race conditions.
   */
  static async lockSlot(userId, venueId, date, slot, court = 1) {
    const lockToken = uuidv4();
    const lockDuration = 10 * 60 * 1000; // 10 minutes

    const venue = await Venue.findById(venueId);
    if (!venue || !venue.isActive || !venue.isApproved) {
      throw Object.assign(new Error('Venue not available'), { statusCode: 400 });
    }

    // Check if slot is already booked or locked
    const existing = await Booking.findOne({
      venue: venueId,
      date: new Date(date),
      'slot.startTime': slot.startTime,
      court,
      status: { $in: ['confirmed', 'locked'] },
      $or: [
        { status: 'confirmed' },
        { status: 'locked', lockedUntil: { $gt: new Date() } },
      ],
    });

    if (existing) {
      throw Object.assign(new Error('Slot is not available'), { statusCode: 409 });
    }

    // Calculate price
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const venueSlot = venue.slots.find(s => s.startTime === slot.startTime);
    const basePrice = venueSlot ? venueSlot.price : 500;
    const totalAmount = isWeekend ? basePrice * venue.weekendPriceMultiplier : basePrice;

    // Create locked booking using a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.create([{
        venue: venueId,
        user: userId,
        date: new Date(date),
        slot,
        sport: venueSlot?.sport || venue.sports[0],
        court,
        basePrice,
        totalAmount: Math.round(totalAmount),
        status: 'locked',
        lockedUntil: new Date(Date.now() + lockDuration),
        lockToken,
      }], { session });

      await session.commitTransaction();
      return { booking: booking[0], lockToken };
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) {
        throw Object.assign(new Error('Slot already booked'), { statusCode: 409 });
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Confirm a locked booking after payment
   */
  static async confirmBooking(bookingId, lockToken, paymentId) {
    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        lockToken,
        status: 'locked',
        lockedUntil: { $gt: new Date() },
      },
      {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId,
        $unset: { lockedUntil: 1, lockToken: 1 },
      },
      { new: true }
    );

    if (!booking) {
      throw Object.assign(new Error('Booking lock expired or invalid'), { statusCode: 400 });
    }

    // Update venue booking count
    await Venue.findByIdAndUpdate(booking.venue, { $inc: { totalBookings: 1 } });

    // Invalidate cache
    const redis = getRedis();
    await redis.del(`venue:slots:${booking.venue}:${booking.date.toISOString().split('T')[0]}`);

    return booking;
  }

  /**
   * Cancel booking with refund calculation
   */
  static async cancelBooking(bookingId, userId, reason) {
    const booking = await Booking.findById(bookingId).populate('venue');
    if (!booking) {
      throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
    }

    if (booking.user.toString() !== userId.toString() && booking.venue.owner.toString() !== userId.toString()) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    if (booking.status === 'cancelled') {
      throw Object.assign(new Error('Already cancelled'), { statusCode: 400 });
    }

    // Calculate refund based on cancellation policy
    const hoursUntilBooking = (new Date(booking.date) - new Date()) / (1000 * 60 * 60);
    let refundPercentage = 0;

    const policy = booking.venue.cancellationPolicy;
    if (policy === 'flexible') {
      refundPercentage = hoursUntilBooking > 2 ? 100 : 50;
    } else if (policy === 'moderate') {
      refundPercentage = hoursUntilBooking > 24 ? 100 : hoursUntilBooking > 6 ? 50 : 0;
    } else {
      refundPercentage = hoursUntilBooking > 48 ? 50 : 0;
    }

    const refundAmount = Math.round((booking.totalAmount * refundPercentage) / 100);

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    booking.cancellationReason = reason;
    booking.refundAmount = refundAmount;
    booking.refundStatus = refundAmount > 0 ? 'pending' : 'none';
    await booking.save();

    // Clear cache
    const redis = getRedis();
    await redis.del(`venue:slots:${booking.venue._id}:${booking.date.toISOString().split('T')[0]}`);

    return booking;
  }

  /**
   * Get available slots for a venue on a given date
   */
  static async getAvailableSlots(venueId, date) {
    const redis = getRedis();
    const cacheKey = `venue:slots:${venueId}:${date}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const venue = await Venue.findById(venueId);
    if (!venue) throw Object.assign(new Error('Venue not found'), { statusCode: 404 });

    const bookings = await Booking.find({
      venue: venueId,
      date: new Date(date),
      status: { $in: ['confirmed', 'locked'] },
    }).select('slot court');

    const bookedSlots = new Set(
      bookings.map(b => `${b.slot.startTime}-${b.court}`)
    );

    const available = [];
    for (const slot of venue.slots) {
      for (let court = 1; court <= venue.courtCount; court++) {
        const key = `${slot.startTime}-${court}`;
        available.push({
          ...slot.toObject(),
          court,
          isAvailable: !bookedSlots.has(key),
        });
      }
    }

    await redis.set(cacheKey, JSON.stringify(available), 'EX', 300);
    return available;
  }

  /**
   * Create recurring bookings
   */
  static async createRecurringBooking(userId, venueId, date, slot, sport, frequency, endDate) {
    const dates = [];
    const startDate = new Date(date);
    const end = new Date(endDate);

    let current = new Date(startDate);
    while (current <= end) {
      dates.push(new Date(current));
      if (frequency === 'weekly') current.setDate(current.getDate() + 7);
      else if (frequency === 'biweekly') current.setDate(current.getDate() + 14);
      else current.setMonth(current.getMonth() + 1);
    }

    const bookings = [];
    for (const d of dates) {
      try {
        const { booking } = await this.lockSlot(userId, venueId, d, slot);
        booking.isRecurring = true;
        booking.recurringPattern = { frequency, endDate: end };
        await booking.save();
        bookings.push(booking);
      } catch (error) {
        logger.warn(`Recurring booking failed for date ${d}: ${error.message}`);
      }
    }

    return bookings;
  }
}

module.exports = BookingService;
