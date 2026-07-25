import TradeService from '../services/TradeService.js';
import { sendSuccess } from './authController.js';

export const buyTrade = async (req, res, next) => {
  console.log("Buy Request:", req.body);
  const { symbol, quantity, orderType, limitPrice } = req.body;
  try {
    const trade = await TradeService.placeBuyOrder(req.user._id, symbol, quantity, orderType, limitPrice);
    return sendSuccess(res, 'Simulated Buy trade logged', trade, 201);
  } catch (error) {
    next(error);
  }
};

export const sellTrade = async (req, res, next) => {
  const { symbol, quantity, orderType, limitPrice } = req.body;
  try {
    const trade = await TradeService.placeSellOrder(req.user._id, symbol, quantity, orderType, limitPrice);
    return sendSuccess(res, 'Simulated Sell trade logged', trade, 201);
  } catch (error) {
    next(error);
  }
};

export const cancelTrade = async (req, res, next) => {
  try {
    const trade = await TradeService.cancelOrder(req.user._id, req.params.id);
    return sendSuccess(res, 'Order cancelled successfully', trade, 200);
  } catch (error) {
    next(error);
  }
};

export const listTrades = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const search = req.query.search || '';
  const action = req.query.action || req.query.type || 'ALL';
  const status = req.query.status || 'ALL';
  const sortBy = req.query.sortBy || 'newest';

  try {
    const result = await TradeService.getTrades(req.user._id, page, limit, search, action, status, sortBy);
    return sendSuccess(res, 'Trades transaction history fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getRecentTrades = async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  // sort is implied as 'latest'

  try {
    const result = await TradeService.getRecentTrades(req.user._id, limit, page);
    // Return raw result to match the exact JSON structure requested:
    // { success: true, lastUpdated: ..., total: ..., data: ... }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTradeDetail = async (req, res, next) => {
  try {
    const trade = await TradeService.getTradeById(req.user._id, req.params.id);
    return sendSuccess(res, 'Trade transaction details fetched', trade);
  } catch (error) {
    next(error);
  }
};
