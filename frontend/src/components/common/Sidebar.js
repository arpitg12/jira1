import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IoClose, IoMenu } from 'react-icons/io5';

export const Sidebar = ({
  isOpen,
  collapsed = false,
  toggleSidebar,
  closeOnNavigate = false,
  items,
}) => {
  const location = useLocation();

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 md:hidden z-40"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed md:sticky md:top-0 top-0 left-0 h-screen z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Outer gutter (mobile only) */}
        <div className="h-full p-3 md:p-0">
          {/* Panel */}
          <div
            className={`${
              collapsed ? 'w-full' : 'w-full'
            } h-full ${
              // Desktop should feel like a true column (no top/left/bottom gaps)
              'md:rounded-none md:border-r md:border-white/10'
            } ui-sidebar-panel rounded-3xl text-white shadow-2xl border border-white/10 overflow-hidden transition-[width] duration-300`}
          >
            <div className={`flex items-center justify-between ${collapsed ? 'px-3' : 'px-5'} py-4`}>
              <div className="flex items-center gap-2 min-w-0">
                {!collapsed && <h1 className="text-xl font-semibold tracking-tight">Jira</h1>}
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
                title={collapsed ? 'Open sidebar' : 'Close sidebar'}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                {collapsed ? <IoMenu size={18} /> : <IoClose size={18} />}
              </button>
            </div>

            <nav className={`${collapsed ? 'px-2' : 'px-4'} pb-4 space-y-3`}>
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (closeOnNavigate) toggleSidebar();
                    }}
                    className={`group flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border transition ${
                      active
                        ? 'bg-[#2a2cff]/20 border-[#5b5dff]/50 shadow-[0_0_0_2px_rgba(91,93,255,0.35)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`${active ? 'text-[#6b6dff]' : 'text-white/70'} text-lg`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className={`truncate text-lg ${active ? 'text-white' : 'text-white/80'}`}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!collapsed && typeof item.count === 'number' && (
                      <span
                        className={`text-sm px-3 py-1 rounded-full border ${
                          active
                            ? 'bg-[#2a2cff]/30 border-[#5b5dff]/40 text-white'
                            : 'bg-white/5 border-white/10 text-white/70'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {!collapsed && (
              <div className="mt-auto px-5 py-4 text-xs text-white/40 border-t border-white/10">
                (c) 2026 Jira Admin
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};



