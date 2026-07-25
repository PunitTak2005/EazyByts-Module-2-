import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { watchlistService } from '@/services/watchlistService';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Eye, Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, 
  FolderPlus, FolderClosed, ShoppingCart, TrendingUp, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext.jsx';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';
import Skeleton from '@/components/ui/Skeleton';

// Removed fetchWatchlists because we use watchlistService directly

const WatchlistPage = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const [activeWatchlistIdx, setActiveWatchlistIdx] = useState(0);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  // Search autocomplete in watchlist page
  const [stockSearchQ, setStockSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Escape key down listener to close search modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };
    if (showSearchModal) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearchModal]);

  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['watchlists'],
    queryFn: watchlistService.getWatchlists,
  });

  const watchlists = data ?? [];
  const activeWatchlist = watchlists[activeWatchlistIdx] || null;

  useEffect(() => {
    if (!socket) return;

    const handleTick = () => {
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    };

    socket.on('prices_tick', handleTick);

    return () => {
      socket.off('prices_tick', handleTick);
    };
  }, [socket, queryClient]);



  // Create new watchlist
  const handleCreateWatchlist = async (e) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    try {
      await watchlistService.createWatchlist(newWatchlistName.trim());
      toast.success(`Created watchlist "${newWatchlistName}"`);
      setNewWatchlistName('');
      setShowCreateInput(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create watchlist');
    }
  };

  // Delete entire watchlist
  const handleDeleteWatchlist = async (id, name) => {
    if (!window.confirm(`Delete watchlist "${name}"?`)) return;
    try {
      await watchlistService.deleteWatchlist(id);
      toast.success(`Watchlist "${name}" deleted`);
      setActiveWatchlistIdx(0);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete watchlist');
    }
  };

  // Remove stock from watchlist
  const handleRemoveStock = async (wlId, sym) => {
    try {
      await watchlistService.removeStockFromWatchlist(wlId, sym);
      toast.success(`Removed ${sym} from watchlist`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove stock');
    }
  };

  // Search stock autocomplete
  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setStockSearchQ(q);
    if (q.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/stocks/search/autocomplete?q=${q}`);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Add stock from modal
  const handleAddStockFromSearch = async (sym) => {
    if (!activeWatchlist) return;
    try {
      await watchlistService.addStockToWatchlist(activeWatchlist._id, sym);
      toast.success(`Added ${sym} to ${activeWatchlist.name}`);
      setShowSearchModal(false);
      setStockSearchQ('');
      setSearchResults([]);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="md:col-span-3 h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white dark:bg-dark-card border border-rose-200 dark:border-rose-900/30">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Unable to load watchlists.</h2>
        <button onClick={() => refetch()} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 shadow-md">
          Retry
        </button>
      </div>
    );
  }

  if (watchlists.length === 0 && !showCreateInput) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm">
        <FolderClosed className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No watchlists created yet.</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create your first watchlist to track your favorite stocks.</p>
        
        <div className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="text"
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            placeholder="New Watchlist Name..."
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-dark-bg"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateWatchlist(e)}
          />
          <button 
            onClick={handleCreateWatchlist}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-md transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create Watchlist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* ADD STOCK SEARCH MODAL */}
      <AnimatePresence>
        {showSearchModal && activeWatchlist && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Add Stock to {activeWatchlist.name}</h3>
                <button onClick={() => setShowSearchModal(false)} className="text-xs text-slate-400 font-semibold hover:underline">
                  Close
                </button>
              </div>

              <div className="relative mb-4">
                <label htmlFor="watchlist-search-input" className="sr-only">Search Stocks to Add</label>
                <input
                  id="watchlist-search-input"
                  type="text"
                  placeholder="Type symbol or name..."
                  value={stockSearchQ}
                  onChange={handleSearchChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-blue-500"
                />
                <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                    {stockSearchQ ? 'No stocks match your query' : 'Type to search simulated assets'}
                  </div>
                ) : (
                  searchResults.map(stock => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleAddStockFromSearch(stock.symbol)}
                      className="flex w-full items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 hover:bg-slate-50 dark:bg-dark-bg/25 dark:hover:bg-dark-bg text-left text-xs font-semibold"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{stock.symbol}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{stock.name}</div>
                      </div>
                      <span className="text-blue-500 font-bold">+ Add Ticker</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Watchlists Manager</h1>
          <p className="text-xs text-slate-400">Track and monitor your favorite securities.</p>
        </div>
        <button 
          onClick={async () => {
            await refetch();
            toast.success('Watchlists refreshed');
          }}
          disabled={isRefetching}
          className="flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Watchlists
        </button>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        
        {/* Left Column - Watchlist lists */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-dark-border">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <FolderClosed className="h-4 w-4" />
              Watchlists
            </h2>
            <button
              onClick={() => setShowCreateInput(!showCreateInput)}
              className="rounded-lg p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 hover:scale-105 transition-all"
              title="New Watchlist"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>

          {/* New watchlist input form */}
          {showCreateInput && (
            <form onSubmit={handleCreateWatchlist} className="space-y-2">
              <input
                type="text"
                placeholder="List name..."
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none dark:border-dark-border dark:bg-dark-bg dark:text-dark-text focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-grow rounded-lg bg-blue-600 py-1.5 text-[10px] font-bold text-white hover:bg-blue-500"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateInput(false)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-400 dark:border-dark-border dark:bg-dark-card"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* List items */}
          <div className="space-y-1.5">
            {watchlists?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No watchlists created</div>
            ) : (
              watchlists?.map((wl, idx) => (
                <button
                  key={wl._id}
                  onClick={() => setActiveWatchlistIdx(idx)}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-xs font-bold transition-all ${
                    activeWatchlistIdx === idx 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{wl.name}</span>
                  <span className="rounded bg-slate-200/50 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {wl.symbols.length}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Active list items */}
        <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
          {activeWatchlist ? (
            <>
              {/* Watchlist Header info */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-dark-border">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    {activeWatchlist.name}
                  </h2>
                  <p className="text-xs text-slate-400">Contains {activeWatchlist.symbols.length} ticker(s).</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md"
                  >
                    <Plus className="h-4 w-4" /> Add Stock
                  </button>
                  <button
                    onClick={() => handleDeleteWatchlist(activeWatchlist._id, activeWatchlist.name)}
                    className="rounded-xl border border-slate-200 p-2 text-rose-500 hover:bg-rose-50 dark:border-dark-border dark:hover:bg-rose-950/20"
                    title="Delete Watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Watched stocks lists */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Ticker</th>
                      <th className="py-3 px-2">Sector</th>
                      <th className="py-3 px-2">Live Price</th>
                      <th className="py-3 px-2">24H Change</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium">
                    {activeWatchlist.stocks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-16 text-center text-slate-400">
                          This watchlist has no stocks. Click "+ Add Stock" to watch your first ticker.
                        </td>
                      </tr>
                    ) : (
                      activeWatchlist.stocks.map((stock) => {
                        const isUp = stock.changePercent >= 0;
                        return (
                          <tr key={stock.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="py-3.5 px-2">
                              <Link to={`/stocks/${stock.symbol}`} className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                                {stock.symbol}
                              </Link>
                              <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">{stock.name}</div>
                            </td>
                            <td className="py-3.5 px-2 text-slate-500 dark:text-slate-400 uppercase text-[10px]">{stock.sector}</td>
                            <td className="py-3.5 px-2 font-bold text-slate-800 dark:text-white">{formatCurrency(stock.price)}</td>
                            <td className="py-3.5 px-2">
                              <div className={`flex items-center font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isUp ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
                                {formatPercent(stock.changePercent)}
                              </div>
                            </td>
                            <td className="py-3.5 px-2 text-right flex justify-end gap-2">
                              <Link 
                                to={`/stocks/${stock.symbol}`} 
                                className="flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-1.5 text-[10px] font-bold"
                              >
                                <ShoppingCart className="h-3 w-3" /> Trade
                              </Link>
                              <button
                                onClick={() => handleRemoveStock(activeWatchlist._id, stock.symbol)}
                                className="rounded-lg border border-slate-200 p-1.5 text-rose-500 hover:bg-rose-50 dark:border-dark-border dark:hover:bg-rose-950/10"
                                title="Remove Stock"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              Create a watchlist in the left sidebar to get started.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default WatchlistPage;
