import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Subtle Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]" 
        style={{
          backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px), radial-gradient(#6366f1 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Blob 1 */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/10"
      />

      {/* Blob 2 */}
      <motion.div
        animate={{
          x: [0, -60, 80, 0],
          y: [0, 80, -90, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -right-20 -bottom-20 h-[500px] w-[500px] rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/10"
      />

      {/* Radial Gradient Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,255,255,0.8)_80%)] dark:bg-[radial-gradient(circle_at_center,transparent_30%,rgba(10,15,30,0.8)_85%)]" />
    </div>
  );
};

export default AnimatedBackground;
