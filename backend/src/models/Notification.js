import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Alert',
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Price Alert', 'Trade Success', 'Trade Failure', 'Portfolio Milestone', 'Market News', 'General'],
      default: 'General',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
