import express from 'express';
import { createAlert, getAlerts, deleteAlert } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All alert endpoints require authentication
router.use(protect);

router.get('/', getAlerts);
router.post('/', createAlert);
router.delete('/:id', deleteAlert);

export default router;
