import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Breadcrumb } from '../../components/common';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IoArrowUp, IoArrowDown } from 'react-icons/io5';

const Dashboard = () => {
  const breadcrumbs = [
    { label: 'Home', href: '/admin', active: false },
    { label: 'Dashboard', href: '/admin/dashboard', active: true }
  ];

  const stats = [
    { title: 'Total Issues', value: '2,456', change: '+12%', isPositive: true },
    { title: 'Open Issues', value: '543', change: '+8%', isPositive: true },
    { title: 'In Progress', value: '234', change: '-3%', isPositive: false },
    { title: 'Completed', value: '1,679', change: '+25%', isPositive: true },
  ];

  const lineChartData = [
    { name: 'Jan', issues: 400 },
    { name: 'Feb', issues: 520 },
    { name: 'Mar', issues: 480 },
    { name: 'Apr', issues: 650 },
    { name: 'May', issues: 720 },
  ];

  const barChartData = [
    { name: 'Bug', count: 120 },
    { name: 'Feature', count: 250 },
    { name: 'Task', count: 180 },
    { name: 'Epic', count: 90 },
  ];

  const recentIssues = [
    { id: 'JIR-001', title: 'Fix login bug', status: 'In Progress', priority: 'High' },
    { id: 'JIR-002', title: 'Add dark mode', status: 'Review', priority: 'Medium' },
    { id: 'JIR-003', title: 'Update documentation', status: 'To Do', priority: 'Low' },
    { id: 'JIR-004', title: 'Performance optimization', status: 'In Progress', priority: 'High' },
    { id: 'JIR-005', title: 'Security audit', status: 'Done', priority: 'Critical' },
    { id: 'JIR-006', title: 'API integration', status: 'Review', priority: 'High' },
  ];

  const statusColors = {
    'To Do': 'primary',
    'In Progress': 'info',
    'Review': 'warning',
    'Done': 'success',
  };

  const priorityColors = {
    'Critical': 'danger',
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'info',
  };

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        <Breadcrumb items={breadcrumbs} />
        <h1 className="text-xl font-bold text-white mb-4">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="ui-dark-surface ui-shadow p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-xs mb-1">{stat.title}</p>
                  <p className="text-xl font-bold text-white leading-tight">{stat.value}</p>
                </div>
                <div className={`flex items-center gap-1 ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.isPositive ? <IoArrowUp /> : <IoArrowDown />}
                  <span className="text-sm font-semibold">{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>



        {/* Recent Issues */}
        <div className="ui-dark-surface ui-shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white/90">Recent Issues</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table className="ui-dark-table">
              <thead className="ui-dark-thead">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">ID</th>
                  <th className="px-3 py-2 text-left font-semibold">Title</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentIssues.map((issue) => (
                  <tr key={issue.id} className="ui-dark-tr">
                    <td className="px-3 py-2 font-semibold text-white/80 text-sm">{issue.id}</td>
                    <td className="px-3 py-2 text-white/80 text-sm">{issue.title}</td>
                    <td className="px-3 py-2">
                      <Badge size="sm" variant={statusColors[issue.status]}>{issue.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge size="sm" variant={priorityColors[issue.priority]}>{issue.priority}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
