import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthContext';
import { Reveal } from '../../components/motion/Reveal';
import { Spinner } from '../../components/ui/Spinner';
import { Progress, Badge, EmptyState } from '../../components/ui/primitives';
import { Users, Crown } from 'lucide-react';
import type { Task, Profile } from '../../types';

export function MyTeam() {
  const { teamId, themeId } = useAuth();

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['my-team', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .order('is_leader', { ascending: false });
      if (error) throw error;
      return (data || []) as Profile[];
    },
    enabled: !!teamId,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['team-tasks', themeId],
    queryFn: async () => {
      if (!themeId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('theme_id', themeId)
        .not('assigned_to', 'is', null);
      if (error && error.code !== '42703') throw error;
      return (data || []) as Task[];
    },
    enabled: !!themeId,
  });

  const isLoading = loadingMembers || loadingTasks;
  if (isLoading) return <div className="py-20 flex justify-center"><Spinner size={32} /></div>;

  const memberStats = members.map(member => {
    const memberTasks = tasks.filter(t => t.assigned_to === member.id);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    const total = memberTasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { ...member, stats: { completed, total, progress } };
  });

  return (
    <div className="space-y-6">
      <Reveal y={16}>
        <h1 className="font-display text-[30px] tracking-tight text-text-primary">My team</h1>
        <p className="mt-1 text-[14.5px] text-text-secondary">Your roster and each member's task progress.</p>
      </Reveal>

      {memberStats.length === 0 ? (
        <EmptyState icon={<Users size={30} />} title="No team members yet" description="Members appear here once your roster is set." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {memberStats.map((member, index) => {
            const name = member.display_name || member.full_name || member.username || 'Unknown';
            return (
              <Reveal key={member.id} delay={index * 0.06}>
                <div className="surface-card p-5 h-full flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-11 h-11 rounded-full bg-muted border border-hairline text-[15px] font-semibold text-text-secondary shrink-0">
                      {name[0].toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-medium text-text-primary truncate">{name}</h3>
                      {member.is_leader ? (
                        <Badge tone="accent"><Crown size={12} /> Team Leader</Badge>
                      ) : (
                        <span className="text-[12.5px] text-text-muted">Team Member</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Progress
                      value={member.stats.progress}
                      tone={member.stats.progress >= 100 ? 'success' : 'accent'}
                      label={`Tasks done · ${member.stats.completed}/${member.stats.total}`}
                    />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
