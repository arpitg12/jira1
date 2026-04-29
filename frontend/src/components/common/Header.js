import React, { useState } from 'react';
import { IoLogOut, IoMenu, IoMoon, IoSunny } from 'react-icons/io5';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../../context/ThemeContext';

export const Header = ({ toggleSidebar, user, isAdmin, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  const handleProfileMenuClick = (action) => {
    if (action === 'logout') {
      setShowProfileMenu(false);
      onLogout?.();
      return;
    }
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
              <div>
                <p className="text-sm font-semibold text-white">{isAdmin ? 'Workspace Control' : 'Workspace Board'}</p>
                <p className="text-xs text-white/45">Track tickets, people, and updates in one place.</p>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              <NotificationBell />

              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 hover:bg-white/10"
                title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {isLightMode ? (
                  <IoMoon size={20} className="text-white/70" />
                ) : (
                  <IoSunny size={20} className="text-white/70" />
                )}
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
                  <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-white/10 bg-[#101318] p-3 shadow-2xl">
                    <div className="border-b border-white/10 pb-3">
                      <p className="text-sm font-semibold text-white">{user?.name || 'Workspace User'}</p>
                      <p className="mt-1 text-xs text-white/50">{user?.email || 'user@jiraflow.com'}</p>
                    </div>
                    <div className="pt-3">
                      <button
                        onClick={() => handleProfileMenuClick('logout')}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-danger hover:bg-white/10"
                      >
                        <IoLogOut />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
