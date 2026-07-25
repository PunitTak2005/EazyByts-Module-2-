import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const SubmitButton = ({ children, isLoading, onClick, ...props }) => {
  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      whileTap={{ scale: 0.985 }}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 py-2.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99] transition-all select-none font-sans"
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default SubmitButton;
