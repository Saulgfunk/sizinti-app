// docs/03_Flowchart.md §3: the in-app check-in card itself is computed live
// client-side (lib/utils/selectCheckinCandidate.ts) whenever Dashboard
// renders — no server job needed for that part. This function only handles
// box M: "Ignored 5+ days --> Send one soft push reminder." Fires exactly
// once per check-in cycle via checkin_reminder_sent_at (migration
// 20260903155803), which useLogCheckin resets to null once the user
// actually resolves the check-in.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const SOFT_REMINDER_AFTER_DAYS = 5;

interface SubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  status: string;
  last_checkin_date: string | null;
  checkin_reminder_sent_at: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  push_token: string | null;
  checkin_interval_days: number;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function sendPushNotification(token: string, title: string, body: string) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

Deno.serve(async () => {
  const today = new Date();

  const { data: subscriptions, error } = await supabase.from('subscriptions').select('*').eq('status', 'active');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const userIds = [...new Set((subscriptions as SubscriptionRow[]).map((s) => s.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, push_token, checkin_interval_days').in('id', userIds)
    : { data: [] as ProfileRow[] };
  const profileById = new Map((profiles as ProfileRow[]).map((p) => [p.id, p]));

  let remindersSent = 0;

  for (const sub of subscriptions as SubscriptionRow[]) {
    if (sub.checkin_reminder_sent_at) continue;

    const profile = profileById.get(sub.user_id);
    if (!profile?.push_token) continue;

    const dueSince = sub.last_checkin_date
      ? addDays(new Date(sub.last_checkin_date), profile.checkin_interval_days)
      : new Date(sub.created_at);

    const daysSinceDue = Math.floor((today.getTime() - dueSince.getTime()) / 86_400_000);
    if (daysSinceDue < SOFT_REMINDER_AFTER_DAYS) continue;

    await sendPushNotification(
      profile.push_token,
      'Hâlâ orada mısın?',
      `${sub.name}'i hâlâ kullanıyor musun? Uygulamayı aç ve gözden geçir.`
    );

    await supabase
      .from('subscriptions')
      .update({ checkin_reminder_sent_at: today.toISOString() })
      .eq('id', sub.id);

    remindersSent++;
  }

  return new Response(JSON.stringify({ remindersSent, checkedAt: toDateOnly(today) }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
