export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function formatTime(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(d);
}

export function formatRelativeTime(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export function truncate(str, maxLen = 100) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getDistanceLabel(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export { SportIcon, getSportIcon } from './sportIcons';

/** @deprecated Use SportIcon component instead */
export function sportIcon(sport) {
  return sport || '';
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getVenueImageUrl(venue, index = 0) {
  // Use venue images from backend if available
  if (venue.images && venue.images.length > index && venue.images[index]) {
    return venue.images[index];
  }
  // Return first image if index doesn't exist
  if (venue.images && venue.images.length > 0) {
    return venue.images[0];
  }
  // Fallback placeholder
  return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22600%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%239ca3af%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image Available%3C/text%3E%3C/svg%3E';
}

export function getUnsplashImageUrl(query, width = 600, height = 400) {
  const sanitized = query.replace(/\s+/g, ',').toLowerCase();
  return `https://source.unsplash.com/${width}x${height}/?${sanitized}`;
}
