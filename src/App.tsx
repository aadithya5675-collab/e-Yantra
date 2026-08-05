import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Login } from './features/auth/Login';
import { Signup } from './features/auth/Signup';
import { AppShell } from './app/AppShell';
import { FullPageSpinner } from './components/ui/Spinner';

// Route-level code splitting keeps the first paint light.
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const LeaderboardPage = lazy(() => import('./features/leaderboard/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const AnnouncementsPage = lazy(() => import('./features/announcements/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const MyTeam = lazy(() => import('./features/team/MyTeam').then(m => ({ default: m.MyTeam })));
const MyTasks = lazy(() => import('./features/tasks/MyTasks').then(m => ({ default: m.MyTasks })));
const ManageTasks = lazy(() => import('./features/tasks/ManageTasks').then(m => ({ default: m.ManageTasks })));
const Settings = lazy(() => import('./features/settings/Settings').then(m => ({ default: m.Settings })));
// ARC Mission Control — single-theme team onboarding wizard.
const OnboardingWizard = lazy(() => import('./features/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function FullPageLoader() {
  return <FullPageSpinner label="Establishing uplink…" />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function RequireTeam({ children }: { children: React.ReactNode }) {
  const { teamId, isAdmin } = useAuth();
  if (!isAdmin && !teamId) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function MemberRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function IndexRoute() {
  const { isAdmin } = useAuth();
  if (isAdmin) return <Dashboard />;
  return <Navigate to="/my-team" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingWizard />
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <RequireTeam>
                    <AppShell />
                  </RequireTeam>
                </ProtectedRoute>
              }>
                <Route index element={<IndexRoute />} />
                <Route path="leaderboard" element={<AdminRoute><LeaderboardPage /></AdminRoute>} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="my-team" element={<MemberRoute><MyTeam /></MemberRoute>} />
                <Route path="my-tasks" element={<MemberRoute><MyTasks /></MemberRoute>} />
                <Route path="manage-tasks" element={<AdminRoute><ManageTasks /></AdminRoute>} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
