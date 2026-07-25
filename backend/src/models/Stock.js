import mongoose from 'mongoose';

const dataPointSchema = new mongoose.Schema({
  time: { type: String, required: true },
  price: { type: Number, required: true },
  open: { type: Number },
  high: { type: Number },
  low: { type: Number },
  close: { type: Number },
  volume: { type: Number }
}, { _id: false });

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    exchange: {
      type: String,
      required: true,
      default: 'NASDAQ',
      index: true,
    },
    sector: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    marketCap: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    previousClose: {
      type: Number,
      required: true,
    },
    open: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      required: true,
    },
    dividend: {
      type: Number,
      default: 0,
    },
    peRatio: {
      type: Number,
      default: null,
    },
    eps: {
      type: Number,
      default: null,
    },
    fiftyTwoWeekHigh: {
      type: Number,
      required: true,
    },
    fiftyTwoWeekLow: {
      type: Number,
      required: true,
    },
    history: {
      "1D": [dataPointSchema],
      "1W": [dataPointSchema],
      "1M": [dataPointSchema],
      "3M": [dataPointSchema],
      "6M": [dataPointSchema],
      "1Y": [dataPointSchema],
      "5Y": [dataPointSchema]
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;
