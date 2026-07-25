import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = ({ variant = 'compact' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const getActiveIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4.5 w-4.5 text-amber-500" />;
      case 'dark':
        return <Moon className="h-4.5 w-4.5 text-indigo-400" />;
      case 'system':
      default:
        return <Monitor className="h-4.5 w-4.5 text-slate-400 dark:text-slate-300" />;
    }
  };

  const getThemeLabel = (t) => {
    switch (t) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return '';
    }
  };

  const options = ['light', 'dark', 'system'];

  return (
    <div className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-slate-800 ${
          variant === 'full' ? 'px-3 py-2 w-full justify-between' : 'justify-center'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Change theme. Current theme is ${theme}`}
        title={`Theme: ${getThemeLabel(theme)}`}
      >
        <span className="flex items-center gap-2">
          {getActiveIcon()}
          {variant === 'full' && (
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {getThemeLabel(theme)}
            </span>
          )}
        </span>
        {variant === 'full' && (
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
            Mode
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-dark-border dark:bg-dark-card/95"
            role="menu"
            aria-orientation="vertical"
          >
            {options.map((opt) => {
              const isActive = theme === opt;
              let icon;
              if (opt === 'light') icon = <Sun className="h-4 w-4 text-amber-500" />;
              if (opt === 'dark') icon = <Moon className="h-4 w-4 text-indigo-400" />;
              if (opt === 'system') icon = <Monitor className="h-4 w-4 text-slate-400 dark:text-slate-300" />;

              return (
                <button
                  key={opt}
                  onClick={() => {
                    setTheme(opt);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all focus:outline-none ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-dark-text'
                  }`}
                  role="menuitem"
                >
                  {icon}
                  <span>{getThemeLabel(opt)}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
