import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Button, Breadcrumb, InputField, TextArea, Select } from '../../components/common';

const CreateProject = () => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    template: 'kanban',
    lead: '',
    category: 'software',
    access: 'open',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Project created:', formData);
  };

  return (
    <AdminLayout>
      <div>
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Projects', href: '/admin/projects' },
          { label: 'Create', href: '#', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-dark mb-6">Create New Project</h1>

        <div className="max-w-2xl">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Project Name"
                type="text"
                name="name"
                placeholder="My Awesome Project"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <InputField
                label="Project Key"
                type="text"
                name="key"
                placeholder="PRJ"
                value={formData.key}
                onChange={handleChange}
                required
              />

              <TextArea
                label="Description"
                name="description"
                placeholder="Project description..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />

              <Select
                label="Template"
                name="template"
                value={formData.template}
                onChange={handleChange}
                options={[
                  { value: 'kanban', label: 'Kanban' },
                  { value: 'scrum', label: 'Scrum' },
                  { value: 'basic', label: 'Basic' },
                ]}
              />

              <InputField
                label="Project Lead"
                type="text"
                name="lead"
                placeholder="Select lead..."
                value={formData.lead}
                onChange={handleChange}
              />

              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={[
                  { value: 'software', label: 'Software' },
                  { value: 'marketing', label: 'Marketing' },
                  { value: 'product', label: 'Product' },
                ]}
              />

              <Select
                label="Access Control"
                name="access"
                value={formData.access}
                onChange={handleChange}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'limited', label: 'Limited' },
                  { value: 'private', label: 'Private' },
                ]}
              />

              <div className="flex gap-3 pt-4">
                <Button variant="primary" type="submit">Create Project</Button>
                <Button variant="secondary" type="button">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateProject;
