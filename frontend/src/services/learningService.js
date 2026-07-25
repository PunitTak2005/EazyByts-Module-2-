import api from './api';

const PROGRESS_KEY = 'stock_dashboard_learning_progress';

// Helper for local storage progress management
const getLocalProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { completedLessonIds: [], totalXP: 420, lastLessonId: null, streak: 1 };
  } catch {
    return { completedLessonIds: [], totalXP: 420, lastLessonId: null, streak: 1 };
  }
};

const saveLocalProgress = (progress) => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('[LearningService] Failed to save learning progress to localStorage', err);
  }
};

export const MASTER_FALLBACK_BADGES = [
  // Course Completion
  { badgeId: 'course_1', name: 'First Course Completed', title: 'First Course Completed', category: 'courses', description: 'Complete your very first course on the platform.', icon: '🥉', rarity: 'common', milestone: 1, metric: 'completedCourses', xpReward: 100 },
  { badgeId: 'course_5', name: '5 Courses Completed', title: '5 Courses Completed', category: 'courses', description: 'Complete 5 courses to expand your investment knowledge.', icon: '🥈', rarity: 'rare', milestone: 5, metric: 'completedCourses', xpReward: 250 },
  { badgeId: 'course_10', name: '10 Courses Completed', title: '10 Courses Completed', category: 'courses', description: 'Complete 10 courses across various financial topics.', icon: '🥇', rarity: 'epic', milestone: 10, metric: 'completedCourses', xpReward: 500 },
  { badgeId: 'course_25', name: '25 Courses Completed', title: '25 Courses Completed', category: 'courses', description: 'Achieve total mastery by completing 25 courses.', icon: '🏆', rarity: 'legendary', milestone: 25, metric: 'completedCourses', xpReward: 1000 },
  
  // Lessons Completed
  { badgeId: 'first_steps', name: 'First Steps', title: 'First Steps', category: 'lessons', description: 'Take your first step on the learning journey.', icon: '🎯', rarity: 'common', milestone: 1, metric: 'completedLessons', xpReward: 50 },
  { badgeId: 'lesson_1', name: 'First Lesson Completed', title: 'First Lesson Completed', category: 'lessons', description: 'Take your first step on the learning journey.', icon: '🎯', rarity: 'common', milestone: 1, metric: 'completedLessons', xpReward: 50 },
  { badgeId: 'lesson_10', name: '10 Lessons Completed', title: '10 Lessons Completed', category: 'lessons', description: 'Successfully complete 10 market lessons.', icon: '📘', rarity: 'common', milestone: 10, metric: 'completedLessons', xpReward: 100 },
  { badgeId: 'lesson_25', name: '25 Lessons Completed', title: '25 Lessons Completed', category: 'lessons', description: 'Complete 25 lessons and build solid momentum.', icon: '📗', rarity: 'rare', milestone: 25, metric: 'completedLessons', xpReward: 200 },
  { badgeId: 'lesson_50', name: '50 Lessons Completed', title: '50 Lessons Completed', category: 'lessons', description: 'Reach a milestone of 50 completed lessons.', icon: '📙', rarity: 'epic', milestone: 50, metric: 'completedLessons', xpReward: 350 },
  { badgeId: 'lesson_100', name: '100 Lessons Completed', title: '100 Lessons Completed', category: 'lessons', description: 'Complete 100 lessons and become a market scholar.', icon: '📕', rarity: 'legendary', milestone: 100, metric: 'completedLessons', xpReward: 500 },
  { badgeId: 'lesson_250', name: '250 Lessons Completed', title: '250 Lessons Completed', category: 'lessons', description: 'Complete 250 lessons — legendary commitment.', icon: '🎓', rarity: 'legendary', milestone: 250, metric: 'completedLessons', xpReward: 1000 },

  // XP Earned
  { badgeId: 'xp_100', name: '100 XP Starter', title: '100 XP Starter', category: 'xp', description: 'Earn your first 100 experience points.', icon: '🌱', rarity: 'common', milestone: 100, metric: 'totalXP', xpReward: 25 },
  { badgeId: 'xp_250', name: '250 XP Learner', title: '250 XP Learner', category: 'xp', description: 'Cross 250 experience points on your learning journey.', icon: '⚡', rarity: 'common', milestone: 250, metric: 'totalXP', xpReward: 35 },
  { badgeId: 'xp_500', name: '500 XP Club', title: '500 XP Club', category: 'xp', description: 'Accumulate 500 XP points.', icon: '⭐', rarity: 'common', milestone: 500, metric: 'totalXP', xpReward: 50 },
  { badgeId: 'xp_1000', name: '1,000 XP Achieved', title: '1,000 XP Achieved', category: 'xp', description: 'Cross 1,000 total experience points.', icon: '⭐⭐', rarity: 'rare', milestone: 1000, metric: 'totalXP', xpReward: 100 },
  { badgeId: 'xp_2500', name: '2,500 XP Master', title: '2,500 XP Master', category: 'xp', description: 'Reach 2,500 XP on your dashboard.', icon: '⭐⭐⭐', rarity: 'epic', milestone: 2500, metric: 'totalXP', xpReward: 250 },
  { badgeId: 'xp_5000', name: '5,000 XP Legend', title: '5,000 XP Legend', category: 'xp', description: 'Accumulate 5,000 total experience points.', icon: '🌟', rarity: 'epic', milestone: 5000, metric: 'totalXP', xpReward: 500 },
  { badgeId: 'xp_10000', name: '10,000 XP Titan', title: '10,000 XP Titan', category: 'xp', description: 'Reach 10,000 XP — supreme academic standing.', icon: '💎', rarity: 'legendary', milestone: 10000, metric: 'totalXP', xpReward: 1000 },

  // Streaks
  { badgeId: 'streak_3', name: '3-Day Streak', title: '3-Day Streak', category: 'streaks', description: 'Maintain a learning streak for 3 consecutive days.', icon: '🔥', rarity: 'common', milestone: 3, metric: 'streak', xpReward: 50 },
  { badgeId: 'streak_7', name: '7-Day Streak', title: '7-Day Streak', category: 'streaks', description: 'Stay active for 7 days in a row.', icon: '🔥', rarity: 'rare', milestone: 7, metric: 'streak', xpReward: 100 },
  { badgeId: 'streak_14', name: '14-Day Streak', title: '14-Day Streak', category: 'streaks', description: 'Keep your streak alive for two full weeks.', icon: '🔥', rarity: 'epic', milestone: 14, metric: 'streak', xpReward: 200 },
  { badgeId: 'streak_30', name: '30-Day Streak', title: '30-Day Streak', category: 'streaks', description: 'Learn consistently for a full 30 days.', icon: '🔥', rarity: 'epic', milestone: 30, metric: 'streak', xpReward: 400 },
  { badgeId: 'streak_100', name: '100-Day Streak', title: '100-Day Streak', category: 'streaks', description: 'Achieve a monumental 100-day daily learning streak.', icon: '🔥', rarity: 'legendary', milestone: 100, metric: 'streak', xpReward: 1000 },

  // Time
  { badgeId: 'time_5h', name: '5 Hours Spent Learning', title: '5 Hours Spent Learning', category: 'time', description: 'Spend 5 hours studying stock market concepts.', icon: '⏱', rarity: 'common', milestone: 300, metric: 'totalTimeMinutes', xpReward: 50 },
  { badgeId: 'time_10h', name: '10 Hours Spent Learning', title: '10 Hours Spent Learning', category: 'time', description: 'Dedicate 10 total hours to your financial education.', icon: '⏱', rarity: 'rare', milestone: 600, metric: 'totalTimeMinutes', xpReward: 100 },
  { badgeId: 'time_25h', name: '25 Hours Spent Learning', title: '25 Hours Spent Learning', category: 'time', description: 'Spend 25 hours advancing your market knowledge.', icon: '⏱', rarity: 'epic', milestone: 1500, metric: 'totalTimeMinutes', xpReward: 250 },
  { badgeId: 'time_50h', name: '50 Hours Spent Learning', title: '50 Hours Spent Learning', category: 'time', description: 'Accumulate 50 hours of active learning.', icon: '⏱', rarity: 'epic', milestone: 3000, metric: 'totalTimeMinutes', xpReward: 500 },
  { badgeId: 'time_100h', name: '100 Hours Spent Learning', title: '100 Hours Spent Learning', category: 'time', description: 'Reach 100 hours of financial study — exceptional dedication.', icon: '⏱', rarity: 'legendary', milestone: 6000, metric: 'totalTimeMinutes', xpReward: 1000 },

  // Quizzes
  { badgeId: 'quiz_perfect', name: 'Perfect Score', title: 'Perfect Score', category: 'quizzes', description: 'Score 100% on a lesson quiz.', icon: '🧠', rarity: 'common', milestone: 1, metric: 'quizPerfectCount', xpReward: 50 },
  { badgeId: 'quiz_perfect_10', name: 'Quiz Specialist', title: 'Quiz Specialist', category: 'quizzes', description: 'Achieve a 100% perfect score on 10 different quizzes.', icon: '🎯', rarity: 'epic', milestone: 10, metric: 'quizPerfectCount', xpReward: 300 },

  // Special
  { badgeId: 'module_1', name: 'First Module Completed', title: 'First Module Completed', category: 'special', description: 'Finish all lessons inside your first module.', icon: '🧩', rarity: 'common', milestone: 1, metric: 'completedModules', xpReward: 50 },
  { badgeId: 'course_1_day', name: 'Course Sprint', title: 'Course Sprint', category: 'special', description: 'Complete an entire course in a single day.', icon: '⚡', rarity: 'epic', milestone: 1, metric: 'courseInOneDay', xpReward: 200 },
  { badgeId: 'beginner_master', name: 'Beginner Master', title: 'Beginner Master', category: 'special', description: 'Complete all beginner-level courses.', icon: '🏅', rarity: 'rare', milestone: 1, metric: 'beginnerMaster', xpReward: 300 },
  { badgeId: 'intermediate_master', name: 'Intermediate Master', title: 'Intermediate Master', category: 'special', description: 'Complete all intermediate-level courses.', icon: '🎖️', rarity: 'epic', milestone: 1, metric: 'intermediateMaster', xpReward: 500 },
  { badgeId: 'advanced_master', name: 'Advanced Master', title: 'Advanced Master', category: 'special', description: 'Complete all advanced-level courses.', icon: '👑', rarity: 'legendary', milestone: 1, metric: 'advancedMaster', xpReward: 750 },
  { badgeId: 'all_courses_done', name: 'Grand Master', title: 'Grand Master', category: 'special', description: 'Complete every single available course on the platform.', icon: '🌟', rarity: 'legendary', milestone: 1, metric: 'allCoursesMaster', xpReward: 1500 }
];

export const deriveFallbackAchievements = (localProg = {}) => {
  const completedLessons = localProg.completedLessonIds?.length || 0;
  const totalXP = localProg.totalXP || 0;
  const streak = localProg.streak || 1;
  const completedCourses = localProg.completedCourses || 0;
  const completedModules = localProg.completedModules || (completedLessons > 0 ? 1 : 0);
  const totalTimeMinutes = completedLessons * 15;

  const metricMap = {
    completedLessons,
    completedCourses,
    completedModules,
    totalXP,
    streak,
    totalTimeMinutes,
    quizPerfectCount: 0,
    beginnerMaster: 0,
    intermediateMaster: 0,
    advancedMaster: 0,
    allCoursesMaster: 0,
    courseInOneDay: 0,
  };

  return MASTER_FALLBACK_BADGES.map(badge => {
    const curVal = metricMap[badge.metric] ?? 0;
    const target = badge.milestone;
    const isUnlocked = curVal >= target;
    const prog = Math.min(curVal, target);
    const percentage = target > 0 ? Math.min(100, Math.round((prog / target) * 100)) : 0;

    return {
      id: badge.badgeId,
      badgeId: badge.badgeId,
      title: badge.name,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      icon: badge.icon,
      rarity: badge.rarity,
      unlocked: isUnlocked,
      earned: isUnlocked,
      unlockedAt: isUnlocked ? new Date() : null,
      earnedAt: isUnlocked ? new Date() : null,
      progress: prog,
      target,
      maxProgress: target,
      percentage,
      xpReward: badge.xpReward,
      level: 1,
      notified: false
    };
  });
};

// Static fallback loader from /data directory
const fetchStaticCourse = async (id = 'introduction-stock-market') => {
  try {
    const res = await fetch('/data/courses/introduction-stock-market.json');
    if (!res.ok) throw new Error('Static course file not found');
    const courseData = await res.json();
    return courseData;
  } catch (err) {
    console.warn('[LearningService] Fallback to static JSON error:', err.message);
    return null;
  }
};

export const learningService = {
  getCourses: async (searchOrLevel) => {
    try {
      const level = searchOrLevel?.trim() ?? "";
      const response = await api.get('/learning/courses', {
        params: { level: level || undefined },
      });
      if (response && response.courses && response.courses.length > 0) {
        return response;
      }
    } catch (err) {
      console.warn('[LearningService] API /learning/courses failed, falling back to /data JSON:', err.message);
    }

    const staticCourse = await fetchStaticCourse();
    const courses = staticCourse ? [staticCourse] : [];
    return { success: true, courses };
  },

  getCourseById: async (id) => {
    try {
      const data = await api.get(`/learning/courses/${id}`);
      if (data && data.course) {
        const localProg = getLocalProgress();
        const serverCompleted = data.course.progress?.completedLessonIds || [];
        const mergedSet = new Set([...serverCompleted, ...localProg.completedLessonIds]);
        
        saveLocalProgress({
          ...localProg,
          completedLessonIds: Array.from(mergedSet)
        });

        return {
          ...data.course,
          progress: {
            ...data.course.progress,
            completedLessonIds: Array.from(mergedSet)
          }
        };
      }
    } catch (err) {
      console.warn('[LearningService] API getCourseById failed, using static /data:', err.message);
    }

    const staticCourse = await fetchStaticCourse(id);
    if (!staticCourse) throw new Error("Course not found");

    const localProg = getLocalProgress();
    const completedSet = new Set(localProg.completedLessonIds);
    const total = staticCourse.lessons?.length || 1;
    const completedCount = (staticCourse.lessons || []).filter(l => completedSet.has(l.id || l._id)).length;
    const percentComplete = Math.round((completedCount / total) * 100 * 10) / 10;

    return {
      ...staticCourse,
      progress: {
        completedLessonIds: Array.from(completedSet),
        percentComplete,
        isCompleted: percentComplete === 100,
        lastLessonId: localProg.lastLessonId
      }
    };
  },

  getLessonById: async (id) => {
    try {
      const data = await api.get(`/learning/lessons/${id}`);
      if (data && data.data) {
        const localProg = getLocalProgress();
        saveLocalProgress({ ...localProg, lastLessonId: id });
        return data.data;
      }
    } catch (err) {
      console.warn('[LearningService] API getLessonById failed, falling back to static /data:', err.message);
    }

    const staticCourse = await fetchStaticCourse();
    if (!staticCourse || !staticCourse.lessons) throw new Error("Lesson not found");

    const lesson = staticCourse.lessons.find(l => l.id === id || l._id === id);
    if (!lesson) throw new Error("Lesson not found");

    const localProg = getLocalProgress();
    saveLocalProgress({ ...localProg, lastLessonId: id });

    const parentModule = staticCourse.modules?.find(m => m.id === lesson.moduleId);
    const related = (staticCourse.lessons || [])
      .filter(l => l.moduleId === lesson.moduleId && l.id !== lesson.id)
      .slice(0, 3);

    return {
      ...lesson,
      _id: lesson.id || lesson._id,
      xpReward: lesson.xpReward || 50,
      courseId: {
        _id: staticCourse.id || staticCourse._id,
        title: staticCourse.title
      },
      moduleTitle: parentModule ? parentModule.title : '',
      relatedLessons: related.map(r => ({
        _id: r.id,
        title: r.title,
        estimatedMinutes: r.estimatedMinutes || 5,
        difficulty: r.difficulty || 'Beginner'
      }))
    };
  },

  getDashboard: async () => {
    try {
      const response = await api.get('/learning/dashboard');
      if (response && response.data) {
        const localProg = getLocalProgress();
        saveLocalProgress({
          ...localProg,
          completedLessonIds: response.data.completedLessonIds || localProg.completedLessonIds,
          totalXP: Math.max(response.data.totalXP || 0, localProg.totalXP || 0),
          lastLessonId: response.data.lastLessonId || localProg.lastLessonId
        });

        const badges = response.data.achievements || response.badges || [];
        console.log(`[LearningService] Frontend received badges: ${badges.length}`);
        return response;
      }
    } catch (err) {
      console.warn('[LearningService] API getDashboard failed, using getProgress fallback:', err.message);
    }
    return learningService.getProgress();
  },

  getProgress: async () => {
    const localProg = getLocalProgress();
    try {
      const response = await api.get('/learning/progress');
      if (response && response.data) {
        const mergedSet = new Set([...(response.data.completedLessonIds || []), ...localProg.completedLessonIds]);
        saveLocalProgress({
          ...localProg,
          completedLessonIds: Array.from(mergedSet),
          totalXP: Math.max(response.data.totalXP || 0, localProg.totalXP || 0)
        });

        const badges = response.data.achievements || response.badges || deriveFallbackAchievements(localProg);
        console.log(`[LearningService] Frontend received badges: ${badges.length}`);

        return {
          success: true,
          data: {
            ...response.data,
            achievements: badges,
            completedLessonIds: Array.from(mergedSet),
            totalXP: Math.max(response.data.totalXP || 0, localProg.totalXP || 0),
            lastLessonId: localProg.lastLessonId
          }
        };
      }
    } catch (err) {
      console.warn('[LearningService] API getProgress failed, using local storage:', err.message);
    }

    const staticCourse = await fetchStaticCourse();
    const totalLessons = staticCourse?.lessons?.length || 40;
    const completedCount = localProg.completedLessonIds.length;
    const percent = Math.round((completedCount / totalLessons) * 100 * 10) / 10;
    const fallbackBadges = deriveFallbackAchievements(localProg);

    console.log(`[LearningService] Frontend received badges: ${fallbackBadges.length} (fallback)`);

    return {
      success: true,
      data: {
        totalXP: localProg.totalXP || 420,
        level: Math.floor((localProg.totalXP || 420) / 200) + 1,
        streak: localProg.streak || 1,
        completedLessonIds: localProg.completedLessonIds,
        completedCourses: percent === 100 ? 1 : 0,
        lastLessonId: localProg.lastLessonId,
        achievements: fallbackBadges,
        courses: staticCourse ? [{
          _id: staticCourse.id,
          courseId: staticCourse.id,
          title: staticCourse.title,
          completedLessons: localProg.completedLessonIds,
          percentComplete: percent,
          isCompleted: percent === 100
        }] : []
      }
    };
  },

  markLessonComplete: async (lessonId, timeSpentMinutes = 5) => {
    const localProg = getLocalProgress();
    const completedSet = new Set(localProg.completedLessonIds);
    let xpEarned = 0;

    if (!completedSet.has(lessonId)) {
      completedSet.add(lessonId);
      xpEarned = 50;
    }

    const newTotalXP = (localProg.totalXP || 0) + xpEarned;
    const updatedLocal = {
      ...localProg,
      completedLessonIds: Array.from(completedSet),
      totalXP: newTotalXP,
      lastLessonId: lessonId
    };
    saveLocalProgress(updatedLocal);

    try {
      const response = await api.post('/learning/progress', { lessonId, timeSpentMinutes });
      if (response && response.data) return response;
    } catch (err) {
      console.warn('[LearningService] API markLessonComplete failed, saved locally:', err.message);
    }

    return {
      success: true,
      data: {
        lessonId,
        xpEarned,
        totalXP: newTotalXP,
        level: Math.floor(newTotalXP / 200) + 1,
        completedLessonIds: Array.from(completedSet),
        achievements: deriveFallbackAchievements(updatedLocal)
      }
    };
  },

  getRecommendations: async () => {
    try {
      const response = await api.get('/learning/recommendations');
      if (response && response.data) return response;
    } catch (err) {
      console.warn('[LearningService] API getRecommendations failed:', err.message);
    }

    const staticCourse = await fetchStaticCourse();
    return { success: true, data: staticCourse ? [staticCourse] : [] };
  },

  getAchievements: async (params = {}) => {
    try {
      const response = await api.get('/learning/achievements', { params });
      if (response) {
        const list = response.badges || response.data || [];
        console.log(`[LearningService] Frontend received badges: ${list.length}`);
        return {
          success: true,
          summary: response.summary || { total: list.length, unlocked: list.filter(b=>b.unlocked).length, locked: list.filter(b=>!b.unlocked).length },
          badges: list,
          data: list
        };
      }
    } catch (err) {
      console.warn('[LearningService] API getAchievements failed, using local storage fallback:', err.message);
    }

    const localProg = getLocalProgress();
    const fallbackBadges = deriveFallbackAchievements(localProg);
    console.log(`[LearningService] Frontend received badges: ${fallbackBadges.length} (fallback)`);

    return {
      success: true,
      summary: {
        total: fallbackBadges.length,
        unlocked: fallbackBadges.filter(b => b.unlocked).length,
        locked: fallbackBadges.filter(b => !b.unlocked).length,
      },
      badges: fallbackBadges,
      data: fallbackBadges
    };
  },

  acknowledgeBadgeUnlock: async (badgeIds = []) => {
    try {
      const response = await api.post('/learning/achievements/ack', { badgeIds });
      return response;
    } catch (err) {
      console.warn('[LearningService] acknowledgeBadgeUnlock failed:', err.message);
      return { success: false };
    }
  },

  getGlossary: async (params = {}) => {
    try {
      const response = await api.get('/learning/glossary', { params });
      if (response && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`[LearningService] Glossary API returned ${response.data.length} terms`);
        return response;
      }
    } catch (err) {
      console.warn('[LearningService] API getGlossary failed, fetching static /data/glossary/glossary.json:', err.message);
    }

    try {
      const res = await fetch('/data/glossary/glossary.json');
      if (res.ok) {
        const dataset = await res.json();
        console.log(`[LearningService] Loaded ${dataset.data?.length || 0} static glossary terms`);
        return { success: true, data: dataset.data || [] };
      }
    } catch (e) {
      console.error('[LearningService] Static glossary fetch failed:', e);
    }
    return { success: false, data: [] };
  }
};
