import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['ABOVE', 'BELOW'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of active alerts by symbol
alertSchema.index({ symbol: 1, isActive: 1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
