/* ─── Sports ─── */
exports.SPORTS = ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'table_tennis', 'volleyball'];

exports.SPORT_LABELS = {
  cricket: 'Cricket',
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
  badminton: 'Badminton',
  table_tennis: 'Table Tennis',
  volleyball: 'Volleyball',
};

/* ─── Roles ─── */
exports.ROLES = ['player', 'owner', 'trainer', 'admin'];

/* ─── Booking Statuses ─── */
exports.BOOKING_STATUS = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];

/* ─── Match Statuses ─── */
exports.MATCH_STATUS = ['upcoming', 'live', 'paused', 'completed', 'abandoned'];

/* ─── Payment Statuses ─── */
exports.PAYMENT_STATUS = ['created', 'authorized', 'captured', 'failed', 'refunded'];

/* ─── Tournament Formats ─── */
exports.TOURNAMENT_FORMATS = ['knockout', 'league', 'group_knockout'];

/* ─── Notification Types ─── */
exports.NOTIFICATION_TYPES = ['booking', 'match', 'activity', 'tournament', 'payment', 'social', 'system'];

/* ─── Scoring Event Types per Sport ─── */
exports.SCORING_EVENTS = {
  cricket: ['ball', 'wicket', 'over_complete', 'extras', 'penalty', 'innings_change', 'retired', 'timeout'],
  football: ['goal', 'own_goal', 'penalty_kick', 'yellow_card', 'red_card', 'second_yellow', 'substitution', 'foul', 'offside', 'corner', 'shot', 'half_time', 'full_time', 'extra_time_start', 'extra_half_time', 'penalty_shootout_start', 'penalty_kick'],
  basketball: ['field_goal_2pt', 'field_goal_3pt', 'free_throw', 'rebound', 'steal', 'block', 'turnover', 'foul', 'timeout', 'quarter_end'],
  tennis: ['point', 'ace', 'double_fault', 'winner_shot', 'unforced_error'],
  badminton: ['rally_point', 'service_fault', 'let'],
  table_tennis: ['rally_point', 'service_fault', 'let'],
  volleyball: ['rally_point', 'timeout', 'substitution', 'rotation'],
};

/* ─── Default Sport Configs ─── */
exports.DEFAULT_CONFIGS = {
  cricket: { overs: 20, powerplayOvers: 6 },
  football: { halfDuration: 45, extraTime: false, penalties: false },
  basketball: { quarters: 4, quarterDuration: 12, foulLimit: 6 },
  tennis: { sets: 3, gamesPerSet: 6, tiebreakAt: 6, finalSetTiebreak: true },
  badminton: { sport: 'badminton', gamesPerMatch: 3 },
  table_tennis: { sport: 'table_tennis', gamesPerMatch: 5 },
  volleyball: { setsToWin: 3, totalSets: 5, pointsPerSet: 25, decidingSetPoints: 15 },
};

/* ─── Skill Levels ─── */
exports.SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'];

/* ─── Amenities ─── */
exports.AMENITIES = [
  'parking', 'changing_rooms', 'showers', 'cafeteria', 'first_aid',
  'drinking_water', 'floodlights', 'seating', 'wifi', 'equipment_rental',
];
