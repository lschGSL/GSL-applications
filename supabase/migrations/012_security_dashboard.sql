-- GSL Portal - Security Dashboard
-- =============================================
-- Adds security_events, active_sessions, and extends
-- applications with security monitoring columns.

-- =============================================
-- SECURITY EVENTS (centralized security feed)
-- =============================================
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'failed_auth',
    'suspicious_access',
    'admin_action',
    'app_error',
    'bulk_export',
    'new_device',
    'session_expired',
    'role_change'
  )),
  user_id uuid references auth.users(id) on delete set null,
  app_id uuid references public.applications(id) on delete set null,
  ip_address inet,
  user_agent text,
  geo_location jsonb,
  severity text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  title text,
  description text,
  metadata jsonb,
  resolved boolean not null default false,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.security_events enable row level security;

create policy "Admins can view all security events"
  on public.security_events for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "Admins can update security events"
  on public.security_events for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert security events"
  on public.security_events for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index if not exists idx_security_events_created_at
  on public.security_events (created_at desc);
create index if not exists idx_security_events_severity
  on public.security_events (severity, created_at desc);
create index if not exists idx_security_events_type
  on public.security_events (event_type, created_at desc);
create index if not exists idx_security_events_user
  on public.security_events (user_id, created_at desc);
create index if not exists idx_security_events_unresolved
  on public.security_events (resolved, created_at desc) where resolved = false;

-- =============================================
-- ACTIVE SESSIONS (live monitoring)
-- =============================================
create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_slug text,
  session_token_hash text,
  ip_address inet,
  user_agent text,
  geo_location jsonb,
  started_at timestamptz not null default now(),
  last_activity timestamptz not null default now(),
  terminated_at timestamptz,
  unique (user_id, app_slug)
);

alter table public.active_sessions enable row level security;

create policy "Admins can view all active sessions"
  on public.active_sessions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "Users can view own active sessions"
  on public.active_sessions for select
  using (auth.uid() = user_id);

create policy "Admins can manage active sessions"
  on public.active_sessions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index if not exists idx_active_sessions_user_activity
  on public.active_sessions (user_id, last_activity desc);
create index if not exists idx_active_sessions_app
  on public.active_sessions (app_slug, last_activity desc);
create index if not exists idx_active_sessions_live
  on public.active_sessions (last_activity desc)
  where terminated_at is null;

-- =============================================
-- APPLICATIONS SECURITY EXTENSIONS
-- =============================================
alter table public.applications
  add column if not exists last_security_scan timestamptz;

alter table public.applications
  add column if not exists security_status text default 'unknown';

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'applications_security_status_check'
      and table_name = 'applications'
  ) then
    alter table public.applications
      add constraint applications_security_status_check
      check (security_status in ('protected', 'public', 'misconfigured', 'unknown'));
  end if;
end $$;

alter table public.applications
  add column if not exists health_check_url text;

-- =============================================
-- HELPER FUNCTION: cleanup stale sessions
-- =============================================
create or replace function public.cleanup_stale_sessions()
returns void
language plpgsql
security definer
as $$
begin
  update public.active_sessions
  set terminated_at = now()
  where terminated_at is null
    and last_activity < now() - interval '30 minutes';
end;
$$;
