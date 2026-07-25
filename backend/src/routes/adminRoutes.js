import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Trade from '../models/Trade.js';
import { sendSuccess } from '../controllers/authController.js';

const router = express.Router();

router.get('/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalSecurities = await Stock.countDocuments({});
    const totalTransactionsVal = await Trade.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const metrics = {
      users: totalUsers,
      stocks: totalSecurities,
      totalVolumeTraded: totalTransactionsVal.length > 0 ? totalTransactionsVal[0].total : 0
    };
    return sendSuccess(res, 'Platform status loaded successfully', metrics);
  } catch (error) { next(error); }
});

router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const list = await User.find({}).skip(skip).limit(limit).select('-password');
    const total = await User.countDocuments({});
    return sendSuccess(res, 'User list loaded successfully', {
      users: list,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) { next(error); }
});

router.put('/users/:id/toggle', protect, authorize('admin'), async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) throw new Error('User not found');

    if (target._id.toString() === req.user._id.toString()) {
      throw new Error('Self-administrative disabling is not permitted');
    }

    target.isActive = !target.isActive;
    await target.save();
    return sendSuccess(res, `User profile active state toggled to ${target.isActive}`, target);
  } catch (error) { next(error); }
});

export default router;
