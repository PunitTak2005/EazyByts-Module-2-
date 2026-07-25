import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Stock from '../src/models/Stock.js';
import Holding from '../src/models/Holding.js';
import Portfolio from '../src/models/Portfolio.js';

const MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

describe('Portfolio APIs', () => {
  let userToken;
  let testUserDoc;
  let testStockDoc;
  let testHoldingDoc;

  beforeAll(async () => {
    process.env.MONGO_URI = MONGO_TEST_URI;
    process.env.JWT_SECRET = 'test_jwt_secret_token_123456';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_TEST_URI);
    }

    await User.deleteMany({});
    await Stock.deleteMany({});
    await Holding.deleteMany({});
    await Portfolio.deleteMany({});

    // Register User
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Portfolio Tester',
        email: 'portfoliotester@example.com',
        password: 'password123'
      });

    userToken = regRes.body.data.token;
    testUserDoc = await User.findOne({ email: 'portfoliotester@example.com' });

    // Seed test stock
    testStockDoc = await Stock.create({
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
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
      history: { "1D": [], "1W": [], "1M": [], "1Y": [] }
    });

    // Create a holding
    testHoldingDoc = await Holding.create({
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
    await Portfolio.deleteMany({});
    await mongoose.connection.close();
  });

  test('GET /api/portfolio - Retrieve portfolio details and aggregation', async () => {
    const res = await request(app)
      .get('/api/portfolio')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    
    // Check calculations:
    // Investment: 10 * 380 = 3800
    // Current Value: 10 * 400 = 4000
    // Profit: 4000 - 3800 = 200
    expect(res.body.data.summary.totalInvestment).toBe(3800);
    expect(res.body.data.summary.totalValue).toBe(4000);
    expect(res.body.data.summary.totalProfit).toBe(200);
    expect(res.body.data.holdings.length).toBe(1);
    expect(res.body.data.holdings[0].symbol).toBe('MSFT');
  });

  test('PUT /api/portfolio/update - Recalculate and fetch refreshed valuations', async () => {
    const res = await request(app)
      .put('/api/portfolio/update')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalValue).toBe(4000);
  });

  test('DELETE /api/portfolio/:holdingId - Liquidate position completely', async () => {
    const res = await request(app)
      .delete(`/api/portfolio/${testHoldingDoc._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('liquidated');

    // Verify holding is gone
    const h = await Holding.findById(testHoldingDoc._id);
    expect(h).toBeNull();

    // Verify user balance was increased (original balance - 3803.80 + 3996)
    const updatedUser = await User.findById(testUserDoc._id);
    expect(updatedUser.balance).toBeGreaterThan(1000000 - 3800);
  });
});
