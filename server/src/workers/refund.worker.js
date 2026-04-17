const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const logger = require('../config/logger');
const PaymentService = require('../services/payment.service');

let refundWorker = null;

function createRefundWorker() {
  const redis = getRedis();

  // Refund worker   processes refunds with exponential backoff
  refundWorker = new Worker(
    'refund',
    async (job) => {
      const { paymentId, amount, reason } = job.data;
      logger.info({ paymentId, amount, attempt: job.attemptsMade + 1 }, 'Processing refund job');

      await PaymentService.processRefund(paymentId, amount, reason);

      logger.info({ paymentId }, 'Refund processed');
    },
    {
      connection: redis,
      concurrency: 3,
      settings: {
        backoffStrategy: (attemptsMade) => {
          // Exponential backoff: 5s, 25s, 125s, 625s, 3125s
          return Math.pow(5, attemptsMade) * 1000;
        },
      },
    }
  );

  refundWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, paymentId: job?.data?.paymentId, err: err.message, attempts: job?.attemptsMade }, 'Refund job failed');
  });

  return refundWorker;
}

module.exports = { createRefundWorker, getWorker: () => refundWorker };
