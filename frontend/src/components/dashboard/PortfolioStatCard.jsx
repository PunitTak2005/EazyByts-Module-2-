import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const PortfolioStatCard = ({ 
  title, 
  value, 
  subtitle, 
  subtitleValue,
  trend,
  icon: Icon,
  trendLabel 
}) => {
  // Determine if positive, negative, or neutral based on string starting with '-'
  // The 'trend' prop here will be a pre-formatted string (e.g. "+20.10%" or "-5.32%")
  // But wait, the prompt says trend indicates % change, we should evaluate if positive or negative
  // It's safer to check if the string starts with '-' or '+'
  
  let isPositive = false;
  let isNegative = false;
  
  if (typeof trend === 'string') {
    if (trend.startsWith('+')) isPositive = true;
    else if (trend.startsWith('-')) isNegative = true;
  } else if (typeof trend === 'number') {
    if (trend > 0) isPositive = true;
    else if (trend < 0) isNegative = true;
  }

  // Set colors based on trend
  let accentGradient = 'from-slate-400 to-slate-500';
  let badgeClasses = 'bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400';
  let iconBg = 'bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400';

  if (isPositive) {
    accentGradient = 'from-emerald-500 to-teal-600';
    badgeClasses = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    iconBg = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
  } else if (isNegative) {
    accentGradient = 'from-rose-500 to-red-600';
    badgeClasses = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    iconBg = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
  } else if (title === "Net Worth" || title === "Available Cash") {
    // Special colors for neutral/non-trending cards
    accentGradient = 'from-blue-500 to-indigo-600';
    iconBg = 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
  }

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-[18px] dark:border-dark-border dark:bg-dark-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[120px] group"
    >
      {/* Accent Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${accentGradient} group-hover:w-2 transition-all duration-300`} />
      
      <div className="flex items-center justify-between text-slate-400 mb-1.5">
        <span className="text-[clamp(13px,1.5vw,15px)] font-medium tracking-wide pl-1.5 text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`rounded-full p-1.5 ${iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="text-[length:clamp(1.4rem,2vw,1.75rem)] leading-tight font-bold text-slate-800 dark:text-white pl-1.5 mb-1 break-words whitespace-normal">
        {value}
      </div>

      <div className="mt-2 flex items-center justify-between pl-1.5 flex-wrap gap-2">
        {trend !== undefined && trend !== null ? (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[14px] font-semibold leading-none ${badgeClasses}`}>
            {isPositive && <ArrowUpRight className="h-4 w-4" />}
            {isNegative && <ArrowDownRight className="h-4 w-4" />}
            {trend}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[14px] font-semibold leading-none ${badgeClasses}`}>
            {subtitleValue}
          </span>
        )}
        
        {trendLabel && (
          <span className="text-[13px] text-slate-400 dark:text-slate-500 font-medium">
            {trendLabel}
          </span>
        )}
        
        {!trendLabel && subtitle && (
          <span className="text-[13px] text-slate-400 dark:text-slate-500 font-medium">
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default PortfolioStatCard;
