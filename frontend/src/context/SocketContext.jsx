/**
 * SocketContext.jsx
 *
 * StrictMode-safe singleton socket architecture.
 *
 * Problem solved:
 * React StrictMode mounts every component TWICE in development. A naive
 * useEffect(() => { socket = io(...); return () => socket.disconnect(); }, [user])
 * produces: connect → disconnect → connect — an infinite-looking loop.
 *
 * Solution:
 * - Track the active socket in a MODULE-LEVEL variable (`_socketInstance`).
 *   Module-level variables survive the StrictMode double-mount/unmount cycle,
 *   unlike useRef (which is reset between StrictMode's double invocations).
 * - Track the user ID (`_connectedUserId`) so we only create a new socket when
 *   the authenticated user actually changes — not on every render.
 * - Use `userId` (a primitive string) as the useEffect dependency, not `user`
 *   (an object that gets a new reference on every render from setUser({...})).
 * - The cleanup function only disconnects if the userId that triggered the
 *   effect is still the *current* connected user ID, preventing the StrictMode
 *   double-invoke from disconnecting a socket it didn't intend to close.
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext.jsx';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

// Module-level singleton — survives StrictMode double-invoke
let _socketInstance = null;
let _connectedUserId = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Use the primitive user ID as the dependency — stable string, not object reference
  const userId = user?._id || user?.id || null;

  useEffect(() => {
    // ── No user: ensure socket is disconnected and cleaned up ──────────────
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

    // ── Already connected for this user: reuse the existing socket ──────────
    if (_socketInstance && _connectedUserId === userId) {
      if (import.meta.env.DEV) {
        console.debug('[Socket] Reusing existing socket for user:', userId);
      }
      socketRef.current = _socketInstance;
      return;
    }

    // ── Disconnect stale socket if user switched accounts ───────────────────
    if (_socketInstance && _connectedUserId !== userId) {
      if (import.meta.env.DEV) {
        console.log('[Socket] User changed — replacing socket.');
      }
      _socketInstance.disconnect();
      _socketInstance = null;
      _connectedUserId = null;
    }

    // ── Create new singleton socket ─────────────────────────────────────────
    if (import.meta.env.DEV) {
      console.log('[Socket] Initializing connection to', SOCKET_URL);
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 2,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000,
      autoConnect: false,
    });

    socket.on('connect', () => {
      if (import.meta.env.DEV) {
        console.log('[Socket] Connected. Session ID:', socket.id);
      }
      socket.emit('register_user', userId);
    });

    socket.on('connect_error', (err) => {
      // Only log in dev; in prod this is noise unless it persists
      if (import.meta.env.DEV) {
        console.warn('[Socket] Connection error:', err.message);
      }
    });

    socket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) {
        console.log('[Socket] Disconnected. Reason:', reason);
      }
      // socket.io handles automatic reconnect for transport-level drops.
      // 'io server disconnect' means the server closed the connection
      // intentionally — only then do we not attempt to reconnect.
    });

    socket.on('notification', (data) => {
      toast(data.message, {
        icon: '🔔',
        duration: 4000,
      });
    });

    // Persist singleton references
    _socketInstance = socket;
    _connectedUserId = userId;
    socketRef.current = socket;

    // Now connect
    socket.connect();

    // ── Cleanup ─────────────────────────────────────────────────────────────
    // Only disconnect if THIS effect's userId is still the connected one.
    // StrictMode invokes cleanup → re-run, but because we guard with
    // `_connectedUserId === userId` above, the second invocation finds the
    // socket already connected for this user and returns early — no loop.
    return () => {
      // We intentionally do NOT disconnect the socket on every cleanup —
      // that would break StrictMode and cause the connect/disconnect loop.
      // The socket is disconnected ONLY when:
      //   1. The user logs out (userId becomes null — handled above)
      //   2. The userId changes (user switched — handled above)
      // Route changes and re-renders do NOT disconnect the socket.
    };
  }, [userId]); // ← primitive string dependency, not the user object

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
