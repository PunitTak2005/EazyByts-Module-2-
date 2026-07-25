import ProviderFactory from '../providers/ProviderFactory.js';
import Cache from '../models/Cache.js';
import AlertService from './AlertService.js';

class MarketDataService {
  constructor() {
    this.provider = ProviderFactory.getProvider();
    this.io = null; // Set from server.js
  }

  setSocketServer(io) {
    this.io = io;
  }

  /**
   * Helper to retrieve or set cache items.
   * @param {string} key 
   * @param {number} ttlMs 
   * @param {Function} fetchFn 
   */
  async getCached(key, ttlMs, fetchFn) {
    try {
      const cachedItem = await Cache.findOne({ key });
      if (cachedItem && cachedItem.expiresAt > new Date()) {
        return cachedItem.value;
      }

      // Cache miss or expired
      const freshData = await fetchFn();
      
      await Cache.findOneAndUpdate(
        { key },
        { 
          value: freshData, 
          expiresAt: new Date(Date.now() + ttlMs) 
        },
        { upsert: true, new: true }
      );

      return freshData;
    } catch (err) {
      console.error(`Cache handler error for key ${key}:`, err.message);
      // Fail-safe: execute fallback fetch directly
      return await fetchFn();
    }
  }

  async getQuote(symbol) {
    const cleanSym = symbol.toUpperCase();
    const quote = await this.getCached(`quote_${cleanSym}`, 60 * 1000, async () => {
      return await this.provider.getQuote(cleanSym);
    });

    // Broadcast quote to Socket clients if connected
    if (this.io) {
      this.io.emit('price_update', quote);
    }
    
    // Check custom price alerts
    if (quote) {
      // Run asynchronously without blocking
      AlertService.checkAlerts(quote).catch(err => {
        console.error('Alert check error:', err.message);
      });
    }

    return quote;
  }

  async getHistoricalData(symbol, range) {
    const cleanSym = symbol.toUpperCase();
    return await this.getCached(`history_${cleanSym}_${range}`, 24 * 60 * 60 * 1000, async () => {
      return await this.provider.getHistoricalData(cleanSym, range);
    });
  }

  async getCompanyProfile(symbol) {
    const cleanSym = symbol.toUpperCase();
    return await this.getCached(`profile_${cleanSym}`, 24 * 60 * 60 * 1000, async () => {
      return await this.provider.getCompanyProfile(cleanSym);
    });
  }

  async getTopGainers() {
    return await this.getCached('market_gainers', 60 * 1000, async () => {
      return await this.provider.getTopGainers();
    });
  }

  async getTopLosers() {
    return await this.getCached('market_losers', 60 * 1000, async () => {
      return await this.provider.getTopLosers();
    });
  }

  async getMostActive() {
    return await this.getCached('market_active', 60 * 1000, async () => {
      return await this.provider.getMostActive();
    });
  }

  async getMarketNews() {
    return await this.getCached('market_news', 60 * 1000, async () => {
      const yahooFinanceService = (await import('./yahooFinanceService.js')).default;
      return await yahooFinanceService.getLiveHeadlines();
    });
  }

  async searchStocks(query) {
    const cleanQ = query.trim().toLowerCase();
    return await this.getCached(`search_${cleanQ}`, 5 * 60 * 1000, async () => {
      return await this.provider.searchStocks(cleanQ);
    });
  }

  async getIndices() {
    return await this.getCached('market_indices', 5 * 60 * 1000, async () => {
      if (this.provider.getIndices) {
        return await this.provider.getIndices();
      }
      return [];
    });
  }

  async getFundamentals(symbol) {
    const cleanSym = symbol.toUpperCase();
    return await this.getCached(`fundamentals_${cleanSym}`, 24 * 60 * 60 * 1000, async () => {
      if (this.provider.getFundamentals) {
        return await this.provider.getFundamentals(cleanSym);
      }
      return null;
    });
  }

  async getAnalystRatings(symbol) {
    const cleanSym = symbol.toUpperCase();
    return await this.getCached(`analyst_${cleanSym}`, 24 * 60 * 60 * 1000, async () => {
      if (this.provider.getAnalystRatings) {
        return await this.provider.getAnalystRatings(cleanSym);
      }
      return null;
    });
  }


}

export default new MarketDataService();
