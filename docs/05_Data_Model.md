# Data Model — v0.1

Target backend: Supabase (Postgres). Schema below is written close to actual SQL so it can be handed directly to Claude Code to generate migrations.

## Entities

### `users` (managed by Supabase Auth — extend with a profile table)

**`profiles`**
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK, FK → auth.users.id) | |
| base_currency | text | default 'TRY' |
| checkin_interval_days | int | default 75 (falls in the 60–90 day range) |
| default_reminder_lead_days | int | default 3 |
| created_at | timestamptz | default now() |

### `subscriptions`

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | default gen_random_uuid() |
| user_id | uuid (FK → profiles.id) | |
| name | text | required |
| category | text | enum-like: streaming, saas, fitness, finance, education, other |
| icon_key | text | nullable — maps to a pre-set logo for quick-pick services |
| price | numeric(10,2) | required |
| currency | text | 'TRY' / 'USD' / 'EUR' / 'GBP' |
| billing_cycle | text | 'weekly' / 'monthly' / 'yearly' / 'custom' |
| custom_cycle_days | int | nullable, used only if billing_cycle = 'custom' |
| start_date | date | required — seeds lifetime_spent calculation |
| next_renewal_date | date | auto-calculated, editable |
| reminder_lead_days | int | nullable — overrides profile default if set |
| status | text | 'active' / 'cancelled' |
| cancelled_at | date | nullable |
| lifetime_spent | numeric(10,2) | maintained by scheduled job (see Flowchart §5) |
| last_checkin_date | date | nullable — null means never checked in |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### `checkin_events` (log table — powers the P0 success metric: "leak found")

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| subscription_id | uuid (FK → subscriptions.id) | |
| user_id | uuid (FK → profiles.id) | |
| response | text | 'still_using' / 'not_sure_or_no' |
| resulted_in_cancellation | boolean | default false — set true if user cancels within this session |
| created_at | timestamptz | default now() |

### `fx_rates` (cached daily rates — avoids hammering external API)

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| currency_pair | text | e.g. 'USD_TRY' |
| rate | numeric(12,6) | |
| fetched_at | timestamptz | |

## Relationships

```
profiles (1) ── (many) subscriptions
subscriptions (1) ── (many) checkin_events
fx_rates — standalone lookup table, refreshed daily by scheduled job
```

## Row-Level Security (RLS) — required from day one on Supabase

- `subscriptions`: user can only `SELECT/INSERT/UPDATE/DELETE` rows where `user_id = auth.uid()`
- `checkin_events`: same pattern
- `profiles`: user can only read/update their own row
- `fx_rates`: public read, no write access from client (only Edge Function with service role can write)

## Notes for Claude Code build

- `lifetime_spent` should be a **derived/maintained** field, not calculated client-side each render — recalculate it in the same scheduled Edge Function that advances `next_renewal_date` (see Flowchart §2 and §5). This keeps the number consistent across devices on cloud sync.
- Keep `checkin_events` append-only — never update/delete rows, since this is your core analytics signal for "did we find a leak."
