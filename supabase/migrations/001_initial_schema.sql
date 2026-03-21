-- GSL Portal - Initial Database Schema
-- =============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'manager', 'member', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    or auth.uid() = id  -- Allow self-insert on registration
  );

-- =============================================
-- APPLICATIONS
-- =============================================
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  url text not null,
  icon_url text,
  visibility text not null default 'internal' check (visibility in ('internal', 'external', 'both')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications enable row level security;

create policy "Authenticated users can view active applications"
  on public.applications for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage applications"
  on public.applications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- =============================================
-- APP ACCESS (per-user, per-application)
-- =============================================
create table public.app_access (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  app_id uuid not null references public.applications(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, app_id)
);

alter table public.app_access enable row level security;

create policy "Users can view own access"
  on public.app_access for select
  using (auth.uid() = user_id);

create policy "Admins can view all access"
  on public.app_access for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "Admins can manage access"
  on public.app_access for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- =============================================
-- AUDIT LOG
-- =============================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (true);

-- Index for fast querying
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_action on public.audit_logs(action);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row execute procedure public.update_updated_at();

-- Helper function to check user role
create or replace function public.get_user_role(user_id uuid)
returns text as $$
  select role from public.profiles where id = user_id;
$$ language sql security definer;

-- Helper function to check app access
create or replace function public.user_has_app_access(p_user_id uuid, p_app_slug text)
returns boolean as $$
  select exists (
    select 1 from public.app_access aa
    join public.applications a on a.id = aa.app_id
    where aa.user_id = p_user_id
    and a.slug = p_app_slug
    and a.is_active = true
  )
  or exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  );
$$ language sql security definer;
