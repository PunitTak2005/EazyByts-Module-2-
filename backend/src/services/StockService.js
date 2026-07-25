import Stock from '../models/Stock.js';
import Cache from '../models/Cache.js';
import Trade from '../models/Trade.js';
import User from '../models/User.js';
import Holding from '../models/Holding.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import SocketService from './SocketService.js';
import Alert from '../models/Alert.js';

const BASE_REAL_STOCKS = [
  { symbol: 'PERSISTENT', companyName: 'Persistent Systems Ltd.', sector: 'Technology', price: 8549.20, marketCap: 65, peRatio: 30.5, eps: 280.3, dividend: 1.20 },
  { symbol: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', price: 15396.50, marketCap: 2890, peRatio: 28.4, eps: 6.53, dividend: 0.52 },
  { symbol: 'MSFT', companyName: 'Microsoft Corp.', sector: 'Technology', price: 34876.60, marketCap: 3120, peRatio: 36.1, eps: 11.64, dividend: 0.71 },
  { symbol: 'GOOGL', companyName: 'Alphabet Inc.', sector: 'Technology', price: 14342.40, marketCap: 2150, peRatio: 26.2, eps: 6.60, dividend: 0.46 },
  { symbol: 'AMZN', companyName: 'Amazon.com Inc.', sector: 'Retail & Technology', price: 15197.30, marketCap: 1910, peRatio: 41.2, eps: 4.45, dividend: 0.00 },
  { symbol: 'TSLA', companyName: 'Tesla Inc.', sector: 'Automotive', price: 14823.80, marketCap: 568, peRatio: 59.3, eps: 3.01, dividend: 0.00 },
  { symbol: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Technology', price: 72658.20, marketCap: 2180, peRatio: 70.6, eps: 12.40, dividend: 0.02 },
  { symbol: 'META', companyName: 'Meta Platforms Inc.', sector: 'Technology', price: 40329.70, marketCap: 1240, peRatio: 25.1, eps: 19.36, dividend: 0.41 },
  { symbol: 'JPM', companyName: 'JPMorgan Chase & Co.', sector: 'Financial Services', price: 16218.20, marketCap: 562, peRatio: 12.1, eps: 16.15, dividend: 2.15 },
  { symbol: 'V', companyName: 'Visa Inc.', sector: 'Financial Services', price: 23098.90, marketCap: 574, peRatio: 32.7, eps: 8.51, dividend: 0.75 },
  { symbol: 'WMT', companyName: 'Walmart Inc.', sector: 'Retail', price: 5000.75, marketCap: 485, peRatio: 28.0, eps: 2.15, dividend: 1.39 },
  { symbol: 'DIS', companyName: 'The Walt Disney Co.', sector: 'Entertainment', price: 9694.40, marketCap: 214, peRatio: 69.5, eps: 1.68, dividend: 0.38 },
  { symbol: 'KO', companyName: 'The Coca-Cola Co.', sector: 'Consumer Defensive', price: 5179.20, marketCap: 270, peRatio: 25.3, eps: 2.47, dividend: 3.12 },
  { symbol: 'NFLX', companyName: 'Netflix Inc.', sector: 'Entertainment', price: 51086.50, marketCap: 266, peRatio: 44.6, eps: 13.80, dividend: 0.00 },
  { symbol: 'PEP', companyName: 'PepsiCo Inc.', sector: 'Consumer Defensive', price: 14093.40, marketCap: 233, peRatio: 26.4, eps: 6.43, dividend: 2.95 },
  { symbol: 'NKE', companyName: 'Nike Inc.', sector: 'Consumer Cyclical', price: 7818.60, marketCap: 141, peRatio: 26.9, eps: 3.50, dividend: 1.57 },
  { symbol: 'AMD', companyName: 'Advanced Micro Devices', sector: 'Technology', price: 13172.10, marketCap: 256, peRatio: 330.6, eps: 0.48, dividend: 0.00 },
  { symbol: 'BABA', companyName: 'Alibaba Group Holding', sector: 'Retail & Technology', price: 6349.50, marketCap: 182, peRatio: 8.6, eps: 8.90, dividend: 1.31 },
  { symbol: 'XOM', companyName: 'Exxon Mobil Corp.', sector: 'Energy', price: 9901.90, marketCap: 472, peRatio: 12.6, eps: 9.47, dividend: 3.18 },
  { symbol: 'INFY', companyName: 'Infosys Ltd.', sector: 'Technology', price: 1420.50, marketCap: 60, peRatio: 20.4, eps: 70.2, dividend: 2.10 },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services', sector: 'Technology', price: 3850.10, marketCap: 140, peRatio: 28.5, eps: 135.4, dividend: 1.80 },
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd.', sector: 'Energy', price: 2950.00, marketCap: 200, peRatio: 26.3, eps: 112.5, dividend: 0.35 }
];

const generatedStocks = [];
const sectorsList = ['Technology', 'Financial Services', 'Healthcare', 'Energy', 'Consumer Defensive', 'Industrials', 'Retail', 'Automotive', 'Entertainment'];
for (let i = 1; i <= 85; i++) {
  const numStr = String(i).padStart(3, '0');
  const symbol = `MOCK${numStr}`;
  const companyName = `Simulation Security ${numStr} Corp`;
  const sector = sectorsList[i % sectorsList.length];
  const price = parseFloat((10 + Math.random() * 990).toFixed(2));
  const marketCap = parseFloat((1 + Math.random() * 500).toFixed(1));
  const peRatio = parseFloat((5 + Math.random() * 95).toFixed(1));
  const eps = parseFloat((0.5 + Math.random() * 15).toFixed(2));
  const dividend = parseFloat((Math.random() * 4.5).toFixed(2));
  generatedStocks.push({ symbol, companyName, sector, price, marketCap, peRatio, eps, dividend });
}

const DEFAULT_STOCKS = [...BASE_REAL_STOCKS, ...generatedStocks];

const generateHistory = (basePrice, numPoints, volatility = 0.015, timeFormat = 'date') => {
  const points = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = numPoints - 1; i >= 0; i--) {
    const timePoint = new Date(now.getTime());
    let label = '';

    if (timeFormat === 'hourly') {
      timePoint.setHours(now.getHours() - i);
      label = `${String(timePoint.getHours()).padStart(2, '0')}:${String(timePoint.getMinutes()).padStart(2, '0')}`;
    } else if (timeFormat === 'daily') {
      timePoint.setDate(now.getDate() - i);
      label = timePoint.toISOString().split('T')[0];
    } else if (timeFormat === 'monthly') {
      timePoint.setMonth(now.getMonth() - i);
      label = `${timePoint.getFullYear()}-${String(timePoint.getMonth() + 1).padStart(2, '0')}`;
    }

    const change = (Math.random() - 0.48) * 2 * volatility;
    const priceClose = parseFloat((currentPrice * (1 + change)).toFixed(2));
    const priceOpen = parseFloat((priceClose * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2));
    const priceHigh = parseFloat((Math.max(priceOpen, priceClose) * (1 + Math.random() * 0.005)).toFixed(2));
    const priceLow = parseFloat((Math.min(priceOpen, priceClose) * (1 - Math.random() * 0.005)).toFixed(2));

    points.push({
      time: label,
      price: priceClose,
      open: priceOpen,
      high: priceHigh,
      low: priceLow,
      close: priceClose,
      volume: Math.floor(100000 + Math.random() * 900000)
    });
    currentPrice = priceClose;
  }
  return points;
};

class StockService {
  async seedInitialStocks() {
    console.log('Validating stock database seeds...');
    let seededCount = 0;

    for (const config of DEFAULT_STOCKS) {
      const exists = await Stock.findOne({ symbol: config.symbol });
      if (!exists) {
        const history1D = generateHistory(config.price, 24, 0.004, 'hourly');
        const history1W = generateHistory(config.price, 7, 0.012, 'daily');
        const history1M = generateHistory(config.price, 30, 0.018, 'daily');
        const history3M = generateHistory(config.price, 12, 0.035, 'daily');
        const history6M = generateHistory(config.price, 24, 0.05, 'daily');
        const history1Y = generateHistory(config.price, 52, 0.08, 'daily');
        const history5Y = generateHistory(config.price, 60, 0.20, 'monthly');

        const currentPrice = history1D[history1D.length - 1].price;
        const open = parseFloat((currentPrice * 0.995).toFixed(2));

        const newStock = new Stock({
          symbol: config.symbol,
          companyName: config.companyName,
          sector: config.sector,
          description: `Virtual stock record representing ${config.companyName} on the simulated desk. All metrics are math mock values.`,
          marketCap: config.marketCap,
          currentPrice,
          previousClose: parseFloat((currentPrice * 1.001).toFixed(2)),
          open,
          high: parseFloat((currentPrice * 1.01).toFixed(2)),
          low: parseFloat((currentPrice * 0.99).toFixed(2)),
          volume: Math.floor(1000000 + Math.random() * 5000000),
          peRatio: config.peRatio,
          eps: config.eps,
          dividend: config.dividend,
          fiftyTwoWeekHigh: parseFloat((currentPrice * 1.25).toFixed(2)),
          fiftyTwoWeekLow: parseFloat((currentPrice * 0.75).toFixed(2)),
          history: {
            "1D": history1D,
            "1W": history1W,
            "1M": history1M,
            "3M": history3M,
            "6M": history6M,
            "1Y": history1Y,
            "5Y": history5Y
          }
        });

        await newStock.save();
        seededCount++;
      }
    }

    if (seededCount > 0) {
      console.log(`Seeded ${seededCount} new stock parameters successfully!`);
    } else {
      console.log('All stock parameters already seeded.');
    }
  }

  // Ticks dynamic walks every 8 seconds
  startSimulationTicks() {
    setInterval(async () => {
      try {
        const stocks = await Stock.find({});
        if (stocks.length === 0) return;

        const bulkOps = [];
        const livePrices = {};

        for (const s of stocks) {
          const changePercent = (Math.random() - 0.47) * 2 * 0.005; // slight upward bias
          const oldPrice = s.currentPrice;
          const newPrice = parseFloat((oldPrice * (1 + changePercent)).toFixed(2));

          s.currentPrice = newPrice;
          livePrices[s.symbol] = newPrice;

          if (newPrice > s.high) s.high = newPrice;
          if (newPrice < s.low) s.low = newPrice;

          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          s.history["1D"].push({ time: timeStr, price: newPrice });
          if (s.history["1D"].length > 50) s.history["1D"].shift();

          s.volume += Math.floor(Math.random() * 4000) + 100;
          s.lastUpdated = now;

          bulkOps.push({
            updateOne: {
              filter: { _id: s._id },
              update: {
                $set: {
                  currentPrice: s.currentPrice,
                  high: s.high,
                  low: s.low,
                  volume: s.volume,
                  history: s.history,
                  lastUpdated: s.lastUpdated
                }
              }
            }
          });
        }

        if (bulkOps.length > 0) {
          await Stock.bulkWrite(bulkOps);
        }

        // Broadcast current tick changes to all subscribers
        SocketService.broadcast('prices_tick', livePrices);

        // Check price alerts triggers
        await this.checkPriceAlerts(livePrices);

        // Check limit triggers
        await this.processPendingLimitOrders(livePrices);

      } catch (error) {
        console.error('Error ticking simulated stock prices:', error);
      }
    }, 8000);
  }

  // Price alerts crossing checks
  async checkPriceAlerts(livePrices) {
    try {
      const activeAlerts = await Alert.find({ isActive: true });
      for (const alert of activeAlerts) {
        const currentPrice = livePrices[alert.symbol];
        if (!currentPrice) continue;

        let isTriggered = false;
        if (alert.type === 'ABOVE' && currentPrice >= alert.targetPrice) isTriggered = true;
        if (alert.type === 'BELOW' && currentPrice <= alert.targetPrice) isTriggered = true;

        if (isTriggered) {
          // Disable alert
          alert.isActive = false;
          await alert.save();

          // Write user notification to database
          await new Notification({
            userId: alert.userId,
            title: 'Price Alert Triggered',
            message: `${alert.symbol} crossed target price of ₹${alert.targetPrice.toFixed(2)} (Current: ₹${currentPrice.toFixed(2)})`,
            type: 'Price Alert'
          }).save();

          // Push immediate client socket notification
          SocketService.broadcastToRoom(
            `user:${alert.userId}`,
            'notification',
            { message: `🔔 Alert: ${alert.symbol} crossed ${alert.type.toLowerCase()} threshold of ₹${alert.targetPrice.toFixed(2)}!` }
          );
        }
      }
    } catch (err) {
      console.error('Error checking simulated price alerts:', err);
    }
  }

  // Limit orders trigger checks
  async processPendingLimitOrders(livePrices) {
    try {
      const pendingTrades = await Trade.find({ status: 'PENDING' });
      for (const t of pendingTrades) {
        const currentPrice = livePrices[t.symbol];
        if (!currentPrice) continue;

        let shouldExecute = false;
        if (t.action === 'BUY' && currentPrice <= t.limitPrice) shouldExecute = true;
        if (t.action === 'SELL' && currentPrice >= t.limitPrice) shouldExecute = true;

        if (shouldExecute) {
          await this.executeLimitOrderTrade(t, currentPrice);
        }
      }
    } catch (err) {
      console.error('Failed to trigger limit orders check:', err);
    }
  }

  async executeLimitOrderTrade(trade, currentPrice) {
    try {
      const user = await User.findById(trade.userId);
      if (!user) {
        trade.status = 'CANCELLED';
        await trade.save();
        return;
      }

      const orderCost = trade.quantity * currentPrice;
      const fees = parseFloat((orderCost * 0.001).toFixed(2));
      const grandTotal = orderCost + fees;

      if (trade.action === 'BUY') {
        if (user.balance < grandTotal) {
          trade.status = 'CANCELLED';
          await trade.save();
          await new Notification({
            userId: user._id,
            title: 'Limit Order Cancelled',
            message: `Limit BUY for ${trade.quantity} ${trade.symbol} failed: Insufficient virtual balance`,
            type: 'Trade Failure'
          }).save();
          return;
        }

        user.balance = parseFloat((user.balance - grandTotal).toFixed(2));
        await user.save();

        let holding = await Holding.findOne({ userId: user._id, symbol: trade.symbol });
        if (holding) {
          const prevQty = holding.quantity;
          const prevTotalCost = holding.averagePrice * prevQty;
          const newTotalCost = prevTotalCost + grandTotal;
          const newQty = prevQty + trade.quantity;
          holding.averagePrice = parseFloat((newTotalCost / newQty).toFixed(2));
          holding.quantity = newQty;
          holding.currentPrice = currentPrice;
          await holding.save();
        } else {
          await new Holding({
            userId: user._id,
            stockId: trade.stockId,
            symbol: trade.symbol,
            quantity: trade.quantity,
            averagePrice: parseFloat((grandTotal / trade.quantity).toFixed(2)),
            currentPrice
          }).save();
        }

        trade.executedPrice = currentPrice;
        trade.fees = fees;
        trade.status = 'COMPLETED';
        await trade.save();

        await new Notification({
          userId: user._id,
          title: 'Limit Trade Success',
          message: `Limit Buy order of ${trade.quantity} ${trade.symbol} executed at ₹${currentPrice.toFixed(2)}`,
          type: 'Trade Success'
        }).save();

      } else if (trade.action === 'SELL') {
        const holding = await Holding.findOne({ userId: user._id, symbol: trade.symbol });
        if (!holding || holding.quantity < trade.quantity) {
          trade.status = 'CANCELLED';
          await trade.save();
          await new Notification({
            userId: user._id,
            title: 'Limit Order Cancelled',
            message: `Limit SELL for ${trade.quantity} ${trade.symbol} failed: Insufficient owned shares`,
            type: 'Trade Failure'
          }).save();
          return;
        }

        const avgPrice = holding.averagePrice;
        const originalCost = avgPrice * trade.quantity;
        const sellProceeds = trade.quantity * currentPrice;
        const sellFees = parseFloat((sellProceeds * 0.001).toFixed(2));
        const netProceeds = sellProceeds - sellFees;
        const profit = parseFloat((netProceeds - originalCost).toFixed(2));

        user.balance = parseFloat((user.balance + netProceeds).toFixed(2));
        await user.save();

        holding.quantity -= trade.quantity;
        if (holding.quantity === 0) {
          await Holding.deleteOne({ _id: holding._id });
        } else {
          holding.currentPrice = currentPrice;
          await holding.save();
        }

        trade.executedPrice = currentPrice;
        trade.fees = sellFees;
        trade.realizedProfit = profit;
        trade.status = 'COMPLETED';
        await trade.save();

        await new Notification({
          userId: user._id,
          title: 'Limit Trade Success',
          message: `Limit Sell order of ${trade.quantity} ${trade.symbol} executed at ₹${currentPrice.toFixed(2)}. P/L: ₹${profit.toLocaleString('en-IN')}`,
          type: 'Trade Success'
        }).save();
      }

    } catch (err) {
      console.error('Error executing limit order trigger:', err);
    }
  }

  // Unified Normalization Layer
  normalizeStock(s) {
    if (!s) return null;
    const price = s.currentPrice || s.price || 0;
    const prevClose = s.previousClose || s.prevClose || (price !== 0 ? price : 1);
    const diff = price - prevClose;
    const pct = prevClose !== 0 ? Number(((diff / prevClose) * 100).toFixed(2)) : 0;
    
    return {
      _id: s._id,
      symbol: s.symbol,
      name: s.companyName || s.name,
      companyName: s.companyName || s.name,
      sector: s.sector,
      price: Number(price.toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      change: Number(diff.toFixed(2)),
      changePercent: pct,
      currency: 'INR',
      volume: s.volume || 0,
      marketCap: s.marketCap || 0,
      description: s.description || '',
      peRatio: s.peRatio || 0,
      dividend: s.dividend || 0,
      eps: s.eps || 0,
      high: s.high || price,
      low: s.low || price,
      history: s.history
    };
  }

  // Stock listings queries
  async queryStocks(page = 1, limit = 12, search = '', sector = '', sortBy = 'symbol', sortOrder = 'asc', capClass = '') {
    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      query.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    if (sector && sector !== 'All') {
      query.sector = sector;
    }

    if (capClass) {
      if (capClass === 'large') query.marketCap = { $gte: 500 };
      else if (capClass === 'mid') query.marketCap = { $gte: 100, $lt: 500 };
      else if (capClass === 'small') query.marketCap = { $lt: 100 };
    }

    let sortObj = {};
    const order = sortOrder === 'desc' ? -1 : 1;

    if (sortBy === 'symbol') sortObj = { symbol: order };
    else if (sortBy === 'name') sortObj = { companyName: order };
    else if (sortBy === 'price') sortObj = { currentPrice: order };
    else if (sortBy === 'volume') sortObj = { volume: order };

    let stocks = await Stock.find(query)
      .select('-history')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    if (sortBy === 'change') {
      const allStocks = await Stock.find(query).select('-history').lean();
      allStocks.sort((a, b) => {
        const changeA = ((a.currentPrice - a.previousClose) / a.previousClose);
        const changeB = ((b.currentPrice - b.previousClose) / b.previousClose);
        return order === 1 ? changeA - changeB : changeB - changeA;
      });
      stocks = allStocks.slice(skip, skip + limit);
    }

    const normalizedStocks = stocks.map(s => this.normalizeStock(s));
    
    const total = await Stock.countDocuments(query);
    return { stocks: normalizedStocks, total, pages: Math.ceil(total / limit) };
  }

  async getStockDetails(symbol) {
    const s = await Stock.findOne({ symbol: symbol.toUpperCase() }).lean();
    if (!s) throw new Error('Stock ticker not found');
    return this.normalizeStock(s);
  }

  async getTrending() {
    const stocks = await Stock.find({}).sort({ volume: -1 }).limit(5).select('-history').lean();
    return stocks.map(s => this.normalizeStock(s));
  }

  async getMovers() {
    const stocks = await Stock.find({}).select('-history').lean();
    const mapped = stocks.map(s => this.normalizeStock(s));

    const gainers = [...mapped].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const losers = [...mapped].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
    const active = [...mapped].sort((a, b) => b.volume - a.volume).slice(0, 5);

    return { gainers, losers, active };
  }

  async getMoversWithCache() {
    const key = 'movers_top';
    const ttlMs = 60 * 1000;
    try {
      const cachedItem = await Cache.findOne({ key });
      if (cachedItem && cachedItem.expiresAt > new Date()) {
        return cachedItem.value;
      }

      const freshData = await this.getMovers();

      await Cache.findOneAndUpdate(
        { key },
        {
          value: freshData,
          expiresAt: new Date(Date.now() + ttlMs),
        },
        { upsert: true, new: true }
      );

      return freshData;
    } catch (err) {
      console.error(`Cache handler error for ${key}:`, err.message);
      return await this.getMovers();
    }
  }
}

export default new StockService();
