import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    default: 'TASK_UPDATED',
    trim: true,
  },
  actorName: {
    type: String,
    default: '',
    trim: true,
  },
  actionText: {
    type: String,
    default: '',
    trim: true,
  },
  issueTitle: {
    type: String,
    default: '',
    trim: true,
  },
  issueKey: {
    type: String,
    default: '',
    trim: true,
  },
  issueStatus: {
    type: String,
    default: '',
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
