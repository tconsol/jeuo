/**
 * Centralised sport icon registry.
 * All components use icons from this file instead of hardcoded emojis.
 */
import {
  GiCricketBat,
  GiSoccerBall,
  GiBasketballBall,
  GiTennisBall,
  GiShuttlecock,
  GiVolleyballBall,
  GiPingPongBat,
} from 'react-icons/gi';
import { FiAward } from 'react-icons/fi';

export const SPORT_ICON_MAP = {
  cricket:      GiCricketBat,
  football:     GiSoccerBall,
  basketball:   GiBasketballBall,
  tennis:       GiTennisBall,
  badminton:    GiShuttlecock,
  volleyball:   GiVolleyballBall,
  table_tennis: GiPingPongBat,
  'table-tennis': GiPingPongBat,
  swimming:     FiAward,
  athletics:    FiAward,
};

/**
 * Renders the icon component for a sport.
 * @param {string} sport  - sport key (e.g. 'cricket')
 * @param {number} size   - icon size in px (default 24)
 * @param {string} className - additional class names
 */
export function SportIcon({ sport, size = 24, className = '' }) {
  const key = sport?.toLowerCase?.().replace(/[\s-]/g, '_') || '';
  const Icon = SPORT_ICON_MAP[key] || FiAward;
  return <Icon size={size} className={className} />;
}

/**
 * Returns the react-icons component class for a sport.
 * Use when you need to render the icon yourself.
 */
export function getSportIcon(sport) {
  const key = sport?.toLowerCase?.().replace(/[\s-]/g, '_') || '';
  return SPORT_ICON_MAP[key] || FiAward;
}
