# SDD ledger — plan: docs/superpowers/plans/2026-09-29-plan-4-youtube-feed.md

Spec: docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md rev 4 (§6.3, §6.4, §16). Branch plan-4-youtube-feed off plan-1-foundation (e9224f5); plan committed at 2e94154.
User direction (2026-09-29): messages = raw YouTube feed linking to YouTube; real channel locally, no mock data; everything configurable in wp-admin (key stored in Settings → Church); user supplies the API key later.

## Pre-flight scan

| Pair / task | Produces → consumes | Finding |
|---|---|---|
| T1 → T2 | YouTube::* URLs/parse/errorReason/past/liveNow/nextUpcoming | names match |
| T1 → T3 | formatDuration, displayDate, past | match |
| T1 → T4 | embedUrl, formatScheduled, past | match |
| T2 → T3 | elevation_youtube_feed, elevation_youtube_thumb_url | match |
| T2 → T4 | elevation_youtube_live/feed/thumb_url/flush; transient elevation_yt_feed | T4 crafted-feed check writes the transient directly; feed() only reads it when a key is set — plan text covers the no-key case |
| T3 → T4 | elevation_live_badge, youtube.css (appended), .ecm-section classes | match |
| T2 ↔ settings-page.php | elevation_sanitize_settings, youtube.apiKey secret field | existing; T2 adds status box + check that admin-saved key is used |
| T4 ↔ consent.js | window.ecmConsent.scan | new in T4 |
| T4 ↔ home/watch seeds | T3 replaced Watch middle section; T4 replaces Watch hero + wraps Home split--watch | disjoint regions |
| T1 self | tests vs code | consistent (Oct 11/Nov 1 2026 are Sundays; 23:30Z 4 Oct = 5 Oct London) |
| T2 self | verification vs code | settings static cache handled by separate evals |
| T3 self | render vs CSS classes | consistent |
| T4 self | block.json viewScript handle registered at init 5 | consistent |
| T5 self | hash count 21 = 14 pages + 7 events | consistent |

No conflicts with Global Constraints; no plan-mandated rubric defects found.

## Tasks
Task 1: BASE 2e94154
Task 1: implementer a0cb230e6e1263bdb (haiku), commit 58fdc5b
Task 1: Ruling: plan-mandated iso() throws DateMalformedStringException on regex-valid impossible dates (e.g. 2026-13-45T25:61:61Z, +99:99) — fix: iso() validates via try/catch + round-trip check and returns '' — spec §6.4 "nothing throws"; cost if wrong: none
Task 1: Ruling: plan-mandated nextUpcoming() keeps a cancelled/never-started stream "upcoming" forever — fix: optional ?DateTimeImmutable $now; when given, drop schedules older than 3 hours; Task 2's elevation_youtube_live() passes now — cost if wrong: a stream running >3h late disappears from the strip (acceptable)
Task 1: minor (deferred): videosUrl doesn't clamp to 50 ids (callers pass ≤50); description unbounded/not control-stripped; text() drops tabs/newlines instead of spacing; channelsUrl with empty handle
Task 1: note: report misstated line counts and "tags stripped" (tests show tags are kept as text)
Task 1: fix round 1/5 (3 addressed, 1 new open — iso() round-trip compares UTC date to raw input, rejecting valid offsets across midnight; commits 58fdc5b..f276ec2)
Task 1: fix round 2/5 (1 addressed, 0 open; commits f276ec2..aebdc25)
Task 1: complete (commits 2e94154..aebdc25, review clean)
Task 2: BASE aebdc25
Task 2: implementer a65740cba69b58ab3 (sonnet), commit 21614a4; real-channel + button checks deferred (no key / no login)
Task 2: ⚠️ resolved by controller — local-dev.php returns early unless WP_ENVIRONMENT_TYPE local (line 8); YouTube::thumbnail() accepts only https://i.ytimg.com/ and videos() only isVideoId ids (Task 1)
Task 2: minor (deferred): truncated >2MB JPEG would pass getimagesizefromstring and be kept (reject strlen >= limit; check file_put_contents)
Task 2: minor (deferred): no isVideoId re-check at the thumbnail write site (defence in depth)
Task 2: minor (deferred): status only updates when a fetch runs (after saving a new key it shows the old status until a visitor or the button refreshes)
Task 2: minor (deferred): update_option_elevation_settings doesn't fire on first add_option (harmless now)
Task 2: minor (deferred): 200-with-no-channel sets status but writes no error_log line
Task 2: minor (deferred): elevation_youtube_checked query arg unused (no confirmation notice)
Task 2: minor (deferred): thumbnail copies run in the visitor request that refreshes the feed (up to 15×4s, no lock, retried each refresh)
Task 2: minor (deferred): no PHPUnit coverage of WP-facing functions (manual wp eval checks only, per brief)
Task 2: complete (commits aebdc25..21614a4, review clean)
Task 3: BASE 21614a4
Task 3: implementer a4f19b990ad5ac5f1 (sonnet), commit db9f436; real grid visual deferred (no key)
Task 3: Ruling: plan-mandated video-card focus outline-offset 4px → 2px — global constraint "2px solid with a 2px offset"; cost if wrong: none
Task 3: Ruling: plan-mandated live badge #D64545 with white 12px text is 4.38:1 (< AA 4.5) → use #CC3B3B (4.93:1), the nearest passing red — spec §12 AA contrast outranks exact redesign parity; cost if wrong: a slightly darker red than the redesign
Task 3: Ruling: reviewer ⚠️ heading spacing confirmed by controller — youtube.css `.ecm-section__inner > * { margin-block: 0 }` loads after site.css and zeroes `.section-heading { margin-bottom: 3.25rem }` → restore it for .ecm-section__inner > .section-heading; cost if wrong: none
Task 3: Ruling: reviewer's "no automated coverage of the card" not taken as a fix — card is WP glue verified by render checks, as the plan specifies (same as Plan 3); cost if wrong: a markup regression caught later by review/sweep
Task 3: minor (deferred): card link accessible name order ("Length 45:07 Title… 4 Oct 2026"); url/title read without ?? '' (shape guaranteed by YouTube::videos); colour/shadow transitions still run under reduced motion (non-spatial); #2a2a5e placeholder tint hard-coded (Plan 3 cards do the same)
Task 3: fix round 1/5 (4 addressed, 0 open; commits db9f436..efa6250)
Task 3: complete (commits 21614a4..efa6250, review clean)
Task 4: Ruling: without an API key the site ignores the feed transient, so live/upcoming HTTP and browser-swap checks are deferred until the user adds the key; the implementer verifies rendering and the REST response in-process (wp eval with a one-off key filter, crafted in-memory feed, rest_do_request) plus the JS unit tests — honours "no mock data on local"; cost if wrong: the browser swap is first seen working after the key is added
Task 4: BASE efa6250
Task 4: implementer a27cfd075cc889041 (sonnet), commit fe9fe40 (trailer amended from 4229ba3); browser swap + live HTTP deferred (no key)
Task 4: Ruling: reviewer's "gate CSS missing after swap" accepted as Important — a page rendered in state none/upcoming never enqueues the embed-gate block style, so a swapped-in live gate is unstyled; fix: live-player render.php always enqueues the embed-gate style handle; cost if wrong: one small stylesheet on Watch
Task 4: Ruling: plan-mandated a.watch-tile:focus-visible outline-offset 4px → 2px (global constraint); cost if wrong: none
Task 4: Ruling: REST visibility gate gets an in-process probe (draft/private/password/future pages containing live blocks → blocks {}), not PHPUnit — WP-glue verification style of this plan; cost if wrong: regression caught later
Task 4: minor (deferred): state computed separately from block renders in REST (can disagree for one poll if the transient expires mid-request; self-corrects)
Task 4: minor (deferred): swap drops keyboard focus inside a swapped block; no aria-live announcement when the hero flips to live; live-to-live title changes not swapped (state-only by design); home tile aria-label hides the "Live now" badge text; synced patterns (core/block) not searched by elevation_live_find_blocks
Task 4: fix round 1/5 (4 addressed, 0 open; commits fe9fe40..3928785)
Task 4: complete (commits efa6250..3928785, review clean)
Task 5: BASE 3928785
Task 5: implementer a1fa4011e5015b667 (sonnet), commit ebb3f49; real-video checks deferred (no key)
Task 5: minor (deferred, final review to triage): first two-rebuild run differed — one extra post (ID 4) created before media import shifted attachment IDs by 1 (6 page hashes differed); not reproduced in 5 later rebuilds. Controller hypothesis: a front-end request during seeding (browser pane open; live-status.js polls every 60s) made the Navigation block create a fallback wp_navigation post before the header menu was seeded. Seed is sensitive to concurrent traffic.
Task 5: complete (commits 3928785..ebb3f49, review clean)
Final review (opus a8c9d8ecdd4d8840c): With fixes — I1 last-good feed through outages; I2 plain-English errors (details[].reason + errorAdvice); I3 stale status + Save and check YouTube; I4 thumbnail refresh + lock. Minors taken: drop description, no token replacement in YouTube text, roadmap hand-off wording + seed nav order + deferred checks. Not taken: Shorts filter (spec silent — ask user), poll back-off, shutdown-time copies, aria-live on swap.
Final fix wave: commit 0024ce5, re-review all addressed
Final: parked — "Checked just now." can reappear after a later plain Save (referer keeps elevation_youtube_checked=1) — Ruling: cosmetic; fix with remove_query_arg in the redirect filter when the flag is absent (Plan 6 polish); cost if wrong: a misleading note
Final: parked — an orphan {id}.jpg.tmp can remain only if PHP dies between write and rename — Ruling: edge case; harmless file; cost if wrong: a few KB
Final: parked — elevation_yt_last_good isn't cleared when the key/handle changes (old videos with failed status up to 1h) — Ruling: acceptable per brief
