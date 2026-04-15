/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string[]} roles
 * @property {boolean} isActive
 * @property {{sport: string, skillLevel: string}[]} sports
 * @property {string[]} followers
 * @property {string[]} following
 * @property {string[]} playpals
 */

/**
 * @typedef {Object} Venue
 * @property {string} _id
 * @property {string} name
 * @property {string} [description]
 * @property {string} owner
 * @property {{line1: string, city: string, state: string, pincode: string}} address
 * @property {{type: string, coordinates: number[]}} location
 * @property {string[]} sports
 * @property {string[]} amenities
 * @property {Court[]} courts
 * @property {string} status
 */

/**
 * @typedef {Object} Court
 * @property {string} name
 * @property {string} sport
 * @property {number} pricePerSlot
 * @property {{startTime: string, endTime: string}[]} slots
 */

/**
 * @typedef {Object} Booking
 * @property {string} _id
 * @property {string} user
 * @property {string} venue
 * @property {string} court
 * @property {string} date
 * @property {number} slotIndex
 * @property {string} status
 * @property {number} amount
 */

/**
 * @typedef {Object} Match
 * @property {string} _id
 * @property {string} sport
 * @property {string} status
 * @property {Object} liveScore
 * @property {number} scoreVersion
 * @property {Object} sportConfig
 * @property {{name: string, players: {user: string, name: string}[]}[]} teams
 */

/**
 * @typedef {Object} ScoringEvent
 * @property {string} _id
 * @property {string} match
 * @property {string} type
 * @property {Object} data
 * @property {number} sequence
 * @property {boolean} isUndone
 * @property {string} idempotencyKey
 */

/**
 * @typedef {Object} Tournament
 * @property {string} _id
 * @property {string} name
 * @property {string} sport
 * @property {string} format
 * @property {number} maxTeams
 * @property {string} status
 * @property {{name: string, players: string[]}[]} teams
 * @property {Object[]} fixtures
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} [message]
 * @property {Object} [data]
 */

module.exports = {};
