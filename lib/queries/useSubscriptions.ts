import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Subscription } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useSubscriptions(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: async (): Promise<Subscription[]> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId!)
        .order('next_renewal_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export type NewSubscription = Pick<
  Subscription,
  | 'user_id'
  | 'name'
  | 'category'
  | 'icon_key'
  | 'price'
  | 'currency'
  | 'billing_cycle'
  | 'custom_cycle_days'
  | 'start_date'
  | 'next_renewal_date'
  | 'reminder_lead_days'
>;

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewSubscription): Promise<Subscription> => {
      const { data, error } = await supabase.from('subscriptions').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', data.user_id] });
    },
  });
}
