-- Gift Aid declarations
--
-- HMRC requirements this table exists to satisfy:
--   * Donor's FULL forename — initials are not accepted.
--   * Donor's HOME address. Work or "c/o" addresses are not valid. HMRC will
--     accept, as a minimum, house name/number plus full postcode.
--   * A record of which declaration wording the donor agreed to, and when.
--   * Whether the declaration covers past, present or future donations.
--
-- Retention: enduring declarations ("all future donations") must be kept
-- permanently, or at least 6 years after the donor cancels or stops giving.
-- Nothing here should be deleted on a schedule — see cancelled_at instead.
--
-- Privacy: this is name + home address, i.e. personal data under UK GDPR.
-- Same RLS shape as the other submission tables — public INSERT, and no SELECT
-- policy at all, so it can never be read with the publishable key.

create table public.gift_aid_declarations (
  id            uuid primary key default gen_random_uuid(),

  title         text,
  -- HMRC: full forename, not an initial. Enforced in the app with a clearer
  -- message; the length check is a backstop.
  first_name    text not null,
  last_name     text not null,

  -- Home address. address_line1 must carry the house name or number.
  address_line1 text not null,
  address_line2 text,
  city          text,
  postcode      text not null,

  -- Optional, for confirming the declaration and contacting the donor about
  -- changes. Not an HMRC requirement.
  email         text,
  phone         text,

  -- The donor ticked the declaration box. A row without this is not a valid
  -- declaration, so it must be true.
  declaration_accepted boolean not null default false,
  -- HMRC model wording covers "from the date of this declaration and in the
  -- past four years"; recorded explicitly so a future wording change doesn't
  -- retroactively change what past donors agreed to.
  covers_past_four_years boolean not null default true,
  covers_future_donations boolean not null default true,

  -- Verbatim wording the donor agreed to, and its version. Essential for an
  -- HMRC audit: proves what was on screen at the time.
  declaration_text     text not null,
  declaration_version  text not null,

  declared_at   timestamptz not null default now(),
  -- Set when the donor cancels. Never hard-delete the row.
  cancelled_at  timestamptz,

  created_at    timestamptz not null default now(),

  constraint gift_aid_declaration_must_be_accepted
    check (declaration_accepted),
  constraint gift_aid_first_name_not_initial
    check (length(btrim(first_name)) >= 2),
  constraint gift_aid_last_name_present
    check (length(btrim(last_name)) >= 2),
  constraint gift_aid_address_present
    check (length(btrim(address_line1)) > 0),
  constraint gift_aid_postcode_present
    check (length(btrim(postcode)) >= 5)
);

create index gift_aid_declarations_active_idx
  on public.gift_aid_declarations (declared_at desc)
  where cancelled_at is null;

-- Finding a donor's declaration when reconciling a donation.
create index gift_aid_declarations_name_postcode_idx
  on public.gift_aid_declarations (lower(last_name), upper(postcode));

alter table public.gift_aid_declarations enable row level security;

create policy "Anyone can submit a Gift Aid declaration"
  on public.gift_aid_declarations for insert with check (true);

-- Deliberately no SELECT, UPDATE or DELETE policy. Staff access goes through
-- the secret key server-side.
