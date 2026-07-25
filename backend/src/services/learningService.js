/**
 * learningService.js
 * Business logic for XP, streaks, level-up, badge evaluation,
 * badge evaluation, and personalized recommendations.
 */
import LearningProgress from '../models/LearningProgress.js';
import Achievement from '../models/Achievement.js';
import Course from '../models/Course.js';

// ─── Level Thresholds ────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 5000];

export function getLevelFromXP(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpToNextLevel(xp) {
  const level = getLevelFromXP(xp);
  const next = LEVEL_THRESHOLDS[level]; // undefined if max level
  return next ? next - xp : 0;
}

// ─── Streak Logic ─────────────────────────────────────────────────────────────
export function computeStreak(lastActiveDate, currentStreak) {
  if (!lastActiveDate) return 1;

  const now = new Date();
  const last = new Date(lastActiveDate);
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return currentStreak;          // Same day, no change
  if (diffDays === 1) return currentStreak + 1;      // Next consecutive day
  return 1;                                          // Streak broken
}

// ─── Achievement Evaluation ───────────────────────────────────────────────────
const BADGE_RULES = [
  {
    key: 'first_lesson',
    check: ({ completedLessonsTotal }) => completedLessonsTotal >= 1,
  },
  {
    key: 'beginner_investor',
    check: ({ completedCourses }) =>
      completedCourses.some((c) => c.level === 'beginner'),
  },
  {
    key: 'technical_analyst',
    check: ({ completedCourses }) =>
      completedCourses.some((c) => c.level === 'intermediate'),
  },
  {
    key: 'portfolio_master',
    check: ({ completedCourses }) =>
      completedCourses.some((c) => c.level === 'advanced'),
  },
  {
    key: 'quiz_champion',
    check: ({ quizPerfectScores }) => quizPerfectScores >= 1,
  },
  {
    key: 'weekly_warrior',
    check: ({ streak }) => streak >= 7,
  },
  {
    key: 'monthly_master',
    check: ({ streak }) => streak >= 30,
  },
];

/**
 * Evaluate which new badges the user has just earned.
 * Returns array of newly earned badge keys.
 */
export async function evaluateBadges(userId, stats) {
  // Load achievement definitions
  const allAchievements = await Achievement.find({}).lean();
  const achievementMap = {};
  for (const a of allAchievements) {
    achievementMap[a.key] = a;
  }

  // Collect all currently held badges across all progress docs
  const allProgress = await LearningProgress.find({ userId }).lean();
  const heldKeys = new Set(
    allProgress.flatMap((p) => (p.badges || []).map((b) => b.key))
  );

  const newlyEarned = [];
  for (const rule of BADGE_RULES) {
    if (!heldKeys.has(rule.key) && rule.check(stats)) {
      const def = achievementMap[rule.key];
      if (def) {
        newlyEarned.push({
          key: rule.key,
          title: def.title,
          icon: def.icon,
          xpReward: def.xpReward,
          earnedAt: new Date(),
        });
      }
    }
  }

  return newlyEarned;
}

// ─── Personalized Recommendations ────────────────────────────────────────────
/**
 * Return up to `limit` recommended courses/lessons for a user
 * based on their completed courses and overall XP level.
 */
export async function getRecommendations(userId, limit = 6) {
  const allProgress = await LearningProgress.find({ userId })
    .populate('courseId', 'level')
    .lean();

  const completedCourseIds = new Set(
    allProgress.filter((p) => p.isCompleted).map((p) => String(p.courseId?._id))
  );

  const completedLevels = new Set(
    allProgress
      .filter((p) => p.isCompleted && p.courseId)
      .map((p) => p.courseId.level)
  );

  // Priority: in-progress courses first, then uncompleted at next level
  const inProgress = allProgress
    .filter((p) => !p.isCompleted && p.percentComplete > 0)
    .map((p) => String(p.courseId?._id));

  const levelOrder = ['beginner', 'intermediate', 'advanced'];
  let nextLevel = 'beginner';
  for (const lvl of levelOrder) {
    if (!completedLevels.has(lvl)) {
      nextLevel = lvl;
      break;
    }
  }

  const query = {
    isPublished: true,
    _id: { $nin: [...completedCourseIds] },
  };

  const courses = await Course.find(query)
    .sort({ level: 1, order: 1 })
    .limit(limit * 2)
    .lean();

  // Score: prefer in-progress, then next level, then same level
  const scored = courses.map((c) => {
    let score = 0;
    if (inProgress.includes(String(c._id))) score += 100;
    if (c.level === nextLevel) score += 50;
    return { ...c, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit);
}


