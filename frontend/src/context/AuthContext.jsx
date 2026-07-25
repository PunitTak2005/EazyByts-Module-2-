import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import api from '@/services/api.js';
import { useTheme } from '@/context/ThemeContext';

// Base API URI
export const API_URL = import.meta.env.VITE_API_URL || '/api';
axios.defaults.baseURL = API_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('token') || sessionStorage.getItem('token') || null
  );
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  // Set auth headers on boot
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Load user profile on boot (and whenever the token changes after login).
   *
   * StrictMode safety:
   * React StrictMode mounts every component twice in development. Without a
   * cleanup function this effect fires twice, creating two concurrent
   * api.get('/users/profile') calls. The api.js deduplication interceptor
   * cancels the FIRST request when the SECOND arrives — producing the
   * `CanceledError` that was previously logged as an error.
   *
   * Fix:
   * 1. Create an AbortController for each effect invocation.
   * 2. Pass its signal to api.get() — api.js now chains it correctly (see api.js).
   * 3. The cleanup function aborts the controller → api.js aborts the in-flight request.
   * 4. The second mount starts a fresh, unaborted request → completes correctly.
   * 5. CanceledError in catch → silently ignored (dev-only debug note).
   * 6. setLoading(false) only fires if the request was NOT cancelled — so the
   *    StrictMode first-mount cleanup never resolves the loading state prematurely.
   */
  useEffect(() => {
    // Each effect invocation owns its own AbortController
    const controller = new AbortController();

    const fetchProfile = async () => {
      const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!currentToken) {
        // No token at all — user is not logged in. Resolve loading immediately.
        setLoading(false);
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;

        // Pass the signal — api.js chains it to the deduplication controller
        const { data } = await api.get('/users/profile', { signal: controller.signal });
        setUser({ ...data, token: currentToken });
      } catch (error) {
        // ── Cancellation: expected lifecycle event ──────────────────────────
        // Occurs when:
        //   • StrictMode cleanup aborts the first-mount request (development)
        //   • A newer fetchProfile call supersedes this one
        //   • Component unmounts during initialization
        // None of these are errors. Never log out or set error state.
        if (axios.isCancel(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          if (import.meta.env.DEV) {
            console.debug('[Auth] Profile request cancelled (expected during cleanup — not an error).');
          }
          // Do NOT call setLoading(false) here — the second mount will complete
          // the request successfully and call setLoading(false) itself.
          return;
        }

        // ── Real authentication failure ─────────────────────────────────────
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
          // Token is invalid or expired and refresh failed — force logout
          if (import.meta.env.DEV) {
            console.warn(`[Auth] Profile fetch rejected (${status}). Clearing invalid session.`);
          }
          logout();
        } else if (!error?.response) {
          // Network error — don't log out, just fail gracefully
          if (import.meta.env.DEV) {
            console.warn('[Auth] Profile fetch failed (network error). Will retry on next navigation.');
          }
        } else {
          // Unexpected server error
          if (import.meta.env.DEV) {
            console.error('[Auth] Unexpected error fetching user profile:', error.message ?? error);
          }
        }
      } finally {
        // Only resolve the loading state if this request was NOT cancelled.
        // If it was cancelled (StrictMode first-mount), the second mount's
        // successful completion will call setLoading(false) instead.
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    // Cleanup: abort any in-flight profile request when the effect re-runs
    // (StrictMode double-mount, token change) or when AuthProvider unmounts.
    return () => {
      controller.abort();
    };
  }, [token]); // Re-run only when the stored token actually changes (login/logout)

  // Login handler
  const login = async (email, password, rememberMe) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });

      setUser({ ...data.user, token: data.token });
      setToken(data.token);

      // Apply the user's saved theme from the backend on login
      if (data.user?.preferences?.theme) {
        setTheme(data.user.preferences.theme);
      }

      if (rememberMe) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed. Invalid email or password.');
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setUser({ ...data.user, token: data.token });
      setToken(data.token);

      // Apply the user's saved theme from the backend on register
      if (data.user?.preferences?.theme) {
        setTheme(data.user.preferences.theme);
      }

      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed.');
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setTheme('system');
  };

  // Update profile handler
  const updateProfile = async (profileData) => {
    try {
      const { data } = await api.put('/users/profile', profileData);
      setUser(prev => ({ ...prev, ...data }));
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Change password handler
  const changePassword = async (newPassword) => {
    try {
      const { data } = await api.patch('/users/password', { newPassword });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password.');
    }
  };

  // Delete account handler
  const deleteAccount = async () => {
    try {
      const { data } = await api.delete('/users/account');
      logout();
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete account.');
    }
  };

  // Forgot password handler
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
        return;
      }
      throw new Error(error.response?.data?.message || 'Failed to request password reset.');
    }
  };

  // Reset password handler
  const resetPassword = async (token, newPassword) => {
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset password.');
    }
  };

  // Quick balance refresh helper — silently handles cancellation
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/users/profile');
      setUser(prev => ({ ...prev, ...data }));
    } catch (error) {
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
        return; // Cancelled — no-op
      }
      if (import.meta.env.DEV) {
        console.error('[Auth] Failed to sync user data:', error.message ?? error);
      }
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (data?.avatar) {
        setUser(prev => ({ ...prev, avatar: data.avatar }));
      }
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload avatar.');
    }
  };

  const removeAvatar = async () => {
    try {
      const { data } = await api.delete('/users/profile/avatar');
      setUser(prev => ({ ...prev, avatar: data?.avatar || '' }));
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove avatar.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        forgotPassword,
        resetPassword,
        refreshUser,
        uploadAvatar,
        removeAvatar,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
