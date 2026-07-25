import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
import { normalizeYahooQuote } from '../utils/stockNormalizer.js';
import { normalizeCompleteStockDetails } from './yahooFinanceNormalizer.js';

class YahooFinanceService {
  constructor() {
    this.cache = null;
    this.lastFetchTime = 0;
    this.cacheTtlMs = (process.env.YAHOO_CACHE_TTL ? parseInt(process.env.YAHOO_CACHE_TTL, 10) : 60) * 1000;
    
    // Complete details cache
    this.detailCache = {};
    this.detailCacheTtlMs = 60 * 1000; // 60 seconds
    
    // Historical data cache
    this.historyCache = {};
    
    // News headlines cache
    this.newsCache = null;
    this.lastNewsFetchTime = 0;
    
    const defaultSymbols = [
      // US Mega/Large Cap (Tech & General)
      'AAPL','MSFT','NVDA','TSLA','META','AMZN','GOOGL','NFLX',
      'JPM','V','MA','BAC','WFC','C','GS','MS',
      'WMT','PG','KO','PEP','COST','MCD','NKE','SBUX',
      'JNJ','UNH','PFE','ABBV','MRK','TMO','DHR','LLY',
      'XOM','CVX','COP','SLB','EOG','MPC','PSX','VLO',
      'F','GM','TM','HMC','RACE',
      // US Mid Cap
      'PLTR','SOFI','RIVN','SNAP','HOOD','UBER','ROKU','DKNG',
      'AFRM','SQ','COIN','PINS','DDOG','MDB','OKTA','CRWD',
      'ZS','NET','SNOW','DOCN','FSLY','TTD','LMND',
      'UPST','AI','PATH','TOST','MNDY','ASAN','BILL','BSY',
      // US Small Cap
      'LCID','FSR','NKLA','RIDE','WKHS','GOEV','CLSK','RIOT',
      'MARA','HUT','BITF','HIVE','ANY','GREE','SDIG','CIFR',
      'WULF','IREN','BTBT','MIGI','CORZ','ARBK','GLXY','HUT8',
      'MSTR','SI','SBNY','FRC','SIVB','PACW','WAL','ZION',
      // Indian Large Cap
      'RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS','ICICIBANK.NS',
      'SBIN.NS','BHARTIARTL.NS','ITC.NS','HINDUNILVR.NS','LT.NS',
      'BAJFINANCE.NS','KOTAKBANK.NS','AXISBANK.NS','MARUTI.NS','ASIANPAINT.NS',
      // Indian Mid Cap
      'BEL.NS','BSE.NS','CDSL.NS','KPITTECH.NS','PERSISTENT.NS',
      'POLYCAB.NS','RVNL.NS','IRFC.NS','IREDA.NS','NHPC.NS',
      'HUDCO.NS','MAZDOCK.NS','COCHINSHIP.NS','CYIENT.NS','IDFCFIRSTB.NS',
      'TATAELXSI.NS','LTIM.NS','COFORGE.NS','MPHASIS.NS','LTTS.NS',
      // Indian Small Cap
      'BLS.NS','RAILTEL.NS','RITES.NS','IRCTC.NS','NBCC.NS',
      'J&KBANK.NS','UCOBANK.NS','IOB.NS','MAHABANK.NS','PSB.NS',
      'SUZLON.NS','JPPOWER.NS','RPOWER.NS','GMRINFRA.NS','IRB.NS'
    ];
    
    const symbolsStr = process.env.STOCK_SYMBOLS || defaultSymbols.join(',');
    this.symbols = Array.from(new Set(symbolsStr.split(',').map(s => s.trim()).filter(Boolean)));
  }

  async getLiveTickerData() {
    const now = Date.now();
    
    // Return cache if valid
    if (this.cache && (now - this.lastFetchTime) < this.cacheTtlMs) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Yahoo Finance] Cache hit');
      }
      return this.cache;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Yahoo Finance] Fetching latest quotes...');
      }

      // We fetch all symbols in a single batch call. yahoo-finance2 handles chunking if necessary.
      const quotes = await yahooFinance.quote(this.symbols);
      
      const normalizedData = quotes.map(normalizeYahooQuote).filter(Boolean);
      
      // Update cache
      this.cache = normalizedData;
      this.lastFetchTime = now;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Yahoo Finance] Cache refreshed');
      }

      return this.cache;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Yahoo Finance] Error fetching quotes:', error.message);
      }
      
      // Fallback to cache if available even if expired
      if (this.cache) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Yahoo Finance] Returning stale cache due to fetch error');
        }
        return this.cache;
      }
      
      // If no cache, we should not crash, return empty array or throw? 
      // User says "Never crash the API"
      return [];
    }
  }

  async getCompleteStockDetails(symbol) {
    const sym = symbol.toUpperCase();
    const now = Date.now();

    // 1. Check Detail Cache
    if (this.detailCache[sym] && (now - this.detailCache[sym].timestamp < this.detailCacheTtlMs)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Yahoo Finance] Detail cache hit for ${sym}`);
      }
      return this.detailCache[sym].data;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Yahoo Finance] Fetching complete details for ${sym}...`);
    }

    try {
      // 2. Fetch Quote and Summary concurrently
      const [quoteRes, summaryRes] = await Promise.allSettled([
        yahooFinance.quote(sym),
        yahooFinance.quoteSummary(sym, { modules: ['summaryProfile', 'assetProfile', 'financialData', 'defaultKeyStatistics', 'summaryDetail'] })
      ]);

      if (quoteRes.status === 'rejected') {
        throw new Error(`Failed to fetch quote for ${sym}`);
      }

      const quote = quoteRes.value;
      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : {};
      
      // 3. Normalize Response (passing empty object for history since we decoupled it)
      const normalizedData = normalizeCompleteStockDetails(quote, summary, {});

      if (!normalizedData) {
        throw new Error('Normalization failed');
      }

      // 4. Update Cache
      this.detailCache[sym] = {
        timestamp: now,
        data: normalizedData
      };

      return normalizedData;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Yahoo Finance] Error fetching complete details for ${sym}:`, error.message);
      }
      throw error;
    }
  }

  async getHistoricalData(symbol, range, interval) {
    const sym = symbol.toUpperCase();
    const cacheKey = `${sym}_${range}_${interval}`;
    const now = Date.now();

    // 5-minute cache
    if (this.historyCache[cacheKey] && (now - this.historyCache[cacheKey].timestamp < 5 * 60 * 1000)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Yahoo Finance] History cache hit for ${cacheKey}`);
      }
      return this.historyCache[cacheKey].data;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Yahoo Finance] Fetching history for ${sym} (range: ${range}, interval: ${interval})...`);
    }

    try {
      // Calculate period1 dynamically based on range since yahoo-finance2 supports period1/period2 or just range, 
      // but to be safe and replicate standard Yahoo Finance API behavior, passing `range` directly to queryOptions is cleaner.
      // E.g., yahooFinance.chart('TSLA', { period1: '2020-01-01', interval: '1d' }) or { period1: <date object> }
      // The user prompt specifically asked for range and interval parameters.
      
      // Calculate period1 for safety instead of relying on `range` string if it fails
      let period1Ms;
      switch (range) {
        case '1d': period1Ms = now - 1 * 24 * 60 * 60 * 1000; break;
        case '5d': period1Ms = now - 7 * 24 * 60 * 60 * 1000; break;
        case '1mo': period1Ms = now - 30 * 24 * 60 * 60 * 1000; break;
        case '3mo': period1Ms = now - 90 * 24 * 60 * 60 * 1000; break;
        case '6mo': period1Ms = now - 180 * 24 * 60 * 60 * 1000; break;
        case '1y': period1Ms = now - 365 * 24 * 60 * 60 * 1000; break;
        case '5y': period1Ms = now - 5 * 365 * 24 * 60 * 60 * 1000; break;
        default: period1Ms = now - 30 * 24 * 60 * 60 * 1000;
      }
      
      const queryOptions = { period1: new Date(period1Ms), interval };
      const res = await yahooFinance.chart(sym, queryOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Yahoo Finance] History response received. Points returned: ${res.quotes?.length || 0}`);
      }

      if (!res.quotes || res.quotes.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Yahoo Finance] History API returned 0 records.`);
        }
        return [];
      }

      const normalizedData = res.quotes
        .filter(q => q.close !== null && q.open !== null && q.high !== null && q.low !== null)
        .map(q => ({
          timestamp: new Date(q.date).getTime(),
          date: new Date(q.date).toISOString().split('T')[0],
          open: Number(q.open.toFixed(2)),
          high: Number(q.high.toFixed(2)),
          low: Number(q.low.toFixed(2)),
          close: Number(q.close.toFixed(2)),
          volume: q.volume || 0
        }));

      // Cache it
      this.historyCache[cacheKey] = {
        timestamp: now,
        data: normalizedData
      };

      return normalizedData;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Yahoo historical request failed:\n${error.message}`);
      }
      throw error;
    }
  }

  async getLiveHeadlines(query = 'stock market', limit = 20) {
    const now = Date.now();
    if (this.newsCache && (now - this.lastNewsFetchTime) < 60 * 1000) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Yahoo Finance] News headlines cache hit');
      }
      return this.newsCache;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Yahoo Finance] Fetching live market news headlines...');
      }

      const res = await yahooFinance.search(query, { quotesCount: 0, newsCount: limit });
      const newsItems = res?.news || [];

      if (!newsItems.length) {
        if (this.newsCache) return this.newsCache;
        return [];
      }

      const headlines = newsItems.map((item) => {
        let relSymbol = 'MARKET';
        if (item.relatedTickers && item.relatedTickers.length > 0) {
          const first = item.relatedTickers.find((t) => typeof t === 'string' && !t.startsWith('^'));
          if (first) relSymbol = first;
        }
        return {
          title: item.title || '',
          publisher: item.publisher || 'Yahoo Finance',
          link: item.link || '#',
          publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime).toISOString() : new Date().toISOString(),
          symbol: relSymbol,
        };
      });

      this.newsCache = headlines;
      this.lastNewsFetchTime = now;

      return headlines;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Yahoo Finance] Error fetching headlines:', error.message);
      }
      if (this.newsCache) {
        return this.newsCache;
      }
      throw error;
    }
  }
}

export default new YahooFinanceService();
