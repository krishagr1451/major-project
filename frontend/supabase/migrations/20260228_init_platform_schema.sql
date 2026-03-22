create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_datasets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  source text not null default 'csv_upload',
  file_path text,
  data jsonb,
  row_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backtests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dataset_id uuid references public.stock_datasets(id) on delete set null,
  symbol text not null,
  strategy text not null,
  parameters jsonb not null default '{}'::jsonb,
  start_date date,
  end_date date,
  initial_capital numeric,
  commission numeric,
  stats jsonb not null default '{}'::jsonb,
  equity_curve jsonb not null default '[]'::jsonb,
  trades jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  condition_type text not null,
  condition_value text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  holdings jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stock_datasets_user_created on public.stock_datasets(user_id, created_at desc);
create index if not exists idx_backtests_user_created on public.backtests(user_id, created_at desc);
create index if not exists idx_strategies_user_created on public.strategies(user_id, created_at desc);
create index if not exists idx_alerts_user_created on public.alerts(user_id, created_at desc);
create index if not exists idx_portfolios_user_created on public.portfolios(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.stock_datasets enable row level security;
alter table public.backtests enable row level security;
alter table public.strategies enable row level security;
alter table public.alerts enable row level security;
alter table public.portfolios enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (auth.uid() = user_id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (auth.uid() = user_id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists stock_datasets_select_own on public.stock_datasets;
create policy stock_datasets_select_own on public.stock_datasets
for select using (auth.uid() = user_id);
drop policy if exists stock_datasets_insert_own on public.stock_datasets;
create policy stock_datasets_insert_own on public.stock_datasets
for insert with check (auth.uid() = user_id);
drop policy if exists stock_datasets_update_own on public.stock_datasets;
create policy stock_datasets_update_own on public.stock_datasets
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists stock_datasets_delete_own on public.stock_datasets;
create policy stock_datasets_delete_own on public.stock_datasets
for delete using (auth.uid() = user_id);

drop policy if exists backtests_select_own on public.backtests;
create policy backtests_select_own on public.backtests
for select using (auth.uid() = user_id);
drop policy if exists backtests_insert_own on public.backtests;
create policy backtests_insert_own on public.backtests
for insert with check (auth.uid() = user_id);
drop policy if exists backtests_update_own on public.backtests;
create policy backtests_update_own on public.backtests
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists backtests_delete_own on public.backtests;
create policy backtests_delete_own on public.backtests
for delete using (auth.uid() = user_id);

drop policy if exists strategies_select_own on public.strategies;
create policy strategies_select_own on public.strategies
for select using (auth.uid() = user_id);
drop policy if exists strategies_insert_own on public.strategies;
create policy strategies_insert_own on public.strategies
for insert with check (auth.uid() = user_id);
drop policy if exists strategies_update_own on public.strategies;
create policy strategies_update_own on public.strategies
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists strategies_delete_own on public.strategies;
create policy strategies_delete_own on public.strategies
for delete using (auth.uid() = user_id);

drop policy if exists alerts_select_own on public.alerts;
create policy alerts_select_own on public.alerts
for select using (auth.uid() = user_id);
drop policy if exists alerts_insert_own on public.alerts;
create policy alerts_insert_own on public.alerts
for insert with check (auth.uid() = user_id);
drop policy if exists alerts_update_own on public.alerts;
create policy alerts_update_own on public.alerts
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists alerts_delete_own on public.alerts;
create policy alerts_delete_own on public.alerts
for delete using (auth.uid() = user_id);

drop policy if exists portfolios_select_own on public.portfolios;
create policy portfolios_select_own on public.portfolios
for select using (auth.uid() = user_id);
drop policy if exists portfolios_insert_own on public.portfolios;
create policy portfolios_insert_own on public.portfolios
for insert with check (auth.uid() = user_id);
drop policy if exists portfolios_update_own on public.portfolios;
create policy portfolios_update_own on public.portfolios
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists portfolios_delete_own on public.portfolios;
create policy portfolios_delete_own on public.portfolios
for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
select 'market-data', 'market-data', false
where not exists (
  select 1 from storage.buckets where id = 'market-data'
);

drop policy if exists market_data_read_own on storage.objects;
create policy market_data_read_own on storage.objects
for select to authenticated
using (
  bucket_id = 'market-data' and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists market_data_write_own on storage.objects;
create policy market_data_write_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'market-data' and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists market_data_update_own on storage.objects;
create policy market_data_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'market-data' and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'market-data' and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists market_data_delete_own on storage.objects;
create policy market_data_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'market-data' and split_part(name, '/', 1) = auth.uid()::text
);