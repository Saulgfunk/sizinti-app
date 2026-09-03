-- Not in docs/05_Data_Model.md — added because Flow A/H (docs/02_User_Flow.md)
-- require distinguishing "logged in, never finished onboarding" from
-- "logged in, already set preferences" to decide where Splash routes to,
-- and profiles has no field that captures this.
alter table public.profiles
  add column onboarding_completed_at timestamptz;
