import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['?'], desc: 'Toggle keyboard shortcuts cheatsheet modal' },
  { keys: ['/'], desc: 'Focus active stock search input fields' },
  { keys: ['g', 'd'], desc: 'Navigate to Workspace Desk (Dashboard)' },
  { keys: ['g', 'e'], desc: 'Navigate to Stock Explorer' },
  { keys: ['g', 'p'], desc: 'Navigate to My Portfolio' },
  { keys: ['g', 'w'], desc: 'Navigate to Watchlists summary' },
  { keys: ['g', 'c'], desc: 'Navigate to Comparative Engine (Stock Compare)' }
];

const ShortcutsModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-dark-border">
              <h3 id="shortcuts-title" className="text-base font-extrabold text-slate-800 dark:text-white">
                Keyboard Shortcuts Cheatsheet
              </h3>
              <button 
                onClick={onClose} 
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Close cheatsheet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 py-2">
              {SHORTCUTS.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">{shortcut.desc}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span className="text-[10px] text-slate-300 font-bold">+</span>}
                        <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase text-slate-600 dark:border-dark-border dark:bg-dark-bg dark:text-slate-400 shadow-sm">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-dark-bg dark:text-dark-text dark:hover:bg-slate-800"
            >
              Dismiss
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShortcutsModal;
