import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import { 
  TrendingUp, 
  ShieldAlert, 
  PieChart as PieIcon, 
  Smartphone, 
  Activity, 
  ArrowRight, 
  Briefcase,
  Play,
  Globe,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import api from '@/services/api.js';
import ThemeToggle from '@/components/ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const [headlines, setHeadlines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchHeadlines = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await api.get('/news/headlines');
      const data = response?.data ?? response;
      const list = Array.isArray(data) ? data : (data?.data || []);
      if (!list || list.length === 0) {
        setError(true);
        setHeadlines([]);
      } else {
        setHeadlines(list);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }
      console.error('Headlines fetch error on landing page:', err);
      setError(true);
      setHeadlines([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadlines();
    const interval = setInterval(fetchHeadlines, 60000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const duplicatedHeadlines = headlines.length > 0 && headlines.length < 8
    ? [...headlines, ...headlines, ...headlines]
    : headlines;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-dark-text bg-grid-pattern transition-colors duration-300">
      
      {/* 1. Header Marquee Ticker - Yahoo Finance Live News */}
      <div className="w-full bg-slate-950 py-2.5 overflow-hidden border-b border-slate-900 min-h-[44px]">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
            <span>Loading market headlines...</span>
          </div>
        ) : error || !headlines || headlines.length === 0 ? (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-400 py-1">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Unable to load market headlines</span>
          </div>
        ) : (
          <div className="flex items-center whitespace-nowrap">
            <Marquee
              play={headlines.length > 0}
              speed={50}
              direction="left"
              gradient={false}
            >
              {duplicatedHeadlines.map((item, i) => (
                <a
                  key={`${item.link || item.title}-${i}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-1.5 mx-3 rounded-xl border border-slate-800 bg-slate-900/90 text-xs font-medium text-slate-200 hover:border-blue-500/50 hover:text-white transition-all flex-shrink-0 select-none group"
                >
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-black text-blue-400 border border-blue-500/20">
                    <Globe className="h-3 w-3" />
                    <span>{item.symbol || 'MARKET'}</span>
                  </span>
                  <span className="font-semibold text-slate-100 group-hover:text-blue-300 transition-colors max-w-md truncate">
                    {item.title}
                  </span>
                  {item.publisher && (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.publisher}
                    </span>
                  )}
                </a>
              ))}
            </Marquee>
          </div>
        )}
      </div>

      {/* 2. Top Navigation Bar */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            TickerSim
          </span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle variant="compact" />
          <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/20">
            Get Started
          </Link>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-24 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 mb-6">
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">100% Risk-Free Trading Practice</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white font-sans mb-6">
            Master the Stock Market with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Virtual Capital
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice paper-trading with ₹10,00,000 virtual balance. Track real-time prices, analyze technical indicators, build watchlists, and test custom strategies without financial risk.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white hover:bg-blue-500 shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all">
              Start Practice Trading <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <Play className="h-4 w-4 fill-current text-slate-400" /> Explore Dashboard
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Visual mockups */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-200 dark:border-dark-border shadow-2xl bg-white dark:bg-dark-card"
        >
          <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-dark-border">
            <span className="h-3.5 w-3.5 rounded-full bg-rose-500" />
            <span className="h-3.5 w-3.5 rounded-full bg-amber-500" />
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
            <span className="ml-4 text-xs font-semibold text-slate-400">TickerSim Live Trading Panel</span>
          </div>
          <div className="p-4 sm:p-8 bg-slate-900 text-left overflow-x-auto">
            <div className="min-w-[600px] text-slate-300 font-mono text-sm space-y-4">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-500 text-xs">
                <span>STOCK</span>
                <span>LIVE PRICE</span>
                <span>24H CHANGE</span>
                <span>VOLUMES</span>
                <span>SIMULATED SECTOR</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="font-bold text-white">NVDA (NVIDIA Corp)</span>
                <span>₹875.40</span>
                <span className="text-emerald-400 font-semibold">+4.23%</span>
                <span>2.8M</span>
                <span className="text-blue-400">Technology</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="font-bold text-white">AAPL (Apple Inc)</span>
                <span>₹185.50</span>
                <span className="text-rose-400 font-semibold">-0.82%</span>
                <span>1.4M</span>
                <span className="text-blue-400">Technology</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="font-bold text-white">TSLA (Tesla Inc)</span>
                <span>₹178.60</span>
                <span className="text-emerald-400 font-semibold">+1.95%</span>
                <span>840K</span>
                <span className="text-amber-400">Automotive</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. Features Section */}
      <section className="bg-white dark:bg-dark-card/50 py-20 border-y border-slate-200 dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Everything You Need to Practice Professional Trading
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Hone your execution mechanics, test portfolio allocations, and see statistics change with mock execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card hover:shadow-xl transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Simulated Trading Engine</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Submit mock MARKET and LIMIT orders. Check cash boundaries, calculate custom broker fees, and watch prices update dynamically in real time.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card hover:shadow-xl transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Portfolio Management</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Track virtual cash balances, investments, live holdings valuation, today's returns, and overall gains in a unified tracking layout.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card hover:shadow-xl transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <PieIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Rich Asset Analytics</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Visualize capital allocations using Pie Charts, examine historical returns, and inspect detailed win-loss metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Warning Disclaimer Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-950/20 text-left flex items-start gap-4">
          <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 dark:text-amber-500">Virtual Simulation Notice</h4>
            <p className="text-sm text-amber-700 dark:text-amber-600/90 mt-1 leading-relaxed">
              TickerSim is a virtual paper trading simulator for educational purposes only. No real capital, actual transactions, or bank assets are processed. Stock prices are generated mathematically using real-world stock parameters as starting nodes.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-slate-200 dark:border-dark-border py-12 text-center text-xs text-slate-400 dark:bg-dark-bg">
        <p className="mb-2">© 2026 TickerSim Simulator Platform. Built with React 19 & Tailwind.</p>
        <p>This is a virtual project showcasing advanced full-stack trading implementations.</p>
      </footer>

    </div>
  );
};

export default LandingPage;
