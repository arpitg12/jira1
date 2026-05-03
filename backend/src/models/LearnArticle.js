import mongoose from 'mongoose';

const learnArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    conclusion: {
      type: String,
      trim: true,
      maxlength: 800,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

learnArticleSchema.index({ title: 1, createdAt: -1 });

export default mongoose.model('LearnArticle', learnArticleSchema);
