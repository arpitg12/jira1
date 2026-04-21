import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Breadcrumb } from '../../components/common';
import { IoClose } from 'react-icons/io5';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'issue', title: 'New issue assigned', message: 'JIR-001 assigned to you', timestamp: '2 hours ago', read: false },
    { id: 2, type: 'comment', title: 'New comment', message: 'John commented on JIR-002', timestamp: '3 hours ago', read: false },
    { id: 3, type: 'mention', title: 'You were mentioned', message: 'Jane mentioned you in JIR-003', timestamp: '5 hours ago', read: true },
    { id: 4, type: 'update', title: 'Status updated', message: 'JIR-004 moved to Review', timestamp: '1 day ago', read: true },
    { id: 5, type: 'approval', title: 'Approval needed', message: 'Your approval needed for JIR-005', timestamp: '2 days ago', read: true },
  ]);

  const stats = [
    { title: 'Unread', value: 2, color: 'danger' },
    { title: 'This Week', value: 12, color: 'info' },
    { title: 'This Month', value: 48, color: 'warning' },
  ];

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const typeIcons = {
    'issue': '📋',
    'comment': '💬',
    'mention': '👤',
    'update': '✅',
    'approval': '👍',
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Notifications', href: '/admin/notifications', active: true }
        ]} />
        <h1 className="ui-title mb-4">Notifications</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <p className="text-gray-600 text-xs mb-1">{stat.title}</p>
              <p className="text-xl font-bold text-dark leading-tight">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Notifications List */}
        <Card title="All Notifications">
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  notif.read ? 'bg-white/40 border-gray-200' : 'bg-blue-50/60 border-primary'
                }`}
              >
                <div className="text-2xl flex-shrink-0">{typeIcons[notif.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-dark">{notif.title}</h4>
                    {!notif.read && <Badge variant="danger" size="sm">New</Badge>}
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{notif.message}</p>
                  <p className="text-xs text-gray-500">{notif.timestamp}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="text-gray-500 hover:text-gray-700 flex-shrink-0 p-1 rounded hover:bg-gray-100"
                >
                  <IoClose size={20} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Notifications;
