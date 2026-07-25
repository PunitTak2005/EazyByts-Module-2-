import express from 'express';
import { getWatchlists, createWatchlist, updateWatchlist, deleteWatchlist, addStockToWatchlist, removeStockFromWatchlist } from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createWatchlistValidator } from '../validators/validators.js';

const router = express.Router();

router.get('/', protect, getWatchlists);
router.post('/', protect, createWatchlistValidator, createWatchlist);
router.put('/:id', protect, updateWatchlist);
router.delete('/:id', protect, deleteWatchlist);
router.post('/:id/stocks', protect, addStockToWatchlist);
router.delete('/:id/stocks/:symbol', protect, removeStockFromWatchlist);

export default router;
