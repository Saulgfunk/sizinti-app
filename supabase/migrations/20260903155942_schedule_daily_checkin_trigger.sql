-- Schedules the daily-checkin-trigger Edge Function to run once a day.
-- Reuses the same Vault secret as daily-renewal-check
-- (migration 20260903144316) — no new manual step if that's already done.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'daily-checkin-trigger',
  '0 9 * * *', -- 09:00 UTC daily
  $$
  select net.http_post(
    url := 'https://nntlvarwspvkcswrxduo.supabase.co/functions/v1/daily-checkin-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    )
  ) as request_id;
  $$
);
