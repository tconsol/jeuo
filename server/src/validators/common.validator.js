const { z } = require('zod');

const sportEnum = z.enum(['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball']);

const createVenueSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(2000).optional(),
    sports: z.array(sportEnum).min(1),
    location: z.object({
      coordinates: z.array(z.number()).length(2),
      address: z.string().min(5),
      city: z.string().min(2),
      state: z.string().optional(),
      pincode: z.string().optional(),
    }),
    amenities: z.array(z.string()).optional(),
    surfaceType: z.string().optional(),
    isIndoor: z.boolean().optional(),
    maxPlayers: z.number().int().positive().optional(),
    courtCount: z.number().int().positive().optional(),
    openTime: z.string().regex(/^\d{2}:\d{2}$/),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional(),
  }),
});

const createBookingSchema = z.object({
  body: z.object({
    venueId: z.string().min(1),
    date: z.string().min(1),
    slot: z.object({
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
    }),
    sport: sportEnum,
    court: z.number().int().positive().optional(),
  }),
});

const scoringEventSchema = z.object({
  body: z.object({
    matchId: z.string().min(1),
    idempotencyKey: z.string().min(1),
    type: z.string().min(1),
    team: z.enum(['home', 'away']),
    player: z.string().optional(),
    secondaryPlayer: z.string().optional(),
    payload: z.record(z.any()).optional(),
    clientTimestamp: z.string().optional(),
  }),
});

module.exports = { createVenueSchema, createBookingSchema, scoringEventSchema, sportEnum };
