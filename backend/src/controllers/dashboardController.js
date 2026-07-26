import DashboardService from '../services/DashboardService.js';
import { sendSuccess } from './authController.js';

export const getDashboard = async (req, res, next) => {
  const reqStart = Date.now();
  try {
    const userId = req.user._id;
    console.log(`[Dashboard Controller] GET /dashboard request received for user ${userId} at ${new Date().toISOString()}`);

    const data = await DashboardService.getDashboardSummary(userId);
    const duration = Date.now() - reqStart;

    console.log(`[Dashboard Controller] GET /dashboard response prepared in ${duration}ms for user ${userId}`);
    return sendSuccess(res, 'Dashboard overview summary retrieved successfully', data);
  } catch (error) {
    console.error(`[Dashboard Controller Error] GET /dashboard failed after ${Date.now() - reqStart}ms:`, error.message);
    next(error);
  }
};
