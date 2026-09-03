import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Profile } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile> & { id: string }): Promise<Profile> => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase.from('profiles').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', data.id], data);
    },
  });
}
