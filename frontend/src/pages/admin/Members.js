import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Badge, Button, Modal, Breadcrumb } from '../../components/common';
import { IoAdd, IoTrash } from 'react-icons/io5';
import { getUsers, createUser, deleteUser } from '../../services/api';

const Members = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Member'
  });

  const stats = [
    { title: 'Total Members', value: 0, change: '+0' },
    { title: 'Active', value: 0, change: '+0' },
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setMembers(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await createUser(formData);
      setFormData({ username: '', email: '', password: '', role: 'Member' });
      setIsAddUserModalOpen(false);
      await fetchMembers();
      alert('User created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteUser(userId);
      await fetchMembers();
      alert('User deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <AdminLayout>
      <div className="-mx-3 md:-mx-5 -my-3 md:-my-5 px-3 md:px-6 py-4 md:py-6 ui-dark-page min-h-[calc(100vh-120px)]">
        <Breadcrumb items={[
          { label: 'Home', href: '/admin' },
          { label: 'Members', href: '/admin/members', active: true }
        ]} />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Members</h1>
          <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => setIsAddUserModalOpen(true)}>
            <IoAdd size={14} /> Add
          </Button>
        </div>

        {error && <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 text-red-200 rounded text-xs">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="ui-dark-surface ui-shadow p-3">
              <p className="text-white/60 text-xs mb-1">{stat.title}</p>
              <p className="text-xl font-bold text-white leading-tight">{members.length}</p>
              <p className="text-xs text-green-400">{stat.change} this month</p>
            </div>
          ))}
        </div>

        {/* Members Table */}
        <div className="ui-dark-surface ui-shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white/90">Members</h2>
          </div>
          {loading ? (
            <div className="text-center py-10 text-sm text-white/70">Loading members...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
              <table className="ui-dark-table">
                <thead className="ui-dark-thead">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Name</th>
                    <th className="px-3 py-2 text-left font-semibold">Email</th>
                    <th className="px-3 py-2 text-left font-semibold">Role</th>
                    <th className="px-3 py-2 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length > 0 ? (
                    members.map((member) => (
                      <tr key={member._id} className="ui-dark-tr">
                        <td className="px-3 py-2 font-semibold text-white text-sm">{member.username}</td>
                        <td className="px-3 py-2 text-white/70 text-sm">{member.email}</td>
                        <td className="px-3 py-2">
                          <Badge variant={member.role === 'Admin' ? 'danger' : 'info'} size="sm">{member.role}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <button 
                            onClick={() => handleDeleteUser(member._id)}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <IoTrash size={16} className="text-red-300" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-3 py-10 text-center text-white/50 text-sm">
                        No members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add New User">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full"
              >
                <option value="Member">Member</option>
                <option value="Lead">Lead</option>
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
                <option value="QA">QA</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" type="submit" disabled={loading} size="sm">
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsAddUserModalOpen(false)} size="sm">Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Members;
