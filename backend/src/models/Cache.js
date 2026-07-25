import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired documents using MongoDB TTL index
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cache = mongoose.model('Cache', cacheSchema);
export default Cache;
