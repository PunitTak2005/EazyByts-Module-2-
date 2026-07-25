import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Briefcase, BarChart3, LineChart, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Eye, SlidersHorizontal, ChevronRight,
  PiggyBank, Banknote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocket } from '@/context/SocketContext.jsx';
import toast from 'react-hot-toast';

import WidgetSelector from '@/components/WidgetSelector';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import MostActiveCard from '@/components/dashboard/MostActiveCard';
import PortfolioStatCard from '@/components/dashboard/PortfolioStatCard';
import RecentTradesCard from '@/components/dashboard/RecentTradesCard';
import NetWorthGrowthChart from '@/components/dashboard/NetWorthGrowthChart';
import PortfolioInsights from '@/components/market/PortfolioInsights';
import { useTheme } from '@/context/ThemeContext';
import Skeleton from '@/components/ui/Skeleton';
import { dashboardService } from '@/services/dashboardService.js';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatters.js';

const fetchDashboardData = async () => {
  return await dashboardService.getDashboardData();
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { isDark } = useTheme();

  const gridStroke = isDark ? '#243048' : '#e2e8f0';
  const axisStroke = isDark ? '#9ca3af' : '#64748b';
  const tooltipBg = isDark ? '#161c2a' : '#ffffff';
  const tooltipBorder = isDark ? '#243048' : '#e2e8f0';
  const tooltipText = isDark ? '#f3f4f6' : '#1e293b';

  const [widgetSettingsOpen, setWidgetSettingsOpen] = useState(false);
  const [currentLayout, setCurrentLayout] = useState(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  // 1. Fetch dashboard data stats
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  const { data: portfolioData } = useQuery({
    queryKey: ['portfolioDetails'],
    queryFn: async () => {
      const { portfolioService } = await import('@/services/portfolioService.js');
      return await portfolioService.getPortfolioDetails();
    }
  });

  // 2. Fetch widgets layout
  const { data: layoutData, refetch: refetchLayout } = useQuery({
    queryKey: ['widgetsLayout'],
    queryFn: async () => {
      return await dashboardService.getLayout();
    }
  });

  const VALID_WIDGET_IDS = ['portfolio', 'allocation', 'movers', 'watchlist', 'trades'];

  // Keep layout state synced
  useEffect(() => {
    if (layoutData) {
      const sorted = [...layoutData]
        .filter(w => VALID_WIDGET_IDS.includes(w.widgetId))
        .sort((a, b) => a.order - b.order);
      setCurrentLayout(sorted);
    }
  }, [layoutData]);

  // Socket updates — only invalidate for movers/news ticks.
  // IMPORTANT: Do NOT invalidate on prices_tick — that fires every second and
  // causes topGainers/topLosers to get new array references, which remounts
  // the ticker track on every tick and kills the CSS animation.
  // The LiveMarketTicker component handles its own price updates via its own
  // socket subscription (priceMap state), completely independent of this query.
  useEffect(() => {
    if (!socket) return;

    const handlePortfolioUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioDetails'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory'] });
      queryClient.invalidateQueries({ queryKey: ['recentTrades'] });
      queryClient.invalidateQueries({ queryKey: ['assetAllocation'] });
      queryClient.invalidateQueries({ queryKey: ['mostActiveStocks'] });
    };

    const handleMovers = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mostActiveStocks'] });
    };

    socket.on('movers_tick', handleMovers);
    socket.on('orderCancelled', handlePortfolioUpdate);
    socket.on('tradeCompleted', handlePortfolioUpdate);
    socket.on('portfolio_tick', handlePortfolioUpdate);

    return () => {
      socket.off('movers_tick', handleMovers);
      socket.off('orderCancelled', handlePortfolioUpdate);
      socket.off('tradeCompleted', handlePortfolioUpdate);
      socket.off('portfolio_tick', handlePortfolioUpdate);
    };
  }, [socket, queryClient]);

  const handleSaveLayout = async () => {
    setIsSavingLayout(true);
    try {
      await dashboardService.saveLayout(currentLayout);
      toast.success('Workspace layout configurations saved successfully');
      refetchLayout();
      setWidgetSettingsOpen(false);
    } catch (err) {
      toast.error('Failed to save layout preferences');
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleResetLayout = async () => {
    if (window.confirm('Restore default dashboard widgets layout?')) {
      try {
        const defaultLayout = [
          { widgetId: 'portfolio', colSpan: 2, order: 0, isVisible: true },
          { widgetId: 'allocation', colSpan: 2, order: 1, isVisible: true },
          { widgetId: 'movers', colSpan: 2, order: 2, isVisible: true },
          { widgetId: 'watchlist', colSpan: 2, order: 3, isVisible: true },
          { widgetId: 'trades', colSpan: 2, order: 4, isVisible: true }
        ];
        await dashboardService.saveLayout(defaultLayout);
        toast.success('Workspace reset to default configuration');
        refetchLayout();
        setWidgetSettingsOpen(false);
      } catch (err) {
        toast.error('Failed to reset workspace');
      }
    }
  };

  if (isLoading || !currentLayout) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        {/* Title Bar Skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-dark-border/40 pb-5">
          <div>
            <Skeleton variant="title" className="w-48 h-8" />
            <Skeleton variant="text" className="w-80 h-4 mt-2" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton variant="text" className="w-32 h-8 rounded-full" />
            <Skeleton variant="text" className="w-36 h-9 rounded-xl" />
            <Skeleton variant="text" className="w-24 h-9 rounded-xl" />
          </div>
        </div>

        {/* Summary Cards Skeletons */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <div 
              key={n} 
              className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm h-32 flex flex-col justify-between"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 dark:bg-dark-border" />
              <div className="flex justify-between items-center">
                <Skeleton variant="text" className="w-24 h-3.5" />
                <Skeleton variant="circle" className="w-8 h-8" />
              </div>
              <Skeleton variant="text" className="w-36 h-7" />
              <div className="flex justify-between items-center mt-2">
                <Skeleton variant="text" className="w-16 h-4 rounded-full" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
            </div>
          ))}
        </div>

        {/* Widgets skeleton matches standard widgets */}
        <div className="space-y-8">
          {/* Portfolio Chart Skeleton */}
          <div className="md:col-span-2 lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm h-96 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <Skeleton variant="title" className="w-48 h-5" />
              <Skeleton variant="text" className="w-28 h-4" />
            </div>
            <div className="flex-1 w-full bg-slate-50 dark:bg-dark-bg/20 rounded-xl flex items-center justify-center">
              <LineChart className="h-12 w-12 stroke-[1] text-slate-300 dark:text-slate-700 animate-pulse" />
            </div>
          </div>

          {/* Allocation Skeleton */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm h-80 flex flex-col justify-between">
            <Skeleton variant="title" className="w-36 h-5 mb-4" />
            <div className="flex items-center gap-6 h-full">
              <Skeleton variant="circle" className="w-36 h-36 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-4/5 h-4" />
                <Skeleton variant="text" className="w-3/4 h-4" />
              </div>
            </div>
          </div>

          {/* Watchlist Summary Skeleton */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm h-80 flex flex-col justify-between">
            <Skeleton variant="title" className="w-40 h-5 mb-4" />
            <div className="space-y-3 flex-1 overflow-hidden">
              <Skeleton variant="text" className="w-full h-10 rounded-xl" />
              <Skeleton variant="text" className="w-full h-10 rounded-xl" />
              <Skeleton variant="text" className="w-full h-10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { summary, recentTrades, topGainers, topLosers, performanceCurve } = data;
  const isGainToday = summary.todayGain >= 0;
  const isGainOverall = summary.totalProfitLoss >= 0;

  // Widget rendering components
  const renderPortfolioWidget = () => (
    <NetWorthGrowthChart initialData={performanceCurve} />
  );

  const renderAllocationWidget = () => (
    <div className="h-full">
      <PortfolioInsights portfolio={portfolioData?.data} />
    </div>
  );

  const renderMoversWidget = () => (
    <MostActiveCard />
  );

  const renderWatchlistWidget = () => {
    const watchlist = data.watchlist;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all duration-200">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4.5 w-4.5 text-blue-500" />
              <span>Watchlist</span>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
              {watchlist ? watchlist.name : 'None'}
            </span>
          </h2>
          {!watchlist || !watchlist.stocks || watchlist.stocks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold flex flex-col items-center gap-2">
              <Eye className="h-8 w-8 stroke-[1.5] text-slate-300" />
              <span>No active watchlist. Create one in the Watchlist Desk!</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {watchlist.stocks.map(sym => {
                const stockSymbol = typeof sym === 'object' ? sym.symbol : sym;
                return (
                <Link
                  key={stockSymbol}
                  to={`/stocks/${stockSymbol}`}
                  className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 dark:bg-dark-bg/20 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-dark-border/40 text-xs font-bold transition-all hover:translate-x-1"
                >
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold tracking-wider">{stockSymbol}</span>
                  <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                    Go to details
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTradesWidget = () => (
    <RecentTradesCard />
  );

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title & Preferences */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-dark-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Workspace Desk</h1>
          <p className="text-xs text-slate-400 mt-1">Monitor portfolios, check active watchlists, and manage widget dashboards.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/10">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Market Open (Sim)
          </span>

          <button 
            onClick={() => setWidgetSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-slate-800 shadow-sm transition-all active:scale-95"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Customize Layout
          </button>

          <button 
            onClick={async () => {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
                queryClient.invalidateQueries({ queryKey: ['portfolioDetails'] }),
                queryClient.invalidateQueries({ queryKey: ['portfolioHistory'] }),
                queryClient.invalidateQueries({ queryKey: ['recentTrades'] }),
                queryClient.invalidateQueries({ queryKey: ['assetAllocation'] }),
                queryClient.invalidateQueries({ queryKey: ['mostActiveStocks'] }),
                refetch(),
                refetchLayout()
              ]);
              toast.success('Dashboard refreshed');
            }}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-200 dark:hover:bg-slate-800 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <PortfolioStatCard 
          title="Net Worth"
          value={formatCurrency(summary.netWorth)}
          trend={formatPercent(summary.totalProfitLossPercent)}
          trendLabel="Overall Return"
          icon={Wallet}
        />
        <PortfolioStatCard 
          title="Today's Profit & Loss"
          value={formatCurrency(summary.todayGain)}
          trend={formatPercent(summary.todayGainPercent)}
          trendLabel="Today's Return"
          icon={isGainToday ? TrendingUp : TrendingDown}
        />
        <PortfolioStatCard 
          title="Invested Capital"
          value={formatCurrency(summary.totalInvestment)}
          subtitle="Current Value"
          subtitleValue={formatCurrency(summary.currentValue)}
          icon={PiggyBank}
        />
        <PortfolioStatCard 
          title="Available Cash"
          value={formatCurrency(summary.cashBalance)}
          subtitle="Cash Allocation"
          subtitleValue={formatPercent(summary.netWorth > 0 ? (summary.cashBalance / summary.netWorth) * 100 : 0)}
          icon={Banknote}
        />
      </div>

      {/* Dynamic customizable Widgets */}
      <div className="space-y-8">
        {currentLayout && currentLayout
          .filter(w => w.isVisible)
          .map(w => {
            const colSpanClass = w.colSpan === 4 
              ? 'md:col-span-2 lg:col-span-4' 
              : w.colSpan === 2 
              ? 'md:col-span-2' 
              : 'md:col-span-1';
              
            return (
              <motion.div 
                key={w.widgetId} 
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`${colSpanClass} transition-all duration-300`}
              >
                {w.widgetId === 'portfolio' && renderPortfolioWidget()}
                {w.widgetId === 'allocation' && renderAllocationWidget()}
                {w.widgetId === 'movers' && renderMoversWidget()}
                {w.widgetId === 'watchlist' && renderWatchlistWidget()}
                {w.widgetId === 'trades' && renderTradesWidget()}
              </motion.div>
            );
          })
        }
      </div>

      {/* Customizer Drawer */}
      <WidgetSelector 
        isOpen={widgetSettingsOpen}
        onClose={() => setWidgetSettingsOpen(false)}
        layout={currentLayout || []}
        onUpdateLayout={setCurrentLayout}
        onSaveLayout={handleSaveLayout}
        onResetLayout={handleResetLayout}
        isSaving={isSavingLayout}
      />

    </div>
  );
};

export default Dashboard;
