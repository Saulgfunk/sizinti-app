-- Not in docs/05_Data_Model.md — needed to store each user's Expo push
-- token so the daily-renewal-check Edge Function (docs/03_Flowchart.md §2)
-- knows where to send renewal reminders. Single column (not a separate
-- devices table) — MVP scope assumes one active device per user.
alter table public.profiles
  add column push_token text;
