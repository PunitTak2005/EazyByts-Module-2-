import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningService, deriveFallbackAchievements } from '@/services/learningService';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Trophy,
  BookOpen,
  CheckCircle,
  Zap,
  Star,
  Award,
  Search,
  Filter,
  Sparkles,
  Lock,
  Clock,
  HelpCircle,
  GraduationCap,
  Brain,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import ProgressRing from '@/components/learning/ProgressRing';
import AchievementCard, { renderBadgeIcon } from '@/components/learning/AchievementCard';
import XPBadge from '@/components/learning/XPBadge';
import AchievementUnlockModal from '@/components/learning/AchievementUnlockModal';

const LEVEL_NAMES = ['', 'Newcomer', 'Learner', 'Analyst', 'Expert', 'Master', 'Legend'];

const CATEGORIES = [
  { key: 'all', label: 'All Categories', icon: Award },
  { key: 'lessons', label: '📘 Lessons', icon: BookOpen },
  { key: 'courses', label: '🎓 Courses', icon: GraduationCap },
  { key: 'xp', label: '⭐ XP', icon: Star },
  { key: 'streaks', label: '🔥 Streaks', icon: Flame },
  { key: 'quizzes', label: '🧠 Quiz', icon: Brain },
  { key: 'time', label: '⏱ Time', icon: Clock },
  { key: 'special', label: '🏆 Special', icon: Trophy },
];

const normalizeCategory = (cat) => {
  if (!cat) return 'special';
  const c = String(cat).toLowerCase().trim();
  if (c === 'lesson' || c === 'lessons') return 'lessons';
  if (c === 'course' || c === 'courses' || c === 'module' || c === 'modules') return 'courses';
  if (c === 'streak' || c === 'streaks') return 'streaks';
  if (c === 'quiz' || c === 'quizzes') return 'quizzes';
  if (c === 'xp') return 'xp';
  if (c === 'time') return 'time';
  return 'special';
};

const isBadgeUnlocked = (b) => {
  if (!b) return false;
  if (b.unlocked === true || b.unlocked === 'true' || b.unlocked === 1) return true;
  if (b.earned === true || b.earned === 'true' || b.earned === 1) return true;
  return false;
};

const LearnDashboard = () => {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [unlockedModalBadges, setUnlockedModalBadges] = useState([]);

  const {
    data: dashboardRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['learning-dashboard'],
    queryFn: () => learningService.getDashboard(),
  });

  // Acknowledge badge unlocks mutation
  const ackMutation = useMutation({
    mutationFn: (badgeIds) => learningService.acknowledgeBadgeUnlock(badgeIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning-dashboard'] });
      qc.invalidateQueries({ queryKey: ['learning-progress'] });
      qc.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  const handleCloseModal = () => {
    if (unlockedModalBadges.length > 0) {
      const ids = unlockedModalBadges.map((b) => b.badgeId || b.id);
      ackMutation.mutate(ids);
    }
    setUnlockedModalBadges([]);
  };

  // Skeleton loader for cards
  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <div className="h-10 w-64 rounded-xl animate-pulse bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-28 rounded-3xl animate-pulse bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  // Error state UI with Retry button
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 rounded-3xl bg-white dark:bg-dark-card border border-red-200 dark:border-red-900/50 shadow-sm max-w-2xl mx-auto">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Unable to load achievements
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
          {error?.message || 'A network error occurred while loading your learning dashboard.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-md"
        >
          <RefreshCw size={16} />
          Retry Loading
        </button>
      </div>
    );
  }

  const progress = dashboardRes?.data ?? dashboardRes?.dashboard ?? dashboardRes ?? {};

  // Flexible multi-path extraction of achievements list
  let rawAchievements = null;
  if (Array.isArray(dashboardRes?.data?.achievements) && dashboardRes.data.achievements.length > 0) {
    rawAchievements = dashboardRes.data.achievements;
  } else if (Array.isArray(dashboardRes?.data?.badges) && dashboardRes.data.badges.length > 0) {
    rawAchievements = dashboardRes.data.badges;
  } else if (Array.isArray(dashboardRes?.achievements) && dashboardRes.achievements.length > 0) {
    rawAchievements = dashboardRes.achievements;
  } else if (Array.isArray(dashboardRes?.badges) && dashboardRes.badges.length > 0) {
    rawAchievements = dashboardRes.badges;
  } else if (Array.isArray(dashboardRes?.dashboard?.achievements) && dashboardRes.dashboard.achievements.length > 0) {
    rawAchievements = dashboardRes.dashboard.achievements;
  } else if (Array.isArray(progress.achievements) && progress.achievements.length > 0) {
    rawAchievements = progress.achievements;
  }

  let achievements = rawAchievements;
  if (!achievements || achievements.length === 0) {
    console.warn('[LearnDashboard] Achievements empty from response, using local deriveFallbackAchievements');
    achievements = deriveFallbackAchievements(progress);
  }

  // Check for newly unlocked unacknowledged badges to trigger celebration pop-up modal
  const unnotifiedUnlocked = achievements.filter((a) => isBadgeUnlocked(a) && a.notified === false);
  if (unnotifiedUnlocked.length > 0 && unlockedModalBadges.length === 0) {
    setUnlockedModalBadges(unnotifiedUnlocked);
  }

  const totalXP = progress.totalXP ?? progress.xp ?? 420;
  const level = progress.level ?? (Math.floor(totalXP / 200) + 1);
  const streak = progress.streak ?? 1;
  const completedCourses = progress.completedCourses ?? 0;
  const courses = progress.courses ?? [];

  const unlockedBadges = achievements.filter((a) => isBadgeUnlocked(a));
  const lockedBadges = achievements.filter((a) => !isBadgeUnlocked(a));
  const totalBadges = achievements.length || 35;
  const totalEarned = unlockedBadges.length;
  const completionPercent = totalBadges > 0 ? Math.round((totalEarned / totalBadges) * 100 * 10) / 10 : 0;

  const recentBadge = (progress.recentBadge && isBadgeUnlocked(progress.recentBadge))
    ? progress.recentBadge
    : (unlockedBadges.length > 0 ? unlockedBadges[0] : null);
  const nextBadgeToUnlock = progress.nextBadgeToUnlock || (lockedBadges.length > 0 ? lockedBadges.sort((a, b) => (b.progress / (b.target || b.maxProgress || 1)) - (a.progress / (a.target || a.maxProgress || 1)))[0] : null);

  // Level progress within thresholds
  const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 5000];
  const levelStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const levelEnd = LEVEL_THRESHOLDS[level] ?? 5000;
  const levelXP = totalXP - levelStart;
  const levelRange = levelEnd - levelStart;
  const levelPercent = Math.min((levelXP / levelRange) * 100, 100);

  // Filtered achievements with category normalization & status check
  const filterBadges = (list) => {
    return list.filter((a) => {
      const unlockedState = isBadgeUnlocked(a);

      // Status filter
      if (activeStatus === 'unlocked' && !unlockedState) return false;
      if (activeStatus === 'locked' && unlockedState) return false;

      // Category filter with normalization
      if (activeCategory !== 'all') {
        const normBadgeCategory = normalizeCategory(a.category);
        const normFilterCategory = normalizeCategory(activeCategory);
        if (normBadgeCategory !== normFilterCategory) {
          return false;
        }
      }

      // Search query
      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        const nameMatch = (a.name || a.title || '').toLowerCase().includes(q);
        const descMatch = (a.description || '').toLowerCase().includes(q);
        return nameMatch || descMatch;
      }

      return true;
    });
  };

  const filteredAchievements = filterBadges(achievements);
  console.log(`[LearnDashboard] Total achievements: ${achievements.length} (Unlocked: ${unlockedBadges.length}, Locked: ${lockedBadges.length}), Rendered: ${filteredAchievements.length}`);

  const STATUS_TABS = [
    { key: 'all', label: `All Badges (${achievements.length})` },
    { key: 'unlocked', label: `Unlocked (${unlockedBadges.length})` },
    { key: 'locked', label: `Locked (${lockedBadges.length})` },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ── Unlock Celebration Modal ────────────────────────────────────────── */}
      <AchievementUnlockModal badges={unlockedModalBadges} onClose={handleCloseModal} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="text-amber-500 h-8 w-8" />
            Learning Dashboard & Achievements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your milestones, level progression, streaks, and milestone badges in real time
          </p>
        </div>
        <Link
          to="/learn"
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-md"
        >
          <BookOpen size={16} />
          Browse Courses
        </Link>
      </div>

      {/* ── Dashboard Summary Statistics Grid ─────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Total XP',
            value: totalXP.toLocaleString(),
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
          },
          {
            label: 'Level',
            value: `${level} — ${LEVEL_NAMES[level] ?? 'Legend'}`,
            icon: Star,
            color: 'text-violet-500',
            bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50',
          },
          {
            label: 'Day Streak',
            value: streak > 0 ? `${streak} 🔥` : '0',
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50',
          },
          {
            label: 'Badges Earned',
            value: `${totalEarned} / ${totalBadges}`,
            subText: `${completionPercent}% Unlocked`,
            icon: Trophy,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className={`rounded-2xl p-5 ${stat.bg} border shadow-sm flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-6 w-6 ${stat.color}`} />
                {stat.subText && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                    {stat.subText}
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Level Progress Bar ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Level {level} — {LEVEL_NAMES[level] ?? 'Legend'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              {levelXP} / {levelRange} XP earned to Level {level + 1}
            </p>
          </div>
          <XPBadge xp={totalXP} level={level} size="sm" />
        </div>
        <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
          />
        </div>
      </div>

      {/* ── Recent Badge & Next Badge Target ────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Recent Badge Card */}
        {recentBadge ? (
          <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-5 shadow-sm flex items-center gap-4">
            <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shadow-inner border border-amber-300/40">
              {renderBadgeIcon(recentBadge.icon, recentBadge.category, "h-8 w-8 text-amber-500", "text-4xl")}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                Recent Badge Unlocked
              </span>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
                {recentBadge.name || recentBadge.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {recentBadge.description || 'Achievement milestone unlocked!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card/50 p-5 shadow-sm flex items-center gap-4">
            <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-3xl text-slate-400">
              🎯
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                No Badges Unlocked Yet
              </span>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
                Begin Your Journey
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Complete your first lesson or course to unlock your first badge!
              </p>
            </div>
          </div>
        )}

        {/* Next Badge Target Card */}
        <div className="rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 shadow-sm flex items-center gap-4">
          <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-4xl shadow-inner border border-blue-300/40">
            {nextBadgeToUnlock?.icon || '🎯'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-200/60 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                Next Badge Target
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {nextBadgeToUnlock?.progress || 0} / {nextBadgeToUnlock?.target || nextBadgeToUnlock?.maxProgress || 1}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
              {nextBadgeToUnlock?.name || nextBadgeToUnlock?.title || 'Market Scholar'}
            </h4>
            <div className="mt-2 h-2 w-full rounded-full bg-blue-200/60 dark:bg-blue-900/60 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${
                    (nextBadgeToUnlock?.target || nextBadgeToUnlock?.maxProgress) > 0
                      ? Math.min(100, Math.round(((nextBadgeToUnlock.progress || 0) / (nextBadgeToUnlock.target || nextBadgeToUnlock.maxProgress || 1)) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>



      {/* ── Badges Collection & Filters ───────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Badge Collection ({filteredAchievements.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore your achievement milestones across lessons, courses, streaks, and quizzes
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search badges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Status Filter Tabs (All Badges / Unlocked / Locked) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-border pb-3 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const active = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Badges Grid (Responsive: 1 col mobile, 2 sm, 3 md, 4 lg) */}
        {filteredAchievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm p-6">
            <Trophy className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No matching badges found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              No badges match your current search query "{search}" or filter selection.
            </p>
            <button
              onClick={() => { setActiveCategory('all'); setActiveStatus('all'); setSearch(''); }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <RotateCcw size={14} />
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {filteredAchievements.map((badge) => (
              <motion.div
                key={badge.id || badge.badgeId}
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              >
                <AchievementCard
                  icon={badge.icon}
                  name={badge.name || badge.title}
                  title={badge.title || badge.name}
                  description={badge.description}
                  unlocked={isBadgeUnlocked(badge)}
                  earned={isBadgeUnlocked(badge)}
                  unlockedAt={badge.unlockedAt || badge.earnedAt}
                  xpReward={badge.xpReward}
                  rarity={badge.rarity}
                  category={badge.category}
                  progress={badge.progress}
                  target={badge.target || badge.maxProgress}
                  maxProgress={badge.maxProgress || badge.target}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── In-Progress Courses ───────────────────────────────────────────── */}
      {courses.filter((c) => !c.isCompleted && c.percentComplete > 0).length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-dark-border">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            Continue Learning Courses
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter((c) => !c.isCompleted && c.percentComplete > 0)
              .map((c) => (
                <Link
                  key={c._id}
                  to={`/learn/courses/${c.courseId?._id || c.courseId}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 hover:shadow-md transition-shadow group"
                >
                  <ProgressRing percent={c.percentComplete} size={52} stroke={5} color="#3b82f6" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {c.courseId?.title ?? 'Course'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 capitalize">
                      {c.courseId?.level ?? ''}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}


    </div>
  );
};

export default LearnDashboard;
