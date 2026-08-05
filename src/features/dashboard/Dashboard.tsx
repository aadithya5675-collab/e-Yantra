import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Users, LayoutGrid } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { Reveal } from '../../components/motion/Reveal';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/primitives';

interface Standing {
  team_id: number;
  team_name: string;
  arc_code: string;
  theme: { id: number; name: string; slug: string } | null;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, official_eyantra_id, theme:themes(id, name, slug)');
      if (error) throw error;
      return (data || []).map((t: any) => ({
        team_id: t.id,
        team_name: t.name,
        arc_code: t.official_eyantra_id || 'N/A',
        theme: Array.isArray(t.theme) ? t.theme[0] : t.theme,
      }));
    },
  });

  const teams = data || [];
  const totalTeams = teams.length;

  const themesMap = new Map<string, Standing[]>();
  teams.forEach(team => {
    const themeName = team.theme?.name || 'Unassigned';
    if (!themesMap.has(themeName)) themesMap.set(themeName, []);
    themesMap.get(themeName)!.push(team);
  });

  const themeGroups = Array.from(themesMap.entries())
    .map(([name, themeTeams]) => ({
      name,
      count: themeTeams.length,
      teams: themeTeams.sort((a, b) => a.team_name.localeCompare(b.team_name)),
    }))
    .sort((a, b) => {
      if (a.name === 'Unassigned') return 1;
      if (b.name === 'Unassigned') return -1;
      return a.name.localeCompare(b.name);
    });

  const toggle = (name: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  if (isLoading) return <div className="py-20 flex justify-center"><Spinner size={32} /></div>;
  if (isError) return <ErrorState description="Unable to load dashboard data." onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <Reveal y={16}>
        <h1 className="text-[24px] font-semibold tracking-tight text-text-primary">Command centre</h1>
        <p className="mt-1 text-[14.5px] text-text-secondary">
          Welcome back, {profile?.display_name}. Global overview across all seven themes.
        </p>
      </Reveal>

      {/* Overview stats */}
      <Reveal className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile icon={<Users size={16} />} label="Total teams" value={totalTeams} />
        <StatTile icon={<LayoutGrid size={16} />} label="Active themes" value={themeGroups.filter(g => g.name !== 'Unassigned').length} />
        <StatTile icon={<Users size={16} />} label="Unassigned" value={themesMap.get('Unassigned')?.length ?? 0} muted />
      </Reveal>

      {/* Teams by theme */}
      <Reveal>
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">Teams by theme</h2>
        {themeGroups.length === 0 ? (
          <EmptyState icon={<Users size={30} />} title="No teams yet" description="Teams appear here as leaders complete onboarding." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {themeGroups.map(group => {
              const isOpen = expanded.has(group.name);
              const panelId = `theme-${group.name.replace(/\s+/g, '-')}`;
              return (
                <div key={group.name} className="surface-card overflow-hidden p-0">
                  <button
                    onClick={() => toggle(group.name)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="badge badge-accent tabular">{group.count}</span>
                      <span className="font-medium text-text-primary truncate">{group.name}</span>
                    </span>
                    <ChevronDown
                      size={18}
                      className="text-text-muted shrink-0 transition-transform"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>
                  {isOpen && (
                    <div id={panelId} className="px-4 pb-4 pt-1 border-t border-hairline">
                      {group.count > 0 ? (
                        <ul className="space-y-1.5 mt-3">
                          {group.teams.map(t => (
                            <li key={t.team_id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40">
                              <span className="text-[13.5px] text-text-primary truncate">{t.team_name}</span>
                              <span className="badge tabular shrink-0">{t.arc_code}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-text-muted mt-3">No teams enrolled yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Reveal>
    </div>
  );
}

function StatTile({ icon, label, value, muted }: { icon: React.ReactNode; label: string; value: number; muted?: boolean }) {
  return (
    <div className="surface-card p-4">
      <div className={`flex items-center gap-1.5 text-[12px] font-medium ${muted ? 'text-text-muted' : 'text-text-secondary'}`}>
        {icon}{label}
      </div>
      <AnimatedNumber value={value} className="block mt-2 text-[30px] font-semibold tracking-tight text-text-primary tabular" />
    </div>
  );
}
