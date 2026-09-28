# Live site inventory (Phase 0)

Source: WPvivid full backup of https://elevationmanchester.org taken 2026-09-28 22:17 UTC, restored
into the isolated `elevation-mirror` database (`docker-compose.mirror.yml`). The raw backup lives in
`private/live-backup/2026-09-28/` (gitignored; contains personal data; delete after go-live
sign-off).

This file records structure, configuration and counts only. No submission contents, names or
email addresses belong here.

## Platform

| Item | Live | Local (current) | Note |
|---|---|---|---|
| WordPress | 6.8.10 | 7.1.2 | A full-site migration also replaces core, so live becomes the local version |
| PHP | 8.3.30 | 8.3 | matches |
| Database | MariaDB 10.6.28 | MariaDB 11 | **must pin local to 10.6**: MariaDB 11 collations (`uca1400`) don't import into 10.6 |
| Table prefix | `wp6d_` | `wp_` | pin local to `wp6d_` so migration needs no prefix rewrite |
| Hosting | cPanel (`.htaccess` has cPanel PHP directives), Apache, Liquid Web, run by the parent church (`host02.elevationchurchng.org`) | Docker | |
| PHP limits | upload 256M, post 256M, memory 512M, max_execution 300s | | |
| Permalinks | `/%year%/%monthnum%/%day%/%postname%/` | `/%postname%/` | only affects blog posts; there are none, so no URL changes |
| Timezone | empty (UTC) | Europe/London | |
| Page cache | Hummingbird page cache **disabled**; browser caching sends `max-age=600` | | |

## Active plugins on live (26)

| Plugin | Status / licence | Fate |
|---|---|---|
| Elementor, Essential Addons, Happy Addons, Premium Addons, Royal Elementor Addons, Header Footer Elementor | free | remove (block theme) |
| Hello Elementor (theme) | free | remove |
| Fluent Forms 6.0.4 | free | keep |
| Fluent Forms Pro 5.1.6 | **licence valid** | decision needed |
| Forminator | free; 1 form, **0 entries** | remove |
| Hustle (WPMU DEV) | 1 popup "Small Group", inactive, 0 entries | remove |
| Defender, Hummingbird, Smush Pro, SmartCrawl (`wpmu-dev-seo`), Ultimate Branding, WPMU DEV Dashboard, WP Admin Notification Center | WPMU DEV membership **expired** (2025-10-23): no updates | decision needed |
| Google Site Kit | GA4 `G-0Q3764FCYN`, snippet **on**; PageSpeed module | decision needed |
| CookieYes (`cookie-law-info`) | GDPR banner **active**, 0 cookies catalogued | decision needed |
| WPCode | 1 active snippet (Allow SVG upload, admin only); 2 drafts; the header box has a Google Ads tag `AW-956488082` that is **commented out** (inactive) | remove (SVG handled by `elevation-core`) |
| Redirection | 10 live short links (below) | keep |
| Really Simple SSL | free | review (HTTPS redirect may be done by the server) |
| Akismet, Hello Dolly, Astra Sites (starter templates), Migrate Guru | free | remove |
| WPvivid Backup | free | keep until go-live sign-off |

## Content

11 pages published (as the XML export), 2 `elementor-hf`, 2 `elementor_library`, 6 menu items, no
blog posts, no comments of note.

## Users

3 accounts, all **administrator** (including a parent-church IT support account). Their logins must
survive the migration (see spec §10).

## Forms and entries

| ID | Title on live | Page | Entries | Date range | Notification |
|---|---|---|---|---|---|
| 1 | Contact Form Demo | — | 0 | — | — |
| 2 | Subscription Form | — | 0 | — | — |
| 3 | Volunteer Form | /volunteer | 21 | 2023-05 → 2026-05 | **disabled** |
| 4 | Reserve a seat Form | /join-our-community | 27 | 2023-05 → 2025-11 | **disabled** |
| 5 | Newsletter Form | / (home) | 134 | 2023-05 → 2026-09 | **disabled** |
| 6 | Guest Form | /guest | 0 | — | — |
| 7 | Alpha Course sign up form | /resources/alpha | 1 | 2025-08 | enabled, to a personal Gmail address |
| Forminator 53 | newsletter-subscription | not embedded | 0 | — | — |

Field keys stored (for the entry migration map):

- 3 and 4: `names`, `email`, `subject` (labelled "Phone number"), `message` (labelled "Your home
  address" on 3).
- 5: `email`.
- 7: `names`, `input_text_2` (phone), `email`, `input_radio` (gender), `dropdown` (age range),
  `input_radio_1` (visited before), `input_radio_2` (how heard), `input_radio_3` (consent).
- `ak_js` is Akismet noise; drop it.

**Staff follow-up**: with notifications off, the 21 volunteer sign-ups and 27 seat reservations were
only visible in wp-admin. Worth checking whether they were ever actioned.

## Redirects (Redirection plugin, all 301)

| From | To | Hits |
|---|---|---|
| `/fyv/` | Eventbrite "Good Taste Sunday" | 1228 |
| `/lane7` | Google Form | 656 |
| `/settledin/` | Zoom webinar registration | 345 |
| `/free-resources/` | `/resources/` | 254 |
| `/dreamjobuk` | Zoom webinar registration | 215 |
| `/godlyparentingseries` | Zoom meeting | 151 |
| `/hu/` | Eventbrite "Hearts United" | 31 |
| `/jewels` | Zoom webinar registration | 2 |
| `/gts` | Microsoft Form | 2 |
| `/resources/e-tracts/` | `/resources/etracts/` | 0 |

SmartCrawl has no redirects. The Redirection 404 log is mostly bot probes (`/.env`, `/.git/config`,
`/xmlrpc.php`), with no missing real pages.
