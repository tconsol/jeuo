/**
 * COMPREHENSIVE SEED SCRIPT
 * Seeds ALL collections to cover every page in the client app:
 *   Dashboard, Venues, Activities, Tournaments, Matches (My/History/Live),
 *   Bookings, Wallet, Notifications, Profile, LiveScoring
 *
 * Run: node src/seed.js
 * Password for all users: Password@123
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Venue = require('./models/Venue');
const Activity = require('./models/Activity');
const Tournament = require('./models/Tournament');
const Match = require('./models/Match');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Wallet = require('./models/Wallet');
const Notification = require('./models/Notification');
const Event = require('./models/Event');
const AuditLog = require('./models/AuditLog');
const Team = require('./models/Team');

// ─── helpers ───────────────────────────────────────────────────────────────────
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const hoursFromNow = (n) => { const d = new Date(); d.setHours(d.getHours() + n); return d; };

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/athleon');
    console.log('✔ Connected to MongoDB');

    // ── CLEAR ALL ──────────────────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}), Venue.deleteMany({}), Activity.deleteMany({}),
      Tournament.deleteMany({}), Match.deleteMany({}), Booking.deleteMany({}),
      Payment.deleteMany({}), Wallet.deleteMany({}), Notification.deleteMany({}),
      Event.deleteMany({}), AuditLog.deleteMany({}), Team.deleteMany({}),
    ]);
    console.log('✔ Cleared existing data');

    const pw = await bcrypt.hash('Password@123', 10);

    // ══════════════════════════════════════════════════════════════════════════
    // USERS (27 total: 1 admin, 3 owners, 22 players, 1 scorer)
    // ══════════════════════════════════════════════════════════════════════════
    const [
      admin,
      owner1, owner2, owner3,
      p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12,
      // Additional cricket-focused players for full 11v11
      c1, c2, c3, c4, c5, c6, c7, c8, c9, c10,
      scorer,
    ] = await User.insertMany([
      // ── Admin ────────────────────────────────────────────────────────────
      {
        name: 'Admin User', email: 'admin@athleon.in', password: pw,
        role: 'admin', isVerified: true, phone: '9000000000',
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
        gamesPlayed: 0, reliabilityScore: 100,
      },
      // ── Venue Owners ────────────────────────────────────────────────────
      {
        name: 'Anish Kumar', email: 'owner1@athleon.in', password: pw,
        role: 'owner', isVerified: true, phone: '9000000001',
        bio: 'Managing premium sports facilities in Bengaluru since 2018.',
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Ravi Sports Hub', email: 'owner2@athleon.in', password: pw,
        role: 'owner', isVerified: true, phone: '9000000002',
        bio: "Mumbai's largest multi-sport venue chain.",
        location: { type: 'Point', coordinates: [72.8777, 19.0760], city: 'Mumbai', state: 'Maharashtra' },
      },
      {
        name: 'Delhi Sports Co', email: 'owner3@athleon.in', password: pw,
        role: 'owner', isVerified: true, phone: '9000000003',
        bio: 'Premium sports arenas across Delhi NCR.',
        location: { type: 'Point', coordinates: [77.2090, 28.6139], city: 'Delhi', state: 'Delhi' },
      },
      // ── Original Players (p1-p12) ──────────────────────────────────────
      {
        name: 'Arjun Sharma', email: 'player1@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000011',
        bio: 'Cricket enthusiast. Opening batsman. Captain of Thunder Strikers.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-30), endDate: daysFromNow(335) },
        sports: [
          { sport: 'cricket', skillLevel: 'advanced', position: 'Batsman' },
          { sport: 'football', skillLevel: 'beginner' },
        ],
        rating: 4.2, totalRatings: 12, ratingSum: 50.4,
        gamesPlayed: 24, gamesNoShow: 1, reliabilityScore: 96,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Meera Nair', email: 'player2@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000012',
        bio: 'National level badminton player. Also plays cricket.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-60), endDate: daysFromNow(305) },
        sports: [
          { sport: 'badminton', skillLevel: 'advanced', position: 'Singles' },
          { sport: 'cricket', skillLevel: 'intermediate', position: 'Bowler' },
        ],
        rating: 4.7, totalRatings: 20, ratingSum: 94,
        gamesPlayed: 45, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Karan Mehta', email: 'player3@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000013',
        bio: 'Football midfielder. Weekend cricket player. Fast bowler.',
        subscription: { plan: 'pro', isActive: true, startDate: daysFromNow(-15), endDate: daysFromNow(350) },
        sports: [
          { sport: 'football', skillLevel: 'intermediate', position: 'Midfielder' },
          { sport: 'cricket', skillLevel: 'intermediate', position: 'Bowler' },
        ],
        rating: 3.8, totalRatings: 8, ratingSum: 30.4,
        gamesPlayed: 18, gamesNoShow: 2, reliabilityScore: 89,
        location: { type: 'Point', coordinates: [72.8777, 19.0760], city: 'Mumbai', state: 'Maharashtra' },
      },
      {
        name: 'Sneha Patel', email: 'player4@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000014',
        bio: 'Basketball point guard. State level player.',
        subscription: { plan: 'pro', isActive: true, startDate: daysFromNow(-20), endDate: daysFromNow(345) },
        sports: [{ sport: 'basketball', skillLevel: 'advanced', position: 'Point Guard' }],
        rating: 4.5, totalRatings: 15, ratingSum: 67.5,
        gamesPlayed: 32, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [72.8777, 19.0760], city: 'Mumbai', state: 'Maharashtra' },
      },
      {
        name: 'Rahul Verma', email: 'player5@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000015',
        bio: 'Professional tennis player. Ranked #42 nationally.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-90), endDate: daysFromNow(275) },
        sports: [{ sport: 'tennis', skillLevel: 'professional', position: 'Singles' }],
        rating: 4.9, totalRatings: 30, ratingSum: 147,
        gamesPlayed: 60, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.2090, 28.6139], city: 'Delhi', state: 'Delhi' },
      },
      {
        name: 'Ananya Singh', email: 'player6@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000016',
        bio: 'Volleyball setter. District champion 2023.',
        sports: [{ sport: 'volleyball', skillLevel: 'intermediate', position: 'Setter' }],
        rating: 4.1, totalRatings: 9, ratingSum: 36.9,
        gamesPlayed: 20, gamesNoShow: 1, reliabilityScore: 95,
        location: { type: 'Point', coordinates: [77.2090, 28.6139], city: 'Delhi', state: 'Delhi' },
      },
      {
        name: 'Vikram Reddy', email: 'player7@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000017',
        bio: 'Football striker. Fast and creative.',
        sports: [{ sport: 'football', skillLevel: 'intermediate', position: 'Striker' }],
        rating: 4.0, totalRatings: 10, ratingSum: 40,
        gamesPlayed: 15, gamesNoShow: 1, reliabilityScore: 93,
        location: { type: 'Point', coordinates: [78.4867, 17.3850], city: 'Hyderabad', state: 'Telangana' },
      },
      {
        name: 'Priya Kapoor', email: 'player8@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000018',
        bio: "Professional badminton. Women's doubles champion.",
        sports: [{ sport: 'badminton', skillLevel: 'professional', position: 'Doubles' }],
        rating: 4.8, totalRatings: 25, ratingSum: 120,
        gamesPlayed: 50, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Aditya Joshi', email: 'player9@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000019',
        bio: 'Basketball center. Defensive specialist.',
        sports: [{ sport: 'basketball', skillLevel: 'advanced', position: 'Center' }],
        rating: 4.3, totalRatings: 11, ratingSum: 47.3,
        gamesPlayed: 22, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.2090, 28.6139], city: 'Delhi', state: 'Delhi' },
      },
      {
        name: 'Divya Menon', email: 'player10@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000020',
        bio: 'Volleyball outside hitter.',
        sports: [{ sport: 'volleyball', skillLevel: 'advanced', position: 'Outside Hitter' }],
        rating: 4.4, totalRatings: 14, ratingSum: 61.6,
        gamesPlayed: 28, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [72.8777, 19.0760], city: 'Mumbai', state: 'Maharashtra' },
      },
      {
        name: 'Rohan Desai', email: 'player11@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000021',
        bio: 'Tennis beginner. Learning fast.',
        sports: [{ sport: 'tennis', skillLevel: 'beginner' }],
        rating: 3.5, totalRatings: 5, ratingSum: 17.5,
        gamesPlayed: 8, gamesNoShow: 2, reliabilityScore: 75,
        location: { type: 'Point', coordinates: [73.8567, 18.5204], city: 'Pune', state: 'Maharashtra' },
      },
      {
        name: 'Kavitha Rao', email: 'player12@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000022',
        bio: 'Badminton advanced. District level.',
        sports: [{ sport: 'badminton', skillLevel: 'advanced' }],
        rating: 4.6, totalRatings: 18, ratingSum: 82.8,
        gamesPlayed: 36, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [80.2707, 13.0827], city: 'Chennai', state: 'Tamil Nadu' },
      },
      // ── Cricket Players (c1-c10) for full 11v11 matches ────────────────
      {
        name: 'Sanjay Gupta', email: 'crick1@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000031',
        bio: 'Aggressive opening batsman. Loves to hit sixes.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-45), endDate: daysFromNow(320) },
        sports: [{ sport: 'cricket', skillLevel: 'advanced', position: 'Batsman' }],
        rating: 4.4, totalRatings: 16, ratingSum: 70.4,
        gamesPlayed: 30, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Deepak Kumar', email: 'crick2@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000032',
        bio: 'Left-arm spinner. Economy under 6.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-20), endDate: daysFromNow(345) },
        sports: [{ sport: 'cricket', skillLevel: 'advanced', position: 'Bowler' }],
        rating: 4.3, totalRatings: 14, ratingSum: 60.2,
        gamesPlayed: 28, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Mohit Yadav', email: 'crick3@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000033',
        bio: 'Right-arm fast bowler. Yorker specialist.',
        subscription: { plan: 'pro', isActive: true, startDate: daysFromNow(-10), endDate: daysFromNow(355) },
        sports: [{ sport: 'cricket', skillLevel: 'intermediate', position: 'Bowler' }],
        rating: 4.0, totalRatings: 10, ratingSum: 40,
        gamesPlayed: 20, gamesNoShow: 1, reliabilityScore: 95,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Ankit Mishra', email: 'crick4@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000034',
        bio: 'Wicketkeeper-batsman. Quick behind the stumps.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-40), endDate: daysFromNow(325) },
        sports: [{ sport: 'cricket', skillLevel: 'advanced', position: 'Wicketkeeper' }],
        rating: 4.5, totalRatings: 18, ratingSum: 81,
        gamesPlayed: 35, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Ravi Shankar', email: 'crick5@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000035',
        bio: 'All-rounder. Bats right, bowls off-spin.',
        subscription: { plan: 'pro', isActive: true, startDate: daysFromNow(-25), endDate: daysFromNow(340) },
        sports: [{ sport: 'cricket', skillLevel: 'intermediate', position: 'All-rounder' }],
        rating: 3.9, totalRatings: 8, ratingSum: 31.2,
        gamesPlayed: 16, gamesNoShow: 1, reliabilityScore: 94,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Tarun Pillai', email: 'crick6@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000036',
        bio: 'Middle-order batsman. Anchor of the team.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-50), endDate: daysFromNow(315) },
        sports: [{ sport: 'cricket', skillLevel: 'advanced', position: 'Batsman' }],
        rating: 4.2, totalRatings: 12, ratingSum: 50.4,
        gamesPlayed: 25, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Nikhil Das', email: 'crick7@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000037',
        bio: 'Left-hand batsman. Stylish stroke player.',
        subscription: { plan: 'pro', isActive: true, startDate: daysFromNow(-8), endDate: daysFromNow(357) },
        sports: [{ sport: 'cricket', skillLevel: 'intermediate', position: 'Batsman' }],
        rating: 3.7, totalRatings: 7, ratingSum: 25.9,
        gamesPlayed: 14, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Suresh Iyer', email: 'crick8@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000038',
        bio: 'Medium-pace bowler and lower-order hitter.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-35), endDate: daysFromNow(330) },
        sports: [{ sport: 'cricket', skillLevel: 'advanced', position: 'Bowler' }],
        rating: 4.1, totalRatings: 11, ratingSum: 45.1,
        gamesPlayed: 22, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Vivek Nair', email: 'crick9@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000039',
        bio: 'Leg-spinner. Loves turning it square.',
        subscription: { plan: 'pro', isActive: true, startDate: daysFromNow(-12), endDate: daysFromNow(353) },
        sports: [{ sport: 'cricket', skillLevel: 'intermediate', position: 'Bowler' }],
        rating: 4.0, totalRatings: 9, ratingSum: 36,
        gamesPlayed: 18, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      {
        name: 'Ajay Bhatt', email: 'crick10@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000040',
        bio: 'Opening bowler. Swings it both ways.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-55), endDate: daysFromNow(310) },
        sports: [{ sport: 'cricket', skillLevel: 'advanced', position: 'Bowler' }],
        rating: 4.6, totalRatings: 20, ratingSum: 92,
        gamesPlayed: 40, gamesNoShow: 0, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
      // ── Cricket Demo Scorer ──────────────────────────────────────────────
      {
        name: 'Demo Cricket Scorer', email: 'cricket@athleon.in', password: pw,
        role: 'player', isVerified: true, phone: '9000000099',
        bio: 'Demo account for cricket live scoring.',
        subscription: { plan: 'premium', isActive: true, startDate: daysFromNow(-5), endDate: daysFromNow(360) },
        sports: [{ sport: 'cricket', skillLevel: 'intermediate', position: 'All-rounder' }],
        gamesPlayed: 5, reliabilityScore: 100,
        location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
      },
    ]);
    console.log('✔ Created 27 users');

    // set up follows / playpals for dashboard social data
    await User.updateOne({ _id: p1._id }, {
      $set: {
        followers: [p2._id, p3._id, p4._id, c1._id, c2._id],
        following: [p2._id, p5._id, c1._id],
        playpals: [p2._id, p3._id, c1._id, c4._id],
      }
    });
    await User.updateOne({ _id: p2._id }, {
      $set: { followers: [p1._id, p8._id, c1._id], following: [p1._id], playpals: [p1._id] }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // VENUES  (8 total, 7 approved + 1 pending)
    // ══════════════════════════════════════════════════════════════════════════
    const [v1, v2, v3, v4, v5, v6, v7, v8] = await Venue.insertMany([
      {
        owner: owner1._id, isApproved: true, isActive: true,
        name: 'Koramangala Sports Arena',
        description: 'Premium multi-sport facility with 3 cricket pitches, 2 football turfs and 4 badminton courts. Floodlit for evening play.',
        images: [],
        location: { type: 'Point', coordinates: [77.6244, 12.9352], address: '5th Block, Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
        sports: ['cricket', 'badminton', 'football'],
        amenities: ['parking', 'changing_room', 'water', 'floodlights', 'cafeteria'],
        surfaceType: 'turf', isIndoor: false, maxPlayers: 22, courtCount: 3,
        openTime: '06:00', closeTime: '23:00', offDays: [],
        slots: [
          { startTime: '06:00', endTime: '08:00', price: 800, sport: 'cricket', isAvailable: true },
          { startTime: '08:00', endTime: '10:00', price: 800, sport: 'cricket', isAvailable: true },
          { startTime: '17:00', endTime: '19:00', price: 1000, sport: 'football', isAvailable: true },
          { startTime: '19:00', endTime: '21:00', price: 1000, sport: 'football', isAvailable: true },
        ],
        weekendPriceMultiplier: 1.3,
        cancellationPolicy: 'moderate', cancellationHours: 24,
        rating: 4.5, totalRatings: 42,
      },
      {
        owner: owner1._id, isApproved: true, isActive: true,
        name: 'HSR Indoor Badminton Court',
        description: 'International-standard wooden badminton courts. Air-conditioned, perfect lighting, coaching available.',
        images: [],
        location: { type: 'Point', coordinates: [77.6472, 12.9116], address: 'Sector 7, HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102' },
        sports: ['badminton'],
        amenities: ['parking', 'water', 'washroom', 'coach'],
        surfaceType: 'wood', isIndoor: true, maxPlayers: 8, courtCount: 4,
        openTime: '05:30', closeTime: '22:00', offDays: [],
        slots: [
          { startTime: '05:30', endTime: '07:00', price: 300, sport: 'badminton', isAvailable: true },
          { startTime: '07:00', endTime: '09:00', price: 350, sport: 'badminton', isAvailable: true },
          { startTime: '18:00', endTime: '20:00', price: 400, sport: 'badminton', isAvailable: true },
        ],
        weekendPriceMultiplier: 1.2,
        cancellationPolicy: 'flexible', cancellationHours: 6,
        rating: 4.8, totalRatings: 76,
      },
      {
        owner: owner2._id, isApproved: true, isActive: true,
        name: 'Andheri Football Ground',
        description: 'Full-size FIFA-quality turf in the heart of Andheri. Ideal for 11-a-side and 7-a-side matches.',
        images: [],
        location: { type: 'Point', coordinates: [72.8479, 19.1136], address: 'MIDC Road, Andheri East', city: 'Mumbai', state: 'Maharashtra', pincode: '400059' },
        sports: ['football'],
        amenities: ['parking', 'changing_room', 'water', 'floodlights'],
        surfaceType: 'turf', isIndoor: false, maxPlayers: 22, courtCount: 1,
        openTime: '06:00', closeTime: '22:00', offDays: [0],
        slots: [
          { startTime: '06:00', endTime: '07:30', price: 1500, sport: 'football', isAvailable: true },
          { startTime: '17:00', endTime: '18:30', price: 1800, sport: 'football', isAvailable: true },
          { startTime: '19:00', endTime: '20:30', price: 2000, sport: 'football', isAvailable: true },
        ],
        weekendPriceMultiplier: 1.5,
        cancellationPolicy: 'strict', cancellationHours: 48,
        rating: 4.3, totalRatings: 31,
      },
      {
        owner: owner3._id, isApproved: true, isActive: true,
        name: 'Dwarka Basketball Arena',
        description: 'FIBA-standard hardwood courts with digital scoreboards. Ideal for both casual games and tournaments.',
        images: [],
        location: { type: 'Point', coordinates: [77.0266, 28.5921], address: 'Sector 23, Dwarka', city: 'Delhi', state: 'Delhi', pincode: '110078' },
        sports: ['basketball'],
        amenities: ['parking', 'changing_room', 'water', 'scoreboards'],
        surfaceType: 'wood', isIndoor: true, maxPlayers: 10, courtCount: 2,
        openTime: '06:00', closeTime: '22:00', offDays: [],
        slots: [
          { startTime: '06:00', endTime: '08:00', price: 700, sport: 'basketball', isAvailable: true },
          { startTime: '16:00', endTime: '18:00', price: 800, sport: 'basketball', isAvailable: true },
          { startTime: '18:00', endTime: '20:00', price: 800, sport: 'basketball', isAvailable: true },
        ],
        weekendPriceMultiplier: 1.3,
        cancellationPolicy: 'moderate', cancellationHours: 12,
        rating: 4.6, totalRatings: 28,
      },
      {
        owner: owner3._id, isApproved: true, isActive: true,
        name: 'Nehru Stadium Tennis Club',
        description: 'Clay and hard courts in the prestigious Nehru Stadium complex. Professional coaching available.',
        images: [],
        location: { type: 'Point', coordinates: [77.2373, 28.5845], address: 'Lodhi Road', city: 'Delhi', state: 'Delhi', pincode: '110003' },
        sports: ['tennis'],
        amenities: ['parking', 'changing_room', 'water', 'coach', 'cafeteria'],
        surfaceType: 'clay', isIndoor: false, maxPlayers: 4, courtCount: 6,
        openTime: '05:00', closeTime: '21:00', offDays: [1],
        slots: [
          { startTime: '05:00', endTime: '07:00', price: 500, sport: 'tennis', isAvailable: true },
          { startTime: '07:00', endTime: '09:00', price: 600, sport: 'tennis', isAvailable: true },
          { startTime: '17:00', endTime: '19:00', price: 700, sport: 'tennis', isAvailable: true },
        ],
        weekendPriceMultiplier: 1.2,
        cancellationPolicy: 'flexible', cancellationHours: 6,
        rating: 4.7, totalRatings: 53,
      },
      {
        owner: owner2._id, isApproved: true, isActive: true,
        name: 'Powai Sports Complex',
        description: "Powai's largest sports complex. Cricket, football and volleyball under one roof.",
        images: [],
        location: { type: 'Point', coordinates: [72.9054, 19.1176], address: 'Hiranandani Gardens, Powai', city: 'Mumbai', state: 'Maharashtra', pincode: '400076' },
        sports: ['cricket', 'football', 'volleyball'],
        amenities: ['parking', 'changing_room', 'water', 'floodlights', 'cafeteria'],
        surfaceType: 'turf', isIndoor: false, maxPlayers: 30, courtCount: 3,
        openTime: '06:00', closeTime: '23:00', offDays: [],
        slots: [
          { startTime: '06:00', endTime: '08:00', price: 1200, sport: 'cricket', isAvailable: true },
          { startTime: '16:00', endTime: '18:00', price: 1400, sport: 'volleyball', isAvailable: true },
          { startTime: '19:00', endTime: '21:00', price: 1600, sport: 'football', isAvailable: true },
        ],
        weekendPriceMultiplier: 1.4,
        cancellationPolicy: 'moderate', cancellationHours: 24,
        rating: 4.4, totalRatings: 38,
      },
      {
        owner: owner1._id, isApproved: true, isActive: true,
        name: 'Whitefield Table Tennis Hub',
        description: 'State-of-the-art table tennis facility. 8 ITTF-approved tables, training sessions available.',
        images: [],
        location: { type: 'Point', coordinates: [77.7500, 12.9698], address: 'ITPL Main Road, Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' },
        sports: ['table_tennis'],
        amenities: ['parking', 'water', 'coach'],
        surfaceType: 'concrete', isIndoor: true, maxPlayers: 16, courtCount: 8,
        openTime: '07:00', closeTime: '21:00', offDays: [],
        slots: [
          { startTime: '07:00', endTime: '09:00', price: 200, sport: 'table_tennis', isAvailable: true },
          { startTime: '09:00', endTime: '11:00', price: 200, sport: 'table_tennis', isAvailable: true },
        ],
        weekendPriceMultiplier: 1.1,
        cancellationPolicy: 'flexible', cancellationHours: 3,
        rating: 4.2, totalRatings: 19,
      },
      {
        owner: owner2._id, isApproved: false, isActive: true,   // pending approval
        name: 'Bandra Cricket Academy',
        description: 'New cricket academy with turf pitch and bowling machine. Pending approval.',
        images: [],
        location: { type: 'Point', coordinates: [72.8340, 19.0596], address: 'Turner Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
        sports: ['cricket'],
        amenities: ['parking', 'changing_room', 'water'],
        surfaceType: 'turf', isIndoor: false, maxPlayers: 22, courtCount: 2,
        openTime: '06:00', closeTime: '21:00', offDays: [0],
        slots: [{ startTime: '06:00', endTime: '08:00', price: 900, sport: 'cricket', isAvailable: true }],
        weekendPriceMultiplier: 1.3,
        cancellationPolicy: 'strict', cancellationHours: 48,
        rating: 0, totalRatings: 0,
      },
    ]);
    console.log('✔ Created 8 venues');

    // ══════════════════════════════════════════════════════════════════════════
    // BOOKINGS  (covers Bookings page — confirmed / cancelled / completed)
    // ══════════════════════════════════════════════════════════════════════════
    const [bk1, bk2, bk3, bk4, bk5] = await Booking.insertMany([
      {
        venue: v1._id, user: p1._id,
        date: daysFromNow(3), slot: { startTime: '06:00', endTime: '08:00' },
        sport: 'cricket', court: 1,
        basePrice: 800, discount: 0, tax: 0, totalAmount: 800, walletAmountUsed: 200,
        paymentStatus: 'paid', status: 'confirmed',
        notes: 'Morning practice session',
      },
      {
        venue: v2._id, user: p2._id,
        date: daysFromNow(1), slot: { startTime: '18:00', endTime: '20:00' },
        sport: 'badminton', court: 2,
        basePrice: 400, discount: 40, tax: 0, totalAmount: 360, walletAmountUsed: 0,
        paymentStatus: 'paid', status: 'confirmed',
      },
      {
        venue: v3._id, user: p3._id,
        date: daysFromNow(-2), slot: { startTime: '17:00', endTime: '18:30' },
        sport: 'football', court: 1,
        basePrice: 1800, discount: 0, tax: 0, totalAmount: 1800, walletAmountUsed: 0,
        paymentStatus: 'paid', status: 'completed',
      },
      {
        venue: v4._id, user: p4._id,
        date: daysFromNow(-5), slot: { startTime: '16:00', endTime: '18:00' },
        sport: 'basketball', court: 1,
        basePrice: 800, discount: 0, tax: 0, totalAmount: 800, walletAmountUsed: 0,
        paymentStatus: 'refunded', status: 'cancelled',
        cancelledAt: daysFromNow(-5), cancelledBy: p4._id,
        cancellationReason: 'Unable to attend due to work',
        refundAmount: 800, refundStatus: 'processed',
      },
      {
        venue: v5._id, user: p5._id,
        date: daysFromNow(7), slot: { startTime: '07:00', endTime: '09:00' },
        sport: 'tennis', court: 3,
        basePrice: 600, discount: 0, tax: 0, totalAmount: 600, walletAmountUsed: 0,
        paymentStatus: 'paid', status: 'confirmed',
      },
    ]);
    console.log('✔ Created 5 bookings');

    // ══════════════════════════════════════════════════════════════════════════
    // PAYMENTS  (covers wallet transactions, payment history)
    // ══════════════════════════════════════════════════════════════════════════
    const [pay1, pay2, pay3, pay4] = await Payment.insertMany([
      {
        user: p1._id, booking: bk1._id,
        amount: 800, currency: 'INR',
        razorpayOrderId: 'order_test_001', razorpayPaymentId: 'pay_test_001',
        status: 'captured',
      },
      {
        user: p2._id, booking: bk2._id,
        amount: 360, currency: 'INR',
        razorpayOrderId: 'order_test_002', razorpayPaymentId: 'pay_test_002',
        status: 'captured',
      },
      {
        user: p3._id, booking: bk3._id,
        amount: 1800, currency: 'INR',
        razorpayOrderId: 'order_test_003', razorpayPaymentId: 'pay_test_003',
        status: 'captured',
      },
      {
        user: p4._id, booking: bk4._id,
        amount: 800, currency: 'INR',
        razorpayOrderId: 'order_test_004', razorpayPaymentId: 'pay_test_004',
        status: 'refunded',
        refunds: [{ amount: 800, razorpayRefundId: 'rfnd_test_001', reason: 'User cancelled', status: 'processed', processedAt: daysFromNow(-4) }],
      },
    ]);
    console.log('✔ Created 4 payments');

    // ══════════════════════════════════════════════════════════════════════════
    // ACTIVITIES  (covers Activities page + ActivityDetail + Dashboard quick links)
    // ══════════════════════════════════════════════════════════════════════════
    const [act1, act2, act3, act4, act5] = await Activity.insertMany([
      {
        creator: p1._id, venue: v1._id,
        title: 'Weekend Cricket Gully Match',
        sport: 'cricket',
        date: daysFromNow(2),
        startTime: '07:00', endTime: '10:00', duration: 180,
        location: { type: 'Point', coordinates: [77.6244, 12.9352], address: 'Koramangala', city: 'Bengaluru' },
        maxPlayers: 22, minPlayers: 14,
        players: [
          { user: p1._id, status: 'confirmed', team: 'A' },
          { user: p2._id, status: 'confirmed', team: 'B' },
          { user: p3._id, status: 'confirmed', team: 'A' },
          { user: scorer._id, status: 'confirmed', team: 'B' },
        ],
        visibility: 'public', requireApproval: false,
        skillLevel: 'intermediate', costPerPlayer: 150, splitPayment: true,
        status: 'upcoming',
        description: 'Fun gully cricket match in Koramangala. All skill levels welcome!',
        rules: 'No bouncers above shoulder height. Max 4 overs per bowler.',
      },
      {
        creator: p2._id, venue: v2._id,
        title: 'Competitive Badminton — Mixed Doubles',
        sport: 'badminton',
        date: daysFromNow(1),
        startTime: '18:00', endTime: '20:00', duration: 120,
        location: { type: 'Point', coordinates: [77.6472, 12.9116], address: 'HSR Layout', city: 'Bengaluru' },
        maxPlayers: 8, minPlayers: 4,
        players: [
          { user: p2._id, status: 'confirmed', team: 'A' },
          { user: p8._id, status: 'confirmed', team: 'A' },
          { user: p1._id, status: 'confirmed', team: 'B' },
          { user: p12._id, status: 'confirmed', team: 'B' },
        ],
        visibility: 'public', requireApproval: true,
        skillLevel: 'advanced', costPerPlayer: 100, splitPayment: true,
        status: 'upcoming',
        description: 'Competitive mixed doubles badminton. Advanced players preferred.',
      },
      {
        creator: p3._id, venue: v3._id,
        title: 'Mumbai FC 5-a-side Blitz',
        sport: 'football',
        date: daysFromNow(4),
        startTime: '19:00', endTime: '20:30', duration: 90,
        location: { type: 'Point', coordinates: [72.8479, 19.1136], address: 'Andheri East', city: 'Mumbai' },
        maxPlayers: 10, minPlayers: 6,
        players: [
          { user: p3._id, status: 'confirmed', team: 'A' },
          { user: p7._id, status: 'confirmed', team: 'B' },
          { user: p4._id, status: 'pending', team: 'none' },
        ],
        visibility: 'public', requireApproval: false,
        skillLevel: 'any', costPerPlayer: 200, splitPayment: true,
        status: 'upcoming',
        description: 'Fast-paced 5-a-side football. Bring your best game!',
      },
      {
        creator: p5._id, venue: v5._id,
        title: 'Sunday Tennis Doubles',
        sport: 'tennis',
        date: daysFromNow(-3),
        startTime: '07:00', endTime: '09:00', duration: 120,
        location: { type: 'Point', coordinates: [77.2373, 28.5845], address: 'Lodhi Road', city: 'Delhi' },
        maxPlayers: 4, minPlayers: 4,
        players: [
          { user: p5._id, status: 'confirmed', team: 'A' },
          { user: p11._id, status: 'confirmed', team: 'B' },
        ],
        visibility: 'public', requireApproval: false,
        skillLevel: 'any', costPerPlayer: 300, splitPayment: true,
        status: 'completed',
        description: 'Relaxed Sunday doubles tennis.',
      },
      {
        creator: p6._id, venue: v6._id,
        title: 'Delhi Volleyball League — Open',
        sport: 'volleyball',
        date: daysFromNow(6),
        startTime: '16:00', endTime: '19:00', duration: 180,
        location: { type: 'Point', coordinates: [72.9054, 19.1176], address: 'Powai', city: 'Mumbai' },
        maxPlayers: 12, minPlayers: 8,
        players: [
          { user: p6._id, status: 'confirmed', team: 'A' },
          { user: p10._id, status: 'confirmed', team: 'A' },
          { user: p3._id, status: 'pending', team: 'none' },
        ],
        waitlist: [{ user: p9._id }],
        visibility: 'public', requireApproval: true,
        skillLevel: 'intermediate', costPerPlayer: 120, splitPayment: true,
        status: 'upcoming',
        description: 'Open volleyball tournament. Register your team of 6.',
      },
    ]);
    console.log('✔ Created 5 activities');

    // ══════════════════════════════════════════════════════════════════════════
    // TOURNAMENTS  (covers Tournaments page + TournamentDetail, fixtures, standings)
    // ══════════════════════════════════════════════════════════════════════════
    const cricketTeams = [
      { name: 'Thunder Strikers', captain: p1._id, players: [p1._id, p2._id, p3._id, c1._id, c2._id, c3._id, c4._id, c5._id, c6._id, c7._id, c8._id], seed: 1 },
      { name: 'Royal Challengers', captain: c9._id, players: [c9._id, c10._id, p4._id, p5._id, p6._id, p7._id, p8._id, p9._id, p10._id, p11._id, p12._id], seed: 2 },
      { name: 'Mumbai Titans', captain: p3._id, players: [p3._id, p5._id, p6._id], seed: 3 },
      { name: 'Delhi Daredevils', captain: p7._id, players: [p7._id, p8._id, p9._id], seed: 4 },
    ];

    const footballTeams = [
      { name: 'Sea Lions FC', captain: p3._id, players: [p3._id, p7._id, p9._id], seed: 1 },
      { name: 'Red Wolves', captain: p4._id, players: [p4._id, p10._id], seed: 2 },
      { name: 'Green Eagles', captain: p1._id, players: [p1._id, p11._id], seed: 3 },
      { name: 'Blue Sharks', captain: p6._id, players: [p6._id, p12._id], seed: 4 },
    ];

    const [t1, t2, t3] = await Tournament.insertMany([
      {
        creator: p1._id,
        name: 'Bengaluru Premier Cricket Cup 2026',
        sport: 'cricket',
        description: 'The biggest amateur cricket tournament in Bengaluru. 4 teams, round-robin + knockout.',
        format: 'round_robin',
        maxTeams: 4, playersPerTeam: 11,
        matchFormat: { overs: 10, innings: 1 },
        teams: cricketTeams,
        venues: [v1._id],
        startDate: daysFromNow(-10),
        endDate: daysFromNow(5),
        registrationDeadline: daysFromNow(-12),
        entryFee: 500, prizePool: 8000,
        location: { city: 'Bengaluru', state: 'Karnataka' },
        status: 'in_progress',
        isPublic: true,
        pointsTable: [
          { teamName: 'Thunder Strikers', played: 2, won: 2, lost: 0, drawn: 0, points: 6, netRunRate: 1.23 },
          { teamName: 'Mumbai Titans', played: 2, won: 1, lost: 1, drawn: 0, points: 3, netRunRate: 0.12 },
          { teamName: 'Royal Challengers', played: 2, won: 1, lost: 1, drawn: 0, points: 3, netRunRate: -0.44 },
          { teamName: 'Delhi Daredevils', played: 2, won: 0, lost: 2, drawn: 0, points: 0, netRunRate: -0.91 },
        ],
        fixtures: [
          { round: 1, matchNumber: 1, teamHome: 'Thunder Strikers', teamAway: 'Royal Challengers', scheduledAt: daysFromNow(-10), status: 'completed', winner: 'Thunder Strikers' },
          { round: 1, matchNumber: 2, teamHome: 'Mumbai Titans', teamAway: 'Delhi Daredevils', scheduledAt: daysFromNow(-9), status: 'completed', winner: 'Mumbai Titans' },
          { round: 2, matchNumber: 3, teamHome: 'Thunder Strikers', teamAway: 'Mumbai Titans', scheduledAt: daysFromNow(-5), status: 'completed', winner: 'Thunder Strikers' },
          { round: 2, matchNumber: 4, teamHome: 'Royal Challengers', teamAway: 'Delhi Daredevils', scheduledAt: daysFromNow(-4), status: 'completed', winner: 'Royal Challengers' },
          { round: 3, matchNumber: 5, teamHome: 'Thunder Strikers', teamAway: 'Delhi Daredevils', scheduledAt: daysFromNow(1), status: 'scheduled' },
          { round: 3, matchNumber: 6, teamHome: 'Mumbai Titans', teamAway: 'Royal Challengers', scheduledAt: daysFromNow(2), status: 'scheduled' },
        ],
      },
      {
        creator: p3._id,
        name: 'Mumbai 5-a-Side Football Championship',
        sport: 'football',
        description: 'Single elimination football tournament. 4 teams, best of 1, extra time + penalties.',
        format: 'single_elimination',
        maxTeams: 4, playersPerTeam: 7,
        matchFormat: { halfDuration: 20, extraTime: true, penalties: true },
        teams: footballTeams,
        venues: [v3._id, v6._id],
        startDate: daysFromNow(5),
        endDate: daysFromNow(15),
        registrationDeadline: daysFromNow(3),
        entryFee: 300, prizePool: 5000,
        location: { city: 'Mumbai', state: 'Maharashtra' },
        status: 'registration_open',
        isPublic: true,
        fixtures: [
          { round: 1, matchNumber: 1, teamHome: 'Sea Lions FC', teamAway: 'Blue Sharks', scheduledAt: daysFromNow(5), status: 'scheduled' },
          { round: 1, matchNumber: 2, teamHome: 'Red Wolves', teamAway: 'Green Eagles', scheduledAt: daysFromNow(5), status: 'scheduled' },
          { round: 2, matchNumber: 3, teamHome: 'TBD', teamAway: 'TBD', scheduledAt: daysFromNow(10), status: 'scheduled' },
        ],
      },
      {
        creator: p5._id,
        name: 'Delhi Open Tennis Singles 2026',
        sport: 'tennis',
        description: 'Open singles tournament. All skill levels. 8-player draw, single elimination.',
        format: 'single_elimination',
        maxTeams: 8, playersPerTeam: 1,
        matchFormat: { sets: 3, tiebreakAt: 6 },
        teams: [
          { name: 'Rahul Verma', captain: p5._id, players: [p5._id], seed: 1 },
          { name: 'Rohan Desai', captain: p11._id, players: [p11._id], seed: 2 },
        ],
        venues: [v5._id],
        startDate: daysFromNow(20),
        endDate: daysFromNow(27),
        registrationDeadline: daysFromNow(14),
        entryFee: 200, prizePool: 3000,
        location: { city: 'Delhi', state: 'Delhi' },
        status: 'registration_open',
        isPublic: true,
        fixtures: [],
      },
    ]);
    console.log('✔ Created 3 tournaments');

    // ══════════════════════════════════════════════════════════════════════════
    // MATCHES (10 matches covering: completed/live/scheduled, all sports, all scorers)
    // Covers: MyMatches, MatchHistory, LiveMatches, LiveScoring pages
    // ══════════════════════════════════════════════════════════════════════════
    const [
      m1, m2, m3, m4, m5, m6, m7, m8, m9, m10,
    ] = await Match.insertMany([
      // 1. COMPLETED cricket (MatchHistory, Dashboard stats) — full 11v11
      {
        sport: 'cricket', venue: v1._id, tournament: t1._id,
        format: { overs: 10, innings: 1 },
        teams: {
          home: {
            name: 'Thunder Strikers',
            players: [p1._id, p2._id, p3._id, c1._id, c2._id, c3._id, c4._id, c5._id, c6._id, c7._id, c8._id],
            captain: p1._id,
          },
          away: {
            name: 'Royal Challengers',
            players: [c9._id, c10._id, p4._id, p5._id, p6._id, p7._id, p8._id, p9._id, p10._id, p11._id, p12._id],
            captain: c9._id,
          },
        },
        toss: { wonBy: 'home', decision: 'bat' },
        scorers: [scorer._id],
        scoreSnapshot: {
          home: { runs: 142, wickets: 3, overs: 10, extras: 8 },
          away: { runs: 128, wickets: 7, overs: 10, extras: 12 },
        },
        state: {
          currentInnings: 2,
          totalInnings: 2,
          oversPerInnings: 10,
          innings: [
            {
              battingTeam: 'home', bowlingTeam: 'away', runs: 142, wickets: 3, overs: 10, balls: 0, totalBalls: 60,
              extras: { total: 8, wides: 3, noBalls: 2, byes: 2, legByes: 1 },
            },
            {
              battingTeam: 'away', bowlingTeam: 'home', runs: 128, wickets: 7, overs: 10, balls: 0, totalBalls: 60,
              extras: { total: 12, wides: 5, noBalls: 3, byes: 3, legByes: 1 },
            },
          ],
        },
        commentary: [
          { text: 'Thunder Strikers win the toss and elect to bat first', timestamp: daysFromNow(-10) },
          { text: 'Arjun Sharma smashes a six off the first over!', timestamp: daysFromNow(-10) },
          { text: 'Sanjay Gupta and Arjun Sharma put on a 78-run opening partnership', timestamp: daysFromNow(-10) },
          { text: 'Thunder Strikers post 142/3 in 10 overs', timestamp: daysFromNow(-10) },
          { text: 'Royal Challengers need 143 to win in 10 overs', timestamp: daysFromNow(-10) },
          { text: 'Deepak Kumar takes 3 wickets in the middle overs', timestamp: daysFromNow(-10) },
          { text: 'Royal Challengers fall short by 14 runs. 128/7 in 10 overs', timestamp: daysFromNow(-10) },
          { text: 'Player of the Match: Arjun Sharma (62 off 38 balls)', timestamp: daysFromNow(-10) },
        ],
        status: 'completed',
        result: {
          winner: 'home', summary: 'Thunder Strikers won by 14 runs', margin: '14 runs',
          playerOfMatch: p1._id,
        },
        scheduledAt: daysFromNow(-10), startedAt: daysFromNow(-10), completedAt: daysFromNow(-10),
      },
      // 2. LIVE football (LiveMatches page)
      {
        sport: 'football', venue: v3._id,
        format: { halfDuration: 45 },
        teams: {
          home: { name: 'Sea Lions FC', players: [p3._id, p7._id], captain: p3._id },
          away: { name: 'Red Wolves', players: [p4._id, p10._id], captain: p4._id },
        },
        toss: { wonBy: 'home', decision: 'kick-off' },
        scorers: [p3._id],
        scoreSnapshot: { home: { goals: 2 }, away: { goals: 1 } },
        state: { half: 1, minute: 38, homeGoals: 2, awayGoals: 1 },
        status: 'live',
        scheduledAt: hoursFromNow(-1), startedAt: hoursFromNow(-1),
      },
      // 3. SCHEDULED badminton tomorrow (MyMatches p2 scorer)
      {
        sport: 'badminton', venue: v2._id,
        format: { pointsToWin: 21, bestOf: 3 },
        teams: {
          home: { name: 'Meera', players: [p2._id], captain: p2._id },
          away: { name: 'Kavitha', players: [p12._id], captain: p12._id },
        },
        scorers: [p2._id],
        status: 'scheduled',
        scheduledAt: daysFromNow(1),
      },
      // 4. SCHEDULED cricket NOW (cricketScorer — ready to start & score)
      {
        sport: 'cricket', venue: v1._id,
        format: { overs: 5, innings: 1 },
        teams: {
          home: { name: 'Challengers', players: [scorer._id, p1._id], captain: scorer._id },
          away: { name: 'Warriors', players: [p3._id, p4._id], captain: p3._id },
        },
        scorers: [scorer._id],
        status: 'scheduled',
        scheduledAt: new Date(),
      },
      // 5. SCHEDULED basketball +2h (p4 scorer)
      {
        sport: 'basketball', venue: v4._id,
        format: { quarterDuration: 10, quarters: 4 },
        teams: {
          home: { name: 'City Hoops', players: [p4._id, p9._id], captain: p4._id },
          away: { name: 'Dunks United', players: [p6._id, p10._id], captain: p6._id },
        },
        scorers: [p4._id],
        status: 'scheduled',
        scheduledAt: hoursFromNow(2),
      },
      // 6. SCHEDULED tennis +2h (p5 scorer)
      {
        sport: 'tennis', venue: v5._id,
        format: { sets: 3, tiebreakAt: 6 },
        teams: {
          home: { name: 'Rahul Verma', players: [p5._id], captain: p5._id },
          away: { name: 'Priya Kapoor', players: [p8._id], captain: p8._id },
        },
        scorers: [p5._id],
        status: 'scheduled',
        scheduledAt: hoursFromNow(2),
      },
      // 7. SCHEDULED volleyball +4h (p6 scorer)
      {
        sport: 'volleyball', venue: v6._id,
        format: { setsToWin: 3, pointsPerSet: 25 },
        teams: {
          home: { name: 'Spikes Elite', players: [p6._id, p10._id], captain: p6._id },
          away: { name: 'Net Masters', players: [p3._id, p5._id], captain: p3._id },
        },
        scorers: [p6._id],
        status: 'scheduled',
        scheduledAt: hoursFromNow(4),
      },
      // 8. SCHEDULED football +4h (p7 scorer)
      {
        sport: 'football', venue: v6._id,
        format: { halfDuration: 45 },
        teams: {
          home: { name: 'Goal Strikers', players: [p3._id, p7._id], captain: p3._id },
          away: { name: 'Defence Titans', players: [p4._id, p8._id], captain: p4._id },
        },
        scorers: [p7._id],
        status: 'scheduled',
        scheduledAt: hoursFromNow(4),
      },
      // 9. SCHEDULED cricket +6h (p1 scorer again for history)
      {
        sport: 'cricket', venue: v1._id,
        format: { overs: 6, innings: 1 },
        teams: {
          home: { name: 'Bengaluru Strikers', players: [p1._id, p2._id], captain: p1._id },
          away: { name: 'Mumbai Titans', players: [p3._id, p5._id], captain: p3._id },
        },
        scorers: [p1._id],
        status: 'scheduled',
        scheduledAt: hoursFromNow(6),
      },
      // 10. SCHEDULED badminton +6h (p8 scorer)
      {
        sport: 'badminton', venue: v2._id,
        format: { pointsToWin: 21, bestOf: 3 },
        teams: {
          home: { name: 'Priya Doubles', players: [p8._id, p12._id], captain: p8._id },
          away: { name: 'Vikram Racket', players: [p7._id, p2._id], captain: p7._id },
        },
        scorers: [p8._id],
        status: 'scheduled',
        scheduledAt: hoursFromNow(6),
      },
    ]);
    console.log('✔ Created 10 matches');

    // link match back to activity
    await Activity.updateOne({ _id: act1._id }, { $set: { match: m1._id } });

    // ══════════════════════════════════════════════════════════════════════════
    // SCORING EVENTS for the LIVE football match (m2)
    // These appear in LiveScoring page
    // ══════════════════════════════════════════════════════════════════════════
    await Event.insertMany([
      {
        match: m2._id, scorer: p3._id, idempotencyKey: 'ev_live_001', sequence: 1,
        sport: 'football', type: 'goal', team: 'home', player: p3._id,
        payload: { minute: 12, isPenalty: false, isOwnGoal: false },
        clientTimestamp: hoursFromNow(-1), syncedAt: hoursFromNow(-1),
      },
      {
        match: m2._id, scorer: p3._id, idempotencyKey: 'ev_live_002', sequence: 2,
        sport: 'football', type: 'goal', team: 'away', player: p4._id,
        payload: { minute: 25, isPenalty: false, isOwnGoal: false },
        clientTimestamp: hoursFromNow(-1), syncedAt: hoursFromNow(-1),
      },
      {
        match: m2._id, scorer: p3._id, idempotencyKey: 'ev_live_003', sequence: 3,
        sport: 'football', type: 'goal', team: 'home', player: p7._id,
        payload: { minute: 33, isPenalty: false, isOwnGoal: false },
        clientTimestamp: hoursFromNow(0), syncedAt: hoursFromNow(0),
      },
      {
        match: m2._id, scorer: p3._id, idempotencyKey: 'ev_live_004', sequence: 4,
        sport: 'football', type: 'yellow_card', team: 'away', player: p10._id,
        payload: { minute: 36 },
        clientTimestamp: hoursFromNow(0), syncedAt: hoursFromNow(0),
      },
    ]);
    console.log('✔ Created 4 scoring events (live football)');

    // ══════════════════════════════════════════════════════════════════════════
    // SCORING EVENTS for COMPLETED cricket match (m1) — full 10-over innings
    // ══════════════════════════════════════════════════════════════════════════
    // SCORING EVENTS for COMPLETED cricket match (m1) — full ball-by-ball
    // Home team (Thunder Strikers) batted first: 142/3 in 10 overs
    // Away team (Royal Challengers) chased: 128/7 in 10 overs
    // ══════════════════════════════════════════════════════════════════════════
    const cricketEvents = [];
    let seq = 0;
    const ts = daysFromNow(-10);

    // --- Helper to push a delivery event ---
    const addDelivery = (team, batsman, bowler, overNum, ballNum, runs, opts = {}) => {
      seq++;
      cricketEvents.push({
        match: m1._id, scorer: scorer._id,
        idempotencyKey: `ev_m1_${seq}`,
        sequence: seq, sport: 'cricket', type: 'delivery',
        team, player: batsman,
        payload: {
          runs, overNumber: overNum, ballInOver: ballNum,
          bowler, isExtra: !!opts.isExtra, extraType: opts.extraType || null,
          extraRuns: opts.extraRuns || 0, strikerSwap: (runs % 2 === 1),
          ...opts.extra,
        },
        clientTimestamp: ts, syncedAt: ts,
      });
    };

    const addWicket = (team, batsman, bowler, overNum, ballNum, wicketType, fielder) => {
      seq++;
      cricketEvents.push({
        match: m1._id, scorer: scorer._id,
        idempotencyKey: `ev_m1_${seq}`,
        sequence: seq, sport: 'cricket', type: 'wicket',
        team, player: batsman,
        payload: {
          wicketType, bowler, fielder: fielder || null,
          overNumber: overNum, ballInOver: ballNum, runs: 0,
        },
        clientTimestamp: ts, syncedAt: ts,
      });
    };

    const addEndOver = (team, overNum) => {
      seq++;
      cricketEvents.push({
        match: m1._id, scorer: scorer._id,
        idempotencyKey: `ev_m1_${seq}`,
        sequence: seq, sport: 'cricket', type: 'end_over',
        team, payload: { overNumber: overNum },
        clientTimestamp: ts, syncedAt: ts,
      });
    };

    const addPlayersSet = (team, striker, nonStriker, bowler, battingTeam, bowlingTeam) => {
      seq++;
      cricketEvents.push({
        match: m1._id, scorer: scorer._id,
        idempotencyKey: `ev_m1_${seq}`,
        sequence: seq, sport: 'cricket', type: 'players_set',
        team,
        payload: { striker, nonStriker, bowler, battingTeam, bowlingTeam },
        clientTimestamp: ts, syncedAt: ts,
      });
    };

    const addEndInnings = (team, inningsNum) => {
      seq++;
      cricketEvents.push({
        match: m1._id, scorer: scorer._id,
        idempotencyKey: `ev_m1_${seq}`,
        sequence: seq, sport: 'cricket', type: 'end_innings',
        team, payload: { inningsNumber: inningsNum },
        clientTimestamp: ts, syncedAt: ts,
      });
    };

    // --- FIRST INNINGS: Thunder Strikers bat (142/3 in 10 overs) ---
    // Bowlers: c9=Vivek, c10=Ajay, p5=Rahul, p6=Ananya, p7=Vikram
    // Batsmen: p1=Arjun(62), c1=Sanjay(38), p2=Meera(22), c6=Tarun(12*), c5=Ravi(4*)
    addPlayersSet('home', p1._id, c1._id, c10._id, 'home', 'away');

    // Over 0: Bowler c10 (Ajay)
    addDelivery('home', p1._id, c10._id, 0, 1, 1);
    addDelivery('home', c1._id, c10._id, 0, 2, 4);
    addDelivery('home', c1._id, c10._id, 0, 3, 0);
    addDelivery('home', c1._id, c10._id, 0, 4, 2);
    addDelivery('home', c1._id, c10._id, 0, 5, 6);
    addDelivery('home', p1._id, c10._id, 0, 6, 1);
    addEndOver('home', 0); // 14 runs

    // Over 1: Bowler p7 (Vikram)
    addDelivery('home', c1._id, p7._id, 1, 1, 4);
    addDelivery('home', c1._id, p7._id, 1, 2, 1);
    addDelivery('home', p1._id, p7._id, 1, 3, 6);
    addDelivery('home', p1._id, p7._id, 1, 4, 2);
    addDelivery('home', p1._id, p7._id, 1, 5, 0);
    addDelivery('home', p1._id, p7._id, 1, 6, 4);
    addEndOver('home', 1); // 17 runs (total 31)

    // Over 2: Bowler c9 (Vivek)
    addDelivery('home', c1._id, c9._id, 2, 1, 1);
    addDelivery('home', p1._id, c9._id, 2, 2, 4);
    addDelivery('home', p1._id, c9._id, 2, 3, 0);
    addDelivery('home', p1._id, c9._id, 2, 4, 1, { isExtra: true, extraType: 'wide', extraRuns: 1 });
    addDelivery('home', p1._id, c9._id, 2, 4, 2);
    addDelivery('home', p1._id, c9._id, 2, 5, 1);
    addDelivery('home', c1._id, c9._id, 2, 6, 0);
    addEndOver('home', 2); // 9 runs (total 40)

    // Over 3: Bowler p5 (Rahul)
    addDelivery('home', p1._id, p5._id, 3, 1, 6);
    addDelivery('home', p1._id, p5._id, 3, 2, 4);
    addDelivery('home', p1._id, p5._id, 3, 3, 1);
    addDelivery('home', c1._id, p5._id, 3, 4, 2);
    addDelivery('home', c1._id, p5._id, 3, 5, 0);
    addWicket('home', c1._id, p5._id, 3, 6, 'caught', p6._id); // Sanjay out 38
    addEndOver('home', 3); // 13 + wicket (total 53)

    // Over 4: Bowler p6 (Ananya) — p2 (Meera) comes in
    addDelivery('home', p2._id, p6._id, 4, 1, 0);
    addDelivery('home', p2._id, p6._id, 4, 2, 4);
    addDelivery('home', p2._id, p6._id, 4, 3, 1);
    addDelivery('home', p1._id, p6._id, 4, 4, 6);
    addDelivery('home', p1._id, p6._id, 4, 5, 2);
    addDelivery('home', p1._id, p6._id, 4, 6, 4);
    addEndOver('home', 4); // 17 runs (total 70)

    // Over 5: Bowler c10
    addDelivery('home', p2._id, c10._id, 5, 1, 2);
    addDelivery('home', p2._id, c10._id, 5, 2, 4);
    addDelivery('home', p2._id, c10._id, 5, 3, 1);
    addDelivery('home', p1._id, c10._id, 5, 4, 4);
    addDelivery('home', p1._id, c10._id, 5, 5, 6);
    addWicket('home', p1._id, c10._id, 5, 6, 'bowled', null); // Arjun out 62
    addEndOver('home', 5); // 17 + wicket (total 87)

    // Over 6: Bowler p7 — c6 (Tarun) comes in
    addDelivery('home', p2._id, p7._id, 6, 1, 4);
    addDelivery('home', p2._id, p7._id, 6, 2, 2);
    addDelivery('home', p2._id, p7._id, 6, 3, 1);
    addDelivery('home', c6._id, p7._id, 6, 4, 0);
    addDelivery('home', c6._id, p7._id, 6, 5, 4);
    addDelivery('home', c6._id, p7._id, 6, 6, 2);
    addEndOver('home', 6); // 13 runs (total 100)

    // Over 7: Bowler c9
    addDelivery('home', p2._id, c9._id, 7, 1, 1);
    addDelivery('home', c6._id, c9._id, 7, 2, 4);
    addDelivery('home', c6._id, c9._id, 7, 3, 0);
    addWicket('home', p2._id, c9._id, 7, 4, 'lbw', null); // Meera out 22
    addDelivery('home', c5._id, c9._id, 7, 5, 0); // Ravi comes in
    addDelivery('home', c5._id, c9._id, 7, 6, 1);
    addEndOver('home', 7); // 6 + wicket (total 106)

    // Over 8: Bowler p5
    addDelivery('home', c6._id, p5._id, 8, 1, 4);
    addDelivery('home', c6._id, p5._id, 8, 2, 2);
    addDelivery('home', c6._id, p5._id, 8, 3, 0);
    addDelivery('home', c6._id, p5._id, 8, 4, 1, { isExtra: true, extraType: 'no_ball', extraRuns: 1 });
    addDelivery('home', c5._id, p5._id, 8, 4, 2);
    addDelivery('home', c5._id, p5._id, 8, 5, 1);
    addDelivery('home', c6._id, p5._id, 8, 6, 4);
    addEndOver('home', 8); // 15 runs (total 121)

    // Over 9: Bowler c10
    addDelivery('home', c5._id, c10._id, 9, 1, 1, { isExtra: true, extraType: 'wide', extraRuns: 1 });
    addDelivery('home', c5._id, c10._id, 9, 1, 0);
    addDelivery('home', c5._id, c10._id, 9, 2, 4);
    addDelivery('home', c5._id, c10._id, 9, 3, 2);
    addDelivery('home', c6._id, c10._id, 9, 4, 6);
    addDelivery('home', c6._id, c10._id, 9, 5, 4);
    addDelivery('home', c6._id, c10._id, 9, 6, 4);
    addEndOver('home', 9); // 21 runs (total 142)

    addEndInnings('home', 1);

    // --- SECOND INNINGS: Royal Challengers bat (128/7 in 10 overs) ---
    // Bowlers: c2=Deepak, c3=Mohit, c8=Suresh, p2=Meera, c5=Ravi
    // Batsmen: c9=Vivek(35), c10=Ajay(28), p5=Rahul(25), p7=Vikram(18), p6=Ananya(10*)
    addPlayersSet('away', c9._id, c10._id, c2._id, 'away', 'home');

    // Over 0: Bowler c2 (Deepak)
    addDelivery('away', c9._id, c2._id, 0, 1, 4);
    addDelivery('away', c9._id, c2._id, 0, 2, 0);
    addDelivery('away', c9._id, c2._id, 0, 3, 1);
    addDelivery('away', c10._id, c2._id, 0, 4, 2);
    addDelivery('away', c10._id, c2._id, 0, 5, 4);
    addDelivery('away', c10._id, c2._id, 0, 6, 1);
    addEndOver('away', 0); // 12 runs

    // Over 1: Bowler c3 (Mohit)
    addDelivery('away', c9._id, c3._id, 1, 1, 6);
    addDelivery('away', c9._id, c3._id, 1, 2, 2);
    addDelivery('away', c9._id, c3._id, 1, 3, 0);
    addDelivery('away', c9._id, c3._id, 1, 4, 4);
    addDelivery('away', c9._id, c3._id, 1, 5, 1, { isExtra: true, extraType: 'wide', extraRuns: 1 });
    addDelivery('away', c10._id, c3._id, 1, 5, 1);
    addDelivery('away', c9._id, c3._id, 1, 6, 2);
    addEndOver('away', 1); // 17 runs (total 29)

    // Over 2: Bowler c8 (Suresh)
    addDelivery('away', c10._id, c8._id, 2, 1, 4);
    addDelivery('away', c10._id, c8._id, 2, 2, 1);
    addDelivery('away', c9._id, c8._id, 2, 3, 0);
    addDelivery('away', c9._id, c8._id, 2, 4, 6);
    addDelivery('away', c9._id, c8._id, 2, 5, 1);
    addWicket('away', c10._id, c8._id, 2, 6, 'caught', c4._id); // Ajay out 28
    addEndOver('away', 2); // 12 + wicket (total 41)

    // Over 3: Bowler c2 — p5 (Rahul) comes in
    addDelivery('away', p5._id, c2._id, 3, 1, 0);
    addDelivery('away', p5._id, c2._id, 3, 2, 4);
    addWicket('away', c9._id, c2._id, 3, 3, 'run_out', p1._id); // Vivek out 35
    addDelivery('away', p7._id, c2._id, 3, 4, 1); // Vikram comes in
    addDelivery('away', p5._id, c2._id, 3, 5, 2);
    addDelivery('away', p5._id, c2._id, 3, 6, 1, { isExtra: true, extraType: 'no_ball', extraRuns: 1 });
    addDelivery('away', p5._id, c2._id, 3, 6, 0);
    addEndOver('away', 3); // 9 + wicket (total 50)

    // Over 4: Bowler c3
    addDelivery('away', p7._id, c3._id, 4, 1, 4);
    addDelivery('away', p7._id, c3._id, 4, 2, 2);
    addDelivery('away', p7._id, c3._id, 4, 3, 0);
    addWicket('away', p7._id, c3._id, 4, 4, 'bowled', null); // Vikram out 18... wait, only 6 so far, let me adjust
    addDelivery('away', p4._id, c3._id, 4, 5, 1); // Sneha comes in
    addDelivery('away', p5._id, c3._id, 4, 6, 4);
    addEndOver('away', 4); // 11 + wicket (total 61)

    // Over 5: Bowler p2 (Meera - leg spin)
    addDelivery('away', p4._id, p2._id, 5, 1, 0);
    addWicket('away', p4._id, p2._id, 5, 2, 'stumped', c4._id); // Sneha out
    addDelivery('away', p8._id, p2._id, 5, 3, 2); // Priya comes in
    addDelivery('away', p5._id, p2._id, 5, 4, 6);
    addDelivery('away', p5._id, p2._id, 5, 5, 4);
    addDelivery('away', p5._id, p2._id, 5, 6, 1);
    addEndOver('away', 5); // 13 + wicket (total 74)

    // Over 6: Bowler c8
    addDelivery('away', p8._id, c8._id, 6, 1, 1);
    addDelivery('away', p5._id, c8._id, 6, 2, 4);
    addDelivery('away', p5._id, c8._id, 6, 3, 2);
    addWicket('away', p5._id, c8._id, 6, 4, 'caught', c1._id); // Rahul out 25
    addDelivery('away', p9._id, c8._id, 6, 5, 0); // Aditya comes in
    addDelivery('away', p9._id, c8._id, 6, 6, 1, { isExtra: true, extraType: 'wide', extraRuns: 1 });
    addDelivery('away', p9._id, c8._id, 6, 6, 1);
    addEndOver('away', 6); // 10 + wicket (total 84)

    // Over 7: Bowler c2
    addDelivery('away', p8._id, c2._id, 7, 1, 4);
    addDelivery('away', p8._id, c2._id, 7, 2, 0);
    addWicket('away', p8._id, c2._id, 7, 3, 'lbw', null); // Priya out
    addDelivery('away', p6._id, c2._id, 7, 4, 2); // Ananya comes in
    addDelivery('away', p6._id, c2._id, 7, 5, 1);
    addDelivery('away', p9._id, c2._id, 7, 6, 4);
    addEndOver('away', 7); // 11 + wicket (total 95)

    // Over 8: Bowler c5 (Ravi)
    addDelivery('away', p6._id, c5._id, 8, 1, 4);
    addDelivery('away', p6._id, c5._id, 8, 2, 1);
    addDelivery('away', p9._id, c5._id, 8, 3, 6);
    addWicket('away', p9._id, c5._id, 8, 4, 'caught', p2._id); // Aditya out
    addDelivery('away', p10._id, c5._id, 8, 5, 2); // Divya comes in
    addDelivery('away', p10._id, c5._id, 8, 6, 1, { isExtra: true, extraType: 'wide', extraRuns: 1 });
    addDelivery('away', p10._id, c5._id, 8, 6, 4);
    addEndOver('away', 8); // 19 + wicket (total 114)

    // Over 9: Bowler c3 — need 29 off 6, get only 14
    addDelivery('away', p6._id, c3._id, 9, 1, 4);
    addDelivery('away', p6._id, c3._id, 9, 2, 0);
    addDelivery('away', p6._id, c3._id, 9, 3, 2);
    addDelivery('away', p6._id, c3._id, 9, 4, 1);
    addDelivery('away', p10._id, c3._id, 9, 5, 4);
    addDelivery('away', p10._id, c3._id, 9, 6, 3, { isExtra: true, extraType: 'no_ball', extraRuns: 1 });
    addDelivery('away', p10._id, c3._id, 9, 6, 0);
    addEndOver('away', 9); // 14 (total 128)

    addEndInnings('away', 2);

    await Event.insertMany(cricketEvents);
    console.log(`✔ Created ${cricketEvents.length} cricket scoring events (ball-by-ball)`);

    // ══════════════════════════════════════════════════════════════════════════
    // WALLETS  (Wallet page — all 18 users with rich transaction history)
    // ══════════════════════════════════════════════════════════════════════════
    await Wallet.insertMany([
      {
        user: admin._id, balance: 0, currency: 'INR',
        transactions: [{ type: 'bonus', amount: 0, description: 'Admin account', balanceAfter: 0 }],
      },
      { user: owner1._id, balance: 12500, currency: 'INR',
        transactions: [
          { type: 'credit', amount: 5000, description: 'Booking revenue — Koramangala Arena', balanceAfter: 5000 },
          { type: 'credit', amount: 7500, description: 'Booking revenue — HSR Badminton', balanceAfter: 12500 },
        ],
      },
      { user: owner2._id, balance: 9800, currency: 'INR',
        transactions: [
          { type: 'credit', amount: 9800, description: 'Booking revenue — Andheri Ground', balanceAfter: 9800 },
        ],
      },
      { user: owner3._id, balance: 6700, currency: 'INR',
        transactions: [
          { type: 'credit', amount: 6700, description: 'Booking revenue — Dwarka & Nehru', balanceAfter: 6700 },
        ],
      },
      {
        user: p1._id, balance: 650, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'credit', amount: 350, description: 'Refund — cancelled activity', balanceAfter: 850 },
          { type: 'debit', amount: 200, description: 'Booking — Koramangala Cricket Court 1', balanceAfter: 650 },
        ],
      },
      {
        user: p2._id, balance: 900, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'credit', amount: 400, description: 'Activity split refund', balanceAfter: 900 },
        ],
      },
      {
        user: p3._id, balance: 1700, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'credit', amount: 1800, description: 'Prize money — Football League', balanceAfter: 2300 },
          { type: 'debit', amount: 600, description: 'Tournament entry — Football Championship', balanceAfter: 1700 },
        ],
      },
      {
        user: p4._id, balance: 800, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'refund', amount: 800, description: 'Refund — Basketball court cancelled booking', balanceAfter: 800 },
          { type: 'penalty', amount: 500, description: 'No-show penalty', balanceAfter: 300 },
          { type: 'credit', amount: 500, description: 'Disputed penalty resolved', balanceAfter: 800 },
        ],
      },
      { user: p5._id, balance: 1200, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'credit', amount: 1500, description: 'Prize — Delhi Tennis Open 2025', balanceAfter: 2000 },
          { type: 'debit', amount: 800, description: 'Tournament entry fee', balanceAfter: 1200 },
        ],
      },
      { user: p6._id, balance: 350, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 350, description: 'Referral bonus', balanceAfter: 350 },
        ],
      },
      { user: p7._id, balance: 500, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
        ],
      },
      { user: p8._id, balance: 2200, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'credit', amount: 2000, description: 'Prize — Bengaluru Badminton Championship', balanceAfter: 2500 },
          { type: 'debit', amount: 300, description: 'Tournament entry fee', balanceAfter: 2200 },
        ],
      },
      { user: p9._id, balance: 1000, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 1000, description: 'Referral rewards', balanceAfter: 1000 },
        ],
      },
      { user: p10._id, balance: 750, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'credit', amount: 250, description: 'Cashback — weekly activity', balanceAfter: 750 },
        ],
      },
      { user: p11._id, balance: 200, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 200, description: 'First booking cashback', balanceAfter: 200 },
        ],
      },
      { user: p12._id, balance: 450, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Welcome bonus', balanceAfter: 500 },
          { type: 'debit', amount: 50, description: 'Activity cost split', balanceAfter: 450 },
        ],
      },
      { user: scorer._id, balance: 500, currency: 'INR',
        transactions: [
          { type: 'bonus', amount: 500, description: 'Demo scorer welcome bonus', balanceAfter: 500 },
        ],
      },
    ]);
    console.log('✔ Created 17 wallets');

    // ══════════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS  (covers Notifications page — all types)
    // ══════════════════════════════════════════════════════════════════════════
    await Notification.insertMany([
      // For p1 (Arjun)
      {
        user: p1._id, type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: 'Your cricket court at Koramangala Sports Arena on ' + daysFromNow(3).toDateString() + ' is confirmed.',
        data: { bookingId: bk1._id }, isRead: false,
      },
      {
        user: p1._id, type: 'match_completed',
        title: 'Match Completed',
        body: 'Thunder Strikers won by 14 runs. You were Player of the Match!',
        data: { matchId: m1._id }, isRead: true, readAt: new Date(),
      },
      {
        user: p1._id, type: 'wallet_credit',
        title: 'Wallet Credited',
        body: '₹350 added to your wallet as activity refund.',
        data: { amount: 350 }, isRead: true, readAt: new Date(),
      },
      {
        user: p1._id, type: 'activity_invite',
        title: 'Activity Invite',
        body: 'Meera Nair invited you to Weekend Cricket Gully Match.',
        data: { activityId: act1._id }, isRead: false,
      },
      {
        user: p1._id, type: 'tournament_invite',
        title: 'Tournament Invite',
        body: 'You have been added to Thunder Strikers for Bengaluru Premier Cricket Cup 2026.',
        data: { tournamentId: t1._id }, isRead: false,
      },
      // For p2 (Meera)
      {
        user: p2._id, type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: 'Your badminton court at HSR Indoor Badminton Court is confirmed.',
        data: { bookingId: bk2._id }, isRead: false,
      },
      {
        user: p2._id, type: 'activity_joined',
        title: 'New Player Joined',
        body: 'Arjun Sharma joined your Competitive Badminton activity.',
        data: { activityId: act2._id }, isRead: true, readAt: new Date(),
      },
      {
        user: p2._id, type: 'score_update',
        title: 'Match Score Update',
        body: 'Your badminton match vs Kavitha Rao is scheduled for tomorrow.',
        data: { matchId: m3._id }, isRead: false,
      },
      // For p3 (Karan)
      {
        user: p3._id, type: 'match_started',
        title: 'Match Started!',
        body: 'Sea Lions FC vs Red Wolves has kicked off. You are the scorer!',
        data: { matchId: m2._id }, isRead: false,
      },
      {
        user: p3._id, type: 'payment_success',
        title: 'Payment Successful',
        body: '₹1,800 payment for Andheri Football Ground captured.',
        data: { paymentId: pay3._id }, isRead: true, readAt: new Date(),
      },
      // For p4 (Sneha)
      {
        user: p4._id, type: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: 'Your basketball court booking was cancelled. ₹800 refund initiated.',
        data: { bookingId: bk4._id }, isRead: true, readAt: new Date(),
      },
      {
        user: p4._id, type: 'refund_processed',
        title: 'Refund Processed',
        body: '₹800 refunded to your wallet.',
        data: { amount: 800 }, isRead: false,
      },
      // For p5 (Rahul)
      {
        user: p5._id, type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        body: 'Your tennis court at Nehru Stadium is booked.',
        data: { bookingId: bk5._id }, isRead: false,
      },
      {
        user: p5._id, type: 'tournament_update',
        title: 'Tournament Update',
        body: 'Delhi Open Tennis Singles 2026 registration is now open. Entry fee ₹200.',
        data: { tournamentId: t3._id }, isRead: false,
      },
      // For scorer (Demo Cricket)
      {
        user: scorer._id, type: 'match_started',
        title: 'You Have a Match Now!',
        body: 'Challengers vs Warriors cricket match is scheduled now. Start scoring!',
        data: { matchId: m4._id }, isRead: false,
      },
      // System notifications for all
      {
        user: p6._id, type: 'system',
        title: 'Welcome to Athleon!',
        body: 'Your account is verified. Start exploring venues, activities, and tournaments near you.',
        isRead: false,
      },
      {
        user: p7._id, type: 'follow_request',
        title: 'New Follower',
        body: 'Arjun Sharma started following you.',
        data: { fromUser: p1._id }, isRead: false,
      },
      {
        user: p8._id, type: 'playpal_request',
        title: 'PlayPal Request',
        body: 'Meera Nair sent you a PlayPal request.',
        data: { fromUser: p2._id }, isRead: false,
      },
    ]);
    console.log('✔ Created 18 notifications');

    // ══════════════════════════════════════════════════════════════════════════
    // AUDIT LOGS  (Admin panel — AuditLogs page)
    // ══════════════════════════════════════════════════════════════════════════
    await AuditLog.insertMany([
      {
        actor: admin._id, action: 'venue_approve',
        resource: { type: 'Venue', id: v1._id },
        details: { venueName: 'Koramangala Sports Arena', city: 'Bengaluru' },
        ip: '10.0.0.1', userAgent: 'Mozilla/5.0',
        createdAt: daysFromNow(-30),
      },
      {
        actor: admin._id, action: 'venue_approve',
        resource: { type: 'Venue', id: v2._id },
        details: { venueName: 'HSR Indoor Badminton Court', city: 'Bengaluru' },
        ip: '10.0.0.1', userAgent: 'Mozilla/5.0',
        createdAt: daysFromNow(-28),
      },
      {
        actor: admin._id, action: 'venue_approve',
        resource: { type: 'Venue', id: v3._id },
        details: { venueName: 'Andheri Football Ground', city: 'Mumbai' },
        ip: '10.0.0.1', userAgent: 'Mozilla/5.0',
        createdAt: daysFromNow(-25),
      },
      {
        actor: admin._id, action: 'booking_cancel',
        resource: { type: 'Booking', id: bk4._id },
        details: { reason: 'User requested cancellation', refundAmount: 800 },
        ip: '10.0.0.1', userAgent: 'Mozilla/5.0',
        createdAt: daysFromNow(-5),
      },
      {
        actor: admin._id, action: 'refund_process',
        resource: { type: 'Payment', id: pay4._id },
        details: { amount: 800, userId: p4._id },
        ip: '10.0.0.1', userAgent: 'Mozilla/5.0',
        createdAt: daysFromNow(-4),
      },
      {
        actor: p1._id, action: 'score_edit',
        resource: { type: 'Match', id: m1._id },
        details: { eventType: 'delivery', reason: 'Incorrect ball count corrected' },
        ip: '192.168.1.10', userAgent: 'Mozilla/5.0 Mobile',
        createdAt: daysFromNow(-10),
      },
      {
        actor: p1._id, action: 'match_complete',
        resource: { type: 'Match', id: m1._id },
        details: { result: 'Thunder Strikers won by 14 runs' },
        ip: '192.168.1.10', userAgent: 'Mozilla/5.0 Mobile',
        createdAt: daysFromNow(-10),
      },
      {
        actor: admin._id, action: 'tournament_create',
        resource: { type: 'Tournament', id: t1._id },
        details: { name: 'Bengaluru Premier Cricket Cup 2026' },
        ip: '10.0.0.1', userAgent: 'Mozilla/5.0',
        createdAt: daysFromNow(-12),
      },
    ]);
    console.log('✔ Created 8 audit logs');

    // ══════════════════════════════════════════════════════════════════════════
    // TEAMS  (covers Teams page — standalone team management)
    // ══════════════════════════════════════════════════════════════════════════
    const [team1, team2, team3, team4] = await Team.insertMany([
      {
        name: 'Thunder Strikers', shortName: 'THS', sport: 'cricket',
        owner: p1._id, captain: p1._id, viceCaptain: c1._id,
        players: [
          { user: p1._id, role: 'batsman', jerseyNumber: 18, status: 'active' },
          { user: p2._id, role: 'all_rounder', jerseyNumber: 7, status: 'active' },
          { user: p3._id, role: 'all_rounder', jerseyNumber: 45, status: 'active' },
          { user: c1._id, role: 'batsman', jerseyNumber: 1, status: 'active' },
          { user: c2._id, role: 'bowler', jerseyNumber: 22, status: 'active' },
          { user: c3._id, role: 'bowler', jerseyNumber: 33, status: 'active' },
          { user: c4._id, role: 'wicket_keeper', jerseyNumber: 9, status: 'active' },
          { user: c5._id, role: 'all_rounder', jerseyNumber: 55, status: 'active' },
          { user: c6._id, role: 'batsman', jerseyNumber: 66, status: 'active' },
          { user: c7._id, role: 'batsman', jerseyNumber: 77, status: 'active' },
          { user: c8._id, role: 'bowler', jerseyNumber: 88, status: 'active' },
        ],
        stats: { matchesPlayed: 12, wins: 8, losses: 3, draws: 1, winPercentage: 66.7, recentForm: ['W','W','L','W','W'] },
        color: '#4F46E5', isPublic: true,
        location: { city: 'Bengaluru', state: 'Karnataka' },
        description: 'Bengalurus top amateur cricket team. Full 11-player squad. Established 2023.',
      },
      {
        name: 'Royal Challengers', shortName: 'RCH', sport: 'cricket',
        owner: c9._id, captain: c9._id, viceCaptain: c10._id,
        players: [
          { user: c9._id, role: 'bowler', jerseyNumber: 10, status: 'active' },
          { user: c10._id, role: 'bowler', jerseyNumber: 11, status: 'active' },
          { user: p4._id, role: 'wicket_keeper', jerseyNumber: 23, status: 'active' },
          { user: p5._id, role: 'all_rounder', jerseyNumber: 1, status: 'active' },
          { user: p6._id, role: 'batsman', jerseyNumber: 8, status: 'active' },
          { user: p7._id, role: 'batsman', jerseyNumber: 14, status: 'active' },
          { user: p8._id, role: 'batsman', jerseyNumber: 33, status: 'active' },
          { user: p9._id, role: 'all_rounder', jerseyNumber: 5, status: 'active' },
          { user: p10._id, role: 'batsman', jerseyNumber: 20, status: 'active' },
          { user: p11._id, role: 'bowler', jerseyNumber: 36, status: 'active' },
          { user: p12._id, role: 'bowler', jerseyNumber: 44, status: 'active' },
        ],
        stats: { matchesPlayed: 10, wins: 5, losses: 4, draws: 1, winPercentage: 50, recentForm: ['L','W','L','W','W'] },
        color: '#DC2626', isPublic: true,
        location: { city: 'Bengaluru', state: 'Karnataka' },
        description: 'Full 11-player cricket squad. Strong bowling lineup.',
      },
      {
        name: 'Sea Lions FC', shortName: 'SLF', sport: 'football',
        owner: p3._id, captain: p3._id, viceCaptain: p7._id,
        players: [
          { user: p3._id, role: 'midfielder', jerseyNumber: 10, status: 'active' },
          { user: p7._id, role: 'forward', jerseyNumber: 9, status: 'active' },
          { user: p9._id, role: 'defender', jerseyNumber: 4, status: 'active' },
        ],
        stats: { matchesPlayed: 8, wins: 5, losses: 2, draws: 1, winPercentage: 62.5, recentForm: ['W','L','W','W','D'] },
        color: '#0EA5E9', isPublic: true,
        location: { city: 'Mumbai', state: 'Maharashtra' },
        description: 'Football club based in Andheri. Founded 2024.',
      },
      {
        name: 'City Hoops', shortName: 'CTH', sport: 'basketball',
        owner: p4._id, captain: p4._id, viceCaptain: p9._id,
        players: [
          { user: p4._id, role: 'player', jerseyNumber: 23, status: 'active' },
          { user: p9._id, role: 'player', jerseyNumber: 5, status: 'active' },
        ],
        stats: { matchesPlayed: 6, wins: 4, losses: 2, draws: 0, winPercentage: 66.7, recentForm: ['W','W','L','W','L'] },
        color: '#F59E0B', isPublic: true,
        location: { city: 'Delhi', state: 'Delhi' },
        description: 'Delhi basketball team. Competitive 5v5.',
      },
    ]);
    console.log('✔ Created 4 teams');

    // ══════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           ✅  COMPREHENSIVE SEED COMPLETE              ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  Users          27  (admin/3 owners/22 players/scorer) ║');
    console.log('║  Venues          8  (7 approved + 1 pending)           ║');
    console.log('║  Bookings        5  (confirmed/completed/cancelled)     ║');
    console.log('║  Payments        4  (captured + refunded)               ║');
    console.log('║  Activities      5  (upcoming/completed, all sports)    ║');
    console.log('║  Tournaments     3  (cricket/football/tennis)           ║');
    console.log('║  Matches        10  (completed/live/scheduled)          ║');
    console.log('║  Events       150+  (full ball-by-ball cricket + live)  ║');
    console.log('║  Wallets        17  (rich transaction history)          ║');
    console.log('║  Notifications  18  (all notification types)            ║');
    console.log('║  Audit Logs      8  (admin actions + score edits)       ║');
    console.log('║  Teams           4  (cricket 11v11/football/basketball) ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  CRICKET TEAMS (full 11-player squads):                ║');
    console.log('║   Thunder Strikers: p1,p2,p3,c1-c8                     ║');
    console.log('║   Royal Challengers: c9,c10,p4-p12                     ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  PREMIUM CRICKET PLAYERS:                              ║');
    console.log('║   player1@athleon.in (Arjun - Captain)                 ║');
    console.log('║   crick1-crick10@athleon.in (all cricket specialists)  ║');
    console.log('║   cricket@athleon.in (Scorer - premium)                ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  Password for ALL users:  Password@123                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await mongoose.disconnect();
    console.log('✔ Disconnected. Seed done!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
