import api from './api';

const stockService = {
  /**
   * Fetches historical price data for a given stock symbol.
   * @param {string} symbol - Stock ticker symbol (e.g., AAPL)
   * @param {string} range - Timeframe range (e.g., 1d, 1mo, 1y)
   * @param {string} interval - Data interval (e.g., 5m, 1d, 1wk)
   * @returns {Promise<Array>} Array of normalized historical data points
   */
  getHistoricalData: async (symbol, range = '1mo', interval = '1d') => {
    try {
      const response = await api.get(`/stocks/${symbol}/history`, {
        params: { range, interval }
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch historical data');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', {
        url: `/stocks/${symbol}/history?range=${range}&interval=${interval}`,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  /**
   * Fetches all available stocks for client-side exploring.
   * Uses a high limit to pull all records from the backend.
   * @returns {Promise<Array>} Array of stock objects
   */
  getAllStocks: async () => {
    try {
      const response = await api.get('/stocks', {
        params: { limit: 1000, page: 1 } // Pull up to 1000 to ensure we have all
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch all stocks');
      }
      const stocks = response.data?.stocks || [];
      console.log('Frontend Received Data:', stocks);
      return stocks;
    } catch (error) {
      console.error('Error fetching all stocks:', error.message);
      throw error;
    }
  }
};

export default stockService;
