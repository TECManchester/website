-- Some events are announced with a date before a start time is settled.
--
-- starts_at stays NOT NULL because ordering and the calendar depend on it —
-- it carries the date, anchored at midday London so it can't drift across a
-- day boundary through BST. This flag tells the UI not to render the time
-- component, so the site says "time to be confirmed" rather than publishing a
-- start time nobody agreed to.
alter table public.events
  add column time_tbc boolean not null default false;

comment on column public.events.time_tbc is
  'When true the UI shows "Time to be confirmed" instead of the time in starts_at.';
