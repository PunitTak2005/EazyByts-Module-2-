import StockService from '../services/StockService.js';
import YahooFinanceService from '../services/YahooFinanceService.js';
import { sendSuccess } from './authController.js';

export const getStocks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = (req.query.search || '').toLowerCase();
    const sector = req.query.sector || '';
    const sortBy = req.query.sortBy || 'symbol';
    const sortOrder = req.query.sortOrder || 'asc';
    const capClass = req.query.marketCapClass || '';
    const priceRange = req.query.priceRange || '';
    const changeType = req.query.changeType || '';

    let stocks = await YahooFinanceService.getLiveTickerData();

    // 1. Filter
    if (search) {
      stocks = stocks.filter(s => 
        s.symbol.toLowerCase().includes(search) || 
        (s.companyName && s.companyName.toLowerCase().includes(search))
      );
    }

    if (sector && sector !== 'All') {
      stocks = stocks.filter(s => s.sector === sector);
    }

    if (capClass && capClass !== 'All') {
      stocks = stocks.filter(s => {
        const cap = s.marketCap || 0;
        if (capClass === 'large') return cap >= 10000000000; // >= 10B
        if (capClass === 'mid') return cap >= 2000000000 && cap < 10000000000; // 2B - 10B
        if (capClass === 'small') return cap < 2000000000; // < 2B
        return true;
      });
    }

    if (priceRange && priceRange !== 'All') {
      stocks = stocks.filter(s => {
        const p = s.price || 0;
        if (priceRange === '0-100') return p >= 0 && p <= 100;
        if (priceRange === '100-500') return p > 100 && p <= 500;
        if (priceRange === '500-1000') return p > 500 && p <= 1000;
        if (priceRange === '1000-5000') return p > 1000 && p <= 5000;
        if (priceRange === '5000+') return p > 5000;
        return true;
      });
    }

    if (changeType && changeType !== 'All') {
      stocks = stocks.filter(s => {
        const c = s.changePercent || 0;
        if (changeType === 'positive') return c > 0;
        if (changeType === 'negative') return c < 0;
        return true;
      });
    }

    // 2. Sort
    stocks.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 3. Paginate
    const total = stocks.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedStocks = stocks.slice(startIndex, startIndex + limit);

    const result = {
      stocks: paginatedStocks,
      total,
      page,
      pages
    };

    return sendSuccess(res, 'Stocks list fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getStockBySymbol = async (req, res, next) => {
  try {
    const rawSymbol = req.params.symbol;
    if (!rawSymbol || typeof rawSymbol !== 'string' || rawSymbol.trim() === '') {
      return res.status(404).json({ success: false, message: 'Stock symbol not found.' });
    }
    
    const symbol = rawSymbol.trim().toUpperCase();

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Stock API]\nRequest received\nSymbol: ${symbol}\nFetching Yahoo Finance data...`);
    }

    const s = await YahooFinanceService.getCompleteStockDetails(symbol);
    
    if (!s) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Stock API]\nSymbol: ${symbol}\nYahoo Finance request failed.\nReason: Data was null after normalizer.`);
      }
      return res.status(404).json({ success: false, message: 'Stock symbol not found.' });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Stock API]\nYahoo response received.\nTransforming response...\nReturning 200 OK.`);
    }

    return res.status(200).json({
      success: true,
      message: 'Stock details retrieved successfully',
      data: s
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Stock API]\nSymbol: ${req.params.symbol}\nYahoo Finance request failed.\nReason:\n${error.stack || error.message}`);
    }

    const errMessage = (error.message || '').toLowerCase();
    if (errMessage.includes('failed to fetch quote') || errMessage.includes('not found') || errMessage.includes('normalization failed')) {
      return res.status(404).json({ success: false, message: 'Stock symbol not found.' });
    }
    if (errMessage.includes('timeout') || errMessage.includes('unavailable') || errMessage.includes('network')) {
      return res.status(503).json({ success: false, message: 'Market data provider unavailable.' });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stock details.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getTrending = async (req, res, next) => {
  try {
    const s = await StockService.getTrending();
    return sendSuccess(res, 'Trending stocks retrieved successfully', s);
  } catch (error) {
    next(error);
  }
};

export const getMovers = async (req, res, next) => {
  try {
    const result = await StockService.getMoversWithCache();
    const normalized = {
      gainers: result.gainers || [],
      losers: result.losers || [],
      mostActive: result.active || []
    };
    return sendSuccess(res, 'Top Movers retrieved successfully', normalized);
  } catch (error) {
    next(error);
  }
};

export const searchStocks = async (req, res, next) => {
  const queryStr = req.query.q || '';
  try {
    const list = await StockService.queryStocks(1, 10, queryStr);
    return sendSuccess(res, 'Search completed successfully', list.stocks);
  } catch (error) {
    next(error);
  }
};

export const getMarketOverview = async (req, res, next) => {
  try {
    // Generate beautiful mock major indices
    const indices = [
      { name: 'S&P 500 (Sim)', value: 5082.40, change: 42.10, changePercent: 0.83, isPositive: true },
      { name: 'Dow Jones (Sim)', value: 39131.50, change: -122.30, changePercent: -0.31, isPositive: false },
      { name: 'Nasdaq 100 (Sim)', value: 18004.20, change: 185.40, changePercent: 1.04, isPositive: true },
      { name: 'Nifty 50 (Sim)', value: 22104.05, change: 92.50, changePercent: 0.42, isPositive: true }
    ];
    return sendSuccess(res, 'Market overview data retrieved', indices);
  } catch (error) {
    next(error);
  }
};

export const getStockHistory = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { range = '1mo', interval = '1d' } = req.query;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n[History]\nFetching:\n${symbol}\nRange:\n${range}\nInterval:\n${interval}\n↓`);
    }

    const historyData = await YahooFinanceService.getHistoricalData(symbol, range, interval);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Rendering chart\n');
    }

    return res.status(200).json({
      success: true,
      data: historyData
    });
  } catch (error) {
    next(error);
  }
};
export const getGainers = async (req, res, next) => {
  try {
    const movers = await StockService.getMovers();
    return sendSuccess(res, 'Gainers retrieved successfully', movers.gainers);
  } catch (error) {
    next(error);
  }
};

export const getLosers = async (req, res, next) => {
  try {
    const movers = await StockService.getMovers();
    return sendSuccess(res, 'Losers retrieved successfully', movers.losers);
  } catch (error) {
    next(error);
  }
};

export const getMostActive = async (req, res, next) => {
  try {
    const movers = await StockService.getMovers();
    return sendSuccess(res, 'Most active stocks retrieved successfully', movers.active);
  } catch (error) {
    next(error);
  }
};

export const getMostActiveLive = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n[MostActive]\nIncoming request\n↓');
      console.log('Yahoo fetch started\n↓');
    }

    // Fetch live quotes from Yahoo Finance (uses internal 60s cache)
    const quotes = await YahooFinanceService.getLiveTickerData();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Yahoo response received\n↓');
      console.log(`Parsed ${quotes.length} stocks\n↓`);
      console.log('Sorted by volume\n↓');
    }

    // Sort strictly by volume descending
    const sortedQuotes = [...quotes].sort((a, b) => (b.volume || 0) - (a.volume || 0));
    
    // Take top N
    const topActive = sortedQuotes.slice(0, limit);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Returning top ${limit}\n`);
    }

    const responsePayload = {
      count: topActive.length,
      lastUpdated: YahooFinanceService.lastFetchTime 
        ? new Date(YahooFinanceService.lastFetchTime).toISOString() 
        : new Date().toISOString(),
      data: topActive
    };
    
    return res.status(200).json({
      success: true,
      lastUpdated: responsePayload.lastUpdated,
      count: responsePayload.count,
      data: responsePayload.data
    });
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('\n[MostActive]\nYahoo request failed\nReason:\n', error.message, '\n');
    }
    next(error);
  }
};

export const getStockCategories = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n[Categories]\nIncoming request\n↓');
    }

    const stocks = await YahooFinanceService.getLiveTickerData();
    
    const largeCap = [];
    const midCap = [];
    const smallCap = [];

    stocks.forEach(stock => {
      // Skip if no market cap
      if (!stock.marketCap || isNaN(stock.marketCap) || stock.marketCap === 0) return;

      // MarketCap is in INR, convert to USD for standardized category thresholds ($10B, $2B-$10B, $300M-$2B)
      const capUSD = stock.marketCap / 83;

      if (capUSD >= 10000000000) {
        largeCap.push(stock);
      } else if (capUSD >= 2000000000 && capUSD < 10000000000) {
        midCap.push(stock);
      } else if (capUSD >= 300000000 && capUSD < 2000000000) {
        smallCap.push(stock);
      }
      // Note: < 300M is micro-cap, we exclude it for these 3 lists to match standard classification
    });

    // Sort by market cap descending
    const sortByCapDesc = (a, b) => b.marketCap - a.marketCap;
    largeCap.sort(sortByCapDesc);
    midCap.sort(sortByCapDesc);
    smallCap.sort(sortByCapDesc);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Categories]\nFetched ${stocks.length} stocks\nLarge Cap: ${largeCap.length}\nMid Cap: ${midCap.length}\nSmall Cap: ${smallCap.length}\n`);
      if (midCap.length === 0) {
         console.log('No stocks classified as Mid Cap. Reason: None matched the criteria.');
      }
    }

    return res.status(200).json({
      success: true,
      largeCap,
      midCap,
      smallCap
    });
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('\n[Categories]\nError:\n', error.message, '\n');
    }
    next(error);
  }
};

export const getSectors = async (req, res, next) => {
  try {
    const stocks = await YahooFinanceService.getLiveTickerData();
    const sectorsSet = new Set();
    
    stocks.forEach(stock => {
      if (stock.sector) {
        sectorsSet.add(stock.sector);
      }
    });
    
    const sectors = Array.from(sectorsSet).sort();
    
    return res.status(200).json({
      success: true,
      sectors
    });
  } catch (error) {
    next(error);
  }
};
