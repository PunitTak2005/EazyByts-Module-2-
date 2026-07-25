import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, RefreshCw, X, ArrowUpRight, ArrowDownRight, AlertCircle, Check, Plus, FolderSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import stockService from '@/services/stockService';
import { watchlistService } from '@/services/watchlistService';
import { formatCurrency, formatVolume, formatPercent, formatLargeNumber, isValidStockData } from '@/utils/formatters.js';

const STOCKS_PER_PAGE = 48; // Divisible by 1, 2, 3, and 4 (matches our grid columns)

// Highlight component for search matching
const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-slate-900 dark:text-white rounded-sm px-0.5">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const StockExplorer = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const urlPage = parseInt(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const searchInputRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1); // Reset to page 1 on new search
      
      const params = new URLSearchParams(searchParams);
      if (searchInput) params.set('q', searchInput);
      else params.delete('q');
      params.set('page', '1');
      setSearchParams(params, { replace: true });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchParams, setSearchParams]);

  // Sync URL page to state
  useEffect(() => {
    setCurrentPage(urlPage);
  }, [urlPage]);

  // Fetch all stocks once
  const { data: allStocks = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['all-stocks'],
    queryFn: stockService.getAllStocks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch watchlists to know where to add
  const { data: watchlists = [] } = useQuery({
    queryKey: ['watchlists'],
    queryFn: watchlistService.getWatchlists,
  });

  // Watchlist Mutation
  const defaultWatchlist = watchlists.length > 0 ? watchlists[0] : null;
  const toggleWatchlistMutation = useMutation({
    mutationFn: async ({ symbol, isAdded }) => {
      if (!defaultWatchlist) throw new Error('No watchlist available');
      if (isAdded) {
        return watchlistService.removeStockFromWatchlist(defaultWatchlist._id, symbol);
      } else {
        return watchlistService.addStockToWatchlist(defaultWatchlist._id, symbol);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlists']);
    }
  });

  // Client-side filtering & validation
  const filteredStocks = useMemo(() => {
    const validOnly = allStocks.filter(isValidStockData);
    if (!debouncedSearch) return validOnly;
    
    const query = debouncedSearch.toLowerCase().trim();
    return validOnly.filter(stock => 
      stock.symbol.toLowerCase().includes(query) ||
      (stock.companyName && stock.companyName.toLowerCase().includes(query)) ||
      (stock.name && stock.name.toLowerCase().includes(query))
    );
  }, [allStocks, debouncedSearch]);

  // Pagination
  const totalPages = Math.ceil(filteredStocks.length / STOCKS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  
  const paginatedStocks = useMemo(() => {
    const startIndex = (safePage - 1) * STOCKS_PER_PAGE;
    return filteredStocks.slice(startIndex, startIndex + STOCKS_PER_PAGE);
  }, [filteredStocks, safePage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    document.getElementById('stock-grid-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchInput('');
    searchInputRef.current?.focus();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current) {
        if (filteredStocks.length > 0) {
          navigate(`/stocks/${filteredStocks[0].symbol}`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredStocks, navigate]);

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unable to load stock data.</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Please try again.</p>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <main className="stocks-page">
      
      {/* Sticky Search Header (Flex Shrink 0) */}
      <header className="stocks-search-header">
        <div className="relative group max-w-4xl mx-auto">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by company name or stock symbol..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={isLoading && !isFetching}
            aria-label="Search stocks"
            className="w-full rounded-2xl border border-slate-200/80 bg-white py-4 pl-12 pr-12 text-[15px] font-semibold text-slate-800 shadow-sm outline-none ring-4 ring-transparent focus:border-blue-500 focus:ring-blue-500/10 dark:border-dark-border dark:bg-dark-card dark:text-white dark:focus:border-blue-500 transition-all disabled:opacity-50"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchInput !== debouncedSearch && (
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            )}
            {searchInput && (
              <button 
                onClick={clearSearch}
                aria-label="Clear search"
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Result Count */}
        <div className="mt-3 flex justify-between items-center px-1 max-w-4xl mx-auto">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isLoading && allStocks.length === 0 ? 'Loading market data...' : searchInput ? `${filteredStocks.length} matching stocks` : `Showing ${allStocks.length} Stocks`}
          </p>
          {debouncedSearch && filteredStocks.length > 0 && (
            <p className="text-[10px] font-bold text-slate-400 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded mx-1 font-mono text-slate-500 dark:text-slate-400">Enter</kbd> to open first result
            </p>
          )}
        </div>
      </header>

      {/* Scrollable Main Content Area */}
      <section id="stock-grid-scroll-container" className="stocks-content">
        {isLoading && allStocks.length === 0 ? (
          <div className="stock-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="stock-card animate-pulse">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-dark-border">
                  <div className="h-9 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-9 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStocks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-slate-200 py-24 text-center bg-white dark:border-dark-border dark:bg-dark-card shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <FolderSearch className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No matching stocks found</h3>
            <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm">We couldn't find any stocks matching "{debouncedSearch}". Try another company name or stock symbol.</p>
            <button 
              onClick={clearSearch}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl transition-colors shadow-sm"
            >
              Clear Search
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={safePage + debouncedSearch}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="stock-grid"
            >
              {paginatedStocks.map((stock) => {
                const change = stock.change !== undefined ? stock.change : (stock.prevClose ? stock.price - stock.prevClose : 0);
                const changePercent = stock.changePercent !== undefined ? stock.changePercent : (stock.prevClose ? (change / stock.prevClose) * 100 : 0);
                const isPositive = change >= 0;
                const isAdded = defaultWatchlist?.stocks?.some(s => s.symbol === stock.symbol);

                return (
                  <motion.div 
                    variants={itemVariants}
                    key={stock.symbol} 
                    className="stock-card group relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3 overflow-hidden">
                        {/* Avatar */}
                        <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm flex-shrink-0">
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-slate-800 dark:text-white text-base truncate" title={stock.companyName || stock.name || stock.symbol}>
                              <HighlightText text={stock.companyName || stock.name || stock.symbol} highlight={debouncedSearch} />
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              <HighlightText text={stock.symbol} highlight={debouncedSearch} />
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {stock.exchange || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics Center */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xl font-black text-slate-900 dark:text-white mb-0.5">
                          {formatCurrency(stock.price)}
                        </div>
                        <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />}
                          {formatCurrency(change)} ({formatPercent(changePercent)})
                        </div>
                      </div>
                    </div>

                    {/* Badges Right (Pills) */}
                    <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                      {stock.sector && stock.sector !== 'Equities' && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg truncate max-w-full">
                          {stock.sector}
                        </span>
                      )}
                      {stock.marketCap > 0 && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg">
                          Cap: {formatLargeNumber(stock.marketCap)}
                        </span>
                      )}
                      {stock.volume > 0 && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg">
                          Vol: {formatLargeNumber(stock.volume)}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 border-t border-slate-100 dark:border-dark-border pt-4">
                      <Link 
                        to={`/stocks/${stock.symbol}`}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl text-center transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card"
                      >
                        View Details
                      </Link>
                      <button 
                        onClick={() => toggleWatchlistMutation.mutate({ symbol: stock.symbol, isAdded })}
                        disabled={toggleWatchlistMutation.isPending && toggleWatchlistMutation.variables?.symbol === stock.symbol}
                        className={`flex-1 px-4 py-2 border text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card
                          ${isAdded 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40' 
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                      >
                        {toggleWatchlistMutation.isPending && toggleWatchlistMutation.variables?.symbol === stock.symbol ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Watchlist
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && !isLoading && filteredStocks.length > 0 && (
          <div className="flex items-center justify-between pt-8 pb-8 max-w-4xl mx-auto">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:block">
              Showing {(safePage - 1) * STOCKS_PER_PAGE + 1} to {Math.min(safePage * STOCKS_PER_PAGE, filteredStocks.length)} of {filteredStocks.length}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 px-3 min-w-[4rem] text-center">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                aria-label="Next page"
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default StockExplorer;
