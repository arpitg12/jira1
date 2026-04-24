import React, { useState } from 'react';
import { IoLogOut, IoMenu, IoSearch, IoSettings } from 'react-icons/io5';
import { Button, Modal } from './index';
import { NotificationBell } from './NotificationBell';
import { NotificationPreferencesForm } from './NotificationPreferencesForm';

export const Header = ({ toggleSidebar, user, isAdmin, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const profileMenuItems = [
    { label: 'Profile Settings', action: 'profile' },
    { label: 'Account Settings', action: 'settings' },
    ...(isAdmin ? [{ divider: true }, { label: 'Admin Panel', action: 'admin' }] : []),
    { divider: true },
    { label: 'Logout', action: 'logout' },
  ];

  const handleProfileMenuClick = (action) => {
    if (action === 'logout') {
      setShowProfileMenu(false);
      onLogout?.();
      return;
    }

    if (action === 'admin' || action === 'settings') {
      setShowSettings(true);
    }

    setShowProfileMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30">
        <div className="px-3 py-2.5 md:px-5">
          <div className="ui-surface-muted ui-shadow flex items-center justify-between px-3 py-2.5 md:px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 md:hidden"
              >
                <IoMenu size={20} />
              </button>

              <div className="hidden min-w-72 items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:flex">
                <IoSearch className="text-white/40" />
                <input
                  type="text"
                  placeholder="Search issues, projects..."
                  className="ml-2 w-full border-0 bg-transparent p-0 text-sm text-white outline-none ring-0 placeholder:text-white/35"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              <NotificationBell />

              <button onClick={() => setShowSettings(true)} className="rounded-lg p-2 hover:bg-white/10">
                <IoSettings size={20} className="text-white/70" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((value) => !value)}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">
                    {user?.initial || 'U'}
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold text-white">{user?.name || 'Workspace User'}</p>
                    <p className="text-xs text-white/50">
                      {user?.role || 'Member'} - {user?.email || 'user@jiraflow.com'}
                    </p>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#101318] py-2 shadow-2xl">
                    {profileMenuItems.map((item, idx) =>
                      item.divider ? (
                        <hr key={idx} className="my-2 border-white/10" />
                      ) : (
                        <button
                          key={idx}
                          onClick={() => handleProfileMenuClick(item.action)}
                          className={`flex w-full items-center gap-2 px-4 py-2 text-left ${
                            item.label === 'Logout' ? 'text-danger' : 'text-white/80'
                          } hover:bg-white/10`}
                        >
                          {item.label === 'Logout' && <IoLogOut />}
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showSettings && (
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title={isAdmin ? 'Admin Panel' : 'Workspace Overview'}
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-white">Workspace Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/55">{isAdmin ? 'System Health' : 'Assigned Focus'}</p>
                  <p className="mt-1 text-2xl font-bold text-success">{isAdmin ? '99.8%' : 'High'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-white/55">{isAdmin ? 'API Uptime' : 'Role Access'}</p>
                  <p className="mt-1 text-2xl font-bold text-success">{isAdmin ? '99.9%' : user?.role || 'Member'}</p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div>
                <h3 className="mb-3 font-semibold text-white">Feature Toggles</h3>
                <div className="space-y-2">
                  {['Maintenance Mode', 'Allow Signups', 'Enable API', 'Analytics'].map((feature) => (
                    <div key={feature} className="flex items-center justify-between rounded-lg bg-white/5 p-2">
                      <span className="text-sm text-white/80">{feature}</span>
                      <button className="relative h-6 w-10 rounded-full bg-white/20">
                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-3 font-semibold text-white">{isAdmin ? 'Maintenance Tasks' : 'Quick Actions'}</h3>
              <div className="grid grid-cols-2 gap-2">
                {(isAdmin
                  ? ['Clear Cache', 'Optimize DB', 'Backup Data', 'Reset System']
                  : ['My Issues', 'My Projects', 'Notifications', 'Profile']).map((task) => (
                  <Button key={task} variant="outline" size="sm">
                    {task}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-white">Notification Preferences</h3>
              <NotificationPreferencesForm />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
