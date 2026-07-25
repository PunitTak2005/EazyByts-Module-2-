import api from './api';

const DEFAULT_ANALYTICS_RESPONSE = {
  summary: {
    portfolioValue: 0,
    cashBalance: 1000000,
    investedAmount: 0,
    profitLoss: 0,
    profitLossPercent: 0
  },
  stats: {
    winRate: 0,
    lossRate: 0,
    winCount: 0,
    lossCount: 0,
    bestTrade: 0,
    worstTrade: 0
  },
  allocation: [],
  performanceHistory: [],
  transactions: [],
  topPerformers: [],
  worstPerformers: []
};

export const getFullAnalytics = async () => {
  try {
    const response = await api.get('/analytics');
    const data = (response && response.data) ? response.data : ((response && response.summary) ? response : DEFAULT_ANALYTICS_RESPONSE);

    console.log("Transactions:", data.transactions || []);
    console.log("Portfolio:", data.summary || {});
    console.log("Analytics:", data);
    console.log("Calculated Metrics:", data.riskMetrics || {});

    return data;
  } catch (err) {
    console.error('[Analytics] Error fetching analytics:', err);
    throw err;
  }
};
