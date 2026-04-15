const SPORTS = {
  CRICKET: 'cricket',
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennis',
  BADMINTON: 'badminton',
  TABLE_TENNIS: 'table_tennis',
  VOLLEYBALL: 'volleyball',
};

const SPORT_LIST = Object.values(SPORTS);

const ROLES = { PLAYER: 'player', OWNER: 'owner', ADMIN: 'admin' };

const MATCH_STATUS = { SCHEDULED: 'scheduled', LIVE: 'live', COMPLETED: 'completed', CANCELLED: 'cancelled' };

const BOOKING_STATUS = { LOCKED: 'locked', CONFIRMED: 'confirmed', CANCELLED: 'cancelled', COMPLETED: 'completed' };

const ACTIVITY_STATUS = { OPEN: 'open', FULL: 'full', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', CANCELLED: 'cancelled' };

const TOURNAMENT_STATUS = { DRAFT: 'draft', UPCOMING: 'upcoming', ONGOING: 'ongoing', COMPLETED: 'completed', CANCELLED: 'cancelled' };

const TOURNAMENT_FORMAT = { KNOCKOUT: 'knockout', LEAGUE: 'league', GROUP_KNOCKOUT: 'group_knockout' };

const PAYMENT_STATUS = { PENDING: 'pending', SUCCESS: 'success', FAILED: 'failed', REFUNDED: 'refunded' };

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'];

const AMENITIES = ['parking', 'changing_rooms', 'showers', 'drinking_water', 'floodlights', 'first_aid', 'cafeteria', 'wifi'];

const SCORING_EVENTS = {
  cricket: ['delivery', 'wicket', 'end_over', 'end_innings', 'extra', 'penalty_runs', 'retired'],
  football: ['goal', 'yellow_card', 'red_card', 'substitution', 'corner', 'shot', 'half_time', 'full_time', 'penalty_shootout_start', 'penalty_kick'],
  basketball: ['field_goal_2pt', 'field_goal_3pt', 'free_throw', 'rebound', 'assist', 'steal', 'block', 'turnover', 'foul', 'timeout', 'quarter_end'],
  tennis: ['point', 'ace', 'double_fault', 'winner', 'unforced_error'],
  badminton: ['rally_point', 'service_fault', 'let'],
  table_tennis: ['rally_point', 'service_fault', 'let'],
  volleyball: ['rally_point', 'timeout', 'substitution'],
};

const DEFAULT_CONFIGS = {
  cricket: { overs: 20, playersPerTeam: 11 },
  football: { halfDuration: 45, extraTime: false, playersPerTeam: 11 },
  basketball: { quarters: 4, quarterMinutes: 12, playersPerTeam: 5 },
  tennis: { sets: 3, tiebreakFinalSet: true },
  badminton: { bestOf: 3, pointsPerGame: 21 },
  table_tennis: { bestOf: 5, pointsPerGame: 11 },
  volleyball: { bestOf: 5, pointsPerSet: 25, finalSetPoints: 15 },
};

module.exports = {
  SPORTS, SPORT_LIST, ROLES, MATCH_STATUS, BOOKING_STATUS, ACTIVITY_STATUS,
  TOURNAMENT_STATUS, TOURNAMENT_FORMAT, PAYMENT_STATUS, SKILL_LEVELS, AMENITIES,
  SCORING_EVENTS, DEFAULT_CONFIGS,
};
