import Notification from '../models/Notification.js';
import User from '../models/User.js';

const DEFAULT_SETTINGS = {
  TASK_CREATED: true,
  TASK_ASSIGNED: true,
  TASK_COMMENTED: true,
  TASK_MENTIONED: true,
  TASK_UPDATED: true,
};

export const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      {
        $set: {
          isRead: true,
        },
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    res.json({
      notificationSettings: {
        ...DEFAULT_SETTINGS,
        ...(user?.notificationSettings?.toObject?.() || user?.notificationSettings || {}),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const incomingSettings = req.body?.notificationSettings || {};

    const normalizedSettings = {
      TASK_CREATED:
        incomingSettings.TASK_CREATED === undefined
          ? DEFAULT_SETTINGS.TASK_CREATED
          : Boolean(incomingSettings.TASK_CREATED),
      TASK_ASSIGNED:
        incomingSettings.TASK_ASSIGNED === undefined
          ? DEFAULT_SETTINGS.TASK_ASSIGNED
          : Boolean(incomingSettings.TASK_ASSIGNED),
      TASK_COMMENTED:
        incomingSettings.TASK_COMMENTED === undefined
          ? DEFAULT_SETTINGS.TASK_COMMENTED
          : Boolean(incomingSettings.TASK_COMMENTED),
      TASK_MENTIONED:
        incomingSettings.TASK_MENTIONED === undefined
          ? DEFAULT_SETTINGS.TASK_MENTIONED
          : Boolean(incomingSettings.TASK_MENTIONED),
      TASK_UPDATED:
        incomingSettings.TASK_UPDATED === undefined
          ? DEFAULT_SETTINGS.TASK_UPDATED
          : Boolean(incomingSettings.TASK_UPDATED),
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          notificationSettings: normalizedSettings,
        },
      },
      { new: true, runValidators: true }
    ).select('notificationSettings');

    res.json({
      message: 'Notification preferences updated',
      notificationSettings: user?.notificationSettings || normalizedSettings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
