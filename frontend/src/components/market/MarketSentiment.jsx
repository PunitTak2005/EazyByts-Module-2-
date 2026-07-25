import React from 'react';
import { Compass } from 'lucide-react';

const MarketSentiment = ({ score, label }) => {
  // score is 0 to 100
  const normalizedScore = Math.max(0, Math.min(100, score || 50));
  
  // Calculate rotation for the needle (-90 to +90 degrees)
  const rotation = -90 + (normalizedScore / 100) * 180;
  
  let color = 'text-slate-500';
  let barColor = 'bg-slate-500';
  
  if (label === 'Bullish') {
    color = 'text-emerald-500';
    barColor = 'bg-emerald-500';
  } else if (label === 'Bearish') {
    color = 'text-rose-500';
    barColor = 'bg-rose-500';
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center h-full">
      <div className="flex items-center gap-2 mb-6">
        <Compass className={color} size={24} />
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Market Sentiment</h3>
      </div>

      <div className="relative w-48 h-24 overflow-hidden mb-2">
        {/* Semi-circle background */}
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-slate-100 dark:border-slate-800"></div>
        
        {/* Colored arcs */}
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-transparent border-t-rose-500 border-l-rose-500 transform -rotate-45" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)' }}></div>
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-transparent border-t-slate-400" style={{ clipPath: 'polygon(25% 0, 75% 0, 75% 25%, 25% 25%)' }}></div>
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-transparent border-t-emerald-500 border-r-emerald-500 transform rotate-45" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }}></div>

        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-1 h-20 bg-slate-800 dark:bg-slate-200 origin-bottom transform transition-transform duration-1000 ease-out"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-slate-800 dark:bg-slate-200"></div>
        </div>
        
        {/* Center Pivot */}
        <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-slate-800 dark:bg-slate-200 z-10"></div>
      </div>

      <div className="mt-4">
        <div className={`text-2xl font-black tracking-tight ${color}`}>{label}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Score: {normalizedScore}/100</div>
      </div>
    </div>
  );
};

export default MarketSentiment;
