import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Button, Breadcrumb } from '../../components/common';
import { IoToggle } from 'react-icons/io5';

const AdminPanel = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    signupEnabled: true,
    apiEnabled: true,
    analyticsEnabled: true,
  });

  const systemStats = [
    { title: 'System Health', value: '99.8%', status: 'healthy' },
    { title: 'API Uptime', value: '99.9%', status: 'healthy' },
    { title: 'Database', value: 'Optimal', status: 'healthy' },
    { title: 'Cache', value: 'Active', status: 'healthy' },
  ];

  const toggleSetting = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Admin Panel', href: '/admin/admin-panel', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-dark mb-6">System Administration</h1>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {systemStats.map((stat, idx) => (
            <Card key={idx}>
              <p className="text-gray-600 text-sm mb-2">{stat.title}</p>
              <p className="text-2xl font-bold text-dark">{stat.value}</p>
              <Badge variant="success" size="sm" className="mt-2">Operational</Badge>
            </Card>
          ))}
        </div>

        {/* System Settings */}
        <Card title="System Settings" className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-semibold text-dark">Maintenance Mode</p>
                <p className="text-sm text-gray-600">Put system in maintenance mode</p>
              </div>
              <button
                onClick={() => toggleSetting('maintenanceMode')}
                className={`text-2xl transition-colors ${settings.maintenanceMode ? 'text-danger' : 'text-gray-400'}`}
              >
                <IoToggle />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-semibold text-dark">Allow New Signups</p>
                <p className="text-sm text-gray-600">Enable/disable user registration</p>
              </div>
              <button
                onClick={() => toggleSetting('signupEnabled')}
                className={`text-2xl transition-colors ${settings.signupEnabled ? 'text-success' : 'text-gray-400'}`}
              >
                <IoToggle />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-semibold text-dark">Enable API</p>
                <p className="text-sm text-gray-600">Enable/disable external API access</p>
              </div>
              <button
                onClick={() => toggleSetting('apiEnabled')}
                className={`text-2xl transition-colors ${settings.apiEnabled ? 'text-success' : 'text-gray-400'}`}
              >
                <IoToggle />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-semibold text-dark">Analytics</p>
                <p className="text-sm text-gray-600">Collect usage analytics</p>
              </div>
              <button
                onClick={() => toggleSetting('analyticsEnabled')}
                className={`text-2xl transition-colors ${settings.analyticsEnabled ? 'text-success' : 'text-gray-400'}`}
              >
                <IoToggle />
              </button>
            </div>
          </div>
        </Card>

        {/* Maintenance */}
        <Card title="Maintenance Tasks">
          <div className="space-y-2">
            <Button variant="outline" className="w-full text-left">Clear Cache</Button>
            <Button variant="outline" className="w-full text-left">Optimize Database</Button>
            <Button variant="outline" className="w-full text-left">Backup Data</Button>
            <Button variant="danger" className="w-full text-left mt-4">Reset System</Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;
