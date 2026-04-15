const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const logger = require('../config/logger');

let notificationWorker = null;

function createNotificationWorker() {
  const redis = getRedis();

  // Notification worker — sends push notifications via FCM
  notificationWorker = new Worker(
    'notification',
    async (job) => {
      const { userId, type, message, data } = job.data;
      logger.info({ userId, type }, 'Processing notification job');

      // FCM push notification (placeholder — replace with actual FCM SDK)
      // const admin = require('firebase-admin');
      // const user = await User.findById(userId).select('devices');
      // const tokens = user?.devices?.map(d => d.fcmToken).filter(Boolean);
      // if (tokens?.length) {
      //   await admin.messaging().sendEachForMulticast({
      //     tokens,
      //     notification: { title: type, body: message },
      //     data: data ? JSON.stringify(data) : undefined,
      //   });
      // }

      logger.info({ userId, type }, 'Notification sent');
    },
    { connection: redis, concurrency: 10 }
  );

  notificationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Notification job failed');
  });

  return notificationWorker;
}

module.exports = { createNotificationWorker, getWorker: () => notificationWorker };
