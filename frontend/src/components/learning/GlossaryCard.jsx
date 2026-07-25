import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Tag, ShieldAlert } from 'lucide-react';

/**
 * Glossary term card component with category, difficulty badges, search highlighting, example, and clickable related terms.
 */
const GlossaryCard = ({
  term,
  category,
  difficulty = 'Beginner',
  definition,
  example,
  relatedTerms = [],
  searchQuery = '',
  onTermClick
}) => {
  if (
    !term ||
    term.startsWith("Financial Term") ||
    (definition && definition.includes("procedurally generated"))
  ) {
    console.error("Placeholder glossary data detected");
    return null;
  }
  const highlightText = (text, query) => {
    if (!query || typeof text !== 'string') return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-200 rounded px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getDifficultyBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'advanced':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'intermediate':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div>
        {/* Term header & badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {highlightText(term, searchQuery)}
            </h3>
            {category && (
              <div className="flex items-center gap-1.5 mt-1">
                <Tag size={12} className="text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {highlightText(category, searchQuery)}
                </span>
              </div>
            )}
          </div>
          <span
            className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getDifficultyBadge(
              difficulty
            )}`}
          >
            {difficulty}
          </span>
        </div>

        {/* Definition */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          {highlightText(definition, searchQuery)}
        </p>

        {/* Real-world Example */}
        {example && (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3 mb-3">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
              Real-World Example
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
              "{highlightText(example, searchQuery)}"
            </p>
          </div>
        )}
      </div>

      {/* Related terms */}
      {relatedTerms && relatedTerms.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Related Concepts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {relatedTerms.map((rt) => (
              <button
                key={rt}
                onClick={() => onTermClick?.(rt)}
                className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>{rt}</span>
                <ExternalLink size={10} />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GlossaryCard;
