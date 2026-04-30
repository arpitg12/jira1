import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Breadcrumb } from '../../components/common';
import { IoArrowDown, IoArrowUp } from 'react-icons/io5';
import { getIssues, getProjects, getUsers } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const includesUser = (userList, userId) =>
  [...(Array.isArray(userList) ? userList : [])].some(
    (entry) => String(entry?._id || entry || '') === String(userId || '')
  );

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const breadcrumbs = [
    { label: 'Home', href: '/admin', active: false },
    { label: 'Dashboard', href: '/admin/dashboard', active: true },
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [issuesData, projectsData, usersData] = await Promise.all([
          getIssues(),
          getProjects(),
          isAdmin ? getUsers() : Promise.resolve([]),
        ]);

        setIssues(issuesData || []);
        setProjects(projectsData || []);
        setUsers(usersData || []);
        setError('');
      } catch (loadError) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAdmin]);

  const stats = isAdmin
    ? [
        {
          title: 'Total Issues',
          value: issues.length,
          change: `${issues.filter((issue) => issue.status === 'Done').length} done`,
          isPositive: true,
        },
        {
          title: 'Open Issues',
          value: issues.filter((issue) => issue.status !== 'Done').length,
          change: `${issues.filter((issue) => issue.priority === 'Critical').length} critical`,
          isPositive: issues.filter((issue) => issue.priority === 'Critical').length === 0,
        },
        {
          title: 'Projects',
          value: projects.length,
          change: `${projects.filter((project) => (project.visibleToUsers || []).length === 0).length} open to all`,
          isPositive: true,
        },
        {
          title: 'Members',
          value: users.length,
          change: `${users.filter((member) => member.role === 'Admin').length} admins`,
          isPositive: true,
        },
      ]
    : [
        {
          title: 'Visible Issues',
          value: issues.length,
          change: `${issues.filter((issue) => issue.priority === 'Critical').length} critical`,
          isPositive: issues.filter((issue) => issue.priority === 'Critical').length === 0,
        },
        {
          title: 'Open In Projects',
          value: issues.filter((issue) => issue.status !== 'Done').length,
          change: `${issues.filter((issue) => issue.status === 'In Progress').length} active`,
          isPositive: true,
        },
        {
          title: 'Visible Projects',
          value: projects.length,
          change: `${projects.filter((project) => (project.visibleToUsers || []).length > 0).length} assigned`,
          isPositive: true,
        },
        {
          title: 'My Reviews',
          value: issues.filter((issue) => includesUser(issue.reviewAssignees, user?._id)).length,
          change: 'Role-aware view',
          isPositive: true,
        },
      ];

  return (
    <AdminLayout>
      <div className="-mx-3 -my-3 min-h-[calc(100vh-120px)] ui-dark-page px-3 py-4 md:-mx-5 md:px-6 md:py-6">
        <Breadcrumb items={breadcrumbs} />
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-white/55">
              {isAdmin
                ? 'Full workspace visibility for team, projects, and workflows.'
                : 'A focused view of the projects you can access and the tickets inside them.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-white">{user?.username || user?.email}</p>
            <p className="text-xs text-white/50">{user?.role}</p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-white/65">
            Loading dashboard...
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="ui-dark-surface ui-shadow p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mb-1 text-xs text-white/60">{stat.title}</p>
                      <p className="text-xl font-bold leading-tight text-white">{stat.value}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.isPositive ? <IoArrowUp /> : <IoArrowDown />}
                    </div>
                  </div>
                  <p className={`mt-3 text-xs ${stat.isPositive ? 'text-green-400' : 'text-red-300'}`}>{stat.change}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="ui-dark-surface ui-shadow p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white/90">Operational Snapshot</h2>
                  <span className="text-xs text-white/45">{isAdmin ? 'Admin View' : 'Member View'}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/35">Project Access</p>
                    <p className="mt-3 text-2xl font-bold text-white">{projects.length}</p>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      {isAdmin
                        ? 'Projects currently available across the workspace.'
                        : 'Projects currently visible to your account.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/35">Issue Ownership</p>
                    <p className="mt-3 text-2xl font-bold text-white">{issues.length}</p>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      Tickets currently visible inside the projects you can access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="ui-dark-surface ui-shadow p-4">
                <h2 className="text-sm font-semibold text-white/90">Access Rules</h2>
                <div className="mt-4 space-y-3 text-sm text-white/65">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-semibold text-white">{isAdmin ? 'Admin session' : 'Member session'}</p>
                    <p className="mt-2 leading-7">
                      {isAdmin
                        ? 'You can manage members, workflows, and project visibility across the app.'
                        : 'You can see all tickets inside your allowed projects, and workflow screens stay hidden.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-semibold text-white">Security posture</p>
                    <p className="mt-2 leading-7">
                      JWT-backed sessions and protected APIs keep the UI and backend aligned on permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
