const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { Redis } = require('ioredis');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Attach Socket.io to an existing HTTP server.
 * Call after Redis is connected.
 */
function initRealtime(httpServer) {
  const CORS_ORIGIN = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

  const redisOpts = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  const pubClient = new Redis(redisOpts);
  const subClient = new Redis(redisOpts);

  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN.split(',').map((s) => s.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.adapter(createAdapter(pubClient, subClient));

  // JWT auth middleware — allow unauthenticated for public rooms
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      socket.user = null;
      return next();
    }
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  setupMatchNamespace(io);
  setupNotificationNamespace(io);

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id, userId: socket.user?.id }, 'Client connected');
    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Client disconnected');
    });
  });

  // Subscribe to Redis pub/sub for cross-service score/notification broadcasting
  const subscriber = new Redis(redisOpts);
  subscriber.psubscribe('match:*:score', 'match:*:status', 'user:*:notifications');
  subscriber.on('pmessage', (_pattern, channel, message) => {
    try {
      const data = JSON.parse(message);
      const parts = channel.split(':');
      if (channel.includes(':score') || channel.includes(':status')) {
        io.of('/match').to(`match:${parts[1]}`).emit(
          channel.includes(':score') ? 'score:update' : 'match:status',
          data
        );
      } else if (channel.includes(':notifications')) {
        io.of('/notifications').to(`user:${parts[1]}`).emit('notification', data);
      }
    } catch (err) {
      logger.error({ err, channel }, 'pub/sub error');
    }
  });

  logger.info('Socket.io realtime attached');
  return io;
}

function setupMatchNamespace(io) {
  io.of('/match').on('connection', (socket) => {
    socket.on('join:match', (matchId) => {
      socket.join(`match:${matchId}`);
      logger.debug({ matchId }, 'Joined match room');
    });
    socket.on('leave:match', (matchId) => socket.leave(`match:${matchId}`));
    socket.on('score:event', (data, callback) => {
      if (!socket.user) return callback?.({ error: 'Authentication required' });
      socket.to(`match:${data.matchId}`).emit('score:optimistic', {
        event: data,
        timestamp: Date.now(),
      });
      callback?.({ received: true });
    });
  });
}

function setupNotificationNamespace(io) {
  const notifNs = io.of('/notifications');
  notifNs.use((socket, next) => {
    if (!socket.user) return next(new Error('Authentication required'));
    next();
  });
  notifNs.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    logger.debug({ userId: socket.user.id }, 'Joined notification room');
  });
}

module.exports = { initRealtime };
