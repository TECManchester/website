-- Announcement popups: one active at a time, shown site-wide until dismissed,
-- re-shown after dismiss_hours.

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  image_url     text,
  cta_label     text,
  cta_url       text,
  is_active     boolean not null default false,
  starts_at     timestamptz,
  ends_at       timestamptz,
  dismiss_hours integer not null default 24
    check (dismiss_hours between 1 and 720),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint announcements_window check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

-- The public site only ever needs the active one; the window filter is
-- applied in the query.
create policy "Active announcements are public"
  on public.announcements for select to anon, authenticated
  using (is_active);
