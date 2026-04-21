import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    states: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GlobalState',
      }
    ],
    defaultState: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GlobalState',
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Workflow', workflowSchema);
