import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Megaphone, ClipboardList, ListTodo, Settings, Users } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { AlarmManager } from '../components/AlarmManager';
import { PageTransition } from '../components/motion/PageTransition';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const navItems = [
    ...(isAdmin ? [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }] : []),
    ...(isAdmin ? [{ name: 'Leaderboard', path: '/leaderboard', icon: Trophy }] : []),
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    ...(!isAdmin ? [{ name: 'My Team', path: '/my-team', icon: Users }] : []),
    ...(!isAdmin ? [{ name: 'My Tasks', path: '/my-tasks', icon: ClipboardList }] : []),
    ...(isAdmin ? [{ name: 'Manage Tasks', path: '/manage-tasks', icon: ListTodo }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActivePath = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-page flex flex-col relative">
      <AlarmManager />

      {/* Header Branding */}
      <header className="absolute top-0 left-0 z-30 flex items-center px-6 h-20 w-full pointer-events-none">
        <div className="text-[20px] font-black tracking-[-0.02em] text-text-primary flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          ARC Mission Control
        </div>
      </header>

      {/* Floating Top Right Navbar (Uiverse) */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex justify-center items-center transition-all duration-[450ms] ease-in-out w-auto scale-90 sm:scale-100 origin-top-right shadow-2xl rounded-2xl">
        <article className="border border-solid border-gray-700 w-full ease-in-out duration-500 left-0 rounded-2xl flex shadow-lg shadow-black/15 bg-white overflow-hidden">
          {navItems.map((item) => (
            <label
              key={item.name}
              title={item.name}
              className="has-[:checked]:shadow-lg relative w-16 h-16 p-4 ease-in-out duration-300 border-solid border-black/10 has-[:checked]:border group flex flex-row gap-3 items-center justify-center text-black cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                name="path"
                type="radio"
                className="hidden peer/expand"
                checked={isActivePath(item.path)}
                onChange={() => navigate(item.path)}
              />
              <div className="peer-hover/expand:scale-125 peer-hover/expand:text-blue-500 peer-checked/expand:text-blue-500 text-2xl peer-checked/expand:scale-125 ease-in-out duration-300 text-gray-500 flex items-center justify-center">
                <item.icon size={24} strokeWidth={isActivePath(item.path) ? 2.5 : 2} />
              </div>
            </label>
          ))}
        </article>
      </div>

      {/* Content */}
      <main className="flex-1 w-full">
        <div className="px-5 py-8 pt-24 md:px-12 md:py-24 max-w-7xl mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
