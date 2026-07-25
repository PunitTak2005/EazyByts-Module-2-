/**
 * achievementService.js
 * Business logic for evaluating, listing, and acknowledging user learning achievements.
 */
import Achievement from '../models/Achievement.js';
import LearningProgress from '../models/LearningProgress.js';
import User from '../models/User.js';

export const DEFAULT_BADGES = [
  {
    id: 'first_lesson',
    badgeId: 'first_lesson',
    key: 'first_lesson',
    title: 'First Steps',
    description: 'Complete your very first trading lesson',
    icon: 'graduation-cap',
    category: 'Lessons',
    xpReward: 50,
    target: 1
  },
  {
    id: 'beginner_investor',
    badgeId: 'beginner_investor',
    key: 'beginner_investor',
    title: 'Beginner Investor',
    description: 'Complete a Beginner level learning course',
    icon: 'award',
    category: 'Courses',
    xpReward: 150,
    target: 1
  },
  {
    id: 'technical_analyst',
    badgeId: 'technical_analyst',
    key: 'technical_analyst',
    title: 'Technical Analyst',
    description: 'Complete an Intermediate level course',
    icon: 'bar-chart-2',
    category: 'Courses',
    xpReward: 250,
    target: 1
  },
  {
    id: 'quiz_champion',
    badgeId: 'quiz_champion',
    key: 'quiz_champion',
    title: 'Quiz Champion',
    description: 'Score 100% on any module assessment quiz',
    icon: 'zap',
    category: 'Quizzes',
    xpReward: 200,
    target: 1
  },
  {
    id: 'weekly_warrior',
    badgeId: 'weekly_warrior',
    key: 'weekly_warrior',
    title: 'Weekly Streak Master',
    description: 'Maintain a 7-day active learning streak',
    icon: 'flame',
    category: 'Streaks',
    xpReward: 300,
    target: 7
  }
];

export async function evaluateUserAchievements(userId, extraStats = {}) {
  try {
    let dbAchievements = await Achievement.find({}).lean().catch(() => []);
    if (!dbAchievements || dbAchievements.length === 0) {
      dbAchievements = DEFAULT_BADGES;
    }

    let allProgress = [];
    let user = null;

    if (userId && userId !== 'guest' && String(userId).length === 24) {
      allProgress = await LearningProgress.find({ userId }).lean().catch(() => []);
      user = await User.findById(userId).lean().catch(() => null);
    }

    const totalXP = (user?.xp || 0) + allProgress.reduce((sum, p) => sum + (p.totalXP || 0), 0);
    const completedLessonsTotal = allProgress.reduce((sum, p) => sum + (p.completedLessons || []).length, 0);
    const completedCoursesCount = allProgress.filter(p => p.isCompleted).length;
    const maxStreak = Math.max(1, ...allProgress.map(p => p.streak || 0), user?.streak || 0);

    const acknowledgedSet = new Set(
      allProgress.flatMap(p => (p.acknowledgedBadges || p.badges || []).map(b => String(b.key || b.badgeId || b.id || b)))
    );

    const badges = dbAchievements.map(b => {
      const bKey = String(b.key || b.badgeId || b.id || b._id);
      let progressVal = 0;
      let targetVal = b.target || 1;
      let unlocked = false;

      if (bKey === 'first_lesson') {
        progressVal = completedLessonsTotal;
        unlocked = completedLessonsTotal >= 1;
      } else if (bKey === 'beginner_investor') {
        progressVal = completedCoursesCount;
        unlocked = completedCoursesCount >= 1;
      } else if (bKey === 'technical_analyst') {
        progressVal = completedCoursesCount;
        unlocked = completedCoursesCount >= 2;
      } else if (bKey === 'weekly_warrior') {
        progressVal = maxStreak;
        targetVal = 7;
        unlocked = maxStreak >= 7;
      } else {
        unlocked = acknowledgedSet.has(bKey) || completedLessonsTotal >= 1;
        progressVal = unlocked ? targetVal : 0;
      }

      return {
        id: bKey,
        badgeId: bKey,
        key: bKey,
        title: b.title || b.name || 'Trader Badge',
        description: b.description || 'Achieved milestone',
        icon: b.icon || 'award',
        category: b.category || 'General',
        xpReward: b.xpReward || b.xp || 100,
        progress: Math.min(progressVal, targetVal),
        target: targetVal,
        unlocked,
        acknowledged: acknowledgedSet.has(bKey),
        unlockedAt: unlocked ? new Date().toISOString() : null
      };
    });

    const totalEarned = badges.filter(b => b.unlocked).length;
    const totalBadges = badges.length;
    const completionPercent = totalBadges > 0 ? Math.round((totalEarned / totalBadges) * 100) : 0;

    return {
      summary: {
        totalXP,
        completedLessons: completedLessonsTotal,
        completedCourses: completedCoursesCount,
        streak: maxStreak,
        badgesEarned: totalEarned,
        totalBadges,
        completionPercent
      },
      badges,
      totalEarned,
      totalBadges,
      completionPercent
    };
  } catch (err) {
    console.error('Error evaluating user achievements:', err);
    return {
      summary: { totalXP: 0, completedLessons: 0, completedCourses: 0, streak: 0, badgesEarned: 0, totalBadges: 5, completionPercent: 0 },
      badges: DEFAULT_BADGES.map(b => ({ ...b, progress: 0, unlocked: false, acknowledged: false })),
      totalEarned: 0,
      totalBadges: 5,
      completionPercent: 0
    };
  }
}

export async function acknowledgeBadges(userId, badgeIds = []) {
  try {
    if (!userId || userId === 'guest' || String(userId).length !== 24) {
      return { success: true, acknowledged: true };
    }

    const idsToAck = Array.isArray(badgeIds) ? badgeIds.map(String) : [String(badgeIds)];
    if (idsToAck.length === 0) return { success: true, acknowledged: true };

    const firstProg = await LearningProgress.findOne({ userId });
    if (firstProg) {
      if (!firstProg.acknowledgedBadges) firstProg.acknowledgedBadges = [];
      idsToAck.forEach(id => {
        if (!firstProg.acknowledgedBadges.includes(id)) {
          firstProg.acknowledgedBadges.push(id);
        }
      });
      await firstProg.save();
    } else {
      await LearningProgress.create({
        userId,
        acknowledgedBadges: idsToAck
      });
    }

    return { success: true, acknowledged: true };
  } catch (err) {
    console.error('Error acknowledging badges:', err);
    return { success: true, acknowledged: true };
  }
}
