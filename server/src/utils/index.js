const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generate a JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
}

/**
 * Generate a JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
}

/**
 * Generate a random OTP of given length
 */
function generateOTP(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Generate a unique idempotency key
 */
function generateIdempotencyKey() {
  return crypto.randomUUID();
}

/**
 * Hash a string with SHA-256
 */
function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Paginate a Mongoose query
 */
function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { skip: (p - 1) * l, limit: l, page: p };
}

/**
 * Build a pagination response
 */
function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/**
 * Pick allowed fields from an object
 */
function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
}

/**
 * Omit fields from an object
 */
function omit(obj, keys) {
  const out = { ...obj };
  keys.forEach((k) => delete out[k]);
  return out;
}

/**
 * Safely parse JSON with fallback
 */
function safeJSON(str, fallback = null) {
  try { return JSON.parse(str); } catch { return fallback; }
}

/**
 * Delay helper for retries
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format Indian Rupee amount
 */
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
  generateIdempotencyKey,
  sha256,
  paginate,
  paginationMeta,
  pick,
  omit,
  safeJSON,
  delay,
  formatINR,
};
