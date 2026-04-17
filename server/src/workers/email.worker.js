const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const logger = require('../config/logger');

let emailWorker = null;

function createEmailWorker() {
  const redis = getRedis();

  // Email worker   sends transactional emails
  emailWorker = new Worker(
    'email',
    async (job) => {
      const { to, subject, html, template, data } = job.data;
      logger.info({ to, subject }, 'Processing email job');

      // Nodemailer / SendGrid / SES implementation placeholder
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransport({
      //   host: process.env.SMTP_HOST,
      //   port: process.env.SMTP_PORT,
      //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // });
      // await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });

      logger.info({ to }, 'Email sent');
    },
    { connection: redis, concurrency: 5 }
  );

  emailWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Email job failed');
  });

  return emailWorker;
}

module.exports = { createEmailWorker, getWorker: () => emailWorker };
