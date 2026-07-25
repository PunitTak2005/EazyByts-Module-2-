import React from 'react';

const Skeleton = ({ className = '', variant = 'text', count = 1 }) => {
  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-dark-border';

  const variants = {
    text: 'h-4 w-full rounded-md',
    title: 'h-6 w-3/4 rounded-lg',
    circle: 'rounded-full',
    rect: 'rounded-2xl',
  };

  const elements = Array.from({ length: count });

  if (count > 1) {
    return (
      <div className="space-y-3 w-full">
        {elements.map((_, idx) => (
          <div
            key={idx}
            className={`${baseStyles} ${variants[variant] || variants.text} ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${baseStyles} ${variants[variant] || variants.text} ${className}`} />
  );
};

export default Skeleton;
