import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Category } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useCategories(userId: string | undefined) {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useRenameCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }): Promise<Category> => {
      const { data, error } = await supabase.from('categories').update({ label }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.user_id] });
    },
  });
}

// A slugified value derived from the label, so it stays stable as a
// subscriptions.category value even if the label is renamed again later.
function slugify(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'kategori'
  );
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      label,
      color,
    }: {
      userId: string;
      label: string;
      color: string;
    }): Promise<Category> => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: userId, value: slugify(label), label, color })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.user_id] });
    },
  });
}
