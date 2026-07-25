import mongoose from 'mongoose';

const historicalPricesSchema = new mongoose.Schema(
  {
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
    date: {
      type: Date,
      required: true,
      index: true,
    },
    open: {
      type: Number,
      required: true,
      min: [0, 'Open price cannot be negative'],
    },
    high: {
      type: Number,
      required: true,
      min: [0, 'High price cannot be negative'],
    },
    low: {
      type: Number,
      required: true,
      min: [0, 'Low price cannot be negative'],
    },
    close: {
      type: Number,
      required: true,
      min: [0, 'Close price cannot be negative'],
    },
    adjustedClose: {
      type: Number,
      required: true,
      min: [0, 'Adjusted close price cannot be negative'],
    },
    volume: {
      type: Number,
      required: true,
      min: [0, 'Volume cannot be negative'],
    }
  },
  {
    timestamps: true,
  }
);

// Compound index for fast time-series lookup and to prevent duplicate entries
historicalPricesSchema.index({ stockId: 1, date: -1 }, { unique: true });
historicalPricesSchema.index({ symbol: 1, date: -1 });

const HistoricalPrices = mongoose.model('HistoricalPrices', historicalPricesSchema);
export default HistoricalPrices;
