import BaseProvider from './BaseProvider.js';

export default class MockProvider extends BaseProvider {
  constructor() {
    super();
    console.log('🤖 MockProvider initialized (Active fallback provider).');
  }

  async getQuote(symbol) {
    const basePrice = Math.floor(Math.random() * 500) + 50;
    const change = parseFloat((Math.random() * 10 - 5).toFixed(2));
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: basePrice + change,
      change,
      changePercent,
      high: basePrice * 1.02,
      low: basePrice * 0.98,
      open: basePrice * 1.01,
      previousClose: basePrice,
      volume: Math.floor(Math.random() * 2000000) + 100000,
      marketCap: Math.floor(Math.random() * 500) + 10, // billions
      timestamp: Date.now()
    };
  }

  async getHistoricalData(symbol, range) {
    const dataPointsCount = range === '1D' ? 24 : range === '1W' ? 7 : range === '1M' ? 30 : 252;
    const points = [];
    let price = Math.floor(Math.random() * 200) + 50;
    const today = new Date();

    for (let i = dataPointsCount; i > 0; i--) {
      const date = new Date(today);
      if (range === '1D') {
        date.setHours(today.getHours() - i);
      } else {
        date.setDate(today.getDate() - i);
      }

      const walk = (Math.random() * 4 - 2) / 100;
      price = price * (1 + walk);

      points.push({
        time: range === '1D' 
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        open: parseFloat((price * 0.995).toFixed(2)),
        high: parseFloat((price * 1.01).toFixed(2)),
        low: parseFloat((price * 0.99).toFixed(2)),
        close: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 20000
      });
    }

    return points;
  }

  async getCompanyProfile(symbol) {
    return {
      symbol: symbol.toUpperCase(),
      companyName: `${symbol.toUpperCase()} Corporation`,
      exchange: 'NASDAQ',
      industry: 'Simulated Services',
      sector: 'Technology',
      ceo: 'John Sim CEO',
      employees: 12500,
      headquarters: 'Silicon Valley, California',
      marketCap: 450000000,
      peRatio: 22.4,
      eps: 4.8,
      dividendYield: 1.5,
      description: `A simulated market security for code verification and sandbox runs of ${symbol.toUpperCase()}.`,
      website: `https://www.mock-${symbol.toLowerCase()}.com`
    };
  }


  async getTopGainers() {
    return [
      { symbol: 'INFY', name: 'Infosys Ltd.', price: 1540.00, changePercent: 4.8 },
      { symbol: 'AAPL', name: 'Apple Inc.', price: 182.50, changePercent: 3.5 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.00, changePercent: 2.9 }
    ];
  }

  async getTopLosers() {
    return [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2390.00, changePercent: -3.2 },
      { symbol: 'NFLX', name: 'Netflix Inc.', price: 415.00, changePercent: -2.8 },
      { symbol: 'KO', name: 'Coca-Cola Company', price: 58.20, changePercent: -1.9 }
    ];
  }

  async getMostActive() {
    return [
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 132.40, volume: 45000000 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 445.00, volume: 32000000 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 328.00, volume: 28000000 }
    ];
  }

  async searchStocks(query) {
    const list = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' }
    ];
    return list.filter(item => 
      item.symbol.toLowerCase().includes(query.toLowerCase()) || 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}
