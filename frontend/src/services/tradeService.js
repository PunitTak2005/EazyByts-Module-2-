import api from './api';

export const getRecentTrades = async ({ limit = 10, page = 1 }) => {
  const response = await api.get('/trades/recent', {
    params: { limit, page }
  });
  return response;
};

export const getTransactionHistory = async ({ page = 1, limit = 12, search = '', type = 'ALL', status = 'ALL', sortBy = 'newest' }) => {
  const response = await api.get('/trades', {
    params: { page, limit, search, action: type, status, sortBy }
  });
  
  const data = response.data || response;
  return {
    success: true,
    transactions: data.trades || [],
    pagination: {
      page,
      limit,
      total: data.total || 0,
      pages: data.pages || 0
    }
  };
};

export const placeBuyOrder = async (symbol, quantity, orderType = 'MARKET', limitPrice = null) => {
  const response = await api.post('/trades/buy', { symbol, quantity, orderType, limitPrice });
  return response;
};

export const placeSellOrder = async (symbol, quantity, orderType = 'MARKET', limitPrice = null) => {
  const response = await api.post('/trades/sell', { symbol, quantity, orderType, limitPrice });
  return response;
};

export const cancelOrder = async (orderId) => {
  const response = await api.patch(`/trades/${orderId}/cancel`);
  return response;
};
