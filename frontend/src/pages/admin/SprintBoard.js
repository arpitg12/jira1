import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Breadcrumb } from '../../components/common';
import { IoCheckmarkCircle, IoEllipse } from 'react-icons/io5';

const SprintBoard = () => {
  const sprintDetails = {
    name: 'Sprint 24',
    startDate: 'Apr 15, 2024',
    endDate: 'Apr 29, 2024',
    progress: 61,
    totalIssues: 23,
    completedIssues: 14,
  };

  const tasks = [
    { id: 'JIR-001', title: 'Login form validation', completed: true },
    { id: 'JIR-002', title: 'Password reset flow', completed: true },
    { id: 'JIR-003', title: 'Two-factor auth', completed: true },
    { id: 'JIR-004', title: 'Session management', completed: false },
    { id: 'JIR-005', title: 'OAuth integration', completed: false },
    { id: 'JIR-006', title: 'Login UI design', completed: true },
    { id: 'JIR-007', title: 'Error handling', completed: false },
    { id: 'JIR-008', title: 'Testing & QA', completed: false },
    { id: 'JIR-009', title: 'Documentation', completed: false },
  ];

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Sprint Board', href: '/admin/sprint', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-dark mb-6">Sprint Board</h1>

        {/* Sprint Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-bold text-dark mb-4">{sprintDetails.name}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Start:</span> {sprintDetails.startDate}</p>
              <p><span className="font-semibold">End:</span> {sprintDetails.endDate}</p>
              <p><span className="font-semibold">Progress:</span> {sprintDetails.progress}%</p>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-dark mb-4">Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <div className="bg-success h-4 rounded-full" style={{ width: `${sprintDetails.progress}%` }}></div>
            </div>
            <p className="text-sm text-gray-600">
              {sprintDetails.completedIssues} of {sprintDetails.totalIssues} issues completed
            </p>
          </Card>
        </div>

        {/* Tasks */}
        <Card title="Sprint Tasks">
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className={`text-xl ${task.completed ? 'text-success' : 'text-gray-400'}`}>
                  {task.completed ? <IoCheckmarkCircle /> : <IoEllipse />}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-dark'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">{task.id}</p>
                </div>
                <Badge variant={task.completed ? 'success' : 'warning'} size="sm">
                  {task.completed ? 'Done' : 'In Progress'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SprintBoard;
