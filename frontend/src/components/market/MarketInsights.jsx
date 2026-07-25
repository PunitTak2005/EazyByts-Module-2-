import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMarketOverview, getAiSummary, getMarketSentiment } from '@/services/marketInsightsService';
import GlobalIndices from './GlobalIndices';
import TopMovers from './TopMovers';
import MarketSentiment from './MarketSentiment';
import { Brain, Sparkles, Loader2 } from 'lucide-react';

const MarketInsights = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: getMarketOverview,
    refetchInterval: 60000,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['aiSummary'],
    queryFn: getAiSummary,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: sentimentData } = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: getMarketSentiment,
    refetchInterval: 60000,
  });

  const { indices, gainers, losers, active } = overview?.data || {};

  return (
    <div className="space-y-6">
      {/* AI Summary Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Brain size={64} />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
            <Sparkles size={18} />
            AI Market Summary
          </h3>
          {summaryLoading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-indigo-300 rounded"></div>
                <div className="h-2 bg-indigo-300 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <p className="text-indigo-50 leading-relaxed max-w-3xl">
              {summaryData?.data?.summary || 'Market summary not available at this moment.'}
            </p>
          )}
        </div>
      </div>

      {/* Global Indices */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Global Markets</h3>
        <GlobalIndices indices={indices} />
      </div>

      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MarketSentiment score={sentimentData?.data?.score} label={sentimentData?.data?.label} />
          <TopMovers gainers={gainers} losers={losers} active={active} />
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
