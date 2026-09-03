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

export function useSubscription(id: string | undefined) {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: async (): Promise<Subscription> => {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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
  | 'lifetime_spent'
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

export type SubscriptionEdits = Partial<
  Pick<
    Subscription,
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
    | 'status'
    | 'cancelled_at'
  >
>;

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, edits }: { id: string; edits: SubscriptionEdits }): Promise<Subscription> => {
      const { data, error } = await supabase.from('subscriptions').update(edits).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Write the fresh row straight into the cache rather than relying
      // solely on invalidateQueries — a screen reached via router.replace
      // isn't guaranteed to be the same mounted instance that was
      // subscribed before, so a refetch can land somewhere invalidation
      // doesn't reliably reach in time.
      queryClient.setQueryData(['subscription', data.id], data);
      queryClient.setQueryData<Subscription[]>(['subscriptions', data.user_id], (old) =>
        old ? old.map((s) => (s.id === data.id ? data : s)) : old
      );
      queryClient.invalidateQueries({ queryKey: ['subscriptions', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['subscription', data.id] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; userId: string }): Promise<void> => {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { id, userId }) => {
      queryClient.setQueryData<Subscription[]>(['subscriptions', userId], (old) =>
        old ? old.filter((s) => s.id !== id) : old
      );
      queryClient.removeQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] });
    },
  });
}
