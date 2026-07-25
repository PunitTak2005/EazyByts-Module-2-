import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    action: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    executedPrice: {
      type: Number,
      required: true,
    },
    fees: {
      type: Number,
      default: 0,
    },
    realizedProfit: {
      type: Number,
      default: 0,
    },
    orderType: {
      type: String,
      enum: ['MARKET', 'LIMIT'],
      default: 'MARKET',
    },
    limitPrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'COMPLETED',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ userId: 1, symbol: 1, timestamp: -1 });

const Trade = mongoose.model('Trade', tradeSchema);
export default Trade;
