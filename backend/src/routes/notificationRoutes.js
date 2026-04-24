import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotificationPreferences,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);
router.post('/mark-read/:id', markNotificationRead);
router.post('/mark-all-read', markAllNotificationsRead);

export default router;
