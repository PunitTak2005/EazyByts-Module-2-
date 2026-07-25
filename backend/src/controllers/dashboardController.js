import DashboardService from '../services/DashboardService.js';
import { sendSuccess } from './authController.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await DashboardService.getDashboardSummary(req.user._id);
    return sendSuccess(res, 'Dashboard overview summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};
