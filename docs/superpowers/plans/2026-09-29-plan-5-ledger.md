# SDD ledger — plan: docs/superpowers/plans/2026-09-29-plan-5-forms-groups-announcements.md

Spec: docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md (rev 4). Branch plan-5-forms-groups off plan-1-foundation (0ca76d4); plan committed 1b39d23.
Pre-check (controller, before execution): Task 1/2/5/6 pure classes + PHPUnit tests and the JS state test extracted from the plan and run in isolation — 54 PHP tests OK, 5 JS tests OK; all non-class PHP snippets php -l clean (only the `case` fragment, by design).

## Pre-flight scan
| Pair / task | Produces → consumes | Found |
|---|---|---|
| T1 → T2 | FormRules::requiredPaths/requiredMessage/emailMessage, Forms::isKey → FormSchema | consistent |
| T2 → T3 | includes/forms.php lookup (elevation_form_ids/id/key); T3 appends + moves `use` lines to top | consistent |
| T2 → T3 | forms-cli.php switch; T3 adds purge-test-entries case | consistent |
| T2 → T7 | do_action elevation_forms_seeded → elevation_sync_all_form_access | consistent |
| T3 → T4 | elevation/form wrapper .form-box--<key>, className is-card; .form-context styled in T4 | consistent |
| T3 → T5 | elevation_group_name / elevation_joinable_group_ids via function_exists; elevation_form_before action | consistent |
| T3 → T7 | elevation_form_key_of, fluentform hooks | consistent |
| T4 ↔ T5 | both edit get-involved.html (T4 #serve buttons, T5 Find a group buttons) and functions.php enqueues | disjoint edits |
| T5 ↔ T6 | fixtures-cli remove covers announcement (T5), announcements action (T6); both import into src/editor/index.js | consistent |
| T5/T6 → T8 | 15 pages + 7 events + 3 groups + 1 announcement + 9 forms = 35 hash lines | consistent |
| T1 self | tests vs code — run and passing | ok |
| T2 self | FormSchemaTest vs FormSchema — run and passing; JSON defs satisfy requiredPaths (checked by compile at seed) | ok |
| T3 self | verification steps depend on FF internals (error key format for sub-fields, input escaping in HTML mail, editor smartcode handler arg) — plan tells implementer to check | ok (judgment steps) |
| T4 self | selectors are best reading of FF 6.2.14; plan says verify in DOM | ok |
| T5 self | GroupFieldsTest vs code — run and passing | ok |
| T6 self | AnnouncementTest + JS test vs code — run and passing | ok |
| T7 self | FF hook behaviours to confirm in step 1 | ok |
| T8 self | docs + sweeps | ok |
Scan clean; no rulings needed before execution.

Task 1: dispatched (BASE 1b39d23, haiku)
Task 1: implementer DONE 2de9261 (162 tests OK); review dispatched (sonnet)
Task 1: minor (deferred): FormRules text() ignores non-scalar values for optional fields (array phone/subject skip length/format checks) — Task 3 wiring should consider
Task 1: minor (deferred): validation trims but stored value untrimmed (" 2026-10-04" passes)
Task 1: minor (deferred): ServiceDates start-time regex accepts '10:30 m', '7.30'
Task 1: minor (deferred): RateLimit::waitMinutes correct only if caller records allowed submissions only (Task 3 does)
Task 1: minor (deferred): PHONE_RE needs no digits ('.......' passes)
Task 1: minor (deferred): LIMITS labels global across forms
Task 1: complete (commits 1b39d23..2de9261, review clean)
Task 2: dispatched (BASE 2de9261, sonnet)
Task 2: implementer DONE_WITH_CONCERNS 91f4bdd (170 tests OK): seed.sh case pattern changed to `(form:*)` for bash 3.2 inside $( ); `wp db query` fails locally (SSL) → use `wp eval` + $wpdb for DB checks in later tasks; FF forms are #3-#11 (IDs 1-2 pre-existing)
Ruling: later dispatches replace plan's `wp db query "..."` checks with `wp eval` using $wpdb — local wp-cli db client requires SSL; same data — costs nothing if wrong
Task 2: ⚠️ resolved by controller: forms list shows 9 IDs; report records skip/force and 9 renders >1000 chars, debug.log clean
Task 2: minor (deferred): no test compiles the real seed/forms/*.json; checkbox/consent/hidden/html/section/dynamic/width branches untested (plan-mandated gap)
Task 2: minor (deferred): forms seed update forces status=published, re-publishing a form unpublished in Fluent Forms
Task 2: minor (deferred): elevation_form_ids keeps lowest form_id if a stale tag outlives its form
Task 2: complete (commits 2de9261..91f4bdd, review clean)
Task 3: dispatched (BASE 91f4bdd, sonnet)
Task 3: implementer DONE_WITH_CONCERNS 06a51bd (170 PHP OK, 17 JS OK, 15/15 checks): concerns — FF email footer "Powered by FluentForm"; site-wide wp_mail_from_name filter; prayer Reply-To when email given (as brief); welcomeInbox stored explicitly = default (harmless); label tokens on page → Task 4. Review dispatched (sonnet)
Task 3: minor (deferred): token resolver in submission_message_parse runs over already-parsed visitor text ({contact.email} typed by a visitor expands; escaped, public values only) — prefer resolving label tokens before {all_data}
Task 3: minor (deferred): site-wide wp_mail_from_name filter (WordPress → church name) — scope or record intent
Task 3: minor (deferred): settings smartcodes esc_html in plain-text contexts (subjects) → &amp;/&#039; (plan-mandated)
Task 3: minor (deferred): {elevation.urgentLine} always HTML even if a notification is plain text (plan-mandated)
Task 3: minor (deferred): rate-limit key md5 not hmac; get-then-set not atomic
Task 3: minor (deferred): fluentform_form_analytics could store IPs if analytics toggled on — add fluentform/disabled_analytics true
Task 3: minor (deferred): bin/mail.sh show on empty inbox tracebacks
Task 3: minor (deferred): runtime hooks have no automated test (visit_date override, sub-field error key)
Task 3: minor (deferred): FF email footer "Powered by FluentForm" in church emails (implementer concern)
Task 3: ⚠️ resolved by controller: Mailpit/entry outcomes are in the report's 15 checks; hostile HTML stripped by FF input sanitiser (safe; differs from brief's expected &lt;b&gt;) — Ruling: accept stripping as meeting "no live markup" — FF sanitises on input for text/textarea — costs if wrong: a future field type bypassing sanitize could leak markup; final review to re-check
Task 3: complete (commits 91f4bdd..06a51bd, review clean)
Task 4: dispatched (BASE 06a51bd, sonnet)
Task 4: implementer DONE_WITH_CONCERNS c594ecb (tests OK, validator clean): removed base .form-box card rules in site.css (outside file list); screenshots not savable by tool → Task 8 retakes; notes border & full Tab walk unverified. Review dispatched (sonnet)
Ruling: accept Task 4's removal of Plan 2's base .form-box card rules (site.css) — redesign boxes only Gift Aid; is-card now carries the card — costs if wrong: Contact/Prayer lose a card look the user might want; one CSS line to restore
Task 4: ⚠️ resolved by controller: im-new section-heading attrs match give.html #gift-aid (constrained 620px), as the brief directed; visual checks in report; screenshots retaken in Task 8
Task 4: minor (deferred): newsletter input 15px → iOS zoom on focus (plan-mandated)
Task 4: minor (deferred): .form-box .form-success p grey-500 would beat footer colour if newsletter success ever has a <p> (currently heading only)
Task 4: minor (deferred): .is-card has no border; check on white sections
Task 4: minor (deferred): colour transitions not gated by prefers-reduced-motion
Task 4: complete (commits 06a51bd..c594ecb, review clean)
Task 5: dispatched (BASE c594ecb, sonnet)
Task 5: implementer DONE 2df67fa (174 PHP OK, 17 JS, validator clean): deviations — unused meets day blanked in render (plan's claim that filters() refuses it was wrong), .screen-reader-text added, fixtures dispatches announcements if defined; no RED run captured. Review dispatched (sonnet)
Ruling: Task 5 Important (plan-mandated) — leader full name exposed via anonymous REST; fix by making group_leader_name REST context edit-only like the email — spec §6.6 shows leader first name only; costs if wrong: nothing (editor still reads it). Fix round 1 also takes Minor 1 (save-lock cleanup), trivial.
Task 5: fix round 1/5 (2 addressed, 0 open — leader name REST edit-only; save-lock cleanup; commits 2df67fa..83a308d)
Task 5: minor (deferred): client email regex looser than sanitize_email (bad address silently saved empty)
Task 5: minor (deferred): GroupFields::time rejects HH:MM:SS
Task 5: minor (deferred): FF calls wp_mail with empty recipient for leader-less groups (logs a failed send)
Task 5: minor (deferred): /get-involved#connect-groups anchor scroll not checked at 390px
Task 5: ⚠️ note: submit-button focus ring comes from forms.css (.form-box .ff-btn-submit:focus-visible), group card buttons from theme button styles — final review to confirm
Task 5: complete (commits c594ecb..83a308d, review clean after 1 fix round)
Task 6: dispatched (BASE 83a308d, sonnet)
Task 6: implementer DONE e8645f5 (178 PHP OK, 22 JS OK, all Step 6 checks): fixture re-seed doesn't reset a flipped switch unless row says active:true. Review dispatched (sonnet)
Ruling: Task 6 Important (plan-mandated) — core REST /wp/v2/announcement readable anonymously (inactive/scheduled + meta); fix: anonymous GET on /wp/v2/announcement* refused (401) unless current_user_can('edit_posts'); editor unaffected — spec §6.5 says the modal is chosen only via the no-store endpoint; costs if wrong: nothing public relies on it. Round 1 also takes Minors 1 (tokens before kses), 2 (title entities), 4 (future dismissal stamp), 5 (animation transform displaces ×) — cheap correctness fixes.
Task 6: fix round 1/5 (5 addressed, 0 open — anon core REST refused, tokens before kses, title decode, future stamp, card animation; commits e8645f5..7443b9d)
Task 6: minor (deferred): safeUrl/normaliseCtaUrl accept "/\evil" style URLs (staff-authored)
Task 6: minor (deferred): storage listener not removed on close; drag-select ending on backdrop closes dialog
Task 6: minor (deferred): admin "Showing" column N+1 queries; draft with switch on shows "outside its dates"
Task 6: minor (deferred): deactivate_others uses post_status any (turns off other drafts too) vs docblock
Task 6: minor (deferred): panel hours parseInt('') → NaN controlled input warning
Task 6: minor (deferred): JS hours accepts Number(true)/'' etc.
Task 6: minor (deferred): fixture ends relative → daily re-seed bumps version (local only)
Task 6: complete (commits 83a308d..7443b9d, review clean after 1 fix round)
Task 7: dispatched (BASE 7443b9d, sonnet)
Task 7: implementer DONE_WITH_CONCERNS f01750a (tests OK, 7/7 checks): bulk trash on Gift Aid returns 200 no-op (nothing changed); editor hasFormPermission scope 'yes' but caps no. Review dispatched (sonnet)
Ruling: Task 7 Important — Gift Aid auto-delete guard only runs on the next submission; fix by also resetting delete_entry_on_submission/auto_delete_days for the Gift Aid form whenever its settings are saved (FF save hook) and on admin_init — Pro is licensed and may be installed on live, whose cleanup we can't inspect; costs if wrong: a few cheap meta reads per admin request
Task 7: fix round 1/5 (1 addressed, 0 open — elevation_gift_aid_keep_entries on submit, after_save_form_settings, admin_init; commits f01750a..ceacaf7)
Task 7: minor (deferred): bulk trash on Gift Aid returns 200 no-op via API (UI hides option)
Task 7: minor (deferred): keep-message wording reused for form delete
Task 7: minor (deferred): a manual FF-Managers grant on a Site Manager gets our marker, so demotion strips it
Task 7: minor (deferred): admin_init access-version + keep-entries checks each admin request (small)
Task 7: minor (deferred): thrown veto could fatal a caller without try/catch (e.g. Pro cron)
Task 7: complete (commits 7443b9d..ceacaf7, review clean after 1 fix round)
Task 8: dispatched (BASE ceacaf7, sonnet)
Task 8: implementer DONE_WITH_CONCERNS a8e2df3: rebuilds identical (35 lines), sweeps pass; my dispatch misstated is-card scope (built: Gift Aid, G-Squad, Connect card, Join Group — §17 records the built state); focus-to-first-error/aria-describedby → Plan 6; screenshots described not saved. Review dispatched (sonnet)
Task 8: minor (deferred): README names src/FormRules.php without plugin path
Task 8: minor (deferred): spec §6.6 long line / awkward params phrase
Task 8: minor (deferred): roadmap Plan 5 hand-offs lack "focus to first invalid field / aria-describedby on errors" for Plan 6
Task 8: complete (commits ceacaf7..a8e2df3, review clean)
Final review: dispatched (opus, 0ca76d4..HEAD)
Final review: With fixes — 3 Important (visitor-confirmation relay via name field; FormRules blocks forms after wp-admin field deletion; wp_mail('') for leader-less groups) + minors triaged fix-now: FF credit footer, analytics IPs, dashboard widget counts, newsletter 16px, announcement CTA close, docblock, roadmap hand-off docs. One fix dispatch (sonnet): final-fixes.md
Ruling: final Important 2 — skip generic FormRules errors for fields absent from the FF form, keep Gift Aid/visit/join rules always; don't honour FF's own required toggle (keeps one source of required messages) — costs if wrong: staff can't make a field optional without code
Ruling: final Important 1 — name fields capped at 50 chars and refuse ://, www., @ on all forms; no per-recipient cap (rate limit per IP stands) — costs if wrong: an unusual real name with '@' is refused
Final fixes: DONE 841dfbb (180 PHP OK, 22 JS OK); fix 8 stores dismissal before close (close event raced navigation); dashboard widget removal unexercised (needs sign-in); note fixture CTA /im-new#… 301s (trailing slash). Scoped re-review dispatched (sonnet)
Final fixes: re-review — 10/10 addressed; new Important: elevation_form_has_field() sub-field branch dead (FF keys sub-fields as names[last_name]), so hiding a name sub-field in the FF editor still blocks submissions
Final: parked — hidden name sub-field still required — Ruling: real but narrow (whole-field delete/rename is handled); no second fix wave allowed; surfaced to the user as a one-line fix (check isset($fields['names[last_name]'])) — costs if wrong: staff hiding "Last name" in Fluent Forms breaks those forms until fixed
Final: minor (deferred): elevation_group_leader_email docblock split from old comment; "www." matches inside names like "Awww."; announcement fixture CTA /im-new#plan-a-visit 301s (no trailing slash)

## New copy for the user's review (from the Task 8 report)
- G-Squad, `/get-involved#serve`: heading "Join the G-Squad"; lead "Tell us where you'd like to serve and a team leader will be in touch to help you get started."; form: submit "Join the G-Squad", team question "Where would you like to serve?" / help "Pick as many as you like.", 21 team options (from redesign), "Not sure yet — help me choose", "Anything you'd like us to know?"; success "Welcome to the G-Squad" / "Thank you — a team leader will be in touch soon to help you get started."; notification subject "G-Squad sign-up: <name>", body "A new G-Squad sign-up from the website."
- Plan a Visit, `/im-new#plan-a-visit`: eyebrow "Plan a visit"; heading "Let us know you're coming"; lead "Tell us which {service.day} you're planning to come and we'll look out for you. We'll email you the time, the address and everything you need to know."; fields "Which Sunday are you coming?", Adults, Children, "Children's ages" + help "For example: 3 and 7. Please don't include names.", "Anything we should know?" + help "Questions, access needs, or anything that would help us look after you."; submit "Plan my visit"; success "We can't wait to meet you" / "Thank you — we've emailed you the time, the address and everything you need. See you soon!". Welcome email: subject "Visit plan: <name>, <date>", "Someone is planning to visit on <date>." Visitor email: subject "See you on <date>"; "Hi <first>," / "Thank you for letting us know you're coming — we can't wait to meet you." / When / Where (+ Google Maps link) / "What to expect: come as you are. Someone from our welcome team will meet you at the door, help you find a seat and answer any questions." / "Bringing children? The Seeds is our church for children, running during the service in a safe, friendly space. Let the welcome team know when you arrive and they'll show you where to go." / "If anything changes, or you have a question before you come, just reply to this email." / "See you soon, <church name>".
- Connect card, `/im-new#connect-card`: eyebrow "Connect card"; heading "Been with us already?"; lead "We'd love to hear how your visit went, and how we can help you get connected."; submit "Send my connect card"; success "Thanks for connecting" / "We're so glad you came. Someone from our welcome team will be in touch."; option labels corrected from live ("Another Elevation campus", "Other", "The message", "The altar call", "Something else").
- Join Group, `/connect-groups#join-group`: eyebrow "Ask to join"; heading "We'll put you in touch"; lead "Send this and the group's leader or our welcome team will get back to you, usually within a few days."; context lines "You're asking to join <group>. Choose a different group" and "Not sure which group? Leave it with us — tell us a little about yourself and we'll suggest one."; field "Anything you'd like the leader to know?"; submit "Ask to join"; success "Request sent" / "Thank you — the group leader or our welcome team will be in touch soon."; subjects "Connect Group request: <group>"; leader email "Someone would like to join <group>. Please get in touch with them."; welcome email "A connect group request from the website. Group: <group>."
- `/connect-groups` hero: eyebrow "Connect Groups", h1 "Find your people", lead "Small groups across Manchester and online, meeting through the week. Find one near you or around your season of life, and ask to join." Empty panel: "We're adding our groups here soon. In the meantime, tell us a little about yourself below and we'll help you find one." Also card labels "Open to new members", "Ask to join", "Full right now, ask about the next one", and "No groups match those filters."
- Footer newsletter row (site-wide): "Stay in the loop" / "News and events from {church.name}, now and then. We only use your email for this — see our privacy notice."; submit "Subscribe"; success "You're on the list — thank you."
- Alpha success: "You're signed up" / "Thank you — the Alpha team will be in touch with the details."; submit "Sign me up".
- Announcement fixture (local only, off): title "Harvest Sunday is coming"; body "Join us on {service.day} at {service.startTime} for a special harvest service, with food to share afterwards. Bring a friend!"; button "Plan your visit" -> /im-new#plan-a-visit; ends +14 days 23:59; hide for 24 h; image the summer hangout event image. Modal buttons: "Plan your visit", "Not now".
- Local group fixtures (sample data): Salford Families, City Centre Young Professionals, Couples Online (full), with leaders "... Example" and @example.com emails.

