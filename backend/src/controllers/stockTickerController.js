import yahooFinanceService from '../services/yahooFinanceService.js';

/**
 * @route   GET /api/stocks/ticker
 * @desc    Get live stock ticker data from Yahoo Finance
 * @access  Public
 */
export const getTickerData = async (req, res) => {
  try {
    const data = await yahooFinanceService.getLiveTickerData();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getTickerData:', error);
    res.status(500).json({ message: 'Server error fetching ticker data' });
  }
};


