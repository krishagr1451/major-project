-- Run this in Supabase SQL editor

create extension if not exists pgcrypto;

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  name text,
  exchange text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists watchlists_user_symbol_uidx
  on public.watchlists(user_id, symbol);

alter table public.watchlists enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'watchlists' and policyname = 'watchlists_select_own'
  ) then
    create policy watchlists_select_own
      on public.watchlists
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'watchlists' and policyname = 'watchlists_insert_own'
  ) then
    create policy watchlists_insert_own
      on public.watchlists
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'watchlists' and policyname = 'watchlists_update_own'
  ) then
    create policy watchlists_update_own
      on public.watchlists
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'watchlists' and policyname = 'watchlists_delete_own'
  ) then
    create policy watchlists_delete_own
      on public.watchlists
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Ensure portfolios has metadata and timestamp columns used by sync endpoints
alter table public.portfolios add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.portfolios add column if not exists updated_at timestamptz not null default now();
alter table public.portfolios add column if not exists created_at timestamptz not null default now();

-- Ensure backtests stores realism params if you want to query these later
alter table public.backtests add column if not exists parameters jsonb;
alter table public.backtests add column if not exists updated_at timestamptz not null default now();
