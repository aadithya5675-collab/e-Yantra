import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { Profile } from '../../types';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('display_name');
      if (error) throw error;
      return data as Profile[];
    },
  });
}
