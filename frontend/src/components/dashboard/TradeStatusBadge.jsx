import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const TradeStatusBadge = ({ status }) => {
  const normalizedStatus = status?.toUpperCase() || 'UNKNOWN';

  let config = {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    icon: <AlertCircle className="h-3 w-3" />
  };

  if (normalizedStatus === 'COMPLETED') {
    config = {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: <CheckCircle2 className="h-3 w-3" />
    };
  } else if (normalizedStatus === 'PENDING') {
    config = {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: <Clock className="h-3 w-3" />
    };
  } else if (normalizedStatus === 'CANCELLED') {
    config = {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      text: 'text-rose-600 dark:text-rose-400',
      icon: <XCircle className="h-3 w-3" />
    };
  } else if (normalizedStatus === 'FAILED') {
    config = {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-500 dark:text-slate-400',
      icon: <AlertCircle className="h-3 w-3" />
    };
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown'}
    </span>
  );
};

export default TradeStatusBadge;
