import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';

const MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

beforeAll(async () => {
  process.env.MONGO_URI = MONGO_TEST_URI;
  process.env.JWT_SECRET = 'test_jwt_secret_token_123456';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_TEST_URI);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
    await mongoose.connection.close();
  }
});

describe('Authentication Module', () => {
  let userToken;
  let resetToken;
  const testUser = {
    name: 'John DoeTest',
    email: 'johndoetest@example.com',
    password: 'password123'
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('POST /api/auth/register - Register User successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/register - Prevent duplicate registrations', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('exists');
  });

  test('POST /api/auth/login - Authenticate registered User', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    userToken = res.body.data.token;
  });

  test('POST /api/auth/forgot-password - Generate password reset token', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resetToken).toBeDefined();
    resetToken = res.body.data.resetToken;
  });

  test('POST /api/auth/reset-password - Update password with valid token', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    // Get a token
    const tokenRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });
    
    const rToken = tokenRes.body.data.resetToken;

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rToken,
        newPassword: 'newpassword123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('updated');

    // Confirm login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'newpassword123'
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });
});
