/**
 * formatters.js
 * Centralized formatting utilities.
 * Handles undefined, null, NaN, and Infinity safely.
 */

export function isValidNumber(value) {
  if (value === null || value === undefined) return false;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
}

export function isValidStockData(stock) {
  if (!stock) {
    console.error("Invalid stock data received", stock);
    return false;
  }

  const price = typeof stock.price === 'number' ? stock.price : (stock.currentPrice !== undefined ? stock.currentPrice : parseFloat(stock.price));
  const changePercent = typeof stock.changePercent === 'number' ? stock.changePercent : parseFloat(stock.changePercent);

  if (!isValidNumber(price) || price <= 0 || price > 1000000) {
    console.error("Invalid stock data received", stock);
    return false;
  }

  if (isValidNumber(changePercent) && Math.abs(changePercent) > 100) {
    console.error("Invalid stock data received", stock);
    return false;
  }

  return true;
}

export function formatNumber(value, fallback = '--') {
  if (!isValidNumber(value)) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-IN');
}

export function formatCurrency(value, fallback = '--') {
  if (!isValidNumber(value)) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(num);
}

export function formatPrice(value, fallback = '--') {
  // Alias for formatCurrency
  return formatCurrency(value, fallback);
}

export function formatPercent(value, fallback = '--') {
  if (!isValidNumber(value)) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

export function formatVolume(value, fallback = '--') {
  if (!isValidNumber(value)) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-IN');
}

export function formatMarketCap(value, fallback = '--') {
  if (!isValidNumber(value)) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `₹${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(2)}K`;
  return `₹${num.toFixed(2)}`;
}

export function formatLargeNumber(value, fallback = '--') {
  if (!isValidNumber(value)) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
}

export function formatDecimal(value, decimals = 2, fallback = '--') {
  if (!isValidNumber(value)) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toFixed(decimals);
}

export function formatDate(dateString, options = {}) {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-IN', options);
  } catch (err) {
    return '--';
  }
}


