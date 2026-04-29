import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCheckmarkDone, IoNotifications, IoRefresh } from 'react-icons/io5';
import { useNotifications } from '../../context/NotificationContext';

const formatRelativeTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absMinutes < 1) {
    return 'Just now';
  }

  if (absMinutes < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
};

const getInitials = (label = '') =>
  String(label)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'NT';

const getNotificationHeadline = (notification) =>
  notification?.body || notification?.title || 'Notification';

const getNotificationIssueMeta = (notification) => {
  if (notification?.issueKey && notification?.issueStatus) {
    return `${notification.issueKey} • ${notification.issueStatus}`;
  }

  if (notification?.issueKey) {
    return notification.issueKey;
  }

  return '';
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    markAllAsRead,
    markAsRead,
    refreshNotifications,
  } = useNotifications();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications]
  );

  const handleNotificationClick = async (notification) => {
    if (!notification?.isRead) {
      await markAsRead(notification._id);
    }

    setIsOpen(false);
    navigate(notification?.url || '/admin/issues');
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative rounded-lg p-2 hover:bg-white/10"
        aria-label="Notifications"
      >
        <IoNotifications size={20} className="text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-white/45">{unreadNotifications.length} unread</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refreshNotifications()}
                className="rounded-lg p-2 text-white/55 hover:bg-white/10 hover:text-white"
                title="Refresh"
                aria-label="Refresh notifications"
              >
                <IoRefresh size={15} />
              </button>
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                <IoCheckmarkDone size={14} />
                Mark all as read
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="px-4 py-6 text-center text-sm text-white/50">Loading notifications...</div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const issueMeta = getNotificationIssueMeta(notification);

                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                      notification.isRead ? 'bg-transparent' : 'bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-primary/20 text-sm font-semibold text-white">
                        {getInitials(notification.actorName || notification.title)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-white">
                            {getNotificationHeadline(notification)}
                          </p>
                          <p className="shrink-0 text-xs text-white/40">{formatRelativeTime(notification.createdAt)}</p>
                        </div>
                        {issueMeta && (
                          <p className="mt-1 text-xs text-white/45">{issueMeta}</p>
                        )}
                      </div>
                      {!notification.isRead && (
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-white/75">No notifications yet</p>
                <p className="mt-1 text-xs text-white/45">New task activity will show up here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
