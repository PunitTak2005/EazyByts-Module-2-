import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { formatCurrency } from '@/utils/formatters';

const GlobalIndices = ({ indices }) => {
  if (!indices || indices.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="flex gap-4" style={{ width: 'max-content' }}>
        {indices.map((idx, i) => {
          const isPositive = idx.changePercent >= 0;
          const chartData = idx.sparkline?.map((price, index) => ({ index, price })) || [];

          return (
            <div 
              key={i} 
              className="min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{idx.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{idx.symbol}</p>
                </div>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                    {idx.currentPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {isPositive ? '+' : ''}{idx.changePercent?.toFixed(2)}%
                  </div>
                </div>
                
                {/* Mini Sparkline */}
                {chartData.length > 0 && (
                  <div className="w-16 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke={isPositive ? '#10b981' : '#f43f5e'} 
                          strokeWidth={1.5} 
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalIndices;
