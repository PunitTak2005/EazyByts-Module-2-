import FinnhubProvider from './FinnhubProvider.js';
import MockProvider from './MockProvider.js';
import YahooFinanceProvider from './YahooFinanceProvider.js';

export default class ProviderFactory {
  /**
   * Return the active provider based on environment keys.
   * Falls back gracefully to MockProvider if no credentials exist.
   * @returns {BaseProvider}
   */
  static getProvider() {
    const providerName = (process.env.STOCK_DATA_PROVIDER || 'mock').toLowerCase();

    if (providerName === 'finnhub' && process.env.FINNHUB_API_KEY) {
      return new FinnhubProvider(process.env.FINNHUB_API_KEY);
    }

    if (providerName === 'mock') {
      return new MockProvider();
    }

    // Default Fallback
    return new YahooFinanceProvider();
  }
}
