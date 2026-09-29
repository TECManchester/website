# Elevation Church Manchester — WordPress redesign

Date: 2026-09-28 (revision 3: Phase 0 findings from the live backup; revision 4, 2026-09-29: messages come straight from the YouTube channel, §16; revision 5, 2026-09-29: forms, groups and announcements as built, §17)
Status: revised, awaiting spec review

## 1. Goal

Rebuild the local WordPress copy of elevationmanchester.org so it looks and behaves like the
Next.js redesign in `~/Projects.nosync/website` (reference commit `e0cf43e`, clean tree), then
replace the live site with it in a single migration.

Success means:

- Every public page of the redesign exists in WordPress and matches it visually, side by side at
  desktop (1440px) and mobile (390px) widths, with matching data (§12).
- Church staff can edit pages, events, connect groups and announcements as **Editors**,
  and settings and menus as **Site Managers** (§7), in standard WordPress admin. No page builder is
  used. Changing a block's *behaviour* still needs a developer (§3, "Developer dependency").
- The environment is reproducible: pinned core, plugin and image versions, and one command from
  empty to finished site, until the seed cut-off (§9).
- Every URL that exists on live today keeps working (§6.9). Every live form and its entries is kept,
  mapped or deliberately archived (§6.10).

Reference: `2026-09-28-redesign-inventory.md` (next to this file) has the per-page sections,
component specs, verbatim copy, settings defaults and data models. Where this spec says "as the
redesign", that inventory, and ultimately the redesign source, is authoritative.

## 2. Decisions

| Decision | Choice |
|---|---|
| Build method | Custom block theme (Site Editor, `theme.json`, patterns). No Elementor. |
| Structure | `elevation` theme (presentation) + `elevation-core` plugin (functionality) |
| Go-live | Replace the whole live site with the finished local site in one migration |
| Features at launch | Events + calendar, messages from the YouTube channel, connect-group directory, visit plans, forms, YouTube live, announcements |
| Messages | Shown straight from the church's YouTube channel and opened on YouTube; nothing is stored or edited in WordPress (§6.3) |
| Old pages | Redirect replaced pages; keep Resources, Alpha, ETracts and Church in the Park 2025, restyled |
| Old forms | Mapped onto new features; live entries migrated (§6.10) |
| Forms | Fluent Forms (free), styled by the theme |
| Edit rights | Editors for content; a new Site Manager role for settings and menus; Administrators only for people allowed to see Prayer and Gift Aid |
| Local email | Mailpit container (every notification is testable locally) |
| Email on live | FluentSMTP → existing Resend account |
| Analytics | Keep the existing GA4 property, loaded **only after consent** via a small banner in the redesign's style (§6.8) |
| Plugin stack | Free wordpress.org builds replace the expired WPMU DEV Pro suite. Fluent Forms Pro kept (licence valid), but the build must still work on free Fluent Forms (§8) |
| Redirects | The Redirection plugin (already on live) holds both the live short links and the new page redirects (§6.9) |

## 3. Known facts about live (checked 2026-09-28; full detail in `docs/live-inventory.md`)

- **Hosting**: cPanel on Apache at `host02.elevationchurchng.org` (Liquid Web IP `67.225.139.124`),
  DNS on `ns1/ns2.elevationchurchng.org`. It is the parent church's own server. **We have wp-admin
  access only**, so no SSH, WP-CLI or database access is assumed. The parent church's IT has a live
  Administrator account. There is no CDN or proxy, so `REMOTE_ADDR` is the real client IP.
- **Platform**: WordPress 6.8.10, PHP 8.3.30, MariaDB 10.6.28, table prefix `wp6d_`, uploads up
  to 256M. The local environment is pinned to match the database version and prefix (§8). The
  migration also brings live's core up to the local, pinned version.
- **Caching**: HTML is sent with `Cache-Control: max-age=600` (10 minutes, browser-side). The
  Hummingbird page cache is **disabled**. Design rule: nothing time-sensitive may depend on the
  HTML being fresh (§6.4, §6.5).
- **Plugins**: 26 active (listed in the inventory). They include Fluent Forms Pro (valid licence),
  a WPMU DEV Pro suite with an **expired** membership (no updates since 2025-10), Google Site Kit
  outputting **GA4** (`G-0Q3764FCYN`), the **CookieYes** GDPR banner, and **Redirection** with 10
  campaign short links, some heavily used (`/fyv` 1,228 hits, `/lane7` 656).
- **Tracking**: GA4 is the only live tracker. The WPCode header Google Ads tag is commented out,
  and WPCode's only active snippet allows SVG uploads.
- **Users**: 3 accounts, all Administrators.
- **Pages on live** (from the export): `/`, `/home`, `/sample-page`, `/who-we-are`, `/volunteer`,
  `/join-our-community`, `/privacy-policy`, `/resources`, `/resources/alpha`, `/resources/etracts`,
  `/guest`, `/church-in-the-park-2025`.
- **Forms on live** (entry counts at 2026-09-28):

  | Form | Page | Entries |
  |---|---|---|
  | FF 3 "Volunteer Form" | /volunteer | 21 |
  | FF 4 "Reserve a seat Form" | /join-our-community | 27 |
  | FF 5 "Newsletter Form" | home | 134 |
  | FF 6 "Guest Form" | /guest | 0 |
  | FF 7 "Alpha Course sign up" | /resources/alpha | 1 |
  | Forminator newsletter | not embedded | 0 |
  | Hustle | — | 0 |

  FF 1 and 2 are unused demo forms. **Notifications are disabled on FF 3, 4 and 5**, so none of
  those entries was ever emailed to anyone. FF 7 notifies a personal Gmail address.
- **Developer dependency**: blocks render at request time (`render.php`), so content never breaks
  when a block changes. But changing a block's behaviour or markup means editing code and
  rebuilding with Node. Content, settings, menus and patterns need no developer.

## 4. Phase 0 — live discovery

1. ✅ Full WPvivid backup of live (WPvivid was already installed), taken 2026-09-28 22:17 UTC.
   Stored in `private/live-backup/2026-09-28/` (gitignored, `chmod 700`).
2. ✅ Form definitions: not needed as a separate export. They are in the backup's
   `wp6d_fluentform_forms` and `wp6d_fluentform_form_meta` tables.
3. ✅ The database is restored into the isolated `elevation-mirror` MariaDB 10.6
   (`docker-compose.mirror.yml`, no published ports, password in `private/.env.mirror`). A full
   WordPress front end for the mirror is only started if visual reference is needed.
4. ✅ Findings recorded in `docs/live-inventory.md`.
5. ✅ WPCode reviewed: no active tracking. GA4 via Site Kit is the only tracker, which led to the
   consent decision (§2, §6.8).
6. ⏳ Check the redesign's Supabase `pages` table for published CMS pages (the user checks
   `/admin/pages` on the redesign). Each one found is added to §5.5, or listed as dropped.

Phase 0 is repeated at go-live (§10) with a fresh backup, to capture entries submitted in the
meantime.

## 5. Theme

### 5.1 Repository layout

```
wp-content/
  themes/elevation/             presentation
    theme.json, style.css, functions.php
    templates/                  front-page, page, 404, index, search,
                                single-event, archive-event,
                                archive-connect_group
    parts/                      header.html, footer.html
    patterns/                   section patterns (§5.3), one PHP file each
    assets/fonts/               Sora 400–800 + Inter variable, woff2, self-hosted
    assets/css/, assets/js/     only what theme.json/core cannot express
  plugins/elevation-core/       functionality (§6)
    includes/, src/blocks/<name>/{block.json,edit.js,render.php,view.js}, build/ (committed), tests/
  mu-plugins/local-dev.php      local only; excluded from the migration package (§10)
bin/        setup.sh, post-import.sh, seed.sh, versions.lock
seed/       media/, pages/*.html, forms/*.json, fixtures/
docs/       go-live.md, live-inventory.md, editing-guide.md
docker-compose.yml, docker-compose.mirror.yml
```

Git allow-lists only our directories (theme, plugin, mu-plugins, bin, seed minus private data,
docs, Docker config). The plugin's `build/` is committed. Blocks are built in a pinned `node:22`
container.

### 5.2 Design tokens (`theme.json`)

From `website/src/app/globals.css` (inventory §0):

- **Palette** (only these; core palettes, gradients and duotones disabled): green `#84C224`
  (fills only, never text on white), green-600 `#6FA61C` (text-safe), green-100 `#EAF6D6`, ink
  `#0E0E2C`, ink-800 `#1B1F29`, grey-50 `#F7F8F5`, grey-100 `#F1F1EF`, grey-300 `#D7D9D6`,
  grey-500 `#676767`, grey-700 `#4B4F58`, white.
- **Typography**: Inter body (grey-700, line-height 1.625). Sora h1–h4 (line-height 1.1,
  letter-spacing −0.02em, ink). Fluid sizes: hero `clamp(42px,6vw,76px)`, page hero
  `clamp(34px,5vw,54px)`, section h2 `clamp(30px,4vw,46px)`, plus steps 21/20/19/18/15/14/12px.
- **Layout**: contentSize 760px, wideSize 1240px, 24px side padding, section padding 64/96px.
- **Shadows**: card `0 10px 30px rgb(14 14 44/.08)`, card-lg `0 24px 60px rgb(14 14 44/.16)`.
- **Block styles**: button `green` (default) / `navy` / `ghost` / `ghost-on-dark`, plus `lg`.
  These are pills in Sora 600 with a 2px hover lift under no-preference motion and a 2px green-600
  focus ring. Paragraph `eyebrow` / `eyebrow-on-ink`. Group `card` / `card-ink` / `strip-green`.
  Image `rounded-2xl`.
- **Reveal**: fade-up on scroll, visible without JS, off under reduced motion.

### 5.3 Header and footer

- **Header** (`parts/header.html`): sticky, 76px (88px ≥640px). Logo (colour and white stacked for
  the crossfade), core Navigation block, then Plan a Visit (ghost) and Give (green).
  - On the front page before 80px of scroll: transparent, white links and logo, overlaying the
    hero. Otherwise: white/92 with blur, ink links, shadow once scrolled. The active link is green.
  - **Breakpoint**: core Navigation collapses at 600px, but the redesign collapses below 1024px.
    So the Navigation block is set to `overlayMenu: "always"`. Theme CSS hides the hamburger and
    shows the inline menu at ≥1024px, and does the reverse below. `header.js` adds only what core
    lacks: the scroll state, the over-hero state and the logo crossfade.
  - **Overlay**: full-screen ink, sliding in from the right (350ms), Sora 26px links, "Sundays at
    10:30am" (bound, §6.1), full-width Plan a Visit / Give buttons (core Buttons inside the
    overlay). Scroll lock, Escape to close, focus trapped (core behaviour, verified in §12).
  - **Menu** (editable by Site Managers): I'm New, About (Our Story, Vision & Values, Leadership,
    What We Believe, rendered as a desktop dropdown and an indented mobile list), Watch, Events,
    Get Involved, Prayer, Contact. Skip link to `#main`.
- **Footer** (`parts/footer.html`): as the redesign (inventory §2, §7), plus a **newsletter
  signup** row (Fluent Form "Newsletter", in the redesign's ink pill style) above the practical
  strip. This replaces live form 5 on the old homepage.

### 5.4 Patterns

Core blocks plus block styles, in an "Elevation" category.

`page-hero`, `section-heading`, `home-hero`, `image-cards-3`, `ink-cards-4`, `info-cards`,
`values-grid`, `badge-cloud`, `growth-track`, `two-col-text-media`, `cta-band`, `sunday-strip`,
`give-cards`, `aside-boxes`, `accordion` (core Details), `leadership`, `rich-text-section`,
`stats` (up to 4 big numbers with labels), `date-card` (ink date tile + title, weekday, time,
place). The last two match the redesign's `stats` and `date-card` CMS blocks.

### 5.5 Templates and pages

Templates: front-page, page, 404 (ink hero "Page not found" plus links), index, search, and the
templates for the post types in §6.

| Page | Slug | Source |
|---|---|---|
| Home | `/` | redesign |
| I'm New | `/im-new` | redesign + ids `what-to-expect`, `find-us`, `kids` + **Plan a Visit form** (`#plan-a-visit`) + **Connect card** (`#connect-card`) |
| About | `/about` | redesign (ids `our-story`, `vision-values`, `leadership`) |
| What We Believe | `/about/what-we-believe` | redesign |
| Watch | `/watch` | redesign: the channel feed and live status (§6.3, §6.4) |
| Events | `/events`, `/events/{slug}` | §6.2 |
| Get Involved | `/get-involved` | redesign; `#connect-groups` shows the directory teaser; `#serve` gets the **G-Squad form** |
| Connect Groups | `/connect-groups` | new directory (§6.6) |
| Give | `/give` | redesign (`#gift-aid`) |
| Prayer, Contact | `/prayer`, `/contact` | redesign |
| Privacy | `/privacy` | redesign structure, WordPress processors (§11) |
| Resources, Alpha, ETracts, Church in the Park 2025 | unchanged slugs | existing text and images rebuilt in patterns; Alpha keeps its registration form |
| Supabase CMS pages | per Phase 0 step 6 | ported or listed as dropped |

## 6. Plugin: `elevation-core`

### 6.1 Church Settings and bound copy

- Settings → Church, one option `elevation_settings`. Groups and defaults as `church.ts`
  (inventory §3): church, service (day, start time, doors-open), location, contact (email, phone,
  `prayerInbox`, `welcomeInbox` = `info@elevationmanchester.org`), socials, giving, hero slides (media, focal point, alt), YouTube
  (API key, channel handle). Derived values: `location.full`, `mapsUrl`, `embedUrl`.
- Capability `manage_church_settings` (Site Manager and Administrator, §7). The API key is never
  output to the front end.
- **Settings in copy**: two mechanisms, so no repeated fact is hard-coded.
  1. A Block Bindings source `elevation/settings`, for elements that are entirely a setting
     (buttons, address lines, footer strip).
  2. Inline tokens inside ordinary text, e.g. `Sundays at {service.startTime}`, replaced at render
     by a `render_block` filter (allow-listed keys only, escaped). An editor toolbar button inserts
     them. Every seeded page uses tokens wherever the redesign repeats the service day and time,
     venue, campus, postcode, email or phone: the home cards and info list, I'm New answers, Watch
     CTA, events strips and Contact.
- Copy that restates settings in prose that tokens can't express is listed in
  `docs/editing-guide.md` under "update when the service time or venue changes".

### 6.2 Events

- Post type `event` (`/events/`, `/events/{slug}/`): title, editor, excerpt (summary), thumbnail.
  Meta: `start` (required), `end` (≥ start, may be another day), `time_tbc`, `venue` (falls back to
  settings), `cta_label`, `cta_url` (`https://` or `/`). Edited in a sidebar panel.
- `Event_Time` (pure PHP, Europe/London): upcoming = (end or start) ≥ today 00:00 London, so
  multi-day events in progress stay upcoming (fixes redesign `events.ts:31`). Formats:
  "Time to be confirmed"; "7:00 pm" / "7:00 pm – 9:30 pm"; start time only if multi-day;
  "Sunday 5 October 2026"; "18 Oct – 20 Oct"; date keys `Y-m-d`.
- Blocks: `event-grid`, `home-events` (with the Sunday strip and the empty states), `event-calendar`
  (interactive month view), `event-meta`. Archive and single templates as inventory §1 (Events
  index, Event detail).
- **Freshness**: the upcoming/past split is computed server-side. A 10-minute-old page can show an
  event that finished minutes ago; that is acceptable. The calendar highlights "today" using the
  browser clock.

### 6.3 Messages (the YouTube channel feed)

- Messages are **not** stored in WordPress. The site shows the church's YouTube channel (settings
  `youtube.channelHandle`, `youtube.apiKey`) through the §6.4 client, and every message card opens the
  video on YouTube in a new tab, as the redesign does.
- **Public**:
  - `/watch`: live player / upcoming strip (§6.4), "Recent messages" = the 12 latest finished
    live streams (broadcasts that went out; not ordinary uploads or Shorts) as the redesign's video cards, "See everything on YouTube".
    Fallback panel (redesign copy) when there is no API key or the fetch failed.
  - Home watch section: the live stream while streaming, otherwise the latest finished live stream; the
    redesign's static "Missed a Sunday?" section when there is neither.
- **Thumbnails** would be a request to Google (`i.ytimg.com`) before consent, so the server copies
  each shown thumbnail into `uploads/elevation-youtube/` and serves it from the site. A thumbnail that
  can't be copied shows the ink placeholder.
- **Configured entirely in wp-admin** (live has no server access, §3): Settings → Church holds the
  API key and channel handle, shows the YouTube status (last successful check, or the last error and
  when), and has a "Check YouTube now" button that clears the cache.
- Locally, the API key may instead come from `.env` (`YOUTUBE_API_KEY`), read only by
  `mu-plugins/local-dev.php`, so rebuilds keep working; the local site shows the real channel.

### 6.4 YouTube client and live status

- `YouTube_Client`: handle → uploads playlist ID (transient, 1 day). `playlistItems.list` +
  `videos.list` = 2 units per refresh (transient, 60s). Classifies live/upcoming/none, returns
  duration, thumbnail and scheduled start. Every failure degrades to empty results, one log line
  and a status that Settings → Church shows (§6.3). Nothing throws.
- **Freshness under the 10-minute HTML cache**: the server renders the last-known state. A view
  script then calls an uncacheable REST endpoint `GET /wp-json/elevation/v1/live` (`Cache-Control:
  no-store`; the answer comes from the 60s transient, so there is no extra API cost per visitor).
  It swaps `watch-hero`, `home-watch` and `live-player` into or out of the live state. Without JS,
  the server state is shown (at most 10 minutes stale).
- Embeds use `youtube-nocookie.com` inside the consent gate.

### 6.5 Announcements

- Post type `announcement` (admin only): title, body, image, `cta_label`, `cta_url`, `active`,
  `starts_at`, `ends_at`, `dismiss_hours` (1–720, default 24). Activating one deactivates the
  others.
- **Freshness**: the modal is **not** chosen at render time. A footer script calls
  `GET /wp-json/elevation/v1/announcement` (`no-store`), which returns the active, in-window
  announcement or nothing. The browser then applies the dismissal rule
  (`localStorage["ecm-announcement-{id}-{modifiedTs}"]` younger than `dismiss_hours`) and re-checks
  `starts_at`/`ends_at` against its own clock. Activating, expiring or editing an announcement takes
  effect on the next page view, whatever the HTML cache does. One small request per page view.
- Styling and close behaviour as inventory §2 (announcement-modal).

### 6.6 Connect-group directory

- Post type `connect_group` (no single pages; each group has an anchor in the
  directory). `/connect-groups` is a seeded page holding the directory block, not a post-type archive.
  Fields: name (title), description (excerpt), taxonomies `group_area` (e.g. Salford, City
  Centre, Online) and `group_category` (families, young professionals, couples, fitness, …), meta
  `meeting_day`, `meeting_time`, `leader_name` (its first name shows on cards; the full name is editor-only in REST), `leader_email` (private, for
  notifications), `accepting_members` (bool), and a featured image. There is no live data to
  migrate. Groups are entered by staff.
- **Public**: `/connect-groups` has a filter bar (GET params `area`, `type` and `meets`: area, category, day) and group cards
  (image, name, area, category, day and time, leader first name, status). "Ask to join" opens the
  Join Group form with the group pre-selected. Groups not accepting members show "Full right now,
  ask about the next one", which uses the same form. Get Involved `#connect-groups` shows three
  featured groups plus "Browse all groups". With no published groups it shows the redesign's
  existing "Find a group" → form flow.
- **Join Group form** (Fluent Forms): name, email, phone, group (hidden, set from the card via URL
  param; blank = "not sure, help me choose"), message. Notification to the group's `leader_email`
  (looked up server-side from the group ID, never exposed) and to `welcomeInbox`.
- Seed: the directory starts empty on live unless staff supply groups. Fixtures (3 fake groups) are
  loaded **locally only**, for visual testing.

### 6.7 Visit plans and connect card

- **Plan a Visit form** on I'm New (`#plan-a-visit`), fields from the redesign's `visit_plans`:
  name, email, phone, planned date (a select of the next 8 service dates, computed from settings),
  adults, children, children's ages (free text), notes.
  - Notifies `welcomeInbox`.
  - Sends the visitor a confirmation email containing the time, address and map link (from
    settings), what to expect, and kids' info.
  - Staff track follow-up with Fluent Forms' entry read/unread status. Richer statuses are out of
    scope.
- **Connect card** (`#connect-card`, replaces live form 6): the live Guest form's questions minus
  the full postal address (only postcode, for data minimisation), with the country dropdown dropped.
  Notifies `welcomeInbox`. Live form 6 has no entries. `/guest` redirects to `/im-new#connect-card`,
  so printed QR codes keep working.
- Live FF 4 "Reserve a seat" (27 entries: name, email, phone) migrates into Plan a Visit.

### 6.8 Consent (analytics + embeds) and other blocks

- **One consent store**, two categories: `analytics` (GA4) and `embeds` (Google Maps, YouTube).
  It lives in localStorage `ecm.consent` = `{ analytics, embeds, version, ts }`. The redesign's
  `ecm.consent.embeds` key is read once for backwards compatibility. Changes fire
  `ecm:consent-changed` and sync across tabs via `storage`.
- **Banner**: a small bottom bar in the redesign's style (ink panel, pill buttons) shown until a
  choice is made. It offers "Accept all", "Reject all" (equal prominence) and "Choose". The last
  opens toggles for Analytics and Maps & videos. There is no pre-ticked box and no cookie wall.
  After a choice, a "Cookie settings" link in the footer reopens it.
- **GA4**: loaded by `elevation-core` only after `analytics` is granted, using the measurement ID
  from Church Settings (default `G-0Q3764FCYN`, the existing property, so history continues).
  Nothing from Google loads before consent. Withdrawing consent stops future loads and deletes the
  `_ga*` cookies for the domain. Site Kit and CookieYes are removed (§8).
- `embed-gate` (map | video), as inventory §2. Clicking "Show the map" / "Play the video" loads that
  one embed without changing the stored choice. If `embeds` is granted, embeds load immediately.
- `consent-controls` block on the Privacy page: shows the current choices, with per-category
  toggles and "Clear my choice".
- `hero-slideshow` (6.5s, 1.2s fade, Ken Burns, pauses when the tab is hidden, static under reduced
  motion, first image `fetchpriority=high`), `leadership-grid`, `icon` (allow-listed Lucide set),
  `social-links`.

### 6.9 Redirects (from the live export and the live Redirection table)

All redirects live in the **Redirection** plugin, so staff manage short links and page moves in one
screen. There is no custom redirect code.

- **Carried over unchanged**: the 10 live Redirection items (`/fyv/`, `/lane7`, `/settledin/`,
  `/free-resources/`, `/dreamjobuk`, `/godlyparentingseries`, `/hu/`, `/jewels`, `/gts`,
  `/resources/e-tracts/`). They are copied from the mirror by `bin/migrate-live-data.php` (§6.10),
  keeping their hit counts.
- **New** (seeded into a "Redesign 2026" group):

  | Live URL | → |
  |---|---|
  | `/home` | `/` |
  | `/sample-page` | `/` |
  | `/who-we-are` | `/about` |
  | `/volunteer` | `/get-involved#serve` |
  | `/join-our-community` | `/im-new#plan-a-visit` (it hosted "Reserve a seat") |
  | `/guest` | `/im-new#connect-card` |
  | `/privacy-policy` | `/privacy` |

- Kept pages retain their live slugs: `/resources`, `/resources/alpha`, `/resources/etracts`,
  `/church-in-the-park-2025`.
- §12 checks that every live URL in §3, every Redirection source, and every attachment URL in the
  export returns 200 or the correct 301.

### 6.10 Forms: complete map

| Form | Where | Replaces (live) | Notifies | Entry access |
|---|---|---|---|---|
| Contact | `/contact` | — | contact email (reply-to sender) | Site Manager, Admin |
| Prayer | `/prayer` | — | `prayerInbox` ("URGENT" subject when ticked) | Admin only |
| Gift Aid | `/give#gift-aid` | — | contact email (name + postcode only) | Admin only |
| Newsletter | footer, site-wide | FF 5 (134 entries) | none | Site Manager, Admin |
| G-Squad sign-up | `/get-involved#serve` | FF 3 Volunteer (21) | `welcomeInbox` | Site Manager, Admin |
| Plan a Visit | `/im-new#plan-a-visit` | FF 4 "Reserve a seat" (27) | `welcomeInbox` + visitor confirmation | Site Manager, Admin |
| Join Group | `/connect-groups` | — (new) | group leader + `welcomeInbox` | Site Manager, Admin |
| Connect card | `/im-new#connect-card` | FF 6 Guest (0; nothing to migrate) | `welcomeInbox` | Site Manager, Admin |
| Alpha registration | `/resources/alpha` | FF 7 (1), same fields, restyled | `welcomeInbox` (replaces the personal Gmail recipient) | Site Manager, Admin |

- **Notifications are on for every form.** Live had them off on FF 3, 4 and 5 (§3), so the
  go-live checklist includes handing the 48 historic volunteer and seat entries to the welcome team.
- Retired without migration: FF 1 and FF 2 (demo, 0 entries), Forminator (0), Hustle (0).
- **Definitions**: new forms are authored as JSON in `seed/forms/`. Alpha is rebuilt from its live
  definition (`wp6d_fluentform_forms` id 7 in the mirror), restyled, with the same field names so
  its entry maps 1:1.
- **Live data migration**: Fluent Forms (free or Pro) can't import entries. So the migration is a
  local script, `bin/migrate-live-data.php`, run with WP-CLI against the new site. It reads from
  the `elevation-mirror` database and does three things:
  1. Copies `wp6d_fluentform_submissions` + `wp6d_fluentform_entry_details` rows for FF 3, 4, 5
     and 7 into the new forms, with a field map per form (the keys are in the inventory; FF 3/4
     `subject` → `phone`, FF 4 → Plan a Visit with the date left blank, `ak_js` dropped). It keeps
     the original `created_at`, and stores `source = live-ff{N}` in the entry meta.
  2. Copies the Redirection items (§6.9).
  3. Copies the live user accounts (§10).

  It is idempotent (it skips rows already copied, using the source ID). It prints counts
  before and after, and those are recorded in `docs/live-inventory.md`. Nothing is written to the
  mirror.
- **Validation and data**:
  - Gift Aid rules (first name ≥2 characters after stripping dots and spaces, surname ≥2,
    house name or number required, UK postcode) are enforced with Fluent Forms' **validation**
    filter, which rejects only.
  - Postcode normalisation to "AA9 9AA" uses the **submission data** filter
    (`fluentform/insert_response_data`), applied after validation.
  - The HMRC declaration text and version `hmrc-2016-enduring-v1` are stored in hidden fields.
- **Retention**: Gift Aid entries must be kept for six years after the last gift. The plugin blocks
  deletion of Gift Aid entries through Fluent Forms' delete hooks (exact hook verified during the
  build; if Fluent Forms offers no hook that can veto, deletion is instead prevented by
  capabilities and a monthly encrypted CSV export is documented). Admins mark cancellations with a
  "cancelled" note rather than deleting.
- **Spam and abuse**: Fluent Forms honeypot on all forms, plus a rate limit of 5 submissions per
  10 minutes per IP per form (`REMOTE_ADDR`, valid because there is no proxy, §3). If a CDN is added
  later, the IP source must be revisited, and that is listed in `docs/go-live.md`.
- **Styling**: theme CSS restyles Fluent Forms markup to the redesign (2-col grid, Inter labels (the redesign's `Label`), Sora fieldset and success headings,
  green-100 success, destructive errors, pill submit).

## 7. Roles and access

| Role | Can | Cannot |
|---|---|---|
| **Editor** (core) | Pages, events, connect groups, announcements, media | Settings, menus, templates, form entries |
| **Site Manager** (new) | Everything Editors can, plus `manage_church_settings`, `edit_theme_options` (menus, header/footer parts, templates, patterns in the Site Editor), the YouTube settings and "Check YouTube now", Fluent Forms manager access to the forms marked "Site Manager" in §6.10 | Users, plugins, themes, core settings (`manage_options`), Prayer and Gift Aid entries |
| **Administrator** | Everything, incl. Prayer and Gift Aid entries | — |

- Administrator accounts are limited to the people allowed to see Prayer and Gift Aid (named in
  `docs/go-live.md`, not in git).
- Fluent Forms per-form manager permission is confirmed to exist in the free version
  (`FormManagerService::hasSpecificFormsPermission`). §12 tests that a Site Manager can't reach the
  Prayer or Gift Aid entries by URL.
- Post-type capabilities for `event`, `connect_group` and `announcement` map onto the
  standard post capabilities, so Editors manage them.
- `edit_theme_options` also lets Site Managers edit templates. That is accepted: the Site Editor
  keeps revisions, and "reset to theme default" restores any template.

## 8. Plugins and versions

| Plugin | Source | Role |
|---|---|---|
| Fluent Forms | wordpress.org | all forms |
| Fluent Forms Pro | licensed zip (from the live backup, stored in `private/vendor/`, not git) | kept for the licence holder's benefit; **no feature in this spec may require it** |
| FluentSMTP | wordpress.org | email on live (Resend) |
| Redirection | wordpress.org | all redirects (§6.9) |
| SmartCrawl (free, `smartcrawl-seo`) | wordpress.org | SEO; replaces the expired `wpmu-dev-seo` Pro |
| Smush (free, `wp-smushit`) | wordpress.org | image compression; replaces Smush Pro |
| Defender (free, `defender-security`) | wordpress.org | login protection and hardening; replaces expired Defender Pro |
| Hummingbird (free, `hummingbird-performance`) | wordpress.org | browser caching and asset minification only. Page cache stays **off** (as live); if it is turned on later, §6.4/§6.5 still hold |
| WPvivid Backup | wordpress.org | migration; removed after sign-off |

- **Removed** (live plugins not carried over): Elementor, Essential Addons, Happy Addons, Premium
  Addons, Royal Elementor Addons, Header Footer Elementor, Hello Elementor (theme), Forminator,
  Hustle, Ultimate Branding, WPMU DEV Dashboard, WP Admin Notification Center, Google Site Kit
  (GA4 now loaded by `elevation-core` after consent), CookieYes (replaced by §6.8), WPCode (its only
  live snippet is covered by `elevation-core`), Akismet (Fluent Forms honeypot + rate limit
  instead), Hello Dolly, Astra Sites, Migrate Guru, Really Simple SSL (removed only after confirming
  that the server itself redirects HTTP→HTTPS; otherwise kept).
- **Pinning** (`bin/versions.lock`):
  - WordPress core: the version tested at sign-off (currently 7.1.2). Live is upgraded from 6.8.10
    by the migration itself.
  - Each plugin as slug@version.
  - Docker images by exact tag and digest: `wordpress:<core>-php8.3-apache`, `wordpress:cli`,
    **`mariadb:10.6.x`** (matches live; MariaDB 11 collations don't import into 10.6), `node:22.x`,
    `axllent/mailpit`, `phpmyadmin`.
  - Table prefix **`wp6d_`** (matches live).

  `setup.sh` installs exactly these. Upgrades are deliberate: bump the lock, re-run, test.
- Rebuilding the current local environment on MariaDB 10.6 and `wp6d_` is the first
  implementation task. The existing local data is disposable, because the seed recreates it.

## 9. Seeding and the cut-off

- `bin/seed.sh` builds the whole redesigned site from nothing: pages, patterns, menus, media, forms,
  settings defaults, local-only fixtures (events, groups), front page, and removal
  of Elementor content and plugins.
- **Source of truth until the cut-off**: `seed/` is authoritative. Content edits made in local
  wp-admin before the cut-off are made in `seed/` instead (or exported back into it with
  `bin/export-page.sh <slug>`).
- **Guard**: each seeded post stores a hash of the seeded content. On a re-run, a post whose current
  content no longer matches its stored hash has been edited by hand. It is **skipped with a
  warning**, never overwritten, unless `--force <slug>` is given.
- **Cut-off**: a named date in `docs/go-live.md` (set when the build is signed off, before staff
  start entering real content). After it, `seed.sh` refuses to run without
  `--i-know-this-is-after-cutoff`, and the local site's database becomes the source of truth.
- `bin/setup.sh` (pinned) + `bin/seed.sh` must take a wiped environment to the finished site with
  no manual steps (tested in §12).

## 10. Go-live (`docs/go-live.md`, executed later)

1. **Maintenance mode** on live (a WPvivid or small maintenance plugin), and turn off every live
   form. This stops public submissions, not just staff edits.
2. Re-run Phase 0: a fresh WPvivid backup loaded into `elevation-mirror`, and a check for new
   plugins, snippets or redirects since 2026-09-28. Run `bin/migrate-live-data.php` to pick up
   entries, redirects and users added since the last run, and verify the counts.
3. Confirm live's PHP is still 8.3 and its database is MariaDB 10.6, so the packaged site will run.
   Tell the parent church's IT that core moves from 6.8.10 to the pinned version.
4. Package the local site with WPvivid, **excluding** `mu-plugins/local-dev.php`, `import/`,
   `private/`, `seed/` and any other private data. Search-replace `http://localhost:8080` →
   `https://elevationmanchester.org` as part of the restore.
5. Restore over live. Then:
   - Set `WP_ENVIRONMENT_TYPE` to `production`.
   - **Accounts**: the three live accounts (including the parent church IT account) arrive with
     their original password hashes, copied by `migrate-live-data.php`, so their logins keep
     working. **Delete the local `admin` account.** Assign roles per §7; who stays an Administrator
     is decided before go-live and recorded outside git.
   - Create Site Manager and Editor accounts for staff.
   - Configure FluentSMTP with Resend, the YouTube API key and the GA4 measurement ID. Resave
     permalinks.
   - Enter the Fluent Forms Pro licence (if kept).
   - Hand the historic FF 3 and FF 4 entries (never notified) to the welcome team.
6. **Smoke test**: every live URL from §3 (200 or correct 301), every form end to end (a real
   email arrives at the right inbox), the announcement, live status, the Watch feed, and the
   Site Manager access limits.
7. Maintenance mode off. Keep the pre-migration backup until sign-off.
8. **After sign-off**: delete every backup and migration file that contains personal data, and
   record the deletion date. That covers WPvivid backups on the server, the downloaded part files
   in `~/Downloads`, `private/live-backup/`, the `elevation-mirror` volumes
   (`docker compose -f docker-compose.mirror.yml down -v`) and any CSV exports. Remove WPvivid.

## 11. Privacy notice

The notice is written from Phase 0's findings. It names the actual processors: the host (the
parent church, via Liquid Web), Resend (email via FluentSMTP), **Google Analytics 4** (only with
consent: what is measured, the `_ga` cookies and their lifetime, IP handling, how to withdraw),
Google Maps and YouTube (consent or click-to-load), and HMRC.

The cookies section replaces the redesign's "no cookies" claim. It lists the consent record
(localStorage), the GA4 cookies (analytics consent only) and the WordPress login cookies (staff
only). It links to the consent controls.

It also covers the new data sets (visit plans, connect cards, group join requests, Alpha
registrations, G-Squad sign-ups, newsletter), each with its purpose, lawful basis and retention, and
Gift Aid retention of six years after the last gift.

## 12. Testing and definition of done

- **PHPUnit** (pure functions): `Event_Time` (London midnight boundary, BST/GMT change, multi-day
  in progress, TBC, same-day range), Gift Aid validators and postcode normaliser, the next-8-service-
  dates generator, the YouTube response parsing and live/upcoming/past selection,
  the entry field maps in `migrate-live-data.php`, the consent-state reducer (defaults, legacy key
  migration, withdrawal), and settings token replacement (unknown keys and escaping).
- **Visual parity with matching data**: run the redesign against a **local Supabase**
  (`supabase start`, apply its migrations, load `seed/fixtures/` = the same events, announcement and
  settings the WordPress seed uses). Compare every page at 1440px and 390px. For connect
  groups and visit plans (new, with no redesign equivalent), compare against the redesign's design
  language, and review them with the user instead.
- **Behaviour**: header states and the 1024px breakpoint, overlay focus/Escape/scroll lock, About
  dropdown, slideshow and reduced motion, reveal, calendar, announcement show/dismiss/re-show and
  activation within one page view despite `max-age=600`, live-status swap via REST, the Watch feed
  against the real channel, directory filters, the Join Group pre-selection, and every §6.9
  redirect plus every live URL and short link.
- **Consent**, checked in the network panel: **no request to any Google domain before consent**.
  GA4 loads after "Accept" or after the analytics toggle. "Reject" loads nothing. Withdrawing clears
  the `_ga*` cookies. Embeds follow their own category or click-to-load. The banner doesn't reappear
  after a choice, and "Cookie settings" reopens it. It is keyboard and screen-reader operable.
- **Forms**: every form submitted locally. **Mailpit** shows each notification with the right
  recipient, subject and reply-to (including the urgent prayer subject, the group-leader routing
  and the visitor confirmation). Validation messages for each rule. The postcode is stored
  normalised. The Site Manager can't open the Prayer or Gift Aid entries. Gift Aid entry deletion
  is blocked.
- **Live data migration dry run** against `elevation-mirror`: FF 3→21, FF 4→27, FF 5→134, FF 7→1
  entries, 10 Redirection items and 3 users arrive. A second run changes nothing. A migrated user
  can log in with their existing password.
- **Hygiene**: a clean `debug.log`, no console errors, Lighthouse accessibility ≥95 on Home, I'm
  New and Give, and AA contrast.
- **Reproducibility**: `docker compose down -v && bin/setup.sh` yields the finished site twice,
  identically (same versions and page content hashes).

## 13. Out of scope

- Performing the live migration (checklist only, §10).
- The redesign's custom admin workflow (approval queue, audit log). WordPress users, roles and
  revisions replace it.
- Richer submission statuses than read/unread. Newsletter double opt-in and mailing-list platform
  integration (entries are collected).
- New photography.

## 14. Review changes (revision 2)

| Review item | Resolved in |
|---|---|
| P1 staff can't edit settings or menus | §7 Site Manager role, `manage_church_settings` |
| P2 newsletter not placed; Forminator subscribers lost | §5.3 footer newsletter, §6.10 map and migration |
| P3 five live forms unaccounted for | §3, §6.10 (every form mapped; Alpha kept; entries migrated) |
| P4 not reproducible; re-seed wipes edits | §8 pinning, §9 hash guard and cut-off |
| P5 host unknown | §3 facts found, §4 Phase 0, freshness designed for `max-age=600` |
| P6 Navigation breakpoint | §5.3 `overlayMenu: always` + CSS at 1024px |
| R1 cached announcement and live state | §6.4, §6.5 REST `no-store` endpoints |
| R2 settings only partly bound | §6.1 inline tokens + editing guide |
| R3 developer dependency implied away | §1, §3 stated explicitly |
| R4 go-live data gaps | §6.10 entry migration, §10 maintenance mode, admin removal, exclusions, backup deletion |
| R5 WPCode vs privacy notice | §4 step 5, §11 |
| Redirects from local slugs | §6.9 rebuilt from the live export |
| Visual comparison without data | §12 local Supabase with shared fixtures |
| Supabase CMS pages unchecked; stats/date-card missing | §4 step 6, §5.4 |
| Email untestable locally | Mailpit (§2, §12) |
| Postcode normalisation hook; deletion not prevented | §6.10 |
| Added: sermons/series, connect-group directory, visit plans | §6.3, §6.6, §6.7 |

## 15. Phase 0 changes (revision 3)

| Finding (live backup, 2026-09-28) | Change |
|---|---|
| Live DB is MariaDB 10.6, prefix `wp6d_` | §8: local pinned to 10.6 and `wp6d_` |
| GA4 (Site Kit) + CookieYes banner live | §6.8: consent banner covering GA4 and embeds; §11 rewritten |
| WPMU DEV membership expired | §8: free wordpress.org builds; Pro suite removed |
| Fluent Forms Pro licensed | §8: kept, never required |
| 10 Redirection short links with heavy traffic | §6.9: Redirection plugin kept, items migrated |
| FF 4 is "Reserve a seat", not a community sign-up | §6.10: → Plan a Visit; `/join-our-community` → `#plan-a-visit` |
| Forminator, Hustle, FF 6 have 0 entries | §6.10: retired, nothing to migrate |
| Notifications off on FF 3/4/5 | §6.10: all notify; §10: hand the historic entries to the welcome team |
| Alpha notifies a personal Gmail | §6.10: → `welcomeInbox` |
| 3 live Administrators incl. parent-church IT | §10: accounts migrated with password hashes |
| WPCode: only an SVG snippet active | §8: WPCode removed |
| Hummingbird page cache off; browser `max-age=600` | §3, §8: Hummingbird free, page cache off |

## 16. Messages from YouTube (revision 4, 2026-09-29)

| Decision (user, 2026-09-29) | Change |
|---|---|
| Messages are the raw YouTube feed, linking out to YouTube; not posts on the site | §2, §5.1, §5.5, §6.3 rewritten: no sermon post type, series, speakers, import or `/sermons` pages |
| The local site shows the real channel; no mock data | §6.3: local API key from `.env` via `local-dev.php`; tests keep canned API responses only as unit-test inputs |
| Live has wp-admin access only, so everything is configurable there | §6.3: key, handle, status and "Check YouTube now" in Settings → Church; §6.4 failures surface there, not only in a log |
| Thumbnails without a Google request before consent | §6.3: server-side copies in `uploads/elevation-youtube/` |
| Only live streams are shown (user, 2026-09-29) | §6.3: past videos = finished broadcasts only (`liveStreamingDetails.actualStartTime` set); uploads and Shorts are left out |

## 17. Forms, groups and announcements (revision 5, Plan 5)

| Ruling | Changes |
|---|---|
| Labels are Inter 14px weight 500 (the redesign's `Label`); Sora is for fieldset and success headings | §6.10 Styling |
| Every submit button is the green pill | §6.10 Styling |
| Inputs are 40px high, not the redesign's 32px | §6.10 Styling |
| The newsletter sends no email; the entry list is the mailing list | §6.10 table, §13 |
| IP addresses are not stored in entries; our rate limit reads `REMOTE_ADDR` and replaces Fluent Forms' own throttle | §6.10 Spam, §11 |
| Forms are placed by the `elevation/form` block (looked up by key, with an "email us" fallback); its wrapper carries `form-box` | §6.10, roadmap Plan 2 hand-off |
| Required-field messages live in `FormRules`, copied into Fluent Forms' rules, so browser and server agree | §6.10 Validation |
| A form edited in the Fluent Forms editor wins over the seed; force with `SEED_FORCE="form:<key>"` | §9 |
| `/connect-groups` is a seeded page holding the directory block | §6.6 |
| "Featured" groups on Get Involved are the first three published groups by menu order, then title | §6.6 |
| The Join Group form sits under the directory at `#join-group`; "Ask to join" links to `?group=<id>#join-group`, keeping filters | §6.6 |
| Visit dates are required; migrated "Reserve a seat" entries keep a blank date | §6.7, §6.10 |
| Announcement body is paragraphs and lists, returned by REST as `wp_kses_post` HTML with tokens replaced; schedule is London wall-clock `Y-m-d\TH:i` | §6.5 |
| The announcement fixture is loaded switched off | §6.5, §9 |
| Alpha is rebuilt from the public live form; field names match the live form 7 so its entry maps 1:1 | §6.10 |
| Connect card questions are the live Guest form's minus postal address and country, plus a postcode | §6.7 |
| Site Manager entry access uses Fluent Forms' per-user manager records, synced automatically on role change and form ID change | §7 |
| Taxonomies are `group_area` and `group_category`, not the bare `area` | §6.6 |
| The group description is the post excerpt, edited in the "Group details" panel; the core Excerpt panel is removed | §6.6 |
| The group leader's name is editor-only in REST, like the email | §6.6, §6.10 privacy |
| Anonymous reads of the core `/wp/v2/announcement` route are refused; the modal reads only `/elevation/v1/announcement` | §6.5, §3 |
| Gift Aid auto-delete settings are reset on save, on `admin_init` and before each submission | §6.10 Gift Aid retention |
| A form sits in a card only where its placement asks for it (`is-card` on the block: Gift Aid, G-Squad, Connect card and Join Group); Contact, Prayer, Plan a Visit and Alpha do not | §6.10 Styling |
