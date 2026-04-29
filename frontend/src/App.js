import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, getDefaultRouteForUser, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Issues = lazy(() => import('./pages/admin/Issues'));
const IssueDetail = lazy(() => import('./pages/admin/IssueDetail'));
const Projects = lazy(() => import('./pages/admin/Projects'));
const ProjectDetail = lazy(() => import('./pages/admin/ProjectDetail'));
const Members = lazy(() => import('./pages/admin/Members'));
const WorkflowEditor = lazy(() => import('./pages/admin/WorkflowEditor'));

const LoadingFallback = () => (
  <div className="ui-dark-page flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-white/65">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AdminOnlyRoute = () => {
  const { isAdmin, user } = useAuth();

  if (!isAdmin) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={getDefaultRouteForUser(user)} replace />
            ) : (
              <LandingPage />
            )
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/issue/:id" element={<IssueDetail />} />
          <Route path="/admin/issues" element={<Issues />} />
          <Route path="/admin/projects" element={<Projects />} />
          <Route path="/admin/projects/:id" element={<ProjectDetail />} />

          <Route element={<AdminOnlyRoute />}>
            <Route path="/admin/members" element={<Members />} />
            <Route path="/admin/workflows" element={<WorkflowEditor />} />
          </Route>
        </Route>

        <Route
          path="/admin"
          element={<Navigate to={isAuthenticated ? getDefaultRouteForUser(user) : '/'} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? getDefaultRouteForUser(user) : '/'} replace />}
        />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
