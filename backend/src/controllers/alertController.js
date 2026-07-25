import Alert from '../models/Alert.js';
import Stock from '../models/Stock.js';

export const createAlert = async (req, res, next) => {
  try {
    const { symbol, targetPrice, type } = req.body;

    if (!symbol || !targetPrice || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symbol, target price, and trigger type.'
      });
    }

    if (!['ABOVE', 'BELOW'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trigger type. Must be ABOVE or BELOW.'
      });
    }

    // Verify stock exists in DB
    const stockExists = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stockExists) {
      return res.status(404).json({
        success: false,
        message: `Ticker symbol ${symbol} not found`
      });
    }

    const alert = await Alert.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      type: type.toUpperCase()
    });

    res.status(201).json({
      success: true,
      message: `Alert set for ${symbol} crossing ${type} ₹${targetPrice}`,
      data: alert
    });
  } catch (err) {
    next(err);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert cleared successfully'
    });
  } catch (err) {
    next(err);
  }
};
