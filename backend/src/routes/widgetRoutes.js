import express from 'express';
import { getLayout, saveLayout } from '../controllers/widgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all widget layout routes
router.use(protect);

router.get('/layout', getLayout);
router.post('/layout', saveLayout);

export default router;
