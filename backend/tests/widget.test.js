process.env.JWT_SECRET = 'test_jwt_secret_token_123456';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import UserLayout from '../src/models/UserLayout.js';

describe('Dashboard Widget Workspace Layout APIs Tests', () => {
  let token;
  let testUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    await User.deleteMany({});
    await UserLayout.deleteMany({});

    // Register test user
    const resReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Workspace Tester',
        email: 'worktester@example.com',
        password: 'password123'
      });

    token = resReg.body.data.token;
    testUser = await User.findOne({ email: 'worktester@example.com' });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await UserLayout.deleteMany({});
      await mongoose.connection.close();
    }
  });

  it('should initialize and return default layout on GET', async () => {
    const res = await request(app)
      .get('/api/widgets/layout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.widgets.length).toBe(6);
    expect(res.body.data.widgets[0].widgetId).toBe('portfolio');
  });

  it('should update and persist customized widgets layouts on POST', async () => {
    const customLayout = [
      { widgetId: 'movers', colSpan: 4, order: 0, isVisible: true },
      { widgetId: 'portfolio', colSpan: 2, order: 1, isVisible: false }
    ];

    const res = await request(app)
      .post('/api/widgets/layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ widgets: customLayout });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.widgets.length).toBe(2);
    expect(res.body.data.widgets[0].widgetId).toBe('movers');
    expect(res.body.data.widgets[0].colSpan).toBe(4);
    expect(res.body.data.widgets[1].isVisible).toBe(false);

    // Verify it persists in database
    const dbRecord = await UserLayout.findOne({ userId: testUser._id });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord.widgets.length).toBe(2);
  });
});
