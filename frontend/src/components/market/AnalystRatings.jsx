import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';

const COLORS = {
  'Strong Buy': '#10b981', // emerald-500
  'Buy': '#34d399', // emerald-400
  'Hold': '#94a3b8', // slate-400
  'Sell': '#fb7185', // rose-400
  'Strong Sell': '#f43f5e' // rose-500
};

const AnalystRatings = ({ ratings }) => {
  if (!ratings || ratings.length === 0) return null;

  const total = ratings.reduce((acc, curr) => acc + curr.count, 0);

  const data = ratings.map(r => ({
    name: r.rating,
    value: r.count
  }));

  // Calculate consensus
  let highest = { name: 'Hold', value: 0 };
  data.forEach(d => {
    if (d.value > highest.value) highest = d;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <Target className="h-4 w-4 text-indigo-500" />
        Analyst Ratings
      </h3>

      <div className="flex items-center">
        <div className="w-32 h-32 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-slate-800 dark:text-white">{total}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Analysts</span>
          </div>
        </div>

        <div className="flex-1 ml-4 space-y-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[entry.name] }}></div>
                <span className="font-semibold text-slate-600 dark:text-slate-300">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white">{((entry.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-2 pt-4 border-t border-slate-100 dark:border-dark-border">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Consensus: <span className="font-bold text-slate-800 dark:text-white">{highest.name}</span>
        </div>
      </div>
    </div>
  );
};

export default AnalystRatings;
