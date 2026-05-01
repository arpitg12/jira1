import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  getNotificationPreferences,
  getNotifications,
  getPushPublicKey,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  savePushSubscription,
  updateNotificationPreferences,
} from '../services/api';
import {
  getReadyServiceWorkerRegistration,
  urlBase64ToUint8Array,
} from '../utils/pushNotifications';

const DEFAULT_NOTIFICATION_SETTINGS = {
  TASK_CREATED: true,
  TASK_ASSIGNED: true,
  TASK_UNASSIGNED: true,
  TASK_REVIEW_ASSIGNED: true,
  TASK_REVIEW_UNASSIGNED: true,
  TASK_COMMENTED: true,
  TASK_MENTIONED: true,
  TASK_ATTACHMENT_ADDED: true,
  TASK_UPDATED: true,
};

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [permission, setPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'default'
  );
  const subscriptionAttemptRef = useRef('');

  const refreshNotifications = useCallback(async (limit = 50) => {
    if (!isAuthenticated) {
      setNotifications([]);
      return [];
    }

    try {
      setIsLoadingNotifications(true);
      const data = await getNotifications(limit);
      setNotifications(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const data = await getUnreadNotificationCount();
      const nextCount = Number(data?.unreadCount || 0);
      setUnreadCount(nextCount);
      return nextCount;
    } catch (error) {
      return 0;
    }
  }, [isAuthenticated]);

  const refreshPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    try {
      const data = await getNotificationPreferences();
      const nextSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(data?.notificationSettings || {}),
      };
      setNotificationSettings(nextSettings);
      return nextSettings;
    } catch (error) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }, [isAuthenticated]);

  const ensurePushSubscription = useCallback(async () => {
    if (!isAuthenticated || !user?._id || !('Notification' in window)) {
      return;
    }

    const currentAttemptKey = `${user._id}:${window.Notification.permission}`;
    if (subscriptionAttemptRef.current === currentAttemptKey) {
      return;
    }

    const registration = await getReadyServiceWorkerRegistration();
    if (!registration) {
      return;
    }

    let resolvedPermission = window.Notification.permission;

    if (resolvedPermission === 'default') {
      resolvedPermission = await window.Notification.requestPermission();
    }

    setPermission(resolvedPermission);
    subscriptionAttemptRef.current = `${user._id}:${resolvedPermission}`;

    if (resolvedPermission !== 'granted') {
      return;
    }

    try {
      const publicKeyResponse = await getPushPublicKey();
      const publicKey = publicKeyResponse?.publicKey;

      if (!publicKey) {
        return;
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await savePushSubscription({
        userId: user._id,
        subscription: subscription.toJSON(),
      });
    } catch (error) {
      // Push registration failures should not block the rest of the app.
    }
  }, [isAuthenticated, user?._id]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) {
      return;
    }

    try {
      await markNotificationAsRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      // A failed read update should not break navigation or the panel.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      // Keep the current state if the request fails.
    }
  }, []);

  const savePreferences = useCallback(async (nextSettings) => {
    setIsSavingSettings(true);

    try {
      const response = await updateNotificationPreferences(nextSettings);
      const resolvedSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(response?.notificationSettings || nextSettings),
      };
      setNotificationSettings(resolvedSettings);
      return resolvedSettings;
    } finally {
      setIsSavingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      subscriptionAttemptRef.current = '';
      setNotifications([]);
      setUnreadCount(0);
      setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      return undefined;
    }

    let isMounted = true;

    const loadNotificationState = async () => {
      await Promise.all([
        refreshNotifications(),
        refreshUnreadCount(),
        refreshPreferences(),
      ]);

      if (isMounted) {
        await ensurePushSubscription();
      }
    };

    loadNotificationState();

    const intervalId = window.setInterval(() => {
      refreshNotifications();
      refreshUnreadCount();
    }, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [
    ensurePushSubscription,
    isAuthenticated,
    refreshNotifications,
    refreshPreferences,
    refreshUnreadCount,
  ]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    const handleServiceWorkerMessage = (event) => {
      if (event?.data?.type === 'notification-received') {
        refreshNotifications();
        refreshUnreadCount();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [refreshNotifications, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      notificationSettings,
      isLoadingNotifications,
      isSavingSettings,
      permission,
      refreshNotifications,
      refreshUnreadCount,
      refreshPreferences,
      markAsRead,
      markAllAsRead,
      savePreferences,
    }),
    [
      isLoadingNotifications,
      isSavingSettings,
      markAllAsRead,
      markAsRead,
      notificationSettings,
      notifications,
      permission,
      refreshNotifications,
      refreshPreferences,
      refreshUnreadCount,
      savePreferences,
      unreadCount,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
};
