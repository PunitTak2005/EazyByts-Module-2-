import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import stockService from '@/services/stockService';
import { formatCurrency } from '@/utils/formatters';
import { useTheme } from '@/context/ThemeContext';
import Skeleton from '@/components/ui/Skeleton';

const TIME_RANGES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '1W', range: '5d', interval: '30m' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' }
];

const PriceHistoryChart = ({ symbol, isPositive = true }) => {
  const { isDark } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIME_RANGES[2]); // Default 1M

  const { data: chartData, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['stockHistory', symbol, selectedTimeframe.range, selectedTimeframe.interval],
    queryFn: () => stockService.getHistoricalData(symbol, selectedTimeframe.range, selectedTimeframe.interval),
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (prev) => prev
  });

  const gridStroke = isDark ? '#243048' : '#e2e8f0';
  const axisStroke = isDark ? '#9ca3af' : '#64748b';
  const tooltipBg = isDark ? '#161c2a' : '#ffffff';
  const tooltipBorder = isDark ? '#243048' : '#e2e8f0';
  const tooltipText = isDark ? '#f3f4f6' : '#1e293b';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
          Interactive Price History
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={async () => {
              await refetch();
              toast.success('Chart refreshed');
            }}
            disabled={isRefetching || isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
            title="Refresh Chart"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-dark-bg overflow-x-auto">
            {TIME_RANGES.map(tf => (
              <button
                key={tf.label}
                onClick={() => setSelectedTimeframe(tf)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedTimeframe.label === tf.label 
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-dark-card dark:text-blue-400' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80 w-full pr-4 relative">
        {isLoading && !chartData ? (
          <div className="h-full w-full flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-rose-500">
            <p>Unable to load historical price data.</p>
            <button onClick={() => refetch()} className="mt-2 rounded-lg bg-rose-100 px-4 py-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
              [ Retry ]
            </button>
          </div>
        ) : !chartData || chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No historical data available for this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              
              {/* If timeframe is 1D or 1W, show timestamp hours, else show date */}
              <XAxis 
                dataKey={selectedTimeframe.label === '1D' || selectedTimeframe.label === '1W' ? 'timestamp' : 'date'} 
                stroke={axisStroke} 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => {
                  if (selectedTimeframe.label === '1D' || selectedTimeframe.label === '1W') {
                    return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  return new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' });
                }}
              />
              
              <YAxis 
                stroke={axisStroke} 
                fontSize={10} 
                tickLine={false} 
                domain={[(dataMin) => Math.floor(dataMin * 0.95), (dataMax) => Math.ceil(dataMax * 1.05)]} 
                tickFormatter={(val) => formatCurrency(val, '₹', '')}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderRadius: '12px',
                  border: `1px solid ${tooltipBorder}`,
                  color: tooltipText,
                  fontSize: '12px'
                }}
                itemStyle={{ color: tooltipText }}
                labelFormatter={(label) => {
                  // Label is the dataKey, which might be timestamp or date
                  if (typeof label === 'number') {
                    return new Date(label).toLocaleString();
                  }
                  return label;
                }}
                formatter={(val, name, props) => {
                  const dataPoint = props.payload;
                  if (name === 'close') {
                    return [
                      <div key="stats" className="flex flex-col gap-1 mt-1 font-mono text-[10px]">
                        <div>O: <span className="text-slate-800 dark:text-white font-bold">{formatCurrency(dataPoint.open)}</span></div>
                        <div>H: <span className="text-emerald-500 font-bold">{formatCurrency(dataPoint.high)}</span></div>
                        <div>L: <span className="text-rose-500 font-bold">{formatCurrency(dataPoint.low)}</span></div>
                        <div>C: <span className="text-blue-500 font-bold">{formatCurrency(dataPoint.close)}</span></div>
                        <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                          Vol: {dataPoint.volume.toLocaleString()}
                        </div>
                      </div>,
                      'Price Data'
                    ];
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="close" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PriceHistoryChart;
