import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '@/services/api.js';

const ThemeContext = createContext(null);

// Helper to safely check system preference
const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  // 1. Core theme state (what the user selected)
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return 'system';
  });

  // 2. Track OS-level system theme changes directly
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // 3. Compute resolved theme synchronously during render!
  // This eliminates the one-frame flash/jitter that happens when resolvedTheme is updated inside a useEffect.
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';

  const themeAbortRef = useRef(null);

  // Sync OS-level preference changes if user is on 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers (e.g. older Safari)
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  // Apply the resolved theme to the DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  // Sync theme preference across browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Update theme and persist to backend.
   *
   * CanceledError handling:
   * - The api.js interceptor cancels duplicate in-flight requests.
   * - React StrictMode double-invokes effects, which can trigger two rapid calls.
   * - We cancel any previous in-flight theme sync ourselves (themeAbortRef) so
   *   only the latest call reaches the backend.
   * - A cancellation is EXPECTED and SILENT — it is never an application error.
   * - Only genuine network/server errors are logged.
   */
  const updateTheme = async (newTheme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) return;
    
    // Apply state and storage immediately
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return; // Not authenticated — nothing to sync

    // Cancel previous in-flight sync for this preference
    if (themeAbortRef.current) {
      themeAbortRef.current.abort();
    }
    const controller = new AbortController();
    themeAbortRef.current = controller;

    try {
      await api.put('/users/preferences/theme', { theme: newTheme }, {
        signal: controller.signal,
      });
    } catch (error) {
      // Cancellation is expected (StrictMode double-invoke, rapid toggle, navigation).
      // Treat it as a no-op — never show a user-facing error for it.
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        if (import.meta.env.DEV) {
          console.debug('[ThemeContext] Theme sync cancelled (expected — no action needed).');
        }
        return;
      }

      // Only log genuine errors (network failure, 4xx, 5xx)
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        // Auth errors — silently skip; AuthContext handles token refresh globally
        return;
      }

      console.error('[ThemeContext] Failed to sync theme preference with backend:', error.message ?? error);
    } finally {
      // Clear ref only if this controller is still the current one
      if (themeAbortRef.current === controller) {
        themeAbortRef.current = null;
      }
    }
  };

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    updateTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      isDark,
      setTheme: updateTheme,
      updateTheme,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
