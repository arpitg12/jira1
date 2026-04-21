import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Breadcrumb } from '../../components/common';

const Roadmap = () => {
  const roadmapItems = [
    {
      quarter: 'Q1 2024',
      items: [
        { name: 'Core infrastructure', status: 'Completed', progress: 100 },
        { name: 'User authentication', status: 'Completed', progress: 100 },
      ]
    },
    {
      quarter: 'Q2 2024',
      items: [
        { name: 'Dashboard & reporting', status: 'In Progress', progress: 75 },
        { name: 'API development', status: 'In Progress', progress: 60 },
      ]
    },
    {
      quarter: 'Q3 2024',
      items: [
        { name: 'Mobile app', status: 'Planning', progress: 20 },
        { name: 'Advanced analytics', status: 'Planning', progress: 10 },
      ]
    },
    {
      quarter: 'Q4 2024',
      items: [
        { name: 'AI features', status: 'Planned', progress: 0 },
        { name: 'Enterprise integration', status: 'Planned', progress: 0 },
      ]
    },
  ];

  const statusColors = {
    'Completed': 'success',
    'In Progress': 'info',
    'Planning': 'warning',
    'Planned': 'secondary',
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Roadmap', href: '/admin/roadmap', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-dark mb-6">Product Roadmap</h1>

        <div className="space-y-6">
          {roadmapItems.map((quarter, idx) => (
            <Card key={idx} title={quarter.quarter}>
              <div className="space-y-4">
                {quarter.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-dark">{item.name}</p>
                      <Badge variant={statusColors[item.status]}>{item.status}</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.progress}% Complete</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Roadmap;
