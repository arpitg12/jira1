import React, { useState } from 'react';
import { IoMenu, IoNotifications, IoSettings, IoLogOut, IoSearch } from 'react-icons/io5';
import { Modal, Button } from './index';

export const Header = ({ toggleSidebar, user }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const notifications = [
    { id: 1, title: 'Issue JIR-001 assigned', message: 'You have been assigned to fix login bug', time: '5 min ago' },
    { id: 2, title: 'Project update', message: 'New sprint started', time: '1 hour ago' },
    { id: 3, title: 'Member joined', message: 'John Doe joined the team', time: '2 hours ago' },
  ];

  const profileMenuItems = [
    { label: 'Profile Settings', action: 'profile' },
    { label: 'Account Settings', action: 'settings' },
    { divider: true },
    { label: 'Admin Panel', action: 'admin' },
    { divider: true },
    { label: 'Logout', action: 'logout' },
  ];

  const handleProfileMenuClick = (action) => {
    if (action === 'logout') {
      console.log('Logging out...');
    } else if (action === 'admin') {
      setShowSettings(true);
      setShowProfileMenu(false);
    } else if (action === 'settings') {
      setShowProfileMenu(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30">
        <div className="px-3 md:px-5 py-2.5">
          <div className="ui-surface-muted ui-shadow flex items-center justify-between px-3 md:px-4 py-2.5">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 hover:bg-white/8 rounded-lg text-white/80"
              >
                <IoMenu size={20} />
              </button>

              <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-72">
                <IoSearch className="text-white/40" />
                <input
                  type="text"
                  placeholder="Search issues, projects..."
                  className="bg-transparent ml-2 outline-none w-full text-sm text-white placeholder:text-white/35 border-0 ring-0 p-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 hover:bg-white/8 rounded-lg"
              >
                <IoNotifications size={20} className="text-white/70" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
              </button>

              <button className="p-2 hover:bg-white/8 rounded-lg">
                <IoSettings size={20} className="text-white/70" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-white/8 rounded-xl"
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {user?.initial || 'A'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-white">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-white/50">{user?.email || 'admin@jira.com'}</p>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#101318] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                    {profileMenuItems.map((item, idx) => (
                      item.divider ? (
                        <hr key={idx} className="my-2 border-white/10" />
                      ) : (
                        <button
                          key={idx}
                          onClick={() => handleProfileMenuClick(item.action)}
                          className={`w-full text-left px-4 py-2 hover:bg-white/8 flex items-center gap-2 ${
                            item.label === 'Logout' ? 'text-danger' : 'text-white/85'
                          }`}
                        >
                          {item.label === 'Logout' && <IoLogOut />}
                          {item.label}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      {showNotifications && (
        <Modal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          title="Notifications"
          size="md"
        >
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 border border-white/10 rounded-xl hover:bg-white/5">
                <p className="font-semibold text-white text-sm">{notif.title}</p>
                <p className="text-white/65 text-sm mt-1">{notif.message}</p>
                <p className="text-white/40 text-xs mt-2">{notif.time}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Admin Settings Modal */}
      {showSettings && (
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Admin Panel"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-4">System Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-white/10 rounded-xl bg-white/5">
                  <p className="text-xs text-white/55">System Health</p>
                  <p className="text-2xl font-bold text-success mt-1">99.8%</p>
                </div>
                <div className="p-3 border border-white/10 rounded-xl bg-white/5">
                  <p className="text-xs text-white/55">API Uptime</p>
                  <p className="text-2xl font-bold text-success mt-1">99.9%</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Feature Toggles</h3>
              <div className="space-y-2">
                {['Maintenance Mode', 'Allow Signups', 'Enable API', 'Analytics'].map((feature) => (
                  <div key={feature} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-white/85">{feature}</span>
                    <button className="w-10 h-6 bg-white/15 rounded-full relative">
                      <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Maintenance Tasks</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Clear Cache', 'Optimize DB', 'Backup Data', 'Reset System'].map((task) => (
                  <Button key={task} variant="outline" size="sm">{task}</Button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
