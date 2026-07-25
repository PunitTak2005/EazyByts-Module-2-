import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, ArrowDownRight, Clock, Search, Download, FileText, 
  List, TrendingUp, TrendingDown, Info, X, BarChart3, History, CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatters';

const StockTransactionHistory = ({ symbol, currentPrice }) => {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('ALL'); // ALL, BUY, SELL
  const [sortOrder, setSortOrder] = useState('NEWEST'); // NEWEST, OLDEST, HIGHEST_VALUE, LOWEST_VALUE
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('TABLE'); // TABLE, TIMELINE, STATS
  const [selectedTx, setSelectedTx] = useState(null);

  // Fetch History
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolioHistory', symbol, page, filterType, sortOrder, searchQuery],
    queryFn: async () => {
      const res = await api.get(`/portfolio/${symbol}/history`, {
        params: {
          page,
          limit: 20,
          action: filterType,
          sort: sortOrder,
          search: searchQuery
        }
      });
      return res.data;
    },
    enabled: !!symbol,
    keepPreviousData: true
  });

  const exportCSV = () => {
    if (!data?.transactions) return;
    
    const headers = ['Date', 'Type', 'Quantity', 'Price', 'Total Value', 'Fees', 'Status', 'Order ID'];
    const rows = data.transactions.map(tx => [
      new Date(tx.timestamp).toLocaleString(),
      tx.action,
      tx.quantity,
      tx.executedPrice,
      tx.quantity * tx.executedPrice,
      tx.fees,
      tx.status,
      tx._id
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${symbol}_Transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    window.print();
  };

  if (isLoading && !data) {
    return (
      <div className="animate-pulse space-y-6 mt-8">
        <div className="h-32 bg-slate-100 dark:bg-dark-card rounded-2xl"></div>
        <div className="h-96 bg-slate-100 dark:bg-dark-card rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl mt-8 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50">
        Failed to load transaction history. Please try again.
      </div>
    );
  }

  const { holding, stats, transactions, pagination } = data;

  if (stats.totalBuys === 0 && stats.totalSells === 0) {
    return (
      <div className="mt-8 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="h-16 w-16 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-4">
          <History className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No transactions found for this stock.</h3>
        <p className="text-sm text-slate-500 max-w-sm">Start trading to build your transaction history. All your simulated buy and sell orders will appear here.</p>
      </div>
    );
  }

  // Live recalculation for unrealized profit
  const liveMarketValue = holding.sharesOwned * currentPrice;
  const liveUnrealizedProfit = liveMarketValue - holding.invested;

  return (
    <div className="mt-8 space-y-6">
      
      {/* Position Summary Card */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Position Summary
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shares Owned</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{formatNumber(holding.sharesOwned)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Buy Price</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(holding.averageBuyPrice)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invested</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(holding.invested)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Market Value</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(liveMarketValue)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unrealized P/L</span>
            <div className={`text-2xl font-black flex items-center ${liveUnrealizedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {liveUnrealizedProfit >= 0 ? '+' : ''}{formatCurrency(liveUnrealizedProfit)}
            </div>
            <div className={`text-[10px] font-bold ${liveUnrealizedProfit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
              ({holding.invested > 0 ? formatPercent((liveUnrealizedProfit / holding.invested) * 100) : '0.00%'})
            </div>
          </div>
        </div>
      </div>

      {/* Main History Section */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Header & Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-slate-50/50 dark:bg-dark-bg/20">
          <div className="flex bg-slate-100 dark:bg-dark-bg p-1 rounded-xl">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'TABLE' ? 'bg-white dark:bg-dark-card shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <List className="h-3.5 w-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('TIMELINE')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'TIMELINE' ? 'bg-white dark:bg-dark-card shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Clock className="h-3.5 w-3.5" /> Timeline
            </button>
            <button
              onClick={() => setViewMode('STATS')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'STATS' ? 'bg-white dark:bg-dark-card shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Stats
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Order ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 h-9 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs outline-none focus:border-blue-500 transition-colors w-40 lg:w-48 text-slate-700 dark:text-slate-200"
              />
            </div>
            
            <select 
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="h-9 px-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Trades</option>
              <option value="BUY">Buys Only</option>
              <option value="SELL">Sells Only</option>
            </select>

            <select 
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="h-9 px-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="HIGHEST_VALUE">Highest Value</option>
              <option value="LOWEST_VALUE">Lowest Value</option>
            </select>

            <div className="flex gap-2">
              <button onClick={exportCSV} className="h-9 px-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-card flex items-center gap-1.5 transition-colors" title="Export to CSV">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button onClick={printPDF} className="h-9 px-3 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-card flex items-center gap-1.5 transition-colors print:hidden" title="Print to PDF">
                <FileText className="h-3.5 w-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="p-0 lg:p-4 min-h-[400px]">
          {transactions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <Search className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm font-medium">No transactions found matching your criteria.</p>
            </div>
          ) : (
            <>
              {viewMode === 'TABLE' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-dark-border">
                        <th className="px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Qty</th>
                        <th className="px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Price</th>
                        <th className="px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Total</th>
                        <th className="px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-dark-border/50">
                      {transactions.map(tx => (
                        <tr 
                          key={tx._id} 
                          onClick={() => setSelectedTx(tx)}
                          className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {new Date(tx.timestamp).toLocaleString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              tx.action === 'BUY' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                            }`}>
                              {tx.action === 'BUY' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              {tx.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-white">
                            {formatNumber(tx.quantity)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-white">
                            {formatCurrency(tx.executedPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-white">
                            {formatCurrency(tx.quantity * tx.executedPrice)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              tx.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'
                            }`}>
                              {tx.status === 'COMPLETED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === 'TIMELINE' && (
                <div className="px-4 py-8 max-w-2xl mx-auto relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-dark-border before:to-transparent">
                  {transactions.map((tx, idx) => (
                    <div key={tx._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8 last:mb-0">
                      
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-dark-card bg-slate-100 dark:bg-dark-bg shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-slate-500">
                        {tx.action === 'BUY' ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />}
                      </div>

                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white dark:bg-dark-card dark:border-dark-border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTx(tx)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold text-sm ${tx.action === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.action === 'BUY' ? 'Bought' : 'Sold'} {tx.quantity} shares
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-dark-bg px-2 py-1 rounded-lg">
                            {formatCurrency(tx.executedPrice)}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
                          {new Date(tx.timestamp).toLocaleString(undefined, {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-50 dark:border-dark-border/50 pt-2">
                          <span className="text-slate-400">Total Value:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(tx.quantity * tx.executedPrice)}</span>
                        </div>
                      </div>
                      
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'STATS' && (
                <div className="p-4 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Total Buys</div>
                      <div className="text-xl font-black text-slate-800 dark:text-white">{stats.totalBuys}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Total Sells</div>
                      <div className="text-xl font-black text-slate-800 dark:text-white">{stats.totalSells}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Total Shares Bought</div>
                      <div className="text-xl font-black text-slate-800 dark:text-white">{formatNumber(stats.totalSharesBought)}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Total Shares Sold</div>
                      <div className="text-xl font-black text-slate-800 dark:text-white">{formatNumber(stats.totalSharesSold)}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Largest Purchase</div>
                      <div className="text-xl font-black text-emerald-500">{formatCurrency(stats.largestPurchase)}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Largest Sale</div>
                      <div className="text-xl font-black text-rose-500">{formatCurrency(stats.largestSale)}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Net Realized Profit</div>
                      <div className={`text-xl font-black ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                      <div className="text-xs text-slate-400 font-bold mb-1">Net Investment</div>
                      <div className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(stats.netInvestment)}</div>
                    </div>
                  </div>

                  {/* Buy / Sell Chart representation */}
                  <div className="h-64 mt-8 w-full pr-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 ml-4">Buy vs Sell Volume</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Buys', value: stats.totalBuys, shares: stats.totalSharesBought, amount: stats.totalSharesBought * stats.averageBuyPrice },
                          { name: 'Sells', value: stats.totalSells, shares: stats.totalSharesSold, amount: stats.totalSharesSold * stats.averageSellPrice },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                        <Tooltip 
                          formatter={(val, name, props) => {
                            if (name === 'shares') return [formatNumber(val), 'Shares Volume'];
                            return [val, name];
                          }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="shares" name="Total Shares" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination Footer */}
        {transactions.length > 0 && viewMode !== 'STATS' && (
          <div className="p-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50/30 dark:bg-dark-bg/10 print:hidden">
            <span className="text-xs text-slate-500 font-medium">
              Showing {(pagination.page - 1) * 20 + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} trades
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-dark-border">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Transaction Details
                </h3>
                <button onClick={() => setSelectedTx(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-bg dark:hover:text-slate-200 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-100 dark:border-dark-border/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedTx.action === 'BUY' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                      {selectedTx.action === 'BUY' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedTx.action}</div>
                      <div className="font-black text-slate-800 dark:text-white text-lg">{symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(selectedTx.quantity * selectedTx.executedPrice)}</div>
                    <div className="text-xs font-bold text-emerald-500">{selectedTx.status}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-2 border-b border-slate-50 dark:border-dark-border/50">
                    <span className="text-slate-500 dark:text-slate-400">Order ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedTx._id}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-50 dark:border-dark-border/50">
                    <span className="text-slate-500 dark:text-slate-400">Date & Time</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedTx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-50 dark:border-dark-border/50">
                    <span className="text-slate-500 dark:text-slate-400">Quantity</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatNumber(selectedTx.quantity)} shares</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-50 dark:border-dark-border/50">
                    <span className="text-slate-500 dark:text-slate-400">Execution Price</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(selectedTx.executedPrice)} / share</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-50 dark:border-dark-border/50">
                    <span className="text-slate-500 dark:text-slate-400">Simulator Fees (0.1%)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(selectedTx.fees)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-50 dark:border-dark-border/50">
                    <span className="text-slate-500 dark:text-slate-400">Order Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTx.orderType}</span>
                  </div>
                  {selectedTx.action === 'SELL' && (
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-slate-500 dark:text-slate-400">Realized P/L</span>
                      <span className={`font-black ${selectedTx.realizedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {selectedTx.realizedProfit >= 0 ? '+' : ''}{formatCurrency(selectedTx.realizedProfit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-dark-bg border-t border-slate-100 dark:border-dark-border">
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-dark-card dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockTransactionHistory;
