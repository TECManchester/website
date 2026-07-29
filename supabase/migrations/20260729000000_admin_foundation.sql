-- Admin foundation: roles, profiles, audit log.
--
-- Design:
--   * Anyone may sign up; a new auth user gets a `pending` profile via trigger
--     and can see nothing until a super admin approves them AND assigns a role.
--   * Capabilities are granular strings; roles are named bundles of them.
--     'all' is the super-admin wildcard.
--   * RLS calls has_capability(), a SECURITY DEFINER function owned by
--     postgres — it bypasses RLS internally, which is what prevents the
--     profiles-policy-queries-profiles recursion.
--   * communications@elevationmanchester.org is seeded approved/super_admin by
--     the trigger itself, so it holds no matter how that auth user is created.

-- ============================================================================
-- Roles
-- ============================================================================

create table public.roles (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  name         text not null,
  description  text,
  capabilities text[] not null default '{}',
  -- Predefined roles can't be deleted from the UI.
  is_system    boolean not null default true,
  created_at   timestamptz not null default now()
);

insert into public.roles (key, name, description, capabilities) values
  ('super_admin', 'Super admin',
   'Everything, including user approval and the sensitive submission inboxes.',
   array['all']),
  ('admin', 'Admin',
   'All content, settings, announcements and contact messages. No prayer, Gift Aid or user management.',
   array['pages.view','pages.create','pages.edit','pages.delete','pages.publish',
         'events.view','events.manage',
         'media.view','media.upload','media.delete',
         'settings.edit','announcements.manage',
         'submissions.contact.view']),
  ('editor', 'Editor',
   'Pages, media and events. No settings, no submissions.',
   array['pages.view','pages.create','pages.edit','pages.publish',
         'events.view','events.manage',
         'media.view','media.upload']),
  ('events_manager', 'Events manager',
   'Events and the media library only.',
   array['events.view','events.manage','media.view','media.upload']),
  ('pastoral', 'Pastoral',
   'Prayer requests only. No content access.',
   array['submissions.prayer.view']),
  ('finance', 'Finance',
   'Gift Aid declarations only. No content access.',
   array['submissions.giftaid.view']);

-- ============================================================================
-- Profiles
-- ============================================================================

create type public.profile_status as enum
  ('pending', 'approved', 'rejected', 'suspended');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  status      public.profile_status not null default 'pending',
  role_id     uuid references public.roles (id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user gets a profile. The seeded super admin is matched by
-- email so the guarantee survives however the account gets created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role   uuid;
  v_status public.profile_status := 'pending';
begin
  if lower(new.email) = 'communications@elevationmanchester.org' then
    select id into v_role from public.roles where key = 'super_admin';
    v_status := 'approved';
  end if;

  insert into public.profiles (id, email, full_name, status, role_id, approved_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    v_status,
    v_role,
    case when v_status = 'approved' then now() end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Capability helpers (used by RLS and by app code)
-- ============================================================================

create or replace function public.current_capabilities()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select r.capabilities
     from public.profiles p
     join public.roles r on r.id = p.role_id
     where p.id = auth.uid()
       and p.status = 'approved'),
    '{}'
  );
$$;

create or replace function public.has_capability(cap text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    'all' = any (public.current_capabilities())
    or cap = any (public.current_capabilities()),
    false
  );
$$;

grant execute on function public.current_capabilities() to authenticated, anon;
grant execute on function public.has_capability(text) to authenticated, anon;

-- ============================================================================
-- Audit log — service-key writes only; readable by user managers
-- ============================================================================

create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  text,
  detail     jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.roles     enable row level security;
alter table public.profiles  enable row level security;
alter table public.audit_log enable row level security;

-- Role names/descriptions are needed to render the approval UI; they contain
-- nothing sensitive.
create policy "Authenticated users can read roles"
  on public.roles for select to authenticated using (true);

-- A user can always see their own profile (the pending screen needs it)…
create policy "Users see their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- …and approvers see and manage everyone.
create policy "Approvers see all profiles"
  on public.profiles for select to authenticated
  using (public.has_capability('users.approve'));

create policy "Approvers update profiles"
  on public.profiles for update to authenticated
  using (public.has_capability('users.approve'))
  with check (public.has_capability('users.approve'));

create policy "User managers read the audit log"
  on public.audit_log for select to authenticated
  using (public.has_capability('users.manage'));
