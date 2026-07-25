import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { learningService } from '@/services/learningService';
import { motion } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Brain,
  Book,
  Search,
  Sparkles,
  BarChart2,
  ArrowRight,
  Flame,
} from 'lucide-react';
import LessonCard from '@/components/learning/LessonCard';
import Skeleton from '@/components/ui/Skeleton';
import { formatNumber } from '@/utils/formatters.js';

const CATEGORIES = [
  { label: 'All', value: '', icon: Sparkles },
  { label: 'Beginner', value: 'beginner', icon: BookOpen },
  { label: 'Intermediate', value: 'intermediate', icon: TrendingUp },
  { label: 'Advanced', value: 'advanced', icon: Brain },
];

const LearnCenter = () => {
  const [activeLevel, setActiveLevel] = useState('');
  const [search, setSearch] = useState('');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', activeLevel],
    queryFn: async () => {
      const response = await learningService.getCourses(activeLevel);
      if (!response) throw new Error("Learning API returned no response.");
      return response.courses ?? [];
    }
  });

  const { data: progressData } = useQuery({
    queryKey: ['learning-progress'],
    queryFn: async () => {
      const response = await learningService.getProgress();
      if (!response) throw new Error("Learning API returned no response.");
      return response.data ?? null;
    }
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['learning-recommendations'],
    queryFn: async () => {
      const response = await learningService.getRecommendations();
      if (!response) throw new Error("Learning API returned no response.");
      return response.data ?? [];
    }
  });

  const progress = progressData ?? null;

  const courseList = Array.isArray(courses) ? courses : [];

  const filtered = search
    ? courseList.filter(
        (c) =>
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()) ||
          (c.tags || []).some((t) => t.includes(search.toLowerCase()))
      )
    : courseList;

  const streak = progress?.streak ?? 0;

  useEffect(() => {
    console.log('[Learning]\nLoading courses...\nGET /api/learning/courses');
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log(`${courseList.length} courses received`);
      if (courseList.length > 0) {
        console.log('Rendering course cards.');
      } else {
        console.log('No courses found.\nReturning empty array.');
      }
    }
  }, [isLoading, courseList.length]);

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-8 md:p-10 mb-8 shadow-xl"
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-300/20 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="text-white h-7 w-7" />
              <span className="text-white/80 text-sm font-semibold tracking-wider uppercase">
                Learning Center
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
              Build Your Investment<br className="hidden md:block" /> Knowledge
            </h1>
            <p className="text-white/75 text-base max-w-md">
              Structured courses from beginner to advanced. Learn, quiz, and apply concepts directly in the simulator.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Courses', value: courseList.length || '0', icon: BookOpen },
              {
                label: 'Streak',
                value: streak > 0 ? `${streak} 🔥` : '0',
                icon: Flame,
              },
              {
                label: 'XP Earned',
                value: formatNumber(progress?.totalXP) ?? '0',
                icon: BarChart2,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl bg-white/15 backdrop-blur-sm px-5 py-3 min-w-[90px]"
              >
                <span className="text-2xl font-black text-white">{s.value}</span>
                <span className="text-xs text-white/70 font-medium mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick nav links */}
        <div className="relative z-10 flex flex-wrap gap-3 mt-6">
          {[
            { label: 'My Progress', to: '/learn/dashboard', icon: BarChart2 },
            { label: 'Glossary', to: '/learn/glossary', icon: Book },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                <Icon size={15} />
                {link.label}
                <ArrowRight size={13} />
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ── Recommended for You ──────────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Recommended for You
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((course) => (
              <LessonCard key={course._id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* ── Course Browser ───────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            All Courses
          </h2>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Level filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Filter courses by level">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeLevel === cat.value;
            return (
              <button
                key={cat.value}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveLevel(cat.value)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
                    : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-blue-300'
                }`}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Course grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-dark-border h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm">
            <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No courses found.</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((course) => (
              <motion.div
                key={course._id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <LessonCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default LearnCenter;
