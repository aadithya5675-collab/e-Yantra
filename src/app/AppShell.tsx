import { useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, Megaphone, ClipboardList, ListTodo, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { AlarmManager } from '../components/AlarmManager';
import { PageTransition } from '../components/motion/PageTransition';
import { gsap, useGSAP, EASE, DURATION } from '../lib/motion';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { profile, isAdmin } = useAuth();
  const navScope = useRef<HTMLElement>(null);
  const menuScope = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    ...(!isAdmin ? [{ name: 'My Tasks', path: '/my-tasks', icon: ClipboardList }] : []),
    ...(isAdmin ? [{ name: 'Manage Tasks', path: '/manage-tasks', icon: ListTodo }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Sidebar items settle in once, on first paint.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.gs-nav-item',
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: DURATION.base, ease: EASE.out, stagger: 0.04, clearProps: 'transform' }
        );
      });
      return () => mm.revert();
    },
    { scope: navScope }
  );

  // Mobile drawer slides down rather than popping.
  useGSAP(
    () => {
      if (!mobileMenuOpen || !menuScope.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          menuScope.current,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: DURATION.fast, ease: EASE.out, clearProps: 'all' }
        );
      });
      return () => mm.revert();
    },
    { dependencies: [mobileMenuOpen] }
  );

  const isActivePath = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const navLink = (item: typeof navItems[number], onClick?: () => void) => {
    const Icon = item.icon;
    const active = isActivePath(item.path);
    return (
      <Link
        key={item.name}
        to={item.path}
        onClick={onClick}
        className={`gs-nav-item relative flex items-center gap-3 px-3 py-2 text-[15px] font-bold transition-all duration-100 border-2 ${
          active
            ? 'bg-accent-color text-white border-black shadow-[2px_2px_0px_black] translate-x-[-2px] translate-y-[-2px]'
            : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5'
        }`}
        style={{ borderRadius: '5px' }}
      >
        <Icon size={18} strokeWidth={active ? 3 : 2} />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-page flex flex-col md:flex-row">
      <AlarmManager />

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-5 h-14 bg-page/80 backdrop-blur-xl border-b border-hairline">
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          ARC Mission Control
        </span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 text-text-primary"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          ref={menuScope}
          className="md:hidden sticky top-14 z-20 bg-page border-b border-hairline px-4 py-3 space-y-1"
        >
          {navItems.map(item => navLink(item, () => setMobileMenuOpen(false)))}
        </div>
      )}

      {/* Desktop sidebar */}
      <nav
        ref={navScope}
        className="hidden md:flex flex-col w-[232px] shrink-0 h-screen sticky top-0 border-r border-hairline bg-page"
      >
        <div className="px-5 pt-7 pb-8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[18px] font-bold tracking-tight text-text-primary">
              ARC Mission Control
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 tracking-wide uppercase font-medium">
            e-Yantra Operations
          </p>
        </div>

        <div className="px-3 space-y-0.5 flex-1">
          {navItems.map(item => navLink(item))}
        </div>

        <div className="gs-nav-item px-5 py-5 border-t border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 text-[13px] font-semibold shrink-0">
              {(profile?.full_name?.[0] || profile?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text-primary truncate">
                {profile?.full_name || profile?.email || 'User'}
              </div>
              <div className="text-[11px] text-text-secondary capitalize">{profile?.role || 'member'}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <div className="px-5 py-8 md:px-12 md:py-14">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
