/**
 * Trade Validation Utilities
 * Centralized logic for validating buy and sell orders across the trading simulator.
 */

/**
 * Validates a sell order quantity against owned shares.
 * 
 * @param {number|string} requestedQuantity - The amount of shares the user wants to sell
 * @param {number} ownedQuantity - The amount of shares the user currently owns
 * @returns {{isValid: boolean, message: string}}
 */
export function validateSellQuantity(requestedQuantity, ownedQuantity) {
  const qty = Number(requestedQuantity);
  
  if (isNaN(qty) || qty <= 0) {
    return { isValid: false, message: 'Quantity must be greater than zero.' };
  }
  
  if (!Number.isInteger(qty)) {
    return { isValid: false, message: 'Please enter a valid whole number.' };
  }
  
  if (qty > ownedQuantity) {
    return { isValid: false, message: `You only own ${ownedQuantity} shares.` };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a buy order for sufficient cash balance.
 * 
 * @param {number|string} requestedQuantity - The amount of shares
 * @param {number} grandTotal - The total cost including fees
 * @param {number} availableCash - The user's virtual cash balance
 * @returns {{isValid: boolean, message: string}}
 */
export function validateBuyOrder(requestedQuantity, grandTotal, availableCash) {
  const qty = Number(requestedQuantity);
  
  if (isNaN(qty) || qty <= 0) {
    return { isValid: false, message: 'Quantity must be greater than zero.' };
  }
  
  if (!Number.isInteger(qty)) {
    return { isValid: false, message: 'Please enter a valid whole number.' };
  }
  
  if (grandTotal > availableCash) {
    return { isValid: false, message: 'Insufficient virtual cash balance.' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validates a limit price based on order type.
 * 
 * @param {number|string} limitPrice 
 * @param {string} orderType - 'MARKET' or 'LIMIT'
 * @returns {{isValid: boolean, message: string}}
 */
export function validateLimitPrice(limitPrice, orderType) {
  if (orderType === 'MARKET') {
    return { isValid: true, message: '' };
  }
  
  const price = Number(limitPrice);
  if (isNaN(price) || price <= 0) {
    return { isValid: false, message: 'Please enter a valid target price.' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Comprehensive order validator.
 * 
 * @param {Object} params
 * @param {string} params.tradeType - 'BUY' or 'SELL'
 * @param {string} params.orderType - 'MARKET' or 'LIMIT'
 * @param {number|string} params.quantity 
 * @param {number|string} params.limitPrice 
 * @param {number} params.ownedQuantity 
 * @param {number} params.availableCash 
 * @param {number} params.grandTotal 
 * @returns {{isValid: boolean, message: string}}
 */
export function validateOrder({
  tradeType,
  orderType,
  quantity,
  limitPrice,
  ownedQuantity,
  availableCash,
  grandTotal
}) {
  const limitVal = validateLimitPrice(limitPrice, orderType);
  if (!limitVal.isValid) return limitVal;

  if (tradeType === 'SELL') {
    return validateSellQuantity(quantity, ownedQuantity);
  }

  if (tradeType === 'BUY') {
    return validateBuyOrder(quantity, grandTotal, availableCash);
  }

  return { isValid: false, message: 'Invalid trade type.' };
}
