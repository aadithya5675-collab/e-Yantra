import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ShieldCheck, Trophy, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthContext';
import { useThemes } from '../onboarding/api';
import { useDeleteTask, useUpdateTask, useUpdateTeamTask } from '../tasks/api';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState, ErrorState, Badge } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toast';

const FALLBACK_THEMES = [
  { id: '1', name: 'Logic Quest' },
  { id: '2', name: 'Khoj-o-Drone' },
  { id: '3', name: 'Strata Cobot' },
  { id: '4', name: 'Hola The Explorer' },
  { id: '5', name: 'Niti Vahan' },
  { id: '6', name: 'Echo Balancer' },
  { id: '7', name: 'PacBot' },
];

export function LeaderboardPage() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const updateTeamTask = useUpdateTeamTask();

  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  const { data: rawThemes = [] } = useThemes();
  const themes = useMemo(() => {
    const list = rawThemes.length ? rawThemes.map(t => ({ id: String(t.id), name: t.name })) : FALLBACK_THEMES;
    return [{ id: 'all', name: 'All Themes' }, ...list];
  }, [rawThemes]);

  const activeThemeId = selectedTheme;

  const { data: teamsData = [], isLoading: loadingTeams, isError: errorTeams, refetch } = useQuery({
    queryKey: ['leaderboard-teams', activeThemeId],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select(`
          id, 
          name, 
          official_eyantra_id, 
          status, 
          created_by,
          theme_id,
          theme:themes(id, name, slug),
          team_members:profiles!team_id(id, display_name, username, is_leader)
        `);
      if (activeThemeId !== 'all') {
        query = query.eq('theme_id', parseInt(activeThemeId, 10));
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tasksData = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['leaderboard-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assigned_profile:profiles!assigned_to(team_id)');
      if (error && error.code !== '42703') throw error;
      return data || [];
    },
  });

  const isLoading = loadingTeams || loadingTasks;

  // Process leaderboard standings per team
  const standings = useMemo(() => {
    return teamsData.map((team: any) => {
      const members = Array.isArray(team.team_members) ? team.team_members : [];
      const leader = members.find((m: any) => Boolean(m.is_leader));

      // Get all tasks assigned to members of this team
      const teamTasks = tasksData.filter((t: any) => {
        return t.assigned_profile?.team_id === team.id || members.some((m: any) => m.id === t.assigned_to);
      });

      // Deduplicate tasks by title/id for team score calculation
      const uniqueTasksMap = new Map<string, any>();
      teamTasks.forEach((t: any) => {
        if (!uniqueTasksMap.has(t.title) || t.status === 'completed') {
          uniqueTasksMap.set(t.title, t);
        }
      });

      const uniqueTasks = Array.from(uniqueTasksMap.values());

      let totalScore = 0;
      uniqueTasks.forEach((t: any) => {
        if (t.obtained_marks !== null && t.obtained_marks !== undefined) {
          totalScore += Number(t.obtained_marks);
        }
      });

      const themeObj = Array.isArray(team.theme) ? team.theme[0] : team.theme;

      return {
        team_id: Number(team.id),
        team_name: String(team.name || ''),
        arc_code: String(team.official_eyantra_id || 'N/A'),
        leader_name: leader?.display_name || leader?.username || 'N/A',
        total_score: totalScore,
        theme_name: themeObj?.name || 'Unassigned',
        tasks: uniqueTasks,
        members,
        raw_team: team,
      };
    }).sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teamsData, tasksData]);

  const handleDeleteTask = (team: any, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete task "${title}"?`)) {
      const assignedToIds = team.members.map((m: any) => m.id);
      deleteTask.mutate({ title, assignedToIds });
      toast(`Task "${title}" deleted`, 'success');
    }
  };

  const handleUpdateTeamMarks = (team: any, task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentMarks = task.obtained_marks != null ? String(task.obtained_marks) : '';
    const newVal = window.prompt(`Enter new marks for "${task.title}" (Max: ${task.marks}):`, currentMarks);
    if (newVal !== null) {
      const val = newVal.trim() === '' ? null : Number(newVal);
      const assignedToIds = team.members.map((m: any) => m.id);
      updateTeamTask.mutate({ title: task.title, assignedToIds, updates: { obtained_marks: val } });
      toast(`Marks updated for "${task.title}"`, 'success');
    }
  };

  const handleToggleStatus = (task: any) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask.mutate({ id: task.id, status: nextStatus });
    toast(`Task status set to ${nextStatus === 'completed' ? 'Done' : 'Not Done'}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] tracking-tight text-text-primary">Leaderboard</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Official team standings & task achievements.
          </p>
        </div>
      </div>

      {/* Theme Tabs Filter */}
      <div>
        <div role="tablist" aria-label="Leaderboard theme" className="hidden sm:flex flex-wrap gap-2">
          {themes.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === activeThemeId}
              onClick={() => setSelectedTheme(t.id)}
              className={`chip ${t.id === activeThemeId ? 'chip-active' : ''}`}
              style={t.id === activeThemeId ? { background: 'var(--c-accent-color)', color: '#04121a' } : undefined}
            >
              {t.name}
            </button>
          ))}
        </div>

        <select
          id="lb-theme"
          className="arc-input sm:hidden"
          value={activeThemeId}
          onChange={e => setSelectedTheme(e.target.value)}
        >
          {themes.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Main Leaderboard Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><Spinner size={32} /></div>
      ) : errorTeams ? (
        <ErrorState description="Unable to load leaderboard data." onRetry={() => refetch()} />
      ) : standings.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={30} />}
          title="No teams found"
          description="Teams will appear here once they complete registration and theme assignment."
        />
      ) : (
        <div className="surface-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-muted/60 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4 text-center w-14">Rank</th>
                  <th scope="col" className="py-3 px-4">Team / Code</th>
                  {activeThemeId === 'all' && <th scope="col" className="py-3 px-4">Theme</th>}
                  <th scope="col" className="py-3 px-4">Scores</th>
                  <th scope="col" className="py-3 px-4 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-hairline">
                {standings.map((team, idx) => {
                  const isExpanded = expandedTeamId === team.team_id;
                  const isMyTeam = profile?.team_id === team.team_id;
                  const isLeaderOfTeam = isMyTeam && Boolean(profile?.is_leader);
                  const canEditScores = isAdmin || isLeaderOfTeam;

                  return (
                    <tr key={team.team_id} className="group">
                      <td colSpan={activeThemeId === 'all' ? 5 : 4} className="p-0">
                        {/* Main Team Row */}
                        <div
                          onClick={() => setExpandedTeamId(isExpanded ? null : team.team_id)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="w-10 text-center shrink-0">
                              <RankMedal rank={idx + 1} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-primary text-[15px] truncate">
                                  {team.team_name}
                                </span>
                                <ChevronDown
                                  size={16}
                                  className={`text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </div>
                              <span className="text-xs text-accent-color font-mono">{team.arc_code}</span>
                            </div>

                            {activeThemeId === 'all' && (
                              <div className="hidden md:block w-36 text-xs text-text-secondary truncate">
                                {team.theme_name}
                              </div>
                            )}

                            {/* Task Score Chips */}
                            <div className="flex-1 hidden sm:flex flex-wrap items-center gap-2 px-2">
                              {team.tasks.length === 0 ? (
                                <span className="text-xs text-text-muted italic">No tasks assigned</span>
                              ) : (
                                team.tasks.map((task: any) => (
                                  <div
                                    key={task.id}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted border border-hairline ${canEditScores ? 'cursor-pointer hover:bg-muted/80' : ''}`}
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (canEditScores) {
                                        handleUpdateTeamMarks(team, task, e);
                                      }
                                    }}
                                  >
                                    <span className="text-text-primary">{task.title}</span>
                                    {task.obtained_marks != null && (
                                      <span className="text-accent-color font-semibold ml-1">
                                        {task.obtained_marks}
                                      </span>
                                    )}

                                    {isAdmin && (
                                      <button
                                        onClick={e => handleDeleteTask(team, task.title, e)}
                                        className="ml-1 p-0.5 text-text-muted hover:text-danger-color rounded transition-colors"
                                        title="Delete Task"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Total Score */}
                            <div className="text-right shrink-0 w-28">
                              <span className="font-bold text-base text-text-primary font-mono">
                                {team.total_score}
                              </span>
                              <span className="text-xs text-text-muted ml-1">pts</span>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Accordion Dropdown for Team Members & Tasks */}
                        {isExpanded && (
                          <div className="p-5 bg-muted/20 border-t border-hairline space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                Team Roster & Tasks ({team.members.length} Members)
                              </h3>
                              {isMyTeam && (
                                <span className="text-xs text-accent-color font-medium">Your Team</span>
                              )}
                            </div>

                            {/* Members Table inside Dropdown */}
                            <div className="space-y-3">
                              {team.members.map((member: any) => {
                                const memberTasks = tasksData.filter((t: any) => t.assigned_to === member.id);

                                return (
                                  <div
                                    key={member.id}
                                    className="p-3.5 rounded-lg border border-hairline bg-surface space-y-2"
                                  >
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div>
                                        <p className="text-sm font-medium text-text-primary">
                                          {member.display_name || member.username}
                                          {member.is_leader && (
                                            <span className="ml-2 text-xs font-normal text-accent-color">
                                              (Team Leader)
                                            </span>
                                          )}
                                        </p>

                                      </div>
                                    </div>

                                    {/* Member Tasks */}
                                    <div className="pt-2 border-t border-hairline/60 space-y-2">
                                      {memberTasks.length === 0 ? (
                                        <p className="text-xs text-text-muted italic">No tasks assigned to member.</p>
                                      ) : (
                                        memberTasks.map((task: any) => (
                                          <div
                                            key={task.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded bg-muted/30 border border-hairline"
                                          >
                                            <div className="min-w-0">
                                              <p className="text-xs font-medium text-text-primary">{task.title}</p>
                                              {task.due_date && (
                                                <p className="text-[11px] text-text-muted">Due: {task.due_date}</p>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3 flex-wrap">
                                              {/* Status Toggle for Assigned Member */}
                                              {task.assigned_to === profile?.id ? (
                                                <button
                                                  onClick={() => handleToggleStatus(task)}
                                                  className={`chip text-xs px-2.5 py-1 ${
                                                    task.status === 'completed'
                                                      ? 'bg-success-color/15 text-success-color font-semibold'
                                                      : 'bg-warning-color/15 text-warning-color'
                                                  }`}
                                                >
                                                  {task.status === 'completed' ? '✓ Done' : '○ Pending'}
                                                </button>
                                              ) : (
                                                <Badge tone={task.status === 'completed' ? 'success' : 'warning'}>
                                                  {task.status === 'completed' ? 'Done' : 'Pending'}
                                                </Badge>
                                              )}

                                              </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank > 3) {
    return <span className="inline-grid place-items-center w-7 h-7 text-[13px] text-text-secondary tabular">{rank}</span>;
  }
  const styles = [
    { bg: 'color-mix(in oklab, var(--c-warning) 20%, transparent)', bd: 'var(--c-warning)', fg: 'var(--c-warning)' },
    { bg: 'color-mix(in oklab, var(--c-text-3) 22%, transparent)', bd: 'var(--c-text-3)', fg: 'var(--c-text-2)' },
    { bg: 'color-mix(in oklab, #b45309 24%, transparent)', bd: '#b45309', fg: '#d08a3f' },
  ][rank - 1];
  return (
    <span
      className="inline-grid place-items-center w-7 h-7 rounded-full text-[12px] font-bold border tabular"
      style={{ background: styles.bg, borderColor: styles.bd, color: styles.fg }}
    >
      {rank === 1 ? <Trophy size={13} /> : rank}
    </span>
  );
}

