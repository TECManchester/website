-- Elevation Church Manchester — initial schema
--
-- Design notes:
--   * Two classes of table. CONTENT (events, sermons, groups) is world-readable
--     when published. SUBMISSIONS (prayer, contact, visits, newsletter) are
--     insert-only for the public and never readable by the anon key.
--   * No Supabase Auth yet — the public site ships first. Staff-facing reads go
--     through the secret key server-side. When auth arrives, add policies for
--     an authenticated `staff` role; nothing here has to be rewritten.
--   * Every table has RLS enabled. A table with RLS on and no permissive policy
--     denies everything by default, which is the behaviour we want for anything
--     pastoral or personal.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Shared
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- CONTENT — publicly readable when published
-- ============================================================================

create table public.sermon_series (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.sermons (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  speaker      text,
  series_id    uuid references public.sermon_series (id) on delete set null,
  -- YouTube video ID only, not a full URL — the embed builds the URL itself.
  youtube_id   text,
  description  text,
  preached_on  date,
  duration_mins integer check (duration_mins is null or duration_mins > 0),
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index sermons_published_preached_on_idx
  on public.sermons (preached_on desc)
  where is_published;

create index sermons_series_idx on public.sermons (series_id);

create table public.events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text,
  description  text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  venue        text,
  image_url    text,
  cta_label    text,
  cta_url      text,
  -- Drives the countdown treatment on the homepage.
  is_featured  boolean not null default false,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint events_ends_after_starts check (ends_at is null or ends_at >= starts_at)
);

create index events_published_starts_at_idx
  on public.events (starts_at)
  where is_published;

create table public.connect_groups (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  description           text,
  -- e.g. 'families', 'young-professionals', 'fitness', 'couples'
  category              text,
  -- Manchester area, e.g. 'Salford', 'City Centre', 'Online'
  area                  text,
  meeting_day           text,
  meeting_time          text,
  leader_name           text,
  is_accepting_members  boolean not null default true,
  is_published          boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index connect_groups_published_idx
  on public.connect_groups (area, category)
  where is_published;

-- Published content is readable by anyone, including the anon key.
create policy "Published series are public"
  on public.sermon_series for select using (true);

create policy "Published sermons are public"
  on public.sermons for select using (is_published);

create policy "Published events are public"
  on public.events for select using (is_published);

create policy "Published connect groups are public"
  on public.connect_groups for select using (is_published);

-- ============================================================================
-- SUBMISSIONS — public may INSERT, public may never SELECT
-- ============================================================================

create type public.submission_status as enum ('new', 'in_progress', 'done', 'archived');

create table public.prayer_requests (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text,
  phone       text,
  request     text not null,
  -- Opt-in for the request to be shared with the wider prayer team.
  share_with_team boolean not null default false,
  is_urgent   boolean not null default false,
  status      public.submission_status not null default 'new',
  created_at  timestamptz not null default now(),
  constraint prayer_requests_request_not_blank check (length(btrim(request)) > 0)
);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  status     public.submission_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint contact_messages_message_not_blank check (length(btrim(message)) > 0)
);

create table public.visit_plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  planned_date  date,
  adults        integer not null default 1 check (adults >= 0),
  children      integer not null default 0 check (children >= 0),
  -- Free text so parents can say "3 and 7" without us modelling a child table.
  children_ages text,
  notes         text,
  status        public.submission_status not null default 'new',
  created_at    timestamptz not null default now()
);

create table public.group_join_requests (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.connect_groups (id) on delete cascade,
  name       text not null,
  email      text not null,
  phone      text,
  message    text,
  status     public.submission_status not null default 'new',
  created_at timestamptz not null default now()
);

create index group_join_requests_group_idx on public.group_join_requests (group_id);

create table public.newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  name           text,
  -- Double opt-in: null until the confirmation link is followed.
  confirmed_at   timestamptz,
  unsubscribed_at timestamptz,
  created_at     timestamptz not null default now()
);

-- Anyone may submit. Note there is deliberately no SELECT policy on any of
-- these tables — prayer requests in particular must never be readable with the
-- publishable key. Staff reads go through the secret key, which bypasses RLS.
create policy "Anyone can submit a prayer request"
  on public.prayer_requests for insert with check (true);

create policy "Anyone can send a message"
  on public.contact_messages for insert with check (true);

create policy "Anyone can plan a visit"
  on public.visit_plans for insert with check (true);

create policy "Anyone can request to join a group"
  on public.group_join_requests for insert
  with check (
    exists (
      select 1 from public.connect_groups g
      where g.id = group_id and g.is_published and g.is_accepting_members
    )
  );

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert with check (true);

-- ============================================================================
-- RLS + triggers
-- ============================================================================

alter table public.sermon_series          enable row level security;
alter table public.sermons                enable row level security;
alter table public.events                 enable row level security;
alter table public.connect_groups         enable row level security;
alter table public.prayer_requests        enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.visit_plans            enable row level security;
alter table public.group_join_requests    enable row level security;
alter table public.newsletter_subscribers enable row level security;

create trigger sermon_series_updated_at
  before update on public.sermon_series
  for each row execute function public.set_updated_at();

create trigger sermons_updated_at
  before update on public.sermons
  for each row execute function public.set_updated_at();

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger connect_groups_updated_at
  before update on public.connect_groups
  for each row execute function public.set_updated_at();
