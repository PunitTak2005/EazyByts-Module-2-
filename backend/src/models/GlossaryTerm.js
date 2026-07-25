import mongoose from 'mongoose';

const glossaryTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: [true, 'Term is required'],
      unique: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
    },
    example: {
      type: String,
      default: '',
    },
    relatedTerms: [{ type: String, trim: true }],
    tags: [{ type: String, lowercase: true, trim: true }],
    letter: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Pre-save: derive letter from first char of term
glossaryTermSchema.pre('save', function (next) {
  this.letter = this.term.charAt(0).toUpperCase();
  next();
});

glossaryTermSchema.index({ term: 'text', definition: 'text' });
glossaryTermSchema.index({ letter: 1 });
glossaryTermSchema.index({ tags: 1 });

const GlossaryTerm = mongoose.model('GlossaryTerm', glossaryTermSchema);
export default GlossaryTerm;
