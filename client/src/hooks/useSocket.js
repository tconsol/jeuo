import { useEffect, useRef, useCallback } from 'react';
import { connectMatchSocket, disconnectMatchSocket, getMatchSocket } from '../lib/socket';

export function useSocket(matchId) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !matchId) return;

    const socket = connectMatchSocket(token);
    socketRef.current = socket;

    socket.emit('join:match', matchId);

    return () => {
      socket.emit('leave:match', matchId);
    };
  }, [matchId]);

  const on = useCallback((event, handler) => {
    const socket = getMatchSocket();
    socket?.on(event, handler);
    return () => socket?.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    const socket = getMatchSocket();
    socket?.emit(event, data);
  }, []);

  return { socket: socketRef.current, on, emit };
}
