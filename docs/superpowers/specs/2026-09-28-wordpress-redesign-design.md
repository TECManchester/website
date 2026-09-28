# Elevation Church Manchester — WordPress redesign

Date: 2026-09-28 (revision 2, after spec review)
Status: revised, awaiting spec review

## 1. Goal

Rebuild the local WordPress copy of elevationmanchester.org so it looks and behaves like the
Next.js redesign in `~/Projects.nosync/website` (reference commit `e0cf43e`, clean tree), then
replace the live site with it in a single migration.

Success means:

- Every public page of the redesign exists in WordPress and matches it visually, side by side at
  desktop (1440px) and mobile (390px) widths, with matching data (§12).
- Church staff can edit pages, events, sermons, connect groups and announcements as **Editors**,
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
| Features at launch | Events + calendar, sermons + series, connect-group directory, visit plans, forms, YouTube live, announcements |
| Sermons | Auto-imported from YouTube as drafts; staff add speaker and series, then publish |
| Old pages | Redirect replaced pages; keep Resources, Alpha, ETracts and Church in the Park 2025, restyled |
| Old forms | Mapped onto new features; live entries migrated (§6.10) |
| Forms | Fluent Forms (free), styled by the theme |
| Edit rights | Editors for content; a new Site Manager role for settings and menus; Administrators only for people allowed to see Prayer and Gift Aid |
| Local email | Mailpit container (every notification is testable locally) |
| Email on live | FluentSMTP → existing Resend account |

## 3. Known facts about live (checked 2026-09-28)

- **Hosting**: Apache on `host02.elevationchurchng.org` (Liquid Web IP `67.225.139.124`), DNS on
  `ns1/ns2.elevationchurchng.org`. It is the parent church's own server. **We have wp-admin access
  only**: no SSH, WP-CLI, database tool or cPanel is assumed. There is no CDN or proxy in front, so
  `REMOTE_ADDR` is the real client IP.
- **Caching**: HTML is served with `Cache-Control: max-age=600` (10 minutes, browser-side). No page
  cache plugin was detected in the markup. Design rule: nothing time-sensitive may depend on the
  HTML being fresh (§6.4, §6.5).
- **Pages on live** (from the export): `/`, `/home`, `/sample-page`, `/who-we-are`, `/volunteer`,
  `/join-our-community`, `/privacy-policy`, `/resources`, `/resources/alpha`, `/resources/etracts`,
  `/guest`, `/church-in-the-park-2025`.
- **Forms on live**: Fluent Forms 3 (Volunteer: name, email, phone, home address), 4 (Join our
  Community: name, email, phone), 5 (Home: email-only newsletter), 6 (Guest: a post-visit
  connection card with address, how you heard, what you enjoyed, would you join, prayer, comments),
  7 (Alpha registration: name, phone, email, gender, age range, visited before, how you heard,
  contact consent). A Forminator form "newsletter-subscription" exists but is not embedded on any
  page. It may still hold historic entries.
- **Unknown until the live backup is inspected (§4)**: entry counts per form, Forminator entries,
  WPCode snippets, SmartCrawl settings, live users and roles, and the server's upload limit.
- **Developer dependency**: blocks render at request time (`render.php`), so content never breaks
  when a block changes. But changing a block's behaviour or markup means editing code and
  rebuilding with Node. Content, settings, menus and patterns need no developer.

## 4. Phase 0 — live discovery (before building)

Using wp-admin only:

1. On live, install **WPvivid Backup** (free; its chunked upload/download is not bound by
   `upload_max_filesize`) and take a full backup (database + `wp-content`). Download it. *The user
   does this, after confirming with the parent church that installing a plugin is permitted.*
2. In Fluent Forms → Tools, export all five form definitions as JSON. Save them to
   `seed/forms/live/` (gitignored if entries are included).
3. Restore the backup into a second, isolated local environment `live-mirror`
   (`docker-compose.mirror.yml`, port 8090, its own volumes, mail to Mailpit, never exposed).
4. Record in `docs/live-inventory.md`: active plugins and versions, WPCode snippets (full code),
   SmartCrawl settings, users and roles, entry counts per Fluent Form, Forminator entry count,
   upload limit and PHP version (Tools → Site Health → Info), and any redirects or rewrite rules.
5. **Review the WPCode snippets now.** Anything setting cookies or tracking (analytics, pixels)
   is either removed or triggers a consent-banner decision *before* the privacy notice is written
   (§11).
6. Check the redesign's Supabase `pages` table for published CMS pages (read via the redesign's
   admin at `/admin/pages`, or a read-only key). Each one found is added to §5.5, or listed as
   dropped.

Phase 0 is repeated at go-live (§10) to capture entries submitted in the meantime.

## 5. Theme

### 5.1 Repository layout

```
wp-content/
  themes/elevation/             presentation
    theme.json, style.css, functions.php
    templates/                  front-page, page, 404, index, search,
                                single-event, archive-event,
                                single-sermon, archive-sermon, taxonomy-series,
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
| Watch | `/watch` | redesign, with curated sermons (§6.3) |
| Sermons | `/sermons`, `/sermons/{slug}`, `/sermons/series/{slug}` | new (§6.3) |
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
  `prayerInbox`, `welcomeInbox`), socials, giving, hero slides (media, focal point, alt), YouTube
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

### 6.3 Sermons and series

- Post type `sermon` (`/sermons/`, `/sermons/{slug}/`): title, editor (notes), excerpt, thumbnail
  (defaults to the YouTube thumbnail). Meta: `youtube_id` (required, unique), `preached_on` (date),
  `duration_secs`. Taxonomies: `series` (hierarchical off; term meta: image, description;
  `/sermons/series/{slug}/`) and `speaker` (`/sermons/?speaker=…` filter).
- **Auto-import**: a WP-Cron job, hourly. It reads the uploads playlist (§6.4 client) and creates a
  **draft** sermon for each completed video (not live, not upcoming) whose `youtube_id` isn't
  already known. It fills title, description, `preached_on` (the publish date in London), duration
  and thumbnail. It never touches existing posts and never publishes. It also offers a manual
  "Import now" button (Site Manager). Its first run imports at most the last 50 videos; staff can
  bulk-trash anything unwanted. WP-Cron runs on traffic, and a missed hour just means the next
  visit catches up.
- **Admin**: a "Needs details" view listing draft sermons (speaker or series missing), so the weekly
  task is obvious.
- **Public**:
  - `/watch`: live player / upcoming strip (§6.4), "Recent messages" = the latest 12 **published
    sermons** (falling back to the raw YouTube feed until at least one is published), a "Series"
    row, and "See everything on YouTube".
  - `/sermons`: a grid with series and speaker filters (GET params, server-rendered, paginated 12).
  - Single: the video in the consent gate, title, speaker, series link, date, notes, "More from this
    series".
  - Series: header image, description, sermons in order.
  - Home watch section: shows the latest published sermon when not live.

### 6.4 YouTube client and live status

- `YouTube_Client`: handle → uploads playlist ID (transient, 1 day). `playlistItems.list` +
  `videos.list` = 2 units per refresh (transient, 60s). Classifies live/upcoming/none, returns
  duration, thumbnail and scheduled start. Every failure degrades to empty results and one log
  line. Nothing throws.
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

- Post type `connect_group` (`/connect-groups/`; no single pages; each group has an anchor in the
  directory). Fields: name (title), description (excerpt), taxonomies `area` (e.g. Salford, City
  Centre, Online) and `group_category` (families, young professionals, couples, fitness, …), meta
  `meeting_day`, `meeting_time`, `leader_name` (public), `leader_email` (private, for
  notifications), `accepting_members` (bool), and a featured image.
- **Public**: `/connect-groups` has a filter bar (area, category, day; GET params) and group cards
  (image, name, area, category, day and time, leader first name, status). "Ask to join" opens the
  Join Group form with the group pre-selected. Groups not accepting members show "Full right now,
  ask about the next one", which uses the same form. Get Involved `#connect-groups` shows three
  featured groups plus "Browse all groups". With no published groups it shows the redesign's
  existing "Find a group" → form flow.
- **Join Group form** (Fluent Forms): name, email, phone, group (hidden, set from the card via URL
  param; blank = "not sure, help me choose"), message. Notification to the group's `leader_email`
  (looked up server-side from the group ID, never exposed) and to `welcomeInbox`. Live form 4
  entries migrate here with group = blank.
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
  Notifies `welcomeInbox`. Live form 6 entries migrate here. `/guest` redirects to
  `/im-new#connect-card`, so printed QR codes keep working.

### 6.8 Consent gate and other blocks

- `embed-gate` (map | video) and `consent-controls`, as inventory §2. localStorage key
  `ecm.consent.embeds`, and no cookie banner. This holds only if Phase 0 step 5 finds no tracking.
- `hero-slideshow` (6.5s, 1.2s fade, Ken Burns, pauses when the tab is hidden, static under reduced
  motion, first image `fetchpriority=high`), `leadership-grid`, `icon` (allow-listed Lucide set),
  `social-links`.

### 6.9 Redirects (built from the live export, not the local DB)

| Live URL | → |
|---|---|
| `/home` | `/` |
| `/sample-page` | `/` |
| `/who-we-are` | `/about` |
| `/volunteer` | `/get-involved#serve` |
| `/join-our-community` | `/connect-groups` |
| `/guest` | `/im-new#connect-card` |
| `/privacy-policy` | `/privacy` |

These are 301s in `template_redirect` before 404, as a filterable array. Kept pages retain their
live slugs: `/resources`, `/resources/alpha`, `/resources/etracts`, `/church-in-the-park-2025`.
§12 checks every live URL listed in §3 (plus every attachment URL in the export) returns 200 or a
correct 301.

### 6.10 Forms: complete map

| Form | Where | Replaces (live) | Notifies | Entry access |
|---|---|---|---|---|
| Contact | `/contact` | — | contact email (reply-to sender) | Site Manager, Admin |
| Prayer | `/prayer` | — | `prayerInbox` ("URGENT" subject when ticked) | Admin only |
| Gift Aid | `/give#gift-aid` | — | contact email (name + postcode only) | Admin only |
| Newsletter | footer, site-wide | FF 5 (home) + Forminator 53 | none | Site Manager, Admin |
| G-Squad sign-up | `/get-involved#serve` | FF 3 (volunteer) | `welcomeInbox` | Site Manager, Admin |
| Join Group | `/connect-groups` | FF 4 (join-our-community) | group leader + `welcomeInbox` | Site Manager, Admin |
| Plan a Visit | `/im-new#plan-a-visit` | — | `welcomeInbox` + visitor confirmation | Site Manager, Admin |
| Connect card | `/im-new#connect-card` | FF 6 (guest) | `welcomeInbox` | Site Manager, Admin |
| Alpha registration | `/resources/alpha` | FF 7 (same fields, restyled) | as live (from the exported JSON) | Site Manager, Admin |

- **Definitions**: new forms are authored as JSON in `seed/forms/`. Alpha is recreated from its
  live JSON export (Phase 0 step 2), falling back to the fields recovered from the export's cached
  HTML (§3).
- **Entry migration**: Fluent Forms free can't import entries. So migration is done in the local
  database, where we have full access. From the `live-mirror`, copy
  `wp_fluentform_submissions` + `wp_fluentform_entry_details` rows for forms 3, 4, 5, 6 and 7 into
  the new site under the new form IDs, with a field-name map per form, via a script
  `bin/migrate-entries.php` that is run and checked locally. Forminator newsletter entries are
  converted into Newsletter entries. Entry counts before and after are recorded in
  `docs/live-inventory.md`. Anything that can't be mapped is exported to CSV and stored outside
  git.
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
- **Styling**: theme CSS restyles Fluent Forms markup to the redesign (2-col grid, Sora labels,
  green-100 success, destructive errors, pill submit).

## 7. Roles and access

| Role | Can | Cannot |
|---|---|---|
| **Editor** (core) | Pages, events, sermons (incl. publishing imported drafts), series and speakers, connect groups, announcements, media | Settings, menus, templates, form entries |
| **Site Manager** (new) | Everything Editors can, plus `manage_church_settings`, `edit_theme_options` (menus, header/footer parts, templates, patterns in the Site Editor), "Import sermons now", Fluent Forms manager access to the forms marked "Site Manager" in §6.10 | Users, plugins, themes, core settings (`manage_options`), Prayer and Gift Aid entries |
| **Administrator** | Everything, incl. Prayer and Gift Aid entries | — |

- Administrator accounts are limited to the people allowed to see Prayer and Gift Aid (named in
  `docs/go-live.md`, not in git).
- Fluent Forms per-form manager permission is confirmed to exist in the free version
  (`FormManagerService::hasSpecificFormsPermission`). §12 tests that a Site Manager can't reach the
  Prayer or Gift Aid entries by URL.
- Post-type capabilities for `event`, `sermon`, `connect_group` and `announcement` map onto the
  standard post capabilities, so Editors manage them.
- `edit_theme_options` also lets Site Managers edit templates. That is accepted: the Site Editor
  keeps revisions, and "reset to theme default" restores any template.

## 8. Plugins and versions

- **Keep**: Fluent Forms, SmartCrawl, Smush, WPCode (only snippets approved in Phase 0).
- **Add**: FluentSMTP (configured on live), WPvivid Backup (migration; removed after sign-off).
- **Remove**: Elementor, Header Footer Elementor, Essential Addons, Happy Addons, Premium Addons,
  Royal Elementor Addons, Forminator (after its entries are migrated), Hello Elementor.
- **Pinning** (`bin/versions.lock`): WordPress core (currently 7.1.2), each plugin slug@version,
  and Docker images by exact tag and digest (`wordpress:<core>-php8.3-apache`, `wordpress:cli`,
  `mariadb:11.x.y`, `node:22.x`, `axllent/mailpit`, `phpmyadmin`). `setup.sh` installs exactly
  these. Upgrades are deliberate: bump the lock, re-run, test.
- Live must run the same core, PHP and plugin versions as the lock at migration (checked in the
  go-live checklist).

## 9. Seeding and the cut-off

- `bin/seed.sh` builds the whole redesigned site from nothing: pages, patterns, menus, media, forms,
  settings defaults, local-only fixtures (events, groups, sample sermons), front page, and removal
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
2. Re-run Phase 0 (fresh backup into `live-mirror`, WPCode review, entry counts). Run
   `bin/migrate-entries.php` for the entries submitted since the last run. Verify the counts.
3. Confirm live's PHP, core and plugin versions match `versions.lock`; upgrade live first if needed.
4. Package the local site with WPvivid, **excluding** `mu-plugins/local-dev.php`, `import/`,
   `seed/forms/live/` and any other private data. Search-replace `http://localhost:8080` →
   `https://elevationmanchester.org` as part of the restore.
5. Restore over live. Then:
   - Set `WP_ENVIRONMENT_TYPE` to `production`.
   - **Delete the local `admin` account** after creating the named Administrators, and rotate every
     password that existed locally.
   - Create the Site Manager and Editor accounts (§7).
   - Configure FluentSMTP with Resend and the YouTube API key.
   - Re-add only the approved WPCode snippets. Resave permalinks.
6. **Smoke test**: every live URL from §3 (200 or correct 301), every form end to end (a real
   email arrives at the right inbox), the announcement, live status, the sermon import, and the
   Site Manager access limits.
7. Maintenance mode off. Keep the pre-migration backup until sign-off.
8. **After sign-off**: delete every backup and migration file that contains form data (WPvivid
   backups on the server and downloaded copies, the `live-mirror` volumes, CSV exports), because
   they contain prayer and Gift Aid data. Remove WPvivid. Record the deletion date.

## 11. Privacy notice

The notice is written after Phase 0 step 5. It names the actual processors: the host (the parent
church, via Liquid Web), Resend (email via FluentSMTP), Google Maps and YouTube (both click-gated),
and HMRC. It covers the WordPress login cookie for staff only, the new data sets (visit plans,
connect cards, group join requests, Alpha registrations, G-Squad sign-ups) with their purpose,
lawful basis and retention, and Gift Aid retention of six years after the last gift. If Phase 0
finds tracking that must stay, the "no cookie banner" position is revisited before writing, not
after.

## 12. Testing and definition of done

- **PHPUnit** (pure functions): `Event_Time` (London midnight boundary, BST/GMT change, multi-day
  in progress, TBC, same-day range), Gift Aid validators and postcode normaliser, the next-8-service-
  dates generator, the sermon importer's "should import" rule (live/upcoming/known-ID exclusions),
  the entry field maps in `migrate-entries.php`, the redirect map, and settings token replacement
  (unknown keys and escaping).
- **Visual parity with matching data**: run the redesign against a **local Supabase**
  (`supabase start`, apply its migrations, load `seed/fixtures/` = the same events, announcement and
  settings the WordPress seed uses). Compare every page at 1440px and 390px. For sermons, connect
  groups and visit plans (new, with no redesign equivalent), compare against the redesign's design
  language, and review them with the user instead.
- **Behaviour**: header states and the 1024px breakpoint, overlay focus/Escape/scroll lock, About
  dropdown, slideshow and reduced motion, reveal, calendar, announcement show/dismiss/re-show and
  activation within one page view despite `max-age=600`, live-status swap via REST, consent
  gate and controls, sermon import (a mocked YouTube response), directory filters, the Join Group
  pre-selection, and every §6.9 redirect plus every live URL.
- **Forms**: every form submitted locally. **Mailpit** shows each notification with the right
  recipient, subject and reply-to (including the urgent prayer subject, the group-leader routing
  and the visitor confirmation). Validation messages for each rule. The postcode is stored
  normalised. The Site Manager can't open the Prayer or Gift Aid entries. Gift Aid entry deletion
  is blocked.
- **Entry migration dry run** against the `live-mirror`, with counts matching.
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
