# SDD ledger — plan: docs/superpowers/plans/2026-09-29-plan-3-events.md

Spec: docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md (§6.2). Branch plan-3-events off plan-1-foundation (cee582c); plan committed at 5f2fc50.

## Pre-flight scan

| Pair / task | Produces → consumes | Finding |
|---|---|---|
| T1 → T2 | EventTime::untilKey/todayKey/parse → events.php sync + queries | signatures match |
| T1 → T4 | EventTime::TZ → Fixtures::when | match |
| T1 → T5/T6/T7 | formatTime/formatRange/formatDate/dayNumber/monthShort/dayKeys/dateKey | names match |
| T2 → T3 | meta keys event_start/end/time_tbc/venue/cta_label/cta_url; REST 400 messages | JS okUrl mirrors EventFields::normaliseCtaUrl; messages identical |
| T2 → T4 | EventFields::errors/normaliseDateTime; post type | match |
| T2 → T5/T6/T7/T8 | elevation_event(), elevation_upcoming_events(), elevation_calendar_events() | match |
| T4 → T5/T7/T9 | fixture slugs (leadership-weekend, men-of-honour, baptism-sunday, greatness-community-hangout, prayer-and-worship-evening) | T5 probe expectation (2 placeholders) depends on leadership-weekend having no image: true in fixtures |
| T4 ↔ existing cli.php | elevation_seed_media_lookup() | defined in includes/cli.php (CLI only); fixtures-cli.php is CLI only and required after cli.php |
| T5 → T6 | chevron icons, events.css | T6 appends to events.css created in T5 |
| T5 → T7 | elevation_event_maps_url, hide-if-no-events filter, event-grid block | match |
| T5 → T8 | elevation_event_card | match |
| T6 → T7 | event-calendar block used in archive template | match |
| T7 → T8 | validator covers templates (local-dev.php) | T8 relies on validator run; fine |
| T1 self | tests vs code | test weekdays verified with `date`: 5 Oct 2026 Monday, 18 Oct Sunday, 1 Oct Thursday, 1 Feb 2027 Monday, 1 Nov Sunday |
| T2 self | Step 7 expected REST outputs vs EventFields messages | consistent |
| T3 self | panel vs editor.php inline data | consistent |
| T4 self | FixturesTest vs Fixtures | consistent (+0 → 25 Oct from 23:30Z 24 Oct) |
| T5 self | IconsTest count 24 vs NAMES list (24) | consistent |
| T6 self | model tests vs model | consistent |
| T7 self | template markup vs CSS classes | consistent |
| T8 self | home.html splice vs file (lines ~206/250) | consistent |
| T9 self | hash count 21 = 14 pages + 7 events | consistent |

No conflicts with Global Constraints found; no plan-mandated rubric defects found.

## Tasks
Task 1: implementer a6be9839f81daf738 (haiku), BASE 5f2fc50, commit 51abfe1
Task 1: Ruling: plan-mandated untilKey/isUpcoming return a date when start is unparseable but end is valid — fix: untilKey returns '' when start key is '' (+ test) — the brief's own interface contract says '' for unparseable start; cost if wrong: none (published events always have a valid start)
Task 1: minor (deferred): isMultiDay true when end date is before start (formatRange would print "18 Oct – 17 Oct"); unreachable for published events because EventFields rejects end<start
Task 1: minor (deferred): parse() regex `$` accepts a trailing "\n" (use \z/D)
Task 1: minor (deferred): nonexistent spring-forward London times (e.g. 2026-03-29T01:30) silently shift
Task 1: minor (deferred): thin DST coverage — no dayKeys test across 25 Oct clock change, no formatTime end at 00:00, no formatRange invalid-start test
Task 1: fix round 1/5 (1 addressed, 0 open; commits 51abfe1..aeb7703)
Task 1: complete (commits 5f2fc50..aeb7703, review clean)
Task 2: BASE aeb7703
Task 2: implementer a1da897ce7eadb5e7 (sonnet), commit 23945c2 (trailer amended from b8c372f)
Task 2: Ruling: _event_until stays unregistered for REST (brief's interface list implied show_in_rest, its code doesn't) — a derived key must not be writable from outside; cost if wrong: none, nothing reads it over REST
Task 2: minor (deferred): admin "Starts" sort (events.php:170-175) inner-joins event_start so start-less drafts vanish when sorted; no post_type check in the pre_get_posts filter
Task 2: minor (deferred): elevation_calendar_events caps at 500 oldest-first, so newest would be dropped past the cap; consider limiting to recent/future
Task 2: minor (deferred): suppress_filters differs between upcoming (false) and calendar (default true) queries
Task 2: minor (deferred): publish validation is REST-only; Quick Edit / bulk publish can publish a start-less event (it then never shows); consider a transition_post_status guard or document
Task 2: minor (deferred): ELEVATION_EVENT_META and $sanitisers duplicate the key list
Task 2: minor (deferred): CTA URL check doesn't reject control chars (esc_url strips on output)
Task 2: minor (deferred): no automated tests for sync hooks/queries/REST filter (manual probes only)
Task 2: complete (commits aeb7703..23945c2, review clean)
Task 3: BASE 23945c2
Task 3: implementer a00d7a61dab3236a9 (sonnet), commit bdf1861; browser check deferred (no wp-admin sign-in)
Task 3: Ruling: plan-mandated okUrl path branch lacks the server's whitespace rule — fix to mirror EventFields::normaliseCtaUrl exactly — client/server disagreement is the defect the panel exists to prevent; cost if wrong: none
Task 3: Ruling: plan-mandated label()/toMinutes throw RangeError on a malformed stored date — guard (only accept ^\d{4}-\d\d-\d\dT\d\d:\d\d, else treat as not set/raw) — a crash takes down the editor sidebar; cost if wrong: none
Task 3: Ruling: promote reviewer Minor 1 (useEntityProp('postType','event','meta') runs on every post type → REST fetch of /wp/v2/event/<page id> 404s in the page editor) to Important — spec §12 hygiene requires no console errors; fix with a wrapper that mounts the panel only for events; cost if wrong: a few lines
Task 3: minor (deferred): ternary expression-statement for lock/unlock (lint no-unused-expressions); useEffect deps omit lock/unlock; label uses 24h "19:00" while picker is 12h; missing-start warning doesn't lock (server enforces)
Task 3: ⚠️ deferred to browser check: DateTimePicker wall-clock round-trip under a non-London browser timezone
Task 3: fix round 1/5 (3 addressed, 0 open; commits bdf1861..19066a6)
Task 3: complete (commits 23945c2..19066a6, review clean)
Task 4: BASE 19066a6
Task 4: implementer a7db7cf31703a599d (sonnet), commit 30476e6; controller verified SmartCrawl titles on /events/ and /events/men-of-honour/
Task 4: ⚠️ resolved by controller — seed.sh wp() passes --user="$WP_ADMIN_USER"; publish validation is REST-only so CLI inserts aren't blocked; title-event confirmed by rendered <title>
Task 4: minor (deferred): `fixtures remove` uses post_status any (misses trashed fixtures, relevant to Plan 6 go-live cleanup); lookup at fixtures-cli.php:78 also excludes trash — consider [any, trash] + post_type event
Task 4: minor (deferred): non-scalar JSON values cast with (string) → "Array" warning; add is_scalar checks
Task 4: minor (deferred): fixture copy names weekdays against relative dates ("Baptism Sunday" at +40 days, "Saturday morning" on a -1 day start)
Task 4: minor (deferred): fixture venue/Instagram URL are literals not tokens (post meta isn't token-rendered; file shared with Plan 6 Supabase)
Task 4: minor (deferred): Fixtures::paragraphs test lacks an apostrophe/quote case (&apos;)
Task 4: minor (deferred): `fixtures remove` leaves the three event images in the media library
Task 4: complete (commits 19066a6..30476e6, review clean)
Task 5: BASE 30476e6
Task 5: implementer a3ac19b20c13db9a8 (sonnet), commit 83cdbe9; probe cleanup needed two deletes (plan's $ids capture likely carries a CR) — plan-text nit, no residue
Task 5: Ruling: plan-mandated focus ring on .event-card__link is clipped by .event-card overflow:hidden — fix via .event-card:has(.event-card__link:focus-visible) outline (keep media clipping) — breaks the global 2px green-700 visible-focus constraint; cost if wrong: none
Task 5: Ruling: reviewer's "empty-state / hide-if-no-events / excludeCurrent not exercised" is not a Task 5 fix — Task 7 Step 6 probes exactly these (events-page empty state, "More events" hidden with one event); duplicating now adds nothing; cost if wrong: a defect found one task later
Task 5: minor (deferred): .reveal transition overrides the card's 0.25s hover transition once JS is ready
Task 5: minor (deferred): empty venue renders an empty map-pin line; sizes hint 33vw vs 2-col default; -webkit-line-clamp without standard line-clamp; filter's str_contains('class="event-card') coupling comment; card h3 fixed level
Task 5: fix round 1/5 (1 addressed, 0 open; commits 83cdbe9..5bcc1f8); focus ring visual check carried to Task 7 browser pass
Task 5: complete (commits 30476e6..5bcc1f8, review clean)
Task 6: BASE 5bcc1f8
Task 6: implementer aa24cadb5957261bb (sonnet), commit 06b4fa4; stale console errors from earlier tabs incl. a block-validation error — confirm in Task 7 validator run
Task 6: ⚠️ resolved by controller — theme.json palette has green, green-100, green-600, green-700, grey-50/100/300/500, ink; shadow presets card, card-lg exist; reduced-motion transitions covered by site.css global `*{transition-duration:.01ms!important}` under reduce; focus-ring/console visual check carried to Task 7 browser pass
Task 6: minor (deferred): selected-day event list not announced to screen readers (add aria-live or label the ul)
Task 6: minor (deferred): data-month computed at render time (stale under full-page caching; page cache is off per spec)
Task 6: minor (deferred): view.js/render.php untested beyond the pure model; first londonDateKey assertion passes under UTC too
Task 6: minor (deferred): view.js default-imports a CommonJS model (webpack interop) — add a comment
Task 6: complete (commits 5bcc1f8..06b4fa4, review clean)
Task 7: BASE 06b4fa4
Task 7: implementer a9c510da5184e843d (sonnet), commit c1c6298; validator 41/0 problems (old console validation error was stale); focus ring visually confirmed (closes Task 5/6 carry)
Task 7: ⚠️ resolved by controller — copy strings match inventory §1 Events index / Event detail (plan written from them); Peel Park grep mismatch is a brief defect (esc_url &#038;, full venue string), code correct
Task 7: minor (deferred): .event-back has no :focus-visible style on the ink hero (Plan 2 dark-bg pattern: 2px green, offset 2px)
Task 7: minor (deferred): .event-hero__title margin hardcodes 1240px (duplicates template contentSize)
Task 7: minor (deferred): hero featured image outputs its alt next to the H1 and lazy-loads; consider alt="" + eager
Task 7: minor (deferred): event-meta hardcodes /contact (home_url); CTA external test str_starts_with('http') loose (also card?); image-only description shows "More details coming soon" (accepted, add comment); archive limit 24 no pagination; validator reads DB-customised templates
Task 7: complete (commits 06b4fa4..c1c6298, review clean)
Task 8: BASE c1c6298
Task 8: implementer a8080cc04159385c8 (sonnet), commit 46ebb9e
Task 8: ⚠️ resolved by controller — curl / shows "Sunday Gathering · 10:30am" and 3 cards (token filter reaches dynamic block output)
Task 8: minor (deferred): .home-events__place margin !important (specificity); eyebrow green-700 on green-100 ≈4.5:1 (at AA line); /im-new hardcoded (root install)
Task 8: complete (commits c1c6298..46ebb9e, review clean)
Task 9: BASE 46ebb9e
Task 9: implementer ab4ceaac5720890dd (sonnet), commit dd1fdb8; debug.log held a stale 09:59 UTC fatal (fixtures-cli.php required before created, mid-Task-4); truncated, stays empty
Task 9: ⚠️ resolved by controller — every commit 5f2fc50..HEAD contains every file elevation-core.php requires; the 09:59:44 UTC fatal (10:59 BST) predates Task 4's commit 30476e6 at 11:02 BST, i.e. mid-implementation; _elevation_fixture key matches fixtures-cli.php
Task 9: minor (deferred): report lacks hash listing / "Seed complete." grep excerpt (evidence only)
Task 9: complete (commits 46ebb9e..dd1fdb8, review clean)
Final review (opus a6cdf305cc85e6b65): With fixes — I1 past events CTA/no note, I2 calendar list not announced; minors taken: title escaping, has_password, .event-back focus, fixtures trash, roadmap Plan 6/4 notes. Ruling: take Minor #1 (post-title unescaped) as a fix — Review Focus #2 names the detail page; cost if wrong: tiny. Not taken (stay deferred): calendar start-time on last day of multi-day, /events/page/N duplicate, REST-autosave block on invalid published event.
Final fix wave: commit 1d45416, re-review all 7 addressed
Final: parked — start-less published event shows "This event has finished." — Ruling: leave; it only arises via Quick Edit publish without a start (already a Plan 6 hand-off); cost if wrong: misleading note on a broken event
Final: parked — aria-label on the selected-day list isn't itself announced (the inserted items are) — Ruling: requirement met; cost if wrong: less context for screen-reader users
