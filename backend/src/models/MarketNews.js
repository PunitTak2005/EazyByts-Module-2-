import mongoose from 'mongoose';

const marketNewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Headline title is required'],
      trim: true,
    },
    source: {
      type: String,
      required: [true, 'News source name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category classification is required'],
      trim: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Article link is required'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      required: [true, 'Article summary is required'],
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index for retrieval by category sorted by date
marketNewsSchema.index({ category: 1, publishedAt: -1 });

const MarketNews = mongoose.model('MarketNews', marketNewsSchema);
export default MarketNews;
