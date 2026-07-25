import express from 'express';
import { getPortfolio, getPortfolioHistory, getPortfolioHistoryBySymbol, buyStock, sellStock, updatePortfolio, deleteHolding } from '../controllers/portfolioController.js';
import { protect } from '../middleware/authMiddleware.js';
import { placeOrderValidator } from '../validators/validators.js';

const router = express.Router();

router.get('/', protect, getPortfolio);
router.get('/history', protect, getPortfolioHistory);
router.get('/:symbol/history', protect, getPortfolioHistoryBySymbol);
router.post('/buy', protect, placeOrderValidator, buyStock);
router.post('/sell', protect, placeOrderValidator, sellStock);
router.put('/update', protect, updatePortfolio);
router.delete('/:holdingId', protect, deleteHolding);

export default router;
