-- Schedules the fetch-fx-rates Edge Function to run once a day.
-- Reuses the same Vault secret set up for daily-renewal-check
-- (migration 20260903144316) — no new manual step needed if that one's
-- already been run. pg_cron/pg_net are enabled there too; `if not exists`
-- here just makes this migration safe to run standalone.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'fetch-fx-rates',
  '0 7 * * *', -- 07:00 UTC daily, an hour before daily-renewal-check
  $$
  select net.http_post(
    url := 'https://nntlvarwspvkcswrxduo.supabase.co/functions/v1/fetch-fx-rates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    )
  ) as request_id;
  $$
);
