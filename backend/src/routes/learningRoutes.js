import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import {
  getCourses,
  getCourseById,
  getLessonById,
  markLessonComplete,
  getUserProgress,
  getQuiz,
  submitQuiz,
  getGlossary,
  searchContent,
  getRecommendationsCtrl,
  getAchievements,
  getDashboard,
  ackAchievements,
  completeLesson,
  completeModule,
  completeCourse,
  forceReseed,
} from '../controllers/learningController.js';

const router = express.Router();

// ── Dashboard, Progress & Search ──────────────────────────────────────────────
router.get('/dashboard', optionalAuth, getDashboard);
router.get('/progress', optionalAuth, getUserProgress);
router.post('/progress', optionalAuth, markLessonComplete);
router.patch('/progress', optionalAuth, markLessonComplete);
router.patch('/progress/:id', optionalAuth, markLessonComplete);
router.get('/search', optionalAuth, searchContent);
router.get('/recommendations', optionalAuth, getRecommendationsCtrl);

// ── Completion Endpoints ──────────────────────────────────────────────────────
router.post('/lesson/:lessonId/complete', optionalAuth, completeLesson);
router.post('/module/:moduleId/complete', optionalAuth, completeModule);
router.post('/course/:courseId/complete', optionalAuth, completeCourse);

// ── Courses, Lessons & Quizzes ───────────────────────────────────────────────
router.get('/courses', optionalAuth, getCourses);
router.get('/courses/:id', optionalAuth, getCourseById);
router.get('/lessons/:id', optionalAuth, getLessonById);
router.get('/glossary', getGlossary);
router.get('/quiz/:lessonId', optionalAuth, getQuiz);
router.post('/quiz/:quizId/submit', optionalAuth, submitQuiz);

// ── Achievements ─────────────────────────────────────────────────────────────
router.get('/achievements', optionalAuth, getAchievements);
router.post('/achievements/ack', optionalAuth, ackAchievements);
router.post('/achievement/ack', optionalAuth, ackAchievements);
router.post('/achievements/:id/ack', optionalAuth, ackAchievements);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post('/admin/reseed', forceReseed);

export default router;
