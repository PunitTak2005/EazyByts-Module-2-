import PortfolioService from './PortfolioService.js';
import StockService from './StockService.js';
import TradeService from './TradeService.js';
import WatchlistService from './WatchlistService.js';
import Notification from '../models/Notification.js';
import PortfolioHistoryService from './PortfolioHistoryService.js';

class DashboardService {
  async getDashboardSummary(userId) {
    const totalStart = Date.now();
    console.log(`[Dashboard Profiler] User ${userId} - Starting execution`);

    const t0 = Date.now();
    const portfolioPromise = PortfolioService.getPortfolioDetails(userId).then(res => {
      console.log(`  [Dashboard Profiler] Portfolio Query: ${Date.now() - t0}ms`);
      return res;
    });

    const t1 = Date.now();
    const moversPromise = StockService.getMoversWithCache().then(res => {
      console.log(`  [Dashboard Profiler] Movers Query: ${Date.now() - t1}ms`);
      return res;
    });

    const t2 = Date.now();
    const tradesPromise = TradeService.getTrades(userId, 1, 5).then(res => {
      console.log(`  [Dashboard Profiler] Trades Query: ${Date.now() - t2}ms`);
      return res;
    });

    const t3 = Date.now();
    const notifsPromise = Notification.find({ userId })
      .select('_id title message type read readAt createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .then(res => {
        console.log(`  [Dashboard Profiler] Notifications Query: ${Date.now() - t3}ms`);
        return res;
      });

    const t4 = Date.now();
    const watchlistsPromise = WatchlistService.getWatchlistsSummary(userId).then(res => {
      console.log(`  [Dashboard Profiler] Watchlist Query: ${Date.now() - t4}ms`);
      return res;
    });

    const t5 = Date.now();
    const historyPromise = PortfolioHistoryService.getPortfolioHistory(userId, '1M').then(res => {
      console.log(`  [Dashboard Profiler] Performance History Query: ${Date.now() - t5}ms`);
      return res;
    });

    const [
      portfolioSummary,
      movers,
      tradeData,
      notifications,
      watchlists,
      performanceCurve
    ] = await Promise.all([
      portfolioPromise,
      moversPromise,
      tradesPromise,
      notifsPromise,
      watchlistsPromise,
      historyPromise
    ]);

    const totalDuration = Date.now() - totalStart;
    console.log(`[Dashboard Profiler] Total Execution Time: ${totalDuration}ms for user ${userId}`);

    const recentTrades = tradeData?.trades || [];
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
      hasTrades: recentTrades.length > 0
    };
  }
}

export default new DashboardService();
