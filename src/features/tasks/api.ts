import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { Task } from '../../types';

export function useTasks(filters?: { assigned_to?: string; theme_id?: number }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      if (filters && 'assigned_to' in filters && !filters.assigned_to) return [];
      let q = supabase
        .from('tasks')
        .select('*, assigned_profile:profiles!assigned_to(*)')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (filters?.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
      if (filters?.theme_id) q = q.eq('theme_id', filters.theme_id);
      const { data, error } = await q;
      if (error && error.code !== '42703') throw error; // Ignore column missing if not yet applied
      return (data || []) as Task[];
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['admin-tasks'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['admin-tasks'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
