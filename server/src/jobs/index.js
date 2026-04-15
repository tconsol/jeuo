/**
 * Job definitions for BullMQ queues.
 * Each exported function enqueues a job onto the appropriate queue.
 */
const { getQueue } = require('../config/queue');
const logger = require('../config/logger');

async function enqueueNotification({ userId, type, message, data }) {
  const queue = getQueue('notification');
  if (!queue) return logger.warn('Notification queue not available');
  await queue.add('send-notification', { userId, type, message, data }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}

async function enqueueEmail({ to, subject, html, template, data }) {
  const queue = getQueue('email');
  if (!queue) return logger.warn('Email queue not available');
  await queue.add('send-email', { to, subject, html, template, data }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 200,
  });
}

async function enqueueRefund({ paymentId, amount, reason }) {
  const queue = getQueue('refund');
  if (!queue) return logger.warn('Refund queue not available');
  await queue.add('process-refund', { paymentId, amount, reason }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 500,
  });
}

async function enqueueScoreRecalculation({ matchId }) {
  const queue = getQueue('score-recalculation');
  if (!queue) return logger.warn('Score recalculation queue not available');
  await queue.add('recalculate-score', { matchId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  });
}

module.exports = {
  enqueueNotification,
  enqueueEmail,
  enqueueRefund,
  enqueueScoreRecalculation,
};
