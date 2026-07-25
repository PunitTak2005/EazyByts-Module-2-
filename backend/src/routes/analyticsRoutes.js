import express from 'express';
import {
  getFullAnalytics,
  getPerformance,
  getPortfolioAnalytics,
  getReturns,
  getSectorsAllocation,
  getHistoryCurve,
  generateReport,
  getReportsList
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getFullAnalytics);
router.get('/performance', protect, getPerformance);
router.get('/portfolio', protect, getPortfolioAnalytics);
router.get('/returns', protect, getReturns);
router.get('/sectors', protect, getSectorsAllocation);
router.get('/history', protect, getHistoryCurve);
router.get('/reports', protect, getReportsList);
router.post('/reports/generate', protect, generateReport);

export default router;
