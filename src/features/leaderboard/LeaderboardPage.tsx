import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ShieldCheck, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { gsap, useGSAP, DURATION, EASE } from '../../lib/motion';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/primitives';

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
  const { themeId, isAdmin } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<string>(themeId ? themeId.toString() : '1');
  const containerRef = useRef<HTMLDivElement>(null);

  // Non-admins always see their own theme's leaderboard.
  const activeThemeId = isAdmin ? selectedTheme : themeId?.toString() || '1';

  const { data: themes = FALLBACK_THEMES } = useQuery({
    queryKey: ['themes-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('id, name').order('id');
      if (error || !data?.length) return FALLBACK_THEMES;
      return data.map((t: any) => ({ id: String(t.id), name: t.name }));
    },
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leaderboard', activeThemeId],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select(`
          id, 
          name, 
          official_eyantra_id, 
          status, 
          created_by, 
          theme:themes!inner(id, name, slug),
          profiles:profiles(display_name, is_leader)
        `);
      if (activeThemeId) query = query.eq('theme_id', activeThemeId);
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch real completed task counts per team by checking member assignments
      // or directly by theme if it's 1:1. Using assigned_to -> profile -> team_id is safer.
      const { data: taskData } = await supabase
        .from('tasks')
        .select('assigned_to, status, profiles:profiles!inner(team_id)')
        .eq('status', 'completed');
        
      const teamTaskCounts: Record<number, number> = {};
      if (taskData) {
        taskData.forEach((task: any) => {
          const tId = task.profiles?.team_id;
          if (tId) teamTaskCounts[tId] = (teamTaskCounts[tId] || 0) + 1;
        });
      }

      return (data || []).map((t: any) => {
        const leader = Array.isArray(t.profiles) ? t.profiles.find((p: any) => p.is_leader) : null;
        
        return {
          team_id: t.id,
          team_name: t.name,
          arc_code: t.official_eyantra_id || 'N/A',
          leader_name: leader?.display_name || 'N/A',
          official_score: 0, // Genuinely missing from schema. Left as 0 per instructions.
          arc_points: 0, // Genuinely missing from schema. Left as 0 per instructions.
          completed_tasks: teamTaskCounts[t.id] || 0,
          theme: Array.isArray(t.theme) ? t.theme[0] : t.theme,
        };
      });
    },
  });

  useGSAP(
    () => {
      if (isLoading || !containerRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.gs-row',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out, stagger: 0.04, clearProps: 'all' }
        );
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [data] }
  );

  const sorted = useMemo(
    () => [...(data || [])].sort((a, b) => b.official_score - a.official_score),
    [data]
  );

  const activeThemeName = themes.find(t => t.id === activeThemeId)?.name ?? 'Theme';

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="font-display text-[30px] tracking-tight text-text-primary">Leaderboard</h1>
        <p className="text-[14px] text-text-secondary mt-1">
          Verified official standings · <span className="text-text-primary">{activeThemeName}</span>
        </p>
      </div>

      {isAdmin && (
        <div>
          <label htmlFor="lb-theme" className="sr-only">Select theme</label>
          {/* Chips on wider screens, native select on mobile — both accessible. */}
          <div
            role="tablist"
            aria-label="Leaderboard theme"
            className="hidden sm:flex flex-wrap gap-2"
          >
            {themes.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={t.id === activeThemeId}
                data-active={t.id === activeThemeId}
                onClick={() => setSelectedTheme(t.id)}
                className="chip"
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
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center"><Spinner size={32} /></div>
      ) : isError ? (
        <ErrorState description="Unable to load leaderboard data." onRetry={() => refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={30} />}
          title="No verified standings yet"
          description="Scores appear here once tasks and score windows are verified by administrators."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="surface-card overflow-hidden hidden sm:block p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-muted/60 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4 text-center w-16">Rank</th>
                    <th scope="col" className="py-3 px-4">Team</th>
                    <th scope="col" className="py-3 px-4">Theme</th>
                    <th scope="col" className="py-3 px-4">Leader</th>
                    <th scope="col" className="py-3 px-4 text-center">Verified tasks</th>
                    <th scope="col" className="py-3 px-4 text-right">Official score</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {sorted.map((t, idx) => (
                    <tr key={t.team_id} className="gs-row border-b border-hairline last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 text-center"><RankMedal rank={idx + 1} /></td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-text-primary">{t.team_name}</div>
                        <div className="text-[11px] text-accent-color tabular">{t.arc_code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-[13px]">{t.theme?.name || '—'}</td>
                      <td className="py-3.5 px-4 text-text-secondary text-[13px]">{t.leader_name || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="badge badge-success"><CheckCircle2 size={13} />{t.completed_tasks}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-text-primary tabular">
                        {t.official_score.toFixed(1)} <span className="text-text-muted text-xs">pts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2.5">
            {sorted.map((t, idx) => (
              <div key={t.team_id} className="gs-row surface-card p-4 flex items-center gap-3">
                <RankMedal rank={idx + 1} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{t.team_name}</p>
                  <p className="text-[12px] text-text-secondary truncate">
                    {t.theme?.name || '—'} · <span className="tabular text-accent-color">{t.arc_code}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-text-primary tabular">{t.official_score.toFixed(1)}</p>
                  <p className="text-[11px] text-text-muted">pts</p>
                </div>
              </div>
            ))}
          </div>
        </>
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
