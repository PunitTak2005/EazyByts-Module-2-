import { useState, useCallback } from 'react';

const STORAGE_KEY = 'market_ticker_prefs';

const DEFAULT_PREFS = {
  speed: 35,           // seconds for one full scroll cycle
  position: 'top',    // 'top' | 'bottom'
  filter: 'all',      // 'all' | 'gainers' | 'losers'
  pauseOnHover: true,
  showCompanyName: false,
  showSparkline: true,
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function useTickerPreferences() {
  const [prefs, setPrefsState] = useState(loadPrefs);

  const setPrefs = useCallback((updater) => {
    setPrefsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage might be full or unavailable
      }
      return next;
    });
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefsState(DEFAULT_PREFS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFS));
    } catch {}
  }, []);

  return { prefs, setPrefs, resetPrefs };
}
