import express from 'express';
import { getMarketOverview, getAiSummary, getMarketSentiment } from '../controllers/marketInsightsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', protect, getMarketOverview);
router.get('/ai-summary', protect, getAiSummary);
router.get('/sentiment', protect, getMarketSentiment);

export default router;
