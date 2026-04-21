import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Breadcrumb } from '../../components/common';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const metrics = [
    { title: 'Avg Resolution Time', value: '2.3 days', change: '-5%' },
    { title: 'Completion Rate', value: '87%', change: '+8%' },
    { title: 'Team Velocity', value: '156 pts', change: '+12%' },
    { title: 'Open Issues', value: '543', change: '+15%' },
  ];

  const statusData = [
    { name: 'To Do', value: 200 },
    { name: 'In Progress', value: 150 },
    { name: 'Review', value: 120 },
    { name: 'Done', value: 800 },
  ];

  const priorityData = [
    { name: 'Mon', critical: 5, high: 15, medium: 20, low: 8 },
    { name: 'Tue', critical: 3, high: 12, medium: 18, low: 10 },
    { name: 'Wed', critical: 4, high: 14, medium: 22, low: 7 },
    { name: 'Thu', critical: 2, high: 18, medium: 25, low: 9 },
    { name: 'Fri', critical: 6, high: 20, medium: 28, low: 11 },
  ];

  const COLORS = ['#0055CC', '#FEC57B', '#DC2D15', '#00875A'];

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Reports', href: '/admin/reports', active: true }
        ]} />
        <h1 className="ui-title mb-4">Reports & Analytics</h1>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {metrics.map((metric, idx) => (
            <Card key={idx}>
              <p className="text-gray-600 text-xs mb-1">{metric.title}</p>
              <p className="text-xl font-bold text-dark leading-tight">{metric.value}</p>
              <p className={`text-xs mt-2 ${metric.change.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                {metric.change}
              </p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <Card title="Issue Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Issue Priority by Day">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="critical" fill="#DC2D15" />
                <Bar dataKey="high" fill="#FEC57B" />
                <Bar dataKey="medium" fill="#0055CC" />
                <Bar dataKey="low" fill="#00875A" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Summary */}
        <Card title="Summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-dark mb-3">Key Insights</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>- Team velocity increased by 12% this sprint</li>
                <li>- Resolution time improved to 2.3 days average</li>
                <li>- Critical issues down from 8 to 6</li>
                <li>- 87% of issues completed on time</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-dark mb-3">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>- Focus on reducing high-priority backlog</li>
                <li>- Improve code review turnaround time</li>
                <li>- Increase test coverage for critical features</li>
                <li>- Consider adding more QA resources</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reports;

