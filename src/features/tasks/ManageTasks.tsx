import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthContext';
import { useThemes } from '../onboarding/api';
import { Plus, Clock } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';

export function ManageTasks() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: themes = [] } = useThemes();
  
  const { data: teams = [] } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data } = await supabase.from('teams').select('*');
      return data || [];
    }
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data || [];
    }
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('*');
      return data || [];
    }
  });

  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'past'>('ongoing');
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [themeId, setThemeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createTask = useMutation({
    mutationFn: async () => {
      if (!themeId) return;
      const targetTheme = parseInt(themeId, 10);
      
      // Find all members of this theme
      const themeTeams = teams.filter(t => t.theme_id === targetTheme).map(t => t.id);
      const targetMembers = profiles.filter(p => p.team_id && themeTeams.includes(p.team_id));
      
      if (targetMembers.length === 0) return;

      const newTasks = targetMembers.map(member => ({
        title,
        description,
        theme_id: targetTheme,
        assigned_to: member.id,
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        due_date: dueDate || null,
        status: 'pending',
        priority: 'medium',
        created_by: profile?.id
      }));

      const { error } = await supabase.from('tasks').insert(newTasks);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      setTitle('');
      setDescription('');
      setThemeId('');
      setStartDate('');
      setDueDate('');
      alert('Tasks dispatched successfully to all members of the selected theme!');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !themeId) return;
    createTask.mutate();
  };

  const getTaskCategory = (task: any) => {
    const now = new Date();
    const start = task.start_date ? new Date(task.start_date) : new Date(task.created_at);
    
    if (task.status === 'completed') return 'past';
    if (start > now) return 'upcoming';
    if (task.due_date && new Date(task.due_date) < now && task.status !== 'completed') return 'past'; // Overdue but not done, let's just categorize it based on logic. Wait, let's make it simpler.
    
    // Simplest logic:
    // Past: completed
    // Upcoming: start_date > now
    // Ongoing: start_date <= now && status != completed
    if (task.status === 'completed') return 'past';
    if (start > now) return 'upcoming';
    return 'ongoing';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      <Reveal y={20}>
        <div>
          <h1 className="text-[40px] leading-[1.08] font-bold tracking-tight text-text-primary">
            Manage Tasks
          </h1>
          <p className="mt-2 text-[17px] text-text-secondary">
            Create tasks for themes and track team progress globally.
          </p>
        </div>
      </Reveal>

      {/* CREATE TASK SECTION */}
      <Reveal delay={0.1}>
        <div className="surface-card p-6 md:p-8 rounded-2xl shadow-[6px_6px_0px_black] border-2 border-black">
          <h2 className="text-xl font-black uppercase tracking-tight text-text-primary mb-6 flex items-center gap-2 border-b-2 border-black pb-3">
            <Plus className="w-6 h-6" /> Create Task for Theme
          </h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-text-primary">Task Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full arc-input bg-surface-50 border-2 border-black" placeholder="e.g. Robot Chassis Assembly" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-text-primary">Target Theme</label>
                <select required value={themeId} onChange={e => setThemeId(e.target.value)} className="w-full arc-input bg-surface-50 border-2 border-black cursor-pointer">
                  <option value="">Select a theme...</option>
                  {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-text-primary">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full arc-input bg-surface-50 border-2 border-black min-h-[80px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-text-primary">Start Date (Optional)</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full arc-input bg-surface-50 border-2 border-black" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-text-primary">End Date (Optional)</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full arc-input bg-surface-50 border-2 border-black" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button disabled={createTask.isPending} type="submit" className="btn-primary w-full md:w-auto shadow-[4px_4px_0px_black] border-2 border-black rounded-lg uppercase font-black text-sm px-8 py-3">
                {createTask.isPending ? 'Sending...' : 'Dispatch Task'}
              </button>
            </div>
          </form>
        </div>
      </Reveal>

      {/* TRACKING DASHBOARD */}
      <Reveal delay={0.2}>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-text-primary">
              Global Progress
            </h2>
            <div className="flex bg-surface-muted/30 p-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_black]">
              {(['past', 'ongoing', 'upcoming'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-md font-bold uppercase tracking-wider text-sm transition-colors ${
                    activeTab === tab ? 'bg-accent-color text-black border-2 border-black' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {themes.map(theme => {
              const themeTeams = teams.filter(t => t.theme_id === theme.id);
              if (themeTeams.length === 0) return null;

              return (
                <div key={theme.id} className="border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_black] bg-surface-50">
                  <button 
                    onClick={() => setExpandedTheme(expandedTheme === theme.id ? null : theme.id)}
                    className="w-full p-4 flex items-center justify-between bg-surface-muted border-b-2 border-black hover:bg-black/5 transition-colors"
                  >
                    <span className="font-black text-lg uppercase">{theme.name}</span>
                    <span className="text-sm font-bold bg-black text-white px-3 py-1 rounded-full">{themeTeams.length} Teams</span>
                  </button>

                  {expandedTheme === theme.id && (
                    <div className="p-4 space-y-4 bg-white">
                      {themeTeams.map(team => {
                        const teamMembers = profiles.filter(p => p.team_id === team.id);
                        
                        return (
                          <div key={team.id} className="border-2 border-black/20 rounded-lg overflow-hidden bg-bg-page">
                            <button
                              onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                              className="w-full p-3 flex items-center justify-between hover:bg-black/5 transition-colors border-b border-black/10"
                            >
                              <span className="font-bold text-md text-text-primary">{team.name}</span>
                              <span className="text-xs font-semibold text-text-secondary">{teamMembers.length} Members</span>
                            </button>

                            {expandedTeam === team.id && (
                              <div className="p-3 divide-y divide-black/10">
                                {teamMembers.map(member => {
                                  const memberTasks = tasks.filter(t => t.assigned_to === member.id && getTaskCategory(t) === activeTab);
                                  
                                  return (
                                    <div key={member.id} className="py-3 first:pt-0 last:pb-0">
                                      <button 
                                        onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                                        className="w-full flex items-center justify-between text-left group"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-accent-color text-black flex items-center justify-center font-bold text-xs border border-black shadow-sm">
                                            {(member.display_name || 'U')[0].toUpperCase()}
                                          </div>
                                          <div>
                                            <p className="font-semibold text-sm text-text-primary group-hover:text-accent-color transition-colors">
                                              {member.display_name} {member.is_leader && '(Leader)'}
                                            </p>
                                            <p className="text-xs text-text-secondary">{memberTasks.length} {activeTab} tasks</p>
                                          </div>
                                        </div>
                                      </button>

                                      {expandedMember === member.id && (
                                        <div className="mt-3 pl-10 space-y-2">
                                          {memberTasks.length === 0 ? (
                                            <p className="text-xs text-text-secondary italic">No {activeTab} tasks.</p>
                                          ) : (
                                            memberTasks.map((task: any) => (
                                              <div key={task.id} className="p-3 bg-surface rounded border border-hairline flex justify-between items-center">
                                                <div>
                                                  <p className="text-sm font-medium text-text-primary">{task.title}</p>
                                                  {task.due_date && <p className="text-xs text-text-secondary mt-1 flex items-center gap-1"><Clock size={12} /> Due: {task.due_date}</p>}
                                                </div>
                                                <div className="text-xs font-bold uppercase px-2 py-1 bg-black/5 rounded">
                                                  {task.status.replace('_', ' ')}
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
        </div>
      </Reveal>
    </div>
  );
}
