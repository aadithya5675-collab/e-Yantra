import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Login } from './features/auth/Login';
import { ChangePassword } from './features/auth/ChangePassword';
import { AppShell } from './app/AppShell';
import { Loader } from './components/uiverse/Loader';

// Route-level code splitting keeps the first paint light.
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const EventsPage = lazy(() => import('./features/events/EventsPage').then(m => ({ default: m.EventsPage })));
const EventDetail = lazy(() => import('./features/events/EventDetail').then(m => ({ default: m.EventDetail })));
const MyTasks = lazy(() => import('./features/tasks/MyTasks').then(m => ({ default: m.MyTasks })));
const ManageTasks = lazy(() => import('./features/tasks/ManageTasks').then(m => ({ default: m.ManageTasks })));
const Settings = lazy(() => import('./features/settings/Settings').then(m => ({ default: m.Settings })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <Loader />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.must_change_password) return <Navigate to="/change-password" replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:id" element={<EventDetail />} />
                <Route path="my-tasks" element={<MyTasks />} />
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
