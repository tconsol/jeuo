const { Queue, Worker } = require('bullmq');
const { getRedis } = require('./redis');
const logger = require('./logger');

const queues = {};

const initQueues = async () => {
  const connection = getRedis();

  const queueNames = [
    'notifications',
    'emails',
    'sms',
    'refunds',
    'score-recalculation',
    'audit-log',
  ];

  for (const name of queueNames) {
    queues[name] = new Queue(name, { connection });
    logger.info(`Queue "${name}" initialized`);
  }
};

const getQueue = (name) => {
  if (!queues[name]) throw new Error(`Queue "${name}" not found`);
  return queues[name];
};

module.exports = { initQueues, getQueue };
