import axios from 'axios';
import BaseProvider from './BaseProvider.js';

export default class FinnhubProvider extends BaseProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseURL = 'https://finnhub.io/api/v1';
    console.log('🔌 FinnhubProvider initialized.');
  }

  async getQuote(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/quote`, {
        params: { symbol: symbol.toUpperCase(), token: this.apiKey }
      });
      const data = response.data;
      
      if (!data.c) {
        throw new Error(`Invalid quote response for ticker ${symbol}`);
      }

      return {
        symbol: symbol.toUpperCase(),
        currentPrice: parseFloat(data.c),
        change: parseFloat(data.d),
        changePercent: parseFloat(data.dp),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        open: parseFloat(data.o),
        previousClose: parseFloat(data.pc),
        volume: 0, // Finnhub quote does not provide volume directly
        marketCap: 0,
        timestamp: Date.now()
      };
    } catch (err) {
      console.error(`Finnhub quote fetch failed for ${symbol}:`, err.message);
      throw err;
    }
  }

  async getHistoricalData(symbol, range) {
    try {
      const today = Math.floor(Date.now() / 1000);
      let from;
      
      if (range === '1D') from = today - 24 * 60 * 60;
      else if (range === '1W') from = today - 7 * 24 * 60 * 60;
      else if (range === '1M') from = today - 30 * 24 * 60 * 60;
      else from = today - 365 * 24 * 60 * 60;

      const resolution = range === '1D' ? '60' : 'D';

      const response = await axios.get(`${this.baseURL}/stock/candle`, {
        params: {
          symbol: symbol.toUpperCase(),
          resolution: resolution,
          from: from,
          to: today,
          token: this.apiKey
        }
      });
      const data = response.data;

      if (data.s !== 'ok') {
        throw new Error(`Candle data query failed: ${data.s}`);
      }

      return data.t.map((t, idx) => {
        const dateObj = new Date(t * 1000);
        return {
          time: range === '1D' 
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          open: parseFloat(data.o[idx]),
          high: parseFloat(data.h[idx]),
          low: parseFloat(data.l[idx]),
          close: parseFloat(data.c[idx]),
          volume: parseInt(data.v[idx])
        };
      });
    } catch (err) {
      console.error(`Finnhub history fetch failed for ${symbol}:`, err.message);
      throw err;
    }
  }

  async getCompanyProfile(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/stock/profile2`, {
        params: { symbol: symbol.toUpperCase(), token: this.apiKey }
      });
      const data = response.data;

      return {
        symbol: symbol.toUpperCase(),
        companyName: data.name || `${symbol.toUpperCase()} Inc.`,
        exchange: data.exchange || 'NASDAQ',
        industry: data.finnhubIndustry || 'N/A',
        sector: data.finnhubIndustry || 'Technology',
        ceo: 'N/A',
        employees: data.shareOutstanding || 0,
        headquarters: 'N/A',
        marketCap: parseFloat(data.marketCapitalization || 0),
        peRatio: 0,
        eps: 0,
        dividendYield: 0,
        description: `${data.name || symbol.toUpperCase()} is listed on the ${data.exchange || 'NASDAQ'} index.`,
        website: data.weburl || '',
        logo: data.logo || ''
      };
    } catch (err) {
      console.error(`Finnhub profile fetch failed for ${symbol}:`, err.message);
      throw err;
    }
  }


  async searchStocks(query) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: { q: query, token: this.apiKey }
      });
      const data = response.data?.result || [];

      return data.map(item => ({
        symbol: item.symbol,
        name: item.description,
        exchange: item.type || 'Common Stock'
      }));
    } catch (err) {
      console.error(`Finnhub search failed for query ${query}:`, err.message);
      throw err;
    }
  }
}
