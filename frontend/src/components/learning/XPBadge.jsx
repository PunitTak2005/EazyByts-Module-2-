import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap } from 'lucide-react';

/**
 * XP Badge with animated glow.
 * Props: xp, level, showLevel, size (sm|md|lg)
 */
const XPBadge = ({ xp = 0, level = 1, showLevel = true, size = 'md' }) => {
  const sizeMap = {
    sm: { container: 'px-2 py-0.5 text-xs', icon: 12 },
    md: { container: 'px-3 py-1 text-sm', icon: 14 },
    lg: { container: 'px-4 py-1.5 text-base', icon: 16 },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* XP pill */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-md ${s.container}`}
      >
        <Zap size={s.icon} className="fill-white stroke-white" />
        <span>{xp.toLocaleString()} XP</span>
      </motion.div>

      {/* Level pill */}
      {showLevel && (
        <div
          className={`flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold ${s.container}`}
        >
          <Star size={s.icon} className="fill-white stroke-white" />
          <span>Lv {level}</span>
        </div>
      )}
    </div>
  );
};

export default XPBadge;
