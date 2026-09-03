// Flow E / docs/03_Flowchart.md §2: daily scheduled job that sends renewal
// reminders and advances next_renewal_date + lifetime_spent once a
// subscription's renewal date has actually arrived.
//
// Deviates slightly from the flowchart's single combined condition
// ("next_renewal_date - today <= reminder_lead_days" triggering both the
// notification AND the date advance): read literally, that would refire
// and re-advance the date every single day inside the reminder window.
// Split into two independent checks instead — reminder fires exactly once,
// on the configured lead day; the date/spend advance fires once the
// renewal date has arrived, regardless of the reminder window.
//
// docs/05_Data_Model.md's billing_cycle enum (weekly/monthly/yearly/custom)
// has no "one-time" option, so the flowchart's "mark inactive" branch for
// non-recurring subscriptions doesn't apply to this schema — every active
// subscription here is recurring.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type BillingCycle = 'weekly' | 'monthly' | 'yearly' | 'custom';

interface SubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  custom_cycle_days: number | null;
  next_renewal_date: string;
  reminder_lead_days: number | null;
  lifetime_spent: number;
}

interface ProfileRow {
  id: string;
  push_token: string | null;
  default_reminder_lead_days: number;
}

function addCycle(date: Date, cycle: BillingCycle, customDays: number | null): Date {
  const next = new Date(date);
  switch (cycle) {
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case 'yearly':
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
    case 'custom':
      next.setUTCDate(next.getUTCDate() + (customDays ?? 30));
      break;
  }
  return next;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
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
  const todayStr = toDateOnly(today);

  const { data: subscriptions, error } = await supabase.from('subscriptions').select('*').eq('status', 'active');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const userIds = [...new Set((subscriptions as SubscriptionRow[]).map((s) => s.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, push_token, default_reminder_lead_days').in('id', userIds)
    : { data: [] as ProfileRow[] };
  const profileById = new Map((profiles as ProfileRow[]).map((p) => [p.id, p]));

  let remindersSent = 0;
  let renewalsAdvanced = 0;

  for (const sub of subscriptions as SubscriptionRow[]) {
    const profile = profileById.get(sub.user_id);
    const leadDays = sub.reminder_lead_days ?? profile?.default_reminder_lead_days ?? 3;

    const renewalDate = new Date(sub.next_renewal_date);
    const daysUntilRenewal = Math.round((renewalDate.getTime() - today.getTime()) / 86_400_000);

    if (daysUntilRenewal === leadDays && profile?.push_token) {
      await sendPushNotification(
        profile.push_token,
        `${sub.name} yenileniyor`,
        `${leadDays} gün sonra ${sub.price} ${sub.currency} çekilecek.`
      );
      remindersSent++;
    }

    if (sub.next_renewal_date <= todayStr) {
      const nextDate = addCycle(renewalDate, sub.billing_cycle, sub.custom_cycle_days);
      await supabase
        .from('subscriptions')
        .update({
          next_renewal_date: toDateOnly(nextDate),
          lifetime_spent: Math.round((sub.lifetime_spent + sub.price) * 100) / 100,
        })
        .eq('id', sub.id);
      renewalsAdvanced++;
    }
  }

  return new Response(JSON.stringify({ remindersSent, renewalsAdvanced }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
