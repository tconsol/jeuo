const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initQueues } = require('./config/queue');
const { startWorkers, stopWorkers } = require('./workers');
const { initRealtime } = require('./realtime');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

function checkMsg91() {
  const authKey    = process.env.OTP_AUTH_KEY;
  const templateId = process.env.OTP_TEMPLATE_ID;
  const senderId   = process.env.OTP_SENDER_ID;
  const serviceUrl = process.env.OTP_SERVICE_URL;

  const configured = authKey && templateId && senderId && serviceUrl;

  if (configured) {
    logger.info(
      `[MSG91] OK - Sender: ${senderId} | Template: ${templateId} | URL: ${serviceUrl}`
    );
  } else {
    const missing = [
      !authKey    && 'OTP_AUTH_KEY',
      !templateId && 'OTP_TEMPLATE_ID',
      !senderId   && 'OTP_SENDER_ID',
      !serviceUrl && 'OTP_SERVICE_URL',
    ].filter(Boolean);
    logger.warn(`[MSG91] ERROR - Missing config: ${missing.join(', ')}`);
  }
}

async function start() {
  try {
    await connectDB();
    await connectRedis();
    checkMsg91();
    await initQueues();
    startWorkers();

    const server = http.createServer(app);
    initRealtime(server);

    server.listen(PORT, () => {
      logger.info(`Athleon API + Realtime server running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully…`);
      server.close(async () => {
        await stopWorkers();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
