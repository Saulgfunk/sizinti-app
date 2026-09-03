-- Schedules the daily-renewal-check Edge Function (docs/03_Flowchart.md §2)
-- to run once a day.
--
-- IMPORTANT — one manual step required first, and it must NOT go in this
-- file: your service_role key has to be stored in Supabase Vault so this
-- job can authenticate its HTTP call without the key ever being committed
-- to the repo. Run this once yourself, via the SQL Editor, filling in the
-- real key from Settings > API — do not send that key to Claude Code:
--
--   select vault.create_secret('<your-service-role-key>', 'service_role_key');
--
-- Then run the rest of this file (also via SQL Editor, or `supabase db
-- push` once the project is CLI-linked).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'daily-renewal-check',
  '0 8 * * *', -- 08:00 UTC daily
  $$
  select net.http_post(
    url := 'https://nntlvarwspvkcswrxduo.supabase.co/functions/v1/daily-renewal-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    )
  ) as request_id;
  $$
);
