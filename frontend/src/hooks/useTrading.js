import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { validateOrder } from '@/utils/tradeValidation';

/**
 * Hook to execute and manage trading operations.
 * 
 * @returns {Object} Methods and states for trading execution.
 */
export const useTrading = () => {
  const queryClient = useQueryClient();
  const [isTrading, setIsTrading] = useState(false);
  
  // Modals & Success Animations states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [lastExecutedTx, setLastExecutedTx] = useState(null);

  /**
   * Pre-validates the order and opens the confirmation modal if valid.
   */
  const initiateTrade = ({
    tradeType,
    orderType,
    quantity,
    limitPrice,
    ownedQuantity,
    availableCash,
    grandTotal
  }) => {
    const validation = validateOrder({
      tradeType,
      orderType,
      quantity,
      limitPrice,
      ownedQuantity,
      availableCash,
      grandTotal
    });

    if (!validation.isValid) {
      toast.error(validation.message);
      return false;
    }

    setShowConfirmModal(true);
    return true;
  };

  /**
   * Executes the API call to complete the trade.
   */
  const executeTrade = async ({
    tradeType,
    symbol,
    quantity,
    orderType,
    limitPrice,
    grandTotal,
    orderPrice,
    refreshUser
  }) => {
    setShowConfirmModal(false);
    setIsTrading(true);
    
    try {
      const endpoint = tradeType === 'BUY' ? '/portfolio/buy' : '/portfolio/sell';
      const cleanSymbol = symbol ? String(symbol).trim().toUpperCase() : '';
      const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
      const cleanOrderType = (orderType || 'MARKET').toUpperCase();
      const parsedLimitPrice = cleanOrderType === 'LIMIT' ? parseFloat(limitPrice) : null;

      const body = {
        symbol: cleanSymbol,
        quantity: parsedQty,
        orderType: cleanOrderType,
        limitPrice: parsedLimitPrice
      };

      // Optimistic UI Update for Recent Trades
      const optimisticTrade = {
        id: `opt_${Date.now()}`,
        symbol: cleanSymbol,
        companyName: '...', 
        type: tradeType,
        orderType: cleanOrderType,
        quantity: parsedQty,
        price: cleanOrderType === 'LIMIT' ? parsedLimitPrice : orderPrice,
        total: grandTotal,
        fee: grandTotal - (parsedQty * (cleanOrderType === 'LIMIT' ? parsedLimitPrice : orderPrice)),
        status: cleanOrderType === 'LIMIT' ? 'PENDING' : 'COMPLETED',
        createdAt: new Date().toISOString()
      };

      // Snapshot the previous value
      const previousTrades = queryClient.getQueryData(['recentTrades']);

      // Optimistically update to the new value
      queryClient.setQueryData(['recentTrades'], old => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticTrade, ...(old.data || [])].slice(0, 10)
        };
      });

      try {
        const { data } = await api.post(endpoint, body);
        setLastExecutedTx(data.transaction || { symbol: cleanSymbol, quantity: parsedQty, price: orderPrice, totalAmount: grandTotal, orderType: cleanOrderType });
        
        // Success triggers animation
        setShowSuccessAnim(true);
        
        // Invalidate queries to trigger global UI re-renders with confirmed server data
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['portfolioDetails'] });
        queryClient.invalidateQueries({ queryKey: ['portfolioHistory'] });
        queryClient.invalidateQueries({ queryKey: ['recentTrades'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['analytics-full'] });
        queryClient.invalidateQueries({ queryKey: ['assetAllocation'] });
        queryClient.invalidateQueries({ queryKey: ['mostActiveStocks'] });
        
        if (refreshUser) refreshUser();
        
        setTimeout(() => {
          setShowSuccessAnim(false);
        }, 3500);

        return true;
      } catch (err) {
        // Rollback optimistic update
        queryClient.setQueryData(['recentTrades'], previousTrades);
        const serverErrors = err.response?.data?.errors;
        const msg = (Array.isArray(serverErrors) && serverErrors.length > 0)
          ? serverErrors.join(', ')
          : (err.response?.data?.message || 'Transaction failed');
        toast.error(msg);
        return false;
      } finally {
        setIsTrading(false);
      }
    } catch (err) {
      toast.error('Unexpected error occurred');
      setIsTrading(false);
      return false;
    }
  };

  return {
    isTrading,
    showConfirmModal,
    setShowConfirmModal,
    showSuccessAnim,
    setShowSuccessAnim,
    lastExecutedTx,
    initiateTrade,
    executeTrade
  };
};
