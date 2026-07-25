import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import Skeleton from '@/components/ui/Skeleton';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Zap,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Lightbulb,
  List,
  Target,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import QuizEngine from '@/components/learning/QuizEngine';
import { learningService } from '@/services/learningService';

const LEVEL_BADGE = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const startTimeRef = useRef(Date.now());
  const [showQuiz, setShowQuiz] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll Reading Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => learningService.getLessonById(id),
    enabled: !!id,
  });

  const { data: progressRes } = useQuery({
    queryKey: ['learning-progress'],
    queryFn: () => learningService.getProgress(),
  });

  const { data: glossaryRes } = useQuery({
    queryKey: ['glossary'],
    queryFn: () => learningService.getGlossary(),
  });

  const completeMutation = useMutation({
    mutationFn: (payload) => learningService.markLessonComplete(payload.lessonId, payload.timeSpentMinutes),
    onMutate: async () => {
      setCompleted(true);
    },
    onSuccess: (res) => {
      setCompleted(true);
      qc.invalidateQueries({ queryKey: ['learning-progress'] });
      qc.invalidateQueries({ queryKey: ['learning-dashboard'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course'] });
      qc.invalidateQueries({ queryKey: ['achievements'] });
      qc.invalidateQueries({ queryKey: ['learning-recommendations'] });

      const d = res.data;
      if (d && d.xpEarned > 0) {
        toast.success(`+${d.xpEarned} XP earned! Lesson complete!`, { icon: '⚡' });
      } else {
        toast.success('Lesson marked complete!');
      }
    },
    onError: (err) => {
      toast.error('Failed to mark lesson complete');
      console.error('[LessonView] completeMutation error:', err);
    },
  });

  const handleMarkComplete = () => {
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    completeMutation.mutate({ lessonId: id, timeSpentMinutes: timeSpent });
  };

  // Reset state when changing lessons
  useEffect(() => {
    startTimeRef.current = Date.now();
    setShowQuiz(false);
    setScrollProgress(0);
    setCompleted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Sync completion status from overall progress
  useEffect(() => {
    if (progressRes?.data?.completedLessonIds) {
      const doneSet = new Set(progressRes.data.completedLessonIds);
      setCompleted(doneSet.has(id));
    } else {
      setCompleted(false);
    }
  }, [progressRes, id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Lesson not found.</p>
        <Link to="/learn" className="mt-4 inline-block text-blue-600 font-semibold text-sm">
          ← Back to Learning Center
        </Link>
      </div>
    );
  }

  const course = lesson.courseId;
  const related = lesson.relatedLessons ?? [];
  const glossaryTerms = Array.isArray(glossaryRes?.data) ? glossaryRes.data : [];
  const takeaways = lesson.takeaways || lesson.keyTakeaways || [];
  const objectives = lesson.learningObjectives || [];
  const lessonGlossary = lesson.glossary || [];

  const rawQuizQuestions = Array.isArray(lesson.quiz)
    ? lesson.quiz
    : (lesson.quiz?.questions || []);

  const quiz = lesson.quiz && rawQuizQuestions.length > 0 ? {
    _id: `quiz-${lesson.id || lesson._id}`,
    title: lesson.quiz?.title || `${lesson.title} — Quiz`,
    passingScore: lesson.quiz?.passingScore || 60,
    timeLimitSeconds: lesson.quiz?.timeLimitSeconds || 300,
    xpReward: lesson.quiz?.xpReward || 50,
    questions: rawQuizQuestions.map((q, qIdx) => ({
      ...q,
      id: q.id || `q-${qIdx}`,
      text: q.text || q.question || `Question ${qIdx + 1}`,
      questionText: q.text || q.question || `Question ${qIdx + 1}`,
      options: Array.isArray(q.options) ? q.options : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : (typeof q.correctAnswer === 'number' ? q.correctAnswer : 0),
      explanation: q.explanation || ''
    }))
  } : null;

  // Process markdown to auto-link glossary terms
  const processMarkdown = (text) => {
    if (!text || glossaryTerms.length === 0) return text;
    let processed = text;

    const sortedTerms = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length);
    sortedTerms.forEach(item => {
      // Exclude specific terms for specific lessons based on title
      if (
        lesson.title?.toLowerCase().includes('bull vs bear') &&
        (item.term.toLowerCase() === 'bull market' || item.term.toLowerCase() === 'bear market')
      ) {
        return;
      }

      const regex = new RegExp(`(?<!\\[[^\\]]*)\\b(${item.term})\\b(?![^\\[]*\\]|[^<]*>)`, 'gi');
      processed = processed.replace(regex, `[$1](glossary://${encodeURIComponent(item.term)})`);
    });

    return processed;
  };

  const processedContent = processMarkdown(lesson.content);

  return (
    <div className="max-w-5xl mx-auto relative pb-16 px-4 sm:px-6">
      {/* ── Top Scroll Reading Progress Indicator ──────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-slate-200/50 dark:bg-slate-800/50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ── Breadcrumb Navigation ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 mb-8 flex-wrap">
        <Link to="/learn" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
          Learning Center
        </Link>
        <ChevronRight size={14} />
        {course && (
          <>
            <Link
              to={`/learn/courses/${course._id}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium truncate max-w-[200px]"
            >
              {course.title}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-slate-700 dark:text-slate-300 font-bold truncate max-w-[240px]">
          {lesson.title}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        {/* ── Main Content Area ─────────────────────────────────────────── */}
        <div>
          {/* Lesson Header Card */}
          <div className="mb-10 max-w-[780px]">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span
                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold capitalize ${
                  LEVEL_BADGE[lesson.difficulty?.toLowerCase()] ?? LEVEL_BADGE.beginner
                }`}
              >
                {lesson.difficulty || 'Beginner'}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                <Clock size={13} /> {lesson.duration || `${lesson.estimatedMinutes || 5} min read`}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/60">
                <Zap size={12} /> +{lesson.xpReward || 50} XP
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight mb-5 max-w-[760px]">
              {lesson.title}
            </h1>

            {lesson.description && (
              <p className="text-[17px] md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-6 max-w-[760px]">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Learning Objectives Callout */}
          {objectives.length > 0 && (
            <div className="mb-10 max-w-[780px] rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 dark:from-indigo-950/30 dark:to-blue-950/20 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-4">
                <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
                Learning Objectives
              </h2>
              <ul className="space-y-3">
                {objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] md:text-[16px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200/80 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Markdown Explanation */}
          <div className="mb-12">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl md:text-[36px] font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight mt-10 mb-6 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl md:text-[26px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug mt-10 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg md:text-[20px] font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-snug mt-8 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-[17px] md:text-[18px] text-slate-700 dark:text-slate-200 leading-[1.85] my-5 font-normal max-w-[760px]">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-3.5 my-6 pl-6 list-disc marker:text-blue-500 font-normal max-w-[760px]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="space-y-3.5 my-6 pl-6 list-decimal marker:text-blue-600 marker:font-bold font-normal max-w-[760px]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-[17px] md:text-[18px] text-slate-700 dark:text-slate-200 leading-relaxed pl-1">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => {
                  const childTexts = [];
                  React.Children.forEach(children, child => {
                    if (typeof child === 'string') childTexts.push(child);
                    else if (child?.props?.children) {
                      if (typeof child.props.children === 'string') childTexts.push(child.props.children);
                      else if (Array.isArray(child.props.children)) {
                        childTexts.push(child.props.children.map(c => typeof c === 'string' ? c : '').join(''));
                      }
                    }
                  });
                  const rawText = childTexts.join(' ');

                  let type = 'default';
                  let icon = '📖';

                  if (rawText.includes('💡') || rawText.toLowerCase().includes('tip')) {
                    type = 'tip';
                    icon = '💡';
                  } else if (rawText.includes('⚠️') || rawText.toLowerCase().includes('important') || rawText.toLowerCase().includes('warning')) {
                    type = 'important';
                    icon = '⚠️';
                  } else if (rawText.includes('📌') || rawText.toLowerCase().includes('remember')) {
                    type = 'remember';
                    icon = '📌';
                  } else if (rawText.includes('📖') || rawText.toLowerCase().includes('definition')) {
                    type = 'definition';
                    icon = '📖';
                  } else if (rawText.includes('🎯') || rawText.toLowerCase().includes('key point')) {
                    type = 'keypoint';
                    icon = '🎯';
                  }

                  const styles = {
                    tip: 'border-l-4 border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-slate-800 dark:text-slate-200',
                    important: 'border-l-4 border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-slate-800 dark:text-slate-200',
                    remember: 'border-l-4 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-slate-800 dark:text-slate-200',
                    definition: 'border-l-4 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-200',
                    keypoint: 'border-l-4 border-violet-500 bg-violet-50/80 dark:bg-violet-950/40 text-slate-800 dark:text-slate-200',
                    default: 'border-l-4 border-slate-400 bg-slate-100/80 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                  };

                  return (
                    <blockquote className={`rounded-2xl p-5 md:p-6 my-7 shadow-sm ${styles[type]} text-[16px] md:text-[17px] leading-relaxed not-italic max-w-[760px] flex items-start gap-3`}>
                      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                      <div className="flex-1">{children}</div>
                    </blockquote>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-[780px]">
                    <table className="w-full text-left border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-4.5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4.5 py-3.5 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 even:bg-slate-50/40 dark:even:bg-slate-800/20">
                    {children}
                  </td>
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  if (inline) {
                    return (
                      <code className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-300 font-mono text-[14px] px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="overflow-x-auto my-6 rounded-2xl bg-slate-900 text-slate-100 dark:bg-slate-950 p-5 font-mono text-sm shadow-inner border border-slate-800 max-w-[780px]">
                      <pre {...props}><code>{children}</code></pre>
                    </div>
                  );
                },
                img: ({ node, ...props }) => (
                  <img className="rounded-2xl shadow-md my-8 max-w-full h-auto mx-auto border border-slate-200 dark:border-dark-border block" {...props} />
                ),
                a: ({ node, ...props }) => {
                  if (props.href && props.href.startsWith('glossary://')) {
                    const term = decodeURIComponent(props.href.replace('glossary://', ''));
                    const def = glossaryTerms.find(t => t.term?.toLowerCase() === term.toLowerCase())?.definition;
                    return (
                      <span
                        className="text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-500/40 hover:border-blue-500 cursor-help transition-colors relative group"
                        title={def || `Glossary term: ${term}`}
                      >
                        {props.children}
                      </span>
                    );
                  }
                  return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-medium hover:underline" />;
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>

          {/* Mark Complete Action Card */}
          <div className="mb-10">
            {!completed ? (
              <div className="rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-6 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                  Finished reading? Mark this lesson as complete to save your progress and earn +{lesson.xpReward || 50} XP.
                </p>
                <button
                  onClick={handleMarkComplete}
                  disabled={completeMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  {completeMutation.isPending ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  Mark as Completed (+{lesson.xpReward || 50} XP)
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-7 w-7 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                      Lesson Completed! 🎉
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Your progress has been saved. Take the quiz below or proceed to the next lesson.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Interactive Quiz Engine Section */}
          {quiz && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  🧠 Knowledge Check Quiz
                </h2>
                {!showQuiz && (
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    Start Quiz ({quiz.questions?.length || 3} Questions) <ChevronRight size={16} />
                  </button>
                )}
              </div>

              {showQuiz && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <QuizEngine
                    quiz={quiz}
                    onComplete={() => {
                      qc.invalidateQueries({ queryKey: ['learning-progress'] });
                    }}
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* ── Previous / Next Sequential Lesson Navigation ────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-dark-border">
            {lesson.prevLessonId ? (
              <Link
                to={`/learn/lessons/${lesson.prevLessonId}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-all shadow-sm"
              >
                <ChevronLeft size={18} /> Previous Lesson
              </Link>
            ) : (
              <div />
            )}

            {lesson.nextLessonId ? (
              <Link
                to={`/learn/lessons/${lesson.nextLessonId}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-md"
              >
                Next Lesson <ChevronRight size={18} />
              </Link>
            ) : course ? (
              <Link
                to={`/learn/courses/${course._id}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-md"
              >
                Finish Course <CheckCircle size={18} />
              </Link>
            ) : null}
          </div>
        </div>

        {/* ── Lesson Sidebar ────────────────────────────────────────────── */}
        <aside className="space-y-6">
          {/* Key Takeaways Card */}
          {takeaways.length > 0 && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/20 p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-3">
                <Lightbulb size={16} className="text-amber-500" />
                Key Takeaways
              </h3>
              <ul className="space-y-2.5">
                {takeaways.map((tk, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    <CheckCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{tk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lesson Glossary Terms Card */}
          {lessonGlossary.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                <List size={16} className="text-blue-500" />
                Lesson Glossary
              </h3>
              <div className="space-y-3">
                {lessonGlossary.map((item, i) => (
                  <div key={i} className="border-b border-slate-100 dark:border-dark-border pb-2 last:border-0 last:pb-0">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {item.term}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Card */}
          {lesson.summary && (
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                Summary
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {lesson.summary}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default LessonView;
