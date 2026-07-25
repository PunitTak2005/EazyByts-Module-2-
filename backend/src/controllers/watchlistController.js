import WatchlistService from '../services/WatchlistService.js';
import Watchlist from '../models/Watchlist.js';
import { sendSuccess } from './authController.js';

export const getWatchlists = async (req, res, next) => {
  try {
    const lists = await WatchlistService.getWatchlistsSummary(req.user._id);
    return sendSuccess(res, 'Watchlists retrieved successfully', lists);
  } catch (error) {
    next(error);
  }
};

export const createWatchlist = async (req, res, next) => {
  const { name } = req.body;
  try {
    const list = await WatchlistService.create(req.user._id, name);
    return sendSuccess(res, 'Watchlist created successfully', list, 201);
  } catch (error) {
    next(error);
  }
};

export const updateWatchlist = async (req, res, next) => {
  const { name } = req.body;
  try {
    if (!name) {
      const err = new Error('Name is required to rename watchlist');
      err.status = 400;
      throw err;
    }
    const wl = await WatchlistService.getWatchlistsSummary(req.user._id);
    const target = wl.find(w => w._id.toString() === req.params.id);
    if (!target) {
      const err = new Error('Watchlist not found');
      err.status = 404;
      throw err;
    }
    const doc = await Watchlist.findById(req.params.id);
    if (doc) {
      doc.name = name.trim();
      await doc.save();
    }
    return sendSuccess(res, 'Watchlist renamed successfully', doc);
  } catch (error) {
    next(error);
  }
};

export const addStockToWatchlist = async (req, res, next) => {
  const { symbol } = req.body;
  try {
    if (!symbol) {
      const err = new Error('Invalid stock symbol.');
      err.status = 400;
      throw err;
    }
    const result = await WatchlistService.addStock(req.user._id, req.params.id, symbol);
    return sendSuccess(res, 'Stock added successfully.', result);
  } catch (error) {
    if (error.message.includes('not found')) error.status = 404;
    else if (error.message.includes('already')) error.status = 409;
    next(error);
  }
};

export const removeStockFromWatchlist = async (req, res, next) => {
  const { symbol } = req.params;
  try {
    const result = await WatchlistService.removeStock(req.user._id, req.params.id, symbol);
    return sendSuccess(res, 'Stock removed successfully.', result);
  } catch (error) {
    if (error.message.includes('not found')) error.status = 404;
    next(error);
  }
};

export const deleteWatchlist = async (req, res, next) => {
  try {
    const result = await WatchlistService.delete(req.user._id, req.params.id);
    return sendSuccess(res, result.message, { id: result.id });
  } catch (error) {
    next(error);
  }
};
