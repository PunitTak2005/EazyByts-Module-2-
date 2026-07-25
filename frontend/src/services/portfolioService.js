import api from '@/services/api.js';
import { handleApiError } from '@/services/errorHandler.js';

export const portfolioService = {
  getPortfolio: async () => {
    try {
      const response = await api.get('/portfolio');
      return response;
    } catch (error) {
      handleApiError(error, 'Unable to load portfolio details.');
      throw error;
    }
  },

  getPortfolioDetails: async () => {
    try {
      const response = await api.get('/portfolio');
      return response;
    } catch (error) {
      handleApiError(error, 'Unable to load portfolio details.');
      throw error;
    }
  },

  getPortfolioAnalytics: async () => {
    try {
      const response = await api.get('/portfolio');
      return response;
    } catch (error) {
      handleApiError(error, 'Unable to load portfolio details.');
      throw error;
    }
  },

  refreshPortfolio: async () => {
    try {
      const response = await api.put('/portfolio/update');
      return response;
    } catch (error) {
      handleApiError(error, 'Unable to refresh portfolio valuations.');
      throw error;
    }
  },

  getCashBalance: async () => {
    try {
      const response = await api.get('/portfolio');
      return response?.data?.summary?.cashBalance || 0;
    } catch (error) {
      handleApiError(error, 'Unable to fetch cash balance.');
      throw error;
    }
  },

  getPortfolioHistory: async (range = '1M') => {
    try {
      const response = await api.get(`/portfolio/history?range=${range}`);
      return response?.data || [];
    } catch (error) {
      handleApiError(error, 'Unable to load portfolio history.');
      return [];
    }
  }
};
