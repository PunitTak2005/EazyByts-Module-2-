import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp, ArrowDown, Columns, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';

const WIDGET_LABELS = {
  portfolio: 'Portfolio Summary',
  allocation: 'Asset Allocation Chart',
  movers: 'Most Active Stocks',
  watchlist: 'Watchlist Overview',
  trades: 'Recent Transactions Ledger'
};

const WidgetSelector = ({ isOpen, onClose, layout, onUpdateLayout, onSaveLayout, onResetLayout, isSaving }) => {
  const validLayout = (layout || []).filter(item => item && item.widgetId && WIDGET_LABELS[item.widgetId]);
  
  const moveWidget = (index, direction) => {
    const nextLayout = [...validLayout];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= nextLayout.length) return;

    // Swap items
    const temp = nextLayout[index];
    nextLayout[index] = nextLayout[targetIdx];
    nextLayout[targetIdx] = temp;

    // Re-assign orders
    nextLayout.forEach((w, idx) => {
      w.order = idx;
    });

    onUpdateLayout(nextLayout);
  };

  const toggleVisibility = (index) => {
    const nextLayout = [...validLayout];
    nextLayout[index] = {
      ...nextLayout[index],
      isVisible: !nextLayout[index].isVisible
    };
    onUpdateLayout(nextLayout);
  };

  const cycleColSpan = (index) => {
    const nextLayout = [...validLayout];
    const spans = [1, 2, 4];
    const currentSpan = nextLayout[index].colSpan || 2;
    const nextSpanIdx = (spans.indexOf(currentSpan) + 1) % spans.length;
    nextLayout[index] = {
      ...nextLayout[index],
      colSpan: spans[nextSpanIdx]
    };
    onUpdateLayout(nextLayout);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="widget-panel-title"
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        >
          {/* Backdrop dismiss */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="relative h-full w-full max-w-sm border-l border-slate-200 bg-white p-6 dark:border-dark-border dark:bg-dark-card shadow-2xl flex flex-col justify-between z-10"
          >
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
                <h3 id="widget-panel-title" className="text-base font-extrabold text-slate-800 dark:text-white">
                  Customize Workspace
                </h3>
                <button 
                  onClick={onClose} 
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  aria-label="Close widget settings"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Toggle columns spans, change layouts list ordering, or show/hide widget cards.</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {validLayout.map((item, idx) => (
                <div 
                  key={item.widgetId}
                  className={`rounded-xl border p-3 flex items-center justify-between transition-all ${
                    item.isVisible 
                      ? 'border-slate-200 bg-slate-50/50 dark:border-dark-border dark:bg-dark-bg/30' 
                      : 'border-dashed border-slate-200 opacity-60 dark:border-slate-800'
                  }`}
                >
                  {/* Name and Visibility toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleVisibility(idx)}
                      className={`p-1.5 rounded-lg border ${
                        item.isVisible 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : 'border-slate-200 bg-white text-slate-400 dark:border-dark-border dark:bg-dark-card'
                      }`}
                      title={item.isVisible ? 'Hide Widget' : 'Show Widget'}
                    >
                      {item.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate max-w-[140px]">
                        {WIDGET_LABELS[item.widgetId]}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        Width: {item.colSpan === 4 ? 'Full' : item.colSpan === 2 ? 'Half' : 'Quarter'}
                      </span>
                    </div>
                  </div>

                  {/* Positioning Actions */}
                  <div className="flex items-center gap-1">
                    {/* Columns Spanning Cycle */}
                    <button
                      onClick={() => cycleColSpan(idx)}
                      disabled={!item.isVisible}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 bg-white text-slate-600 disabled:opacity-40 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 dark:text-dark-text"
                      title="Cycle Columns Width Span"
                    >
                      <Columns className="h-3.5 w-3.5" />
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => moveWidget(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 bg-white text-slate-600 disabled:opacity-30 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 dark:text-dark-text"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => moveWidget(idx, 1)}
                      disabled={idx === validLayout.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 bg-white text-slate-600 disabled:opacity-30 dark:border-dark-border dark:bg-dark-card dark:hover:bg-slate-800 dark:text-dark-text"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="space-y-2 border-t border-slate-100 dark:border-dark-border pt-4">
              <button
                onClick={onSaveLayout}
                disabled={isSaving}
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving Workspace...' : 'Save Layout Preference'}
              </button>

              <button
                onClick={onResetLayout}
                className="w-full h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-dark-border dark:text-dark-text dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Defaults
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WidgetSelector;
