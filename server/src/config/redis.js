const Redis = require('ioredis');
const logger = require('./logger');

let redis = null;

const connectRedis = async () => {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error('Redis error:', err));

  return redis;
};

const getRedis = () => {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
};

module.exports = { connectRedis, getRedis };
