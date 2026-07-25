import MarketDataService from '../services/MarketDataService.js';

export const getMarketOverview = async (req, res, next) => {
  try {
    const news = await MarketDataService.getMarketNews();
    const gainers = await MarketDataService.getTopGainers();
    const losers = await MarketDataService.getTopLosers();
    const active = await MarketDataService.getMostActive();

    res.status(200).json({
      success: true,
      data: {
        indices: [
          { name: 'NIFTY 50', value: 19850.45, change: 120.30, changePercent: 0.61 },
          { name: 'SENSEX', value: 66230.12, change: 410.25, changePercent: 0.62 },
          { name: 'NASDAQ 100', value: 15450.80, change: -45.10, changePercent: -0.29 }
        ],
        gainers,
        losers,
        active,
        news,
        marketStatus: 'OPEN'
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getGainers = async (req, res, next) => {
  try {
    const data = await MarketDataService.getTopGainers();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getLosers = async (req, res, next) => {
  try {
    const data = await MarketDataService.getTopLosers();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getMostActive = async (req, res, next) => {
  try {
    const data = await MarketDataService.getMostActive();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getMarketNews = async (req, res, next) => {
  try {
    const data = await MarketDataService.getMarketNews();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
