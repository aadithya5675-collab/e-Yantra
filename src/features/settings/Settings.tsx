import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/uiverse/Button';
import { Reveal } from '../../components/motion/Reveal';
import { LogOut, Moon, Sun, Key, Bell, BellOff } from 'lucide-react';

export function Settings() {
  const { profile, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (profile) setNotificationsEnabled(profile.notifications_enabled ?? true);
  }, [profile]);

  const toggleNotifications = async () => {
    if (!profile) return;
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled: newVal })
      .eq('id', profile.id);
    if (error) {
      console.error(error);
      setNotificationsEnabled(!newVal);
    }
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setIsDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 6) { setError('At least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); return; }

    setPassword('');
    setConfirm('');
    setIsChangingPassword(false);
    setMessage('Password updated.');
  };

  return (
    <div className="max-w-[560px] mx-auto">
      <Reveal className="mb-12" y={20}>
        <h1 className="text-[40px] leading-[1.08] font-semibold tracking-[-0.028em] text-text-primary">
          Settings
        </h1>
        <p className="mt-2 text-[17px] text-text-secondary">
          {profile?.display_name} · <span className="capitalize">{profile?.role}</span>
        </p>
      </Reveal>

      <Reveal className="space-y-3">
        <Row
          title="Notifications"
          detail="Task alarms and reminders"
          action={
            <Button variant="secondary" size="sm" onClick={toggleNotifications}>
              {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
              {notificationsEnabled ? 'On' : 'Off'}
            </Button>
          }
        />

        <Row
          title="Appearance"
          detail={isDarkMode ? 'Dark' : 'Light'}
          action={
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              {isDarkMode ? 'Light' : 'Dark'}
            </Button>
          }
        />

        <div className="surface-card p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[15px] font-medium text-text-primary">Password</p>
              <p className="text-[13px] text-text-secondary mt-0.5">
                {message || 'Update your account password'}
              </p>
            </div>
            {!isChangingPassword && (
              <Button variant="secondary" size="sm" onClick={() => { setIsChangingPassword(true); setMessage(''); }}>
                <Key size={14} /> Change
              </Button>
            )}
          </div>

          {isChangingPassword && (
            <form className="space-y-4 mt-6 pt-6 border-t border-hairline" onSubmit={handleChangePassword}>
              {error && <p className="text-[13px] text-danger-color">{error}</p>}
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              <div className="flex gap-3 pt-1">
                <Button type="submit" size="sm">Update</Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsChangingPassword(false); setError(''); setPassword(''); setConfirm(''); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="pt-6">
          <Button variant="danger" onClick={signOut} className="w-full">
            <LogOut size={15} /> Sign Out
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

function Row({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-[15px] font-medium text-text-primary">{title}</p>
        <p className="text-[13px] text-text-secondary mt-0.5">{detail}</p>
      </div>
      {action}
    </div>
  );
}
