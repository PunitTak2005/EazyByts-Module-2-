import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'tf', 'scenario'],
      default: 'mcq',
    },
    options: [{ type: String }],       // For MCQ and scenario
    correctIndex: { type: Number, required: true }, // Index into options
    explanation: { type: String, default: '' },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    lessonId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Lesson',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Course',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length >= 1,
        message: 'Quiz must have at least one question',
      },
    },
    timeLimitSeconds: {
      type: Number,
      default: 0, // 0 = no time limit
    },
    passingScore: {
      type: Number,
      default: 60, // percentage
    },
    xpReward: {
      type: Number,
      default: 75,
    },
    perfectXpBonus: {
      type: Number,
      default: 25,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

quizSchema.index({ lessonId: 1 });
quizSchema.index({ courseId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
