import React from 'react';
import { useNavigate } from 'react-router-dom';
import TradeStatusBadge from './TradeStatusBadge';
import { formatCurrency } from '@/utils/formatters';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${Math.max(0, seconds)} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const TradeRow = ({ trade }) => {
  const navigate = useNavigate();
  const isBuy = trade.type === 'BUY';

  return (
    <tr 
      onClick={() => navigate(`/stocks/${trade.symbol}`)}
      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
    >
      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
        {timeAgo(trade.createdAt)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {/* Avatar / Logo Placeholder */}
          <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
            {trade.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {trade.symbol}
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[120px]">
              {trade.companyName}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
          isBuy 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
        }`}>
          {trade.type}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 capitalize">
        {trade.orderType.toLowerCase()}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200 font-medium">
        {trade.quantity}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
        {formatCurrency(trade.price)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-100">
        {formatCurrency(trade.total)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <TradeStatusBadge status={trade.status} />
      </td>
    </tr>
  );
};

export default TradeRow;
