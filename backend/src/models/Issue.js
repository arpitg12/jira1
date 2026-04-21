import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    issueType: {
      type: String,
      enum: ['Bug', 'Feature', 'Task', 'Improvement'],
      default: 'Task',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      default: 'To Do',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [String],
    customFields: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, validateBeforeSave: true }
);

// Remove any problematic validators and ensure clean validation
issueSchema.pre('save', function(next) {
  // Ensure workflow field is not validated on Issue model
  this.workflow = undefined;
  next();
});

issueSchema.pre('findByIdAndUpdate', function(next) {
  // Ensure workflow field is not validated on Issue model
  if (this.getUpdate().$set) {
    delete this.getUpdate().$set.workflow;
  } else {
    delete this.getUpdate().workflow;
  }
  next();
});

export default mongoose.model('Issue', issueSchema);
