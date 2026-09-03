// docs/06_Tech_Stack.md: "Use a free-tier FX API... fetched once daily by a
// scheduled Edge Function into the fx_rates cache table — never call a live
// FX API from the client." Uses open.er-api.com — free, no API key/account
// needed (unlike the push notification setup in Phase 8), so there's one
// less external-account blocker here than there was there.
//
// Inserts rather than upserts — fx_rates has no unique constraint on
// currency_pair, and fetched_at makes this a time series rather than a
// snapshot, which is what Roadmap Phase 2's "FX-specific alerts: flag when
// a foreign-currency subscription's TL-equivalent cost has risen" will
// eventually need.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const PAIRS: { from: string; to: string }[] = [
  { from: 'USD', to: 'TRY' },
  { from: 'EUR', to: 'TRY' },
  { from: 'GBP', to: 'TRY' },
];

Deno.serve(async () => {
  const updated: string[] = [];

  for (const { from, to } of PAIRS) {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!res.ok) continue;

    const json = await res.json();
    const rate = json?.rates?.[to];
    if (typeof rate !== 'number') continue;

    const { error } = await supabase.from('fx_rates').insert({ currency_pair: `${from}_${to}`, rate });
    if (!error) updated.push(`${from}_${to}=${rate}`);
  }

  return new Response(JSON.stringify({ updated }), { headers: { 'Content-Type': 'application/json' } });
});
