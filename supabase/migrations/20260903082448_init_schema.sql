-- Sızıntı v0.1 schema
-- Source of truth: docs/05_Data_Model.md

-- ============================================================
-- profiles
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  base_currency text not null default 'TRY',
  checkin_interval_days int not null default 75,
  default_reminder_lead_days int not null default 3,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up (Flow A step 4
-- needs a profiles row to exist before onboarding preferences are saved).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- subscriptions
-- ============================================================

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null,
  icon_key text,
  price numeric(10, 2) not null,
  currency text not null check (currency in ('TRY', 'USD', 'EUR', 'GBP')),
  billing_cycle text not null check (billing_cycle in ('weekly', 'monthly', 'yearly', 'custom')),
  custom_cycle_days int,
  start_date date not null,
  next_renewal_date date not null,
  reminder_lead_days int,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancelled_at date,
  lifetime_spent numeric(10, 2) not null default 0,
  last_checkin_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_next_renewal_date_idx on public.subscriptions (next_renewal_date) where status = 'active';

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "subscriptions_update_own"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "subscriptions_delete_own"
  on public.subscriptions for delete
  using (auth.uid() = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- checkin_events
-- append-only log table (see docs/05_Data_Model.md "Notes for Claude Code
-- build") — no update/delete policy is intentional.
-- ============================================================

create table public.checkin_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  response text not null check (response in ('still_using', 'not_sure_or_no')),
  resulted_in_cancellation boolean not null default false,
  created_at timestamptz not null default now()
);

create index checkin_events_subscription_id_idx on public.checkin_events (subscription_id);
create index checkin_events_user_id_idx on public.checkin_events (user_id);

alter table public.checkin_events enable row level security;

create policy "checkin_events_select_own"
  on public.checkin_events for select
  using (auth.uid() = user_id);

create policy "checkin_events_insert_own"
  on public.checkin_events for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- fx_rates
-- Public read cache, written only by Edge Functions via the service role
-- (which bypasses RLS) — no insert/update/delete policy for clients.
-- ============================================================

create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  currency_pair text not null,
  rate numeric(12, 6) not null,
  fetched_at timestamptz not null default now()
);

create index fx_rates_currency_pair_idx on public.fx_rates (currency_pair);

alter table public.fx_rates enable row level security;

create policy "fx_rates_select_all"
  on public.fx_rates for select
  to authenticated, anon
  using (true);
