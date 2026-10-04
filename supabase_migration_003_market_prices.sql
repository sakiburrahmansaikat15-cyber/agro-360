-- =====================================================================
-- Migration 003: Real market price data (replaces fabricated numbers)
-- =====================================================================
-- Run this once against your Supabase project (SQL Editor) after
-- migration 002. Requires is_admin() from migration 002 to already exist.
--
-- Why: the Inventory page's price-deviation chart
-- (components/dashboard/PriceDeviationChart.tsx) had no real price data to
-- read anywhere in the schema — batches records quantity, never price — so
-- it synthesized "current market price" from a formula
-- (defaultMrp + arbitrary offsets) while labeling itself "Supabase Live
-- Stream". This migration adds a real table for it to read/write instead.
-- =====================================================================

create table if not exists market_prices (
  id uuid primary key default uuid_generate_v4(),
  crop text not null,
  division text,
  district text,
  mrp numeric not null,
  current_price numeric not null,
  recorded_by uuid references auth.users,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_market_prices_crop_time on market_prices(crop, recorded_at desc);

alter table market_prices enable row level security;

drop policy if exists "authenticated_read_prices" on market_prices;
drop policy if exists "admin_write_prices" on market_prices;
drop policy if exists "admin_update_prices" on market_prices;
drop policy if exists "admin_delete_prices" on market_prices;

create policy "authenticated_read_prices" on market_prices for select to authenticated using (true);
create policy "admin_write_prices" on market_prices for insert to authenticated with check (is_admin());
create policy "admin_update_prices" on market_prices for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin_delete_prices" on market_prices for delete to authenticated using (is_admin());
