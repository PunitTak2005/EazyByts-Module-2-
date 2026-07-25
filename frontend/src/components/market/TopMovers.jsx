import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const TopMovers = ({ gainers = [], losers = [], active = [] }) => {
  const [activeTab, setActiveTab] = useState('gainers');
  const navigate = useNavigate();

  const getList = () => {
    switch(activeTab) {
      case 'gainers': return gainers;
      case 'losers': return losers;
      case 'active': return active;
      default: return [];
    }
  };

  const list = getList();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex border-b border-slate-100 dark:border-slate-800/50">
        <button 
          onClick={() => setActiveTab('gainers')}
          className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${activeTab === 'gainers' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30'}`}
        >
          <TrendingUp size={16} /> Gainers
        </button>
        <button 
          onClick={() => setActiveTab('losers')}
          className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${activeTab === 'losers' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-b-2 border-rose-500' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30'}`}
        >
          <TrendingDown size={16} /> Losers
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${activeTab === 'active' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-b-2 border-indigo-500' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30'}`}
        >
          <Activity size={16} /> Active
        </button>
      </div>

      <div className="p-0 max-h-[400px] overflow-y-auto custom-scrollbar">
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No data available</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {list.map((item, i) => {
              const isPos = (item.changePercent || 0) >= 0;
              const priceVal = item.price !== undefined ? item.price : item.currentPrice;
              return (
                <div 
                  key={item.symbol} 
                  onClick={() => navigate(`/stocks/${item.symbol}`)}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      {item.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.symbol}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{item.companyName || item.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {formatCurrency(priceVal)}
                    </div>
                    <div className={`text-xs font-medium ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatPercent(item.changePercent)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopMovers;
