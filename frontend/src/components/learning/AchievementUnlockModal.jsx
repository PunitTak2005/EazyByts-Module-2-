import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X, CheckCircle, Zap } from 'lucide-react';

const RARITY_BG = {
  common: 'from-emerald-500 to-teal-600 border-emerald-400',
  rare: 'from-blue-500 to-indigo-600 border-blue-400',
  epic: 'from-purple-500 to-violet-600 border-purple-400',
  legendary: 'from-amber-400 via-amber-500 to-orange-600 border-amber-300 shadow-amber-500/50',
};

const RARITY_BADGE = {
  common: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  rare: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  epic: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  legendary: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-400',
};

const AchievementUnlockModal = ({ badges = [], onClose }) => {
  if (!badges || badges.length === 0) return null;

  const badge = badges[0]; // Display top newly unlocked badge
  const rarityKey = badge.rarity?.toLowerCase() || 'common';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl text-center"
        >
          {/* Header Celebration Gradient */}
          <div className={`relative flex flex-col items-center justify-center p-8 bg-gradient-to-br ${RARITY_BG[rarityKey]} text-white`}>
            {/* Sparkle background elements */}
            <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full bg-black/20 p-1.5 text-white/80 hover:bg-black/40 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
              className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 shadow-xl text-5xl font-emoji"
              style={{
                fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Twemoji Mozilla', 'Android Emoji', sans-serif"
              }}
            >
              {badge.icon || '🏅'}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
            >
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              Achievement Unlocked!
            </motion.div>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 space-y-4">
            <div className="flex justify-center">
              <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider capitalize ${RARITY_BADGE[rarityKey]}`}>
                {badge.rarity || 'Common'} Badge
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {badge.name || badge.title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {badge.description}
            </p>

            {badge.xpReward > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                <Zap size={16} className="text-amber-500 fill-amber-500" />
                +{badge.xpReward} XP Reward Earned
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 text-base font-bold text-white shadow-lg transition-colors"
            >
              Awesome!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AchievementUnlockModal;
