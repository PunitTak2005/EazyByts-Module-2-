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

// Compound indexes for ultra-fast history queries and daily snapshot uniqueness
portfolioSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });
portfolioSnapshotSchema.index({ userId: 1, timestamp: 1 });

const PortfolioSnapshot = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);
export default PortfolioSnapshot;
