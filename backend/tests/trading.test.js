import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Stock from '../src/models/Stock.js';
import Holding from '../src/models/Holding.js';
import Trade from '../src/models/Trade.js';
import AuthService from '../src/services/AuthService.js';

const MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

// Simulated Trading Engine Math Validators (Original Unit Tests)
const validateBuyLimit = (balance, quantity, price, feePercent = 0.001) => {
  if (quantity <= 0) return { success: false, message: 'Quantity must be at least 1' };
  if (price <= 0) return { success: false, message: 'Price must be greater than 0' };
  
  const cost = quantity * price;
  const fees = parseFloat((cost * feePercent).toFixed(2));
  const grandTotal = cost + fees;

  if (balance < grandTotal) {
    return { 
      success: false, 
      message: `Insufficient balance. Required: ₹${grandTotal.toFixed(2)}, Available: ₹${balance.toFixed(2)}` 
    };
  }

  return { success: true, grandTotal, fees };
};

const validateSellLimit = (ownedQuantity, quantity, price) => {
  if (quantity <= 0) return { success: false, message: 'Quantity must be at least 1' };
  if (price <= 0) return { success: false, message: 'Price must be greater than 0' };
  
  if (ownedQuantity < quantity) {
    return {
      success: false,
      message: `Insufficient shares. Owned: ${ownedQuantity}, Requested: ${quantity}`
    };
  }

  return { success: true };
};

const calculateAverageCost = (currentQty, currentAvgPrice, newQty, newPrice, feePercent = 0.001) => {
  const currentInvestment = currentQty * currentAvgPrice;
  const newCost = newQty * newPrice;
  const fees = parseFloat((newCost * feePercent).toFixed(2));
  const totalInvestment = currentInvestment + newCost + fees;
  const totalQty = currentQty + newQty;
  
  return {
    averageBuyPrice: parseFloat((totalInvestment / totalQty).toFixed(2)),
    totalQty,
    totalInvestment: parseFloat(totalInvestment.toFixed(2))
  };
};

describe('Trading Engine Math Validators (Unit Tests)', () => {
  test('Trading Engine Validators - Buy validation checks', () => {
    const res1 = validateBuyLimit(10000, 10, 150);
    expect(res1.success).toBe(true);
    expect(res1.grandTotal).toBe(1501.5);
    expect(res1.fees).toBe(1.5);

    const res2 = validateBuyLimit(1000, 10, 150);
    expect(res2.success).toBe(false);
    expect(res2.message).toContain('Insufficient balance');

    const res3 = validateBuyLimit(10000, 0, 150);
    expect(res3.success).toBe(false);
    expect(res3.message).toBe('Quantity must be at least 1');
  });

  test('Trading Engine Validators - Sell validation checks', () => {
    const res1 = validateSellLimit(15, 10, 150);
    expect(res1.success).toBe(true);

    const res2 = validateSellLimit(5, 10, 150);
    expect(res2.success).toBe(false);
    expect(res2.message).toContain('Insufficient shares');
  });

  test('Trading Engine Validators - Average Buy Cost updates', () => {
    const step1 = calculateAverageCost(0, 0, 10, 150);
    expect(step1.totalQty).toBe(10);
    expect(step1.averageBuyPrice).toBe(150.15);

    const step2 = calculateAverageCost(step1.totalQty, step1.averageBuyPrice, 5, 160);
    expect(step2.totalQty).toBe(15);
    expect(step2.averageBuyPrice).toBe(153.49);
  });
});

describe('Trading APIs (Integration Tests)', () => {
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
    await Trade.deleteMany({});

    // Register User
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Trader Bob',
        email: 'traderbob@example.com',
        password: 'password123'
      });

    userToken = regRes.body.data.token;
    testUserDoc = await User.findOne({ email: 'traderbob@example.com' });

    // Seed test stock
    testStockDoc = await Stock.create({
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      sector: 'Technology',
      marketCap: 2000,
      currentPrice: 150.00,
      previousClose: 148.00,
      open: 149.00,
      high: 152.00,
      low: 148.00,
      volume: 1000000,
      fiftyTwoWeekHigh: 180,
      fiftyTwoWeekLow: 130,
      history: { "1D": [], "1W": [], "1M": [], "1Y": [] }
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Stock.deleteMany({});
    await Holding.deleteMany({});
    await Trade.deleteMany({});
    await mongoose.connection.close();
  });

  test('POST /api/trades/buy - Buy 10 shares of AAPL at MARKET price', async () => {
    const res = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        symbol: 'AAPL',
        quantity: 10,
        orderType: 'MARKET'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.quantity).toBe(10);
    expect(res.body.data.executedPrice).toBe(150.00);

    // Verify holding was created
    const holding = await Holding.findOne({ userId: testUserDoc._id, symbol: 'AAPL' });
    expect(holding).toBeDefined();
    expect(holding.quantity).toBe(10);

    // Verify user balance was deducted
    const updatedUser = await User.findById(testUserDoc._id);
    expect(updatedUser.balance).toBeLessThan(1000000);
  });

  test('POST /api/trades/sell - Sell 5 shares of AAPL at MARKET price', async () => {
    const res = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        symbol: 'AAPL',
        quantity: 5,
        orderType: 'MARKET'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.action).toBe('SELL');

    // Verify holding was decremented
    const holding = await Holding.findOne({ userId: testUserDoc._id, symbol: 'AAPL' });
    expect(holding.quantity).toBe(5);
  });

  test('POST /api/trades/buy - Prevent buy due to insufficient balance', async () => {
    const res = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        symbol: 'AAPL',
        quantity: 10000000,
        orderType: 'MARKET'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient');
  });

  test('POST /api/trades/sell - Prevent sell of more shares than owned', async () => {
    const res = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        symbol: 'AAPL',
        quantity: 1000,
        orderType: 'MARKET'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Cannot sell more shares|Insufficient shares/);
  });
});
