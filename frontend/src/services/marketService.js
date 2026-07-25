import api from './api';

const marketService = {
  /**
   * Fetches the most active stocks from the live market data endpoint.
   * @param {number} limit Number of top active stocks to retrieve
   * @returns {Promise<Object>} Contains success, lastUpdated, count, and data array
   */
  getMostActiveStocks: async (limit = 10) => {
    try {
      const response = await api.get(`/stocks/movers/active?limit=${limit}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch most active stocks');
      }
      return response;
    } catch (error) {
      console.error('Error fetching most active stocks:', {
        url: `/stocks/movers/active?limit=${limit}`,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  /**
   * Fetches categorized stocks by market cap (Large, Mid, Small).
   * @returns {Promise<Object>} Contains success, largeCap, midCap, smallCap
   */
  getStockCategories: async () => {
    try {
      const response = await api.get('/stocks/categories');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch stock categories');
      }
      return response;
    } catch (error) {
      console.error('Error fetching stock categories:', {
        url: '/stocks/categories',
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
};

export default marketService;
