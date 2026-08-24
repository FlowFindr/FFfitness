-- FlowFindr Fitness: accounts and sync.
-- Mirrors the three localStorage keys: fff:settings, fff:logs, fff:custom.
-- localStorage stays the source of truth; these tables are the background mirror.

create extension if not exists pgcrypto;

-- updated_at maintenance ------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles: one row per user, mirrors fff:settings ----------------------------

create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  plan         text        not null default 'free',
  settings     jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_plan_check check (plan in ('free', 'pro'))
);

alter table public.profiles enable row level security;

create policy "profiles are private to their owner"
  on public.profiles for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- workouts: one row per user per day, mirrors fff:logs -------------------------
-- logs is { "2026-08-24": { sessionId, name, entries, elapsed } }, so the date
-- key becomes a column and the value spreads across the rest.

create table public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  date       date        not null,
  session_id text,
  name       text,
  entries    jsonb       not null default '[]'::jsonb,
  elapsed    integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.workouts enable row level security;

create policy "workouts are private to their owner"
  on public.workouts for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index workouts_user_date_idx on public.workouts (user_id, date desc);

create trigger workouts_touch_updated_at
  before update on public.workouts
  for each row execute function public.touch_updated_at();

-- plans: one row per user per customised template, mirrors fff:custom ----------

create table public.plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null,
  data       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.plans enable row level security;

create policy "plans are private to their owner"
  on public.plans for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger plans_touch_updated_at
  before update on public.plans
  for each row execute function public.touch_updated_at();

-- profile creation on sign-up -------------------------------------------------
-- No admin in the loop: the profile row exists the moment the account does.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
