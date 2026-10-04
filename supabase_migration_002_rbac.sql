-- =====================================================================
-- Migration 002: Role-based access control + schema gaps found in audit
-- =====================================================================
-- Run this once against your Supabase project (SQL Editor, or `psql`
-- against the connection string) AFTER supabase_schema.sql has already
-- been applied. It is safe to re-run (uses IF EXISTS / IF NOT EXISTS
-- everywhere it can).
--
-- What this does and why:
--  1. Replaces the blanket "authenticated -> full access" RLS policies
--     (which made "admin" vs "field agent" vs "logged out" the *only*
--     real distinction the database enforced) with policies that check
--     app_metadata.role and, for field agents, ownership via agent_id.
--  2. Adds a couple of columns the frontend code already expects but the
--     original schema never defined (batches.agent_id for RLS scoping,
--     farmers.district for the Admin Portal's regional views, and
--     display_id columns used by the Agent App's human-readable
--     farmer/batch codes so they can be looked up without exposing or
--     depending on the raw uuid primary key).
--
-- Prerequisite: admin accounts must be created with
--   npx tsx scripts/create-admin.ts <email> <password> [name]
-- which sets app_metadata.role = "admin" on the auth user. Field agents
-- created via the Admin Portal already get app_metadata.role = "agent"
-- (see app/api/create-agent/route.ts).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Schema additions
-- ---------------------------------------------------------------------

alter table batches add column if not exists agent_id uuid references agents(id);
alter table farmers add column if not exists district text;
alter table farmers add column if not exists display_id text unique;
alter table batches add column if not exists display_id text unique;

-- Backfill batches.agent_id from the owning farmer, where possible.
update batches b
set agent_id = f.agent_id
from farmers f
where b.farmer_id = f.id
  and b.agent_id is null;

create index if not exists idx_batches_agent on batches(agent_id);
create index if not exists idx_farmers_display_id on farmers(display_id);
create index if not exists idx_batches_display_id on batches(display_id);

-- ---------------------------------------------------------------------
-- 2. Helper functions
-- ---------------------------------------------------------------------

-- True if the calling session's JWT carries app_metadata.role = "admin".
-- app_metadata can only be set with the service-role key (see
-- scripts/create-admin.ts and app/api/create-agent/route.ts), never by
-- the user themselves, so this is safe to use as an authorization check.
create or replace function is_admin() returns boolean as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$ language sql stable;

-- Resolves the agents.id row that belongs to the calling user, if any.
create or replace function current_agent_id() returns uuid as $$
  select id from agents where user_id = auth.uid() limit 1;
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------
-- 3. Drop the old blanket policies
-- ---------------------------------------------------------------------

drop policy if exists "Authenticated users full access" on roles_permissions;
drop policy if exists "Authenticated users full access" on agents;
drop policy if exists "Authenticated users full access" on assigned_areas;
drop policy if exists "Authenticated users full access" on tasks;
drop policy if exists "Authenticated users full access" on task_assignments;
drop policy if exists "Authenticated users full access" on farmers;
drop policy if exists "Authenticated users full access" on batches;
drop policy if exists "Authenticated users full access" on agent_locations;
drop policy if exists "Authenticated users full access" on visit_history;
drop policy if exists "Authenticated users full access" on notifications;
drop policy if exists "Authenticated users full access" on activity_logs;

-- ---------------------------------------------------------------------
-- 4. New role/ownership-scoped policies
-- ---------------------------------------------------------------------

-- roles_permissions: admin only.
create policy "admin_full_access" on roles_permissions for all
  to authenticated using (is_admin()) with check (is_admin());

-- agents: admins manage everyone; an agent may read/update their own row.
create policy "admin_full_access" on agents for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_self" on agents for select
  to authenticated using (user_id = auth.uid());
create policy "agent_update_self" on agents for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- assigned_areas: admins manage everyone; an agent sees only their own areas.
create policy "admin_full_access" on assigned_areas for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_areas" on assigned_areas for select
  to authenticated using (agent_id = current_agent_id());

-- tasks: admins manage everyone; an agent sees tasks assigned to them.
create policy "admin_full_access" on tasks for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_assigned_tasks" on tasks for select
  to authenticated using (
    exists (
      select 1 from task_assignments ta
      where ta.task_id = tasks.id and ta.agent_id = current_agent_id()
    )
  );

-- task_assignments: admins manage everyone; an agent sees/updates their own
-- assignments (e.g. marking a task complete), but cannot reassign it to
-- someone else or touch other agents' assignments.
create policy "admin_full_access" on task_assignments for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_assignments" on task_assignments for select
  to authenticated using (agent_id = current_agent_id());
create policy "agent_update_own_assignments" on task_assignments for update
  to authenticated using (agent_id = current_agent_id())
  with check (agent_id = current_agent_id());

-- farmers: admins manage everyone; an agent may create/read/update only the
-- farmers they registered.
create policy "admin_full_access" on farmers for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_farmers" on farmers for select
  to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_farmers" on farmers for insert
  to authenticated with check (agent_id = current_agent_id());
create policy "agent_update_own_farmers" on farmers for update
  to authenticated using (agent_id = current_agent_id())
  with check (agent_id = current_agent_id());

-- batches: admins manage everyone; an agent may create/read/update only the
-- batches they logged (scoped via the new batches.agent_id column).
create policy "admin_full_access" on batches for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_batches" on batches for select
  to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_batches" on batches for insert
  to authenticated with check (agent_id = current_agent_id());
create policy "agent_update_own_batches" on batches for update
  to authenticated using (agent_id = current_agent_id())
  with check (agent_id = current_agent_id());

-- agent_locations: admins read everyone (for live tracking); an agent may
-- only insert/read their own pings, never anyone else's location history.
create policy "admin_full_access" on agent_locations for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_locations" on agent_locations for select
  to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_locations" on agent_locations for insert
  to authenticated with check (agent_id = current_agent_id());

-- visit_history: same ownership shape as agent_locations.
create policy "admin_full_access" on visit_history for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "agent_read_own_visits" on visit_history for select
  to authenticated using (agent_id = current_agent_id());
create policy "agent_insert_own_visits" on visit_history for insert
  to authenticated with check (agent_id = current_agent_id());

-- notifications: admins manage everyone; a user reads/updates (marks read)
-- only their own notifications.
create policy "admin_full_access" on notifications for all
  to authenticated using (is_admin()) with check (is_admin());
create policy "user_read_own_notifications" on notifications for select
  to authenticated using (user_id = auth.uid());
create policy "user_update_own_notifications" on notifications for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- activity_logs: admins read everyone (audit trail); any authenticated user
-- may insert an entry attributed to themselves, but never read, update, or
-- delete other people's log entries, and can't rewrite history.
create policy "admin_read_all" on activity_logs for select
  to authenticated using (is_admin());
create policy "user_insert_own_activity" on activity_logs for insert
  to authenticated with check (user_id = auth.uid());
