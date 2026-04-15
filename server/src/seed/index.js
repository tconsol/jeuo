const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/database');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Activity = require('../models/Activity');
const Tournament = require('../models/Tournament');
const logger = require('../config/logger');

const SALT_ROUNDS = 10;

const seedUsers = [
  {
    name: 'Admin User',
    phone: '+919999900000',
    email: 'admin@athleton.com',
    roles: ['admin', 'player'],
    isActive: true,
    sports: [
      { sport: 'cricket', skillLevel: 'advanced' },
      { sport: 'football', skillLevel: 'intermediate' },
    ],
  },
  {
    name: 'Venue Owner',
    phone: '+919999900001',
    email: 'owner@athleton.com',
    roles: ['owner', 'player'],
    isActive: true,
    sports: [{ sport: 'badminton', skillLevel: 'beginner' }],
  },
  {
    name: 'Rahul Sharma',
    phone: '+919999900002',
    roles: ['player'],
    isActive: true,
    sports: [
      { sport: 'cricket', skillLevel: 'advanced' },
      { sport: 'tennis', skillLevel: 'intermediate' },
    ],
  },
  {
    name: 'Priya Patel',
    phone: '+919999900003',
    roles: ['player'],
    isActive: true,
    sports: [
      { sport: 'badminton', skillLevel: 'advanced' },
      { sport: 'volleyball', skillLevel: 'beginner' },
    ],
  },
  {
    name: 'Arjun Kumar',
    phone: '+919999900004',
    roles: ['player'],
    isActive: true,
    sports: [
      { sport: 'football', skillLevel: 'intermediate' },
      { sport: 'basketball', skillLevel: 'intermediate' },
    ],
  },
  {
    name: 'Sneha Reddy',
    phone: '+919999900005',
    roles: ['player'],
    isActive: true,
    sports: [
      { sport: 'table_tennis', skillLevel: 'advanced' },
      { sport: 'badminton', skillLevel: 'intermediate' },
    ],
  },
];

const seedVenues = [
  {
    name: 'SportZone Arena',
    description: 'Premium multi-sport facility with world-class courts and floodlights.',
    phone: '+919888800001',
    address: { line1: '42 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    sports: ['cricket', 'football', 'badminton'],
    amenities: ['parking', 'changing_rooms', 'showers', 'drinking_water', 'floodlights', 'cafeteria', 'wifi'],
    courts: [
      { name: 'Cricket Ground A', sport: 'cricket', pricePerSlot: 1500, slots: [
        { startTime: '06:00', endTime: '08:00' }, { startTime: '08:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '12:00' }, { startTime: '16:00', endTime: '18:00' },
        { startTime: '18:00', endTime: '20:00' }, { startTime: '20:00', endTime: '22:00' },
      ]},
      { name: 'Football Turf', sport: 'football', pricePerSlot: 2000, slots: [
        { startTime: '06:00', endTime: '07:00' }, { startTime: '07:00', endTime: '08:00' },
        { startTime: '17:00', endTime: '18:00' }, { startTime: '18:00', endTime: '19:00' },
        { startTime: '19:00', endTime: '20:00' }, { startTime: '20:00', endTime: '21:00' },
      ]},
      { name: 'Badminton Court 1', sport: 'badminton', pricePerSlot: 500, slots: [
        { startTime: '06:00', endTime: '07:00' }, { startTime: '07:00', endTime: '08:00' },
        { startTime: '08:00', endTime: '09:00' }, { startTime: '17:00', endTime: '18:00' },
        { startTime: '18:00', endTime: '19:00' }, { startTime: '19:00', endTime: '20:00' },
        { startTime: '20:00', endTime: '21:00' },
      ]},
    ],
    status: 'approved',
  },
  {
    name: 'PlayPark Hub',
    description: 'Community sports hub with affordable pricing and great vibes.',
    phone: '+919888800002',
    address: { line1: '15 Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034' },
    location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    sports: ['basketball', 'volleyball', 'tennis'],
    amenities: ['parking', 'drinking_water', 'floodlights', 'first_aid'],
    courts: [
      { name: 'Basketball Court', sport: 'basketball', pricePerSlot: 800, slots: [
        { startTime: '06:00', endTime: '07:30' }, { startTime: '07:30', endTime: '09:00' },
        { startTime: '17:00', endTime: '18:30' }, { startTime: '18:30', endTime: '20:00' },
      ]},
      { name: 'Tennis Court A', sport: 'tennis', pricePerSlot: 600, slots: [
        { startTime: '06:00', endTime: '07:00' }, { startTime: '07:00', endTime: '08:00' },
        { startTime: '17:00', endTime: '18:00' }, { startTime: '18:00', endTime: '19:00' },
      ]},
      { name: 'Volleyball Court', sport: 'volleyball', pricePerSlot: 700, slots: [
        { startTime: '06:00', endTime: '07:30' }, { startTime: '17:00', endTime: '18:30' },
        { startTime: '18:30', endTime: '20:00' },
      ]},
    ],
    status: 'approved',
  },
  {
    name: 'Urban TT Lounge',
    description: 'Dedicated table tennis venue with professional Butterfly tables.',
    phone: '+919888800003',
    address: { line1: '8 Indiranagar', city: 'Bangalore', state: 'Karnataka', pincode: '560038' },
    location: { type: 'Point', coordinates: [77.6408, 12.9784] },
    sports: ['table_tennis'],
    amenities: ['parking', 'drinking_water', 'wifi', 'cafeteria'],
    courts: [
      { name: 'Table 1', sport: 'table_tennis', pricePerSlot: 300, slots: [
        { startTime: '10:00', endTime: '11:00' }, { startTime: '11:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '15:00' }, { startTime: '15:00', endTime: '16:00' },
        { startTime: '17:00', endTime: '18:00' }, { startTime: '18:00', endTime: '19:00' },
        { startTime: '19:00', endTime: '20:00' },
      ]},
      { name: 'Table 2', sport: 'table_tennis', pricePerSlot: 300, slots: [
        { startTime: '10:00', endTime: '11:00' }, { startTime: '11:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '15:00' }, { startTime: '17:00', endTime: '18:00' },
        { startTime: '18:00', endTime: '19:00' },
      ]},
    ],
    status: 'approved',
  },
];

const seedActivities = [
  {
    title: 'Weekend Cricket Match',
    sport: 'cricket',
    type: 'match',
    maxPlayers: 22,
    date: new Date(Date.now() + 3 * 86400000),
    time: '07:00',
    description: 'Friendly 20-over match. All skill levels welcome!',
  },
  {
    title: 'Football 5-a-side',
    sport: 'football',
    type: 'match',
    maxPlayers: 10,
    date: new Date(Date.now() + 2 * 86400000),
    time: '18:00',
    description: 'Evening football on the turf. Competitive but fun.',
  },
  {
    title: 'Badminton Doubles',
    sport: 'badminton',
    type: 'match',
    maxPlayers: 4,
    date: new Date(Date.now() + 1 * 86400000),
    time: '19:00',
    description: 'Looking for doubles partners. Intermediate+.',
  },
  {
    title: 'Basketball Pickup Game',
    sport: 'basketball',
    type: 'match',
    maxPlayers: 10,
    date: new Date(Date.now() + 4 * 86400000),
    time: '17:00',
    description: 'Casual 5v5 pickup game. Come ball!',
  },
];

const seedTournaments = [
  {
    name: 'Bangalore Cricket Premier League',
    sport: 'cricket',
    format: 'group_knockout',
    maxTeams: 8,
    minTeamSize: 11,
    maxTeamSize: 15,
    startDate: new Date(Date.now() + 14 * 86400000),
    endDate: new Date(Date.now() + 28 * 86400000),
    entryFee: 5000,
    prizePool: 50000,
    status: 'upcoming',
    description: '8-team cricket tournament with group stage followed by knockouts. T20 format.',
  },
  {
    name: 'City Badminton Open',
    sport: 'badminton',
    format: 'knockout',
    maxTeams: 16,
    minTeamSize: 1,
    maxTeamSize: 2,
    startDate: new Date(Date.now() + 7 * 86400000),
    endDate: new Date(Date.now() + 9 * 86400000),
    entryFee: 500,
    prizePool: 10000,
    status: 'upcoming',
    description: 'Singles and doubles knockout tournament. All skill levels.',
  },
];

async function seed() {
  try {
    await connectDB();
    logger.info('Connected to database, starting seed…');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Activity.deleteMany({}),
      Tournament.deleteMany({}),
    ]);
    logger.info('Cleared existing data');

    // Create users
    const users = await User.insertMany(seedUsers);
    const adminUser = users[0];
    const ownerUser = users[1];
    const playerUsers = users.slice(2);
    logger.info({ count: users.length }, 'Users seeded');

    // Create venues (owned by owner user)
    const venuesWithOwner = seedVenues.map((v) => ({ ...v, owner: ownerUser._id }));
    const venues = await Venue.insertMany(venuesWithOwner);
    logger.info({ count: venues.length }, 'Venues seeded');

    // Create activities (created by different players, linked to venues)
    const activitiesWithMeta = seedActivities.map((a, i) => ({
      ...a,
      createdBy: playerUsers[i % playerUsers.length]._id,
      venue: venues[i % venues.length]._id,
      players: [
        { user: playerUsers[i % playerUsers.length]._id, status: 'confirmed' },
        { user: playerUsers[(i + 1) % playerUsers.length]._id, status: 'confirmed' },
      ],
    }));
    const activities = await Activity.insertMany(activitiesWithMeta);
    logger.info({ count: activities.length }, 'Activities seeded');

    // Create tournaments (created by admin)
    const tournamentsWithMeta = seedTournaments.map((t) => ({
      ...t,
      createdBy: adminUser._id,
      venue: venues[0]._id,
    }));
    const tournaments = await Tournament.insertMany(tournamentsWithMeta);
    logger.info({ count: tournaments.length }, 'Tournaments seeded');

    // Add social connections
    await User.findByIdAndUpdate(playerUsers[0]._id, {
      $addToSet: {
        followers: [playerUsers[1]._id, playerUsers[2]._id],
        following: [playerUsers[1]._id],
        playpals: [playerUsers[1]._id],
      },
    });
    await User.findByIdAndUpdate(playerUsers[1]._id, {
      $addToSet: {
        followers: [playerUsers[0]._id],
        following: [playerUsers[0]._id, playerUsers[2]._id],
        playpals: [playerUsers[0]._id],
      },
    });

    logger.info('Seed completed successfully');
    logger.info({
      users: users.length,
      venues: venues.length,
      activities: activities.length,
      tournaments: tournaments.length,
    }, 'Seed summary');

    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, 'Seed failed');
    process.exit(1);
  }
}

seed();
