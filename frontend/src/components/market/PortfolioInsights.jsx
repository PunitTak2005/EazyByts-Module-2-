import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, TrendingDown, Briefcase, Activity } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9'];

const PortfolioInsights = ({ portfolio }) => {
  if (!portfolio) return null;

  const holdings = portfolio.holdings || [];
  
  // Calculate best and worst performers
  let best = null;
  let worst = null;
  let largest = null;
  
  holdings.forEach(h => {
    const change = h.currentPrice - h.averagePrice;
    const changePct = (change / h.averagePrice) * 100;
    
    if (!best || changePct > best.pct) best = { ...h, pct: changePct };
    if (!worst || changePct < worst.pct) worst = { ...h, pct: changePct };
    
    const value = h.quantity * h.currentPrice;
    if (!largest || value > largest.val) largest = { ...h, val: value };
  });

  const pieData = holdings.map(h => ({
    name: h.symbol,
    value: h.quantity * h.currentPrice
  })).sort((a, b) => b.value - a.value);

  const totalValue = pieData.reduce((acc, curr) => acc + curr.value, 0);
  const diversification = pieData.map(d => ({
    ...d,
    percent: totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center mb-6">
        <Briefcase size={18} className="mr-2 text-indigo-500" />
        Portfolio Insights
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Largest Holding</div>
            {largest ? (
              <div className="flex justify-between items-end">
                <div className="font-bold text-slate-800 dark:text-slate-100">{largest.symbol}</div>
                <div className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(largest.val)}</div>
              </div>
            ) : <div className="text-sm text-slate-400">None</div>}
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
              <TrendingUp size={14} className="text-emerald-500"/> Best Performer
            </div>
            {best ? (
              <div className="flex justify-between items-end">
                <div className="font-bold text-slate-800 dark:text-slate-100">{best.symbol}</div>
                <div className="font-medium text-emerald-500">+{best.pct.toFixed(2)}%</div>
              </div>
            ) : <div className="text-sm text-slate-400">None</div>}
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
              <TrendingDown size={14} className="text-rose-500"/> Worst Performer
            </div>
            {worst ? (
              <div className="flex justify-between items-end">
                <div className="font-bold text-slate-800 dark:text-slate-100">{worst.symbol}</div>
                <div className="font-medium text-rose-500">{worst.pct.toFixed(2)}%</div>
              </div>
            ) : <div className="text-sm text-slate-400">None</div>}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Allocation</div>
          {pieData.length > 0 ? (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {diversification.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center text-xs">
                    <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-slate-600 dark:text-slate-400">{d.name} {d.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              No holdings to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioInsights;
