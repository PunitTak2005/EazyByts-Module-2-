import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, required: true },      // percentage 0-100
    passed: { type: Boolean, required: true },
    answers: [{ type: Number }],                  // submitted answer indices
    xpEarned: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 1 },
  },
  { _id: false }
);

const learningProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Course',
      required: true,
    },
    completedLessons: [
      {
        lessonId: { type: mongoose.Schema.Types.Mixed, ref: 'Lesson' },
        completedAt: { type: Date, default: Date.now },
        timeSpentMinutes: { type: Number, default: 0 },
      },
    ],
    quizResults: [quizResultSchema],
    percentComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    // Denormalized fields for fast dashboard queries
    totalXP: {
      type: Number,
      default: 0,
    },
    currentLevel: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
    },
    badges: [
      {
        key: { type: String },
        title: { type: String },
        icon: { type: String },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

learningProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
learningProgressSchema.index({ userId: 1 });

const LearningProgress = mongoose.model('LearningProgress', learningProgressSchema);
export default LearningProgress;
