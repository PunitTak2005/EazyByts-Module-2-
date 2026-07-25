import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    courseId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      // Markdown formatted lesson content
    },
    summary: {
      type: String,
      maxlength: 500,
    },
    keyTakeaways: [
      {
        type: String,
        trim: true,
      },
    ],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    estimatedMinutes: {
      type: Number,
      default: 10,
      min: 1,
    },
    contentType: {
      type: String,
      enum: ['reading', 'video', 'interactive'],
      default: 'reading',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    glossaryTerms: [{ type: String, trim: true }],
    relatedLessons: [
      {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Lesson',
      },
    ],
    xpReward: {
      type: Number,
      default: 50,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    simulatorContext: {
      // Optional hint for the trading simulator integration
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ slug: 1 });
lessonSchema.index({ difficulty: 1 });
lessonSchema.index({ title: 'text', content: 'text', summary: 'text' });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
