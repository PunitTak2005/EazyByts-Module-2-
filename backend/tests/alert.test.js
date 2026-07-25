// Configure JWT_SECRET before app imports to prevent middleware validation failure
process.env.JWT_SECRET = 'test_jwt_secret_token_123456';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Stock from '../src/models/Stock.js';
import Alert from '../src/models/Alert.js';
import Notification from '../src/models/Notification.js';
import StockService from '../src/services/StockService.js';

describe('Price Alerts CRUD & Crossing Simulation Tests', () => {
  let token;
  let testUser;
  let testStock;

  beforeAll(async () => {
    // Connect to database in test environment
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Clean up collections
    await User.deleteMany({});
    await Stock.deleteMany({});
    await Alert.deleteMany({});
    await Notification.deleteMany({});

    // Create a mock user
    const resReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alert Tester',
        email: 'alerttest@example.com',
        password: 'password123'
      });

    token = resReg.body.data.token;
    testUser = await User.findOne({ email: 'alerttest@example.com' });

    // Create a mock stock
    testStock = await Stock.create({
      symbol: 'TESTSYM',
      companyName: 'Test Alert Security',
      sector: 'Technology',
      description: 'A mock stock for price alert triggers testing',
      marketCap: 100,
      currentPrice: 150.00,
      previousClose: 145.00,
      open: 148.00,
      high: 155.00,
      low: 140.00,
      volume: 100000,
      fiftyTwoWeekHigh: 200,
      fiftyTwoWeekLow: 50,
      history: {
        '1D': [], '1W': [], '1M': [], '3M': [], '6M': [], '1Y': [], '5Y': []
      }
    });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await Alert.deleteMany({});
      await Notification.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('REST API Alert Registration', () => {
    let alertId;

    it('should allow setting a PRICE ABOVE alert', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'TESTSYM',
          targetPrice: 160.00,
          type: 'ABOVE'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.symbol).toBe('TESTSYM');
      expect(res.body.data.targetPrice).toBe(160);
      expect(res.body.data.type).toBe('ABOVE');
      expect(res.body.data.isActive).toBe(true);

      alertId = res.body.data._id;
    });

    it('should list user active alerts', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].symbol).toBe('TESTSYM');
    });

    it('should reject alerts for non-existent symbols', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'NOSUCHSYM',
          targetPrice: 50.00,
          type: 'BELOW'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow deleting/clearing an active alert', async () => {
      const res = await request(app)
        .delete(`/api/alerts/${alertId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const checkList = await Alert.findById(alertId);
      expect(checkList).toBeNull();
    });
  });

  describe('Crossing Event Walker Simulation', () => {
    it('should trigger alert notification when price target is crossed', async () => {
      // 1. Set a PRICE ABOVE alert at 155
      const alert = await Alert.create({
        userId: testUser._id,
        symbol: 'TESTSYM',
        targetPrice: 155.00,
        type: 'ABOVE'
      });

      // 2. Mock walking prices crossing the alert barrier
      const livePrices = {
        TESTSYM: 156.50
      };

      // 3. Trigger alert checking routine
      await StockService.checkPriceAlerts(livePrices);

      // 4. Assert alert is disabled/isActive is false
      const updatedAlert = await Alert.findById(alert._id);
      expect(updatedAlert.isActive).toBe(false);

      // 5. Assert user notification record is generated with type 'Price Alert'
      const notification = await Notification.findOne({ userId: testUser._id, type: 'Price Alert' });
      expect(notification).not.toBeNull();
      expect(notification.title).toBe('Price Alert Triggered');
      expect(notification.message).toContain('TESTSYM crossed target price of ₹155.00');
    });
  });
});
