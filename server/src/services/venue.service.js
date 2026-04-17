const { Venue } = require('../models');
const logger = require('../config/logger');

class VenueService {
  static async create(data, ownerId) {
    const venue = new Venue({ ...data, owner: ownerId });
    await venue.save();
    logger.info({ venueId: venue._id, ownerId }, 'Venue created');
    return venue;
  }

  static async findById(id) {
    return Venue.findById(id).populate('owner', 'name email phone avatar');
  }

  static async search({ sport, lat, lng, radius = 10000, minPrice, maxPrice, page = 1, limit = 20 }) {
    const filter = { isActive: true, isApproved: true };
    if (sport) filter.sports = sport;
    if (minPrice || maxPrice) {
      filter['priceRange.min'] = {};
      if (minPrice) filter['priceRange.min'].$gte = minPrice;
      if (maxPrice) filter['priceRange.max'] = { $lte: maxPrice };
    }

    let query;
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius, 10),
        },
      };
      query = Venue.find(filter);
    } else {
      query = Venue.find(filter);
    }

    const skip = (page - 1) * limit;
    const [venues, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Venue.countDocuments(filter),
    ]);

    return { venues, total, page, pages: Math.ceil(total / limit) };
  }

  static async update(venueId, ownerId, updates) {
    const venue = await Venue.findOne({ _id: venueId, owner: ownerId });
    if (!venue) throw new Error('Venue not found or not authorized');
    Object.assign(venue, updates);
    await venue.save();
    return venue;
  }

  static async getOwnerVenues(ownerId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [venues, total] = await Promise.all([
      Venue.find({ owner: ownerId }).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Venue.countDocuments({ owner: ownerId }),
    ]);
    return { venues, total, page, pages: Math.ceil(total / limit) };
  }

  static async getAvailableSlots(venueId, date) {
    const venue = await Venue.findById(venueId).lean();
    if (!venue) throw new Error('Venue not found');

    const { Booking } = require('../models');
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedSlots = await Booking.find({
      venue: venueId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['confirmed', 'locked', 'completed'] },
    }).select('court slot status lockedUntil').lean();

    // Build a map: "court-startTime" -> status
    const slotStatusMap = new Map();
    for (const b of bookedSlots) {
      const key = `${b.court}-${b.slot?.startTime}`;
      if (b.status === 'locked' && b.lockedUntil && new Date(b.lockedUntil) < new Date()) {
        continue; // expired lock, treat as available
      }
      slotStatusMap.set(key, b.status); // confirmed, locked, or completed
    }

    // Also support legacy index-based lookups
    const bookedByIndex = new Set(bookedSlots.map(b => `${b.court}-${b.slotIndex}`));

    const courtCount = venue.courtCount || 1;
    const courts = Array.from({ length: courtCount }, (_, i) => {
      const courtNumber = i + 1;
      return {
        courtNumber,
        name: `Court ${courtNumber}`,
        slots: (venue.slots || []).map((slot, idx) => {
          const keyByTime = `${courtNumber}-${slot.startTime}`;
          const keyByIdx = `${courtNumber}-${idx}`;
          const bookingStatus = slotStatusMap.get(keyByTime);
          const isBookedByIndex = bookedByIndex.has(keyByIdx);

          let status = 'available';
          if (bookingStatus === 'confirmed' || bookingStatus === 'completed') {
            status = 'booked';
          } else if (bookingStatus === 'locked') {
            status = 'locked';
          } else if (isBookedByIndex) {
            status = 'booked';
          }

          // Also check if slot is disabled by venue
          if (slot.isAvailable === false) {
            status = 'unavailable';
          }

          return {
            ...slot,
            index: idx,
            status,
            isAvailable: status === 'available',
          };
        }),
      };
    });

    return courts;
  }

  static async approve(venueId) {
    return Venue.findByIdAndUpdate(venueId, { isApproved: true }, { new: true });
  }

  static async deactivate(venueId) {
    return Venue.findByIdAndUpdate(venueId, { isActive: false }, { new: true });
  }
}

module.exports = VenueService;
