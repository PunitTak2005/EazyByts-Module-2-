import YahooFinance from 'yahoo-finance2';
import BaseProvider from './BaseProvider.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export default class YahooFinanceProvider extends BaseProvider {
  async getQuote(symbol) {
    try {
      const result = await yahooFinance.quote(symbol);
      return {
        symbol: result.symbol,
        currentPrice: result.regularMarketPrice,
        previousClose: result.regularMarketPreviousClose,
        open: result.regularMarketOpen,
        high: result.regularMarketDayHigh,
        low: result.regularMarketDayLow,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        volume: result.regularMarketVolume,
        timestamp: new Date(result.regularMarketTime)
      };
    } catch (error) {
      console.error(`YahooFinanceProvider.getQuote error for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getHistoricalData(symbol, range) {
    try {
      // Map frontend ranges to yahoo finance intervals and periods
      let period1 = new Date();
      let interval = '1d';
      
      switch(range) {
        case '1D':
          period1.setDate(period1.getDate() - 1);
          interval = '5m';
          break;
        case '1W':
          period1.setDate(period1.getDate() - 7);
          interval = '15m';
          break;
        case '1M':
          period1.setMonth(period1.getMonth() - 1);
          interval = '1d';
          break;
        case '3M':
          period1.setMonth(period1.getMonth() - 3);
          interval = '1d';
          break;
        case '6M':
          period1.setMonth(period1.getMonth() - 6);
          interval = '1d';
          break;
        case '1Y':
          period1.setFullYear(period1.getFullYear() - 1);
          interval = '1wk';
          break;
        case '5Y':
          period1.setFullYear(period1.getFullYear() - 5);
          interval = '1mo';
          break;
        default:
          period1.setMonth(period1.getMonth() - 1); // Default 1M
      }

      const queryOptions = { period1: period1.toISOString().split('T')[0], interval };
      const result = await yahooFinance.historical(symbol, queryOptions);
      
      return result.map(item => ({
        time: item.date.toISOString(),
        price: item.close,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));
    } catch (error) {
      console.error(`YahooFinanceProvider.getHistoricalData error for ${symbol}:`, error.message);
      return [];
    }
  }

  async getCompanyProfile(symbol) {
    try {
      const result = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile', 'price'] });
      const profile = result.assetProfile || {};
      const price = result.price || {};
      return {
        symbol: symbol,
        companyName: price.longName || price.shortName,
        exchange: price.exchangeName,
        sector: profile.sector || 'Unknown',
        industry: profile.industry || 'Unknown',
        description: profile.longBusinessSummary || '',
        marketCap: price.marketCap,
        website: profile.website
      };
    } catch (error) {
      console.error(`YahooFinanceProvider.getCompanyProfile error for ${symbol}:`, error.message);
      return null;
    }
  }


  async _getScreenerQuotes(scrId) {
    try {
      const result = await yahooFinance.screener({ scrIds: scrId, count: 10 });
      return (result.quotes || []).map(quote => ({
        symbol: quote.symbol,
        companyName: quote.longName || quote.shortName,
        currentPrice: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume
      }));
    } catch (error) {
      console.error(`YahooFinanceProvider._getScreenerQuotes error for ${scrId}:`, error.message);
      return [];
    }
  }

  async getTopGainers() {
    return this._getScreenerQuotes('day_gainers');
  }

  async getTopLosers() {
    return this._getScreenerQuotes('day_losers');
  }

  async getMostActive() {
    return this._getScreenerQuotes('most_actives');
  }

  async searchStocks(query) {
    try {
      const result = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 });
      return (result.quotes || [])
        .filter(q => q.isYahooFinance)
        .map(q => ({
          symbol: q.symbol,
          companyName: q.longname || q.shortname || q.symbol,
          exchange: q.exchange
        }));
    } catch (error) {
      console.error('YahooFinanceProvider.searchStocks error:', error.message);
      return [];
    }
  }

  async getIndices() {
    const indices = [
      { symbol: '^NSEI', name: 'NIFTY 50' },
      { symbol: '^BSESN', name: 'BSE SENSEX' },
      { symbol: '^GSPC', name: 'S&P 500' },
      { symbol: '^IXIC', name: 'NASDAQ' },
      { symbol: '^DJI', name: 'Dow Jones' },
      { symbol: '^FTSE', name: 'FTSE 100' },
      { symbol: '^N225', name: 'Nikkei 225' },
      { symbol: '^HSI', name: 'Hang Seng' }
    ];

    try {
      const quotes = await Promise.all(
        indices.map(async (idx) => {
          try {
            const quote = await yahooFinance.quote(idx.symbol);
            // Get mini sparkline (1 day, 15m intervals)
            const today = new Date();
            today.setDate(today.getDate() - 3); // To ensure we have some data even on weekends
            const hist = await yahooFinance.historical(idx.symbol, { period1: today.toISOString().split('T')[0], interval: '15m' });
            return {
              symbol: idx.symbol,
              name: idx.name,
              currentPrice: quote.regularMarketPrice,
              change: quote.regularMarketChange,
              changePercent: quote.regularMarketChangePercent,
              sparkline: hist.map(h => h.close)
            };
          } catch (e) {
            return null;
          }
        })
      );
      return quotes.filter(Boolean);
    } catch (error) {
      console.error('YahooFinanceProvider.getIndices error:', error.message);
      return [];
    }
  }

  async getFundamentals(symbol) {
    try {
      const result = await yahooFinance.quoteSummary(symbol, { 
        modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'] 
      });
      const sum = result.summaryDetail || {};
      const keyStats = result.defaultKeyStatistics || {};
      const fin = result.financialData || {};
      
      return {
        marketCap: sum.marketCap,
        enterpriseValue: keyStats.enterpriseValue,
        peRatio: sum.trailingPE,
        forwardPE: sum.forwardPE,
        eps: keyStats.trailingEps,
        dividendYield: sum.dividendYield,
        beta: sum.beta,
        fiftyTwoWeekHigh: sum.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: sum.fiftyTwoWeekLow,
        averageVolume: sum.averageVolume,
        sharesOutstanding: keyStats.sharesOutstanding,
        revenue: fin.totalRevenue,
        netIncome: keyStats.netIncomeToCommon,
        profitMargin: fin.profitMargins
      };
    } catch (error) {
      console.error(`YahooFinanceProvider.getFundamentals error for ${symbol}:`, error.message);
      return null;
    }
  }

  async getAnalystRatings(symbol) {
    try {
      const result = await yahooFinance.quoteSummary(symbol, { 
        modules: ['recommendationTrend', 'financialData'] 
      });
      const trends = result.recommendationTrend?.trend || [];
      const currentTrend = trends[0] || {};
      const fin = result.financialData || {};

      return {
        strongBuy: currentTrend.strongBuy || 0,
        buy: currentTrend.buy || 0,
        hold: currentTrend.hold || 0,
        sell: currentTrend.sell || 0,
        strongSell: currentTrend.strongSell || 0,
        targetMeanPrice: fin.targetMeanPrice || null,
        targetHighPrice: fin.targetHighPrice || null,
        targetLowPrice: fin.targetLowPrice || null,
        numberOfAnalystOpinions: fin.numberOfAnalystOpinions || 0,
        recommendationKey: fin.recommendationKey || 'none'
      };
    } catch (error) {
      console.error(`YahooFinanceProvider.getAnalystRatings error for ${symbol}:`, error.message);
      return null;
    }
  }
}
