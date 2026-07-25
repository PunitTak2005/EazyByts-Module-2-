import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { useTickerPreferences } from '@/hooks/useTickerPreferences';
import Marquee from 'react-fast-marquee';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  X,
  ChevronDown,
  Activity,
  RotateCcw,
} from 'lucide-react';

import { formatCurrency, formatPercent, isValidStockData } from '@/utils/formatters.js';

// ─── Utility helpers ──────────────────────────────────────────────────────────

const formatPrice = (price, currency = 'INR') => {
  return formatCurrency(price);
};

const formatChange = (change, pct) => {
  return formatPercent(pct);
};

const formatVolume = (vol) => {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return String(vol);
};

// ─── Mini Sparkline SVG ───────────────────────────────────────────────────────

const MiniSparkline = memo(({ data = [], isUp, width = 40, height = 18 }) => {
  if (!data || data.length < 2) return null;

  const prices = data.map((d) => d.price ?? d.close ?? d);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const pts = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const color = isUp ? '#10b981' : '#ef4444';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color}60)` }}
      />
    </svg>
  );
});

MiniSparkline.displayName = 'MiniSparkline';

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TickerTooltip = memo(({ stock, priceMap, isVisible, anchorRef }) => {
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const currentPrice = priceMap?.[stock?.symbol] ?? stock?.price ?? stock?.currentPrice ?? 0;
  const change = stock?.change ?? 0;
  const changePct = stock?.changePercent ?? 0;
  const isUp = change >= 0;

  useEffect(() => {
    if (!isVisible || !anchorRef?.current || !tooltipRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const tip = tooltipRef.current.getBoundingClientRect();
    const vpW = window.innerWidth;

    let left = rect.left + rect.width / 2 - tip.width / 2;
    if (left < 8) left = 8;
    if (left + tip.width > vpW - 8) left = vpW - tip.width - 8;

    setPos({ top: rect.bottom + 6, left });
  }, [isVisible, anchorRef]);

  if (!isVisible || !stock) return null;

  const rows = [
    { label: 'Exchange', value: stock.exchange ?? 'Unknown' },
    { label: 'Market', value: stock.marketState ?? 'REGULAR' },
  ];

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      aria-live="polite"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="
        min-w-[200px] rounded-xl border border-slate-200 dark:border-dark-border
        bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl
        shadow-2xl shadow-black/20 dark:shadow-black/60
        p-3 text-xs
      "
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-2">
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{stock.symbol}</span>
          <p className="text-slate-500 dark:text-dark-muted text-[10px] mt-0.5 truncate max-w-[120px]">
            {stock.companyName ?? stock.name ?? ''}
          </p>
        </div>
        <div className={`text-right ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
          <p className="font-mono font-bold">{formatPrice(currentPrice, stock.currency)}</p>
          <p className="text-[10px]">{formatChange(change, changePct)}</p>
        </div>
      </div>
      {/* Data rows */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-slate-400 dark:text-dark-muted">{label}</span>
            <span className="font-mono text-slate-700 dark:text-slate-200">{value}</span>
          </div>
        ))}
      </div>
      {/* Click hint */}
      <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-dark-muted">
        Click to open stock detail →
      </p>
    </div>
  );
});

TickerTooltip.displayName = 'TickerTooltip';

// ─── Single Ticker Item ───────────────────────────────────────────────────────

const TickerItem = memo(({
  stock,
  priceMap,
  showCompanyName,
  showSparkline,
  onHoverStart,
  onHoverEnd,
  onClickStock,
}) => {
  const itemRef = useRef(null);
  const currentPrice = priceMap?.[stock.symbol] ?? stock.price ?? stock.currentPrice ?? 0;
  const change = stock.change ?? 0;
  const changePct = stock.changePercent ?? 0;
  const isUp = change >= 0;
  const isNeutral = Math.abs(changePct) < 0.001;

  const arrow = isNeutral ? '—' : isUp ? '▲' : '▼';
  const colorClass = isNeutral
    ? 'text-slate-400 bg-slate-100 dark:bg-slate-800'
    : isUp
    ? 'text-emerald-500 bg-emerald-500/10'
    : 'text-rose-500 bg-rose-500/10';

  const sparkData = stock.history?.['1D'] ?? [];

  return (
    <button
      ref={itemRef}
      aria-label={`${stock.symbol} ${stock.companyName ?? stock.name}, current price ${formatPrice(currentPrice, stock.currency)}, ${formatChange(change, changePct)}`}
      onClick={() => onClickStock(stock.symbol)}
      onMouseEnter={() => onHoverStart(stock, itemRef)}
      onMouseLeave={onHoverEnd}
      onFocus={() => onHoverStart(stock, itemRef)}
      onBlur={onHoverEnd}
      className={`inline-flex items-center gap-3 px-4 py-1.5 mx-3 rounded-xl border font-bold whitespace-nowrap flex-shrink-0 transition-all hover:scale-105 select-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
        isNeutral 
          ? 'border-slate-200 dark:border-dark-border/40 hover:bg-slate-50 dark:hover:bg-slate-800' 
          : isUp 
          ? 'bg-emerald-500/[0.02] border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400' 
          : 'bg-rose-500/[0.02] border-rose-500/20 dark:border-rose-500/10 hover:bg-rose-500/[0.06] text-rose-600 dark:text-rose-400'
      }`}
    >
      <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-black ${colorClass}`}>
        <span className="mr-1 text-[10px]">{arrow}</span>
        <span>{stock.symbol}</span>
      </span>
      {showCompanyName && (
        <span className="text-[10px] text-slate-500 dark:text-dark-muted hidden sm:inline whitespace-nowrap">
          {stock.companyName ?? stock.name}
        </span>
      )}
      <span className="text-slate-800 dark:text-slate-200 text-xs">
        {formatPrice(currentPrice, stock.currency)}
      </span>
      <span className={`text-[11px] font-black ${isNeutral ? 'text-slate-400' : isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {formatChange(change, changePct)}
      </span>
      {showSparkline && sparkData.length >= 2 && (
        <MiniSparkline data={sparkData.slice(-20)} isUp={isUp} />
      )}
    </button>
  );
});

TickerItem.displayName = 'TickerItem';

// ─── Settings Panel ───────────────────────────────────────────────────────────

const TickerSettingsPanel = memo(({ prefs, setPrefs, resetPrefs, onClose, anchorRef }) => {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!anchorRef?.current || !panelRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, [anchorRef]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Ticker settings"
      style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
      className="
        w-72
        rounded-2xl border border-slate-200 dark:border-dark-border
        bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl
        shadow-2xl shadow-black/20 dark:shadow-black/60
        p-4 text-sm
      "
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 dark:text-white">Ticker Settings</h3>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-dark-muted mb-1.5">
            Show Stocks
          </label>
          <div className="flex gap-1.5">
            {['all', 'gainers', 'losers'].map((f) => (
              <button
                key={f}
                onClick={() => setPrefs({ filter: f })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  prefs.filter === f
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="flex justify-between text-xs font-semibold text-slate-500 dark:text-dark-muted mb-1.5">
            <span>Scroll Speed</span>
            <span className="text-blue-500">{prefs.speed}s</span>
          </label>
          <input
            type="range"
            min={15}
            max={80}
            step={5}
            value={prefs.speed}
            onChange={(e) => setPrefs({ speed: Number(e.target.value) })}
            aria-label="Ticker scroll speed in seconds"
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-dark-muted mb-1.5">
            Position
          </label>
          <div className="flex gap-1.5">
            {['top', 'bottom'].map((p) => (
              <button
                key={p}
                onClick={() => setPrefs({ position: p })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  prefs.position === p
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        {[
          { key: 'pauseOnHover', label: 'Pause on hover' },
          { key: 'showCompanyName', label: 'Show company name' },
          { key: 'showSparkline', label: 'Show sparklines' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
            <button
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => setPrefs({ [key]: !prefs[key] })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                prefs[key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs[key] ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
                style={{ transform: prefs[key] ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </label>
        ))}

        {/* Reset */}
        <button
          onClick={resetPrefs}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-slate-500 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reset to defaults
        </button>
      </div>
    </div>
  );
});

TickerSettingsPanel.displayName = 'TickerSettingsPanel';

// ─── Market Status Badge ───────────────────────────────────────────────────────

const MarketStatusBadge = memo(() => {
  const [status, setStatus] = useState('');

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = ist.getDay();
      const hours = ist.getHours();
      const minutes = ist.getMinutes();
      const totalMins = hours * 60 + minutes;

      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = totalMins >= 555 && totalMins <= 930; // 9:15–15:30
      setStatus(isWeekday && isMarketHours ? 'LIVE' : 'SIM');
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-label={`Market status: ${status === 'LIVE' ? 'Live market open' : 'Simulated market data'}`}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold flex-shrink-0 ${
        status === 'LIVE'
          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full animate-pulse ${
          status === 'LIVE' ? 'bg-emerald-500' : 'bg-blue-500'
        }`}
        aria-hidden="true"
      />
      {status}
    </div>
  );
});

MarketStatusBadge.displayName = 'MarketStatusBadge';

// ─── Main MarketTicker Component ───────────────────────────────────────────────

const MarketTicker = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { prefs, setPrefs, resetPrefs } = useTickerPreferences();

  // Live price map: symbol → current price (patched without full re-fetch)
  const priceMapRef = useRef({});
  const [priceMap, setPriceMap] = useState({});

  // Hover state for tooltip
  const [hoveredStock, setHoveredStock] = useState(null);
  const [hoveredRef, setHoveredRef] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Settings panel ref for click-outside close
  const settingsPanelRef = useRef(null);
  const settingsBtnRef = useRef(null);
  const hoverTimeout = useRef(null);

  const { data: stocksData, isError, isLoading } = useQuery({
    queryKey: ['ticker-stocks'],
    queryFn: () => api.get('/stocks/ticker'), // Fetch from new Yahoo Finance endpoint
    refetchOnWindowFocus: false,
    staleTime: 55_000,
    refetchInterval: 60_000, // Refresh full list every 60 seconds
    select: (res) => {
      return res?.data ?? res ?? [];
    },
  });

  // ── (Socket removed for ticker to use real Yahoo data) ──

  // ── Filter stocks based on preference ──
  const filteredStocks = useMemo(() => {
    if (!stocksData?.length) return [];
    const validOnly = stocksData.filter(isValidStockData);
    if (prefs.filter === 'all') return validOnly;

    return validOnly.filter((stock) => {
      const change = stock.change ?? 0;
      if (prefs.filter === 'gainers') return change >= 0;
      if (prefs.filter === 'losers') return change < 0;
      return true;
    });
  }, [stocksData, prefs.filter, priceMap]);

  // ── Click outside to close settings ──
  useEffect(() => {
    const handler = (e) => {
      if (
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(e.target) &&
        !settingsBtnRef.current?.contains(e.target)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleHoverStart = useCallback((stock, ref) => {
    clearTimeout(hoverTimeout.current);
    setHoveredStock(stock);
    setHoveredRef(ref);
    if (prefs.pauseOnHover) setIsPaused(true);
    hoverTimeout.current = setTimeout(() => setTooltipVisible(true), 200);
  }, [prefs.pauseOnHover]);

  const handleHoverEnd = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setTooltipVisible(false);
      setHoveredStock(null);
      setHoveredRef(null);
      if (prefs.pauseOnHover) setIsPaused(false);
    }, 150);
  }, [prefs.pauseOnHover]);

  const handleClickStock = useCallback((symbol) => {
    navigate(`/stocks/${symbol}`);
  }, [navigate]);

  const showError = isError && !stocksData?.length;
  const showLoading = isLoading;

  const isBottom = prefs.position === 'bottom';
  const positionClass = isBottom
    ? 'fixed bottom-0 left-0 right-0 z-30 mb-0'
    : 'sticky top-0 z-30';

  return (
    <>
      {/* Ticker Bar */}
      <div
        role="region"
        aria-label="Live market ticker"
        className={`
          ${positionClass}
          w-full h-10
          bg-white/80 dark:bg-dark-card/80
          border-b border-slate-200/80 dark:border-dark-border/80
          backdrop-blur-xl
          shadow-sm dark:shadow-black/30
          transition-colors duration-300
          overflow-hidden
          select-none
        `}
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
          maskImage:
            'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
        }}
      >
        {/* Left branding label */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-3 pr-4 gap-2
            bg-gradient-to-r from-white dark:from-dark-card via-white/95 dark:via-dark-card/95 to-transparent"
          aria-hidden="true"
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Activity className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-widest uppercase">
              Markets
            </span>
          </div>
          <MarketStatusBadge />
          <div className="h-5 w-px bg-slate-200 dark:bg-dark-border ml-1 flex-shrink-0" />
        </div>

        {/* Scrolling track with Marquee */}
        {showLoading ? (
          <div className="h-full flex items-center pl-52 gap-2 text-xs text-slate-400 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" />
            <span>Loading market data…</span>
          </div>
        ) : showError ? (
          <div role="alert" className="h-full flex items-center pl-52 text-xs text-slate-400 italic">
            Market data temporarily unavailable
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="h-full flex items-center pl-52 text-xs text-slate-400 italic">
            No stocks match the current filter
          </div>
        ) : (
          <div
            style={{ overflow: 'hidden', flex: 1, height: '100%', minWidth: 0 }}
            aria-hidden="true"
          >
            <Marquee
              play={!isPaused}
              pauseOnHover={prefs.pauseOnHover}
              speed={Math.max(10, Math.round(2000 / prefs.speed))}
              direction="left"
              gradient={false}
            >
              {filteredStocks.map((stock) => (
                <TickerItem
                  key={stock.symbol}
                  stock={stock}
                  priceMap={priceMap}
                  showCompanyName={prefs.showCompanyName}
                  showSparkline={prefs.showSparkline}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                  onClickStock={handleClickStock}
                />
              ))}
            </Marquee>
          </div>
        )}

        {/* Right controls */}
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-2 gap-1
          bg-gradient-to-l from-white dark:from-dark-card via-white/95 dark:via-dark-card/95 to-transparent pl-6">

          {/* Settings button */}
          <div className="relative">
            <button
              ref={settingsBtnRef}
              aria-label="Ticker settings"
              aria-expanded={showSettings}
              aria-haspopup="dialog"
              onClick={() => setShowSettings((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div ref={settingsPanelRef}>
          <TickerSettingsPanel
            prefs={prefs}
            setPrefs={setPrefs}
            resetPrefs={resetPrefs}
            onClose={() => setShowSettings(false)}
            anchorRef={settingsBtnRef}
          />
        </div>
      )}

      {/* Tooltip */}
      {hoveredStock && (
        <TickerTooltip
          stock={hoveredStock}
          priceMap={priceMap}
          isVisible={tooltipVisible}
          anchorRef={hoveredRef}
        />
      )}
    </>
  );
};

export default memo(MarketTicker);
