import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Briefcase, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Skeleton from '@/components/ui/Skeleton';
import { useSocket } from '@/context/SocketContext.jsx';
import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';

const fetchPortfolio = async () => {
  try {
    const { data } = await api.get('/portfolio');
    return data || { summary: {}, holdings: [] };
  } catch (error) {
    console.error("Failed to fetch portfolio", error);
    throw error;
  }
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6b7280'];

const PortfolioPage = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { isDark } = useTheme();

  const gridStroke = isDark ? '#243048' : '#e2e8f0';
  const axisStroke = isDark ? '#9ca3af' : '#64748b';
  const tooltipBg = isDark ? '#161c2a' : '#ffffff';
  const tooltipBorder = isDark ? '#243048' : '#e2e8f0';
  const tooltipText = isDark ? '#f3f4f6' : '#1e293b';

  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
  });

  useEffect(() => {
    if (!socket) return;

    const handleTick = () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    };

    socket.on('prices_tick', handleTick);
    socket.on('portfolio_tick', handleTick);
    socket.on('orderCancelled', handleTick);
    socket.on('tradeCompleted', handleTick);

    return () => {
      socket.off('prices_tick', handleTick);
      socket.off('portfolio_tick', handleTick);
      socket.off('orderCancelled', handleTick);
      socket.off('tradeCompleted', handleTick);
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <Skeleton key={n} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data || !data.summary || !data.holdings) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm">
          <Briefcase className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Portfolio Unavailable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your portfolio is currently empty or could not be loaded.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start your first simulated trade to build your portfolio.</p>
          <Link to="/stocks" className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 shadow-md transition-all active:scale-95">
            Explore Stocks
          </Link>
        </div>
      </div>
    );
  }

  const { summary, holdings } = data;
  const isGain = (summary.totalProfitLoss || 0) >= 0;

  // Sector allocation parser
  const sectorAllocations = [];
  const sectorMap = {};
  
  holdings.forEach(h => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.currentValue;
  });

  Object.keys(sectorMap).forEach(key => {
    sectorAllocations.push({
      name: key,
      value: parseFloat(sectorMap[key].toFixed(2))
    });
  });

  // If holdings is empty, add Cash allocation
  if (holdings.length === 0) {
    sectorAllocations.push({ name: 'Cash Balance', value: summary.cashBalance });
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">My Portfolio</h1>
          <p className="text-xs text-slate-400">Review your asset holdings and paper performance.</p>
        </div>
        <button 
          onClick={async () => {
            await refetch();
            toast.success('Holdings synced successfully.');
          }}
          disabled={isRefetching}
          className="flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
          Sync Holdings
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Net Worth */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Simulated Net Worth</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {formatCurrency(summary.netWorth)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Cash + Current Holdings Valuation</div>
        </div>

        {/* Invested Amount */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Total Invested Amount</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {formatCurrency(summary.totalInvestment)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Historical buy execution costs</div>
        </div>

        {/* Current Holdings Valuation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Holdings Value</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {formatCurrency(summary.currentValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Evaluated at live market prices</div>
        </div>

        {/* Profit/Loss Return */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Overall Returns</span>
          <div className={`text-2xl font-black ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
            {formatCurrency(summary.totalProfitLoss)}
          </div>
          <div className={`mt-2 flex items-center text-xs font-bold ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isGain ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
            {formatPercent(summary.totalProfitLossPercent)} returns
          </div>
        </div>

      </div>

      {/* Main Grid: Holdings Table & Allocation Pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Holdings Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="h-4.5 w-4.5 text-blue-500" />
            Current Stocks Holdings
          </h2>

          {/* Mobile Stacked Holdings Cards View */}
          <div className="block sm:hidden space-y-4">
            {holdings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Your portfolio is empty. Go to the Explorer page to place a simulated buy order!
              </div>
            ) : (
              holdings.map((h) => {
                const isHoldingGain = h.profitLoss >= 0;
                return (
                  <div key={h._id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-dark-bg/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/stocks/${h.symbol}`} className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                          {h.symbol}
                        </Link>
                        <span className="text-[10px] text-slate-400 block font-semibold truncate max-w-[150px]">{h.name}</span>
                      </div>
                      <div className="text-right">
                          <div className={`font-bold ${isHoldingGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatCurrency(h.profitLoss)}
                          </div>
                        <div className={`text-[10px] font-bold ${isHoldingGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatPercent(h.profitLossPercent)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <div>Quantity: <span className="text-slate-800 dark:text-slate-200">{h.quantity}</span></div>
                      <div>Avg Price: <span className="text-slate-800 dark:text-slate-200">{formatCurrency(h.averageBuyPrice)}</span></div>
                      <div>Live Price: <span className="text-slate-800 dark:text-slate-200">{formatCurrency(h.currentPrice)}</span></div>
                      <div>Today: <span className={`font-bold ${h.todayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatPercent(h.todayChangePercent)}</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="text-slate-400 font-medium">Invested: <span className="text-slate-700 dark:text-slate-300">{formatCurrency(h.totalInvestment)}</span></div>
                      <div className="text-slate-400 font-medium text-right">Value: <span className="text-slate-800 dark:text-slate-200">{formatCurrency(h.currentValue)}</span></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Asset</th>
                  <th className="py-3 px-2">Quantity</th>
                  <th className="py-3 px-2">Avg Buy</th>
                  <th className="py-3 px-2">Live Price</th>
                  <th className="py-3 px-2 text-right">Investment</th>
                  <th className="py-3 px-2 text-right">Current Value</th>
                  <th className="py-3 px-2 text-right">Returns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      Your portfolio is empty. Go to the Explorer page to place a simulated buy order!
                    </td>
                  </tr>
                ) : (
                  holdings.map((h) => {
                    const isHoldingGain = h.profitLoss >= 0;
                    return (
                      <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3.5 px-2">
                          <Link to={`/stocks/${h.symbol}`} className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                            {h.symbol}
                          </Link>
                          <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">{h.name}</div>
                        </td>
                        <td className="py-3.5 px-2 font-semibold text-slate-700 dark:text-slate-300">{h.quantity}</td>
                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">{formatCurrency(h.averageBuyPrice)}</td>
                        <td className="py-3.5 px-2">
                          <div className="text-slate-700 dark:text-slate-300">{formatCurrency(h.currentPrice)}</div>
                          <div className={`text-[9px] font-bold ${h.todayChangePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatPercent(h.todayChangePercent)}
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-right text-slate-600 dark:text-slate-400">{formatCurrency(h.totalInvestment)}</td>
                        <td className="py-3.5 px-2 text-right font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(h.currentValue)}</td>
                        <td className="py-3.5 px-2 text-right">
                          <div className={`font-bold ${isHoldingGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatCurrency(h.profitLoss)}
                          </div>
                          <div className={`text-[10px] font-bold ${isHoldingGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatPercent(h.profitLossPercent)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sector Allocation visual chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-violet-500" />
              Asset Allocations
            </h2>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorAllocations}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorAllocations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderRadius: '12px',
                      border: `1px solid ${tooltipBorder}`,
                      color: tooltipText
                    }}
                    itemStyle={{ color: tooltipText }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-4 max-h-[140px] overflow-y-auto pr-1">
            {sectorAllocations.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs font-semibold">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{item.name}</span>
                <span className="text-slate-400 font-medium">{formatCurrency(item.value)}</span>
                <span className="font-extrabold ml-auto">{formatPercent(summary.netWorth > 0 ? (item.value / summary.netWorth) * 100 : 0)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default PortfolioPage;
