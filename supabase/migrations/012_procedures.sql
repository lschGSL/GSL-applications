-- Migration 012: Procedures module
-- Internal procedures library accessible to all authenticated employees,
-- with admin back-office for create/edit/publish.

-- Ensure trigger function exists (idempotent)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.procedures (
  id          uuid primary key default gen_random_uuid(),
  number      text not null,
  slug        text not null unique,
  title       text not null,
  category    text not null check (category in ('portal','rh','it','comptabilite','audit')),
  summary     text,
  content     text not null default '',
  version     text not null default '1.0',
  owner       text,
  status      text not null default 'draft' check (status in ('draft','published','archived')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index procedures_fts on public.procedures using gin(
  to_tsvector('french', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,''))
);

create trigger procedures_updated_at
  before update on public.procedures
  for each row execute function public.handle_updated_at();

alter table public.procedures enable row level security;

create policy "Employees can read published procedures"
  on public.procedures for select
  using (auth.role() = 'authenticated' and status = 'published');

create policy "Admins can manage procedures"
  on public.procedures for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
