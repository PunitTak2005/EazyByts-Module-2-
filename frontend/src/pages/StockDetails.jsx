import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Trash2, 
  Settings, ChevronRight, Activity, PieChart, Shield, AlertTriangle, TrendingUp, HelpCircle, Check, Info, Sparkles, CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatPercent, formatLargeNumber, formatDecimal, formatNumber, isValidStockData } from '@/utils/formatters';
import { usePortfolioPosition } from '@/hooks/usePortfolioPosition';
import { useTrading } from '@/hooks/useTrading';
import StockTransactionHistory from '@/components/StockTransactionHistory';
import MarketSentiment from '@/components/market/MarketSentiment';
import AnalystRatings from '@/components/market/AnalystRatings';
import PriceHistoryChart from '@/components/dashboard/PriceHistoryChart';

import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';

const fetchStockDetails = async (symbol) => {
  const { data } = await api.get(`/stocks/${symbol}`);
  return data;
};

import { watchlistService } from '@/services/watchlistService';

// removed fetchWatchlists

const StockDetails = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const socket = typeof useSocket === 'function' ? useSocket() : null;
  const { isDark } = useTheme();
  
  if (!socket && import.meta.env.DEV) {
    console.warn("[Socket] Socket unavailable in StockDetails");
  }
  
  const [watchlistSelectedId, setWatchlistSelectedId] = useState('');

  // Simulator Panel States
  const [tradeType, setTradeType] = useState('BUY'); // BUY or SELL
  const [orderType, setOrderType] = useState('MARKET'); // MARKET or LIMIT
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  
  // Modals & Success Animations are now managed by useTrading hook

  // Fetch Stock Details
  const { data: stock, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockDetails(symbol),
    enabled: !!symbol,
    staleTime: 15000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Fetch learning progress to lock/unlock advanced simulator features
  const { data: progressData } = useQuery({
    queryKey: ['learning-progress'],
    queryFn: () => api.get('/learning/progress').then((r) => r.data),
    staleTime: 60000,
  });

  const progress = progressData?.data;
  
  // Check if the user has completed the "Market Orders vs Limit Orders" course
  const hasCompletedLimitOrderCourse = progress?.courses?.some(
    (c) => c.courseId?.title === 'Market Orders vs Limit Orders' && c.isCompleted
  ) || false;

  // Handle Socket Room Subscriptions
  useEffect(() => {
    if (!socket || !symbol) return;

    socket.emit('subscribe_ticker', symbol);

    const handleTick = (livePrices) => {
      if (livePrices[symbol.toUpperCase()]) {
        queryClient.invalidateQueries({ queryKey: ['stock', symbol] });
      }
    };

    socket.on('prices_tick', handleTick);

    return () => {
      socket.emit('unsubscribe_ticker', symbol);
      socket.off('prices_tick', handleTick);
    };
  }, [socket, symbol, queryClient]);

  // Fetch user Watchlists
  const { data: watchlistsRaw, refetch: refetchWatchlists } = useQuery({
    queryKey: ['watchlists'],
    queryFn: watchlistService.getWatchlists,
  });
  
  const watchlists = watchlistsRaw ?? [];

  // Use Custom Hooks for Trading & Position Management
  const {
    ownedQuantity,
    averageBuyPrice,
    investedAmount,
    currentValue,
    availableCash,
    isPortfolioLoading
  } = usePortfolioPosition(symbol);

  const {
    isTrading,
    showConfirmModal,
    setShowConfirmModal,
    showSuccessAnim,
    setShowSuccessAnim,
    lastExecutedTx,
    initiateTrade,
    executeTrade: finalizeTrade
  } = useTrading();


  // Automatically assign default limit price on stock load
  useEffect(() => {
    if (stock && stock.price) {
      setLimitPrice((stock.price * 0.98).toFixed(2));
    }
  }, [stock]);

  // Fetch user alerts
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alerts');
      return data;
    }
  });

  const [alertType, setAlertType] = useState('ABOVE');
  const [alertTargetPrice, setAlertTargetPrice] = useState('');

  // Automatically assign default alert price on stock load
  useEffect(() => {
    if (stock && stock.price) {
      setAlertTargetPrice(stock.price.toFixed(2));
    }
  }, [stock]);

  // Escape key listener for modal closing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowConfirmModal(false);
      }
    };
    if (showConfirmModal) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmModal]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-20 rounded-2xl bg-white dark:bg-dark-card" />
        <div className="space-y-8">
          <div className="h-96 rounded-2xl bg-white dark:bg-dark-card" />
          <div className="h-96 rounded-2xl bg-white dark:bg-dark-card" />
        </div>
      </div>
    );
  }

  if (error || !stock || !isValidStockData(stock)) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 p-8 text-center text-rose-500 dark:border-rose-950/20 dark:bg-rose-950/5">
        <h3 className="font-bold">Invalid Stock Data Received</h3>
        <p className="text-sm mt-1">Ticker {symbol} could not be displayed due to invalid stock metrics.</p>
        <button onClick={() => navigate('/stocks')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">
          Back to Explorer
        </button>
      </div>
    );
  }

  // Stock calculations
  const priceDiff = stock.change || 0;
  const changePercent = stock.changePercent || 0;
  const isPositive = priceDiff >= 0;

  // Trade Panel math
  const orderPrice = orderType === 'LIMIT' ? parseFloat(limitPrice) || 0 : (stock.price || 0);
  const subtotal = quantity * orderPrice;
  const transactionFees = subtotal * 0.001; // 0.1% commission
  const grandTotal = tradeType === 'BUY' ? subtotal + transactionFees : subtotal - transactionFees;

  // Watchlist Toggle actions
  const handleAddToWatchlist = async () => {
    if (!watchlistSelectedId) {
      toast.error('Please select a watchlist first');
      return;
    }
    try {
      await watchlistService.addStockToWatchlist(watchlistSelectedId, stock.symbol);
      toast.success(`Added ${stock.symbol} to watchlist`);
      refetchWatchlists();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    }
  };

  // Alert actions
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!alertTargetPrice || parseFloat(alertTargetPrice) <= 0) {
      toast.error('Please enter a valid target price');
      return;
    }
    try {
      await api.post('/alerts', {
        symbol: stock.symbol,
        targetPrice: parseFloat(alertTargetPrice),
        type: alertType
      });
      toast.success(`Price alert created for ${stock.symbol}`);
      refetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create alert');
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await api.delete(`/alerts/${id}`);
      toast.success('Alert cleared');
      refetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete alert');
    }
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    initiateTrade({
      tradeType,
      orderType,
      quantity,
      limitPrice,
      ownedQuantity,
      availableCash,
      grandTotal
    });
  };

  const executeTrade = async () => {
    await finalizeTrade({
      tradeType,
      symbol: stock.symbol,
      quantity,
      orderType,
      limitPrice,
      grandTotal,
      orderPrice,
      refreshUser
    });
  };

  // Mock RSI / MACD indicators based on stock price state
  const mockRSI = Math.floor(40 + (changePercent * 4) + ((stock.price || 0) % 20));
  const rsiClamped = Math.max(10, Math.min(90, mockRSI));
  const rsiCategory = rsiClamped > 70 ? 'Overbought (Sell Alert)' : rsiClamped < 30 ? 'Oversold (Buy Alert)' : 'Neutral (Consolidating)';

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8 relative">
      
      {/* SUCCESS ANIMATION OVERLAY */}
      <AnimatePresence>
        {showSuccessAnim && lastExecutedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="w-full max-w-sm rounded-3xl bg-white p-8 text-center dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl"
            >
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-emerald-100 p-4 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-16 w-16 animate-bounce" />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Trade Processed!</h2>
              <p className="text-xs text-slate-400 mt-1">Simulation ledger updated successfully.</p>

              <div className="bg-slate-50 dark:bg-dark-bg/50 rounded-2xl p-4 my-6 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order:</span>
                  <span className={`font-bold ${lastExecutedTx.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{lastExecutedTx.orderType} {lastExecutedTx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset:</span>
                  <span className="font-bold text-slate-800 dark:text-white">${lastExecutedTx.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{lastExecutedTx.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Execution Price:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(lastExecutedTx.price)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-dark-border pt-2">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-blue-500 uppercase">{lastExecutedTx.status}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowSuccessAnim(false)} 
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-md"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl"
            >
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Confirm Simulated Order</h3>
              <p className="text-xs text-slate-400 mb-6">Are you sure you want to log this virtual trade in the database ledger?</p>

              <div className="space-y-3 border-t border-b border-slate-100 py-4 dark:border-dark-border text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Action</span>
                  <span className={`font-bold ${tradeType === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{orderType} {tradeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security</span>
                  <span className="font-bold text-slate-800 dark:text-white">{stock.companyName} (${stock.symbol})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-bold text-slate-800 dark:text-white">{quantity}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Limit / Market Price</span>
                  <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(orderPrice)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 dark:border-dark-border text-xs">
                  <span className="text-slate-500">Estimated Commission Fees (0.1%)</span>
                  <span className="text-slate-800 dark:text-white font-medium">{formatCurrency(transactionFees)}</span>
                </div>
                <div className="flex justify-between text-base font-black border-t border-slate-100 pt-2 dark:border-dark-border">
                  <span>Grand Total</span>
                  <span className="text-blue-500">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeTrade}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 shadow-md"
                >
                  Confirm Trade
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Ticker Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg shadow-md uppercase">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">{stock.companyName}</h1>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {stock.symbol}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{stock.exchange}</span>
                <span className="text-xs text-slate-400 font-semibold">{stock.sector}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{stock.industry}</p>
            </div>
          </div>

          {/* Price details & Watchlist selector */}
          <div className="flex flex-wrap items-center gap-4 sm:justify-end">
            <div className="text-left sm:text-right">
              <div className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(stock.price)}</div>
              <div className={`flex items-center text-xs font-bold sm:justify-end ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPositive ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
                {formatCurrency(priceDiff)} ({formatPercent(changePercent)})
              </div>
            </div>

            {/* Watchlist dropdown */}
            <div className="flex items-center gap-1.5 border border-slate-200 dark:border-dark-border rounded-xl p-1.5 bg-slate-50/50 dark:bg-dark-bg/20">
              <select
                value={watchlistSelectedId}
                onChange={(e) => setWatchlistSelectedId(e.target.value)}
                className="bg-transparent text-xs text-slate-500 dark:text-slate-400 outline-none border-none cursor-pointer pr-4 font-semibold"
              >
                <option value="">Select Watchlist...</option>
                {watchlists?.map(wl => (
                  <option key={wl._id} value={wl._id}>{wl.name}</option>
                ))}
              </select>
              <button 
                onClick={handleAddToWatchlist}
                className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-500 shadow-sm"
                title="Add to Watchlist"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            
            {/* Refresh Quote */}
            <button
              onClick={async () => {
                await refetch();
                toast.success('Quote refreshed');
              }}
              disabled={isRefetching}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 dark:border-dark-border dark:bg-dark-bg/20 dark:hover:text-slate-300 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Quote"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main details content */}
      <div className="space-y-8">
        
        {/* Interactive Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-6">
          
          {/* Decoupled Price History Chart */}
          <PriceHistoryChart symbol={stock.symbol} isPositive={isPositive} />

          {/* Price Statistics Grid */}
          <div className="border-t border-slate-100 pt-6 dark:border-dark-border">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Key Statistics</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="text-slate-400 font-medium">Market Cap</div>
                <div className="font-bold text-slate-800 dark:text-white">{formatLargeNumber(stock.marketCap)}</div>
              </div>
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="text-slate-400 font-medium">Volume</div>
                <div className="font-bold text-slate-800 dark:text-white">{formatNumber(stock.volume)}</div>
              </div>
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="text-slate-400 font-medium">PE Ratio</div>
                <div className="font-bold text-slate-800 dark:text-white">{formatDecimal(stock.peRatio)}</div>
              </div>
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="text-slate-400 font-medium">EPS</div>
                <div className="font-bold text-slate-800 dark:text-white">{formatCurrency(stock.eps)}</div>
              </div>
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800 sm:border-none">
                <div className="text-slate-400 font-medium">Div Yield</div>
                <div className="font-bold text-slate-800 dark:text-white">{formatPercent(stock.dividendYield ? stock.dividendYield * 100 : null)}</div>
              </div>
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800 sm:border-none">
                <div className="text-slate-400 font-medium">Open Price</div>
                <div className="font-bold text-slate-800 dark:text-white">{formatCurrency(stock.open)}</div>
              </div>
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800 sm:border-none">
                <div className="text-slate-400 font-medium">52W High</div>
                <div className="font-bold text-emerald-500">{formatCurrency(stock.yearHigh)}</div>
              </div>
              <div className="border-b border-slate-100 pb-2 dark:border-slate-800 sm:border-none">
                <div className="text-slate-400 font-medium">52W Low</div>
                <div className="font-bold text-rose-500">{formatCurrency(stock.yearLow)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Simulation Desk Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">Trading Simulator Desk</h2>

            {/* Live Portfolio Summary */}
            <div className="bg-slate-50 dark:bg-dark-bg/30 rounded-xl p-4 mb-5 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Cash Balance</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{isPortfolioLoading ? '...' : formatCurrency(availableCash)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Buying Power</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{isPortfolioLoading ? '...' : formatCurrency(availableCash)}</span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-dark-border w-full"></div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Owned Shares</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{isPortfolioLoading ? '...' : formatNumber(ownedQuantity)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Average Buy Price</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{isPortfolioLoading ? '...' : (ownedQuantity > 0 ? formatCurrency(averageBuyPrice) : '--')}</span>
              </div>
            </div>

            {/* Toggle Buy / Sell */}
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-dark-bg mb-5">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  tradeType === 'BUY' 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                BUY ASSET
              </button>
              <button
                type="button"
                onClick={() => {
                  setTradeType('SELL');
                }}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  tradeType === 'SELL' 
                    ? 'bg-rose-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                SELL ASSET
              </button>
            </div>

            {/* Toggle Order Type (Market vs Limit) */}
            <div className="flex rounded-lg bg-slate-50 border border-slate-100 p-0.5 dark:bg-dark-bg/40 dark:border-dark-border mb-5">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`flex-1 rounded-md py-1.5 text-[10px] font-bold tracking-wider transition-all ${
                  orderType === 'MARKET'
                    ? 'bg-white text-slate-800 dark:bg-dark-card dark:text-white shadow-sm' 
                    : 'text-slate-400'
                }`}
              >
                MARKET ORDER
              </button>
              
              <div className="flex-1 relative group">
                <button
                  type="button"
                  disabled={!hasCompletedLimitOrderCourse}
                  onClick={() => setOrderType('LIMIT')}
                  className={`w-full rounded-md py-1.5 text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    orderType === 'LIMIT'
                      ? 'bg-white text-slate-800 dark:bg-dark-card dark:text-white shadow-sm' 
                      : 'text-slate-400'
                  } ${!hasCompletedLimitOrderCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  LIMIT ORDER
                  {!hasCompletedLimitOrderCourse && <Info size={12} className="text-slate-400" />}
                </button>
                
                {/* Lock Tooltip */}
                {!hasCompletedLimitOrderCourse && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl bg-slate-800 text-white text-[10px] p-2 text-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block">
                    Complete the "Market Orders vs Limit Orders" course in the Learning Center to unlock Limit Orders.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              
              {/* Limit Price Input */}
              {orderType === 'LIMIT' && (
                <div className="space-y-1">
                  <label htmlFor="limit-price-input" className="text-[10px] font-bold text-slate-400 uppercase">Limit Trigger Price (INR)</label>
                  <input
                    id="limit-price-input"
                    type="number"
                    step="0.01"
                    placeholder="Enter trigger price"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-blue-500"
                  />
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-1">
                <label htmlFor="shares-qty-input" className="text-[10px] font-bold text-slate-400 uppercase">Shares Quantity</label>
                <div className="flex items-center">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="h-12 w-12 flex items-center justify-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-border dark:bg-dark-bg"
                    aria-label="Decrease Quantity"
                  >
                    -
                  </button>
                  <input
                    id="shares-qty-input"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      let val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, val));
                    }}
                    className="w-full h-12 border border-slate-200 bg-white text-center text-sm outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-border dark:bg-dark-bg"
                    aria-label="Increase Quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Order Calculations preview */}
              <div className="bg-slate-50 dark:bg-dark-bg/30 rounded-xl p-4 text-xs space-y-2 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Price:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Simulator Fee (0.1%):</span>
                  <span>{formatCurrency(transactionFees)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-black">
                  <span className="text-slate-600 dark:text-slate-300">Grand Total:</span>
                  <span className="text-blue-500">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isPortfolioLoading ||
                  isTrading ||
                  quantity <= 0 ||
                  (tradeType === 'BUY' && grandTotal > availableCash) ||
                  (tradeType === 'SELL' && (ownedQuantity === 0 || quantity > ownedQuantity))
                }
                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                  tradeType === 'BUY' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10' 
                    : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                }`}
              >
                {isPortfolioLoading || isTrading
                  ? 'PROCESSING...'
                  : quantity <= 0
                  ? 'ENTER VALID QUANTITY'
                  : tradeType === 'BUY' && grandTotal > availableCash
                  ? 'INSUFFICIENT BALANCE'
                  : tradeType === 'SELL' && (ownedQuantity === 0 || quantity > ownedQuantity)
                  ? 'YOU DONT OWN ENOUGH SHARES'
                  : `PLACE SIMULATION ${tradeType}`}
              </button>

            </form>
          </div>

          {/* Price Alerts Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              🔔 Stock Price Alerts
            </h3>
            <p className="text-[11px] text-slate-400">Get notified immediately via live browser banners when prices cross your threshold.</p>

            <form onSubmit={handleCreateAlert} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlertType('ABOVE')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    alertType === 'ABOVE'
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-dark-card dark:text-slate-400 dark:border-dark-border'
                  }`}
                >
                  GOES ABOVE
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType('BELOW')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    alertType === 'BELOW'
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-dark-card dark:text-slate-400 dark:border-dark-border'
                  }`}
                >
                  GOES BELOW
                </button>
              </div>

              <div className="space-y-1">
                <label htmlFor="alert-price-input" className="text-[9px] font-bold text-slate-400 uppercase">Target Price (₹)</label>
                <input
                  id="alert-price-input"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 195.50"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-[0.99] transition-all"
              >
                Set Alert Threshold
              </button>
            </form>

            {/* Active alerts list for this symbol */}
            {alerts && alerts.filter(a => a.symbol === stock.symbol && a.isActive).length > 0 && (
              <div className="border-t border-slate-100 pt-4 dark:border-dark-border space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Alerts ({alerts.filter(a => a.symbol === stock.symbol && a.isActive).length})</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {alerts
                    .filter(a => a.symbol === stock.symbol && a.isActive)
                    .map(a => (
                      <div key={a._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-dark-bg/20 border border-slate-100 dark:border-dark-border text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          If price goes <span className={a.type === 'ABOVE' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{a.type.toLowerCase()}</span> {formatCurrency(a.targetPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAlert(a._id)}
                          className="text-slate-400 hover:text-rose-500"
                          title="Remove alert"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Technical analysis indicators card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Simulated Technicals</h3>
            
            <div className="space-y-4 text-xs font-semibold">
              
              {/* RSI indicator */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Relative Strength Index (RSI 14)</span>
                  <span className="text-blue-500">{mockRSI} ({rsiCategory})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-dark-bg relative overflow-hidden">
                  {/* Oversold range */}
                  <span className="absolute left-0 bottom-0 top-0 w-[30%] bg-emerald-100 dark:bg-emerald-950/20" />
                  {/* Overbought range */}
                  <span className="absolute right-0 bottom-0 top-0 w-[30%] bg-rose-100 dark:bg-rose-950/20" />
                  
                  {/* Slider indicator dot */}
                  <span 
                    className="absolute h-3 w-3 rounded-full bg-blue-500 border border-white dark:border-dark-card -top-0.5" 
                    style={{ left: `${rsiClamped}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                  <span>30 OVERSOLD</span>
                  <span>70 OVERBOUGHT</span>
                </div>
              </div>

              {/* Support & Resistance tags */}
              <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-dark-border">
                <div>
                  <div className="text-slate-400 text-[10px]">Pivot Support (S1)</div>
                  <div className="font-bold text-emerald-500 text-sm mt-0.5">{formatCurrency((stock.dayLow || stock.price) * 0.985)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">Pivot Resistance (R1)</div>
                  <div className="font-bold text-rose-500 text-sm mt-0.5">{formatCurrency((stock.dayHigh || stock.price) * 1.015)}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Description and News */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Description */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Company Profile</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {stock.description || "No company description available."}
          </p>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-dark-bg/20 text-slate-400 flex items-start gap-2.5 text-xs">
            <Info className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Live Yahoo Finance Integration</span>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Market data is provided directly from Yahoo Finance in real-time. Chart functionality requires sufficient historical market data to render effectively.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 space-y-6">
          <AnalystRatings ratings={stock.analystRatings} />
          <MarketSentiment 
            score={stock.sentiment?.score || 50} 
            label={stock.sentiment?.label || 'Neutral'} 
          />
        </div>

      </div>

      {/* Stock Transaction History */}
      <StockTransactionHistory symbol={stock.symbol} currentPrice={stock.currentPrice || stock.price} />
    </div>
  );
};

export default StockDetails;
