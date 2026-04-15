/**
 * Shared utility functions used across client and server.
 */

/**
 * Format currency in INR.
 */
exports.formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

/**
 * Format a date for display.
 */
exports.formatDate = (date, options = {}) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...options,
  });
};

/**
 * Format time (HH:mm).
 */
exports.formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Truncate text with ellipsis.
 */
exports.truncate = (text, len = 100) => {
  if (!text || text.length <= len) return text;
  return text.slice(0, len) + '…';
};

/**
 * Calculate distance between two geo points (Haversine formula).
 * Returns distance in kilometers.
 */
exports.getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function toRad(deg) { return deg * (Math.PI / 180); }

/**
 * Generate initials from a name.
 */
exports.getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

/**
 * Deep merge objects (shallow for arrays).
 */
exports.deepMerge = (target, source) => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = exports.deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

/**
 * Slugify a string.
 */
exports.slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
