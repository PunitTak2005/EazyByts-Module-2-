import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Stock from '../src/models/Stock.js';
import Holding from '../src/models/Holding.js';

const MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

describe('Analytics APIs', () => {
  let userToken;
  let testUserDoc;
  let testStockDoc;

  beforeAll(async () => {
    process.env.MONGO_URI = MONGO_TEST_URI;
    process.env.JWT_SECRET = 'test_jwt_secret_token_123456';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_TEST_URI);
    }

    await User.deleteMany({});
    await Stock.deleteMany({});
    await Holding.deleteMany({});

    // Register User
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Analytics Tester',
        email: 'analytictester@example.com',
        password: 'password123'
      });

    userToken = regRes.body.data.token;
    testUserDoc = await User.findOne({ email: 'analytictester@example.com' });

    // Seed test stock with history records
    testStockDoc = await Stock.create({
      symbol: 'MSFT',
      companyName: 'Microsoft Corp.',
      sector: 'Technology',
      marketCap: 3000,
      currentPrice: 400.00,
      previousClose: 395.00,
      open: 398.00,
      high: 405.00,
      low: 398.00,
      volume: 2000000,
      fiftyTwoWeekHigh: 450,
      fiftyTwoWeekLow: 350,
      history: {
        "1D": [],
        "1W": [{ price: 380, time: '2026-07-09' }],
        "1M": [{ price: 360, time: '2026-06-16' }],
        "1Y": [{ price: 300, time: '2025-07-16' }]
      }
    });

    // Create a holding
    await Holding.create({
      userId: testUserDoc._id,
      stockId: testStockDoc._id,
      symbol: 'MSFT',
      quantity: 10,
      averagePrice: 380.00,
      currentPrice: 400.00
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Stock.deleteMany({});
    await Holding.deleteMany({});
    await mongoose.connection.close();
  });

  test('GET /api/analytics - Fetch consolidated performance indicators', async () => {
    const res = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.netWorth).toBeDefined();
    expect(res.body.data.overallReturnPercent).toBeDefined();
  });

  test('GET /api/analytics/returns - Compute dynamic yields', async () => {
    const res = await request(app)
      .get('/api/analytics/returns')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Dynamic yields check:
    // Today: (400 - 395) / 395 = 1.27%
    // 1W: (400 - 380) / 380 = 5.26%
    // 1M: (400 - 360) / 360 = 11.11%
    // 1Y: (400 - 300) / 300 = 33.33%
    expect(res.body.data.today).toBe(1.27);
    expect(res.body.data.weekly).toBe(5.26);
    expect(res.body.data.monthly).toBe(11.11);
    expect(res.body.data.annual).toBe(33.33);
  });

  test('GET /api/analytics/sectors - Aggregate sector holdings breakdown', async () => {
    const res = await request(app)
      .get('/api/analytics/sectors')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].sector).toBe('Technology');
  });

  test('GET /api/analytics/history - Load net worth progress chart points', async () => {
    const res = await request(app)
      .get('/api/analytics/history')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/analytics/reports - Retrieve previously generated reports', async () => {
    const res = await request(app)
      .get('/api/analytics/reports')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].format).toBe('CSV');
  });

  test('POST /api/analytics/reports/generate - Compile and download portfolio reports', async () => {
    const res = await request(app)
      .post('/api/analytics/reports/generate?format=csv')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Portfolio Summary Metrics');
  });
});
