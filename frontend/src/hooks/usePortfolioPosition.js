import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

/**
 * Hook to retrieve and compute the user's specific position metrics for a given stock symbol.
 * 
 * @param {string} symbol - The stock symbol to query holdings for.
 * @returns {Object} Extracted position data and loading state.
 */
export const usePortfolioPosition = (symbol) => {
  const { data: portfolio, isLoading, error, refetch } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await api.get('/portfolio');
      return data;
    }
  });

  // Calculate metrics based on the specific symbol
  let ownedQuantity = 0;
  let averageBuyPrice = 0;
  let investedAmount = 0;
  let currentValue = 0;
  let availableCash = 0;

  if (portfolio) {
    availableCash = portfolio.summary?.availableCash || 0;
    
    // Find the holding in the portfolio list
    const holding = portfolio.holdings?.find(
      (h) => h.symbol.toUpperCase() === symbol?.toUpperCase()
    );

    if (holding) {
      ownedQuantity = holding.quantity;
      averageBuyPrice = holding.averagePrice;
      investedAmount = ownedQuantity * averageBuyPrice;
      currentValue = holding.currentValue || (ownedQuantity * holding.currentPrice);
    }
  }

  return {
    ownedQuantity,
    averageBuyPrice,
    investedAmount,
    currentValue,
    availableCash,
    isPortfolioLoading: isLoading,
    portfolioError: error,
    refetchPortfolio: refetch
  };
};
