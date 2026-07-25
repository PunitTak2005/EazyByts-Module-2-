import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTransactionHistory, cancelOrder } from '@/services/tradeService';
import { useSocket } from '@/context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  History, Search, Filter, RefreshCw, FileDown, Printer, 
  ChevronLeft, ChevronRight, Ban, ArrowUpRight, ArrowDownRight,
  TrendingUp, DollarSign, Activity, Eye, X, CheckCircle2, Clock
} from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatters.js';

// Safe date parser to prevent "Invalid time value" crashes
const getValidDate = (tx) => {
  const dateStr = tx.timestamp || tx.createdAt || tx.date;
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const TransactionHistory = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);

  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['transactions', page, searchFilter, typeFilter, statusFilter, sortBy],
    queryFn: () => getTransactionHistory({ 
      page, 
      limit: 12, 
      search: searchFilter, 
      type: typeFilter, 
      status: statusFilter,
      sortBy 
    }),
    refetchInterval: 10000,
  });

  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleOrderCancelled = () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioDetails'] });
    };

    socket.on('orderCancelled', handleOrderCancelled);
    socket.on('tradeCompleted', handleOrderCancelled);

    return () => {
      socket.off('orderCancelled', handleOrderCancelled);
      socket.off('tradeCompleted', handleOrderCancelled);
    };
  }, [socket, queryClient]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchFilter(searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchFilter('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('newest');
    setPage(1);
  };

  // Compute summary stats from current transactions dataset
  const transactionsList = data?.transactions || [];
  const totalBuyVolume = transactionsList
    .filter(t => (t.type === 'BUY' || t.action === 'BUY') && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.totalAmount || (t.quantity * t.price) || 0), 0);
  const totalSellVolume = transactionsList
    .filter(t => (t.type === 'SELL' || t.action === 'SELL') && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.totalAmount || (t.quantity * t.price) || 0), 0);
  const totalRealizedProfit = transactionsList
    .filter(t => (t.type === 'SELL' || t.action === 'SELL') && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + (t.realizedProfit || 0), 0);

  // CSV Exporter
  const exportCSV = () => {
    if (!transactionsList || transactionsList.length === 0) {
      toast.error('No transactions available to export');
      return;
    }

    const headers = ['Transaction ID', 'Date', 'Symbol', 'Company', 'Type', 'Order Type', 'Quantity', 'Price (INR)', 'Fees (INR)', 'Total Amount (INR)', 'Realized Profit (INR)', 'Status'];
    const rows = transactionsList.map(tx => {
      const d = getValidDate(tx);
      const dateStr = d ? d.toISOString().replace('T', ' ').substring(0, 19) : 'N/A';
      return [
        tx._id || tx.id,
        dateStr,
        tx.symbol,
        `"${tx.companyName || tx.symbol}"`,
        tx.type || tx.action,
        tx.orderType,
        tx.quantity,
        tx.price || tx.executedPrice || 0,
        tx.fees || 0,
        tx.totalAmount || 0,
        tx.realizedProfit || 0,
        tx.status
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Transaction_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV transaction history downloaded!');
  };

  const triggerPrint = () => {
    window.print();
  };

  const handleCancelPendingOrder = (id, symbol) => {
    setOrderToCancel({ id, symbol });
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await cancelOrder(orderToCancel.id);
      toast.success(`Cancelled pending order for ${orderToCancel.symbol}`);
      refetch();
      setOrderToCancel(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="space-y-6 print:p-0 print:m-0">
      
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <History className="h-6 w-6 text-blue-500" />
            Transaction History
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit all executed stock buy/sell transactions and limit orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
            title="Refresh Transactions"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 transition-all"
          >
            <FileDown className="h-3.5 w-3.5 text-emerald-500" /> Export CSV
          </button>
          <button 
            onClick={triggerPrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 transition-all"
          >
            <Printer className="h-3.5 w-3.5 text-blue-500" /> Print Ledger
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Total Logged</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-800 dark:text-white">
            {data?.pagination?.total || 0} Trades
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Buy Outflow</span>
            <ArrowDownRight className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalBuyVolume)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Sell Inflow</span>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalSellVolume)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Realized P/L</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <div className={`text-xl font-black ${totalRealizedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalRealizedProfit >= 0 ? '+' : ''}{formatCurrency(totalRealizedProfit)}
          </div>
        </div>
      </div>

      {/* PRINT HEADER */}
      <div className="hidden print:block mb-8 text-left">
        <h1 className="text-3xl font-black">Stock Market Dashboard Ledger Report</h1>
        <p className="text-sm text-slate-500">Official paper-trading account transaction statement.</p>
        <div className="text-xs text-slate-400 mt-2">Report Date: {new Date().toLocaleString()}</div>
      </div>

      {/* Filter & Sorting Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          
          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by stock symbol (e.g. AAPL, TCS)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-blue-500 transition-all font-medium"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> TYPE:
              </span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setPage(1);
                  setTypeFilter(e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text cursor-pointer font-bold"
              >
                <option value="ALL">All Types</option>
                <option value="BUY">Buy Orders</option>
                <option value="SELL">Sell Orders</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold">STATUS:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text cursor-pointer font-bold"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending (Limit)</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* SortBy dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setPage(1);
                  setSortBy(e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text cursor-pointer font-bold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_value">Highest Value</option>
                <option value="lowest_value">Lowest Value</option>
              </select>
            </div>

            {/* Reset */}
            <button
              onClick={handleResetFilters}
              className="rounded-xl border border-dashed border-slate-200 px-3.5 py-2 text-xs font-bold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" count={6} />
          </div>
        ) : isError ? (
          <div className="py-16 text-center border border-dashed border-rose-200 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/30">
            <h3 className="text-sm font-bold text-rose-600 mb-1">Unable to load transaction history.</h3>
            <button onClick={() => refetch()} className="text-xs font-semibold text-rose-500 hover:text-rose-700 underline">Retry Loading</button>
          </div>
        ) : !transactionsList || transactionsList.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 dark:border-dark-border rounded-xl">
            <History className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No transactions found.</h3>
            <p className="text-xs text-slate-400 mb-4">No trading activity matching your search or filters.</p>
            <button 
              onClick={handleResetFilters} 
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-md"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="block sm:hidden space-y-4">
              {transactionsList.map((tx) => {
                const isBuy = tx.type === 'BUY' || tx.action === 'BUY';
                const isCompleted = tx.status === 'COMPLETED';
                const isPending = tx.status === 'PENDING';
                
                return (
                  <div 
                    key={tx._id || tx.id} 
                    onClick={() => setSelectedDetailTx(tx)}
                    className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-dark-bg/40 space-y-2.5 cursor-pointer hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">{tx.symbol}</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{tx.companyName || tx.symbol}</div>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                        isBuy 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {tx.type || tx.action}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <div>Quantity: <span className="text-slate-800 dark:text-slate-200">{tx.quantity}</span></div>
                      <div>Price: <span className="text-slate-800 dark:text-slate-200">{tx.price ? formatCurrency(tx.price) : 'Pending'}</span></div>
                      <div>Total: <span className="text-slate-800 dark:text-slate-200">{formatCurrency(tx.totalAmount)}</span></div>
                      <div>Realized Gain: <span className={`font-bold ${(tx.realizedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{!isBuy && isCompleted ? formatCurrency(tx.realizedProfit || 0) : '--'}</span></div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px]">
                      <span className="text-slate-400">
                        {getValidDate(tx) ? getValidDate(tx).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 font-bold ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : isPending
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Security</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Order</th>
                    <th className="py-3 px-3 text-right">Shares</th>
                    <th className="py-3 px-3 text-right">Execution Price</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                    <th className="py-3 px-3 text-right">Realized P/L</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                  {transactionsList.map((tx) => {
                    const isBuy = tx.type === 'BUY' || tx.action === 'BUY';
                    const isCompleted = tx.status === 'COMPLETED';
                    const isPending = tx.status === 'PENDING';
                    
                    return (
                      <tr 
                        key={tx._id || tx.id} 
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {getValidDate(tx) ? getValidDate(tx).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-3">
                          <Link to={`/stocks/${tx.symbol}`} className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline block">
                            {tx.symbol}
                          </Link>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{tx.companyName || tx.symbol}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                            isBuy 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {tx.type || tx.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-bold">{tx.orderType}</td>
                        <td className="py-3.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">{tx.quantity}</td>
                        <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300 font-bold">
                          {tx.price ? formatCurrency(tx.price) : 'Pending'}
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-900 dark:text-white font-extrabold">
                          {formatCurrency(tx.totalAmount)}
                        </td>
                        <td className={`py-3.5 px-3 text-right font-bold ${(tx.realizedProfit || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {!isBuy && isCompleted ? `${(tx.realizedProfit || 0) >= 0 ? '+' : ''}${formatCurrency(tx.realizedProfit || 0)}` : '--'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isCompleted 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : isPending
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right print:hidden flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDetailTx(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="View Transaction Breakdown"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isPending && (
                            <button
                              onClick={() => handleCancelPendingOrder(tx._id || tx.id, tx.symbol)}
                              className="rounded-lg border border-slate-200 p-1.5 text-rose-500 hover:bg-rose-50 dark:border-dark-border dark:hover:bg-rose-950/15"
                              title="Cancel Pending Order"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data?.pagination?.pages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-dark-border print:hidden">
                <span className="text-xs font-bold text-slate-400">
                  Showing Page {page} of {data.pagination.pages} ({data.pagination.total} Total Records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(data.pagination.pages, prev + 1))}
                    disabled={page === data.pagination.pages}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 transition-all"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Breakdown Modal */}
      <AnimatePresence>
        {selectedDetailTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-dark-border overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    Transaction Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedDetailTx._id || selectedDetailTx.id}</p>
                </div>
                <button
                  onClick={() => setSelectedDetailTx(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-bg/60">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-white font-bold ${
                      (selectedDetailTx.type || selectedDetailTx.action) === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}>
                      {(selectedDetailTx.type || selectedDetailTx.action) === 'BUY' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 dark:text-white">{selectedDetailTx.symbol}</div>
                      <div className="text-[11px] text-slate-400">{selectedDetailTx.companyName || selectedDetailTx.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      (selectedDetailTx.type || selectedDetailTx.action) === 'BUY' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}>
                      {selectedDetailTx.type || selectedDetailTx.action}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">Execution Timestamp</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {getValidDate(selectedDetailTx) ? getValidDate(selectedDetailTx).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">Order Type & Status</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedDetailTx.orderType} • <span className="text-emerald-500 font-extrabold">{selectedDetailTx.status}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Share Quantity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDetailTx.quantity} Shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price per Share</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(selectedDetailTx.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency((selectedDetailTx.quantity * selectedDetailTx.price))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Brokerage Fees (0.1%)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(selectedDetailTx.fees || 0)}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between text-sm font-extrabold">
                    <span className="text-slate-800 dark:text-white">Total Amount</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(selectedDetailTx.totalAmount)}</span>
                  </div>
                  {(selectedDetailTx.type === 'SELL' || selectedDetailTx.action === 'SELL') && (
                    <div className="flex justify-between pt-1 text-xs font-bold text-emerald-500">
                      <span>Realized Gain / Loss</span>
                      <span>{(selectedDetailTx.realizedProfit || 0) >= 0 ? '+' : ''}{formatCurrency(selectedDetailTx.realizedProfit || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedDetailTx(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-95 transition-all"
                >
                  Close Breakdown
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Cancellation Confirmation Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Cancel pending order?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to cancel the pending order for {orderToCancel.symbol}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setOrderToCancel(null)}
                  className="flex-1 rounded-xl px-4 py-2 text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 rounded-xl px-4 py-2 text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-md"
                >
                  Cancel Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TransactionHistory;
