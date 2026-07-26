import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Lock,
  Zap,
  BookOpen,
  GraduationCap,
  Flame,
  Star,
  Brain,
  Clock,
  Crown,
  Trophy,
  Award,
  BarChart2,
  Target,
  Shield,
  TrendingUp,
  Sparkles,
  Medal
} from 'lucide-react';

const ICON_MAP = {
  // Category maps
  lesson: BookOpen,
  lessons: BookOpen,
  course: GraduationCap,
  courses: GraduationCap,
  streak: Flame,
  streaks: Flame,
  xp: Star,
  quiz: Brain,
  quizzes: Brain,
  time: Clock,
  legendary: Crown,
  special: Award,

  // String key maps from backend database
  'graduation-cap': GraduationCap,
  'graduationcap': GraduationCap,
  'award': Award,
  'bar-chart-2': BarChart2,
  'barchart2': BarChart2,
  'zap': Zap,
  'trophy': Trophy,
  'crown': Crown,
  'star': Star,
  'flame': Flame,
  'brain': Brain,
  'clock': Clock,
  'target': Target,
  'book-open': BookOpen,
  'shield': Shield,
  'medal': Medal,
  'trending-up': TrendingUp,
  'sparkles': Sparkles
};

const SHORTCODE_TO_EMOJI = {
  ':trophy:': '🏆',
  ':gold_medal:': '🥇',
  ':silver_medal:': '🥈',
  ':bronze_medal:': '🥉',
  ':military_medal:': '🎖️',
  ':sports_medal:': '🏅',
  ':star:': '⭐',
  ':glowing_star:': '🌟',
  ':rocket:': '🚀',
  ':gem:': '💎',
  ':fire:': '🔥',
  ':chart_increasing:': '📈',
  ':target:': '🎯',
  ':crown:': '👑',
  ':moneybag:': '💰',
  ':brain:': '🧠',
  ':graduation_cap:': '🎓',
};

export const renderBadgeIcon = (iconStr, categoryStr, sizeClass = "h-6 w-6 text-amber-500", textSizeClass = "text-2xl") => {
  if (!iconStr || typeof iconStr !== 'string' || iconStr.trim() === '') {
    const CatIcon = ICON_MAP[categoryStr?.toLowerCase()] || Trophy;
    return <CatIcon className={sizeClass} />;
  }

  const raw = iconStr.trim();
  const cleanKey = raw.toLowerCase();

  // 1. Shortcode mapping
  if (SHORTCODE_TO_EMOJI[cleanKey]) {
    const emojiChar = SHORTCODE_TO_EMOJI[cleanKey];
    return (
      <span 
        className={`inline-block select-none font-emoji ${textSizeClass} leading-none`}
        style={{
          fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Twemoji Mozilla', 'Android Emoji', sans-serif"
        }}
      >
        {emojiChar}
      </span>
    );
  }

  // 2. Lucide Icon string mapping
  const IconComponent = ICON_MAP[cleanKey] || ICON_MAP[cleanKey.replace(/-/g, '')];
  if (IconComponent) {
    return <IconComponent className={sizeClass} />;
  }

  // 3. Unicode emoji
  if (/\p{Extended_Pictographic}/u.test(raw)) {
    return (
      <span 
        className={`inline-block select-none font-emoji ${textSizeClass} leading-none`}
        style={{
          fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'Twemoji Mozilla', 'Android Emoji', sans-serif"
        }}
      >
        {raw}
      </span>
    );
  }

  // 4. Default fallback
  const FallbackIcon = ICON_MAP[categoryStr?.toLowerCase()] || Trophy;
  return <FallbackIcon className={sizeClass} />;
};

const RARITY_THEMES = {
  common: {
    unlocked: 'border-emerald-300 bg-gradient-to-b from-emerald-50 to-teal-50 dark:border-emerald-700/60 dark:from-emerald-950/30 dark:to-teal-950/30 shadow-emerald-100 dark:shadow-emerald-950/20',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  rare: {
    unlocked: 'border-blue-300 bg-gradient-to-b from-blue-50 to-indigo-50 dark:border-blue-700/60 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-blue-100 dark:shadow-blue-950/20',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  epic: {
    unlocked: 'border-purple-300 bg-gradient-to-b from-purple-50 to-violet-50 dark:border-purple-700/60 dark:from-purple-950/30 dark:to-violet-950/30 shadow-purple-100 dark:shadow-purple-950/20',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  legendary: {
    unlocked: 'border-amber-300 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 dark:border-amber-700/60 dark:from-amber-950/40 dark:to-orange-950/40 shadow-amber-200 dark:shadow-amber-950/40 ring-1 ring-amber-400/30',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300/50',
    iconBg: 'bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50',
  },
};

const renderIcon = (iconStr, categoryStr) => renderBadgeIcon(iconStr, categoryStr);

/**
 * Enhanced AchievementCard component displaying unlocked and locked badges cleanly with live progress.
 */
const AchievementCard = ({
  icon,
  name,
  title,
  description,
  unlocked = false,
  earned,
  unlockedAt,
  earnedAt,
  xpReward = 50,
  rarity = 'common',
  category = 'special',
  progress = 0,
  target,
  maxProgress = 1,
  size = 'md',
}) => {
  const badgeTitle = name || title || 'Achievement Milestone';
  const badgeDesc = description || 'Complete this milestone to unlock this badge.';
  const isUnlocked = Boolean(
    unlocked === true || unlocked === 'true' || unlocked === 1 ||
    earned === true || earned === 'true' || earned === 1
  );
  const unlockDate = unlockedAt || earnedAt;
  const isSmall = size === 'sm';
  const themeKey = rarity ? String(rarity).toLowerCase() : 'common';
  const theme = RARITY_THEMES[themeKey] || RARITY_THEMES.common;

  const safeTarget = target || maxProgress || 1;
  const safeProgress = Math.min(progress || 0, safeTarget);
  const percent = safeTarget > 0 ? Math.min(100, Math.round((safeProgress / safeTarget) * 100)) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`relative flex flex-col justify-between rounded-2xl border text-center transition-all ${
        isUnlocked
          ? `${theme.unlocked} shadow-sm`
          : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card opacity-90'
      } ${isSmall ? 'p-3' : 'p-5'}`}
      title={badgeDesc}
    >
      {/* Top right unlock/lock status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {isUnlocked ? (
          <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
            <CheckCircle size={12} className="flex-shrink-0" />
            Unlocked
          </span>
        ) : (
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
            <Lock size={10} />
            Locked
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        {/* Rarity Tag */}
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${theme.badge}`}>
          {rarity}
        </span>

        {/* Badge Icon */}
        <div
          className={`flex items-center justify-center rounded-2xl shadow-sm ${
            isUnlocked ? theme.iconBg : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          } ${isSmall ? 'h-11 w-11 text-2xl' : 'h-16 w-16 text-3xl'}`}
        >
          {renderIcon(icon, category)}
        </div>

        {/* Info */}
        <div className="w-full">
          <h4 className={`font-extrabold text-slate-800 dark:text-slate-100 truncate ${isSmall ? 'text-xs' : 'text-sm'}`}>
            {badgeTitle}
          </h4>
          {!isSmall && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
              {badgeDesc}
            </p>
          )}
        </div>
      </div>

      {/* Progress or Unlock details */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-border/60">
        {isUnlocked ? (
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
              <Zap size={12} fill="currentColor" /> +{xpReward} XP
            </span>
            {unlockDate ? (
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {new Date(unlockDate).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Earned</span>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>Progress</span>
              <span>{safeProgress} / {safeTarget} ({percent}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AchievementCard;
