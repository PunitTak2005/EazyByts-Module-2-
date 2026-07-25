import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  Clock,
  Zap,
} from 'lucide-react';

import api from '@/services/api';

/**
 * Full quiz engine component.
 * Props:
 *   quiz        – { _id, title, questions, timeLimitSeconds, passingScore }
 *   onComplete  – callback({ score, passed, xpEarned, newBadges })
 */
const QuizEngine = ({ quiz, onComplete }) => {
  const qc = useQueryClient();
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(quiz?.timeLimitSeconds || 0);

  // Reset quiz state when quiz changes
  React.useEffect(() => {
    setPhase('intro');
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowFeedback(false);
    setResult(null);
    setTimeLeft(quiz?.timeLimitSeconds || 0);
  }, [quiz?._id, quiz?.id, quiz?.title]);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIdx];

  // Submit quiz mutation
  const submitMutation = useMutation({
    mutationFn: (submittedAnswers) =>
      api
        .post(`/learning/quiz/${quiz._id}/submit`, { answers: submittedAnswers })
        .then((r) => r.data),
    onSuccess: (data) => {
      setResult(data.data);
      setPhase('result');
      qc.invalidateQueries({ queryKey: ['learning-progress'] });
      qc.invalidateQueries({ queryKey: ['learning-dashboard'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course'] });
      qc.invalidateQueries({ queryKey: ['achievements'] });
      onComplete?.(data.data);
      if (data.data.xpEarned > 0) {
        toast.success(`+${data.data.xpEarned} XP earned!`, {
          icon: '⚡',
          style: { fontWeight: 700 },
        });
      }
    },
    onError: (err, submittedAnswers) => {
      // Local fallback evaluation
      console.warn('[QuizEngine] API submission failed, evaluating quiz locally:', err);
      let correct = 0;
      const feedback = questions.map((q, idx) => {
        const choiceIdx = submittedAnswers[idx];
        const choiceLetter = ['A', 'B', 'C', 'D'][choiceIdx];
        const isCorrect = 
          choiceIdx === q.correctIndex ||
          choiceIdx === q.correctAnswer || 
          choiceLetter === q.answer || 
          q.options?.[choiceIdx] === q.answer;

        if (isCorrect) correct++;
        return {
          questionIndex: idx,
          questionText: q.text || q.questionText || q.question || `Question ${idx + 1}`,
          isCorrect,
          correctAnswer: q.correctIndex ?? q.correctAnswer ?? q.answer,
          explanation: q.explanation || ''
        };
      });

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (quiz.passingScore || 60);
      const xpEarned = passed ? (quiz.xpReward || 50) : 0;

      const evalResult = {
        score,
        passed,
        correct,
        total: questions.length,
        xpEarned,
        feedback
      };

      setResult(evalResult);
      setPhase('result');
      onComplete?.(evalResult);

      if (xpEarned > 0) {
        toast.success(`+${xpEarned} XP earned!`, { icon: '⚡' });
      }
    },
  });

  const handleSelectOption = useCallback(
    (idx) => {
      if (showFeedback) return;
      setSelectedOption(idx);
    },
    [showFeedback]
  );

  const handleNext = () => {
    if (selectedOption === null) {
      toast.error('Please select an answer');
      return;
    }

    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setShowFeedback(true);

    // Move to next question after short delay
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);

      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
      } else {
        // Submit
        submitMutation.mutate(newAnswers);
      }
    }, 1800);
  };

  const handleRetry = () => {
    setPhase('intro');
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowFeedback(false);
    setResult(null);
  };

  // ── INTRO SCREEN ────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl shadow-lg">
          🧠
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          {quiz.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {questions.length} questions · Pass at {quiz.passingScore ?? 60}% · +{quiz.xpReward} XP
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500 mb-6">
          {quiz.timeLimitSeconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {Math.ceil(quiz.timeLimitSeconds / 60)} min limit
            </span>
          )}
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-amber-500" /> +{quiz.xpReward} XP on pass
          </span>
        </div>
        <button
          onClick={() => setPhase('quiz')}
          className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-md"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // ── RESULT SCREEN ───────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const { score, passed, correct, total, feedback, xpEarned } = result;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border bg-white dark:bg-dark-card p-6"
      >
        {/* Score header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{passed ? '🎉' : '😔'}</div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {score}%
          </h3>
          <p className={`text-sm font-semibold mt-1 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
            {passed ? 'You Passed!' : 'Not quite — keep studying!'}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
            <span>{correct}/{total} correct</span>
            {xpEarned > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Zap size={14} /> +{xpEarned} XP
              </span>
            )}
          </div>
        </div>

        {/* Per-question feedback */}
        <div className="space-y-3 mb-6">
          {feedback.map((f, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 ${
                f.isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900'
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {f.isCorrect ? (
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Q{i + 1}: {f.questionText}
                  </p>
                  {f.explanation && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {f.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-dark-border py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      </motion.div>
    );
  }

  // ── QUIZ SCREEN ─────────────────────────────────────────────────────────────
  const progress = ((currentIdx) / questions.length) * 100;
  const isCorrect = showFeedback && selectedOption === (currentQuestion.correctIndex ?? -1);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700">
        <motion.div
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
        />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {quiz.title}
          </span>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-5 leading-snug">
              {currentQuestion.text}
            </p>

            {/* Options */}
            <div className="space-y-2.5 mb-6">
              {(currentQuestion.options || []).map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectOption = showFeedback && idx === currentQuestion.correctIndex;
                const isWrongSelected = showFeedback && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={idx}
                    whileHover={!showFeedback ? { scale: 1.01 } : {}}
                    onClick={() => handleSelectOption(idx)}
                    disabled={showFeedback}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                      isCorrectOption
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                        : isWrongSelected
                        ? 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                        : isSelected
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    {/* Option letter */}
                    <span
                      className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCorrectOption
                          ? 'bg-emerald-500 text-white'
                          : isWrongSelected
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation after feedback */}
            {showFeedback && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-600 dark:text-slate-300 italic"
              >
                💡 {currentQuestion.explanation}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={selectedOption === null || showFeedback || submitMutation.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitMutation.isPending ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : currentIdx + 1 === questions.length ? (
            <>Submit Quiz</>
          ) : (
            <>
              Next <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizEngine;
