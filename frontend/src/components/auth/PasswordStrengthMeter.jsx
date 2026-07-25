import React, { useMemo } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Check, Circle } from 'lucide-react';
import { calculatePasswordStrength } from '@/components/auth/PasswordStrengthUtils';

const ChecklistItem = ({ passed, text }) => {
  return (
    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 select-none">
      {passed ? (
        <Check className="h-3 w-3 text-emerald-500 stroke-[3] flex-shrink-0" />
      ) : (
        <Circle className="h-2 w-2 text-slate-300 dark:text-slate-700 flex-shrink-0" />
      )}
      <span className={passed ? 'text-slate-700 dark:text-slate-355' : ''}>{text}</span>
    </div>
  );
};

const PasswordStrengthMeter = ({ password = '', email = '', name = '' }) => {
  const info = useMemo(() => calculatePasswordStrength(password, email, name), [password, email, name]);

  const getIcon = () => {
    if (info.score <= 2) return <ShieldAlert className={`h-3 w-3 ${info.textColor}`} />;
    if (info.score <= 4) return <Shield className={`h-3 w-3 ${info.textColor}`} />;
    return <ShieldCheck className={`h-3 w-3 ${info.textColor}`} />;
  };

  return (
    <div className="w-full mt-1.5 space-y-1.5">
      {/* ARIA Live Region for accessibility */}
      <div className="sr-only" aria-live="polite">
        Password strength is {info.label}
      </div>

      {/* Header Row */}
      {password && (
        <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wide">
          <div className="flex items-center gap-1">
            {getIcon()}
            <span className="text-slate-400 dark:text-dark-muted">Strength:</span>
            <span className={info.textColor}>{info.label}</span>
          </div>
          {info.suggestions.length > 0 && (
            <span className="text-slate-400 text-[8px] lowercase font-normal italic">
              needs: {info.suggestions[0]}
            </span>
          )}
        </div>
      )}

      {/* Progress Bars */}
      <div className="flex h-1 gap-1 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <div
            key={level}
            className={`h-full flex-1 transition-all duration-300 ${
              password && level <= info.score ? info.color : 'bg-slate-200 dark:bg-slate-800/80'
            }`}
          />
        ))}
      </div>

      {/* Compact Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-slate-150/60 dark:border-dark-border/20">
        <ChecklistItem passed={info.checks.length} text="8+ characters" />
        <ChecklistItem passed={info.checks.uppercase} text="Uppercase letter" />
        <ChecklistItem passed={info.checks.lowercase} text="Lowercase letter" />
        <ChecklistItem passed={info.checks.number} text="Contains number" />
        <ChecklistItem passed={info.checks.special} text="Special symbol" />
        <ChecklistItem passed={info.checks.noPersonal && info.checks.noSequential} text="Secure patterns" />
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
