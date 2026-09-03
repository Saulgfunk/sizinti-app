import { useQuery } from '@tanstack/react-query';

import type { FxRate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useFxRates() {
  return useQuery({
    queryKey: ['fx_rates'],
    queryFn: async (): Promise<FxRate[]> => {
      const { data, error } = await supabase.from('fx_rates').select('*').order('fetched_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // refreshed daily server-side, no need to refetch often
  });
}
