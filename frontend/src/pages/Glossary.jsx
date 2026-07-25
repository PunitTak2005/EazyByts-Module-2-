import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { learningService } from '@/services/learningService';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, X, Filter, Sparkles, Layers, SlidersHorizontal } from 'lucide-react';
import GlossaryCard from '@/components/learning/GlossaryCard';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const getTermFirstLetter = (termStr) => {
  if (!termStr || typeof termStr !== 'string') return '';
  const cleanTerm = termStr.trim().replace(/^[^A-Za-z]+/, '');
  return cleanTerm ? cleanTerm[0].toUpperCase() : '';
};

const CATEGORIES = [
  'All',
  'Stock Market',
  'Investing',
  'Trading',
  'Technical Analysis',
  'Banking',
  'Accounting',
  'Economics',
  'Personal Finance',
  'Currency Market',
  'Cryptocurrency',
  'Mutual Funds',
  'ETFs',
  'Taxation',
  'Corporate Finance',
  'Risk Management',
  'Derivatives',
  'Financial Statements'
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const Glossary = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [activeLetter, setActiveLetter] = useState(searchParams.get('letter') ?? 'ALL');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Query all glossary terms from backend/static dataset
  const { data, isLoading } = useQuery({
    queryKey: ['glossary'],
    queryFn: async () => {
      const res = await learningService.getGlossary();
      return { data: res.data || [] };
    },
  });

  const rawTerms = data?.data ?? [];
  const allTerms = useMemo(() => {
    const cleaned = rawTerms.filter((t) => {
      if (!t || !t.term) return false;
      if (t.term.startsWith("Financial Term") || (t.definition && t.definition.includes("procedurally generated"))) {
        return false;
      }
      return true;
    });

    if (cleaned.length > 0) {
      console.log("Glossary API:", data);
      console.log("Loaded Letters:", Array.from(new Set(cleaned.map(t => getTermFirstLetter(t.term)).filter(Boolean))));
      console.log("Filtered Entries:", cleaned.length);
      console.log("Selected Letter:", activeLetter);
      console.log("Search Query:", debouncedSearch);
    }
    return cleaned;
  }, [rawTerms, data, activeLetter, debouncedSearch]);

  // Set of letters that actually have entries
  const availableLetters = useMemo(() => {
    const set = new Set();
    for (const t of allTerms) {
      const l = getTermFirstLetter(t.term);
      if (l) set.add(l);
    }
    return set;
  }, [allTerms]);

  // Filter terms dynamically
  const filteredTerms = useMemo(() => {
    let result = allTerms;

    // Filter by Letter
    if (activeLetter && activeLetter.toUpperCase() !== 'ALL') {
      const L = activeLetter.toUpperCase();
      result = result.filter(
        (t) => getTermFirstLetter(t.term) === L
      );
    }

    // Filter by Category
    if (activeCategory !== 'All') {
      result = result.filter(
        (t) => t.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Filter by Difficulty
    if (activeDifficulty !== 'All') {
      result = result.filter(
        (t) => t.difficulty?.toLowerCase() === activeDifficulty.toLowerCase()
      );
    }

    // Filter by Search Query
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.term?.toLowerCase().includes(q) ||
          t.definition?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          (t.example && t.example.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allTerms, activeLetter, activeCategory, activeDifficulty, debouncedSearch]);

  const handleTermClick = (termName) => {
    setSearch(termName);
    setActiveLetter('ALL');
    setActiveCategory('All');
    setActiveDifficulty('All');
  };

  const clearFilters = () => {
    setSearch('');
    setActiveLetter('ALL');
    setActiveCategory('All');
    setActiveDifficulty('All');
    setSearchParams({});
  };

  // Group terms by first letter for A-Z view dynamically
  const grouped = useMemo(() => {
    if (debouncedSearch || activeLetter !== 'ALL' || activeCategory !== 'All' || activeDifficulty !== 'All') {
      return null;
    }

    const sortedTerms = [...filteredTerms]
      .filter(Boolean)
      .sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }));

    return sortedTerms.reduce((acc, item) => {
      const letter = getTermFirstLetter(item.term);
      if (!letter) return acc;

      if (!acc[letter]) acc[letter] = [];

      if (!acc[letter].some(existing => existing.term.toLowerCase() === item.term.toLowerCase())) {
        acc[letter].push(item);
      }

      return acc;
    }, {});
  }, [filteredTerms, debouncedSearch, activeLetter, activeCategory, activeDifficulty]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/80 backdrop-blur-md shadow-inner text-white">
              <BookOpen size={24} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                A–Z Financial Knowledge Base
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Finance & Stock Market Glossary
              </h1>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Explore <strong className="text-blue-300 font-bold">{allTerms.length}+</strong> comprehensive financial, market, investing, and economic definitions with real-world examples and related concepts.
          </p>
        </div>
      </motion.div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search terms, definitions, categories, e.g., 'Dividend', 'Options', 'XIRR', 'Arbitrage'..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card pl-12 pr-12 py-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            aria-label="Search glossary terms"
          />
          {(search || activeLetter !== 'ALL' || activeCategory !== 'All' || activeDifficulty !== 'All') && (
            <button
              onClick={clearFilters}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg"
              aria-label="Clear filters"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>

        {/* Category & Difficulty Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 shadow-sm">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
              <Layers size={14} className="text-blue-500" /> Category:
            </div>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
              <SlidersHorizontal size={14} className="text-indigo-500" /> Difficulty:
            </div>
            <div className="flex items-center gap-1">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setActiveDifficulty(diff)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeDifficulty === diff
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alphabet Navigation Bar */}
        <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Alphabet Index
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Showing {filteredTerms.length} of {allTerms.length} terms
            </span>
          </div>

          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Filter by letter"
          >
            <button
              onClick={() => setActiveLetter('ALL')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                activeLetter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600'
              }`}
            >
              ALL
            </button>
            {ALPHABET.map((letter) => {
              const hasEntries = availableLetters.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => {
                    setActiveLetter(activeLetter === letter ? 'ALL' : letter);
                  }}
                  aria-pressed={activeLetter === letter}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                    activeLetter === letter
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : hasEntries
                      ? 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600'
                      : 'bg-slate-100/50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content View ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredTerms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8"
        >
          <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-200 font-bold text-lg">
            {allTerms.length === 0 ? 'No glossary terms available.' : 'No glossary terms matched your query'}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-4">
            {allTerms.length === 0 ? 'The real glossary dataset could not be loaded.' : 'Try adjusting your search keywords, letter index, or category filter.'}
          </p>
          {allTerms.length > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition-all"
            >
              Reset All Filters
            </button>
          )}
        </motion.div>
      ) : grouped ? (
        // Grouped A-Z Master View
        <div className="space-y-10">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, letterTerms]) => (
              <div key={letter} id={`letter-${letter}`}>
                <div className="flex items-center gap-3 mb-4 sticky top-4 z-10 bg-slate-50/90 dark:bg-dark-bg/90 backdrop-blur-md py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-base font-black shadow-md">
                    {letter}
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {letterTerms.length} terms
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {letterTerms.map((term) => (
                    <GlossaryCard
                      key={term._id}
                      term={term.term}
                      category={term.category}
                      difficulty={term.difficulty}
                      definition={term.definition}
                      example={term.example}
                      relatedTerms={term.relatedTerms}
                      searchQuery={debouncedSearch}
                      onTermClick={handleTermClick}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        // Flat Filtered Results View
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredTerms.map((term) => (
            <motion.div
              key={term._id}
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            >
              <GlossaryCard
                term={term.term}
                category={term.category}
                difficulty={term.difficulty}
                definition={term.definition}
                example={term.example}
                relatedTerms={term.relatedTerms}
                searchQuery={debouncedSearch}
                onTermClick={handleTermClick}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Glossary;
