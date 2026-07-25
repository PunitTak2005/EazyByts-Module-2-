/**
 * PasswordStrengthUtils.js
 * Robust scoring algorithm for evaluation of password entropy.
 */

export const calculatePasswordStrength = (pass, email = '', name = '') => {
  if (!pass) {
    return {
      score: 0,
      label: 'Very Weak',
      color: 'bg-slate-200 dark:bg-dark-border',
      textColor: 'text-slate-400 dark:text-dark-muted',
      suggestions: [],
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        noPersonal: true,
        noSequential: true,
      }
    };
  }

  const checks = {
    length: pass.length >= 8,
    uppercase: /[A-Z]/.test(pass),
    lowercase: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
    noPersonal: true,
    noSequential: true,
  };

  // Check personal info (case-insensitive checks)
  if (email && email.includes('@')) {
    const userPart = email.split('@')[0];
    if (userPart.length >= 3 && pass.toLowerCase().includes(userPart.toLowerCase())) {
      checks.noPersonal = false;
    }
  }
  if (name && name.trim().length >= 3) {
    const nameParts = name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length >= 3 && pass.toLowerCase().includes(part)) {
        checks.noPersonal = false;
        break;
      }
    }
  }

  // Check sequential characters (e.g. 12345, abcde)
  const sequentialPatterns = [
    '0123456789',
    '9876543210',
    'abcdefghijklmnopqrstuvwxyz',
    'zyxwvutsrqponmlkjihgfedcba'
  ];
  for (const seq of sequentialPatterns) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const sub = seq.substring(i, i + 4);
      if (pass.toLowerCase().includes(sub)) {
        checks.noSequential = false;
        break;
      }
    }
  }

  // Calculate base score (0 to 5)
  let score = 0;
  if (checks.length) score++;
  if (checks.uppercase) score++;
  if (checks.lowercase) score++;
  if (checks.number) score++;
  if (checks.special) score++;
  if (checks.noPersonal && checks.noSequential) score++;

  // Penalize repeated sequences (e.g., aaaa, abcabc)
  const hasRepeated = /(.)\1{3,}/.test(pass);
  if (hasRepeated) {
    score = Math.max(1, score - 1);
  }

  // Cap score range between 1 and 6 for levels
  const levels = [
    { score: 1, label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-500' },
    { score: 1, label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-500' },
    { score: 2, label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-500' },
    { score: 3, label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    { score: 4, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' },
    { score: 5, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-500' },
    { score: 6, label: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-500' }
  ];

  const levelInfo = levels[score];

  // Compile list of constructive suggestions
  const suggestions = [];
  if (!checks.length) suggestions.push('8+ characters');
  if (!checks.uppercase) suggestions.push('1 uppercase letter');
  if (!checks.lowercase) suggestions.push('1 lowercase letter');
  if (!checks.number) suggestions.push('1 number');
  if (!checks.special) suggestions.push('1 special character');
  if (!checks.noPersonal) suggestions.push('Avoid using name/email details');
  if (!checks.noSequential) suggestions.push('Avoid character sequences');

  return {
    score,
    label: levelInfo.label,
    color: levelInfo.color,
    textColor: levelInfo.textColor,
    suggestions,
    checks
  };
};
