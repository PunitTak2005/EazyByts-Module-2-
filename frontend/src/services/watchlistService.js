import api from './api.js';

export const watchlistService = {
  getWatchlists: async () => {
    const response = await api.get('/watchlists');
    // api.js returns the full JSON response, e.g. { success: true, message, data: [...] }
    // We return the actual array. If data is undefined, default to empty array.
    if (response && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  },

  createWatchlist: async (name) => {
    const response = await api.post('/watchlists', { name });
    return response.data;
  },

  deleteWatchlist: async (id) => {
    const response = await api.delete(`/watchlists/${id}`);
    return response.data;
  },

  addStockToWatchlist: async (watchlistId, symbol) => {
    const response = await api.post(`/watchlists/${watchlistId}/stocks`, { symbol });
    return response.data;
  },

  removeStockFromWatchlist: async (watchlistId, symbol) => {
    const response = await api.delete(`/watchlists/${watchlistId}/stocks/${symbol}`);
    return response.data;
  }
};
