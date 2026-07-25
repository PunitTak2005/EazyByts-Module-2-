import Portfolio from '../models/Portfolio.js';
import Holding from '../models/Holding.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';
import Trade from '../models/Trade.js';

class PortfolioService {
  async getOrCreatePortfolio(userId) {
    let p = await Portfolio.findOne({ userId });
    if (!p) {
      const user = await User.findById(userId);
      p = await Portfolio.create({
        userId,
        availableCash: user ? user.balance : 1000000
      });
    }
    return p;
  }

  async getPortfolioDetails(userId) {
    const p = await this.getOrCreatePortfolio(userId);
    const user = await User.findById(userId).lean();
    if (user && user.balance !== p.availableCash) {
      p.availableCash = user.balance; // sync available balance
    }

    const holdings = await Holding.find({ userId }).lean();
    const stockSymbols = holdings.map(h => h.symbol);
    const stocksList = await Stock.find({ symbol: { $in: stockSymbols } }).select('-history').lean();

    let totalInvestment = 0;
    let totalValue = 0;
    let todayGain = 0;
    let totalPrevValue = 0;
    const bulkOps = [];

    const populated = holdings.map(h => {
      const s = stocksList.find(st => st.symbol === h.symbol);
      const livePrice = s ? s.currentPrice : h.averagePrice;
      let prevClose = s ? (s.previousClose || s.prevClose || livePrice) : livePrice;
      const sector = s ? s.sector : 'Other';

      // Auto-repair legacy holdings where averagePrice was saved in USD while livePrice is in INR
      let avgPrice = h.averagePrice;
      if (livePrice > 0 && avgPrice > 0 && avgPrice < (livePrice / 10)) {
        avgPrice = parseFloat((avgPrice * 83).toFixed(2));
        bulkOps.push({
          updateOne: {
            filter: { _id: h._id },
            update: { $set: { averagePrice: avgPrice } }
          }
        });
      }

      // Auto-repair legacy USD prevClose if present
      if (livePrice > 0 && prevClose > 0 && prevClose < (livePrice / 10)) {
        prevClose = parseFloat((prevClose * 83).toFixed(2));
      }

      // Fallback sanity check: if prevClose is un-normalized (> 20% deviation for static calculation), clamp to livePrice * 0.995
      if (prevClose <= 0 || (livePrice > 0 && Math.abs(livePrice - prevClose) / prevClose > 0.2)) {
        prevClose = parseFloat((livePrice * 0.995).toFixed(2));
      }

      // Queue bulk write if price changes to sync database state asynchronously
      if (s && h.currentPrice !== s.currentPrice) {
        bulkOps.push({
          updateOne: {
            filter: { _id: h._id },
            update: { $set: { currentPrice: s.currentPrice } }
          }
        });
      }

      const holdingCost = parseFloat((h.quantity * avgPrice).toFixed(2));
      const holdingValue = parseFloat((h.quantity * livePrice).toFixed(2));
      const pnl = parseFloat((holdingValue - holdingCost).toFixed(2));
      const pnlPercent = holdingCost > 0 ? parseFloat(((pnl / holdingCost) * 100).toFixed(2)) : 0;
      const todayChangePercent = prevClose > 0 ? parseFloat((((livePrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;

      totalInvestment += holdingCost;
      totalValue += holdingValue;
      todayGain += h.quantity * (livePrice - prevClose);
      totalPrevValue += h.quantity * prevClose;

      return {
        _id: h._id,
        stockId: h.stockId,
        symbol: h.symbol,
        name: s ? s.companyName : h.symbol,
        sector,
        quantity: h.quantity,
        averagePrice: avgPrice,
        currentPrice: livePrice,
        currentValue: parseFloat(holdingValue.toFixed(2)),
        profitLoss: pnl,
        profitLossPercent: pnlPercent,
        todayChangePercent
      };
    });

    if (bulkOps.length > 0) {
      Holding.bulkWrite(bulkOps).catch(err => console.error('Bulk update holdings failed:', err.message));
    }

    const startingBalance = (user && user.startingBalance) ? user.startingBalance : 1000000;
    const availableCash = p.availableCash;
    const netWorth = parseFloat((availableCash + totalValue).toFixed(2));
    const overallProfit = parseFloat((netWorth - startingBalance).toFixed(2));
    const overallReturnPercent = startingBalance > 0 ? parseFloat(((overallProfit / startingBalance) * 100).toFixed(2)) : 0;

    const yesterdayPortfolioValue = availableCash + totalPrevValue;
    const todayGainPercent = yesterdayPortfolioValue > 0 ? parseFloat(((todayGain / yesterdayPortfolioValue) * 100).toFixed(2)) : 0;

    // Update DB portfolio record
    p.totalInvestment = parseFloat(totalInvestment.toFixed(2));
    p.totalValue = parseFloat(totalValue.toFixed(2));
    p.totalProfit = overallProfit;
    await p.save();

    return {
      summary: {
        totalInvestment: p.totalInvestment,
        totalValue: p.totalValue,
        totalProfit: overallProfit,
        totalProfitPercent: overallReturnPercent,
        overallReturn: overallProfit,
        overallReturnPercent,
        availableCash: p.availableCash,
        netWorth,
        todayGain: parseFloat(todayGain.toFixed(2)),
        todayGainPercent: parseFloat(todayGainPercent.toFixed(2)),
        currentValue: parseFloat(totalValue.toFixed(2)),
        totalProfitLoss: overallProfit,
        totalProfitLossPercent: overallReturnPercent
      },
      holdings: populated
    };
  }

  // Remove/liquidate a position fully
  async deleteHoldingPosition(userId, holdingId) {
    const holding = await Holding.findOne({ _id: holdingId, userId });
    if (!holding) {
      throw new Error('Holding record not found');
    }

    // Fully liquidate
    const sellProceeds = holding.quantity * holding.currentPrice;
    const fees = parseFloat((sellProceeds * 0.001).toFixed(2));
    const netProceeds = sellProceeds - fees;

    const user = await User.findById(userId);
    if (user) {
      user.balance = parseFloat((user.balance + netProceeds).toFixed(2));
      await user.save();
    }

    await Holding.findByIdAndDelete(holdingId);
    return { message: `Holding position of ${holding.symbol} liquidated successfully` };
  }
  async getPortfolioHistoryBySymbol(userId, symbol, page = 1, limit = 20, action = 'ALL', sort = 'NEWEST', search = '') {
    const uppercaseSymbol = symbol.toUpperCase();

    // 1. Fetch current holding (if any)
    const holding = await Holding.findOne({ userId, symbol: uppercaseSymbol }).lean();
    let sharesOwned = 0;
    let averageBuyPrice = 0;
    let invested = 0;
    let marketValue = 0;
    let unrealizedProfit = 0;

    const stock = await Stock.findOne({ symbol: uppercaseSymbol }).select('currentPrice').lean();
    const currentPrice = stock ? stock.currentPrice : 0;

    if (holding) {
      sharesOwned = holding.quantity;
      averageBuyPrice = holding.averagePrice;
      invested = sharesOwned * averageBuyPrice;
      marketValue = sharesOwned * currentPrice;
      unrealizedProfit = marketValue - invested;
    }

    // 2. Build trade query
    const query = { userId, symbol: uppercaseSymbol };
    if (action === 'BUY' || action === 'SELL') {
      query.action = action;
    }
    if (search) {
      query._id = search; // Basic search by ID for now
    }

    // 3. Sorting
    let sortObj = { timestamp: -1 };
    if (sort === 'OLDEST') sortObj = { timestamp: 1 };
    if (sort === 'HIGHEST_VALUE') sortObj = { executedPrice: -1 };
    if (sort === 'LOWEST_VALUE') sortObj = { executedPrice: 1 };

    // 4. Fetch Paginated Trades
    const skip = (page - 1) * limit;
    const trades = await Trade.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalTradesCount = await Trade.countDocuments(query);

    // 5. Aggregate Statistics for this stock
    const allTrades = await Trade.find({ userId, symbol: uppercaseSymbol }).lean();
    
    let totalBuys = 0;
    let totalSells = 0;
    let totalSharesBought = 0;
    let totalSharesSold = 0;
    let sumBuyPrice = 0;
    let sumSellPrice = 0;
    let largestPurchase = 0;
    let largestSale = 0;
    let realizedProfit = 0;

    allTrades.forEach(t => {
      const total = t.quantity * t.executedPrice;
      if (t.action === 'BUY') {
        totalBuys++;
        totalSharesBought += t.quantity;
        sumBuyPrice += t.executedPrice;
        if (total > largestPurchase) largestPurchase = total;
      } else {
        totalSells++;
        totalSharesSold += t.quantity;
        sumSellPrice += t.executedPrice;
        if (total > largestSale) largestSale = total;
        realizedProfit += (t.realizedProfit || 0);
      }
    });

    const averageBuyPriceHistorical = totalBuys > 0 ? sumBuyPrice / totalBuys : 0;
    const averageSellPriceHistorical = totalSells > 0 ? sumSellPrice / totalSells : 0;
    const winRate = totalSells > 0 ? ((allTrades.filter(t => t.action === 'SELL' && t.realizedProfit > 0).length / totalSells) * 100).toFixed(2) : 0;
    const netInvestment = (totalSharesBought * averageBuyPriceHistorical) - (totalSharesSold * averageSellPriceHistorical);

    return {
      symbol: uppercaseSymbol,
      holding: {
        sharesOwned,
        averageBuyPrice,
        invested,
        marketValue,
        unrealizedProfit,
        realizedProfit
      },
      stats: {
        totalBuys,
        totalSells,
        totalSharesBought,
        totalSharesSold,
        averageBuyPrice: averageBuyPriceHistorical,
        averageSellPrice: averageSellPriceHistorical,
        largestPurchase,
        largestSale,
        winRate,
        netProfit: realizedProfit,
        netInvestment
      },
      transactions: trades,
      pagination: {
        total: totalTradesCount,
        page,
        pages: Math.ceil(totalTradesCount / limit)
      }
    };
  }
}

export default new PortfolioService();
