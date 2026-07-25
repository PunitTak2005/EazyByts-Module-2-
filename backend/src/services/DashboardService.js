import PortfolioService from './PortfolioService.js';
import StockService from './StockService.js';
import TradeService from './TradeService.js';
import WatchlistService from './WatchlistService.js';
import MarketDataService from './MarketDataService.js';
import Notification from '../models/Notification.js';
import PortfolioHistoryService from './PortfolioHistoryService.js';

class DashboardService {
  async getDashboardSummary(userId) {
    // 1. Portfolio stats
    const portfolioSummary = await PortfolioService.getPortfolioDetails(userId);

    // 2. Movers (Gainers, Losers, Active)
    const movers = await StockService.getMovers();

    // 3. Recent Trades (last 5)
    const { trades: recentTrades } = await TradeService.getTrades(userId, 1, 5);

    // 4. Notifications (latest 5 unread or all)
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();

    // 5. Watchlist overview
    const watchlists = await WatchlistService.getWatchlistsSummary(userId);

    // 6. Net Worth growth history from real snapshot storage
    const performanceCurve = await PortfolioHistoryService.getPortfolioHistory(userId, '1M');
    const hasTrades = recentTrades && recentTrades.length > 0;

    return {
      portfolio: portfolioSummary.summary,
      holdings: portfolioSummary.holdings,
      topMovers: movers,
      recentTrades,
      notifications,
      watchlist: watchlists.length > 0 ? watchlists[0] : null,
      summary: portfolioSummary.summary,
      topGainers: movers.gainers,
      topLosers: movers.losers,
      performanceCurve,
      hasTrades
    };
  }
}

export default new DashboardService();
