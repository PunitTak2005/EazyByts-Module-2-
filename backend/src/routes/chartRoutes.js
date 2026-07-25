import express from 'express';
import { getAllocationData, getPortfolioGrowth } from '../controllers/chartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all charting endpoints
router.use(protect);

router.get('/allocation', getAllocationData);
router.get('/portfolio', getPortfolioGrowth);

export default router;
