import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { Reveal } from '../../components/motion/Reveal';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { Loader } from '../../components/uiverse/Loader';

// Same standing interface returned by /leaderboard
interface Standing {
  team_id: number;
  team_name: string;
  arc_code: string;
  theme: { id: number; name: string; slug: string } | null;
}

export function Dashboard() {
  const { profile } = useAuth();

  // Fetch all teams by querying the leaderboard with no filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      return api.get<{ data: Standing[] }>('/leaderboard');
    },
  });

  const teams = data?.data || [];
  const totalTeams = teams.length;

  // Group teams by theme
  const themesMap = new Map<string, Standing[]>();
  teams.forEach(team => {
    // If a team doesn't have a theme yet, we group them under 'Unassigned'
    const themeName = team.theme?.name || 'Unassigned';
    if (!themesMap.has(themeName)) {
      themesMap.set(themeName, []);
    }
    themesMap.get(themeName)!.push(team);
  });

  // Convert map to array and sort by theme name
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

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
        Unable to load dashboard data.
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-12">
      {/* Header */}
      <Reveal className="mb-8" y={20}>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-text-primary uppercase mb-2">
          Admin Dashboard
        </h1>
        <p className="text-[17px] text-text-secondary max-w-lg">
          Welcome back, {profile?.display_name}. Here is the global team overview.
        </p>
      </Reveal>

      {/* Total Teams Counter */}
      <Reveal className="bg-accent-color border-4 border-black p-8 sm:p-12 shadow-[8px_8px_0px_black] rounded-xl flex flex-col items-center justify-center text-center">
        <p className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-black mb-2 opacity-90">
          Total Teams
        </p>
        <AnimatedNumber
          value={totalTeams}
          className="block text-7xl sm:text-8xl font-black tracking-tighter text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        />
      </Reveal>

      {/* Themes Grid */}
      <Reveal>
        <h2 className="text-2xl font-black uppercase tracking-tight text-text-primary mb-6">
          Teams by Theme
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themeGroups.map((group) => (
            <div 
              key={group.name} 
              className="group relative bg-surface border-4 border-black p-6 shadow-[6px_6px_0px_black] rounded-xl hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_black] transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-text-primary uppercase leading-tight pr-4">
                  {group.name}
                </h3>
                <span className="bg-black text-white px-3 py-1 text-xl font-black rounded-lg">
                  {group.count}
                </span>
              </div>
              
              {/* Tooltip / Expandable list on Hover */}
              <div className="absolute left-0 top-full mt-4 w-full bg-page border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_black] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 max-h-[300px] overflow-y-auto">
                <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 border-b-2 border-black pb-2">
                  Enrolled Teams ({group.count})
                </h4>
                {group.count > 0 ? (
                  <ul className="space-y-2">
                    {group.teams.map(t => (
                      <li key={t.team_id} className="text-sm font-semibold text-text-primary bg-surface-muted px-3 py-2 rounded-lg border-2 border-transparent hover:border-black transition-colors flex justify-between items-center">
                        <span className="truncate">{t.team_name}</span>
                        <span className="text-[10px] bg-accent-color text-white px-2 py-0.5 rounded-full ml-2 shrink-0">{t.arc_code}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-secondary italic">No teams enrolled yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
