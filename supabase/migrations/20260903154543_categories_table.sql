-- Not in docs/05_Data_Model.md — added to support category management
-- (rename/add custom categories, docs/02_User_Flow.md Flow G), which has
-- no backing table in the original schema. subscriptions.category stays
-- free text (unchanged) and just needs to line up with a value here.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  value text not null,
  label text not null,
  color text not null default '#9CA3AF',
  created_at timestamptz not null default now(),
  unique (user_id, value)
);

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories_select_own"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories_update_own"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "categories_delete_own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Seed the 6 original defaults (docs/05_Data_Model.md's original
-- "enum-like" list) for every new signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);

  insert into public.categories (user_id, value, label, color) values
    (new.id, 'streaming', 'Streaming', '#3c87f7'),
    (new.id, 'saas', 'SaaS / Yazılım', '#10A37F'),
    (new.id, 'fitness', 'Spor / Sağlık', '#F97316'),
    (new.id, 'finance', 'Finans', '#8B5CF6'),
    (new.id, 'education', 'Eğitim', '#EAB308'),
    (new.id, 'other', 'Diğer', '#9CA3AF');

  return new;
end;
$$;

-- Backfill existing users, who won't get the trigger re-run for them.
insert into public.categories (user_id, value, label, color)
select p.id, c.value, c.label, c.color
from public.profiles p
cross join (
  values
    ('streaming', 'Streaming', '#3c87f7'),
    ('saas', 'SaaS / Yazılım', '#10A37F'),
    ('fitness', 'Spor / Sağlık', '#F97316'),
    ('finance', 'Finans', '#8B5CF6'),
    ('education', 'Eğitim', '#EAB308'),
    ('other', 'Diğer', '#9CA3AF')
) as c(value, label, color)
on conflict (user_id, value) do nothing;
