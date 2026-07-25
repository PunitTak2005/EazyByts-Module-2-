import api from '@/services/api.js';
import { normalizeObject, normalizeArray } from '@/services/apiNormalizer.js';
import { handleApiError } from '@/services/errorHandler.js';

export const dashboardService = {
  getDashboardData: async () => {
    const defaultData = {
      summary: {
        todayGain: 0,
        todayGainPercent: 0,
        totalInvestment: 0,
        currentValue: 0,
        availableCash: 0,
        cashBalance: 0,
        netWorth: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0
      },
      recentTrades: [],
      topGainers: [],
      topLosers: [],
      performanceCurve: []
    };

    try {
      const response = await api.get('/dashboard');
      const normalized = normalizeObject(response, defaultData);
      
      // Explicitly normalize internal summary object to guarantee all keys exist
      const rawSummary = normalized.summary || {};
      normalized.summary = {
        todayGain: rawSummary.todayGain ?? 0,
        todayGainPercent: rawSummary.todayGainPercent ?? 0,
        totalInvestment: rawSummary.totalInvestment ?? 0,
        currentValue: rawSummary.currentValue ?? rawSummary.totalValue ?? 0,
        availableCash: rawSummary.availableCash ?? rawSummary.cashBalance ?? 0,
        cashBalance: rawSummary.cashBalance ?? rawSummary.availableCash ?? 0,
        netWorth: rawSummary.netWorth ?? 0,
        totalProfitLoss: rawSummary.totalProfitLoss ?? rawSummary.totalProfit ?? 0,
        totalProfitLossPercent: rawSummary.totalProfitLossPercent ?? rawSummary.totalProfitPercent ?? 0
      };

      // Normalize arrays to ensure they have stable React keys
      normalized.recentTrades = normalizeArray(normalized.recentTrades);
      normalized.topGainers = normalizeArray(normalized.topGainers);
      normalized.topLosers = normalizeArray(normalized.topLosers);
      normalized.performanceCurve = normalizeArray(normalized.performanceCurve);
      
      return normalized;
    } catch (error) {
      handleApiError(error, 'Dashboard overview statistics are temporarily unavailable.');
      return defaultData;
    }
  },

  getLayout: async () => {
    try {
      const response = await api.get('/widgets/layout');
      if (response && response.data && Array.isArray(response.data.widgets)) {
        return response.data.widgets;
      }
      return [];
    } catch (error) {
      handleApiError(error, 'Failed to fetch layout configuration.');
      return [];
    }
  },

  saveLayout: async (widgets) => {
    try {
      const response = await api.post('/widgets/layout', { widgets });
      return response;
    } catch (error) {
      handleApiError(error, 'Failed to save layout preferences.');
      throw error;
    }
  }
};
