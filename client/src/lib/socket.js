import { io } from 'socket.io-client';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:5000';

let matchSocketVar = null;
let notifSocketVar = null;

// Socket container objects that always export the same reference
export const matchSocket = {
  get current() { return matchSocketVar; },
  on: (...args) => matchSocketVar?.on(...args),
  off: (...args) => matchSocketVar?.off(...args),
  emit: (...args) => matchSocketVar?.emit(...args),
  connect: () => matchSocketVar?.connect(),
  disconnect: () => matchSocketVar?.disconnect(),
};

export const notificationSocket = {
  get current() { return notifSocketVar; },
  on: (...args) => notifSocketVar?.on(...args),
  off: (...args) => notifSocketVar?.off(...args),
  emit: (...args) => notifSocketVar?.emit(...args),
  connect: () => notifSocketVar?.connect(),
  disconnect: () => notifSocketVar?.disconnect(),
};

export function connectMatchSocket(token) {
  if (matchSocketVar?.connected) return matchSocketVar;
  matchSocketVar = io(`${REALTIME_URL}/match`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  return matchSocketVar;
}

export function connectNotificationSocket(token) {
  if (notifSocketVar?.connected) return notifSocketVar;
  notifSocketVar = io(`${REALTIME_URL}/notifications`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });
  return notifSocketVar;
}

export function disconnectMatchSocket() {
  matchSocketVar?.disconnect();
  matchSocketVar = null;
}

export function disconnectNotificationSocket() {
  notifSocketVar?.disconnect();
  notifSocketVar = null;
}

export function getMatchSocket() { return matchSocketVar; }
export function getNotifSocket() { return notifSocketVar; }
