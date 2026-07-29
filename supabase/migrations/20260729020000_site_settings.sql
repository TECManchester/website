-- Site settings: the single source of truth for details that change —
-- address, service time, contact, socials, giving, homepage banner.
--
-- Key/value with jsonb groups. No seed rows: the app falls back to its
-- compiled defaults per group, so a missing row can never break the site, and
-- the first admin save simply starts overriding.

create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.site_settings enable row level security;

-- The public site reads these to render every page.
create policy "Settings are readable by everyone"
  on public.site_settings for select to anon, authenticated using (true);
