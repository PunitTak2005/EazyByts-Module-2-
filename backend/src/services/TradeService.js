import Trade from '../models/Trade.js';
import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Holding from '../models/Holding.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import mongoose from 'mongoose';
import SocketService from './SocketService.js';
import PortfolioHistoryService from './PortfolioHistoryService.js';

class TradeService {
  async placeBuyOrder(userId, symbol, quantity, orderType, limitPrice = null) {
    const cleanSymbol = symbol ? String(symbol).trim().toUpperCase() : '';
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new AppError('Quantity must be greater than zero.', 400);

    const user = await User.findById(userId);
    if (!user) throw new AppError('User account not found', 404);

    let stock = await Stock.findOne({ symbol: cleanSymbol });
    
    // Fetch live quote from YahooFinanceService if available
    const YahooFinanceService = (await import('./yahooFinanceService.js')).default;
    const liveStock = await YahooFinanceService.getCompleteStockDetails(cleanSymbol).catch(() => null);

    const currentPrice = liveStock ? liveStock.price : (stock ? stock.currentPrice : 0);
    if (currentPrice <= 0) throw new AppError('Stock price unavailable.', 400);

    if (!stock && liveStock) {
      stock = await Stock.create({
        symbol: liveStock.symbol,
        companyName: liveStock.companyName,
        sector: liveStock.sector || 'Equities',
        currentPrice: liveStock.price,
        previousClose: liveStock.previousClose,
        open: liveStock.open,
        high: liveStock.dayHigh,
        low: liveStock.dayLow,
        volume: liveStock.volume
      });
    } else if (stock && liveStock && stock.currentPrice !== liveStock.price) {
      stock.currentPrice = liveStock.price;
      await stock.save();
    }

    if (!stock) throw new AppError('Stock security not found', 404);

    const executionPrice = (orderType === 'LIMIT' && limitPrice) ? parseFloat(limitPrice) : currentPrice;
    if (executionPrice <= 0) throw new AppError('Price must be greater than 0', 400);

    const cost = qty * executionPrice;
    const fees = parseFloat((cost * 0.001).toFixed(2));
    const grandTotal = parseFloat((cost + fees).toFixed(2));

    console.log("Request Body:", { userId, symbol: cleanSymbol, quantity: qty, orderType, limitPrice });
    console.log("Available Cash:", user.balance);
    console.log("Requested Quantity:", qty);
    console.log("Stock Price:", executionPrice);
    console.log("Required Amount:", grandTotal);

    if (orderType === 'MARKET') {
      const userBalance = Number(user.balance ?? 1000000);
      if (userBalance < grandTotal) {
        throw new AppError(`Required ₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} but only ₹${userBalance.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} is available.`, 400);
      }

      // Deduct balance
      user.balance = parseFloat((user.balance - grandTotal).toFixed(2));
      await user.save();

      // Upsert holding
      let holding = await Holding.findOne({ userId: user._id, symbol: stock.symbol });
      if (holding) {
        const prevQty = holding.quantity;
        const prevTotalCost = holding.averagePrice * prevQty;
        const newTotalCost = prevTotalCost + grandTotal;
        const newQty = prevQty + qty;
        holding.averagePrice = parseFloat((newTotalCost / newQty).toFixed(2));
        holding.quantity = newQty;
        holding.currentPrice = executionPrice;
        await holding.save();
      } else {
        await Holding.create({
          userId: user._id,
          stockId: stock._id,
          symbol: stock.symbol,
          quantity: qty,
          averagePrice: parseFloat((grandTotal / qty).toFixed(2)),
          currentPrice: executionPrice
        });
      }

      // Record Completed Trade
      const trade = await Trade.create({
        userId: user._id,
        stockId: stock._id,
        symbol: stock.symbol,
        action: 'BUY',
        quantity: qty,
        executedPrice: stock.currentPrice,
        fees,
        orderType: 'MARKET',
        status: 'COMPLETED'
      });

      await Notification.create({
        userId: user._id,
        title: 'Order Executed',
        message: `Bought ${qty} share(s) of ${stock.symbol} at ₹${stock.currentPrice.toFixed(2)}`,
        type: 'Trade Success'
      });

      SocketService.broadcastToRoom(`user:${user._id}`, 'tradeCompleted', trade);
      PortfolioHistoryService.recordSnapshot(user._id).catch(() => {});

      return trade;
    }

    if (orderType === 'LIMIT') {
      const userBalance = Number(user.balance ?? 1000000);
      if (userBalance < grandTotal) {
        throw new AppError(`Insufficient balance. Available: ₹${userBalance.toLocaleString('en-IN')}, Required: ₹${grandTotal.toLocaleString('en-IN')}`, 400);
      }

      // Reserve balance for pending buy order
      user.balance = parseFloat((user.balance - grandTotal).toFixed(2));
      await user.save();

      // Record Pending Order
      const trade = await Trade.create({
        userId: user._id,
        stockId: stock._id,
        symbol: stock.symbol,
        action: 'BUY',
        quantity: qty,
        executedPrice: executionPrice,
        limitPrice: executionPrice,
        fees,
        orderType: 'LIMIT',
        status: 'PENDING'
      });

      await Notification.create({
        userId: user._id,
        title: 'Limit Order Placed',
        message: `Placed Limit Buy order for ${qty} share(s) of ${stock.symbol} at ₹${executionPrice.toFixed(2)}`,
        type: 'General'
      });

      return trade;
    }
  }

  async placeSellOrder(userId, symbol, quantity, orderType, limitPrice = null) {
    const cleanSymbol = symbol ? String(symbol).trim().toUpperCase() : '';
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new AppError('Quantity must be greater than zero.', 400);

    const user = await User.findById(userId);
    if (!user) throw new AppError('User account not found', 404);

    let holding = await Holding.findOne({ userId: user._id, symbol: cleanSymbol });
    if (!holding || qty > holding.quantity) {
      throw new AppError("You don't own enough shares.", 400);
    }

    let stock = await Stock.findOne({ symbol: cleanSymbol });

    // Dynamically resolve live quote from YahooFinanceService
    const YahooFinanceService = (await import('./yahooFinanceService.js')).default;
    const liveStock = await YahooFinanceService.getCompleteStockDetails(cleanSymbol).catch(() => null);

    const currentPrice = liveStock ? liveStock.price : (stock ? stock.currentPrice : holding.averagePrice);
    if (currentPrice <= 0) throw new AppError('Stock price unavailable.', 400);

    if (!stock && liveStock) {
      stock = await Stock.create({
        symbol: liveStock.symbol,
        companyName: liveStock.companyName,
        sector: liveStock.sector || 'Equities',
        currentPrice: liveStock.price,
        previousClose: liveStock.previousClose,
        open: liveStock.open,
        high: liveStock.dayHigh,
        low: liveStock.dayLow,
        volume: liveStock.volume
      });
    }

    const stockId = stock ? stock._id : holding.stockId;

    // Auto-repair holding averagePrice if legacy USD cost basis was stored
    let avgPrice = holding.averagePrice;
    if (currentPrice > 0 && avgPrice > 0 && avgPrice < (currentPrice / 10)) {
      avgPrice = parseFloat((avgPrice * 83).toFixed(2));
      holding.averagePrice = avgPrice;
      await holding.save();
    }

    const executionPrice = (orderType === 'LIMIT' && limitPrice) ? parseFloat(limitPrice) : currentPrice;
    if (executionPrice <= 0) throw new AppError('Price must be greater than 0', 400);

    const proceeds = qty * executionPrice;
    const fees = parseFloat((proceeds * 0.001).toFixed(2));
    const netProceeds = parseFloat((proceeds - fees).toFixed(2));

    if (orderType === 'MARKET') {
      const originalCost = parseFloat((avgPrice * qty).toFixed(2));
      const profit = parseFloat((netProceeds - originalCost).toFixed(2));

      // Credit cash balance
      user.balance = parseFloat((user.balance + netProceeds).toFixed(2));
      await user.save();

      // Decrement holdings
      holding.quantity -= qty;
      if (holding.quantity <= 0 && holding._id) {
        await Holding.deleteOne({ _id: holding._id });
      } else {
        holding.currentPrice = executionPrice;
        await holding.save();
      }

      const trade = await Trade.create({
        userId: user._id,
        stockId,
        symbol: cleanSymbol,
        action: 'SELL',
        quantity: qty,
        executedPrice: executionPrice,
        fees,
        realizedProfit: profit,
        orderType: 'MARKET',
        status: 'COMPLETED'
      });

      await Notification.create({
        userId: user._id,
        title: 'Order Executed',
        message: `Sold ${qty} share(s) of ${cleanSymbol} at ₹${executionPrice.toFixed(2)}. P/L: ₹${profit.toLocaleString('en-IN')}`,
        type: 'Trade Success'
      });

      SocketService.broadcastToRoom(`user:${user._id}`, 'tradeCompleted', trade);
      PortfolioHistoryService.recordSnapshot(user._id).catch(() => {});

      return trade;
    }

    if (orderType === 'LIMIT') {
      // Reserve shares for pending sell order
      holding.quantity -= qty;
      // Do not delete the holding even if quantity reaches 0, to preserve averagePrice for when the order is executed or cancelled
      await holding.save();

      const trade = await Trade.create({
        userId: user._id,
        stockId: stock._id,
        symbol: stock.symbol,
        action: 'SELL',
        quantity: qty,
        executedPrice: executionPrice,
        limitPrice: executionPrice,
        fees,
        orderType: 'LIMIT',
        status: 'PENDING'
      });

      await Notification.create({
        userId: user._id,
        title: 'Limit Order Placed',
        message: `Placed Limit Sell order for ${qty} share(s) of ${stock.symbol} at ₹${executionPrice.toFixed(2)}`,
        type: 'General'
      });

      return trade;
    }
  }

  async cancelOrder(userId, orderId) {
    const trade = await Trade.findOne({ _id: orderId, userId });
    if (!trade) throw new AppError('Order not found', 404);

    if (trade.status !== 'PENDING' && trade.status !== 'OPEN') {
      throw new AppError(`Cannot cancel order. Status is ${trade.status}`, 400);
    }

    trade.status = 'CANCELLED';
    trade.cancelledAt = new Date();
    trade.cancelReason = 'User cancelled';
    await trade.save();

    const user = await User.findById(userId);

    // Release reserved assets
    if (trade.action === 'BUY') {
      const cost = trade.quantity * trade.limitPrice;
      const fees = parseFloat((cost * 0.001).toFixed(2));
      const grandTotal = cost + fees;

      user.balance = parseFloat((user.balance + grandTotal).toFixed(2));
      await user.save();
    } else if (trade.action === 'SELL') {
      let holding = await Holding.findOne({ userId, symbol: trade.symbol });
      if (holding) {
        holding.quantity += trade.quantity;
        await holding.save();
      }
    }

    // Emit socket event for frontend updates
    SocketService.broadcastToRoom(`user:${userId}`, 'orderCancelled', {
      orderId: trade._id,
      userId: trade.userId,
      symbol: trade.symbol,
      status: trade.status,
      cancelledAt: trade.cancelledAt
    });

    return trade;
  }

  async getTrades(userId, page = 1, limit = 12, search = '', action = 'ALL', status = 'ALL', sortBy = 'newest') {
    const skip = (page - 1) * limit;
    const query = { userId };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { symbol: searchRegex }
      ];
    }

    if (action && action !== 'ALL') {
      query.action = action.toUpperCase();
    }

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    let sortObj = { createdAt: -1 };
    if (sortBy === 'oldest') sortObj = { createdAt: 1 };
    else if (sortBy === 'highest_value') sortObj = { executedPrice: -1 };
    else if (sortBy === 'lowest_value') sortObj = { executedPrice: 1 };

    const trades = await Trade.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('stockId', 'companyName symbol currentPrice')
      .lean();

    const enrichedTrades = trades.map(t => {
      const price = t.executedPrice || t.limitPrice || 0;
      const subtotal = parseFloat((t.quantity * price).toFixed(2));
      const fees = t.fees || 0;
      const totalAmount = parseFloat((subtotal + fees).toFixed(2));
      const companyName = t.stockId?.companyName || t.symbol;

      let realizedProfit = t.realizedProfit || 0;
      // Auto-repair legacy sell trades where realizedProfit was -2.73 Lakh due to USD cost basis vs INR proceeds mismatch
      if (t.action === 'SELL' && realizedProfit < -5000 && (t.quantity * price) < 100000) {
        realizedProfit = parseFloat((-fees).toFixed(2));
      }

      return {
        ...t,
        id: t._id,
        type: t.action,
        companyName,
        price,
        subtotal,
        fees,
        totalAmount,
        realizedProfit
      };
    });

    const total = await Trade.countDocuments(query);
    return { trades: enrichedTrades, total, pages: Math.ceil(total / limit) };
  }

  async getRecentTrades(userId, limit = 10, page = 1) {
    const skip = (page - 1) * limit;

    const trades = await Trade.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('stockId', 'companyName') // Populate company name
      .lean(); // Lean for better performance since we just want JSON

    const total = await Trade.countDocuments({ userId });

    const formattedData = trades.map(t => ({
      id: t._id,
      symbol: t.symbol,
      companyName: t.stockId?.companyName || 'Unknown',
      type: t.action,
      orderType: t.orderType,
      quantity: t.quantity,
      price: t.executedPrice,
      total: (t.quantity * t.executedPrice) + (t.action === 'BUY' ? t.fees : -t.fees),
      fee: t.fees,
      status: t.status,
      createdAt: t.createdAt
    }));

    return {
      success: true,
      lastUpdated: new Date().toISOString(),
      total,
      data: formattedData
    };
  }

  async getTradeById(userId, tradeId) {
    const t = await Trade.findOne({ _id: tradeId, userId })
      .populate('stockId', 'companyName symbol currentPrice sector')
      .lean();
    if (!t) throw new AppError('Transaction record not found', 404);

    const user = await User.findById(userId).lean();
    const holding = await Holding.findOne({ userId, symbol: t.symbol }).lean();

    const price = t.executedPrice || t.limitPrice || 0;
    const subtotal = parseFloat((t.quantity * price).toFixed(2));
    const fees = t.fees || 0;
    const totalAmount = parseFloat((subtotal + fees).toFixed(2));
    const companyName = t.stockId?.companyName || t.symbol;

    return {
      ...t,
      id: t._id,
      type: t.action,
      companyName,
      price,
      subtotal,
      fees,
      totalAmount,
      portfolioImpact: {
        updatedBalance: user ? user.balance : 0,
        ownedSharesAfterTrade: holding ? holding.quantity : 0,
        averagePriceAfterTrade: holding ? holding.averagePrice : 0
      }
    };
  }
}

export default new TradeService();
