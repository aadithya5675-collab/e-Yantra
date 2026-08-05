import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { gsap, useGSAP, DURATION, EASE } from '../../lib/motion';
import { ThemeWheel } from '../../components/uiverse/ThemeWheel';
import { Loader } from '../../components/uiverse/Loader';

export function LeaderboardPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>('1');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', selectedTheme],
    queryFn: async () => {
      let query = supabase.from('teams').select('id, name, official_eyantra_id, status, created_by, theme:themes!inner(id, name, slug)');
      
      if (selectedTheme) {
        query = query.eq('theme_id', selectedTheme);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((t: any) => ({
        team_id: t.id,
        team_name: t.name,
        arc_code: t.official_eyantra_id || 'N/A',
        leader_name: t.created_by ? 'Team Leader' : 'N/A', // We can join profiles later if needed
        official_score: 0,
        arc_points: 0,
        completed_tasks: 0,
        theme: Array.isArray(t.theme) ? t.theme[0] : t.theme
      }));
    },
  });

  useGSAP(
    () => {
      if (isLoading || !containerRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.gs-leaderboard-row',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out, stagger: 0.04, clearProps: 'all' }
        );
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [data] }
  );

  const standings = data || [];
  const sortedStandings = [...standings].sort((a, b) => b.official_score - a.official_score);

  return (
    <div ref={containerRef} className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-text-primary uppercase">
            Leaderboard
          </h1>
        </div>

        {/* Theme Wheel */}
        <div className="flex flex-col items-end gap-2">
          <ThemeWheel value={selectedTheme} onChange={setSelectedTheme} />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader />
        </div>
      ) : isError ? (
        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          Unable to load leaderboard data.
        </div>
      ) : sortedStandings.length === 0 ? (
        <div className="p-12 text-center border border-hairline rounded-xl bg-surface-muted/30">
          <ShieldCheck className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-semibold text-text-primary">No Verified Standings Yet</h3>
          <p className="text-xs text-text-secondary mt-1">
            Scores will appear here once tasks and score windows are verified by administrators.
          </p>
        </div>
      ) : (
        <div className="bg-surface-muted/40 border border-hairline rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-surface-muted/80 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-4">Theme</th>
                  <th className="py-3.5 px-4">Leader</th>
                  <th className="py-3.5 px-4 text-center">Verified Tasks</th>
                  <th className="py-3.5 px-4 text-right">
                    Official Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-sm">
                {sortedStandings.map((t, idx) => (
                  <tr
                    key={t.team_id}
                    className="gs-leaderboard-row hover:bg-surface-muted/60 transition-colors"
                  >
                    <td className="py-4 px-4 text-center font-bold">
                      {idx === 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-xs border border-amber-400/50">
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 font-bold text-xs border border-slate-400/50">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 font-bold text-xs border border-amber-700/50">
                          3
                        </span>
                      ) : (
                        <span className="text-text-secondary text-xs">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium text-text-primary">
                      <div>{t.team_name}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">{t.arc_code}</div>
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-xs">
                      {t.theme?.name || '—'}
                    </td>
                    <td className="py-4 px-4 text-text-secondary text-xs">
                      {t.leader_name || '—'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.completed_tasks}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-text-primary text-base font-mono">
                      <span className="text-cyan-300">{t.official_score.toFixed(1)} pts</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
