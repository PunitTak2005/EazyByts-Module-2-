import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TextInput = React.forwardRef(({
  label,
  icon: Icon,
  error,
  success,
  id,
  type = 'text',
  placeholder,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label 
          htmlFor={id} 
          className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 transition-colors"
        >
          {label}
        </label>
      )}
      
      <div className="relative w-full">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 flex items-center justify-center pointer-events-none">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        
        <input
          id={id}
          type={type}
          ref={ref}
          placeholder={placeholder}
          {...props}
          className={`w-full text-xs font-semibold rounded-xl border bg-white/40 dark:bg-dark-bg/20 py-2.5 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 text-slate-800 dark:text-dark-text outline-none transition-all focus:bg-white dark:focus:bg-dark-card/50 ${
            error 
              ? 'border-rose-500 ring-4 ring-rose-500/10 focus:border-rose-500' 
              : success 
              ? 'border-emerald-500 ring-4 ring-emerald-500/10 focus:border-emerald-500'
              : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-dark-border/70 dark:focus:border-blue-600'
          }`}
        />
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="text-[10px] font-bold text-rose-500 mt-0.5"
            role="alert"
          >
            {error.message || error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;
