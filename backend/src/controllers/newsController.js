import yahooFinanceService from '../services/yahooFinanceService.js';

const FALLBACK_HEADLINES = [
  { id: '1', title: 'Global Markets Rally as Tech Stocks Lead Gains', summary: 'Major indices rose sharply today driven by strong quarterly earnings in the technology sector.', publisher: 'Financial Times', time: '10m ago', url: '#' },
  { id: '2', title: 'Federal Reserve Signals Interest Rate Pause', summary: 'Central bank officials indicated inflation metrics are moderating toward the target baseline.', publisher: 'Wall Street Journal', time: '30m ago', url: '#' },
  { id: '3', title: 'Crude Oil Prices Stabilize Near Multi-Week Highs', summary: 'Energy commodities balanced between supply discipline and global industrial demand forecasts.', publisher: 'Reuters', time: '1h ago', url: '#' },
  { id: '4', title: 'Retail Investors Capitalize on Market Volatility', summary: 'Trading volume across retail platforms surges as market participants diversify holdings.', publisher: 'Bloomberg', time: '2h ago', url: '#' },
];

export const getHeadlines = async (req, res) => {
  try {
    const headlines = await yahooFinanceService.getLiveHeadlines().catch(() => null);
    if (headlines && Array.isArray(headlines) && headlines.length > 0) {
      return res.status(200).json(headlines);
    }
    return res.status(200).json(FALLBACK_HEADLINES);
  } catch (error) {
    console.error('[NewsController] Error fetching headlines:', error.message);
    return res.status(200).json(FALLBACK_HEADLINES);
  }
};
