import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { Bell, Search, Sun, Moon, LogOut, User as UserIcon, Menu, X, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import api from '@/services/api.js';
import { useNotifications } from '@/hooks/useNotifications.js';
import { normalizeArray } from '@/services/apiNormalizer.js';
import { formatPercent, formatCurrency } from '@/utils/formatters.js';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getAvatarUrl } from '@/utils/avatarUtils.js';
import { motion, AnimatePresence } from 'framer-motion';

// Safely derive display name
const getDisplayName = (user) => {
  if (!user) return 'Guest';
  return user.name || user.displayName || user.username || user.email?.split('@')[0] || 'Guest';
};

// Safely derive initials
const getInitials = (user) => {
  const name = getDisplayName(user);
  if (name === 'Guest') return 'G';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0].charAt(0) || '';
    const last = parts[1].charAt(0) || '';
    return (first + last).toUpperCase();
  }
  return (name.charAt(0) || 'G').toUpperCase();
};

// Safely get profile image
const getProfileImage = (user) => {
  return getAvatarUrl(user);
};


const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [navImgError, setNavImgError] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Notification States
  const { notifications, unreadCount, markAllAsRead } = useNotifications(user);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Profile States
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Auto-search Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await api.get(`/stocks/search/autocomplete?q=${searchQuery}`);
        const list = normalizeArray(response);
        setSearchSuggestions(list);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Dismiss suggestions / dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markAllAsRead();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stocks?search=${searchQuery}`);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && searchQuery.trim().length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => 
          searchSuggestions.length > 0 ? (prev + 1) % searchSuggestions.length : -1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => 
          searchSuggestions.length > 0 
            ? (prev - 1 + searchSuggestions.length) % searchSuggestions.length 
            : -1
        );
      } else if (e.key === 'Enter') {
        if (focusedIndex >= 0 && focusedIndex < searchSuggestions.length) {
          e.preventDefault();
          const selected = searchSuggestions[focusedIndex];
          navigate(`/stocks/${selected.symbol}`);
          setSearchQuery('');
          setShowSuggestions(false);
          setFocusedIndex(-1);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-dark-card/85 backdrop-blur-md border-b border-slate-200 dark:border-dark-border transition-colors duration-300">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent font-sans">
              TickerSim
            </span>
            <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 sm:inline-block">
              Simulator
            </span>
          </Link>
        </div>

        {/* Middle Search autocomplete */}
        <div ref={searchRef} className="relative hidden w-full max-w-lg sm:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center group">
            <div className="absolute left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400" />
            </div>
            <input
              type="text"
              aria-label="Search stocks by symbol or name"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setFocusedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-10 text-[15px] font-medium text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-dark-border dark:bg-dark-bg/40 dark:text-dark-text dark:hover:border-slate-700 dark:focus:border-blue-500 dark:focus:bg-dark-bg dark:focus:ring-blue-500/15 placeholder-slate-400 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchSuggestions([]);
                  setFocusedIndex(-1);
                }}
                className="absolute right-3.5 p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Clear search query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 min-w-full w-max max-w-lg rounded-2xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-card shadow-2xl shadow-black/10 dark:shadow-black/50 z-50"
                style={{ minWidth: '100%' }}
              >
                {isSearching ? (
                  <div className="p-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span>Searching markets...</span>
                  </div>
                ) : searchSuggestions.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                    <Search className="h-6 w-6 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                    <span>No matching stocks found.</span>
                  </div>
                ) : (
                  <div className="py-1.5 max-h-[420px] overflow-y-auto">
                    {searchSuggestions.map((stock, idx) => {
                      const hasChangeData = stock.changePercent !== undefined && stock.changePercent !== null && !isNaN(stock.changePercent);
                      const isPositive = (stock.change || 0) >= 0;
                      const isFocused = idx === focusedIndex;

                      return (
                        <button
                          key={stock.symbol}
                          onMouseEnter={() => setFocusedIndex(idx)}
                          onClick={() => {
                            navigate(`/stocks/${stock.symbol}`);
                            setSearchQuery('');
                            setShowSuggestions(false);
                            setFocusedIndex(-1);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm border-b border-slate-100/80 dark:border-dark-border/30 last:border-b-0 transition-colors ${
                            isFocused
                              ? 'bg-blue-50/80 dark:bg-blue-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Left: icon + symbol + name */}
                          <div className="flex items-center gap-3 min-w-0 mr-4">
                            <div className={`flex-shrink-0 p-2 rounded-lg ${
                              isFocused
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-400 dark:bg-dark-bg dark:text-slate-500'
                            }`}>
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className={`font-extrabold tracking-wide text-sm ${
                                isFocused
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-slate-800 dark:text-dark-text'
                              }`}>
                                {stock.symbol}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate max-w-[240px]">
                                {stock.name}
                              </div>
                            </div>
                          </div>

                          {/* Right: price + change */}
                          <div className="text-right flex-shrink-0">
                            <div className="font-extrabold text-slate-800 dark:text-dark-text text-sm">
                              {formatCurrency(stock.price)}
                            </div>
                            <div className={`flex items-center justify-end text-[11px] font-bold mt-0.5 ${
                              !hasChangeData ? 'text-slate-400 dark:text-slate-500' : isPositive ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                              {hasChangeData && (isPositive
                                ? <ArrowUpRight className="mr-0.5 h-3 w-3" />
                                : <ArrowDownRight className="mr-0.5 h-3 w-3" />)}
                              {formatPercent(stock.changePercent)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right operations */}
        <div className="flex items-center gap-3">
          
          {/* Theme switcher */}
          <ThemeToggle variant="compact" />

          {/* Notifications bell */}
          {user && (
            <div ref={notifRef} className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-dark-text"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-dark-card">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 max-h-[400px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-dark-border dark:bg-dark-card"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2 dark:border-dark-border">
                      <span className="font-bold text-slate-800 dark:text-dark-text">Notifications</span>
                      <span className="text-xs text-blue-500 font-medium">Auto-read on open</span>
                    </div>
                    <div className="py-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">No notifications yet</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`flex flex-col rounded-lg p-2.5 my-1 text-xs border ${
                              notif.type === 'success' 
                                ? 'bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
                                : notif.type === 'failure' 
                                ? 'bg-rose-50/40 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <span className="text-slate-800 dark:text-dark-text font-medium">{notif.message}</span>
                            <span className="mt-1 text-[10px] text-slate-400">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User profile dropdown */}
          {user ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
              >
                <div className="h-8 w-8 overflow-hidden rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900/30">
                  {getProfileImage(user) && !navImgError ? (
                    <img src={getProfileImage(user)} alt={getDisplayName(user)} className="h-full w-full object-cover" onError={() => setNavImgError(true)} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-blue-600 dark:text-blue-400 uppercase">
                      {getInitials(user)}
                    </div>
                  )}
                </div>
                <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-300 md:block max-w-[100px] truncate">
                  {getDisplayName(user)}
                </span>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-dark-border dark:bg-dark-card"
                  >
                    <div className="bg-slate-50/50 p-4 border-b border-slate-100 dark:bg-slate-800/30 dark:border-dark-border">
                      <div className="font-bold text-slate-800 dark:text-dark-text max-w-full truncate">{getDisplayName(user)}</div>
                      <div className="text-xs text-slate-400 max-w-full truncate">{user.email || ''}</div>
                      <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full inline-block">
                        Bal: ₹{(user.virtualBalance ?? user.balance ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        Profile Settings
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-dark-text">
                Login
              </Link>
              <Link to="/register" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-md">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
