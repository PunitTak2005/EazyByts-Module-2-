import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';

const MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

describe('User Preferences and Theme APIs', () => {
  let userToken;
  let testUser;

  beforeAll(async () => {
    process.env.MONGO_URI = MONGO_TEST_URI;
    process.env.JWT_SECRET = 'test_jwt_secret_token_123456';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_TEST_URI);
    }

    await User.deleteMany({});

    // Register test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Theme Tester',
        email: 'themetester@example.com',
        password: 'password123'
      });

    userToken = res.body.data.token;
    testUser = await User.findOne({ email: 'themetester@example.com' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  test('GET /api/users/preferences - Retrieve user preferences successfully', async () => {
    const res = await request(app)
      .get('/api/users/preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    // Default values check
    expect(res.body.data.theme).toBe('dark');
    expect(res.body.data.language).toBe('en');
  });

  test('PUT /api/users/preferences/theme - Update theme to light successfully', async () => {
    const res = await request(app)
      .put('/api/users/preferences/theme')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ theme: 'light' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('light');

    // Confirm DB update
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.preferences.theme).toBe('light');
  });

  test('PUT /api/users/preferences/theme - Update theme to system successfully', async () => {
    const res = await request(app)
      .put('/api/users/preferences/theme')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ theme: 'system' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('system');

    // Confirm DB update
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.preferences.theme).toBe('system');
  });

  test('PUT /api/users/preferences/theme - Reject invalid theme options', async () => {
    const res = await request(app)
      .put('/api/users/preferences/theme')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ theme: 'invalid-mode' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid theme preference');
  });
});
