import React from 'react';
import { motion } from 'framer-motion';

/**
 * Circular progress ring with animated SVG stroke.
 * Props:
 *   percent  – 0 to 100
 *   size     – diameter in px (default 80)
 *   stroke   – stroke width (default 8)
 *   color    – tailwind-compatible hex/hsl string (default blue)
 *   label    – center text override (default shows percent)
 *   className
 */
const ProgressRing = ({
  percent = 0,
  size = 80,
  stroke = 8,
  color = '#3b82f6',
  label,
  className = '',
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${percent}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">
          {label ?? `${Math.round(percent)}%`}
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;
