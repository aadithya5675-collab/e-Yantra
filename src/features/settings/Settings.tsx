import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../lib/theme';
import { Reveal } from '../../components/motion/Reveal';
import { LogOut, Moon, Sun, Key, Bell, BellOff, Users, UserPlus, Palette } from 'lucide-react';

export function Settings() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);

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
      toast('Could not update notifications', 'error');
    } else {
      toast(newVal ? 'Notifications on' : 'Notifications off', 'success');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('At least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setSavingPassword(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (err) { setError(err.message); return; }

    setPassword('');
    setConfirm('');
    setIsChangingPassword(false);
    toast('Password updated', 'success');
  };

  const roleLabel = profile?.is_leader ? 'Team Leader' : profile?.role === 'admin' ? 'Admin' : 'Team Member';

  return (
    <div className="max-w-2xl mx-auto">
      <Reveal className="mb-8" y={16}>
        <h1 className="font-display text-[30px] tracking-tight text-text-primary">Settings</h1>
        <p className="mt-1 text-[14.5px] text-text-secondary">
          {profile?.display_name} · {roleLabel}
        </p>
      </Reveal>

      <Reveal className="space-y-8">
        {/* Appearance */}
        <Section title="Appearance" icon={<Palette size={16} />}>
          <Row
            title="Theme"
            detail={theme === 'dark' ? 'Dark — aerospace command centre' : 'Light — daytime operations'}
            action={
              <Button variant="secondary" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
            }
          />
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={<Bell size={16} />}>
          <Row
            title="Task alarms & reminders"
            detail={notificationsEnabled ? 'Enabled' : 'Disabled'}
            action={
              <Button variant="secondary" size="sm" onClick={toggleNotifications}>
                {notificationsEnabled ? <Bell size={15} /> : <BellOff size={15} />}
                {notificationsEnabled ? 'On' : 'Off'}
              </Button>
            }
          />
        </Section>

        {/* Security */}
        <Section title="Security" icon={<Key size={16} />}>
          <div className="surface-card p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[15px] font-medium text-text-primary">Password</p>
                <p className="text-[13px] text-text-secondary mt-0.5">Update your account password</p>
              </div>
              {!isChangingPassword && (
                <Button variant="secondary" size="sm" onClick={() => setIsChangingPassword(true)}>
                  <Key size={15} /> Change
                </Button>
              )}
            </div>

            {isChangingPassword && (
              <form className="space-y-4 mt-5 pt-5 border-t border-hairline" onSubmit={handleChangePassword}>
                {error && <p role="alert" className="text-[13px] text-danger-color">{error}</p>}
                <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
                <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
                <div className="flex gap-3 pt-1">
                  <Button type="submit" size="sm" loading={savingPassword}>Update password</Button>
                  <Button type="button" variant="ghost" size="sm"
                    onClick={() => { setIsChangingPassword(false); setError(''); setPassword(''); setConfirm(''); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Section>

        {/* Team management (leaders only) */}
        {profile?.is_leader && profile.team_id && (
          <Section title="Team management" icon={<Users size={16} />}>
            <TeamManagement teamId={profile.team_id} />
          </Section>
        )}

        {/* Account */}
        <Section title="Account">
          <Button variant="danger" onClick={signOut} className="w-full sm:w-auto">
            <LogOut size={16} /> Sign out
          </Button>
        </Section>
      </Reveal>
    </div>
  );
}

function TeamManagement({ teamId }: { teamId: number }) {
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamCode, setTeamCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  const fetchMembersAndTeam = async () => {
    setLoading(true);
    const [profilesRes, teamRes] = await Promise.all([
      supabase.from('profiles').select('*').is('team_id', null),
      supabase.from('teams').select('official_eyantra_id').eq('id', teamId).single(),
    ]);

    if (profilesRes.data) {
      setMembers(profilesRes.data.filter(p => !p.is_leader && p.role !== 'admin'));
    }
    if (teamRes.data) {
      setTeamCode(teamRes.data.official_eyantra_id || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembersAndTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const addMember = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ team_id: teamId }).eq('id', userId);
    if (!error) { toast('Member added to your team', 'success'); fetchMembersAndTeam(); }
    else toast('Could not add member', 'error');
  };

  const saveTeamCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCode(true);
    const { error } = await supabase
      .from('teams')
      .update({ official_eyantra_id: teamCode.trim() || null })
      .eq('id', teamId);
    setSavingCode(false);

    if (error) {
      toast('Could not update e-Yantra team code', 'error');
    } else {
      toast('e-Yantra team code updated', 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Official e-Yantra Team Code Edit Card */}
      <div className="surface-card p-5">
        <p className="text-[15px] font-medium text-text-primary mb-1">e-Yantra Team Code</p>
        <p className="text-[13px] text-text-secondary mb-4">Set or update your team's official e-Yantra ID (e.g. EYRC-2026-1234).</p>
        <form onSubmit={saveTeamCode} className="flex gap-3 items-center flex-wrap">
          <Input
            placeholder="Enter e-Yantra Team Code"
            value={teamCode}
            onChange={e => setTeamCode(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" size="sm" loading={savingCode}>
            Save Team Code
          </Button>
        </form>
      </div>

      {/* Team Members List Card */}
      <div className="surface-card p-5">
        <p className="text-[15px] font-medium text-text-primary mb-1">Add Team Members</p>
        <p className="text-[13px] text-text-secondary mb-4">Add available registered members to your team.</p>
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-text-secondary"><Spinner size={18} /> Loading available members…</div>
        ) : members.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No available members" description="Everyone is currently assigned to a team." />
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-hairline bg-muted/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{member.display_name || member.full_name || member.username}</p>
                  <p className="text-xs text-text-muted truncate">{member.email}</p>
                </div>
                <Button size="sm" onClick={() => addMember(member.id)}><UserPlus size={15} /> Add</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">
        {icon}{title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ title, detail, action }: { title: string; detail: string; action: React.ReactNode }) {
  return (
    <div className="surface-card p-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-[15px] font-medium text-text-primary">{title}</p>
        <p className="text-[13px] text-text-secondary mt-0.5">{detail}</p>
      </div>
      {action}
    </div>
  );
}
