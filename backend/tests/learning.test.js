/**
 * learning.test.js
 * Integration tests for the Educational Learning Center API.
 * Run with: npm test (from backend/)
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Quiz from '../src/models/Quiz.js';
import GlossaryTerm from '../src/models/GlossaryTerm.js';
import Achievement from '../src/models/Achievement.js';
import LearningProgress from '../src/models/LearningProgress.js';

const TEST_DB =
  process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/stock-simulator-test';

let token;
let userId;
let courseId;
let lessonId;
let quizId;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createTestUser() {
  const user = await User.create({
    name: 'Learning Tester',
    email: `learning_${Date.now()}@test.com`,
    password: '$2b$10$somehashedpassword',
    isActive: true,
    role: 'user',
  });
  userId = user._id;
  return user;
}

async function loginAndGetToken() {
  // Directly sign JWT to avoid depending on auth controller
  const jwt = await import('jsonwebtoken');
  const user = await createTestUser();
  token = jwt.default.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'stock_market_simulator_jwt_secret_token_987654321',
    { expiresIn: '1d' }
  );
  return token;
}

async function seedCourseData() {
  const course = await Course.create({
    title: 'Test Course',
    slug: `test-course-${Date.now()}`,
    description: 'A test course for integration testing.',
    level: 'beginner',
    category: 'Testing',
    estimatedHours: 1,
    xpReward: 100,
    lessons: [],
    isPublished: true,
  });
  courseId = course._id;

  const lesson = await Lesson.create({
    courseId: course._id,
    title: 'Test Lesson',
    slug: `test-lesson-${Date.now()}`,
    content: '## Test Lesson\nThis is test content.',
    summary: 'A test lesson.',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    xpReward: 50,
    order: 1,
    isPublished: true,
  });
  lessonId = lesson._id;

  course.lessons = [lesson._id];
  await course.save();

  const quiz = await Quiz.create({
    lessonId: lesson._id,
    courseId: course._id,
    title: 'Test Quiz',
    questions: [
      {
        text: 'What is 2 + 2?',
        type: 'mcq',
        options: ['3', '4', '5', '6'],
        correctIndex: 1,
        explanation: '2 + 2 = 4.',
      },
    ],
    passingScore: 50,
    xpReward: 25,
    isPublished: true,
  });
  quizId = quiz._id;

  await Achievement.create({
    key: 'first_lesson',
    title: 'First Step',
    description: 'Complete your first lesson.',
    icon: '🎓',
    xpReward: 50,
  });

  await GlossaryTerm.create({
    term: 'TestTerm',
    definition: 'A term used for testing.',
    example: 'Example for TestTerm.',
    relatedTerms: ['Stock'],
    tags: ['testing'],
  });
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await loginAndGetToken();
  await seedCourseData();
});

afterAll(async () => {
  // Clean up test data
  await Promise.all([
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
    LearningProgress.deleteMany({}),
    Achievement.deleteMany({}),
    GlossaryTerm.deleteMany({ term: 'TestTerm' }),
    User.findByIdAndDelete(userId),
  ]);
  await mongoose.connection.close();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Learning Center API', () => {
  // ── Courses ─────────────────────────────────────────────────────────────────
  describe('GET /api/learning/courses', () => {
    it('should return published courses with progress field', async () => {
      const res = await request(app)
        .get('/api/learning/courses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('progress');
    });

    it('should filter courses by level', async () => {
      const res = await request(app)
        .get('/api/learning/courses?level=beginner')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((c) => c.level === 'beginner')).toBe(true);
    });
  });

  describe('GET /api/learning/courses/:id', () => {
    it('should return course with lessons and progress', async () => {
      const res = await request(app)
        .get(`/api/learning/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('lessons');
      expect(res.body.data).toHaveProperty('progress');
      expect(Array.isArray(res.body.data.lessons)).toBe(true);
    });

    it('should return 404 for nonexistent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/learning/courses/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Lessons ─────────────────────────────────────────────────────────────────
  describe('GET /api/learning/lessons/:id', () => {
    it('should return lesson with quiz and bookmark status', async () => {
      const res = await request(app)
        .get(`/api/learning/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('content');
      expect(res.body.data).toHaveProperty('isBookmarked');
    });
  });

  // ── Progress ─────────────────────────────────────────────────────────────────
  describe('POST /api/learning/progress', () => {
    it('should require lessonId in body', async () => {
      const res = await request(app)
        .post('/api/learning/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should mark lesson complete and return XP', async () => {
      const res = await request(app)
        .post('/api/learning/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: String(lessonId), timeSpentMinutes: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('xpEarned');
      expect(res.body.data).toHaveProperty('totalXP');
      expect(res.body.data).toHaveProperty('streak');
      expect(res.body.data.xpEarned).toBeGreaterThanOrEqual(0);
    });

    it('should not double-award XP on second mark-complete', async () => {
      const firstRes = await request(app)
        .post('/api/learning/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: String(lessonId) });

      // XP should be 0 since already completed
      expect(firstRes.body.data.xpEarned).toBe(0);
      expect(firstRes.body.message).toMatch(/already completed/i);
    });
  });

  describe('GET /api/learning/progress', () => {
    it('should return user progress summary', async () => {
      const res = await request(app)
        .get('/api/learning/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalXP');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data).toHaveProperty('streak');
      expect(res.body.data).toHaveProperty('badges');
    });
  });

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  describe('GET /api/learning/quiz/:lessonId', () => {
    it('should return quiz for lesson without revealing answers', async () => {
      const res = await request(app)
        .get(`/api/learning/quiz/${lessonId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('questions');
      // Correct answers should NOT be exposed
      expect(res.body.data.questions[0]).not.toHaveProperty('correctIndex');
    });
  });

  describe('POST /api/learning/quiz/:quizId/submit', () => {
    it('should require answers array', async () => {
      const res = await request(app)
        .post(`/api/learning/quiz/${quizId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should score quiz and return feedback with explanations', async () => {
      const res = await request(app)
        .post(`/api/learning/quiz/${quizId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ answers: [1] }); // correct answer

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.passed).toBe(true);
      expect(res.body.data.feedback[0]).toHaveProperty('explanation');
      expect(res.body.data.xpEarned).toBeGreaterThan(0);
    });

    it('should return 0 XP for failing score', async () => {
      const res = await request(app)
        .post(`/api/learning/quiz/${quizId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ answers: [0] }); // wrong answer

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(0);
      expect(res.body.data.passed).toBe(false);
      expect(res.body.data.xpEarned).toBe(0);
    });
  });

  // ── Bookmarks ─────────────────────────────────────────────────────────────────
  describe('Bookmarks', () => {
    it('POST /api/learning/bookmark should create bookmark', async () => {
      const res = await request(app)
        .post('/api/learning/bookmark')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: String(lessonId), note: 'Important lesson' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('lessonId');
      expect(res.body.data.note).toBe('Important lesson');
    });

    it('GET /api/learning/bookmarks should list bookmarks', async () => {
      const res = await request(app)
        .get('/api/learning/bookmarks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('DELETE /api/learning/bookmark/:lessonId should remove bookmark', async () => {
      const res = await request(app)
        .delete(`/api/learning/bookmark/${lessonId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── Glossary ─────────────────────────────────────────────────────────────────
  describe('GET /api/learning/glossary', () => {
    it('should return all glossary terms', async () => {
      const res = await request(app).get('/api/learning/glossary');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter glossary by letter', async () => {
      const res = await request(app).get('/api/learning/glossary?letter=T');

      expect(res.status).toBe(200);
      expect(
        res.body.data.every((t) => t.term.toUpperCase().startsWith('T'))
      ).toBe(true);
    });
  });

  // ── Achievements ──────────────────────────────────────────────────────────────
  describe('GET /api/learning/achievements', () => {
    it('should return all achievements with earned status', async () => {
      const res = await request(app)
        .get('/api/learning/achievements')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('earned');
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────────
  describe('GET /api/learning/recommendations', () => {
    it('should return recommended courses', async () => {
      const res = await request(app)
        .get('/api/learning/recommendations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── Certificates ──────────────────────────────────────────────────────────────
  describe('GET /api/learning/certificates', () => {
    it('should return user certificates', async () => {
      const res = await request(app)
        .get('/api/learning/certificates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── Auth protection ────────────────────────────────────────────────────────────
  describe('Auth protection', () => {
    it('should reject unauthenticated progress requests', async () => {
      const res = await request(app)
        .post('/api/learning/progress')
        .send({ lessonId: String(lessonId) });

      expect(res.status).toBe(401);
    });
  });
});
