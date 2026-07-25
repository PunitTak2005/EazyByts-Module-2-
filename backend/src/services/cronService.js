import cron from 'node-cron';
import mongoose from 'mongoose';
import Watchlist from '../models/Watchlist.js';
import MarketDataService from './MarketDataService.js';
import SocketService from './SocketService.js';
import PortfolioService from './PortfolioService.js';
import Cache from '../models/Cache.js';

class CronService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all scheduled background jobs.
   */
  start() {
    console.log('⏰ Scheduling background synchronization cron jobs...');

    // 1. Every 15 seconds: Update watchlist prices for active users
    const watchlistJob = cron.schedule('*/15 * * * * *', async () => {
      try {
        const activeUserIds = SocketService.getActiveUserIds();
        if (activeUserIds.length === 0) return;

        // Retrieve all symbols present in active users' watchlists
        const watchlists = await Watchlist.find({ userId: { $in: activeUserIds } });
        const symbols = new Set();
        
        watchlists.forEach(wl => {
          if (wl.symbols && Array.isArray(wl.symbols)) {
            wl.symbols.forEach(sym => symbols.add(sym.toUpperCase()));
          }
        });

        if (symbols.size === 0) return;

        console.log(`[Watchlist Cron] Syncing ${symbols.size} symbols for online users...`);
        for (const symbol of symbols) {
          // getQuote fetches current price (updates cache + broadcasts live quote)
          await MarketDataService.getQuote(symbol);
        }
      } catch (err) {
        console.error('[Watchlist Cron] Job error:', err.message);
      }
    });
    this.jobs.push(watchlistJob);

    // 2. Every 30 seconds: Recalculate portfolio values for active users
    const portfolioJob = cron.schedule('*/30 * * * * *', async () => {
      try {
        const activeUserIds = SocketService.getActiveUserIds();
        if (activeUserIds.length === 0) return;

        console.log(`[Portfolio Cron] Recalculating totals for ${activeUserIds.length} online users...`);
        for (const userId of activeUserIds) {
          const details = await PortfolioService.getPortfolioDetails(userId);
          // Emit updated portfolio statistics directly to user socket channel
          SocketService.broadcastToRoom(`user:${userId}`, 'portfolio_tick', details);
        }
      } catch (err) {
        console.error('[Portfolio Cron] Job error:', err.message);
      }
    });
    this.jobs.push(portfolioJob);

    // 3. Every 1 minute: Refresh top movers (gainers, losers, active)
    const moversJob = cron.schedule('*/60 * * * * *', async () => {
      try {
        console.log('[Movers Cron] Evicting movers cache...');
        await Cache.deleteOne({ key: 'market_gainers' });
        await Cache.deleteOne({ key: 'market_losers' });
        await Cache.deleteOne({ key: 'market_active' });

        const gainers = await MarketDataService.getTopGainers();
        const losers = await MarketDataService.getTopLosers();
        const active = await MarketDataService.getMostActive();

        SocketService.broadcast('movers_tick', { gainers, losers, active });
      } catch (err) {
        console.error('[Movers Cron] Job error:', err.message);
      }
    });
    this.jobs.push(moversJob);

    // 4. Removed News cron job.

    // 5. Daily: Evict company profile cache (at midnight)
    const profileJob = cron.schedule('0 0 * * *', async () => {
      try {
        console.log('[Profile Cron] Cleansing company profile caches...');
        await Cache.deleteMany({ key: { $regex: '^profile_' } });
      } catch (err) {
        console.error('[Profile Cron] Job error:', err.message);
      }
    });
    this.jobs.push(profileJob);

    console.log(`🚀 Scheduled ${this.jobs.length} cron jobs successfully.`);
  }

  /**
   * Stop all scheduled cron jobs.
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('🛑 Cron jobs scheduler stopped.');
  }
}

export default new CronService();
