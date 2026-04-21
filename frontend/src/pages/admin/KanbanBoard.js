import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Modal, Button, Breadcrumb } from '../../components/common';

const KanbanBoard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columns, setColumns] = useState({
    'To Do': [
      { id: 'JIR-001', title: 'Setup database', priority: 'High' },
      { id: 'JIR-002', title: 'Design API', priority: 'High' },
    ],
    'In Progress': [
      { id: 'JIR-003', title: 'Implement auth', priority: 'Critical' },
    ],
    'Review': [
      { id: 'JIR-004', title: 'Dashboard UI', priority: 'Medium' },
      { id: 'JIR-005', title: 'Reports module', priority: 'Medium' },
    ],
    'Done': [
      { id: 'JIR-006', title: 'Project setup', priority: 'Low' },
      { id: 'JIR-007', title: 'Documentation', priority: 'Low' },
    ],
  });

  const priorityColors = {
    'Critical': 'danger',
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'info',
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Kanban Board', href: '/admin/kanban', active: true }
        ]} />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-dark">Kanban Board</h1>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>Add Card</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(columns).map(([columnName, cards]) => (
            <Card key={columnName} title={columnName} className="min-h-96">
              <div className="space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white border-l-4 border-primary p-3 rounded-lg hover:shadow-md transition-shadow cursor-move"
                  >
                    <p className="font-semibold text-sm text-dark">{card.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-mono text-primary">{card.id}</span>
                      <Badge variant={priorityColors[card.priority]} size="sm">
                        {card.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Card">
          <div>
            <p className="text-gray-600">Add a new card to the board...</p>
            <div className="mt-4 space-y-3">
              <input type="text" placeholder="Card title" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <div className="flex gap-2">
                <Button variant="primary">Add</Button>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default KanbanBoard;
