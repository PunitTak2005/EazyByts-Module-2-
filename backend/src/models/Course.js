import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 800,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    thumbnail: {
      type: String,
      default: '',
    },
    estimatedHours: {
      type: Number,
      default: 1,
      min: 0,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Lesson',
      },
    ],
    modules: [
      {
        id: String,
        title: String,
        description: String,
        duration: String,
        lessonCount: Number,
        lessons: [String],
      },
    ],
    xpReward: {
      type: Number,
      default: 200,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

courseSchema.index({ level: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export default Course;
