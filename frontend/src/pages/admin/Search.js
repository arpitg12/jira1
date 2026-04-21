import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Badge, Breadcrumb } from '../../components/common';
import { IoSearch, IoClose } from 'react-icons/io5';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([
    { id: 'JIR-001', title: 'Fix login bug', type: 'Bug', status: 'In Progress' },
    { id: 'JIR-002', title: 'Add dark mode', type: 'Feature', status: 'Review' },
    { id: 'JIR-003', title: 'Performance optimization', type: 'Task', status: 'To Do' },
    { id: 'JIR-004', title: 'API documentation', type: 'Task', status: 'Done' },
    { id: 'JIR-005', title: 'Security audit', type: 'Epic', status: 'In Progress' },
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search for:', searchTerm);
  };

  const typeColors = {
    'Bug': 'danger',
    'Feature': 'success',
    'Task': 'info',
    'Epic': 'secondary',
  };

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Search', href: '/admin/search', active: true }
        ]} />
        <h1 className="ui-title mb-4">Advanced Search</h1>

        {/* Search Form */}
        <Card className="mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <IoSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search issues, projects, people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2"
                />
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Search</button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <select className="text-sm">
                <option>All Types</option>
                <option>Bug</option>
                <option>Feature</option>
                <option>Task</option>
                <option>Epic</option>
              </select>
              <select className="text-sm">
                <option>All Statuses</option>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Done</option>
              </select>
              <select className="text-sm">
                <option>All Projects</option>
                <option>Jira</option>
                <option>Confluence</option>
                <option>Cloud</option>
              </select>
              <select className="text-sm">
                <option>Priority</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </form>
        </Card>

        {/* Results */}
        <Card title={`Found ${results.length} results`}>
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50/60">
                <div className="flex-1">
                  <p className="font-semibold text-dark">{result.title}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={typeColors[result.type]} size="sm">{result.type}</Badge>
                    <Badge variant="info" size="sm">{result.status}</Badge>
                  </div>
                </div>
                <p className="font-mono text-primary font-semibold">{result.id}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Search;
