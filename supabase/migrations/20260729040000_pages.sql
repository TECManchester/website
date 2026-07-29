-- The page builder: pages are ordered lists of typed blocks.
--
-- Draft/published are separate jsonb copies per block. Saving writes draft;
-- publishing copies draft over published. The public site renders published
-- only, so half-finished edits can never leak.

create table public.pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  status       text not null default 'draft' check (status in ('draft','published')),
  -- Code-owned routes listed in the admin but not editable/deletable there.
  is_system    boolean not null default false,
  created_by   uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

create table public.blocks (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages (id) on delete cascade,
  sort       integer not null default 0,
  type       text not null,
  draft      jsonb not null default '{}',
  published  jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blocks_page_sort_idx on public.blocks (page_id, sort);

create trigger blocks_updated_at
  before update on public.blocks
  for each row execute function public.set_updated_at();

-- Snapshots of a page's draft blocks, for undo.
create table public.page_revisions (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages (id) on delete cascade,
  snapshot   jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index page_revisions_page_idx
  on public.page_revisions (page_id, created_at desc);

-- Renaming a published page records where the old URL should go.
create table public.redirects (
  from_slug  text primary key,
  to_slug    text not null,
  created_at timestamptz not null default now()
);

alter table public.pages          enable row level security;
alter table public.blocks         enable row level security;
alter table public.page_revisions enable row level security;
alter table public.redirects      enable row level security;

create policy "Published pages are public"
  on public.pages for select to anon, authenticated
  using (status = 'published');

create policy "Blocks of published pages are public"
  on public.blocks for select to anon, authenticated
  using (
    published is not null
    and exists (
      select 1 from public.pages p
      where p.id = page_id and p.status = 'published'
    )
  );

create policy "Redirects are public"
  on public.redirects for select to anon, authenticated using (true);

create policy "Page editors see all pages"
  on public.pages for select to authenticated
  using (public.has_capability('pages.view'));

create policy "Page editors see all blocks"
  on public.blocks for select to authenticated
  using (public.has_capability('pages.view'));

create policy "Page editors see revisions"
  on public.page_revisions for select to authenticated
  using (public.has_capability('pages.view'));
