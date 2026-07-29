-- Media library. Files live in the public 'media' storage bucket (created via
-- the storage API — buckets aren't schema); this table is the catalogue:
-- alt text, dimensions, and who uploaded what.
--
-- Uploads/deletes go through server actions with the service key after a
-- capability check, so RLS here only needs to cover reads.

create table public.media (
  id         uuid primary key default gen_random_uuid(),
  path       text not null unique,
  url        text not null,
  alt        text not null,
  width      integer,
  height     integer,
  bytes      integer,
  mime       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "Media viewers can list media"
  on public.media for select to authenticated
  using (public.has_capability('media.view'));
