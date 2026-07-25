import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    averagePrice: {
      type: Number,
      required: true,
      min: [0, 'Average price cannot be negative'],
    },
    currentPrice: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Unique holding index per user and stock ticker
holdingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Holding = mongoose.model('Holding', holdingSchema);
export default Holding;
