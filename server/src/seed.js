require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User         = require('./models/User');
const Venue        = require('./models/Venue');
const Activity     = require('./models/Activity');
const Tournament   = require('./models/Tournament');
const Match        = require('./models/Match');
const Booking      = require('./models/Booking');
const Payment      = require('./models/Payment');
const Notification = require('./models/Notification');
const Wallet       = require('./models/Wallet');
const Event        = require('./models/Event');
const AuditLog     = require('./models/AuditLog');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ──────────────────────────────────────────
  // CLEAN ALL COLLECTIONS
  // ──────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Venue.deleteMany({}),
    Activity.deleteMany({}),
    Tournament.deleteMany({}),
    Match.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    Wallet.deleteMany({}),
    Event.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // ──────────────────────────────────────────
  // USERS
  // ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const [admin, owner1, owner2, p1, p2, p3, p4, p5, p6] = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@athleon.in',
      password: passwordHash,
      role: 'admin',
      isVerified: true,
      phone: '9000000001',
      location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
    },
    {
      name: 'Ravi Venues',
      email: 'owner1@athleon.in',
      password: passwordHash,
      role: 'owner',
      isVerified: true,
      phone: '9000000002',
      location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
    },
    {
      name: 'Priya Sports Hub',
      email: 'owner2@athleon.in',
      password: passwordHash,
      role: 'owner',
      isVerified: true,
      phone: '9000000003',
      location: { type: 'Point', coordinates: [72.8777, 19.0760], city: 'Mumbai', state: 'Maharashtra' },
    },
    {
      name: 'Arjun Sharma',
      email: 'player1@athleon.in',
      password: passwordHash,
      role: 'player',
      isVerified: true,
      phone: '9000000011',
      sports: [{ sport: 'cricket', skillLevel: 'intermediate', position: 'Batsman' }],
      location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
    },
    {
      name: 'Meera Nair',
      email: 'player2@athleon.in',
      password: passwordHash,
      role: 'player',
      isVerified: true,
      phone: '9000000012',
      sports: [{ sport: 'badminton', skillLevel: 'advanced', position: 'Singles' }],
      location: { type: 'Point', coordinates: [77.5946, 12.9716], city: 'Bengaluru', state: 'Karnataka' },
    },
    {
      name: 'Karan Mehta',
      email: 'player3@athleon.in',
      password: passwordHash,
      role: 'player',
      isVerified: true,
      phone: '9000000013',
      sports: [{ sport: 'football', skillLevel: 'beginner', position: 'Midfielder' }],
      location: { type: 'Point', coordinates: [72.8777, 19.0760], city: 'Mumbai', state: 'Maharashtra' },
    },
    {
      name: 'Sneha Patel',
      email: 'player4@athleon.in',
      password: passwordHash,
      role: 'player',
      isVerified: true,
      phone: '9000000014',
      sports: [{ sport: 'basketball', skillLevel: 'intermediate', position: 'Guard' }],
      location: { type: 'Point', coordinates: [72.8777, 19.0760], city: 'Mumbai', state: 'Maharashtra' },
    },
    {
      name: 'Rahul Verma',
      email: 'player5@athleon.in',
      password: passwordHash,
      role: 'player',
      isVerified: true,
      phone: '9000000015',
      sports: [{ sport: 'tennis', skillLevel: 'professional', position: 'Singles' }],
      location: { type: 'Point', coordinates: [77.2090, 28.6139], city: 'Delhi', state: 'Delhi' },
    },
    {
      name: 'Ananya Singh',
      email: 'player6@athleon.in',
      password: passwordHash,
      role: 'player',
      isVerified: true,
      phone: '9000000016',
      sports: [{ sport: 'volleyball', skillLevel: 'intermediate', position: 'Setter' }],
      location: { type: 'Point', coordinates: [77.2090, 28.6139], city: 'Delhi', state: 'Delhi' },
    },
  ]);
  console.log(`Created ${9} users`);

  // ──────────────────────────────────────────
  // VENUES
  // ──────────────────────────────────────────
  const [venue1, venue2, venue3] = await Venue.insertMany([
    {
      owner: owner1._id,
      isApproved: true,
      isActive: true,
      name: 'Koramangala Sports Arena',
      description: 'Premium multi-sport facility with floodlights and turf courts.',
      images: [],
      location: {
        type: 'Point',
        coordinates: [77.6244, 12.9352],
        address: '80 Feet Road, Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      },
      sports: ['cricket', 'badminton', 'football'],
      amenities: ['parking', 'changing_room', 'water', 'floodlights'],
      surfaceType: 'turf',
      isIndoor: false,
      maxPlayers: 22,
      courtCount: 3,
      openTime: '06:00',
      closeTime: '23:00',
      offDays: [],
      slots: [
        { startTime: '06:00', endTime: '08:00', price: 800,  sport: 'cricket',  isAvailable: true },
        { startTime: '08:00', endTime: '10:00', price: 1000, sport: 'cricket',  isAvailable: true },
        { startTime: '10:00', endTime: '12:00', price: 600,  sport: 'football', isAvailable: true },
        { startTime: '18:00', endTime: '20:00', price: 1200, sport: 'cricket',  isAvailable: true },
        { startTime: '20:00', endTime: '22:00', price: 400,  sport: 'badminton',isAvailable: true },
      ],
      weekendPriceMultiplier: 1.3,
      cancellationPolicy: 'moderate',
      cancellationHours: 24,
    },
    {
      owner: owner1._id,
      isApproved: true,
      isActive: true,
      name: 'HSR Indoor Badminton Court',
      description: 'Dedicated badminton facility with 4 synthetic courts.',
      images: [],
      location: {
        type: 'Point',
        coordinates: [77.6472, 12.9116],
        address: 'Sector 6, HSR Layout',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
      },
      sports: ['badminton'],
      amenities: ['parking', 'water', 'washroom'],
      surfaceType: 'wood',
      isIndoor: true,
      maxPlayers: 8,
      courtCount: 4,
      openTime: '05:30',
      closeTime: '22:00',
      offDays: [],
      slots: [
        { startTime: '05:30', endTime: '07:00', price: 300, sport: 'badminton', isAvailable: true },
        { startTime: '07:00', endTime: '09:00', price: 400, sport: 'badminton', isAvailable: true },
        { startTime: '17:00', endTime: '19:00', price: 450, sport: 'badminton', isAvailable: true },
        { startTime: '19:00', endTime: '21:00', price: 500, sport: 'badminton', isAvailable: true },
      ],
      weekendPriceMultiplier: 1.2,
      cancellationPolicy: 'flexible',
      cancellationHours: 6,
    },
    {
      owner: owner2._id,
      isApproved: true,
      isActive: true,
      name: 'Andheri Football Ground',
      description: 'Full-size football turf with changing rooms and spectator stands.',
      images: [],
      location: {
        type: 'Point',
        coordinates: [72.8479, 19.1136],
        address: 'Andheri Sports Complex, J B Nagar',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400059',
      },
      sports: ['football', 'cricket'],
      amenities: ['parking', 'changing_room', 'water', 'washroom', 'floodlights'],
      surfaceType: 'turf',
      isIndoor: false,
      maxPlayers: 22,
      courtCount: 1,
      openTime: '06:00',
      closeTime: '22:00',
      offDays: [0],
      slots: [
        { startTime: '06:00', endTime: '08:00', price: 1500, sport: 'football', isAvailable: true },
        { startTime: '08:00', endTime: '10:00', price: 1800, sport: 'football', isAvailable: true },
        { startTime: '18:00', endTime: '20:00', price: 2000, sport: 'football', isAvailable: true },
        { startTime: '20:00', endTime: '22:00', price: 2200, sport: 'football', isAvailable: true },
      ],
      weekendPriceMultiplier: 1.5,
      cancellationPolicy: 'strict',
      cancellationHours: 48,
    },
  ]);
  console.log(`Created 3 venues`);

  // ──────────────────────────────────────────
  // ACTIVITIES
  // ──────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await Activity.insertMany([
    {
      creator: p1._id,
      venue: venue1._id,
      title: 'Weekend Cricket Friendly',
      sport: 'cricket',
      date: tomorrow,
      startTime: '08:00',
      endTime: '10:00',
      duration: 120,
      location: {
        type: 'Point',
        coordinates: [77.6244, 12.9352],
        address: '80 Feet Road, Koramangala',
        city: 'Bengaluru',
      },
      maxPlayers: 22,
      minPlayers: 10,
      players: [
        { user: p1._id, status: 'confirmed', team: 'A' },
        { user: p2._id, status: 'confirmed', team: 'B' },
        { user: p3._id, status: 'pending',   team: 'none' },
      ],
      visibility: 'public',
      requireApproval: false,
      skillLevel: 'intermediate',
      costPerPlayer: 200,
      splitPayment: true,
      status: 'upcoming',
      description: 'Casual friendly cricket match. All skill levels welcome!',
    },
    {
      creator: p2._id,
      venue: venue2._id,
      title: 'Badminton Doubles Practice',
      sport: 'badminton',
      date: tomorrow,
      startTime: '07:00',
      endTime: '09:00',
      duration: 120,
      location: {
        type: 'Point',
        coordinates: [77.6472, 12.9116],
        address: 'Sector 6, HSR Layout',
        city: 'Bengaluru',
      },
      maxPlayers: 8,
      minPlayers: 4,
      players: [
        { user: p2._id, status: 'confirmed', team: 'none' },
        { user: p1._id, status: 'confirmed', team: 'none' },
      ],
      visibility: 'public',
      requireApproval: true,
      skillLevel: 'advanced',
      costPerPlayer: 150,
      splitPayment: true,
      status: 'upcoming',
      description: 'Looking for advanced doubles players.',
    },
    {
      creator: p3._id,
      venue: venue3._id,
      title: 'Football 5v5 – Mumbai',
      sport: 'football',
      date: nextWeek,
      startTime: '18:00',
      endTime: '20:00',
      duration: 120,
      location: {
        type: 'Point',
        coordinates: [72.8479, 19.1136],
        address: 'Andheri Sports Complex',
        city: 'Mumbai',
      },
      maxPlayers: 10,
      minPlayers: 6,
      players: [
        { user: p3._id, status: 'confirmed', team: 'A' },
        { user: p4._id, status: 'confirmed', team: 'B' },
      ],
      visibility: 'public',
      requireApproval: false,
      skillLevel: 'any',
      costPerPlayer: 250,
      splitPayment: true,
      status: 'upcoming',
      description: '5-a-side football. Bring your friends!',
    },
  ]);
  console.log(`Created 3 activities`);

  // ──────────────────────────────────────────
  // TOURNAMENTS
  // ──────────────────────────────────────────
  const twoWeeks = new Date();
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  const threeWeeks = new Date();
  threeWeeks.setDate(threeWeeks.getDate() + 21);

  await Tournament.insertMany([
    {
      creator: owner1._id,
      name: 'Bengaluru Cricket Cup 2025',
      sport: 'cricket',
      description: 'Annual T20 cricket tournament open to all clubs in Bengaluru.',
      banner: '',
      rules: 'Standard ICC T20 rules apply. No professional players.',
      format: 'group_knockout',
      maxTeams: 8,
      playersPerTeam: 11,
      matchFormat: { overs: 20, powerplayOvers: 6 },
      teams: [
        { name: 'Thunder Strikers', players: [p1._id] },
        { name: 'Royal Challengers',  players: [p2._id] },
        { name: 'City Warriors',      players: [p3._id] },
        { name: 'Blazing Rockets',    players: [p4._id] },
      ],
      fixtures: [],
      entryFee: 1000,
      prizePool: 17500,
      venues: [venue1._id],
      registrationDeadline: twoWeeks,
      startDate: twoWeeks,
      endDate: threeWeeks,
      status: 'registration_open',
      isPublic: true,
      location: { city: 'Bengaluru', state: 'Karnataka' },
    },
    {
      creator: owner2._id,
      name: 'Mumbai Football Premier League',
      sport: 'football',
      description: '7-a-side football league across 5 weekends.',
      banner: '',
      rules: 'Standard football rules. Each match 2x20 min halves.',
      format: 'league',
      maxTeams: 6,
      playersPerTeam: 7,
      matchFormat: { halfDuration: 20 },
      teams: [
        { name: 'Sea Lions',      players: [p3._id] },
        { name: 'City Kickers',   players: [p4._id] },
        { name: 'Red Devils FC',  players: [p5._id] },
      ],
      fixtures: [],
      entryFee: 500,
      prizePool: 22500,
      venues: [venue3._id],
      registrationDeadline: nextWeek,
      startDate: nextWeek,
      endDate: threeWeeks,
      status: 'registration_open',
      isPublic: true,
      location: { city: 'Mumbai', state: 'Maharashtra' },
    },
  ]);
  console.log(`Created 2 tournaments`);

  // ──────────────────────────────────────────
  // MATCHES (1 completed cricket, 1 live football, 1 scheduled badminton)
  // ──────────────────────────────────────────
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

  const [matchCricket, matchFootball, matchBadminton] = await Match.insertMany([
    {
      sport: 'cricket',
      venue: venue1._id,
      format: { overs: 20, innings: 1 },
      teams: {
        home: { name: 'Thunder Strikers', players: [p1._id, p2._id], captain: p1._id },
        away: { name: 'Royal Challengers', players: [p3._id, p4._id], captain: p3._id },
      },
      scorers: [p1._id],
      toss: { wonBy: 'home', decision: 'bat' },
      scoreSnapshot: {
        home: { runs: 167, wickets: 5, overs: 20 },
        away: { runs: 141, wickets: 8, overs: 20 },
      },
      state: { currentInnings: 2, currentOver: 20, currentBall: 0 },
      status: 'completed',
      result: {
        winner: 'home',
        summary: 'Thunder Strikers won by 26 runs',
        margin: '26 runs',
        playerOfMatch: p1._id,
      },
      scheduledAt: yesterday,
      startedAt: yesterday,
      completedAt: yesterday,
    },
    {
      sport: 'football',
      venue: venue3._id,
      format: { halfDuration: 45, extraTime: false, penalties: false },
      teams: {
        home: { name: 'Sea Lions', players: [p3._id, p5._id], captain: p3._id },
        away: { name: 'Red Devils FC', players: [p4._id, p6._id], captain: p4._id },
      },
      scorers: [p3._id],
      toss: { wonBy: 'away', decision: 'kick-off' },
      scoreSnapshot: { home: { goals: 2 }, away: { goals: 1 } },
      state: { half: 2, minute: 67 },
      status: 'live',
      scheduledAt: new Date(),
      startedAt: new Date(),
    },
    {
      sport: 'badminton',
      venue: venue2._id,
      format: { pointsToWin: 21, bestOf: 3 },
      teams: {
        home: { name: 'Meera', players: [p2._id], captain: p2._id },
        away: { name: 'Arjun', players: [p1._id], captain: p1._id },
      },
      scorers: [p2._id],
      status: 'scheduled',
      scheduledAt: tomorrow,
    },
  ]);
  console.log('Created 3 matches');

  // ──────────────────────────────────────────
  // BOOKINGS (confirmed, cancelled, completed)
  // ──────────────────────────────────────────
  const bookingDate1 = new Date(); bookingDate1.setDate(bookingDate1.getDate() + 2);
  const bookingDate2 = new Date(); bookingDate2.setDate(bookingDate2.getDate() + 3);
  const bookingDate3 = new Date(); bookingDate3.setDate(bookingDate3.getDate() - 3);

  const [booking1, booking2, booking3] = await Booking.insertMany([
    {
      venue: venue1._id,
      user: p1._id,
      date: bookingDate1,
      slot: { startTime: '08:00', endTime: '10:00' },
      sport: 'cricket',
      court: 1,
      basePrice: 1000,
      discount: 0,
      tax: 180,
      totalAmount: 1180,
      walletAmountUsed: 0,
      paymentStatus: 'paid',
      paymentId: 'pay_seed_001',
      razorpayOrderId: 'order_seed_001',
      status: 'confirmed',
    },
    {
      venue: venue2._id,
      user: p2._id,
      date: bookingDate2,
      slot: { startTime: '07:00', endTime: '09:00' },
      sport: 'badminton',
      court: 2,
      basePrice: 400,
      discount: 40,
      tax: 65,
      totalAmount: 425,
      walletAmountUsed: 100,
      paymentStatus: 'paid',
      paymentId: 'pay_seed_002',
      razorpayOrderId: 'order_seed_002',
      status: 'confirmed',
    },
    {
      venue: venue3._id,
      user: p3._id,
      date: bookingDate3,
      slot: { startTime: '18:00', endTime: '20:00' },
      sport: 'football',
      court: 1,
      basePrice: 2000,
      discount: 0,
      tax: 360,
      totalAmount: 2360,
      walletAmountUsed: 0,
      paymentStatus: 'refunded',
      paymentId: 'pay_seed_003',
      razorpayOrderId: 'order_seed_003',
      status: 'cancelled',
      cancelledAt: bookingDate3,
      cancelledBy: p3._id,
      cancellationReason: 'Rain cancelled the game',
      refundAmount: 2000,
      refundStatus: 'processed',
    },
  ]);
  console.log('Created 3 bookings');

  // ──────────────────────────────────────────
  // PAYMENTS
  // ──────────────────────────────────────────
  await Payment.insertMany([
    {
      user: p1._id,
      booking: booking1._id,
      amount: 1180,
      currency: 'INR',
      razorpayOrderId: 'order_seed_001',
      razorpayPaymentId: 'pay_seed_001',
      razorpaySignature: 'sig_seed_001',
      status: 'captured',
      metadata: { source: 'seed' },
    },
    {
      user: p2._id,
      booking: booking2._id,
      amount: 425,
      currency: 'INR',
      razorpayOrderId: 'order_seed_002',
      razorpayPaymentId: 'pay_seed_002',
      razorpaySignature: 'sig_seed_002',
      status: 'captured',
      splits: [
        { recipient: p1._id, amount: 212, settled: true },
        { recipient: p2._id, amount: 213, settled: true },
      ],
    },
    {
      user: p3._id,
      booking: booking3._id,
      amount: 2360,
      currency: 'INR',
      razorpayOrderId: 'order_seed_003',
      razorpayPaymentId: 'pay_seed_003',
      razorpaySignature: 'sig_seed_003',
      status: 'refunded',
      refunds: [{
        amount: 2000,
        razorpayRefundId: 'rfnd_seed_001',
        reason: 'Venue cancellation',
        status: 'processed',
        processedAt: bookingDate3,
      }],
    },
    {
      user: p4._id,
      amount: 500,
      currency: 'INR',
      razorpayOrderId: 'order_seed_004',
      status: 'failed',
      metadata: { failureReason: 'Insufficient funds' },
    },
  ]);
  console.log('Created 4 payments');

  // ──────────────────────────────────────────
  // WALLETS (one per user)
  // ──────────────────────────────────────────
  await Wallet.insertMany([
    {
      user: admin._id, balance: 0, currency: 'INR',
      transactions: [],
    },
    {
      user: p1._id, balance: 350, currency: 'INR',
      transactions: [
        { type: 'bonus',    amount: 500, description: 'Welcome bonus',            balanceAfter: 500 },
        { type: 'debit',    amount: 200, description: 'Activity cost split',      reference: String(booking1._id), referenceModel: 'Booking', balanceAfter: 300 },
        { type: 'cashback', amount: 50,  description: '5% cashback on booking',   balanceAfter: 350 },
      ],
    },
    {
      user: p2._id, balance: 900, currency: 'INR',
      transactions: [
        { type: 'credit', amount: 1000, description: 'Added via Razorpay', balanceAfter: 1000 },
        { type: 'debit',  amount: 100,  description: 'Wallet used for booking', reference: String(booking2._id), referenceModel: 'Booking', balanceAfter: 900 },
      ],
    },
    {
      user: p3._id, balance: 2000, currency: 'INR',
      transactions: [
        { type: 'refund', amount: 2000, description: 'Refund for cancelled booking', reference: String(booking3._id), referenceModel: 'Booking', balanceAfter: 2000 },
      ],
    },
    {
      user: p4._id, balance: 0, currency: 'INR', transactions: [] },
    { user: p5._id, balance: 500, currency: 'INR',
      transactions: [
        { type: 'bonus', amount: 500, description: 'Referral bonus', balanceAfter: 500 },
      ],
    },
    {
      user: p6._id, balance: 200, currency: 'INR',
      transactions: [
        { type: 'credit', amount: 200, description: 'Tournament prize', balanceAfter: 200 },
      ],
    },
  ]);
  console.log('Created 7 wallets');

  // ──────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────
  await Notification.insertMany([
    {
      user: p1._id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed!',
      body: 'Your cricket slot at Koramangala Sports Arena on Sunday 08:00–10:00 is confirmed.',
      data: { bookingId: booking1._id },
      isRead: true,
      readAt: new Date(),
      channels: { push: true, email: true, sms: false },
      deliveryStatus: { push: 'sent', email: 'sent', sms: 'na' },
    },
    {
      user: p2._id,
      type: 'activity_invite',
      title: "You've been invited to a Badminton match!",
      body: 'Arjun Sharma has invited you to a Badminton Doubles session tomorrow at 07:00.',
      data: {},
      isRead: false,
      channels: { push: true, email: false, sms: false },
      deliveryStatus: { push: 'sent', email: 'na', sms: 'na' },
    },
    {
      user: p3._id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      body: 'Your football slot on Sunday has been cancelled. Refund of ₹2000 is being processed.',
      data: { bookingId: booking3._id, refundAmount: 2000 },
      isRead: false,
      channels: { push: true, email: true, sms: false },
      deliveryStatus: { push: 'sent', email: 'sent', sms: 'na' },
    },
    {
      user: p3._id,
      type: 'refund_processed',
      title: 'Refund Processed',
      body: '₹2000 has been credited to your wallet.',
      data: { amount: 2000 },
      isRead: false,
      channels: { push: true, email: false, sms: false },
      deliveryStatus: { push: 'sent', email: 'na', sms: 'na' },
    },
    {
      user: p4._id,
      type: 'payment_failed',
      title: 'Payment Failed',
      body: 'Your payment of ₹500 for the activity could not be processed. Please retry.',
      data: {},
      isRead: false,
      channels: { push: true, email: true, sms: false },
      deliveryStatus: { push: 'sent', email: 'sent', sms: 'na' },
    },
    {
      user: p1._id,
      type: 'match_completed',
      title: 'Match Result: Thunder Strikers won!',
      body: 'Thunder Strikers beat Royal Challengers by 26 runs. You were the Player of the Match!',
      data: { matchId: matchCricket._id },
      isRead: true,
      readAt: new Date(),
      channels: { push: true, email: false, sms: false },
      deliveryStatus: { push: 'sent', email: 'na', sms: 'na' },
    },
    {
      user: p5._id,
      type: 'wallet_credit',
      title: 'Wallet Credited',
      body: '₹500 referral bonus has been added to your wallet.',
      data: { amount: 500 },
      isRead: true,
      readAt: new Date(),
      channels: { push: true, email: false, sms: false },
      deliveryStatus: { push: 'sent', email: 'na', sms: 'na' },
    },
    {
      user: p1._id,
      type: 'follow_request',
      title: 'New Follower',
      body: 'Meera Nair started following you.',
      data: { followerId: p2._id },
      isRead: false,
      channels: { push: true, email: false, sms: false },
      deliveryStatus: { push: 'sent', email: 'na', sms: 'na' },
    },
    {
      user: owner1._id,
      type: 'booking_confirmed',
      title: 'New Booking at Koramangala Sports Arena',
      body: 'Arjun Sharma booked Cricket court 1 on Sunday 08:00–10:00.',
      data: { bookingId: booking1._id },
      isRead: false,
      channels: { push: true, email: true, sms: false },
      deliveryStatus: { push: 'sent', email: 'sent', sms: 'na' },
    },
    {
      user: p2._id,
      type: 'tournament_invite',
      title: 'Tournament Invitation',
      body: "You've been invited to join the Bengaluru Cricket Cup 2025!",
      data: {},
      isRead: false,
      channels: { push: true, email: false, sms: false },
      deliveryStatus: { push: 'pending', email: 'na', sms: 'na' },
    },
  ]);
  console.log('Created 10 notifications');

  // ──────────────────────────────────────────
  // SCORING EVENTS (cricket match — 5 deliveries + 1 wicket)
  // ──────────────────────────────────────────
  await Event.insertMany([
    {
      match: matchCricket._id, scorer: p1._id,
      idempotencyKey: 'seed_evt_001', sequence: 1,
      sport: 'cricket', type: 'delivery', team: 'home', player: p1._id,
      payload: { runs: 4, isExtra: false, overNumber: 1, ballInOver: 1, strikerSwap: false },
    },
    {
      match: matchCricket._id, scorer: p1._id,
      idempotencyKey: 'seed_evt_002', sequence: 2,
      sport: 'cricket', type: 'delivery', team: 'home', player: p1._id,
      payload: { runs: 0, isExtra: false, overNumber: 1, ballInOver: 2, strikerSwap: false },
    },
    {
      match: matchCricket._id, scorer: p1._id,
      idempotencyKey: 'seed_evt_003', sequence: 3,
      sport: 'cricket', type: 'delivery', team: 'home', player: p1._id,
      payload: { runs: 6, isExtra: false, overNumber: 1, ballInOver: 3, strikerSwap: false },
    },
    {
      match: matchCricket._id, scorer: p1._id,
      idempotencyKey: 'seed_evt_004', sequence: 4,
      sport: 'cricket', type: 'extra', team: 'home', player: p1._id,
      payload: { runs: 0, isExtra: true, extraType: 'wide', extraRuns: 1, overNumber: 1, ballInOver: 3 },
    },
    {
      match: matchCricket._id, scorer: p1._id,
      idempotencyKey: 'seed_evt_005', sequence: 5,
      sport: 'cricket', type: 'wicket', team: 'home', player: p1._id,
      payload: { runs: 0, isExtra: false, wicketType: 'caught', overNumber: 1, ballInOver: 4 },
    },
    {
      match: matchFootball._id, scorer: p3._id,
      idempotencyKey: 'seed_evt_006', sequence: 1,
      sport: 'football', type: 'goal', team: 'home', player: p3._id,
      payload: { minute: 23, isOwnGoal: false, isPenalty: false },
    },
    {
      match: matchFootball._id, scorer: p3._id,
      idempotencyKey: 'seed_evt_007', sequence: 2,
      sport: 'football', type: 'goal', team: 'away', player: p4._id,
      payload: { minute: 41, isOwnGoal: false, isPenalty: true },
    },
    {
      match: matchFootball._id, scorer: p3._id,
      idempotencyKey: 'seed_evt_008', sequence: 3,
      sport: 'football', type: 'goal', team: 'home', player: p5._id,
      payload: { minute: 67, isOwnGoal: false, isPenalty: false },
    },
  ]);
  console.log('Created 8 scoring events');

  // ──────────────────────────────────────────
  // AUDIT LOGS
  // ──────────────────────────────────────────
  await AuditLog.insertMany([
    {
      actor: admin._id,
      action: 'venue_approve',
      resource: { type: 'Venue', id: venue1._id },
      details: { reason: 'All documents verified', venueName: 'Koramangala Sports Arena' },
      ip: '127.0.0.1',
      userAgent: 'seed-script',
    },
    {
      actor: admin._id,
      action: 'venue_approve',
      resource: { type: 'Venue', id: venue3._id },
      details: { reason: 'All documents verified', venueName: 'Andheri Football Ground' },
      ip: '127.0.0.1',
      userAgent: 'seed-script',
    },
    {
      actor: p1._id,
      action: 'booking_create',
      resource: { type: 'Booking', id: booking1._id },
      details: { venue: 'Koramangala Sports Arena', sport: 'cricket', amount: 1180 },
      ip: '192.168.1.10',
      userAgent: 'Mozilla/5.0 (seed)',
    },
    {
      actor: p3._id,
      action: 'booking_cancel',
      resource: { type: 'Booking', id: booking3._id },
      details: { reason: 'Rain cancelled the game', refundAmount: 2000 },
      ip: '192.168.1.20',
      userAgent: 'Mozilla/5.0 (seed)',
    },
    {
      actor: admin._id,
      action: 'refund_process',
      resource: { type: 'Booking', id: booking3._id },
      details: { razorpayRefundId: 'rfnd_seed_001', amount: 2000 },
      ip: '127.0.0.1',
      userAgent: 'seed-script',
    },
    {
      actor: p1._id,
      action: 'match_complete',
      resource: { type: 'Match', id: matchCricket._id },
      details: { result: 'Thunder Strikers won by 26 runs' },
      ip: '192.168.1.10',
      userAgent: 'Athléon Scorer App',
    },
    {
      actor: admin._id,
      action: 'tournament_create',
      resource: { type: 'Tournament', id: null },
      details: { name: 'Bengaluru Cricket Cup 2025', sport: 'cricket' },
      ip: '127.0.0.1',
      userAgent: 'seed-script',
    },
  ]);
  console.log('Created 7 audit logs');

  // ──────────────────────────────────────────
  // UPDATE USER SOCIAL LINKS (followers / following)
  // ──────────────────────────────────────────
  await User.findByIdAndUpdate(p1._id, {
    followers: [p2._id, p3._id],
    following: [p2._id],
    playpals: [p2._id],
    gamesPlayed: 8, reliabilityScore: 100,
    rating: 4.5, totalRatings: 4, ratingSum: 18,
  });
  await User.findByIdAndUpdate(p2._id, {
    followers: [p1._id],
    following: [p1._id, p3._id],
    playpals: [p1._id],
    gamesPlayed: 12, reliabilityScore: 95,
    rating: 4.8, totalRatings: 6, ratingSum: 28.8,
  });
  await User.findByIdAndUpdate(p3._id, {
    following: [p1._id],
    gamesPlayed: 5, reliabilityScore: 80,
  });
  console.log('Updated user social data');

  // ──────────────────────────────────────────
  // UPDATE VENUE RATINGS
  // ──────────────────────────────────────────
  await Venue.findByIdAndUpdate(venue1._id, { rating: 4.6, totalRatings: 34, ratingSum: 156.4, totalBookings: 87 });
  await Venue.findByIdAndUpdate(venue2._id, { rating: 4.8, totalRatings: 22, ratingSum: 105.6, totalBookings: 60 });
  await Venue.findByIdAndUpdate(venue3._id, { rating: 4.2, totalRatings: 18, ratingSum: 75.6,  totalBookings: 43 });
  console.log('Updated venue ratings');

  // ──────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('════════════════════════════════════════════════════');
  console.log('  Login credentials  (password: Password@123)');
  console.log('════════════════════════════════════════════════════');
  console.log('  admin@athleon.in    — admin');
  console.log('  owner1@athleon.in   — owner  (Bengaluru)');
  console.log('  owner2@athleon.in   — owner  (Mumbai)');
  console.log('  player1@athleon.in  — Arjun  (cricket, Bengaluru)');
  console.log('  player2@athleon.in  — Meera  (badminton, Bengaluru)');
  console.log('  player3@athleon.in  — Karan  (football, Mumbai)');
  console.log('  player4@athleon.in  — Sneha  (basketball, Mumbai)');
  console.log('  player5@athleon.in  — Rahul  (tennis, Delhi)');
  console.log('  player6@athleon.in  — Ananya (volleyball, Delhi)');
  console.log('════════════════════════════════════════════════════');
  console.log('  Collections seeded:');
  console.log('  Users(9) Venues(3) Activities(3) Tournaments(2)');
  console.log('  Matches(3) Bookings(3) Payments(4) Wallets(7)');
  console.log('  Notifications(10) Events(8) AuditLogs(7)');
  console.log('════════════════════════════════════════════════════');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
