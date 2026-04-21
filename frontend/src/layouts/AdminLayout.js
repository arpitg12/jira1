import React, { useState } from 'react';
import { Sidebar, Header } from '../components/common';
import {
  IoHome,
  IoCheckmark,
  IoFolderOpen,
  IoPeople,
  IoSettings,
  IoBarChart,
  IoSearch,
} from 'react-icons/io5';

const AdminLayout = ({ children }) => {
  // Mobile overlay open/close
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapsed rail
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <IoHome /> },
    { label: 'Issues', href: '/admin/issues', icon: <IoCheckmark /> },
    { label: 'Projects', href: '/admin/projects', icon: <IoFolderOpen /> },
    { label: 'Members', href: '/admin/members', icon: <IoPeople /> },
    { label: 'Workflows', href: '/admin/workflows', icon: <IoSettings /> },
    { label: 'Reports', href: '/admin/reports', icon: <IoBarChart /> },
    { label: 'Search', href: '/admin/search', icon: <IoSearch /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#050608] text-white">
      {/* Desktop: 2-column layout. Mobile: overlay sidebar via isOpen */}
      <div className={`hidden md:block shrink-0 ${sidebarCollapsed ? 'w-[84px]' : 'w-[340px]'}`}>
        <Sidebar
          isOpen
          collapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed((v) => !v)}
          closeOnNavigate={false}
          items={sidebarItems}
        />
      </div>

      {/* Mobile overlay sidebar */}
      <div className="md:hidden">
        <Sidebar
          isOpen={sidebarOpen}
          collapsed={false}
          toggleSidebar={() => setSidebarOpen((v) => !v)}
          closeOnNavigate
          items={sidebarItems}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#050608]">
        <Header
          toggleSidebar={() => setSidebarOpen((v) => !v)}
          user={{ initial: 'A', name: 'Admin User', email: 'admin@jira.com' }}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-5 bg-[#050608]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
