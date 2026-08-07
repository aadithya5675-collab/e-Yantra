import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthContext';
import { useThemes } from '../onboarding/api';
import { Plus, Send } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

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

  const [title, setTitle] = useState('');
  const [themeId, setThemeId] = useState('');
  const [evalMode, setEvalMode] = useState('points');
  const [marks, setMarks] = useState('10');
  const [dueDate, setDueDate] = useState('');

  const createTask = useMutation({
    mutationFn: async () => {
      if (!themeId) return 0;

      let targetMembers = [];
      if (themeId === 'all') {
        targetMembers = profiles.filter(p => Boolean(p.team_id));
      } else {
        const targetTheme = parseInt(themeId, 10);
        const themeTeams = teams.filter(t => t.theme_id === targetTheme).map(t => t.id);
        targetMembers = profiles.filter(p => p.team_id && themeTeams.includes(p.team_id));
      }

      if (targetMembers.length === 0) return 0;

      const numMarks = Number(marks) || 0;

      const newTasks = targetMembers.map(member => ({
        title,
        theme_id: themeId === 'all' ? (member.team_id ? teams.find(t => t.id === member.team_id)?.theme_id || null : null) : parseInt(themeId, 10),
        assigned_to: member.id,
        marks: numMarks,
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
      setThemeId('');
      setMarks('10');
      setDueDate('');
      toast(count ? `Task "${title}" created and assigned to ${count} team members!` : 'No eligible targets found.', count ? 'success' : 'info');
    },
    onError: () => toast('Could not create task.', 'error'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !themeId) return;
    createTask.mutate();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Reveal y={16}>
        <h1 className="font-display text-[30px] tracking-tight text-text-primary">Manage tasks</h1>
        <p className="mt-1 text-[14.5px] text-text-secondary">Create and assign tasks to themes. Created tasks appear directly on the Leaderboard.</p>
      </Reveal>

      {/* Create Task Form */}
      <Reveal delay={0.05}>
        <section className="surface-card p-6 sm:p-7">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.1em] text-text-muted mb-6">
            <Plus size={18} /> Create New Task
          </h2>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field md:col-span-2">
                <label htmlFor="mt-title" className="field-label font-medium text-text-primary mb-1 block">Task Name / Title</label>
                <input
                  id="mt-title"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="arc-input"
                  placeholder="e.g. Task 1a: Hardware Prototype"
                />
              </div>

              <div className="field">
                <label htmlFor="mt-theme" className="field-label font-medium text-text-primary mb-1 block">Target Theme</label>
                <select
                  id="mt-theme"
                  required
                  value={themeId}
                  onChange={e => setThemeId(e.target.value)}
                  className="arc-input"
                >
                  <option value="">Select target theme…</option>
                  <option value="all">★ All Themes (Global Task)</option>
                  {themes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="mt-eval" className="field-label font-medium text-text-primary mb-1 block">Evaluation Type</label>
                <select
                  id="mt-eval"
                  value={evalMode}
                  onChange={e => setEvalMode(e.target.value)}
                  className="arc-input"
                >
                  <option value="points">Points-based</option>
                  <option value="time">Time-based</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="mt-marks" className="field-label font-medium text-text-primary mb-1 block">
                  {evalMode === 'points' ? 'Total Marks' : 'Target Time (minutes)'}
                </label>
                <input
                  id="mt-marks"
                  type="number"
                  min="0"
                  required
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                  className="arc-input"
                  placeholder={evalMode === 'points' ? 'e.g. 10' : 'e.g. 120'}
                />
              </div>

              <div className="field md:col-span-2">
                <label htmlFor="mt-due" className="field-label font-medium text-text-primary mb-1 block">Due Date (Optional)</label>
                <input
                  id="mt-due"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="arc-input"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={createTask.isPending} className="w-full sm:w-auto px-6">
                <Send size={16} /> Create Task
              </Button>
            </div>
          </form>
        </section>
      </Reveal>
    </div>
  );
}
