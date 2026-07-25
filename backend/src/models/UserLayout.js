import mongoose from 'mongoose';

const widgetItemSchema = new mongoose.Schema({
  widgetId: {
    type: String,
    required: true,
  },
  colSpan: {
    type: Number,
    enum: [1, 2, 4],
    default: 2,
  },
  order: {
    type: Number,
    required: true,
  },
  isVisible: {
    type: Boolean,
    default: true,
  }
}, { _id: false });

const userLayoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    widgets: {
      type: [widgetItemSchema],
      default: [
        { widgetId: 'portfolio', colSpan: 2, order: 0, isVisible: true },
        { widgetId: 'allocation', colSpan: 2, order: 1, isVisible: true },
        { widgetId: 'movers', colSpan: 2, order: 2, isVisible: true },
        { widgetId: 'watchlist', colSpan: 2, order: 3, isVisible: true },
        { widgetId: 'trades', colSpan: 2, order: 4, isVisible: true }
      ]
    }
  },
  {
    timestamps: true,
  }
);

const UserLayout = mongoose.model('UserLayout', userLayoutSchema);
export default UserLayout;
