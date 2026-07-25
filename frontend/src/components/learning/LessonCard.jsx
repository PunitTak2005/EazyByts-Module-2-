import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, CheckCircle, PlayCircle, FileText, Zap } from 'lucide-react';
import ProgressRing from '@/components/learning/ProgressRing';

const LEVEL_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const CONTENT_ICONS = {
  reading: FileText,
  video: PlayCircle,
  interactive: BookOpen,
};

/**
 * Course card for the Learning Center hub.
 * Props:
 *   course – course object { _id, title, slug, description, level, estimatedHours, thumbnail, progress }
 */
const LessonCard = ({ course }) => {
  const { _id, title, description, level, estimatedHours, progress } = course;
  const percent = progress?.percentComplete ?? 0;
  const isCompleted = progress?.isCompleted ?? false;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280 }}
    >
      <Link
        to={`/learn/courses/${_id}`}
        className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
      >
        {/* Card header banner */}
        <div
          className={`h-2 w-full ${
            level === 'beginner'
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
              : level === 'intermediate'
              ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
              : 'bg-gradient-to-r from-violet-500 to-purple-600'
          }`}
        />

        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* Level badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${LEVEL_COLORS[level]}`}
            >
              {level}
            </span>
            {isCompleted && (
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="flex-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
            {description}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {course.estimatedDuration || course.duration || (estimatedHours ? (estimatedHours < 1 ? `${Math.round(estimatedHours * 60)} mins` : `${estimatedHours}h`) : '45 mins')}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {course.totalLessons || course.lessons?.length || (level === 'beginner' ? '5' : level === 'intermediate' ? '3' : '3')} lessons
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 dark:text-slate-500">Progress</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{percent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-1.5 rounded-full ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* CTA */}
          <button className="mt-auto w-full rounded-xl bg-slate-50 dark:bg-slate-800 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-colors">
            {percent === 0 ? 'Start Course' : isCompleted ? 'Review' : 'Continue'}
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

export default LessonCard;
