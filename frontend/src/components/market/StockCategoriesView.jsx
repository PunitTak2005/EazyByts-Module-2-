import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatVolume, formatPercent, isValidStockData } from '@/utils/formatters.js';
import marketService from '@/services/marketService';

const StockCard = ({ stock }) => {
  const change = stock.change !== undefined ? stock.change : (stock.prevClose ? stock.price - stock.prevClose : 0);
  const changePercent = stock.changePercent !== undefined ? stock.changePercent : (stock.prevClose ? (change / stock.prevClose) * 100 : 0);
  const isPositive = change >= 0;

  // Generate placeholder small chart values (using stock open/high/low/close prices)
  const mockSparkline = [
    { price: stock.prevClose },
    { price: stock.lowPrice },
    { price: stock.openPrice },
    { price: stock.highPrice },
    { price: stock.price }
  ];

  // Convert market cap to Billions
  const marketCapB = stock.marketCap ? (stock.marketCap / 1000000000).toFixed(2) : 'N/A';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card hover:shadow-lg transition-all h-full"
    >
      <Link to={`/stocks/${stock.symbol}`}>
        <div className="flex justify-between items-start">
          <div>
            <span className="font-extrabold text-slate-800 dark:text-white text-base mr-2">
              {stock.symbol}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400 uppercase">
              {stock.sector || 'General'}
            </span>
            <div className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">{stock.name || stock.companyName}</div>
          </div>

          <div className="text-right">
            <div className="font-black text-slate-800 dark:text-white">{formatCurrency(stock.price)}</div>
            <div className={`flex items-center justify-end text-xs font-extrabold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
              {formatPercent(changePercent)}
            </div>
          </div>
        </div>

        {/* Dynamic mini-sparkline area */}
        <div className="h-10 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockSparkline}>
              <defs>
                <linearGradient id={`grad-cat-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? '#10b981' : '#ef4444'} 
                strokeWidth={1.5}
                fillOpacity={1}
                fill={`url(#grad-cat-${stock.symbol})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats footer row */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3 mt-3 dark:border-dark-border">
          <span>Cap: {stock.marketCap ? `$${marketCapB}B` : 'N/A'}</span>
          <span>Vol: {formatVolume(stock.volume)}</span>
        </div>
      </Link>
    </motion.div>
  );
};

const CategorySection = ({ title, description, stocks, isLoading }) => {
  const validStocks = (stocks || []).filter(isValidStockData);
  return (
    <div className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          {title}
          <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-400">
            {validStocks.length}
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-44 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border animate-pulse" />
          ))}
        </div>
      ) : validStocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-dark-border py-12 flex flex-col items-center justify-center text-slate-400">
          <AlertCircle className="h-8 w-8 mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold">No {title} Stocks</p>
          <p className="text-xs mt-1">No stocks matched the market cap criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {validStocks.slice(0, 12).map(stock => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
};

const StockCategoriesView = () => {
  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['stockCategories'],
    queryFn: marketService.getStockCategories,
    refetchInterval: 60000, // 60 seconds auto-refresh
    refetchOnWindowFocus: true
  });

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-900/20">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">Unable to load stock categories.</h3>
        <p className="text-xs text-rose-600 dark:text-rose-500 mb-4">Please check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Market Capitalization Categories</h2>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <CategorySection 
        title="Large Cap" 
        description="Market capitalization over $10 Billion. Mature, well-known companies."
        stocks={data?.largeCap} 
        isLoading={isLoading} 
      />
      
      <CategorySection 
        title="Mid Cap" 
        description="Market capitalization between $2 Billion and $10 Billion. Established but still growing."
        stocks={data?.midCap} 
        isLoading={isLoading} 
      />
      
      <CategorySection 
        title="Small Cap" 
        description="Market capitalization under $2 Billion. High growth potential, higher volatility."
        stocks={data?.smallCap} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default StockCategoriesView;
