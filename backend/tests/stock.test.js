import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Stock from '../src/models/Stock.js';
import Cache from '../src/models/Cache.js';

const MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/stock-simulator-test';

describe('Stock Movers APIs', () => {
  beforeAll(async () => {
    process.env.MONGO_URI = MONGO_TEST_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_TEST_URI);
    }
    await Stock.deleteMany({});
    await Cache.deleteMany({});

    // Seed mock stocks for calculations with required fields
    await Stock.create([
      { symbol: 'AAPL', companyName: 'Apple', sector: 'Technology', currentPrice: 150, previousClose: 100, volume: 1000, open: 100, high: 160, low: 95, fiftyTwoWeekHigh: 200, fiftyTwoWeekLow: 80, marketCap: 2500000000000 },
      { symbol: 'TSLA', companyName: 'Tesla', sector: 'Automotive', currentPrice: 200, previousClose: 250, volume: 5000, open: 250, high: 260, low: 190, fiftyTwoWeekHigh: 300, fiftyTwoWeekLow: 150, marketCap: 600000000000 },
      { symbol: 'MSFT', companyName: 'Microsoft', sector: 'Technology', currentPrice: 300, previousClose: 290, volume: 3000, open: 290, high: 310, low: 285, fiftyTwoWeekHigh: 400, fiftyTwoWeekLow: 250, marketCap: 3000000000000 },
    ]);
  });

  afterAll(async () => {
    await Stock.deleteMany({});
    await Cache.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Cache.deleteMany({});
  });

  test('GET /api/stocks/movers/top - Retrieve gainers, losers, and active stocks', async () => {
    const res = await request(app).get('/api/stocks/movers/top');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.gainers).toBeDefined();
    expect(res.body.data.losers).toBeDefined();
    expect(res.body.data.mostActive).toBeDefined();

    // AAPL: (150-100)/100 = 50% change
    // MSFT: (300-290)/290 = 3.44% change
    // TSLA: (200-250)/250 = -20% change

    // AAPL should be top gainer
    expect(res.body.data.gainers[0].symbol).toBe('AAPL');
    // TSLA should be top loser
    expect(res.body.data.losers[0].symbol).toBe('TSLA');
    // TSLA should be top active by volume (5000)
    expect(res.body.data.mostActive[0].symbol).toBe('TSLA');
  });

  test('GET /api/stocks/movers/top - Caching logic writes to cache and returns identical data', async () => {
    // 1. Initial request -> cache miss, writes to DB
    const res1 = await request(app).get('/api/stocks/movers/top');
    expect(res1.statusCode).toBe(200);

    const cachedDoc = await Cache.findOne({ key: 'movers_top' });
    expect(cachedDoc).not.toBeNull();
    expect(cachedDoc.value.gainers[0].symbol).toBe('AAPL');

    // 2. Modify stock in database directly to verify cache is hit (prices shouldn't update if cached)
    await Stock.updateOne({ symbol: 'AAPL' }, { currentPrice: 50 });

    const res2 = await request(app).get('/api/stocks/movers/top');
    expect(res2.statusCode).toBe(200);
    // Since it's cached, AAPL's price remains 150 in the returned list, not 50
    expect(res2.body.data.gainers[0].price).toBe(150);
  });
});
