/**
 * SocketContext.jsx
 *
 * StrictMode-safe singleton Socket.IO architecture with backend health check,
 * bounded retries, and fallback error handling.
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext.jsx';
import { API_URL } from '@/services/api';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

// Module-level singleton — survives StrictMode double-invoke
let _socketInstance = null;
let _connectedUserId = null;

/**
 * Resolves the backend Socket server URL cleanly without guessing.
 */
const getTargetSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL || API_URL || '';
  if (apiUrl) {
    // Strip trailing /api or /
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

/**
 * Checks backend health before establishing socket connection.
 */
const verifySocketHealth = async (targetUrl) => {
  try {
    const healthUrl = `${targetUrl.replace(/\/+$/, '')}/api/health`;
    const res = await fetch(healthUrl, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return data && data.socket !== false;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Socket Health Check] Verification failed:', err.message);
    }
    return false;
  }
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const userId = user?._id || user?.id || null;

  useEffect(() => {
    let isCancelled = false;

    // ── User logged out: clean up socket ──────────────
    if (!userId) {
      if (_socketInstance) {
        if (import.meta.env.DEV) {
          console.log('[Socket] User logged out — disconnecting socket.');
        }
        _socketInstance.disconnect();
        _socketInstance = null;
        _connectedUserId = null;
      }
      socketRef.current = null;
      return;
    }

    // ── Already connected for this user: reuse singleton ──────────
    if (_socketInstance && _connectedUserId === userId) {
      socketRef.current = _socketInstance;
      return;
    }

    // ── Disconnect stale socket if user switched accounts ──────────
    if (_socketInstance && _connectedUserId !== userId) {
      _socketInstance.disconnect();
      _socketInstance = null;
      _connectedUserId = null;
    }

    const initSocket = async () => {
      const targetUrl = getTargetSocketUrl();

      if (import.meta.env.DEV) {
        console.log('[Socket Diagnostic] Target Socket URL:', targetUrl);
      }

      // Check health endpoint before connecting
      const isSocketSupported = await verifySocketHealth(targetUrl);
      if (isCancelled) return;

      if (!isSocketSupported) {
        if (import.meta.env.DEV) {
          console.log('[Socket Diagnostic] Backend health indicates Socket.IO server is disabled/serverless. Skipping connection.');
        }
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const socket = io(targetUrl, {
        path: '/socket.io/',
        withCredentials: true,
        auth: token ? { token } : undefined,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        autoConnect: false,
      });

      socket.on('connect', () => {
        if (import.meta.env.DEV) {
          console.log(`[Socket Diagnostic] Connected successfully! Session ID: ${socket.id} | Transport: ${socket.io.engine.transport.name}`);
        }
        socket.emit('register_user', userId);
      });

      socket.io.on('reconnect_attempt', (attempt) => {
        if (import.meta.env.DEV) {
          console.log(`[Socket Diagnostic] Reconnection attempt #${attempt}`);
        }
      });

      socket.io.on('reconnect_failed', () => {
        console.warn('[Socket Diagnostic] Reconnection limit reached (5 attempts). Stopping socket client to prevent console spam.');
        socket.disconnect();
        _socketInstance = null;
      });

      socket.on('connect_error', (err) => {
        if (import.meta.env.DEV) {
          console.warn('[Socket Diagnostic] Connection error:', err.message);
        }
      });

      socket.on('disconnect', (reason) => {
        if (import.meta.env.DEV) {
          console.log('[Socket Diagnostic] Disconnected. Reason:', reason);
        }
      });

      socket.on('notification', (data) => {
        toast(data.message || 'New notification', {
          icon: '🔔',
          duration: 4000,
        });
      });

      _socketInstance = socket;
      _connectedUserId = userId;
      socketRef.current = socket;

      socket.connect();
    };

    initSocket();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
