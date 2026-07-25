import express from 'express';
import { buyTrade, sellTrade, listTrades, getTradeDetail, getRecentTrades, cancelTrade } from '../controllers/tradeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { placeOrderValidator } from '../validators/validators.js';

const router = express.Router();

router.get('/', protect, listTrades);
router.get('/recent', protect, getRecentTrades);
router.get('/:id', protect, getTradeDetail);
router.patch('/:id/cancel', protect, cancelTrade);
router.post('/buy', protect, placeOrderValidator, buyTrade);
router.post('/sell', protect, placeOrderValidator, sellTrade);

export default router;
