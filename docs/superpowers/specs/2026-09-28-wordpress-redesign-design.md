# Elevation Church Manchester — WordPress redesign

Date: 2026-09-28
Status: approved design, awaiting spec review

## 1. Goal

Rebuild the local WordPress copy of elevationmanchester.org so it looks and behaves like the
Next.js redesign in `~/Projects.nosync/website` (reference commit `e0cf43e`), then replace the live
site with it in a single migration.

Success means:

- Every public page of the redesign exists in WordPress and matches it visually, side by side at
  desktop (1440px) and mobile (390px) widths.
- Church staff can edit every page, menu, event, announcement and setting in standard WordPress
  admin, without a page builder and without a developer.
- The site can be rebuilt from scratch reproducibly (`bin/seed.sh`) right up to go-live.
- Old URLs keep working, via redirects or retained pages.

Reference material: `2026-09-28-redesign-inventory.md` (next to this file) has the per-page section
inventory, component specs, verbatim copy, settings defaults and data models. Where this spec
says "as the redesign", that inventory, and ultimately the redesign source, is authoritative.

## 2. Decisions

| Decision | Choice |
|---|---|
| Build method | Custom block theme (Site Editor, `theme.json`, patterns). No Elementor. |
| Structure | `elevation` theme (presentation) + `elevation-core` plugin (functionality) |
| Go-live | Replace the whole live site with the finished local site in one migration |
| Features at launch | Events + calendar, forms, YouTube live/latest, announcement popup |
| Old pages | Redirect replaced pages; keep Resources, Alpha, ETracts and Church in the Park 2025, restyled |
| Forms | Fluent Forms (free), styled by the theme |
| Email on live | FluentSMTP → existing Resend account |

## 3. Repository layout

Everything lives in `~/Projects.nosync/elevationmanchester` (the Docker environment set up earlier).

```
wp-content/
  themes/elevation/
    theme.json
    style.css                 theme header only
    functions.php             enqueue assets, register pattern categories + block styles
    templates/                front-page, page, single-event, archive-event, 404, index, search
    parts/                    header.html, footer.html
    patterns/                 section patterns (§5.3), one PHP file each
    assets/fonts/             Sora (400–800) + Inter (variable), woff2, self-hosted
    assets/css/               only what theme.json cannot express (header states, reveal, cards)
    assets/js/                header scroll/mobile-menu, reveal, hero slideshow view scripts
  plugins/elevation-core/
    elevation-core.php
    includes/                 settings, bindings, post types, events time logic, YouTube client,
                              announcements, forms glue, redirects, rate limit
    src/blocks/<name>/        block.json + edit.js + render.php (+ view.js where interactive)
    build/                    compiled with @wordpress/scripts, committed
    tests/                    PHPUnit (wp-env-free: plain PHPUnit against pure functions)
    package.json
  mu-plugins/local-dev.php    existing, local only
bin/
  setup.sh, post-import.sh    existing
  seed.sh                     new: builds the redesigned site (§8)
seed/                         images copied from the redesign, form definitions (JSON), page content
docs/go-live.md               go-live checklist (§9)
```

Git tracks only our code (`themes/elevation`, `plugins/elevation-core`, `mu-plugins`, `bin`, `seed`,
`docs`, Docker config). Third-party plugins, uploads and core are ignored; `.gitignore` is updated
to allow-list our directories.

Node is only needed to build blocks. `build/` is committed so the live server never needs Node.
The build runs in a `node:22` container (a `docker compose run node …` service) so the host's Node
version does not matter.

## 4. Design tokens (`theme.json`)

Values come from `website/src/app/globals.css` and the inventory §0.

- **Palette** (slugs): `green #84C224` (fills, glows, rules, never text on white), `green-600 #6FA61C`
  (text-safe green), `green-100 #EAF6D6`, `ink #0E0E2C`, `ink-800 #1B1F29`, `grey-50 #F7F8F5`,
  `grey-100 #F1F1EF`, `grey-300 #D7D9D6`, `grey-500 #676767`, `grey-700 #4B4F58`, `white`.
  Default palette, gradients and duotones are disabled so editors only see brand colours.
- **Typography**: Inter (body, `grey-700`, line-height 1.625). Sora for h1–h4 (line-height 1.1,
  letter-spacing −0.02em, colour ink). Fluid sizes: hero `clamp(42px,6vw,76px)`, page hero
  `clamp(34px,5vw,54px)`, section h2 `clamp(30px,4vw,46px)`, plus the named steps used in cards
  (21, 20, 19, 18, 15, 14, 12px).
- **Layout**: `contentSize` 760px (reading width), `wideSize` 1240px, 24px root side padding.
  Section vertical rhythm: 64px mobile / 96px desktop.
- **Shadows**: `card` `0 10px 30px rgb(14 14 44/.08)`, `card-lg` `0 24px 60px rgb(14 14 44/.16)`.
- **Buttons**: pill, Sora 600, 15px, padding 13×24 (large: 16px, 16×30), 2px hover lift under
  `prefers-reduced-motion: no-preference`, 2px green-600 focus outline. Block styles on
  `core/button`: `green` (default), `navy`, `ghost`, `ghost-on-dark`. Plus a `lg` size style.
- **Other block styles**: `core/paragraph` → `eyebrow` and `eyebrow-on-ink`; `core/group` →
  `card`, `card-ink`, `strip-green`; `core/image` → `rounded-2xl`.
- **Motion**: `.reveal` fade-up (0.7s) via IntersectionObserver, skipped under reduced motion,
  content visible without JS, as the redesign's `reveal.tsx`.

## 5. Theme

### 5.1 Header (`parts/header.html` + `assets/js/header.js`)

- Sticky, 76px high (88px ≥640px). Logo on the left (colour and white variants stacked for the
  crossfade), core Navigation block, then "Plan a Visit" (ghost) and "Give" (green) buttons.
- States as the redesign: on the front page before 80px of scroll, the header is transparent with
  white links and the white logo, and the hero sits under it. Otherwise it is white/92 with backdrop
  blur, ink links and a shadow once scrolled. The active link is green.
- Mobile (<1024px): a full-screen ink overlay sliding in from the right (350ms), with Sora 26px
  links, "Sundays at 10:30am" (bound to settings), and full-width Plan a Visit / Give buttons. It
  locks scroll, closes on Escape and link click, and is `inert` when closed. Built by styling the
  core Navigation overlay; custom JS only for states core does not provide.
- Menu (editable in Site Editor): I'm New, About (sub-items: Our Story `/about#our-story`,
  Vision & Values `#vision-values`, Leadership `#leadership`, What We Believe
  `/about/what-we-believe`), Watch, Events, Get Involved, Prayer, Contact. The About sub-menu is
  rendered: a desktop dropdown and an indented mobile list. The redesign defined it but never
  rendered it.
- Skip link to `#main`.

### 5.2 Footer (`parts/footer.html`)

As the redesign (inventory §2 site-footer, §7): ink-800 background, a brand column (white logo,
mission, social icon buttons), three link columns (Visit / Explore / Connect), the practical strip
(time, address, email, phone; all bound to settings), and a bottom bar with © year, "An expression
of The Elevation Church.", Privacy & cookies, and the charity number.

### 5.3 Patterns

Built from core blocks plus the block styles above, and registered in an "Elevation" pattern
category so staff can compose new pages.

| Pattern | Notes |
|---|---|
| `page-hero` | Ink, top-right glow, eyebrow + h1 + lead |
| `section-heading` | Eyebrow, h2, lead; left/centre; default/on-ink variants |
| `home-hero` | Uses the `hero-slideshow` block; headline with green "common.", 2 CTAs, service/location info list |
| `image-cards-3` | 4:3 image, overhanging icon badge, title, body, arrow CTA (I'm New cards) |
| `ink-cards-4` | Icon tile + title + body on ink (Get involved) |
| `info-cards` | Icon + h3 + body, 3-up (I'm New FAQs) |
| `values-grid` | Letter + value name cards |
| `badge-cloud` | Pill badges (personality, serve teams) |
| `growth-track` | Numbered 2-col list with a green left rule |
| `two-col-text-media` | Text column + image/map/card column |
| `cta-band` | Ink section, title, lead, 1–2 buttons |
| `sunday-strip` | green-100 strip: "Every week / Sunday Gathering", time + place, button |
| `give-cards` | Give-online card (spans 2) + Gift Aid ink card; bank + cheque cards |
| `aside-boxes` | Grey info boxes + destructive emergency box (Prayer), contact aside |
| `accordion` | Core Details blocks styled as the redesign's accordion, open by default where specified |
| `leadership` | Uses the `leadership-grid` block |
| `rich-text-section` | Constrained reading-width prose (Privacy, campaign pages) |

Icons: Lucide SVGs inlined via a small `elevation/icon` block (name + size), so editors can pick an
icon without HTML.

### 5.4 Templates

- `front-page.html`: header in overlay mode + post content.
- `page.html`: header + post content (pages start with a `page-hero` pattern) + footer.
- `archive-event.html` / `single-event.html`: as the redesign's events index and detail (§6.2).
- `404.html`: ink page hero ("Page not found") + links to Home, I'm New and Contact. The redesign
  has none.
- `index.html`, `search.html`: minimal fallbacks.

### 5.5 Pages

All copy is verbatim from the redesign (inventory §1).

| Page | Slug | Source |
|---|---|---|
| Home | `/` (front page) | redesign `/` |
| I'm New | `/im-new` | redesign; adds the missing ids `what-to-expect`, `find-us`, `kids` |
| About | `/about` | redesign; ids `our-story`, `vision-values`, `leadership` |
| What We Believe | `/about/what-we-believe` | redesign |
| Watch | `/watch` | redesign (§6.3 blocks) |
| Events | `/events` | event post type archive (§6.2) |
| Get Involved | `/get-involved` | redesign; ids `connect-groups`, `serve`, `kids-and-teens`, `support`, `next-steps` |
| Give | `/give` | redesign; id `gift-aid` |
| Prayer | `/prayer` | redesign |
| Contact | `/contact` | redesign |
| Privacy | `/privacy` | redesign (full notice, with WordPress-appropriate processors; see §10) |
| Resources | `/resources` | existing; rebuilt as a page hero + cards linking to its children |
| Alpha | `/resources/alpha` | existing text + images, rebuilt in patterns |
| ETracts | `/resources/etracts` | existing text + images, rebuilt in patterns |
| Church in the Park 2025 | `/church-in-the-park-2025` | existing text + images, rebuilt in patterns |

Deleted: `home` (Elementor), `who-we-are`, `volunteer`, `join-our-community`, `guest`,
`privacy-policy-2`, `sample-page-2`, Elementor templates, header/footer (`elementor-hf`) posts,
Elementor kits.

## 6. Plugin: `elevation-core`

### 6.1 Church Settings

- One settings page (Settings → Church), stored as a single option `elevation_settings`, with
  groups and defaults exactly as `website/src/lib/church.ts` (inventory §3): church, service,
  location, contact (plus `prayerInbox`, defaulting to `contact.email`, replacing the redesign's
  `PRAYER_INBOX` env var), socials, giving, hero slides (media ID, focal point, alt), YouTube (API key,
  channel handle).
- Derived values are computed, not stored: `location.full`, `mapsUrl`, `embedUrl`.
- The screen is built with the Settings API. Only users with `manage_options` can edit it. The
  YouTube key is stored but never output to the front end.
- Block Bindings source `elevation/settings` (args `{ key: "service.startTime" }`) lets core
  Paragraph, Heading and Button (text and URL) show settings. PHP helper
  `elevation_setting( 'location.full' )` for templates and blocks.
- Leadership, values, beliefs, growth track, serve teams and support ministries are page content
  (editable blocks), not settings. The redesign hard-codes them; in WordPress they are just
  content.

### 6.2 Events

- Post type `event`: public, `has_archive` → `/events/`, singular `/events/{slug}/`, supports
  title, editor (description), excerpt (summary), thumbnail. `show_in_rest`.
- Meta (registered, REST-exposed, edited in a sidebar panel): `start` (datetime, required), `end`
  (datetime, optional, ≥ start, may be another day), `time_tbc` (bool), `venue` (string; empty
  falls back to the settings venue), `cta_label`, `cta_url` (must start with `https://` or `/`).
- Time logic lives in one PHP class (`Event_Time`), all in Europe/London:
  - upcoming = end (or start, if no end) ≥ today 00:00 London. A multi-day event already in
    progress stays upcoming, which fixes the redesign bug.
  - `format_time`: "Time to be confirmed" if TBC; "7:00 pm" or "7:00 pm – 9:30 pm" if same-day;
    start time only if multi-day.
  - `format_date` "Sunday 5 October 2026", `format_range` "18 Oct – 20 Oct", `date_key`
    `Y-m-d`.
- Blocks:
  - `elevation/event-grid` (limit 1–24, upcoming only, `EventCard` markup with date chip, hover
    lift).
  - `elevation/home-events` (heading row + up to 3 cards + Sunday strip; empty state with
    "Sunday Gathering" ink card and "More coming soon" card linking to Instagram from settings).
  - `elevation/event-calendar` (interactive month view; view script; data = all published events'
    date keys, titles, times and URLs, embedded as JSON; opens on the next event's month).
  - `elevation/event-meta` (single event hero meta row: date/range, time, venue, CTA).
- `archive-event.html`: page hero "What's on / Events & gatherings", Sunday strip, then a 2-col
  layout: event grid (or empty state) + sticky calendar aside with caption.
- `single-event.html`: dark hero with featured image at 40% opacity + "← All events", title,
  summary, meta row, CTA; body + "Getting there" aside (venue lines, Get directions, Ask a
  question); "More events" (up to 3 others) on grey.
- Seeded with the redesign's 3 sample events (images from `website/public/events/`), dated in the
  future relative to seeding.

### 6.3 YouTube

- `YouTube_Client`: resolves the channel handle → uploads playlist ID (transient, 1 day), then
  `playlistItems.list` + `videos.list` (2 units per refresh, transient 60s). It classifies each
  video as live, upcoming or none, and returns the duration, thumbnail and scheduled start. Every
  failure returns empty results and logs once. Nothing throws to the page.
- Blocks:
  - `elevation/home-watch` (grey section, 16:9 thumbnail tile with live badge or chip and play
    button, title, copy, "Watch now/live" + "All messages"; no-key/failed fallbacks as the
    redesign).
  - `elevation/live-player` (live embed inside the consent gate; or the upcoming-stream strip;
    renders nothing if neither).
  - `elevation/video-grid` (recent past messages, default 12, plus "See everything on YouTube";
    fallback panel with the two redesign messages for "no key" vs "fetch failed").
  - `elevation/watch-hero` (page hero whose title and lead switch when live).
- Embeds use `youtube-nocookie.com`.

### 6.4 Announcements

- Post type `announcement` (not public; admin only). Fields: title, body (plain text), featured
  image, `cta_label`, `cta_url`, `active` (bool), `starts_at`, `ends_at`, `dismiss_hours` (1–720,
  default 24).
- Selection: active, within its window (null = open-ended), newest modified wins. Saving one as
  active deactivates the others.
- Rendered once, site-wide, in `wp_footer` as a `<dialog>`-based modal with the redesign's styling.
  A view script opens it after load unless `localStorage["ecm-announcement-{id}-{modifiedTs}"]` is
  younger than `dismiss_hours`. Every way of closing it records a dismissal.
- The modal's time check uses the browser clock (not a server timestamp), so page caching cannot
  make it stale.

### 6.5 Consent gate

- `elevation/embed-gate` block: kind `map` | `video`, title, and an inner embed URL. It renders a
  placeholder (icon, title, "Show the map" / "Play the video", "Loads from …" note) and injects the
  iframe on click, or immediately if `localStorage["ecm.consent.embeds"] === "granted"`. It listens
  for `ecm:consent-changed` and `storage` events.
- `elevation/consent-controls` block (Privacy page): status + "Allow maps & videos", "Keep them
  off", "Clear my choice".
- No cookie banner, as the redesign.

### 6.6 Other blocks

- `elevation/hero-slideshow`: slides from settings, 6.5s interval, 1.2s crossfade, Ken Burns 9s on
  the active slide, three scrims. It pauses when the tab is hidden, shows a static first slide under
  reduced motion, and needs no controls. The first image is `fetchpriority=high`, the others
  lazy-load, and `srcset` comes from WordPress image sizes.
- `elevation/leadership-grid`: repeater of media + name + role + bio (editable in the block);
  4:5 portraits with a gradient name overlay.
- `elevation/icon`: Lucide icon by name (a small allow-listed set used by the patterns).
- `elevation/social-links`: icon buttons from settings (footer, contact aside).

### 6.7 Redirects

A 301 map in the plugin (a filterable PHP array, `template_redirect`, before 404):

| From | To |
|---|---|
| `/who-we-are` | `/about` |
| `/volunteer` | `/get-involved#serve` |
| `/join-our-community` | `/get-involved#connect-groups` |
| `/guest` | `/im-new` |
| `/privacy-policy-2`, `/privacy-policy` | `/privacy` |

### 6.8 Forms (Fluent Forms)

- Four forms defined as Fluent Forms export JSON in `seed/forms/` and imported by `seed.sh`:
  Contact, Prayer, Gift Aid, Newsletter. Fields, labels, placeholders, hints, required rules,
  validation messages and success messages are verbatim from inventory §6.
- The theme stylesheet restyles Fluent Forms markup to the redesign: 2-col field grid, Sora labels,
  rounded inputs, green-100 success box, destructive error box, pill submit button.
- `elevation-core` adds server-side rules Fluent Forms cannot express, via its validation filters:
  - Gift Aid: first name ≥2 characters after stripping dots and spaces ("HMRC needs your full first
    name, not an initial."), surname ≥2, address includes a house name or number, UK postcode
    regex with normalisation to "AA9 9AA" format, declaration ticked. It stores the HMRC declaration
    text and version `hmrc-2016-enduring-v1` in hidden fields.
  - Rate limit: 5 submissions per 10 minutes per IP per form (transient-based), with the
    redesign's message.
  - Honeypot: Fluent Forms' built-in honeypot enabled on all four.
- Notifications: Contact → contact inbox (reply-to = sender, subject "Website enquiry:
  {subject}"). Prayer → prayer inbox (subject "URGENT prayer request" when urgent is ticked,
  otherwise "New prayer request"). Gift Aid → contact inbox, name + postcode only. Newsletter → no
  email. Recipients are Church Settings fields (`contact.email` default, `contact.prayerInbox`).
- Blocks on pages use the Fluent Forms block/shortcode inside the redesign's containers (Gift Aid
  in a white card, Newsletter in an ink panel).

### 6.9 Roles and access

- Content staff: WordPress **Editor** (pages, events, announcements, media) plus Fluent Forms
  specific-form manager access to the Contact and Newsletter forms only.
- Prayer and Gift Aid entries: visible only to named Administrators. Administrators see all
  entries, so Administrator is kept to the people allowed to see them.
- The plugin maps the `announcement` and `event` capabilities onto the standard post capabilities,
  so Editors manage both.

## 7. Plugins after the rebuild

- Keep: Fluent Forms, SmartCrawl (SEO), Smush, WPCode, WordPress Importer (local only).
- Add: FluentSMTP (installed and configured on live only).
- Remove: Elementor, Header Footer Elementor, Essential Addons, Happy Addons, Premium Addons,
  Royal Elementor Addons, Forminator (its one form is replaced), Hello Elementor theme.
- The `wpr-media-grid` and `premium-img-gallery` content on the kept campaign pages becomes core
  Gallery blocks.

## 8. Seeding (`bin/seed.sh`)

Idempotent (safe to re-run; it looks items up by slug or title before creating). Steps:

1. Build blocks (`docker compose run --rm node npm ci && npm run build`) if `build/` is stale.
2. Activate the `elevation` theme and the `elevation-core` plugin; deactivate and delete the
   plugins in the §7 "remove" list.
3. Import `seed/media/*` (hero, im-new, leadership, events, brand) with alt text; record IDs.
4. Write Church Settings defaults (only fields that are unset).
5. Create or update the pages in §5.5 from `seed/pages/*.html` (block markup), replacing media
   placeholders with the IDs from step 3. Set the front page. Delete the pages listed as deleted.
6. Create the Navigation menu (header) and footer link menus.
7. Import the forms (`seed/forms/*.json`) and substitute their IDs into the Contact, Prayer and Give
   pages.
8. Create the sample events.
9. Flush rewrites and caches.

`bin/setup.sh` gains a final `./bin/seed.sh`, so one command goes from an empty Docker environment
to the finished site.

## 9. Go-live (`docs/go-live.md`, executed later, not part of this build)

1. Before overwriting live, export from live everything local does not have: Fluent Forms entries,
   WPCode snippets, SmartCrawl settings, users who must keep their logins.
2. Announce a content freeze; take a full live backup (files + DB) and keep it.
3. Package the local site (All-in-One WP Migration or Duplicator), restore it over live, and
   search-replace `http://localhost:8080` → `https://elevationmanchester.org`.
4. On live: configure FluentSMTP with Resend, add the YouTube API key, re-import the WPCode
   snippets, resave permalinks, set `WP_ENVIRONMENT_TYPE` to `production` (which disables
   `local-dev.php`), and create staff accounts per §6.9.
5. Smoke test: every page, every redirect, each form end to end (a real email arrives), the
   announcement modal, the YouTube section. Keep the backup until signed off.

## 10. Privacy notice changes

The redesign's notice names Supabase, Vercel and Resend. The WordPress version names the actual
processors: the web host (TBC at go-live), Resend (email delivery via FluentSMTP), Google (maps,
click-gated), YouTube (click-gated) and HMRC. It states that WordPress sets a login cookie for staff
only. Everything else is kept (retention, rights, ICO). "Last updated" is set at go-live.

## 11. Testing and definition of done

- **PHPUnit** (plugin, pure functions, no WordPress bootstrap needed): `Event_Time` (upcoming
  boundary at London midnight, BST/GMT change, multi-day in progress, TBC, same-day range) and the
  Gift Aid validators (initial-only first name, missing house number, postcode normalisation, bad
  postcode).
- **Visual parity**: the redesign runs locally (`npm run dev`, port 4000). Each page is screenshotted
  at 1440px and 390px in both sites and compared side by side. Differences are fixed or listed and
  accepted.
- **Behaviour checks in the browser**: header transparent→solid on scroll, mobile menu (focus,
  Escape, scroll lock), About dropdown, slideshow (and reduced motion), reveal, calendar
  navigation and selection, announcement show/dismiss/re-show after edit, consent gate + controls,
  YouTube fallbacks with no key, all §6.7 redirects, anchors from home and footer.
- **Forms**: each submitted locally; entries visible to the right roles only; validation messages
  for each rule.
- **Hygiene**: no PHP warnings in `wp-content/debug.log`, no console errors, Lighthouse
  accessibility ≥ 95 on Home, I'm New and Give; WCAG AA colour contrast (no green text on white
  except green-600).
- `bin/setup.sh` from a wiped environment (`docker compose down -v`) produces the finished site
  with no manual steps.

## 12. Out of scope

- Doing the live migration itself (checklist only).
- Staff approval workflow, custom role builder and audit log from the redesign's admin. WordPress
  users, roles and revisions cover this.
- Sermons/series, connect-group directory, visit plans (unused tables in the redesign).
- Double opt-in newsletter or a mailing-list integration. Entries are collected in Fluent Forms for
  now, as in the redesign.
- New photography. The redesign's images are used as-is.
