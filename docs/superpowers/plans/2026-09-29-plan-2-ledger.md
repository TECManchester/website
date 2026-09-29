# SDD ledger — plan: docs/superpowers/plans/2026-09-29-plan-2-patterns-pages.md

Spec: docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md
Branch: plan-2-patterns-pages (from plan-1-done @ 51325f5)

Ruling: controller created the branch and committed the plan doc before Task 1; Task 1 Step 1 is skipped — the implementer needs the branch to exist to work — costs if wrong: nothing.
Ruling: work in the main checkout, not a worktree (same reason as Plan 1: Docker bind mounts/volumes are keyed to this directory) — costs if wrong: weaker branch isolation.

## Pre-flight scan

| Tasks | Produces → consumes | Finding |
|---|---|---|
| T1 → T2 | `wp elevation setting set --if-empty`, `@media:` values | consistent |
| T1 → T9–T12 | `{{media:}}`/`{{media-id:}}`, `--meta-description`, `--seo-title` | consistent |
| T1 → T12 | seed.sh media import `find redesign live` | DEFECT: `live/` absent until T12; under `set -euo pipefail` the failing find inside `$(…)` aborts seed.sh — Ruling A |
| T1 → T13 | `MediaRefs::unresolve` | consistent (T1 tests the round trip) |
| T2 → T3 | `Settings::heroSlides`, hero.* keys | consistent |
| T3 → T4, T6–T12 | `Icons::svg`, icon names | consistent (monitor-play, headphones etc. in set) |
| T4 → T11 | consent-controls block, `#cookies` link in footer | consistent |
| T4 → T12 | embed-gate `audio` kind, podbean `/player-v2/` path rule | consistent |
| T5 → build | two-entry build script; T3/T4 build before it | consistent (T5 changes script after) |
| T6 → T7–T12 | block styles + classes | consistent; T7 adds sunday-strip CSS, T8 give CSS, T9 story CSS, T10 give-page CSS, T12 gallery CSS |
| T6 → header | `.site-hero` marker; T7 home-hero/T9 home carry the class | consistent |
| T7/T8 → T9–T12 | pattern markup | consistent |
| T10 → T13 | anchors #serve etc; T13 redirects target them | consistent (#plan-a-visit/#connect-card intentionally absent until Plan 5) |
| T11 → T13 | defaults deleted so /sample-page, /privacy-policy redirect | consistent |
| T12 → T14 | 36 live + 11 redesign media, 14 pages | consistent |
| T13 → T14 | test count 60, check-urls | consistent |
| T1 self | tests 25→31; step 9 checks | consistent |
| T2 self | 31→38 | consistent |
| T3 self | 38→42; icons enum = Icons::names() test | consistent |
| T4 self | 42→53 (11 EmbedGate incl. 8 data cases); JS 9 tests | consistent |
| T5 self | build/editor output | consistent |
| T6 self | CSS/JS | consistent |
| T7 self | 10 patterns → 12 elevation/* registered | consistent |
| T8 self | 9 more → 21 | consistent |
| T9 self | 4 pages, anchors | consistent |
| T10 self | 5 pages | consistent |
| T11 self | privacy + defaults removal | consistent |
| T12 self | 36 files manifest | consistent |
| T13 self | 53→60 tests | consistent |
| T14 self | 14 pages, 15 token-checked paths | consistent |

Ruling A: seed.sh media listing must tolerate a missing `live/` directory — wrap as `media_files=$(cd seed/media && { find redesign live -type f \( … \) 2>/dev/null || true; } | LC_ALL=C sort | sed …)` — plan text as written aborts every seed run until Task 12 — costs if wrong: nothing.
Ruling B: browser-only verification steps (T2 S7, T3 S8, T4 S12, T5 S4, T6 S7–9, T7–T12 validator/visual, T14 S5–6) are run by the controller in the browser pane when the implementer lacks browser tools; implementers report them as "for the controller" — costs if wrong: one extra controller turn per task.

## Progress
Task 1: dispatched implementer (sonnet) agent a8c2ff5bb67c20345, BASE 1dede0e
Task 1: implementer DONE e25878a (31 tests). Review dispatched (sonnet) aa4bd129ef12eff13.
Task 1: review Approved, 0 Critical/Important. ⚠️ items resolved by controller: trailer = Opus 5.5 (verified git log); title "Elevation Church Manchester | Making Greatness Common" + meta description tokens resolved (curl); blogname from church.name.
Task 1: minor (deferred): MediaRefs::unresolve tests cover only "id" with one attachment (no mediaId, multiple, URL-prefix cases); Task 13 round trip exercises it
Task 1: minor (deferred, plan-mandated): seed.sh rewrites SmartCrawl title-page/title-home every run (resets Site Manager edits) — acceptable until cut-off
Task 1: minor (deferred, plan-mandated): blogname set from $(setting get) — empty on failure
Task 1: minor (deferred, plan-mandated): unquoted $media_files breaks on spaces (no spaces in any seed filename)
Task 1: minor (deferred, plan-mandated): changed --meta-description in seed.sh doesn't overwrite an existing value on UNCHANGED pages
Task 1: minor (deferred): cli.php media import doesn't check copy() return
Task 1: complete (commits 1dede0e..e25878a, review clean)
Task 2: dispatched implementer (sonnet) a0710b623ae1355b6, BASE e25878a
Task 2: implementer DONE d0e9fd6 (38 tests). Review: Approved, 1 Important (plan-mandated): preview <img> inline display:block defeats [hidden] → empty slots show a broken box.
Ruling: fix the preview display/hidden conflict despite plan text — admin UI must be usable (spec §7 Site Managers edit settings) — costs if wrong: nothing.
Task 2: minor (deferred): sanitiser stores "0" (not '') for non-numeric image; absint turns -5 into 5
Task 2: minor (deferred): attachment existence/type not checked on save (hero-slideshow render skips missing images)
Task 2: minor (deferred, plan-mandated): focal regex duplicated in Settings.php and settings-page.php; accepts 999%
Task 2: minor (deferred): no test covers elevation_sanitize_settings image/focal branches
Task 2: minor (deferred): hero-slides.js strings not translatable
Controller note: browser checks needing wp-admin login are blocked — reading the admin password from .env was denied by the permission classifier; asked the user to sign in to the browser pane. Front-end checks continue.
Task 2: fix round 1 dispatched (resume a0710b623ae1355b6)
Task 2: fix round 1/5 (1 addressed, 0 open; commits d0e9fd6..e389ce8)
Task 2: browser check of Settings → Church slide picker deferred until the user signs in to the browser pane
Task 2: complete (commits e25878a..e389ce8, review clean)
Task 3: dispatched implementer (sonnet) a51ff9348176450a1, BASE e389ce8
Task 3: implementer DONE_WITH_CONCERNS 318801d (42 tests; lucide-static 1.26.0). Concerns: plan greps off (theme logo also has fetchpriority; icon span attr order), invalid enum icon name renders default clock.
Ruling: invalid enum icon name rendering the default icon is correct — WordPress validates block attributes against the enum before render.php; Icons::svg('') path still returns '' for truly unknown names — plan Step 7 expectation was wrong — costs if wrong: nothing.
Task 3: review Approved, 0 Critical/Important. Controller browser check: 5 slides load, rotation advances after 6.5s when visible, pauses while document.hidden (pane hidden), no console errors. Reduced-motion not emulatable in pane — covered by code review (view.js guard + CSS).
Task 3: minor (deferred): no automated test of render.php behaviours (missing attachment skip, empty state, size clamp) — manual steps only
Task 3: minor (deferred): icon select labels are raw slugs; view.js listeners never removed; MediaQueryList.addEventListener needs Safari 14+
Task 3: complete (commits e389ce8..318801d, review clean)
Task 4: dispatched implementer (sonnet) a6739acf66c7a463e, BASE 318801d
Ruling: JS tests run as `docker compose run --rm node npm run test:js` (script = node --test tests/js/*.test.cjs) — Node 22 rejects a bare directory argument to --test; later briefs (T14) use npm run test:js — costs if wrong: nothing.
Task 4: implementer DONE b917f8c (JS 9 pass, PHPUnit 53). Review dispatched (opus, privacy-critical) a170d6c35cd0a75e7.
Task 4: controller Step 12 browser checks ALL PASS on /consent-test/: (1) no google/youtube/podbean requests before a choice, banner first in body; (2) first focusable = banner link, Escape keeps banner open with no choice; (3) Reject all → stored false/false, one clicked map loads, other gate stays; (4) Accept all → gtag G-LOCAL0000 + both embeds; (5) withdrawal via Privacy choices clears _ga cookies, sets ga-disable, status text correct; (6) Clear my choice → banner back, storage null; (7) legacy key → migrated, banner hidden, embeds load, no gtag, old key removed; (8) throwing storage → no errors, choice held in memory; (9) Cookie settings opens choose panel with focus on analytics, Escape closes and returns focus.
Task 4: review (opus) Approved with 1 Important (plan-mandated): storage listener doesn't fire ecm:consent-changed, doesn't re-show banner when another tab clears, ignores key===null.
Ruling: fix the cross-tab path — spec §6.8 names the event and tab sync — costs if wrong: nothing.
Task 4: ⚠️ resolved by controller: banner is body child 0 (before skip link), verified in browser; grey-500 #676767 on grey-100 #F1F1EF ≈ 5.0:1 (AA).
Task 4: minor (deferred, plan-mandated): focus falls to <body> after a first-visit banner choice (no opener)
Task 4: minor (deferred, plan-mandated): window.ecmConsent.open() doesn't move focus/record opener like the footer link
Task 4: minor (deferred): re-grant of analytics in the same page view sends no new config/page_view
Task 4: minor (deferred): legacy key lingers if both keys exist or legacy value invalid
Task 4: minor (deferred, plan-mandated): iframe referrerpolicy no-referrer-when-downgrade sends full URL to Google/YouTube/Podbean after consent — consider strict-origin-when-cross-origin (privacy; final review should triage)
Task 4: minor (deferred): EmbedGate::allowedSrc doesn't reject user/pass URL parts; no parser-differential test
Task 4: minor (deferred): rejected embed src renders empty in editor with no hint; '/maps' bare prefix matches '/mapsanything'
Task 4: minor (deferred): consent runtime (consent.js) has no automated tests — browser checks only
Task 4: fix round 1 dispatched (resume a6739acf66c7a463e)
Task 4: fix round 1/5 (1 addressed, 0 open; commits b917f8c..c8c04e1). Controller browser check: second tab received 2 ecm:consent-changed events, state synced to null, banner re-shown.
Task 4: complete (commits 318801d..c8c04e1, review clean)
Task 5: dispatched implementer (sonnet) a5544809bded425a0, BASE c8c04e1
Task 5: implementer DONE 7331c8a (46 tokens; build OK). Concern: 2nd wp-scripts build copies block.json/render.php into build/editor/blocks/ (committed). Review dispatched (sonnet) a4be803aba7ce74f5.
Task 5: review Needs fixes — 1 Important (plan-mandated): second wp-scripts build copies 10 broken block.json/render.php into build/editor/blocks.
Ruling: fix the build script so build/editor holds only the editor bundle — committed build/ must be real output — costs if wrong: nothing.
Task 5: minor (deferred, plan-mandated): `npm start` watcher doesn't build src/editor
Task 5: minor (deferred): token picker shows first 40 before searching; inline JSON without JSON_HEX_TAG (admin-authored values)
Task 5: fix round 1 dispatched (resume a5544809bded425a0)
Task 5: fix round 1/5 (1 addressed, 0 open; commits 7331c8a..eff77a4). Controller: build/editor = index.js + index.asset.php only; editor bundle absent from front end; PHPUnit 53.
Task 5: editor browser checks (token button, Large toggle) deferred until the user signs in to the browser pane
Task 5: complete (commits c8c04e1..eff77a4, review clean)
Task 6: dispatched implementer (sonnet) a6c8da874666719a4, BASE eff77a4
Task 6: implementer DONE 33612a2. Review dispatched (sonnet) ae71b41dd0fd7ffba.
Task 6: controller browser checks (scratch page with .site-hero instead of editing home — no admin login needed): hero fills viewport (768/768) from top 0 under header; header is-over-hero at top, solid + is-scrolled after scroll; reveal-ready set; /does-not-exist header solid; Tab order = banner (link, Accept, Reject, Choose) → Skip to content → logo → nav. Validator run deferred (needs wp-admin login).
Task 6: minor (deferred): 404 <title> is "Page not found | Elevation Church Manchester" (SmartCrawl title-404 order differs from "Elevation Church Manchester | …")
Task 6: review Approved with 2 Important (both plan-mandated): (1) zero-margin resets at 0,2,0 override card-flat/card-ink spacing rules; (2) reduced motion doesn't stop hover scales/rotate/arrow transitions.
Ruling: fix both before patterns — (1) Tasks 7–12 rely on the card spacing; (2) global constraint "prefers-reduced-motion turns off every animation" is binding — fix = :where() on the blocking resets + a global reduced-motion reset — costs if wrong: small CSS diff.
Task 6: minor (deferred): .link-arrow a has no own :focus-visible style
Task 6: minor (deferred): reveal.js deferred → possible flash of above-fold .reveal elements
Task 6: minor (deferred): portrait cover with no image = white h3 on grey-100 (unreadable)
Task 6: minor (deferred): .site-hero text colours assume the ink background the pattern sets
Task 6: fix round 1 dispatched (resume a6c8da874666719a4)
Task 6: fix round 1/5 (2 addressed, 1 new — :where() on ink-card reset lets WP flow blockGap give the p after h3 24px margin-top; controller measured on scratch page #24; commits 33612a2..5873c91)
Task 6: fix round 2 dispatched (resume a6c8da874666719a4): restore ink reset, raise h3 rule to .wp-block-group.is-style-card-ink > h3
Task 6: fix round 2/5 (1 addressed, 0 open; commits 5873c91..bb37261). Controller computed styles: ink h3 0/6px, ink p 0/0, flat h3 0/0, flat p 8px/0.
Task 6: complete (commits eff77a4..bb37261, review clean)
Ruling: the plan's prose-described pattern cards (T7 Steps 4–6) take the copy the plan gives for the same cards in Task 9 — the plan names those values; controller supplied them in the dispatch — costs if wrong: sample copy in a pattern differs.
Task 7: dispatched implementer (sonnet) a81be729afd9af2ae, BASE bb37261
Task 7: implementer DONE 97e017a (12 elevation/* patterns; pattern-test page #25 left for controller). Review dispatched (sonnet) a6c32dbe7876a7dcd.
Ruling C: add a local-only front-end block validator (local-dev.php, ?elevation-validate-blocks=1) — the plan's validator needs a wp-admin login, which is blocked (password read denied; user not yet signed in); block validity is Review Focus 4 and load-bearing for Tasks 7–12 — costs if wrong: ~60 lines of local-only code that never ships (mu-plugin excluded from migration).
Validator tool: dispatched (sonnet) a3e7ba5805e89adb7 (touches only local-dev.php + bin/validate-blocks.js comment; runs alongside the read-only Task 7 review)
Task 7: review Approved, 0 Critical/Important.
Task 7: minor (deferred, plan-mandated): image-cards-3 pattern images have no src/alt="" (placeholders); short CTA link text relies on card heading
Task 7: controller visual check @1024: grid-3=3 cols, grid-4=4, grid-2-3=3, split=2, badge 56px straddling (translateY 28px), CTA row, Sunday strip row, gate "Show the map", no horizontal scroll. @1440 screenshot: page-hero lead appears offset right of h1 (constrained layout auto-margins centre the 560px lead) — confirming after validator agent frees the browser tab.
Validator tool: DONE 7c0cf5e (local-dev.php route ?elevation-validate-blocks=1 + comment in bin/validate-blocks.js). Result: {"total":15,"problems":[]} (3 published pages + 12 elevation/* patterns); sanity check flags a mismatched heading. Front-end console shows harmless rest_not_logged_in from block-editor apiFetch.
Task 7: validator run (via local route): all 12 patterns valid. @390: grids 1 col, split 1, CTA and strip stacked, no overflow.
Task 7: Important found by controller visual check: page-hero lead centred (left 232 vs h1 24) — constrained-layout auto margins on the 560px lead. Ruling: fix in Task 7's round (CSS originates from Task 6 plan text; patterns depend on it) — costs if wrong: nothing.
Task 7: fix round 1 dispatched (resume a81be729afd9af2ae)
Task 7: fix round 1/5 (1 addressed, 0 open; commits 7c0cf5e..9f3472c). Controller re-measured: h1 24, lead 24, width 560. Scratch page #25 deleted.
Task 7: complete (commits bb37261..9f3472c incl. validator tool 7c0cf5e, review clean)
Task 8: dispatched implementer (sonnet), BASE 9f3472c
Task 8: implementer DONE f7ff0cf (21 patterns; validator total 24, problems []). Review Approved, 0 Critical/Important.
Task 8: controller visual @1440: values 3 cols, badges flex, growth 2 cols with green-700 rule, accordions open, portrait 4:5, give span-2 (819px) + ink card, stats 4, date card flex, separator 56px. @390: all 1 col, no overflow. BUT value-card letter = 14px grey-500 (should be Sora 36px green-700): `.is-style-card-flat > p` (0,1,1) overrides `.value-card__letter` (0,1,0).
Ruling: fix the value-card letter specificity now (visible defect in this task's pattern; CSS from Task 6 plan text) — costs if wrong: nothing.
Task 8: minor (deferred, plan-mandated): leadership pattern repeats one sample leader three times
Task 8: fix round 1 dispatched (resume a0b56d0949d2d937c)
Task 8: fix round 1/5 (1 addressed, 0 open; commits f7ff0cf..3e99fe7). Controller measured letter 36px Sora green-700, name 18px ink. Scratch page #26 deleted.
Task 8: complete (commits 9f3472c..3e99fe7, review clean)
Task 9: dispatched implementer (sonnet), BASE 3e99fe7
Task 9: implementer DONE 9170087 (4 pages; validator {26, []}; tokens clean; anchors 1 each; title "Elevation Church Manchester | About"). Review Approved, 0 Critical/Important.
Task 9: controller visual @1440: home hero/slideshow/header over hero, 3 image cards with badges, watch tile + "Missed a Sunday?", Gathering card spans 2 cols (819px) beside "More coming soon", 4 dark cards, footer — match redesign. im-new/about/what-we-believe: one h1, no overflow, header solid.
Task 9: REGRESSION found by controller @1440: page-hero lead pinned to section left edge (margin-left:0 from Task 7 round 1 only correct ≤1288px).
Ruling: reopen Task 7 (round 2) for the page-hero lead — fix margin-left: max(0px, calc((100% - 1240px)/2)) — and fold in the review's minor "Church is more than a Sunday" → {service.day} in ink-cards-4.php + home.html, since it violates the binding Sunday-token global constraint — costs if wrong: nothing.
Task 9: minor (deferred, plan-mandated): "Manchester" hard-coded in home copy and the Tosin role (city token exists)
Task 9: minor (deferred, plan-mandated): home card images alt="" (decorative, heading adjacent)
Task 7: fix round 2 dispatched (resume a81be729afd9af2ae)
Task 7: fix round 2 committed 3fe7470. Controller measured /about/ lead = h1 at 1440 (100/100) and 1024 (24/24); home renders "more than a Sunday." with no raw token. Re-review dispatched (haiku) a66ac19ab6a167594.
Task 9: complete (commits 3e99fe7..9170087, review clean; follow-up fix in 3fe7470 under Task 7 round 2)
Task 10: dispatched implementer (sonnet) abea6c4a3b54f2e19, BASE 3fe7470
Task 7: fix round 2/5 (2 addressed, 0 open; commits 9170087..3fe7470) — re-review clean
Task 10: implementer DONE 1264bbc (5 pages 200, tokens clean, anchors 1, validator {31, []}). Review dispatched (sonnet) aa140777940f85b87.
Task 10: controller visual @1440/@390 on watch, get-involved, give, prayer, contact: one h1 each, no overflow; split 2→1, grid-2 2→1, give grid-3-lg 3→1, 20 badges, alert panel red-tinted, contact map 420px; Give and Contact screenshots match redesign (empty form columns expected).
Task 10: review Approved, 0 Critical/Important.
Task 10: minor (deferred): Get Involved "Talk to us" CTA carries is-size-lg (redesign uses default size) — parity fix for the final wave
Task 10: minor (deferred): new site.css rules appended without section comments
Task 10: complete (commits 3fe7470..1264bbc, review clean)
Task 11: dispatched implementer (sonnet), BASE 1264bbc
Task 11: implementer DONE 707332e (privacy 200, 8 anchors, controls once, defaults removed, validator {31, []}). Review dispatched (sonnet) a91b9c06812e1ee32.
Task 11: controller browser: no choice → banner + status "You haven't made a choice yet…"; toggling embeds on the page stores {analytics:false, embeds:true}, hides the banner, status updates; footer "Cookie settings" opens the banner with focus on analytics; title "Elevation Church Manchester | Privacy notice"; text column 760px.
Task 11: minor (deferred): consent-controls box is 810px in a 760px column (padding without box-sizing: border-box) — final wave
Task 11: review Approved, 0 Critical/Important.
Task 11: minor (deferred, plan-mandated): defaults-removal loop ends in `[ -n ] &&` (status 1 on rerun; safe under bash set -e); wp_page_for_privacy_policy would be set empty if privacy page missing; "Last updated" date hard-coded (Plan 6 updates)
Task 11: complete (commits 1264bbc..707332e, review clean)
Task 12: dispatched implementer (sonnet) a8747149b542ce59b, BASE 707332e (downloads the 36 plan-approved public images)
Task 12: implementer DONE 7020620 (36 images fetched + checksummed, ignored in git; 4 pages 200; validator {35, []}). Review dispatched (sonnet) abcebda6973198c84.
Task 12: controller browser: /resources/ no podbean/google request before click, iframe only inside <template>, click loads podbean player-v2, gate 600px; cards Sign up → /resources/alpha, Read them → /resources/etracts. Galleries: etracts 11 uncropped, CiP 23 cropped, 3 cols @1440 / 2 @390, 0 broken imgs, all alts set; alpha form-slot present; no overflow on any page.
Task 12: review Approved, 0 Critical/Important.
Task 12: minor (deferred, plan-mandated): fetch-live-media.sh leaves .part on failure (under ignored dir), skips existing files without re-verifying (final shasum -c fails loudly), --record trusts disk
Task 12: complete (commits 707332e..7020620, review clean)
Task 13: dispatched implementer (sonnet), BASE 7020620
Task 13: implementer DONE 2451515 (60 tests; 7 redirects created then Unchanged; check-urls OK; hand-edit round trip: Skipped → export diff = heading only → Updated → export exact → Unchanged). Deviation: export uses rtrim(content)."\n" so the round trip is byte-exact (allowed by brief). Controller re-ran check-urls: all expected; tree clean. Review dispatched (sonnet) a525337154abeba59.
Task 13: review Approved, 0 Critical/Important. ⚠️ tokens stay raw in post_content (seed stores raw; render_block replaces) — export round trip keeps them raw (verified by "export is exact").
Task 13: minor (deferred, plan-mandated): `elevation redirects` treats unreadable file as empty; idempotency matches url across all groups
Task 13: minor (deferred): export-page.sh leaves an empty .tmp on failure; rtrim collapses multiple trailing newlines; export by name ambiguous for same-slug children; check-urls.sh aborts without FAIL on curl connection error
Task 13: complete (commits 7020620..2451515, review clean)
Task 14: dispatched implementer (sonnet), BASE 2451515
Task 14: implementer DONE_WITH_CONCERNS 82db220 + tag plan-2-done: check-env 0, 14 pages, seed rerun 0 changes/84 Unchanged, check-urls OK, tokens clean on 15 pages, PHPUnit 60, JS 9, build no diff, settings sweep correct and restored. Concerns: (1) rebuild hash diff non-empty — uploads bind mount survives down -v → -1/-2 suffixes on 6 pages; (2) debug.log 258 bytes: 2× "Undefined array key HTTP_HOST" functions.php:6473 in CLI.
Task 14: controller Steps 5–6 on fresh rebuild: validator {total:35, problems:[]}; header 1023 hamburger/no CTAs, 1024/1199/1440 inline one row + CTAs, 88px; over-hero only on /; no third-party requests before consent on /, /im-new/, /contact/, /resources/, /watch/, /give/, /privacy/ (banner shown); clean console on normal pages (validator page's own REST 401s are expected).
Ruling: setup.sh clears wp-content/uploads contents only on a fresh install (core not installed) — locally uploads hold only seed media; spec §9/§12 require build-from-nothing reproducibility — costs if wrong: hand-added local uploads lost on a fresh install (never on re-runs).
Ruling: fix the CLI HTTP_HOST warnings (prefer --url on the seed/setup wp-cli wrapper) — spec §12 requires a clean debug.log — costs if wrong: nothing.
Ruling: move local tag plan-2-done to the fixed head (never pushed) — costs if wrong: nothing.
Task 14: fix round 1 dispatched (resume ac06b207c7c062ac8)
Task 14: fix round 1 committed 32cbd5b (setup.sh: clear uploads on fresh install; --url on pre-install is-installed check — root cause wp_guess_url reading HTTP_HOST in CLI). Implementer re-ran: two rebuilds identical (14 pages), debug.log 0 bytes, seed rerun 0 changes, check-urls OK; tag moved. NOTE: implementer's tracing output exposed the local admin password (from .env) in its own tool output — not committed, not repeated; reported to user.
Task 14: review Approved, 0 Critical/Important (window.elevationValidation name confirmed by controller runs).
Task 14: minor (deferred): setup.sh treats any `core is-installed` failure (e.g. DB not reachable) as fresh install → uploads wiped (disposable local media; seed recreates)
Task 14: complete (commits 2451515..32cbd5b, review clean)
Final review: dispatching (opus) over 51325f5..32cbd5b
Final review (opus): With fixes — Important: (1) redesign redirects 404 with query strings (flag_query exact) — verified /who-we-are/?fbclid=abc → 404; (2) setup.sh wipes uploads on any is-installed failure (promoted); (3) no plan for old live /wp-content/uploads/YYYY/MM image URLs after go-live (hand-off); (4) embed iframe referrerpolicy sends full page URL (promoted).
Ruling: final fix wave = Important 1,2,4 + roadmap hand-off for 3 + deferred minors the reviewer triaged (consent-controls box-sizing, Talk-to-us is-size-lg parity, EmbedGate reject user/pass/backslash + tests, Resources audio link for no-JS = the player URL itself, blogname/tagline staleness as a Plan 6 hand-off note) — reviewer triage; all small — costs if wrong: small diff.
Ruling: hero slide alt text keeps literal "Sunday" — it describes the photo (a fact about when it was taken), not the service schedule — costs if wrong: alt text reads "Sunday" after a service-day change.
Final fix wave: dispatched (sonnet), BASE 32cbd5b
Final fix wave: 2e8b518 — 8 fixes (redirects flag_query pass + existing items updated; check-urls query cases expect /about?utm_source=x and /get-involved?fbclid=abc#serve; setup.sh table guard; referrerpolicy strict-origin-when-cross-origin; consent-controls box-sizing; Talk to us parity; EmbedGate rejects backslash/userinfo + 2 tests (PHPUnit 62); Resources audio link; roadmap Plan 6 hand-offs). Tag moved.
Final fix wave: CRITICAL found by controller real rebuild — setup.sh guard uses wp eval, which can't run on an empty DB → "no answer" → aborts every fresh install (site left empty). Fix-wave follow-up dispatched (resume af92f6db5c3f304f5): check tables via the db container without printing credentials; prove with down -v + setup.
Final fix wave: follow-up b1761df (guard via db container information_schema count; credentials stay in container). Controller verified after a real down -v + setup: exit 0, check-env OK, check-urls OK, 14 pages, PHPUnit 62. Scoped re-review dispatched (sonnet) a5c0cf191877df3ce.
Final fix wave: re-review — all 8 findings addressed, no new issues (b1761df). Plan 2: COMPLETE — final review clean after one fix wave (+ one follow-up for the rebuild regression the controller caught).
