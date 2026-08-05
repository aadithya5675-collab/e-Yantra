import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, ApiError, type Wrapped } from '../../lib/api/client';
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
      const res = await api.get<Wrapped<unknown[]>>('/themes');
      return z.array(themeSchema).parse(res.data);
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
  return useMutation<Team, ApiError, CreateTeamInput>({
    mutationFn: async (input) => {
      const res = await api.post<Wrapped<Team>>('/teams', input);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['my-team'] });
    },
  });
}
