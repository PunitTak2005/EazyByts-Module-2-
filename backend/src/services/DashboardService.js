import PortfolioService from './PortfolioService.js';
import StockService from './StockService.js';
import TradeService from './TradeService.js';
import WatchlistService from './WatchlistService.js';
import Notification from '../models/Notification.js';
import PortfolioHistoryService from './PortfolioHistoryService.js';

class DashboardService {
  async getDashboardSummary(userId) {
    const startTime = Date.now();
    console.log(`[Dashboard Diagnostic] Starting GET /dashboard query execution for user ${userId}`);

    // Parallelize independent queries using Promise.all to reduce latency by ~90%
    const [
      portfolioSummary,
      movers,
      tradeData,
      notifications,
      watchlists,
      performanceCurve
    ] = await Promise.all([
      PortfolioService.getPortfolioDetails(userId),
      StockService.getMoversWithCache(), // Use cached movers to eliminate full collection scans
      TradeService.getTrades(userId, 1, 5),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      WatchlistService.getWatchlistsSummary(userId),
      PortfolioHistoryService.getPortfolioHistory(userId, '1M')
    ]);

    const recentTrades = tradeData?.trades || [];
    const hasTrades = recentTrades.length > 0;
    const duration = Date.now() - startTime;

    console.log(`[Dashboard Diagnostic] Completed GET /dashboard for user ${userId} in ${duration}ms`);

    return {
      portfolio: portfolioSummary?.summary || {},
      holdings: portfolioSummary?.holdings || [],
      topMovers: movers || { gainers: [], losers: [], active: [] },
      recentTrades,
      notifications: notifications || [],
      watchlist: (Array.isArray(watchlists) && watchlists.length > 0) ? watchlists[0] : null,
      summary: portfolioSummary?.summary || {},
      topGainers: movers?.gainers || [],
      topLosers: movers?.losers || [],
      performanceCurve: performanceCurve || [],
      hasTrades
    };
  }
}

export default new DashboardService();
