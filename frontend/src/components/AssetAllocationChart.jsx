import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/formatters.js';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e'];

const AssetAllocationChart = () => {
  const { isDark } = useTheme();
  const tooltipBg = isDark ? '#161c2a' : '#ffffff';
  const tooltipBorder = isDark ? '#243048' : '#e2e8f0';
  const tooltipText = isDark ? '#f3f4f6' : '#1e293b';

  const { data: allocation, isLoading, error } = useQuery({
    queryKey: ['assetAllocation'],
    queryFn: async () => {
      const response = await api.get('/charts/allocation');
      return response.data || response || [];
    }
  });

  if (isLoading) {
    return (
      <div className="h-60 flex items-center justify-center text-xs text-slate-400 animate-pulse font-bold">
        Querying asset allocations...
      </div>
    );
  }

  if (error || !allocation || allocation.length === 0) {
    return (
      <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
        <PieIcon className="h-8 w-8 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
        <span className="max-w-[200px] leading-relaxed">No asset allocations found. Purchase stock shares in the Simulator Desk to populate this chart.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-full min-h-[220px]">
      
      {/* Chart Canvas */}
      <div className="h-44 w-44 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value) => [formatCurrency(value)]}
              contentStyle={{
                backgroundColor: tooltipBg,
                borderRadius: '12px',
                border: `1px solid ${tooltipBorder}`,
                color: tooltipText,
                fontSize: '11px',
                fontFamily: 'sans-serif'
              }}
              itemStyle={{ color: tooltipText }}
            />
            <Pie
              data={allocation}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {allocation.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend details */}
      <div className="flex-1 w-full space-y-2.5 max-h-[185px] overflow-y-auto pr-1">
        {allocation.map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg/40 transition-colors text-xs font-bold">
            <div className="flex items-center gap-2 truncate mr-2">
              <span 
                className="h-2.5 w-2.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
              />
              <span className="truncate text-slate-600 dark:text-slate-300">{item.name}</span>
            </div>
            <span className="text-slate-800 dark:text-white font-extrabold flex-shrink-0">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AssetAllocationChart;
