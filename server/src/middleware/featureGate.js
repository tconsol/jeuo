const { isFeatureEnabled } = require('../config/features');

const featureGate = (feature) => (req, res, next) => {
  if (!isFeatureEnabled(feature)) {
    return res.status(403).json({ error: `Feature "${feature}" is currently disabled` });
  }
  next();
};

module.exports = featureGate;
