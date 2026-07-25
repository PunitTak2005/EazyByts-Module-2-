import express from 'express';
import {
  getStocks,
  getStockBySymbol,
  getTrending,
  getMovers,
  searchStocks,
  getMarketOverview,
  getStockHistory,
  getGainers,
  getLosers,
  getMostActive,
  getMostActiveLive,
  getStockCategories,
  getSectors
} from '../controllers/stockController.js';

const router = express.Router();

router.get('/', getStocks);
router.get('/sectors', getSectors);
router.get('/search', searchStocks);
router.get('/search/autocomplete', searchStocks);
router.get('/trending', getTrending);
router.get('/gainers', getGainers);
router.get('/losers', getLosers);
router.get('/most-active', getMostActive); // Legacy route
router.get('/movers/active', getMostActiveLive); // New live data route
router.get('/categories', getStockCategories);
router.get('/market-overview', getMarketOverview);
router.get('/movers/top', getMovers);
router.get('/:symbol', getStockBySymbol);
router.get('/:symbol/history', getStockHistory);

export default router;
