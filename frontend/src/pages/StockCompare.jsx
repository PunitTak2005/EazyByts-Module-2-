import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { X, Search, BarChart3, RefreshCw } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';
import toast from 'react-hot-toast';

const fetchAllStocks = async () => {
  const { data } = await api.get('/stocks?limit=100');
  return data.stocks || [];
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const StockCompare = () => {
  const [selectedSymbols, setSelectedSymbols] = useState(['AAPL', 'MSFT']);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch available stocks list
  const { data: stocksList, isLoading: loadingList } = useQuery({
    queryKey: ['allStocksList'],
    queryFn: fetchAllStocks,
  });

  // 2. Fetch details for comparison targets
  const { data: compareData, isLoading: loadingCompare, refetch, isRefetching } = useQuery({
    queryKey: ['compareStocksDetails', selectedSymbols],
    queryFn: async () => {
      // Fetch real details for each selected symbol, catch individual errors
      const promises = selectedSymbols.map(sym => 
        api.get(`/stocks/${sym}`).catch(err => {
          console.error(`Failed to fetch ${sym}:`, err);
          return null;
        })
      );
      const responses = await Promise.all(promises);
      // Filter out failed requests and extract data
      return responses
        .map(res => res ? res.data : null)
        .filter(Boolean);
    },
    enabled: selectedSymbols.length > 0,
  });

  const handleAddSymbol = (symbol) => {
    if (selectedSymbols.includes(symbol)) return;
    if (selectedSymbols.length >= 5) {
      toast.error('You can compare up to 5 stocks simultaneously.');
      return;
    }
    setSelectedSymbols(prev => [...prev, symbol]);
    setSearchQuery('');
  };

  const handleRemoveSymbol = (symbol) => {
    setSelectedSymbols(prev => prev.filter(s => s !== symbol));
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Comparative Engine</h1>
          <p className="text-xs text-slate-400">Perform side-by-side technical & fundamental comparisons of multiple simulated assets.</p>
        </div>
        <button 
          onClick={async () => {
            await refetch();
            toast.success('Stats refreshed');
          }}
          disabled={isRefetching || loadingCompare}
          className="flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Compare Selection Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comparing:</span>
          {selectedSymbols.map((sym, idx) => (
            <span 
              key={sym} 
              style={{ borderColor: CHART_COLORS[idx % CHART_COLORS.length] }}
              className="flex items-center gap-1.5 rounded-full border-2 bg-slate-50 px-3.5 py-1 text-xs font-black text-slate-800 dark:bg-dark-bg dark:text-dark-text"
            >
              {sym}
              <button 
                onClick={() => handleRemoveSymbol(sym)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                aria-label={`Remove ${sym}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {selectedSymbols.length < 5 && (
            <div className="relative">
              <input
                type="text"
                placeholder="Add stock to compare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50/50 py-1 px-4 text-xs font-semibold outline-none focus:border-blue-500 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
              />
              {searchQuery && stocksList && (
                <div className="absolute left-0 mt-2 z-40 w-56 rounded-xl border border-slate-200 bg-white shadow-xl max-h-48 overflow-y-auto dark:border-dark-border dark:bg-dark-card py-1.5">
                  {stocksList
                    .filter(s => 
                      (s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      s.companyName.toLowerCase().includes(searchQuery.toLowerCase())) && 
                      !selectedSymbols.includes(s.symbol)
                    )
                    .map(s => (
                      <button
                        key={s.symbol}
                        onClick={() => handleAddSymbol(s.symbol)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex justify-between"
                      >
                        <span>{s.symbol}</span>
                        <span className="text-[10px] text-slate-400">{s.companyName}</span>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedSymbols.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
          Select at least two stocks to compare.
        </div>
      ) : (
        <div className="w-full">
          
          {/* Fundamentals Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-violet-500" />
              Side-by-Side Fundamentals
            </h2>

            {loadingCompare ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" count={3} />
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold">
                
                {compareData && compareData.filter(Boolean).map((s, idx) => {
                  const prevClose = s.previousClose || s.prevClose || s.price;
                  const priceDiff = prevClose ? s.price - prevClose : 0;
                  const changePercent = prevClose ? (priceDiff / prevClose) * 100 : 0;
                  const isPositive = priceDiff >= 0;

                  return (
                    <div 
                      key={s.symbol || `unknown-${idx}`}
                      className="rounded-xl border border-slate-100 p-4 dark:border-dark-border space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-2">
                        <div>
                          <Link to={`/stocks/${s.symbol}`} className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                            {s.symbol || 'Unknown'}
                          </Link>
                          <span className="text-[10px] text-slate-400 block font-semibold">{s.companyName || s.name || 'Unknown Company'}</span>
                        </div>
                        <span 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <div>Price: <span className="text-slate-800 dark:text-slate-200">{formatCurrency(s.price || 0)}</span></div>
                        <div>Change: <span className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{formatPercent(changePercent)}</span></div>
                        <div>Market Cap: <span className="text-slate-800 dark:text-slate-200">{(s.marketCap ? (s.marketCap / 1000000000).toFixed(2) : 'N/A')}B</span></div>
                        <div>P/E Ratio: <span className="text-slate-800 dark:text-slate-200">{s.peRatio ? s.peRatio.toFixed(2) : 'N/A'}</span></div>
                        <div>EPS: <span className="text-slate-800 dark:text-slate-200">{s.eps ? s.eps.toFixed(2) : 'N/A'}</span></div>
                        <div>Div Yield: <span className="text-slate-800 dark:text-slate-200">{s.dividendYield ? (s.dividendYield * 100).toFixed(2) : '0'}%</span></div>
                        <div className="col-span-2 truncate">Sector: <span className="text-slate-800 dark:text-slate-200">{s.sector || 'N/A'}</span></div>
                      </div>
                    </div>
                  );
                })}
                
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StockCompare;
