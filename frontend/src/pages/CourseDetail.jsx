import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningService } from '@/services/learningService';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle,
  PlayCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Trophy,
  Sparkles,
  Search,
  Check,
  Award,
  BookCheck,
  Zap,
} from 'lucide-react';
import ProgressRing from '@/components/learning/ProgressRing';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openModules, setOpenModules] = useState({});

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => learningService.getCourseById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-60 rounded-3xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-10 w-1/3 rounded-xl bg-slate-100 dark:bg-slate-800" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Course not found.</p>
        <Link to="/learn" className="mt-4 inline-block text-blue-600 font-semibold text-sm">
          ← Back to Learning Center
        </Link>
      </div>
    );
  }

  const progress = course.progress ?? {};
  const completedIds = new Set(progress.completedLessonIds ?? []);
  const lessons = course.lessons ?? [];
  let modules = course.modules ?? [];
  if (modules.length === 0 && lessons.length > 0) {
    modules = [{
      id: 'default-module',
      title: 'Course Content',
      lessons: lessons
    }];
  }
  const percent = progress.percentComplete ?? 0;
  const isCompleted = progress.isCompleted ?? false;
  const lastLessonId = progress.lastLessonId;

  // Find next lesson to resume
  let continueLesson = null;
  if (lastLessonId) {
    continueLesson = lessons.find((l) => (l.id || l._id) === lastLessonId);
  }
  if (!continueLesson) {
    continueLesson = lessons.find((l) => !completedIds.has(String(l.id || l._id)));
  }
  const firstLesson = lessons[0];
  const startLesson = firstLesson;

  // Toggle module collapse state
  const toggleModule = (modId) => {
    setOpenModules((prev) => ({
      ...prev,
      [modId]: prev[modId] === undefined ? false : !prev[modId],
    }));
  };

  const isModuleOpen = (modId) => {
    return openModules[modId] === undefined ? true : openModules[modId];
  };

  // Search filter
  const filteredModules = modules.map((mod) => {
    const rawLessons = mod.lessons || [];
    // Hydrate lessons if they are just strings (IDs)
    const hydratedLessons = rawLessons.map(l => {
      if (typeof l === 'string') {
        return lessons.find(full => (full.id || full._id) === l);
      }
      return l;
    }).filter(Boolean); // Filter out any undefined/null

    if (!search) return { ...mod, filteredLessons: hydratedLessons };

    const matching = hydratedLessons.filter(
      (l) =>
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase())
    );
    return { ...mod, filteredLessons: matching };
  }).filter((mod) => !search || mod.filteredLessons.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Back Navigation ────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/learn')}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Learning Center
      </button>

      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 p-8 shadow-xl text-white"
      >
        <div className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-300/20 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                🎓 {course.difficulty || 'Beginner'} Course
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 text-amber-200 px-3 py-1 text-xs font-bold">
                <Zap size={12} /> {lessons.length * 50} total XP
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              {course.title}
            </h1>

            <p className="text-white/85 text-base max-w-2xl leading-relaxed">
              {course.subtitle || course.description}
            </p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-white/80 pt-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={16} /> {course.totalDuration || course.estimatedDuration || (course.estimatedHours ? `${Math.round(course.estimatedHours * 60)} mins` : '45 mins')}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen size={16} /> {lessons.length} Lessons across {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
              </span>
            </div>
          </div>

          {/* Progress ring card */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md p-5 border border-white/20 min-w-[160px]">
            <ProgressRing percent={percent} size={84} stroke={7} color="#ffffff" />
            <span className="text-xs text-white/80 font-bold mt-2">
              {percent}% Completed
            </span>
          </div>
        </div>

        {/* Start / Continue CTA Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-white/20">
          {percent === 100 ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-3 text-sm font-extrabold backdrop-blur-md">
                <CheckCircle size={18} /> Course Completed
              </span>
              {startLesson && (
                <Link
                  to={`/learn/lessons/${startLesson.id || startLesson._id}`}
                  className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-5 py-3 text-sm font-bold transition-colors"
                >
                  <BookOpen size={18} /> Review Course
                </Link>
              )}
            </div>
          ) : (
            <>
              {startLesson && (
                <Link
                  to={`/learn/lessons/${startLesson.id || startLesson._id}`}
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 hover:bg-slate-100 transition-colors shadow-lg"
                >
                  <BookCheck size={18} />
                  {percent > 0 ? 'Restart from Lesson 1' : 'Start Learning'}
                </Link>
              )}

              {continueLesson && percent > 0 && (
                <Link
                  to={`/learn/lessons/${continueLesson.id || continueLesson._id}`}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors shadow-lg"
                >
                  <CheckCircle size={18} />
                  Continue Learning ({continueLesson.title})
                </Link>
              )}
            </>
          )}
        </div>
      </motion.div>



      {/* ── Skills You'll Learn ────────────────────────────────────────────── */}
      {course.skillsYouWillLearn && course.skillsYouWillLearn.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Sparkles className="text-amber-500 h-5 w-5" /> What You'll Learn
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {course.skillsYouWillLearn.map((skill, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                  <Check size={13} />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {skill}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filter ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
          Course Curriculum ({lessons.length} Lessons)
        </h2>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card pl-9 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── Collapsible Modules List ────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredModules.map((mod, modIdx) => {
          const open = isModuleOpen(mod.id);
          const modLessons = mod.filteredLessons || mod.lessons || [];
          const modCompletedCount = modLessons.filter((l) => completedIds.has(String(l.id || l._id))).length;
          const modIsDone = modLessons.length > 0 && modCompletedCount === modLessons.length;

          return (
            <div
              key={mod.id || modIdx}
              className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm transition-all"
            >
              {/* Module Header Accordion Trigger */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm ${
                      modIsDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {modIsDone ? <Check size={16} /> : modIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {modLessons.length} lessons · {modCompletedCount}/{modLessons.length} completed ({modLessons.length > 0 ? Math.round((modCompletedCount / modLessons.length) * 100 * 10) / 10 : 0}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {modIsDone && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
                      Module Completed (100%)
                    </span>
                  )}
                  {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                </div>
              </button>

              {/* Module Lessons Container */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 dark:border-dark-border divide-y divide-slate-100 dark:divide-dark-border bg-slate-50/50 dark:bg-dark-bg/30"
                  >
                    {modLessons.map((lesson) => {
                      const done = completedIds.has(String(lesson.id || lesson._id));

                      return (
                        <Link
                          key={lesson.id || lesson._id}
                          to={`/learn/lessons/${lesson.id || lesson._id}`}
                          className="flex items-center justify-between p-4 px-6 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                done
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {done ? <Check size={14} /> : lesson.order || '•'}
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  done
                                    ? 'text-slate-600 dark:text-slate-300'
                                    : 'text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                }`}
                              >
                                {lesson.title}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                {lesson.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                              <Clock size={12} /> {lesson.duration || `${lesson.estimatedMinutes || 5} min`}
                            </span>
                            <span className="hidden sm:inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400 capitalize">
                              {lesson.difficulty || 'Beginner'}
                            </span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseDetail;
