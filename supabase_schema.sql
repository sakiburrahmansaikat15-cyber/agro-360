-- Drop tables if they exist (in reverse dependency order)
drop table if exists activity_logs;
drop table if exists market_prices;
drop table if exists notifications;
drop table if exists visit_history;
drop table if exists agent_locations;
drop table if exists task_assignments;
drop table if exists tasks;
drop table if exists assigned_areas;
drop table if exists roles_permissions;
drop table if exists batches;
drop table if exists farmers;
drop table if exists agents;

-- Create Roles table
create table roles_permissions (
  id uuid primary key default uuid_generate_v4(),
  role_name text not null unique,
  permissions jsonb default '{}'::jsonb
);

-- Create Agents table
create table agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  phone text not null,
  role_id uuid references roles_permissions(id),
  status text default 'ACTIVE',
  last_active_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Assigned Areas table
create table assigned_areas (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id) on delete cascade,
  division text,
  district text,
  upazila text,
  union_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(agent_id, division, district, upazila, union_name)
);

-- Create Tasks table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  priority text default 'MEDIUM',
  due_date timestamp with time zone,
  assigned_area_id uuid references assigned_areas(id),
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Task Assignments table
create table task_assignments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  agent_id uuid references agents(id) on delete cascade,
  status text default 'PENDING',
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(task_id, agent_id)
);

-- Create Farmers table (updated)
-- Note: unquoted mixed-case identifiers below (landDecimal, hasWallet, ...)
-- are folded to lowercase by Postgres (landdecimal, haswallet, ...) — this
-- is intentional/kept as-is for backward compatibility with existing rows;
-- application code reads the lowercase form.
create table farmers (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id),
  task_assignment_id uuid references task_assignments(id),
  name text not null,
  phone text,
  village text,
  union_name text,
  district text,
  landDecimal numeric,
  crop text,
  hasWallet boolean default false,
  status text default 'PENDING_APPROVAL',
  photos text[] default '{}',
  documents text[] default '{}',
  registeredDaysAgo integer,
  -- Human-readable code (e.g. AT360-FARM-0231) shown to agents/printed on
  -- QR stickers. Kept separate from the uuid primary key so the primary
  -- key never has to be guessed/generated client-side (see Agent App
  -- farmer/new.tsx) while still giving field staff a short reference code.
  display_id text unique,
  synced_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Batches table
create table batches (
  id uuid primary key default uuid_generate_v4(),
  farmer_id uuid references farmers(id),
  agent_id uuid references agents(id),
  farmerName text,
  crop text not null,
  quantityKg numeric not null,
  harvestDate text,
  inputs jsonb,
  createdDaysAgo integer,
  display_id text unique,
  synced_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create GPS Tracking / Agent Locations table
create table agent_locations (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id) on delete cascade,
  latitude numeric not null,
  longitude numeric not null,
  accuracy numeric,
  recorded_at timestamp with time zone not null,
  synced_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Visit History table
create table visit_history (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id) on delete cascade,
  location_name text,
  latitude numeric,
  longitude numeric,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Notifications table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  message text,
  read_status boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Activity Logs table
create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Market Prices table
-- Real government reference price (MRP) vs. observed market price per
-- crop/district, entered by admins. Added because the Inventory page's
-- price-deviation chart previously had no real price data to read at all —
-- batches only record quantity, never price — so it synthesized numbers
-- from a formula and displayed them under a "Supabase Live Stream" badge.
create table market_prices (
  id uuid primary key default uuid_generate_v4(),
  crop text not null,
  division text,
  district text,
  mrp numeric not null,
  current_price numeric not null,
  recorded_by uuid references auth.users,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- High Performance Composite Indexes
create index if not exists idx_agent_locations_agent_time on agent_locations(agent_id, recorded_at desc);
create index if not exists idx_farmers_agent_synced on farmers(agent_id, synced_at desc);
create index if not exists idx_batches_synced_crop on batches(synced_at desc, crop);
create index if not exists idx_task_assignments_agent on task_assignments(agent_id, status);
create index if not exists idx_assigned_areas_geo on assigned_areas(division, district, upazila);
create index if not exists idx_market_prices_crop_time on market_prices(crop, recorded_at desc);

-- Enable RLS for all new tables
alter table roles_permissions enable row level security;
alter table agents enable row level security;
alter table assigned_areas enable row level security;
alter table tasks enable row level security;
alter table task_assignments enable row level security;
alter table farmers enable row level security;
alter table batches enable row level security;
alter table agent_locations enable row level security;
alter table visit_history enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;
alter table market_prices enable row level security;

-- Granular Row Level Security (RLS) Policies — role/ownership scoped.
-- NOTE: for existing deployments created before this file was updated, use
-- supabase_migration_002_rbac.sql instead of re-running this whole file.
-- See that file for full commentary on is_admin()/current_agent_id().

create or replace function is_admin() returns boolean as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$ language sql stable;

create or replace function current_agent_id() returns uuid as $$
  select id from agents where user_id = auth.uid() limit 1;
$$ language sql stable security definer set search_path = public;

create policy "admin_full_access" on roles_permissions for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin_full_access" on agents for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_self" on agents for select to authenticated using (user_id = auth.uid());
create policy "agent_update_self" on agents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin_full_access" on assigned_areas for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_areas" on assigned_areas for select to authenticated using (agent_id = current_agent_id());

create policy "admin_full_access" on tasks for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_assigned_tasks" on tasks for select to authenticated using (
  exists (select 1 from task_assignments ta where ta.task_id = tasks.id and ta.agent_id = current_agent_id())
);

create policy "admin_full_access" on task_assignments for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_assignments" on task_assignments for select to authenticated using (agent_id = current_agent_id());
create policy "agent_update_own_assignments" on task_assignments for update to authenticated using (agent_id = current_agent_id()) with check (agent_id = current_agent_id());

create policy "admin_full_access" on farmers for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_farmers" on farmers for select to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_farmers" on farmers for insert to authenticated with check (agent_id = current_agent_id());
create policy "agent_update_own_farmers" on farmers for update to authenticated using (agent_id = current_agent_id()) with check (agent_id = current_agent_id());

create policy "admin_full_access" on batches for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_batches" on batches for select to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_batches" on batches for insert to authenticated with check (agent_id = current_agent_id());
create policy "agent_update_own_batches" on batches for update to authenticated using (agent_id = current_agent_id()) with check (agent_id = current_agent_id());

create policy "admin_full_access" on agent_locations for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_locations" on agent_locations for select to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_locations" on agent_locations for insert to authenticated with check (agent_id = current_agent_id());

create policy "admin_full_access" on visit_history for all to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_visits" on visit_history for select to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_visits" on visit_history for insert to authenticated with check (agent_id = current_agent_id());

create policy "admin_full_access" on notifications for all to authenticated using (is_admin()) with check (is_admin());
create policy "user_read_own_notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "user_update_own_notifications" on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin_read_all" on activity_logs for select to authenticated using (is_admin());
create policy "user_insert_own_activity" on activity_logs for insert to authenticated with check (user_id = auth.uid());

-- market_prices: any authenticated user (admin or field agent) can read
-- current reference/market prices; only admins can add or edit entries.
create policy "authenticated_read_prices" on market_prices for select to authenticated using (true);
create policy "admin_write_prices" on market_prices for insert to authenticated with check (is_admin());
create policy "admin_update_prices" on market_prices for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin_delete_prices" on market_prices for delete to authenticated using (is_admin());

