import mongoose from 'mongoose';

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD' formatted date string for distinct daily snapshots
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    netWorth: {
      type: Number,
      required: true,
    },
    cashBalance: {
      type: Number,
      required: true,
    },
    holdingsValue: {
      type: Number,
      required: true,
    },
    totalInvestment: {
      type: Number,
      default: 0,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one snapshot per user per calendar day
portfolioSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

const PortfolioSnapshot = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);
export default PortfolioSnapshot;
