-- Not in docs/05_Data_Model.md — needed by daily-checkin-trigger to send
-- the "soft push reminder if ignored for 5+ days" (docs/03_Flowchart.md §3,
-- box M) exactly once per check-in cycle rather than every day past day 5.
-- Reset to null whenever a check-in is actually resolved (see
-- lib/queries/useCheckins.ts), so the next cycle can trigger its own
-- reminder later.
alter table public.subscriptions
  add column checkin_reminder_sent_at timestamptz;
