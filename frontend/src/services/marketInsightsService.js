import api from './api';

export const getMarketOverview = async () => {
  return await api.get('/insights/overview');
};

export const getAiSummary = async () => {
  return await api.get('/insights/ai-summary');
};

export const getMarketSentiment = async () => {
  return await api.get('/insights/sentiment');
};
