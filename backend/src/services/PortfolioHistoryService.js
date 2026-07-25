import PortfolioSnapshot from '../models/PortfolioSnapshot.js';
import User from '../models/User.js';
import Holding from '../models/Holding.js';
import Stock from '../models/Stock.js';
import Trade from '../models/Trade.js';

class PortfolioHistoryService {
  /**
   * Helper to format Date object into YYYY-MM-DD string
   */
  formatDateKey(dateObj) {
    const d = new Date(dateObj);
    return d.toISOString().split('T')[0];
  }

  /**
   * Take a live snapshot of current Net Worth and store/update in DB for today
   */
  async recordSnapshot(userId) {
    if (!userId) return null;

    try {
      const user = await User.findById(userId).lean();
      if (!user) return null;

      const holdings = await Holding.find({ userId }).lean();
      const stockSymbols = holdings.map(h => h.symbol);
      const stocksList = await Stock.find({ symbol: { $in: stockSymbols } }).select('symbol currentPrice').lean();

      let holdingsValue = 0;
      let totalInvestment = 0;

      holdings.forEach(h => {
        const s = stocksList.find(st => st.symbol === h.symbol);
        const livePrice = s ? s.currentPrice : h.averagePrice;
        holdingsValue += h.quantity * livePrice;
        totalInvestment += h.quantity * h.averagePrice;
      });

      // Cash balance
      const cashBalance = user.balance !== undefined ? user.balance : 1000000;
      const netWorth = parseFloat((cashBalance + holdingsValue).toFixed(2));
      totalInvestment = parseFloat(totalInvestment.toFixed(2));
      holdingsValue = parseFloat(holdingsValue.toFixed(2));

      // Calculate realized PnL from completed sales
      const completedSells = await Trade.find({ userId, action: 'SELL', status: 'COMPLETED' }).lean();
      let realizedPnL = 0;
      completedSells.forEach(t => {
        realizedPnL += (t.realizedProfit || 0);
      });
      realizedPnL = parseFloat(realizedPnL.toFixed(2));

      const todayStr = this.formatDateKey(new Date());

      const snapshot = await PortfolioSnapshot.findOneAndUpdate(
        { userId, date: todayStr },
        {
          $set: {
            userId,
            date: todayStr,
            timestamp: new Date(),
            netWorth,
            cashBalance,
            holdingsValue,
            totalInvestment,
            realizedPnL,
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return snapshot;
    } catch (err) {
      console.error('[PortfolioHistoryService] Failed to record snapshot:', err.message);
      return null;
    }
  }

  /**
   * Auto-backfill daily snapshots if history is missing or sparse
   */
  async backfillHistoryIfNeeded(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) return;

      const snapshotCount = await PortfolioSnapshot.countDocuments({ userId });
      const allTrades = await Trade.find({ userId, status: 'COMPLETED' }).sort({ createdAt: 1 }).lean();

      // If we already have multiple snapshots, check if we need a refresh or backfill
      if (snapshotCount > 5) {
        return;
      }

      // Replay trade history day-by-day from user creation or 30 days ago (whichever is earlier)
      const startDate = user.createdAt ? new Date(user.createdAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allStocks = await Stock.find().lean();

      let currentCash = 1000000;
      const runningHoldings = {}; // { symbol: quantity }

      const tradesByDate = {};
      allTrades.forEach(t => {
        const dStr = this.formatDateKey(t.createdAt);
        if (!tradesByDate[dStr]) tradesByDate[dStr] = [];
        tradesByDate[dStr].push(t);
      });

      // Handle trades that happened before startDay
      allTrades.forEach(t => {
        const tDate = new Date(t.createdAt);
        tDate.setHours(0, 0, 0, 0);
        if (tDate < startDay) {
          if (t.action === 'BUY') {
            currentCash -= t.totalAmount || (t.quantity * t.executedPrice + (t.fees || 0));
            runningHoldings[t.symbol] = (runningHoldings[t.symbol] || 0) + t.quantity;
          } else if (t.action === 'SELL') {
            currentCash += (t.quantity * t.executedPrice - (t.fees || 0));
            runningHoldings[t.symbol] = (runningHoldings[t.symbol] || 0) - t.quantity;
          }
        }
      });

      const bulkOps = [];
      const curr = new Date(startDay);

      while (curr <= today) {
        const dateStr = this.formatDateKey(curr);
        const dayTrades = tradesByDate[dateStr] || [];

        dayTrades.forEach(t => {
          if (t.action === 'BUY') {
            currentCash -= t.totalAmount || (t.quantity * t.executedPrice + (t.fees || 0));
            runningHoldings[t.symbol] = (runningHoldings[t.symbol] || 0) + t.quantity;
          } else if (t.action === 'SELL') {
            currentCash += (t.quantity * t.executedPrice - (t.fees || 0));
            runningHoldings[t.symbol] = (runningHoldings[t.symbol] || 0) - t.quantity;
          }
        });

        let dayHoldingsVal = 0;
        Object.keys(runningHoldings).forEach(sym => {
          const qty = runningHoldings[sym];
          if (qty > 0) {
            const st = allStocks.find(s => s.symbol === sym);
            const price = st ? st.currentPrice : 0;
            dayHoldingsVal += qty * price;
          }
        });

        const dayNetWorth = parseFloat((Math.max(0, currentCash) + dayHoldingsVal).toFixed(2));

        bulkOps.push({
          updateOne: {
            filter: { userId, date: dateStr },
            update: {
              $setOnInsert: {
                userId,
                date: dateStr,
                timestamp: new Date(curr),
                netWorth: dayNetWorth,
                cashBalance: parseFloat(currentCash.toFixed(2)),
                holdingsValue: parseFloat(dayHoldingsVal.toFixed(2)),
                totalInvestment: 0,
                realizedPnL: 0
              }
            },
            upsert: true
          }
        });

        curr.setDate(curr.getDate() + 1);
      }

      if (bulkOps.length > 0) {
        await PortfolioSnapshot.bulkWrite(bulkOps);
      }
    } catch (err) {
      console.error('[PortfolioHistoryService] Backfill failed:', err.message);
    }
  }

  /**
   * Retrieve filtered portfolio history for given user and range
   */
  async getPortfolioHistory(userId, range = '1M') {
    if (!userId) return [];

    // 1. Record live snapshot for today
    await this.recordSnapshot(userId);

    // 2. Backfill missing history if needed
    await this.backfillHistoryIfNeeded(userId);

    // 3. Determine start date filter based on time range
    const now = new Date();
    let startDate = new Date();

    switch (range.toUpperCase()) {
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate.setDate(now.getDate() - 30);
        break;
      case '3M':
        startDate.setDate(now.getDate() - 90);
        break;
      case '6M':
        startDate.setDate(now.getDate() - 180);
        break;
      case '1Y':
        startDate.setDate(now.getDate() - 365);
        break;
      case 'ALL':
      default:
        startDate = new Date(0); // Beginning of epoch
        break;
    }

    // Query snapshots sorted chronologically
    const snapshots = await PortfolioSnapshot.find({
      userId,
      timestamp: { $gte: startDate }
    })
      .sort({ date: 1 })
      .lean();

    if (snapshots.length === 0) {
      return [];
    }

    // Compute dailyChange and percentageChange chronologically
    const result = snapshots.map((item, idx) => {
      const prevNetWorth = idx > 0 ? snapshots[idx - 1].netWorth : item.netWorth;
      const dailyChange = idx > 0 ? parseFloat((item.netWorth - prevNetWorth).toFixed(2)) : 0;
      const percentageChange = (idx > 0 && prevNetWorth > 0)
        ? parseFloat((((item.netWorth - prevNetWorth) / prevNetWorth) * 100).toFixed(2))
        : 0;

      return {
        _id: item._id,
        date: item.date,
        timestamp: item.timestamp,
        netWorth: item.netWorth,
        cashBalance: item.cashBalance,
        holdingsValue: item.holdingsValue,
        totalInvestment: item.totalInvestment,
        realizedPnL: item.realizedPnL,
        dailyChange,
        percentageChange
      };
    });

    return result;
  }
}

export default new PortfolioHistoryService();
