import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthContext';
import { useThemes } from '../onboarding/api';
import { Plus, Clock, ChevronDown, Send } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { Button } from '../../components/ui/Button';
import { Segmented, Badge } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toast';

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'success' | 'warning'> = {
  pending: 'neutral',
  in_progress: 'accent',
  completed: 'success',
  overdue: 'warning',
};

export function ManageTasks() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: themes = [] } = useThemes();

  const { data: teams = [] } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data } = await supabase.from('teams').select('*');
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data || [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('*');
      return data || [];
    },
  });

  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'past'>('ongoing');
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [themeId, setThemeId] = useState('');
  const [marks, setMarks] = useState('10');
  const [leadersOnly, setLeadersOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createTask = useMutation({
    mutationFn: async () => {
      if (!themeId) return;
      const targetTheme = parseInt(themeId, 10);
      const themeTeams = teams.filter(t => t.theme_id === targetTheme).map(t => t.id);
      
      const targetMembers = profiles.filter(p => {
        if (!p.team_id || !themeTeams.includes(p.team_id)) return false;
        if (leadersOnly) return Boolean(p.is_leader);
        return true;
      });

      if (targetMembers.length === 0) return;

      const numMarks = leadersOnly ? (Number(marks) || 0) : 0;

      const newTasks = targetMembers.map(member => ({
        title,
        description,
        theme_id: targetTheme,
        assigned_to: member.id,
        marks: numMarks,
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        due_date: dueDate || null,
        status: 'pending',
        priority: 'medium',
        created_by: profile?.id,
      }));

      const { error } = await supabase.from('tasks').insert(newTasks);
      if (error) throw error;
      return targetMembers.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setTitle('');
      setDescription('');
      setThemeId('');
      setMarks('10');
      setStartDate('');
      setDueDate('');
      const msg = leadersOnly
        ? `Task (${marks} marks) dispatched to ${count} team leader${count === 1 ? '' : 's'}.`
        : `Task dispatched to ${count} member${count === 1 ? '' : 's'}.`;
      toast(count ? msg : 'No eligible targets for that theme.', count ? 'success' : 'info');
    },
    onError: () => toast('Could not dispatch task.', 'error'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !themeId) return;
    createTask.mutate();
  };

  const nowMs = useMemo(() => Date.now(), []);

  const getTaskCategory = (task: any, currentMs: number = nowMs): 'upcoming' | 'ongoing' | 'past' => {
    let startMs = 0;
    if (task.start_date) {
      const s = new Date(task.start_date).getTime();
      if (!isNaN(s)) startMs = s;
    } else if (task.created_at) {
      const c = new Date(task.created_at).getTime();
      if (!isNaN(c)) startMs = c;
    }

    let dueMs: number | null = null;
    if (task.due_date) {
      const d = new Date(task.due_date);
      if (!isNaN(d.getTime())) {
        if (task.due_time && typeof task.due_time === 'string') {
          const [h, m] = task.due_time.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            d.setHours(h, m, 59, 999);
          } else {
            d.setHours(23, 59, 59, 999);
          }
        } else {
          d.setHours(23, 59, 59, 999);
        }
        dueMs = d.getTime();
      }
    }

    // Predicates:
    // 1. Upcoming: startMs > currentMs
    if (startMs > currentMs) return 'upcoming';

    // 2. Past: due date exists and current time is strictly after due end time
    if (dueMs !== null && currentMs > dueMs) return 'past';

    // 3. Ongoing: active interval (start <= now && (due == null || now <= due))
    return 'ongoing';
  };

  return (
    <div className="space-y-8">
      <Reveal y={16}>
        <h1 className="font-display text-[30px] tracking-tight text-text-primary">Manage tasks</h1>
        <p className="mt-1 text-[14.5px] text-text-secondary">Dispatch tasks to a theme and track progress across every team.</p>
      </Reveal>

      {/* Create */}
      <Reveal delay={0.05}>
        <section className="surface-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-text-muted">
              <Plus size={16} /> Create task for a theme
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLeadersOnly(false)}
                className={`chip ${!leadersOnly ? 'chip-active' : ''}`}
              >
                All Members
              </button>
              <button
                type="button"
                onClick={() => setLeadersOnly(true)}
                className={`chip ${leadersOnly ? 'chip-active' : ''}`}
                style={leadersOnly ? { background: 'var(--c-accent-color)', color: '#04121a' } : undefined}
              >
                ★ Team Leaders Only (with Marks)
              </button>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className={`grid grid-cols-1 ${leadersOnly ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              <div className="field md:col-span-1">
                <label htmlFor="mt-title" className="field-label">Task title</label>
                <input id="mt-title" required value={title} onChange={e => setTitle(e.target.value)} className="arc-input" placeholder={leadersOnly ? "e.g. Task 1 - Prototype" : "e.g. Robot chassis assembly"} />
              </div>
              <div className="field md:col-span-1">
                <label htmlFor="mt-theme" className="field-label">Target theme</label>
                <select id="mt-theme" required value={themeId} onChange={e => setThemeId(e.target.value)} className="arc-input">
                  <option value="">Select a theme…</option>
                  {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {leadersOnly && (
                <div className="field md:col-span-1">
                  <label htmlFor="mt-marks" className="field-label">
                    Total Marks <span className="text-accent-color font-semibold">(Leader Score)</span>
                  </label>
                  <input id="mt-marks" type="number" min="0" required value={marks} onChange={e => setMarks(e.target.value)} className="arc-input" placeholder="e.g. 10" />
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="mt-desc" className="field-label">Description <span className="text-text-muted font-normal">(optional)</span></label>
              <textarea id="mt-desc" value={description} onChange={e => setDescription(e.target.value)} className="arc-input min-h-[84px] resize-y" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="mt-start" className="field-label">Start date <span className="text-text-muted font-normal">(optional)</span></label>
                <input id="mt-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="arc-input" />
              </div>
              <div className="field">
                <label htmlFor="mt-due" className="field-label">Due date <span className="text-text-muted font-normal">(optional)</span></label>
                <input id="mt-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="arc-input" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
              <p className="text-xs text-text-muted">
                {leadersOnly ? '★ Task will be dispatched ONLY to Team Leaders of the chosen theme.' : 'Task will be dispatched to all members of the chosen theme.'}
              </p>
              <Button type="submit" loading={createTask.isPending} className="w-full md:w-auto">
                <Send size={16} /> {leadersOnly ? 'Dispatch Leader Task' : 'Dispatch Task'}
              </Button>
            </div>
          </form>
        </section>
      </Reveal>

      {/* Tracking */}
      <Reveal delay={0.1}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">Global progress</h2>
          <Segmented
            ariaLabel="Task timeframe"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'past', label: 'Past' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'upcoming', label: 'Upcoming' },
            ]}
          />
        </div>

        <div className="space-y-3">
          {themes.map(theme => {
            const themeTeams = teams.filter(t => t.theme_id === theme.id);
            if (themeTeams.length === 0) return null;
            const open = expandedTheme === theme.id;

            return (
              <div key={theme.id} className="surface-card overflow-hidden p-0">
                <button
                  onClick={() => setExpandedTheme(open ? null : theme.id)}
                  aria-expanded={open}
                  className="w-full p-4 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Badge tone="accent">{themeTeams.length}</Badge>
                    <span className="font-medium text-text-primary truncate">{theme.name}</span>
                  </span>
                  <ChevronDown size={18} className="text-text-muted shrink-0 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
                </button>

                {open && (
                  <div className="px-4 pb-4 border-t border-hairline space-y-2.5 pt-3">
                    {themeTeams.map(team => {
                      const teamMembers = profiles.filter(p => p.team_id === team.id);
                      const teamOpen = expandedTeam === team.id;
                      return (
                        <div key={team.id} className="rounded-lg border border-hairline bg-muted/30 overflow-hidden">
                          <button
                            onClick={() => setExpandedTeam(teamOpen ? null : team.id)}
                            aria-expanded={teamOpen}
                            className="w-full p-3 flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-medium text-[14px] text-text-primary truncate">{team.name}</span>
                            <span className="text-[12px] text-text-muted shrink-0">{teamMembers.length} members</span>
                          </button>

                          {teamOpen && (
                            <div className="px-3 pb-3 divide-y divide-[var(--c-border)]">
                              {teamMembers.map(member => {
                                const memberTasks = tasks.filter(t => t.assigned_to === member.id && getTaskCategory(t, nowMs) === activeTab);
                                const memberOpen = expandedMember === member.id;
                                return (
                                  <div key={member.id} className="py-2.5 first:pt-1">
                                    <button
                                      onClick={() => setExpandedMember(memberOpen ? null : member.id)}
                                      aria-expanded={memberOpen}
                                      className="w-full flex items-center justify-between gap-2 text-left"
                                    >
                                      <span className="flex items-center gap-2.5 min-w-0">
                                        <span className="grid place-items-center w-8 h-8 rounded-full bg-muted border border-hairline text-[12px] font-semibold text-text-secondary shrink-0">
                                          {(member.display_name || 'U')[0].toUpperCase()}
                                        </span>
                                        <span className="min-w-0">
                                          <span className="block text-[13.5px] font-medium text-text-primary truncate">
                                            {member.display_name}{member.is_leader && <span className="text-text-muted font-normal"> · Leader</span>}
                                          </span>
                                          <span className="block text-[12px] text-text-muted">{memberTasks.length} {activeTab} tasks</span>
                                        </span>
                                      </span>
                                      <ChevronDown size={16} className="text-text-muted shrink-0 transition-transform" style={{ transform: memberOpen ? 'rotate(180deg)' : 'none' }} />
                                    </button>

                                    {memberOpen && (
                                      <div className="mt-2.5 pl-10 space-y-2">
                                        {memberTasks.length === 0 ? (
                                          <p className="text-[12.5px] text-text-muted">No {activeTab} tasks.</p>
                                        ) : (
                                          memberTasks.map((task: any) => (
                                            <div key={task.id} className="p-3 rounded-lg bg-surface border border-hairline flex justify-between items-center gap-3">
                                              <div className="min-w-0">
                                                <p className="text-[13.5px] font-medium text-text-primary truncate">{task.title}</p>
                                                {task.due_date && (
                                                  <p className="text-[12px] text-text-muted mt-0.5 flex items-center gap-1">
                                                    <Clock size={12} /> Due {task.due_date}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {task.marks > 0 && <Badge tone="accent">{task.marks} pts</Badge>}
                                                <Badge tone={STATUS_TONE[task.status] ?? 'neutral'}>{String(task.status).replace('_', ' ')}</Badge>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Reveal>
    </div>
  );
}
