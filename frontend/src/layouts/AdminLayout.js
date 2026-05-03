import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Header } from '../components/common';
import { useAuth } from '../context/AuthContext';
import {
  IoCheckmark,
  IoLibrary,
  IoFolderOpen,
  IoHome,
  IoPeople,
  IoSettings,
} from 'react-icons/io5';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarItems = isAdmin
    ? [
        { label: 'Dashboard', href: '/admin/dashboard', icon: <IoHome /> },
        { label: 'Issues', href: '/admin/issues', icon: <IoCheckmark /> },
        { label: 'Projects', href: '/admin/projects', icon: <IoFolderOpen /> },
        { label: 'Learn', href: '/admin/learn', icon: <IoLibrary /> },
        { label: 'Members', href: '/admin/members', icon: <IoPeople /> },
        { label: 'Workflows', href: '/admin/workflows', icon: <IoSettings /> },
      ]
    : [
        { label: 'Dashboard', href: '/admin/dashboard', icon: <IoHome /> },
        { label: 'Issues', href: '/admin/issues', icon: <IoCheckmark /> },
        { label: 'Projects', href: '/admin/projects', icon: <IoFolderOpen /> },
        { label: 'Learn', href: '/admin/learn', icon: <IoLibrary /> },
      ];

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="ui-dark-page flex min-h-screen text-white">
      <div className={`hidden shrink-0 md:block ${sidebarCollapsed ? 'w-[84px]' : 'w-[340px]'}`}>
        <Sidebar
          isOpen
          collapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed((value) => !value)}
          closeOnNavigate={false}
          items={sidebarItems}
        />
      </div>

      <div className="md:hidden">
        <Sidebar
          isOpen={sidebarOpen}
          collapsed={false}
          toggleSidebar={() => setSidebarOpen((value) => !value)}
          closeOnNavigate
          items={sidebarItems}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          toggleSidebar={() => setSidebarOpen((value) => !value)}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          user={{
            initial: (user?.username || user?.email || 'U').slice(0, 1).toUpperCase(),
            name: user?.username || 'Workspace User',
            email: user?.email || '',
            role: user?.role || 'Member',
          }}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-5">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
