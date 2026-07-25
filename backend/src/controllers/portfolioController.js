import PortfolioService from '../services/PortfolioService.js';
import PortfolioHistoryService from '../services/PortfolioHistoryService.js';
import TradeService from '../services/TradeService.js';
import { sendSuccess } from './authController.js';

export const getPortfolio = async (req, res, next) => {
  try {
    const details = await PortfolioService.getPortfolioDetails(req.user._id);
    return sendSuccess(res, 'Portfolio details retrieved successfully', details);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHistory = async (req, res, next) => {
  try {
    const range = req.query.range || '1M';
    const history = await PortfolioHistoryService.getPortfolioHistory(req.user._id, range);
    return sendSuccess(res, 'Portfolio net worth history retrieved successfully', history);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHistoryBySymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const action = req.query.action || 'ALL';
    const sort = req.query.sort || 'NEWEST';
    const search = req.query.search || '';

    const history = await PortfolioService.getPortfolioHistoryBySymbol(
      req.user._id, 
      symbol, 
      page, 
      limit, 
      action, 
      sort, 
      search
    );
    return sendSuccess(res, 'Portfolio history retrieved successfully', history);
  } catch (error) {
    next(error);
  }
};

export const buyStock = async (req, res, next) => {
  console.log("Request Body:", req.body);
  console.log("User Balance:", req.user?.balance);
  const { symbol, quantity, orderType, limitPrice } = req.body;
  try {
    const trade = await TradeService.placeBuyOrder(req.user._id, symbol, quantity, orderType, limitPrice);
    return sendSuccess(res, 'Buy order processed', trade);
  } catch (error) {
    next(error);
  }
};

export const sellStock = async (req, res, next) => {
  const { symbol, quantity, orderType, limitPrice } = req.body;
  try {
    const trade = await TradeService.placeSellOrder(req.user._id, symbol, quantity, orderType, limitPrice);
    return sendSuccess(res, 'Sell order processed', trade);
  } catch (error) {
    next(error);
  }
};

export const updatePortfolio = async (req, res, next) => {
  try {
    // Refresh calculations
    const details = await PortfolioService.getPortfolioDetails(req.user._id);
    return sendSuccess(res, 'Portfolio valuations refreshed', details);
  } catch (error) {
    next(error);
  }
};

export const deleteHolding = async (req, res, next) => {
  try {
    const result = await PortfolioService.deleteHoldingPosition(req.user._id, req.params.holdingId);
    return sendSuccess(res, result.message);
  } catch (error) {
    next(error);
  }
};
