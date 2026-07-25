import yahooFinanceService from '../services/yahooFinanceService.js';

export const getHeadlines = async (req, res) => {
  try {
    const headlines = await yahooFinanceService.getLiveHeadlines();
    if (!headlines || headlines.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'Unable to load market headlines',
        data: []
      });
    }
    return res.status(200).json(headlines);
  } catch (error) {
    console.error('[NewsController] Error fetching headlines:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to load market headlines',
      error: error.message
    });
  }
};
