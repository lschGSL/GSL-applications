-- Multi-entity support for GSL group
-- Profiles can belong to one or more entities
-- Applications can be scoped to specific entities

-- Add entity column to profiles (nullable for backward compat)
alter table public.profiles
  add column entity text check (entity in ('gsl_fiduciaire', 'gsl_revision', 'both'))
  default null;

-- Add entity column to applications (nullable = available to all)
alter table public.applications
  add column entity text check (entity in ('gsl_fiduciaire', 'gsl_revision', 'both'))
  default null;

-- Update handle_new_user to include entity
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
