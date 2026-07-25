import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, RefreshCw, AlertCircle, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import marketService from '@/services/marketService';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency, formatPercent, formatLargeNumber, isValidStockData } from '@/utils/formatters';

const MostActiveCard = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['mostActiveStocks'],
    queryFn: () => marketService.getMostActiveStocks(5), // Limiting to 5 for dashboard card view
    refetchInterval: 60000, // Refresh every 60 seconds
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    placeholderData: (prev) => prev, // Keep previous successful data while refetching
  });

  // Validation filter
  const validStocks = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return [];
    
    return data.data.filter(stock => {
      const isValidSymbol = typeof stock.symbol === 'string' && stock.symbol.trim() !== '';
      return isValidSymbol && isValidStockData(stock);
    });
  }, [data]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-dark-border/40">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-8 w-8" />
                <div className="space-y-2">
                  <Skeleton variant="text" className="h-4 w-16" />
                  <Skeleton variant="text" className="h-3 w-24" />
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Skeleton variant="text" className="h-4 w-16" />
                <Skeleton variant="text" className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
          <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Failed to load data</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-6">
            {error?.message || "There was an error connecting to the market data service."}
          </p>
          <Link to="/stocks" className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">
            Go to Markets
          </Link>
        </div>
      );
    }

    if (validStocks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
          <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">No active market data available.</p>
          <p className="text-xs text-slate-500">Please try again later.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {validStocks.map((stock) => {
          const isUp = stock.change >= 0;
          const isNeutral = stock.change === 0;
          
          let colorClass = 'text-slate-500';
          let bgClass = 'bg-slate-100 dark:bg-slate-800';
          let Icon = Minus;
          
          if (!isNeutral) {
            colorClass = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
            bgClass = isUp ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30';
            Icon = isUp ? TrendingUp : TrendingDown;
          }

          // Use the first letter of the symbol as a text-based logo if we don't have a real one
          const letterLogo = stock.symbol.charAt(0).toUpperCase();

          return (
            <Link
              key={stock.symbol}
              to={`/stocks/${stock.symbol}`}
              className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 dark:bg-dark-bg/20 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-dark-border/40 transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-lg shadow-inner">
                  {letterLogo}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {stock.symbol}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px] block">
                    {stock.companyName || stock.symbol}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {formatCurrency(stock.price)}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    Vol: {formatLargeNumber(stock.volume)}
                  </span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${bgClass} ${colorClass}`}>
                    <Icon className="h-3 w-3" />
                    {formatPercent(stock.changePercent)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm flex flex-col h-full hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-blue-500" />
          Most Active Stocks
        </h2>
        <div className="flex items-center gap-2">
          {data?.lastUpdated && !isLoading && !isError && (
            <span className="text-[9px] font-semibold text-slate-400 hidden sm:inline-block">
              Updated: {new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        {renderContent()}
      </div>
      
      {!isLoading && !isError && validStocks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border/50 text-center">
          <Link to="/stocks" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            Explore all markets <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default MostActiveCard;
