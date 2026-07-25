import Holding from '../models/Holding.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';

export const getAllocationData = async (req, res, next) => {
  try {
    const holdings = await Holding.find({ userId: req.user._id }).lean();
    const symbols = holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } }).select('symbol sector').lean();

    const allocation = {};
    let totalValue = 0;

    for (const h of holdings) {
      const s = stocks.find(st => st.symbol === h.symbol);
      const sector = s ? s.sector : 'Other';
      const val = h.quantity * h.currentPrice;
      totalValue += val;
      allocation[sector] = (allocation[sector] || 0) + val;
    }

    const data = Object.keys(allocation).map(key => ({
      name: key,
      value: parseFloat(allocation[key].toFixed(2)),
      percentage: totalValue > 0 ? parseFloat(((allocation[key] / totalValue) * 100).toFixed(2)) : 0
    })).sort((a, b) => b.value - a.value);

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

export const getPortfolioGrowth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const holdings = await Holding.find({ userId: req.user._id }).lean();
    const symbols = holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } }).lean();

    // Map net worth over 1 month interval
    const baselineStock = stocks[0];
    const baselineHistory = (baselineStock && baselineStock.history && baselineStock.history['1M']) || [];

    const curve = baselineHistory.map((pt, idx) => {
      let holdingsVal = 0;
      stocks.forEach(s => {
        const h = holdings.find(hold => hold.symbol === s.symbol);
        if (h) {
          const sHistory = s.history['1M'] || [];
          const ratio = sHistory.length / baselineHistory.length;
          const targetIdx = Math.min(sHistory.length - 1, Math.round(idx * ratio));
          const histVal = sHistory[targetIdx] ? sHistory[targetIdx].price : s.currentPrice;
          holdingsVal += h.quantity * histVal;
        }
      });

      return {
        date: pt.time,
        value: parseFloat((user.balance + holdingsVal).toFixed(2))
      };
    });

    // If user has no holdings, return flat cash balance line
    if (curve.length === 0) {
      const dates = ['1 Wk Ago', '5 Days Ago', '3 Days Ago', 'Yesterday', 'Today'];
      dates.forEach(d => {
        curve.push({
          date: d,
          value: user.balance
        });
      });
    }

    res.status(200).json({
      success: true,
      data: curve
    });
  } catch (err) {
    next(err);
  }
};
