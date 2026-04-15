const featureFlags = {
  wallet: process.env.FEATURE_WALLET === 'true',
  tournaments: process.env.FEATURE_TOURNAMENTS === 'true',
  chat: process.env.FEATURE_CHAT === 'true',
  offlineScoring: process.env.FEATURE_OFFLINE_SCORING === 'true',
};

const isFeatureEnabled = (feature) => featureFlags[feature] === true;

module.exports = { featureFlags, isFeatureEnabled };
