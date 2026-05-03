import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoArrowForward,
  IoCheckmarkCircle,
  IoFlash,
  IoFolderOpen,
  IoGitNetwork,
  IoLockClosed,
  IoMoon,
  IoPulse,
  IoShieldCheckmark,
  IoSparkles,
  IoSunny,
  IoTicket,
} from 'react-icons/io5';
import { Button, Modal } from '../components/common';
import { getDefaultRouteForUser, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const featureCards = [
  {
    title: 'Role-aware workspace',
    description: 'Admins manage the full delivery engine while members stay focused on their own issues and approved projects.',
    icon: <IoShieldCheckmark size={22} />,
  },
  {
    title: 'Project visibility control',
    description: 'Choose exactly which teammates can view each project so workspaces stay clean, private, and relevant.',
    icon: <IoFolderOpen size={22} />,
  },
  {
    title: 'Workflow-driven delivery',
    description: 'Map issue status to real workflows and keep releases moving with a structured, trackable pipeline.',
    icon: <IoGitNetwork size={22} />,
  },
  {
    title: 'JWT-secured access',
    description: 'Authentication, validation, and CORS-backed APIs protect every session from login to dashboard.',
    icon: <IoLockClosed size={22} />,
  },
];

const productHighlights = [
  'Clean issue tracking with assignee, reviewer, and reporter ownership',
  'Project-level member access for controlled collaboration',
  'Workflow management reserved for admins only',
  'Fast API-backed dashboards for projects, issues, and teams',
];

const stats = [
  { label: 'Role-based access', value: '100%' },
  { label: 'JWT-secured session', value: '24/7' },
  { label: 'Project visibility modes', value: '2' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isLightMode, toggleTheme } = useTheme();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const user = await login(formData);
      setIsLoginOpen(false);
      navigate(getDefaultRouteForUser(user), { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in with those credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#ff7a18]/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-[#1d9bf0]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#18c29c]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 md:px-8 lg:px-10">
          <header className="mb-10 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
            <div>
              <p className="display-font text-xl font-bold tracking-tight text-white">JiraFlow</p>
              <p className="text-xs text-white/55">Delivery control for admins and focused execution for members.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white"
                title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {isLightMode ? <IoMoon size={18} /> : <IoSunny size={18} />}
              </button>
              <Button variant="ghost" className="hidden md:inline-flex" onClick={() => setIsLoginOpen(true)}>
                Member Login
              </Button>
              <Button variant="primary" className="!rounded-full !px-5 !py-2.5" onClick={() => setIsLoginOpen(true)}>
                Admin Login
              </Button>
            </div>
          </header>

          <main className="grid flex-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-2 text-sm text-[#ffd58a]">
                <IoSparkles />
                Modern project delivery workspace
              </div>

              <div className="space-y-5">
                <h1 className="display-font max-w-3xl text-5xl font-bold leading-[0.98] tracking-tight text-white md:text-6xl">
                  One landing page, secure login, and a role-aware Jira-style workspace.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-white/70">
                  Showcase your platform with a sharp first impression, then send each user into the right application experience based on their role, project access, and issue ownership.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="lg" className="!rounded-full !px-6" onClick={() => setIsLoginOpen(true)}>
                  Launch Workspace <IoArrowForward className="ml-2" />
                </Button>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <IoPulse className="text-[#18c29c]" />
                  JWT auth, protected APIs, project visibility, and member-safe navigation
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                    <div className="display-font text-3xl font-bold text-white">{stat.value}</div>
                    <p className="mt-1 text-sm text-white/55">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative">
              <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-[#ff7a18]/15 via-transparent to-[#1d9bf0]/10 blur-xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-6 shadow-[0_35px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">Workspace Preview</p>
                    <h2 className="display-font mt-2 text-2xl font-bold text-white">Everything the app should promise on day one</h2>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-[#ff8c42]">
                    <IoFlash size={22} />
                  </div>
                </div>

                <div className="grid gap-4">
                  {featureCards.map((feature) => (
                    <div key={feature.title} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#6fd3ff]">
                        {feature.icon}
                      </div>
                      <h3 className="display-font text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/65">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>

          <section className="mt-12 grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/45">Why This Works</p>
              <h2 className="display-font mt-3 text-3xl font-bold text-white">Your first screen now sells the platform before the dashboard even loads.</h2>
              <div className="mt-6 grid gap-3">
                {productHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <IoCheckmarkCircle className="mt-0.5 shrink-0 text-[#18c29c]" size={18} />
                    <span className="text-sm leading-7 text-white/72">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,122,24,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">Flow Snapshot</p>
                  <h3 className="display-font mt-2 text-xl font-semibold text-white">Login to the right experience</h3>
                </div>
                <IoTicket className="text-[#ffd58a]" size={22} />
              </div>
              <div className="space-y-4 pt-5">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Admins</p>
                  <p className="mt-2 text-sm leading-7 text-white/65">Get full navigation, workflow controls, team management, and unrestricted project access.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Members</p>
                  <p className="mt-2 text-sm leading-7 text-white/65">See only their own issues, only the projects they are allowed to view, and no workflow management screens.</p>
                </div>
                <Button variant="secondary" size="lg" className="mt-2 w-full !rounded-full" onClick={() => setIsLoginOpen(true)}>
                  Open Login
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Workspace Login" size="md">
        <form onSubmit={handleLogin} className="space-y-4">
          <p className="text-sm leading-7 text-white/65">
            Sign in with your registered email and password. You'll be redirected automatically based on your role.
          </p>

          {error && (
            <div className="rounded-2xl border border-red-500/35 bg-red-500/12 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@company.com"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter your password"
              className="w-full"
              required
            />
          </div>

          <div className="flex gap-2 pt-3">
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Save & Continue'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsLoginOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default LandingPage;
