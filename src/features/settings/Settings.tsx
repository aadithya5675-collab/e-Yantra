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
import { LogOut, Moon, Sun, Key, Bell, BellOff, Users, UserPlus, UserMinus, Palette, Save } from 'lucide-react';

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
    const { error: err } = await supabase.from('profiles').update({ notifications_enabled: newVal }).eq('id', profile.id);
    if (err) {
      setNotificationsEnabled(!newVal);
      toast('Could not update notification preferences', 'error');
    } else {
      toast(newVal ? 'Notifications enabled' : 'Notifications muted', 'success');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (err) {
      setError(err.message);
    } else {
      toast('Password updated successfully', 'success');
      setIsChangingPassword(false);
      setPassword('');
      setConfirm('');
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <Reveal className="mb-6" y={16}>
        <h1 className="font-display text-[30px] tracking-tight text-text-primary">Settings</h1>
        <p className="mt-1 text-[14.5px] text-text-secondary">Manage your preferences, security, and team options.</p>
      </Reveal>

      <Reveal className="space-y-8" delay={0.05}>
        {/* Appearance */}
        <Section title="Appearance" icon={<Palette size={16} />}>
          <Row
            title="Theme mode"
            detail={theme === 'dark' ? 'Dark theme' : 'Light theme'}
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
  const [currentMembers, setCurrentMembers] = useState<any[]>([]);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);

  const fetchTeamData = async () => {
    setLoading(true);
    const [teamRes, teamMembersRes, unassignedRes] = await Promise.all([
      supabase.from('teams').select('name, official_eyantra_id').eq('id', teamId).single(),
      supabase.from('profiles').select('*').eq('team_id', teamId),
      supabase.from('profiles').select('*').is('team_id', null),
    ]);

    if (teamRes.data) {
      setTeamName(teamRes.data.name || '');
      setTeamCode(teamRes.data.official_eyantra_id || '');
    }
    if (teamMembersRes.data) {
      setCurrentMembers(teamMembersRes.data);
    }
    if (unassignedRes.data) {
      setAvailableMembers(unassignedRes.data.filter(p => !p.is_leader && p.role !== 'admin'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const saveTeamDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast('Team name cannot be empty', 'error');
      return;
    }
    setSavingDetails(true);
    const { error } = await supabase
      .from('teams')
      .update({
        name: teamName.trim(),
        official_eyantra_id: teamCode.trim() || null,
      })
      .eq('id', teamId);
    setSavingDetails(false);

    if (error) {
      toast('Could not update team details', 'error');
    } else {
      toast('Team details updated successfully', 'success');
    }
  };

  const addMember = async (userId: string) => {
    if (currentMembers.length >= 4) {
      toast('Teams can have a maximum of 4 members.', 'error');
      return;
    }
    const { error } = await supabase.from('profiles').update({ team_id: teamId }).eq('id', userId);
    if (!error) {
      toast('Member added to your team', 'success');
      fetchTeamData();
    } else {
      toast('Could not add member', 'error');
    }
  };

  const removeMember = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ team_id: null }).eq('id', userId);
    if (!error) {
      toast('Member removed from your team', 'success');
      fetchTeamData();
    } else {
      toast('Could not remove member', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Team Details Edit Card */}
      <div className="surface-card p-5">
        <p className="text-[15px] font-medium text-text-primary mb-1">Team Details</p>
        <p className="text-[13px] text-text-secondary mb-4">Update your team name and official e-Yantra team code.</p>
        <form onSubmit={saveTeamDetails} className="space-y-3 max-w-md">
          <Input
            label="Team Name"
            placeholder="Enter Team Name"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            required
          />
          <Input
            label="e-Yantra Team Code"
            placeholder="e.g. EYRC-2026-1234"
            value={teamCode}
            onChange={e => setTeamCode(e.target.value)}
          />
          <Button type="submit" size="sm" loading={savingDetails}>
            <Save size={15} /> Save Team Details
          </Button>
        </form>
      </div>

      {/* Team Roster Card (Max 4 members) */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[15px] font-medium text-text-primary">Team Roster</p>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${currentMembers.length >= 4 ? 'bg-warning-color/20 text-warning-color' : 'bg-accent-color/10 text-accent-color'}`}>
            {currentMembers.length} / 4 Members
          </span>
        </div>
        <p className="text-[13px] text-text-secondary mb-4">Manage current members in your team (Maximum 4 members allowed).</p>

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-text-secondary"><Spinner size={18} /> Loading team members…</div>
        ) : (
          <div className="space-y-2 mb-6">
            {currentMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-hairline bg-surface">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {member.display_name || member.full_name || member.username}
                    {member.is_leader && <span className="ml-2 text-xs font-normal text-accent-color">(Team Leader)</span>}
                  </p>
                  <p className="text-xs text-text-muted truncate">{member.email}</p>
                </div>
                {!member.is_leader && (
                  <Button size="sm" variant="danger" onClick={() => removeMember(member.id)}>
                    <UserMinus size={15} /> Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Member Sub-section */}
        <div className="pt-4 border-t border-hairline">
          <p className="text-[14px] font-medium text-text-primary mb-1">Add Available Members</p>
          {currentMembers.length >= 4 ? (
            <p className="text-[13px] text-warning-color font-medium">Team limit reached (4/4 members). Remove a member to add someone else.</p>
          ) : (
            <>
              <p className="text-[13px] text-text-secondary mb-3">Add unassigned registered members to your team.</p>
              {availableMembers.length === 0 ? (
                <EmptyState icon={<Users size={28} />} title="No available members" description="All registered users are currently assigned to teams." />
              ) : (
                <div className="space-y-2">
                  {availableMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-hairline bg-muted/40">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{member.display_name || member.full_name || member.username}</p>
                        <p className="text-xs text-text-muted truncate">{member.email}</p>
                      </div>
                      <Button size="sm" onClick={() => addMember(member.id)}>
                        <UserPlus size={15} /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
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
