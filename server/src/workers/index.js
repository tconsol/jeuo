const logger = require('../config/logger');

// Import worker creators (not instances)
const { createNotificationWorker, getWorker: getNotificationWorker } = require('./notification.worker');
const { createEmailWorker, getWorker: getEmailWorker } = require('./email.worker');
const { createRefundWorker, getWorker: getRefundWorker } = require('./refund.worker');
const { createScoreRecalcWorker, getWorker: getScoreRecalcWorker } = require('./score-recalc.worker');

function startWorkers() {
  // Create workers after Redis is initialized
  createNotificationWorker();
  createEmailWorker();
  createRefundWorker();
  createScoreRecalcWorker();
  
  logger.info('All background workers started');
  logger.info({ workers: ['notification', 'email', 'refund', 'score-recalculation'] }, 'Active workers');
}

async function stopWorkers() {
  await Promise.all([
    getNotificationWorker()?.close(),
    getEmailWorker()?.close(),
    getRefundWorker()?.close(),
    getScoreRecalcWorker()?.close(),
  ].filter(Boolean));
  logger.info('All workers stopped');
}

module.exports = { startWorkers, stopWorkers };
