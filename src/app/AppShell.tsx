import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Trophy, Megaphone, ListTodo, Settings as SettingsIcon,
  Users, LogOut, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { AlarmManager } from '../components/AlarmManager';
import { PageTransition } from '../components/motion/PageTransition';
import { ThemeToggle } from '../components/ui/ThemeToggle';

type NavItem = { name: string; path: string; icon: LucideIcon; end?: boolean };

export function AppShell() {
  const location = useLocation();
  const { isAdmin, profile, signOut } = useAuth();

  const navItems: NavItem[] = isAdmin
    ? [
        { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
        { name: 'Announcements', path: '/announcements', icon: Megaphone },
        { name: 'Manage Tasks', path: '/manage-tasks', icon: ListTodo },
        { name: 'Settings', path: '/settings', icon: SettingsIcon },
      ]
    : [
        { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
        { name: 'My Team', path: '/my-team', icon: Users },
        { name: 'Announcements', path: '/announcements', icon: Megaphone },
        { name: 'Settings', path: '/settings', icon: SettingsIcon },
      ];

  const current = navItems.find(i =>
    i.end ? location.pathname === i.path : location.pathname.startsWith(i.path) && i.path !== '/'
  ) ?? (location.pathname === '/' ? navItems[0] : undefined);

  const roleLabel = isAdmin ? 'Admin' : profile?.is_leader ? 'Team Leader' : 'Team Member';
  const displayName = profile?.display_name || profile?.full_name || 'ARC Operator';

  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <AlarmManager />

      {/* ---- Desktop sidebar ------------------------------------------ */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-sidebar border-r border-hairline z-40">
        <Brand />
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Primary">
          {navItems.map(item => (
            <SideLink key={item.path} item={item} />
          ))}
        </nav>
        <div className="p-3 border-t border-hairline">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={displayName} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-text-primary truncate">{displayName}</p>
              <p className="text-[12px] text-text-muted truncate">{roleLabel}</p>
            </div>
            <button onClick={signOut} aria-label="Sign out" className="icon-btn !w-9 !h-9">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ---- Mobile top bar ------------------------------------------- */}
      <header className="lg:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-canvas/90 backdrop-blur border-b border-hairline"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">e-Yantra</span>
        </div>
        <ThemeToggle />
      </header>

      {/* ---- Desktop header ------------------------------------------- */}
      <header className="hidden lg:flex fixed top-0 right-0 left-64 h-16 items-center justify-between px-8 bg-canvas/85 backdrop-blur border-b border-hairline z-30">
        <div>
          <p className="font-mono text-[11px] tracking-[0.04em] text-text-muted">Mission Control</p>
          <h1 className="font-display text-[22px] text-text-primary leading-tight">
            {current?.name ?? 'Overview'}
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {/* ---- Content -------------------------------------------------- */}
      <main className="lg:pl-64 lg:pt-16">
        <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8 max-w-6xl mx-auto pb-28 lg:pb-12">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* ---- Mobile bottom nav ---------------------------------------- */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur border-t border-hairline flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        {navItems.map(item => (
          <BottomLink key={item.path} item={item} />
        ))}
      </nav>
    </div>
  );
}

function SideLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 px-3 h-11 rounded-lg text-[14px] font-medium transition-colors relative',
          isActive
            ? 'bg-muted text-text-primary'
            : 'text-text-secondary hover:text-text-primary hover:bg-muted/60',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent-color" aria-hidden="true" />
          )}
          <item.icon size={19} strokeWidth={isActive ? 2.4 : 2} className={isActive ? 'text-accent-color' : ''} />
          <span>{item.name}</span>
        </>
      )}
    </NavLink>
  );
}

function BottomLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex-1 flex flex-col items-center justify-center gap-1 h-16 min-w-0 text-[11px] font-medium transition-colors',
          isActive ? 'text-accent-color' : 'text-text-muted',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={21} strokeWidth={isActive ? 2.4 : 2} />
          <span className="truncate max-w-full px-1">{item.name}</span>
        </>
      )}
    </NavLink>
  );
}

function Brand() {
  return (
    <div className="h-16 flex items-center gap-2.5 px-5 border-b border-hairline">
      <Logo />
      <div className="leading-tight">
        <p className="text-[14.5px] font-semibold tracking-tight text-text-primary">e-Yantra</p>
        <p className="font-mono text-[10.5px] tracking-[0.03em] text-text-muted mt-0.5">e-Yantra Operations</p>
      </div>
    </div>
  );
}

/** Flat cobalt-ruled ARC monogram — no gradient, no fabricated seal. */
function Logo() {
  return (
    <span
      className="grid place-items-center w-9 h-9 rounded-[4px] shrink-0 font-mono font-medium text-[11px] tracking-tight border"
      style={{ borderColor: 'var(--c-accent)', color: 'var(--c-accent)' }}
      aria-hidden="true"
    >
      ARC
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="grid place-items-center w-9 h-9 rounded-full bg-muted border border-hairline text-[12.5px] font-semibold text-text-secondary shrink-0">
      {initials}
    </span>
  );
}
