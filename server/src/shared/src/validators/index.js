const { SPORT_LIST, SKILL_LEVELS, AMENITIES, TOURNAMENT_FORMAT } = require('../constants');

function isValidPhone(phone) {
  return /^\+?[1-9]\d{9,14}$/.test(phone);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidOtp(otp) {
  return /^\d{4,6}$/.test(otp);
}

function isValidSport(sport) {
  return SPORT_LIST.includes(sport);
}

function isValidSkillLevel(level) {
  return SKILL_LEVELS.includes(level);
}

function isValidAmenity(amenity) {
  return AMENITIES.includes(amenity);
}

function isValidTournamentFormat(format) {
  return Object.values(TOURNAMENT_FORMAT).includes(format);
}

function isValidMongoId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function isValidPincode(pincode) {
  return /^\d{6}$/.test(pincode);
}

function isValidTimeSlot(startTime, endTime) {
  return /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && startTime < endTime;
}

module.exports = {
  isValidPhone, isValidEmail, isValidOtp, isValidSport, isValidSkillLevel,
  isValidAmenity, isValidTournamentFormat, isValidMongoId, isValidPincode, isValidTimeSlot,
};
