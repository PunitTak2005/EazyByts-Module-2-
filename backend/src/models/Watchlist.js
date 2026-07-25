import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      default: 'My Watchlist',
      trim: true,
    },
    stocks: [
      {
        type: String,
        trim: true,
        uppercase: true,
      }
    ]
  },
  {
    timestamps: true,
  }
);

watchlistSchema.index({ userId: 1, name: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;
