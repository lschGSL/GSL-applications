-- Invitations system
-- Admins can invite users with a predefined role and entity

create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role text not null default 'member' check (role in ('admin', 'manager', 'member', 'viewer')),
  entity text check (entity in ('gsl_fiduciaire', 'gsl_revision', 'both')),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy "Admins can view invitations"
  on public.invitations for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

create policy "Admins can manage invitations"
  on public.invitations for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Allow unauthenticated access for token validation (via service role)
create policy "Anyone can read by token"
  on public.invitations for select
  using (true);

create index idx_invitations_token on public.invitations(token);
create index idx_invitations_email on public.invitations(email);
