import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../../lib/supabase/client';
import type { Team, Theme } from '../../types/arc';

// Zod schema validates the shape of important API responses at the boundary.
const themeMetricSchema = z.object({
  id: z.number(),
  key: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
  target_value: z.string().nullable(),
  requires_evidence: z.boolean(),
  display_order: z.number(),
});

const themeSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  tagline: z.string().nullable(),
  summary: z.string().nullable(),
  accent_color: z.string().nullable(),
  official_url: z.string().nullable(),
  display_order: z.number(),
  metrics: z.array(themeMetricSchema).optional(),
});

export function useThemes() {
  return useQuery({
    queryKey: ['themes'],
    queryFn: async (): Promise<Theme[]> => {
      const { data, error } = await supabase.from('themes').select('*').order('display_order');
      if (error) throw error;
      return z.array(themeSchema).parse(data);
    },
    staleTime: 5 * 60_000,
  });
}

export interface CreateTeamInput {
  name: string;
  /** EXACTLY ONE theme id — a single scalar, never an array. */
  theme_id: number;
  official_eyantra_id?: string | null;
  description?: string | null;
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation<Team, Error, CreateTeamInput>({
    mutationFn: async (input) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: teamData, error: teamError } = await supabase.from('teams').insert([{
        name: input.name,
        theme_id: input.theme_id,
        official_eyantra_id: input.official_eyantra_id,
        description: input.description,
        created_by: userData.user.id
      }]).select().single();
      
      if (teamError) throw teamError;

      // Update the user's profile to link them to this team as leader
      const { error: profileError } = await supabase.from('profiles').update({
        team_id: teamData.id,
        is_leader: true,
      }).eq('id', userData.user.id);

      if (profileError) throw profileError;

      return teamData as Team;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['my-team'] });
    },
  });
}
