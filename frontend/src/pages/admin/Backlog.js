import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Breadcrumb, Button } from '../../components/common';
import { IoAdd } from 'react-icons/io5';

const Backlog = () => {
  const backlogItems = [
    { id: 'JIR-021', title: 'Implement notifications', points: 8, sprint: 'Sprint 5' },
    { id: 'JIR-022', title: 'Add user roles', points: 5, sprint: 'Sprint 5' },
    { id: 'JIR-023', title: 'Performance optimization', points: 13, sprint: 'Sprint 6' },
    { id: 'JIR-024', title: 'Security audit', points: 21, sprint: 'Backlog' },
    { id: 'JIR-025', title: 'Mobile app design', points: 34, sprint: 'Backlog' },
    { id: 'JIR-026', title: 'API documentation', points: 3, sprint: 'Backlog' },
  ];

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Backlog', href: '/admin/backlog', active: true }
        ]} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-dark">Backlog</h1>
          <Button variant="primary" className="flex items-center gap-2">
            <IoAdd /> New Item
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Backlog Items */}
          <div className="lg:col-span-2">
            <Card title="Backlog Items">
              <div className="space-y-2">
                {backlogItems.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-dark">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.id}</p>
                      </div>
                      <Badge variant="info" size="sm">{item.points}pts</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{item.sprint}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sprint Planning */}
          <div className="lg:col-span-2">
            <Card title="Sprint Planning">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Sprint 5 Capacity</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">65/100 Story Points</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Sprint 6 Capacity</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-warning h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">35/100 Story Points</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Backlog;
