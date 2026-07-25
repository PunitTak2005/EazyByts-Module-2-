import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '🏅',
    },
    xpReward: {
      type: Number,
      default: 50,
    },
    condition: {
      // JSON-serialised trigger condition for the learning service
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);


const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);
export default Achievement;
