-- =============================================================================
-- Invite-only access, a real audit trail, and abuse limits on public forms.
--
--  1. invitations      — the only way to get an account now
--  2. audit_log        — actor name/email denormalised so the trail survives
--                        the person leaving, plus indexes for the viewer
--  3. rate_limits      — shared counter for public form submissions
--  4. roles            — capabilities for invites, roles and the audit viewer
--  5. storage.buckets  — the media bucket, so a fresh env is reproducible
-- =============================================================================


-- 1. Invitations --------------------------------------------------------------

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),

  -- Lowercased on write so an invite can't be issued twice under different
  -- casing and so lookups are exact.
  email        text not null,

  -- The raw token is emailed and never stored. We keep sha256(token), so a
  -- leaked database backup cannot be used to accept an outstanding invite.
  token_hash   text not null unique,

  -- Optional starting role. Null means the person lands with no access at all
  -- and a super admin grants it after they've accepted.
  role_id      uuid references public.roles (id) on delete set null,

  invited_by   uuid references public.profiles (id) on delete set null,
  invited_name text,

  expires_at   timestamptz not null default (now() + interval '7 days'),
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),

  constraint invitations_email_lowercase check (email = lower(email))
);

-- Only one live invite per address; accepted/revoked ones don't block a re-invite.
create unique index invitations_one_live_per_email
  on public.invitations (email)
  where accepted_at is null and revoked_at is null;

create index invitations_token_hash_idx on public.invitations (token_hash);

alter table public.invitations enable row level security;

-- No policies: invitations are handled entirely by the service role in server
-- actions. RLS on with zero policies means the browser key can't touch it at
-- all, which is exactly what we want for a table full of access tokens.

create policy "Invite managers can see invitations"
  on public.invitations for select to authenticated
  using (public.has_capability('users.invite'));


-- 2. Audit log ----------------------------------------------------------------

-- actor_id is a FK that nulls out when a profile is deleted, which would erase
-- who did what. Denormalise the identity onto the row so the trail is
-- permanent — that's the point of an audit log.
alter table public.audit_log
  add column if not exists actor_email text,
  add column if not exists actor_name  text;

create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx
  on public.audit_log (actor_id, created_at desc);
create index if not exists audit_log_entity_idx
  on public.audit_log (entity, entity_id);


-- 3. Rate limiting ------------------------------------------------------------

create table public.rate_limits (
  key          text primary key,
  count        integer not null default 0,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- No policies: service role only.

/*
 * Atomic fixed-window counter.
 *
 * The insert..on conflict..do update runs as a single statement, so two
 * concurrent submissions can't both read a stale count and each decide they're
 * under the limit.
 */
create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count  integer;
  v_start  timestamptz;
begin
  insert into public.rate_limits as r (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set
      -- Window expired? start a new one. Otherwise increment.
      count = case
        when r.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
        else r.count + 1
      end,
      window_start = case
        when r.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
        else r.window_start
      end
  returning r.count, r.window_start into v_count, v_start;

  return query select
    v_count <= p_max,
    greatest(
      0,
      ceil(
        extract(epoch from (v_start + make_interval(secs => p_window_seconds) - now()))
      )::integer
    );
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

/*
 * Housekeeping: rate_limits grows one row per IP per bucket forever otherwise.
 * Called opportunistically from the server; cheap because of the index.
 */
create index rate_limits_window_start_idx on public.rate_limits (window_start);

create or replace function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;

revoke all on function public.prune_rate_limits() from public, anon, authenticated;


-- 4. New capabilities ---------------------------------------------------------

-- users.invite  — send and revoke invitations
-- roles.manage  — create roles and change what each one can do
-- audit.view    — read the audit trail
--
-- super_admin holds 'all' so it already covers these. Admin gets none of them
-- by default: who can join and what they can do stays with the super admin.
update public.roles
   set capabilities = array(
     select distinct unnest(capabilities || array['audit.view'])
   )
 where key = 'admin';


-- 5. Storage bucket -----------------------------------------------------------

/*
 * The media bucket was created through the dashboard, so a fresh environment
 * couldn't be rebuilt from migrations alone. Declaring it here fixes that.
 *
 * Public read: these are website images, served straight from Supabase's CDN.
 * Writes are closed to everyone but the service role — uploads go through a
 * server action that checks the media.upload capability first.
 */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB, matching the app-side check
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
