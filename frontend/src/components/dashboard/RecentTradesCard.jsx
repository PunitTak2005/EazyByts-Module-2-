import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRecentTrades } from '@/services/tradeService';
import TradeRow from './TradeRow';
import { useSocket } from '@/context/SocketContext';

const RecentTradesCard = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recentTrades'],
    queryFn: () => getRecentTrades({ limit: 10, page: 1 }),
    refetchInterval: 30000, // auto refresh every 30s
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!socket) return;
    const handleTradeCompleted = () => {
      queryClient.invalidateQueries({ queryKey: ['recentTrades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    };
    socket.on('tradeCompleted', handleTradeCompleted);
    return () => {
      socket.off('tradeCompleted', handleTradeCompleted);
    };
  }, [socket, queryClient]);



  const trades = data?.data || [];
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '';

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Simulation Trades</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your latest mock trading activity</p>
        </div>
        
        <div className="flex flex-col sm:items-end gap-1">
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide pr-1">
              Last updated: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col gap-4 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-1">Unable to load recent trades</h3>
            <p className="text-slate-500 text-sm mb-4">Something went wrong while fetching your history.</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/50">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-lg mb-2">No simulation trades yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
              Start trading to build your portfolio history. Your latest transactions will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold tracking-wider text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Symbol</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentTradesCard;
