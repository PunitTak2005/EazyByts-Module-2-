import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { LineChart as LineIcon, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';
import { portfolioService } from '@/services/portfolioService';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';
import Skeleton from '@/components/ui/Skeleton';

const RANGES = [
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' }
];

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0].payload;
  const netWorth = Number(dataPoint.netWorth ?? dataPoint.value ?? 0);
  const dailyChange = Number(dataPoint.dailyChange ?? 0);
  const percentageChange = Number(dataPoint.percentageChange ?? 0);
  const isPositive = dailyChange >= 0;

  // Format date cleanly for tooltip
  let formattedDate = label;
  if (dataPoint.date) {
    try {
      const d = new Date(dataPoint.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (e) {
      formattedDate = dataPoint.date;
    }
  }

  return (
    <div
      className={`p-3.5 rounded-2xl shadow-xl border text-xs space-y-2 min-w-[190px] transition-colors ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-100 text-slate-800'
      } backdrop-blur-md`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5">
        <Calendar className="h-3.5 w-3.5 text-blue-500" />
        <span>{formattedDate}</span>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Worth</div>
        <div className="text-base font-black text-slate-900 dark:text-white">
          {formatCurrency(netWorth)}
        </div>
      </div>

      {dailyChange !== 0 || percentageChange !== 0 ? (
        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold">
          <span className="text-[10px] text-slate-400">Daily Change</span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositive ? '+' : ''}{formatCurrency(dailyChange)}</span>
            <span className="text-[10px] opacity-80">({isPositive ? '+' : ''}{percentageChange.toFixed(2)}%)</span>
          </div>
        </div>
      ) : (
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
          Initial Snapshot Base
        </div>
      )}
    </div>
  );
};

const NetWorthGrowthChart = ({ initialData = null, title = 'Net Worth Growth Trend', className = '' }) => {
  const [selectedRange, setSelectedRange] = useState('1M');
  const { isDark } = useTheme();
  const socket = useSocket();
  const queryClient = useQueryClient();

  // Query portfolio snapshot history with selected time range
  const {
    data: historyData,
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['portfolioHistory', selectedRange],
    queryFn: () => portfolioService.getPortfolioHistory(selectedRange),
    staleTime: 30000,
  });

  // Listen to socket events to update history in real-time
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory'] });
    };
    socket.on('tradeCompleted', handleUpdate);
    socket.on('orderCancelled', handleUpdate);
    socket.on('portfolio_tick', handleUpdate);
    return () => {
      socket.off('tradeCompleted', handleUpdate);
      socket.off('orderCancelled', handleUpdate);
      socket.off('portfolio_tick', handleUpdate);
    };
  }, [socket, queryClient]);

  // Determine source data
  const rawData = useMemo(() => {
    if (historyData && Array.isArray(historyData) && historyData.length > 0) {
      return historyData;
    }
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      return initialData;
    }
    return [];
  }, [historyData, initialData]);

  // Transform and memoize data for Recharts
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // Sort chronologically by date
    const sorted = [...rawData].sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp || 0).getTime();
      const dateB = new Date(b.date || b.timestamp || 0).getTime();
      return dateA - dateB;
    });

    return sorted.map((pt, idx) => {
      const netWorth = Number(pt.netWorth ?? pt.value ?? 0);
      const prevNetWorth = idx > 0 ? Number(sorted[idx - 1].netWorth ?? sorted[idx - 1].value ?? netWorth) : netWorth;
      const dailyChange = Number(pt.dailyChange ?? (netWorth - prevNetWorth));
      const percentageChange = Number(
        pt.percentageChange ?? (prevNetWorth > 0 ? ((netWorth - prevNetWorth) / prevNetWorth) * 100 : 0)
      );

      let formattedX = pt.date;
      if (pt.date) {
        try {
          const d = new Date(pt.date);
          if (!isNaN(d.getTime())) {
            formattedX = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          }
        } catch (e) {
          formattedX = pt.date;
        }
      }

      return {
        date: pt.date || `Point ${idx + 1}`,
        formattedX,
        netWorth,
        value: netWorth,
        dailyChange: isNaN(dailyChange) ? 0 : dailyChange,
        percentageChange: isNaN(percentageChange) ? 0 : percentageChange,
      };
    });
  }, [rawData]);

  // Calculate Y-axis domain padding safely
  const { yDomain, latestNetWorth, netWorthTrend } = useMemo(() => {
    if (chartData.length === 0) {
      return { yDomain: [950000, 1050000], latestNetWorth: 0, netWorthTrend: 0 };
    }
    const values = chartData.map(d => d.netWorth).filter(v => !isNaN(v) && v > 0);
    if (values.length === 0) {
      return { yDomain: [950000, 1050000], latestNetWorth: 0, netWorthTrend: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.1, max * 0.02, 1000);

    const latest = chartData[chartData.length - 1].netWorth;
    const first = chartData[0].netWorth;
    const trend = first > 0 ? ((latest - first) / first) * 100 : 0;

    return {
      yDomain: [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)],
      latestNetWorth: latest,
      netWorthTrend: trend
    };
  }, [chartData]);

  // Theme styling tokens
  const gridStroke = isDark ? '#243048' : '#e2e8f0';
  const axisStroke = isDark ? '#9ca3af' : '#64748b';
  const strokeColor = netWorthTrend >= 0 ? '#3b82f6' : '#ef4444';
  const gradientId = `colorWorthGradient_${Math.random().toString(36).substr(2, 9)}`;

  // Y-axis tick formatter for readable compact currency
  const formatYAxisTick = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <LineIcon className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">{title}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical portfolio valuation ({selectedRange} view)
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Time range selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-dark-bg text-xs font-semibold">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRange(r.value)}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  selectedRange === r.value
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-dark-card dark:text-blue-400 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Manual Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refresh history"
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="h-72 w-full relative">
        {isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center space-y-3">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-dark-bg/40 rounded-xl border border-slate-100 dark:border-dark-border/40">
            <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Unable to load net worth growth history.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-all active:scale-95"
            >
              Retry
            </button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-dark-bg/30 rounded-2xl border border-dashed border-slate-200 dark:border-dark-border">
            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 mb-3">
              <LineIcon className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No Portfolio History Available</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Your portfolio history will appear as you continue investing.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis
                dataKey="formattedX"
                stroke={axisStroke}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={5}
              />
              <YAxis
                stroke={axisStroke}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={yDomain}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke={strokeColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default React.memo(NetWorthGrowthChart);
