import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    expirationTime: {
      type: Number,
      default: null,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  { _id: false }
);

const notificationSettingsSchema = new mongoose.Schema(
  {
    TASK_CREATED: {
      type: Boolean,
      default: true,
    },
    TASK_ASSIGNED: {
      type: Boolean,
      default: true,
    },
    TASK_UNASSIGNED: {
      type: Boolean,
      default: true,
    },
    TASK_REVIEW_ASSIGNED: {
      type: Boolean,
      default: true,
    },
    TASK_REVIEW_UNASSIGNED: {
      type: Boolean,
      default: true,
    },
    TASK_COMMENTED: {
      type: Boolean,
      default: true,
    },
    TASK_MENTIONED: {
      type: Boolean,
      default: true,
    },
    TASK_ATTACHMENT_ADDED: {
      type: Boolean,
      default: true,
    },
    TASK_UPDATED: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['Admin', 'Member', 'Lead', 'Developer', 'Designer', 'QA'],
      default: 'Member',
    },
    active: {
      type: Boolean,
      default: true,
    },
    pushSubscriptions: {
      type: [pushSubscriptionSchema],
      default: [],
    },
    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
