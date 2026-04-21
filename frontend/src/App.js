import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Issues = lazy(() => import('./pages/admin/Issues'));
const IssueDetail = lazy(() => import('./pages/admin/IssueDetail'));
const Projects = lazy(() => import('./pages/admin/Projects'));
const ProjectDetail = lazy(() => import('./pages/admin/ProjectDetail'));
const Members = lazy(() => import('./pages/admin/Members'));
const WorkflowEditor = lazy(() => import('./pages/admin/WorkflowEditor'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Search = lazy(() => import('./pages/admin/Search'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#050608]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white/65">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/issue/:id" element={<IssueDetail />} />
          <Route path="/admin/issues" element={<Issues />} />
          <Route path="/admin/projects" element={<Projects />} />
          <Route path="/admin/projects/:id" element={<ProjectDetail />} />
          <Route path="/admin/members" element={<Members />} />
          <Route path="/admin/workflows" element={<WorkflowEditor />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/search" element={<Search />} />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
