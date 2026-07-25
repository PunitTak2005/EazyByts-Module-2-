import MarketInsightsService from '../services/MarketInsightsService.js';
import { sendSuccess } from './authController.js';

export const getMarketOverview = async (req, res, next) => {
  try {
    const overview = await MarketInsightsService.getMarketOverview();
    return sendSuccess(res, 'Market overview retrieved successfully', overview);
  } catch (error) {
    next(error);
  }
};

export const getAiSummary = async (req, res, next) => {
  try {
    const summary = await MarketInsightsService.getAiMarketSummary();
    return sendSuccess(res, 'AI Market Summary generated successfully', { summary });
  } catch (error) {
    next(error);
  }
};

export const getMarketSentiment = async (req, res, next) => {
  try {
    const sentiment = await MarketInsightsService.getMarketSentiment();
    return sendSuccess(res, 'Market Sentiment retrieved successfully', sentiment);
  } catch (error) {
    next(error);
  }
};
