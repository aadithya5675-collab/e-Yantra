import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthContext';
import { Reveal } from '../../components/motion/Reveal';
import { Loader } from '../../components/uiverse/Loader';
import { CheckCircle2, CircleDashed } from 'lucide-react';
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
        .order('is_leader', { ascending: false }); // Show leader first

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

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader />
      </div>
    );
  }

  // Calculate stats per member
  const memberStats = members.map(member => {
    const memberTasks = tasks.filter(t => t.assigned_to === member.id);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    const total = memberTasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      ...member,
      stats: { completed, total, progress }
    };
  });

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-12">
      <Reveal className="mb-8" y={20}>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-2">
          My Team
        </h1>
        <p className="text-[17px] text-text-secondary">
          View your team members and their task progress.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {memberStats.map((member, index) => (
          <Reveal key={member.id} delay={index * 0.1}>
            <div className="surface-card p-6 h-full flex flex-col justify-between group hover:border-black transition-colors duration-300 shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] border-2 border-black rounded-xl">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent-color text-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_black] border-2 border-black">
                    {(member.display_name || member.full_name || member.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-xl uppercase tracking-tight leading-none mb-1">
                      {member.display_name || member.full_name || member.username}
                    </h3>
                    <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                      {member.is_leader ? 'Team Leader' : 'Team Member'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-bold uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className={member.stats.completed > 0 ? 'text-accent-color' : ''} />
                    Tasks Done
                  </span>
                  <span className="font-black text-text-primary text-lg leading-none">
                    {member.stats.completed} / {member.stats.total}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden border border-black/20">
                  <div 
                    className="h-full bg-accent-color transition-all duration-1000 ease-out border-r border-black"
                    style={{ width: `${member.stats.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
        
        {memberStats.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-secondary border-4 border-black border-dashed rounded-xl font-bold uppercase">
            No team members found.
          </div>
        )}
      </div>
    </div>
  );
}
