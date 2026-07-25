import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import AnimatedBackground from '@/components/auth/AnimatedBackground';

const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
      <CheckCircle className="h-3 w-3 font-bold" />
    </div>
    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-350">{text}</span>
  </div>
);

const AnimatedChart = () => (
  <div className="w-full flex items-center justify-center p-4 border border-slate-200/40 bg-white/30 dark:border-dark-border/20 dark:bg-dark-card/10 backdrop-blur-sm rounded-2xl relative overflow-hidden shadow-inner select-none">
    {/* Grid backdrop */}
    <div className="absolute inset-0 bg-grid-pattern opacity-5" />
    <svg className="w-full max-w-xs h-24 z-10" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      <line x1="0" y1="40" x2="400" y2="40" stroke="currentColor" strokeOpacity="0.03" strokeWidth="1" />
      <line x1="0" y1="90" x2="400" y2="90" stroke="currentColor" strokeOpacity="0.03" strokeWidth="1" />
      <line x1="0" y1="140" x2="400" y2="140" stroke="currentColor" strokeOpacity="0.03" strokeWidth="1" />
      
      {/* Chart Fill area */}
      <path
        d="M 0 150 C 50 110, 80 180, 130 90 C 180 30, 220 140, 270 70 C 320 20, 350 80, 400 30 L 400 200 L 0 200 Z"
        fill="url(#chartGradient)"
      />
      
      {/* Animated Path */}
      <motion.path
        d="M 0 150 C 50 110, 80 180, 130 90 C 180 30, 220 140, 270 70 C 320 20, 350 80, 400 30"
        stroke="url(#lineGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
    </svg>
  </div>
);

const AuthLayout = ({ children, title, subtitle, footerLinkText, footerLinkUrl, footerText }) => {
  return (
    <div className="relative h-screen min-h-screen w-full flex flex-col lg:flex-row overflow-hidden font-sans select-none bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-dark-text transition-colors duration-300">
      <AnimatedBackground />

      {/* Floating Theme toggle in top corner */}
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle variant="compact" />
      </div>

      {/* Left panel: branding & features - DESKTOP ONLY */}
      <div className="hidden lg:flex lg:w-[38%] xl:w-[32%] flex-col justify-between p-8 border-r border-slate-200/50 dark:border-dark-border/20 bg-white/20 dark:bg-dark-card/5 backdrop-blur-lg h-full max-h-screen flex-shrink-0">
        {/* Branding header */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/landing" className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">
            TickerSim
          </Link>
        </div>

        {/* Center content */}
        <div className="my-auto space-y-5 max-w-sm flex-shrink">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-1.5"
          >
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
              Master the Markets <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Without the Risk.</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Join thousands of traders building their skill with virtual capital and real-time live simulation feeds.
            </p>
          </motion.div>

          <AnimatedChart />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-1 gap-2 pt-1"
          >
            <FeatureItem text="₹10,00,000 starting virtual capital" />
            <FeatureItem text="Real-time simulated market feeds" />
            <FeatureItem text="Advanced comparison charts" />
          </motion.div>
        </div>

        {/* Footer info label */}
        <div className="text-[9px] text-slate-400 dark:text-dark-muted font-bold flex-shrink-0">
          © {new Date().getFullYear()} TickerSim Inc. Paper Trading Desk.
        </div>
      </div>

      {/* Right panel: centering auth card container */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 lg:p-10 h-full max-h-screen overflow-y-auto lg:overflow-hidden select-none relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-[400px] md:max-w-[420px] flex flex-col items-center justify-center"
        >
          {/* Tablet/Mobile Logo/Header Section */}
          <div className="flex lg:hidden flex-col items-center mb-3.5 text-center">
            <div className="flex items-center gap-1.5 justify-center mb-0.5">
              <Link to="/landing" className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                TickerSim
              </Link>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-450">
              Master the Markets Without the Risk.
            </p>
          </div>

          {/* Card body wrapper */}
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white/80 dark:border-dark-border dark:bg-dark-card/85 backdrop-blur-xl p-5 md:p-6 shadow-2xl transition-all duration-300 hover:shadow-blue-500/[0.01]">
            {/* Header info */}
            <div className="mb-4.5 text-center sm:text-left">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white leading-snug">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[10px] font-semibold text-slate-450 dark:text-dark-muted">{subtitle}</p>}
            </div>

            {children}

            {/* Switch view footer */}
            {footerText && (
              <div className="mt-4.5 text-center text-xs font-semibold text-slate-400 dark:text-dark-muted border-t border-slate-100/80 dark:border-dark-border/40 pt-3.5">
                {footerText}{' '}
                <Link to={footerLinkUrl} className="text-blue-600 dark:text-blue-500 hover:underline">
                  {footerLinkText}
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
