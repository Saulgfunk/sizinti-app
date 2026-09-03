import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import type { CheckinResponse } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type LogCheckinInput = {
  subscriptionId: string;
  userId: string;
  response: CheckinResponse;
  resultedInCancellation: boolean;
};

// checkin_events is append-only (docs/05_Data_Model.md — no update/delete
// policy), so this is only ever called once the outcome is already known —
// callers must wait until a cancellation has actually happened or been
// dismissed before logging, not insert-then-update.
export function useLogCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscriptionId, userId, response, resultedInCancellation }: LogCheckinInput) => {
      const { error: eventError } = await supabase.from('checkin_events').insert({
        subscription_id: subscriptionId,
        user_id: userId,
        response,
        resulted_in_cancellation: resultedInCancellation,
      });
      if (eventError) throw eventError;

      // "Still using" and "dismissed without cancelling" both reset the
      // check-in timer (docs/03_Flowchart.md §3, boxes F/G and L). A
      // cancellation doesn't need this — the subscription is no longer
      // active, so it won't be considered for check-in again regardless.
      if (!resultedInCancellation) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ last_checkin_date: format(new Date(), 'yyyy-MM-dd'), checkin_reminder_sent_at: null })
          .eq('id', subscriptionId);
        if (subError) throw subError;
      }
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] });
    },
  });
}
