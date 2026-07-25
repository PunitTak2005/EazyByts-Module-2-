import express from 'express';
import {
  getMarketOverview,
  getGainers,
  getLosers,
  getMostActive,
  getMarketNews
} from '../controllers/marketController.js';

const router = express.Router();

router.get('/overview', getMarketOverview);
router.get('/gainers', getGainers);
router.get('/losers', getLosers);
router.get('/most-active', getMostActive);
router.get('/news', getMarketNews);

export default router;
