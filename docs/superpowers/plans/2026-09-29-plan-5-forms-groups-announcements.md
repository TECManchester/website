# Plan 5 — Forms, Connect Groups, Visits and Announcements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the site every form, directory and notice the spec lists:
- nine Fluent Forms, placed on their pages and styled like the redesign, each with validation, a rate limit, a honeypot and the right email notifications;
- a Connect Group directory with filters and an "Ask to join" flow that emails the group's leader without ever showing their address;
- Plan a Visit (with its confirmation email to the visitor) and the connect card on I'm New;
- a site-wide announcement modal that switches on and off within one page view despite the 10-minute HTML cache;
- Site Managers who can read the ordinary form entries but never Prayer or Gift Aid, and Gift Aid entries that can't be deleted.

**Architecture:**
- **Pure rules** (`src/`, PHPUnit): `FormRules` (required and length rules, email and phone checks, the Gift Aid rules and postcode normaliser, the declaration text), `ServiceDates` (the next 8 service dates), `RateLimit` (5 per 10 minutes), `Forms` (the nine form keys and who may read them), `FormSchema` (turns the short form definitions in `seed/forms/*.json` into Fluent Forms' own JSON), `GroupFields` and `Announcement`.
- **Forms as data.** `wp elevation forms seed /seed/forms` creates or updates the nine forms in Fluent Forms' tables, tagging each with `_elevation_form_key`. Editing a form in the Fluent Forms editor is detected by a hash, and the seed then leaves it alone, as `bin/seed.sh` does for pages.
- **Runtime** (`includes/forms.php`): hooks into Fluent Forms by form key. It handles validation, the rate limit, postcode normalising, the visit-date options, the urgent prayer subject, and settings smartcodes such as `{contact.welcomeInbox}` in recipients and email copy. A dynamic block, `elevation/form {"form":"contact"}`, places a form on a page.
- **Connect Groups** is a `connect_group` post type, with `area` and `group_category` taxonomies and a sidebar panel. It is shown by two blocks, `elevation/group-directory` (on the new `/connect-groups` page) and `elevation/featured-groups` (on Get Involved). The Join Group form routes to the leader through `fluentform/email_to`.
- **Announcements** is an `announcement` post type with a sidebar panel. `GET /wp-json/elevation/v1/announcement` (`no-store`) returns the one that is showing, and a small script decides in the browser whether to open the modal.

**Tech Stack:** WordPress 7.1.2 block theme and plugin, PHP 8.3, PHPUnit 11, Fluent Forms (free) 6.2.14, `@wordpress/scripts` 36.0.0, `node --test`, WP-CLI, Docker Compose, Mailpit.

**Spec:** `docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md` (revision 4): §6.5 Announcements, §6.6 Connect-group directory, §6.7 Visit plans and connect card, §6.10 Forms: complete map, §7 Roles and access, §11 Privacy notice and §12 Testing. The roadmap row and Plan 2–4 hand-offs are in `docs/superpowers/plans/2026-09-28-roadmap.md`.

Copy and styling come from the redesign at `~/Projects.nosync/website` (`e0cf43e`):
- `src/components/{contact-form,prayer-form,gift-aid-form,newsletter-form,announcement-modal}.tsx`
- `src/lib/{gift-aid.ts,actions/submissions.ts,email.ts}`
- `src/app/(site)/get-involved/page.tsx`
- `supabase/migrations/*` (the `visit_plans`, `connect_groups`, `group_join_requests` and `announcements` shapes)

The redesign has **no** Plan a Visit form, visitor email, G-Squad form, Join Group form, directory, connect card or footer newsletter row. Those are designed here in the redesign's style (spec §12: "compare against the redesign's design language, and review them with the user").

## Global Constraints

- **Forms are Fluent Forms (free) 6.2.14.** Nothing may need Fluent Forms Pro (spec §8). Pro-only features are unavailable: the `phone` element, double opt-in and the Pro styler. Phone fields are `input_text` with `type="tel"`.
- **The nine forms, their keys and who may read them (spec §6.10).** Keys are fixed and are what pages, code and seed files use:

  | Key | Title | Page | Notifies | Entries readable by |
  |---|---|---|---|---|
  | `contact` | Contact | `/contact` | `{contact.email}`, reply-to the sender | Site Manager, Admin |
  | `prayer` | Prayer | `/prayer` | `{contact.prayerInbox}`, subject `URGENT prayer request` when ticked | **Admin only** |
  | `gift-aid` | Gift Aid | `/give#gift-aid` | `{contact.email}` (name and postcode only) | **Admin only** |
  | `newsletter` | Newsletter | footer, site-wide | nobody | Site Manager, Admin |
  | `g-squad` | G-Squad sign-up | `/get-involved#serve` | `{contact.welcomeInbox}` | Site Manager, Admin |
  | `plan-a-visit` | Plan a Visit | `/im-new#plan-a-visit` | `{contact.welcomeInbox}` + the visitor | Site Manager, Admin |
  | `join-group` | Join a Connect Group | `/connect-groups#join-group` | the group's leader + `{contact.welcomeInbox}` | Site Manager, Admin |
  | `connect-card` | Connect card | `/im-new#connect-card` | `{contact.welcomeInbox}` | Site Manager, Admin |
  | `alpha` | Alpha registration | `/resources/alpha` | `{contact.welcomeInbox}` | Site Manager, Admin |

- **Field names that live entries migrate into (Plan 6) must not change:**
  - `newsletter`: `email`.
  - `g-squad`, `plan-a-visit`: `names` (first and last), `email`, `phone`, plus `message` / `notes`.
  - `alpha`: exactly the live form 7 names: `names`, `input_text_2` (phone), `email`, `input_radio` (gender), `dropdown` (age range), `input_radio_1` (visited before), `input_radio_2` (how heard), `input_text` (other), `input_radio_3` (consent). Option values are copied from the live form verbatim.
- **Recipients and email copy follow Church Settings at send time.** They are written as settings smartcodes (`{contact.welcomeInbox}`, `{service.startTime}`, `{location.full}`, …) and resolved by `fluentform/smartcode_group_{group}`. Changing a setting changes the next email with no re-seed. No email address is hard-coded anywhere.
- **Validation (spec §6.10).**
  - Gift Aid rules: first name at least 2 characters after removing dots and spaces; surname at least 2; house name or number required; a UK postcode.
  - Postcodes are stored normalised as `AA9 9AA` by `fluentform/insert_response_data`.
  - The declaration text and `hmrc-2016-enduring-v1` are stored with each entry, set on the server.
  - Messages are the redesign's wording (Task 1 lists them).
- **Spam and abuse.**
  - The Fluent Forms honeypot is on for every church form.
  - The rate limit is 5 submissions per 10 minutes per IP per form, from `REMOTE_ADDR` (no proxy on live, spec §3). The message is: "That's a few submissions in a short time. Please wait about N minutes and try again."
- **Privacy.**
  - Fluent Forms does not store visitors' IP addresses for church forms (`fluentform/disable_ip_logging`).
  - The rate limiter keeps only a salted hash of the IP in a 10-minute transient.
  - A group leader's email is never sent to a browser: not in HTML, not in REST, not in an error.
- **Gift Aid retention.** Entries can't be deleted or trashed, and the form can't be deleted (spec §6.10).
- **Access (spec §7).**
  - Site Managers get Fluent Forms' entry access to the seven Site Manager forms only.
  - Editors get no Fluent Forms access.
  - Prayer and Gift Aid entries are for Administrators.
  - Post-type capabilities for `connect_group` and `announcement` map to the standard post capabilities, so Editors manage them.
- **Freshness (spec §3, §6.5).**
  - HTML may be 10 minutes old.
  - The announcement comes only from `GET /wp-json/elevation/v1/announcement` (`Cache-Control: no-store, max-age=0`).
  - The visit-date options are rendered into the HTML, so the server re-checks the chosen date on submit.
- **London time.** Service dates, announcement windows and group times are Europe/London wall-clock. Dates read "Sunday 5 October 2026" and times "7:30 pm", as `EventTime`.
- **Copy.** Redesign copy verbatim where it exists, with "Sunday", "10:30am", the venue and the email address replaced by tokens. New copy is marked **(new copy)** in this plan and is listed for the user's review in Task 8.
- **Styling.**
  - Theme CSS restyles Fluent Forms' markup: a 2-column grid from 640px, and labels in Inter 14px weight 500 (as the redesign's `Label`).
  - Inputs are 40px high with a 10px radius and a `#E4E4EA` border.
  - Hints are grey-500 at 12px.
  - Errors are `#CC3B3B` (the site's accessible red).
  - The success panel is green-100 with a green border.
  - The submit button is the green pill (as the redesign's `Btn`).
  - Fluent Forms' own look (`fluentform-public-default`) is not loaded for church forms.
- **Colours and focus.**
  - Text-safe green is `green-700`.
  - On ink, green is `--wp--preset--color--green`.
  - Focus rings are 2px solid with a 2px offset.
  - Motion stops under `prefers-reduced-motion: reduce`.
- **Code conventions.**
  - Blocks are `elevation/<name>`, apiVersion 3, with `render.php` in `src/blocks/<name>/`. Globals in `render.php` use the `$elevation_` prefix.
  - Pure classes live in `src/` (namespace `Elevation\Core`) and make no WordPress calls.
  - `build/` is committed. Rebuild with `docker compose run --rm node npm run build`.
  - Meta keys are prefixed by post type (`group_…`, `announcement_…`), as `event_…`.
- **Commands.**
  - PHPUnit: `docker compose run --rm php vendor/bin/phpunit`
  - JS tests: `docker compose run --rm node npm run test:js`
  - WP-CLI: `docker compose run --rm -T wpcli wp --user=admin <command>`
  - URL and token checks: `./bin/check-urls.sh` and `./bin/check-tokens.sh <paths>`
  - Block validator: `http://localhost:8080/?elevation-validate-blocks=1`, then read `window.elevationValidation`
  - Mail: Mailpit at `http://localhost:8025`. API: `GET /api/v1/messages`, `DELETE /api/v1/messages`.
- **Test data.**
  - Test submissions use `@example.com` addresses and obviously fake names ("Test Visitor").
  - Test users created for access checks have random passwords that are never printed, and are deleted at the end of the task that made them.
  - Nothing here signs in to wp-admin in a browser.
- **Standing rules.**
  - Never read, list or copy anything under `private/`.
  - Never read `import/export.xml`.
  - Never touch `docker-compose.mirror.yml` or the `elevation-mirror` project.
  - Never read or print `.env` values or passwords.
  - Browser checks that need a wp-admin sign-in are deferred and noted.
  - Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Hostile or odd input in every field**: HTML and `<script>`, emoji, 6,000-character messages, whitespace-only required fields, and a postcode typed `m66pu`. Expected:
   - clear per-field messages, and nothing stored for a rejected submission;
   - literal text in Mailpit's HTML and plain views, and in the entry;
   - the postcode stored as `M6 6PU`.

   Tested by `FormRulesTest` (Task 1) and by crafted submissions with Mailpit checks (Task 3).
2. **A page that is 10 minutes old.** The visit-date list can include a service that has just started; that choice is refused with "That date isn't available any more — please choose another." The form still submits. An announcement switched on or off takes effect on the next page view. Tested by `ServiceDatesTest` (Task 1), a submission with yesterday's date (Task 3) and the REST checks (Task 6).
3. **A tampered Join Group link**: `?group=` set to a draft, a trashed group, another post type, a non-number, or nothing. Expected:
   - no leader email leaks;
   - a blank or unknown group reaches only the welcome team (unknown is refused with a clear message);
   - a full group can still be asked about.

   Tested in Task 5.
4. **Church Settings changed after seeding** (a new welcome inbox, service day or start time). The next notification goes to the new address and the visit dates move to the new day, with no re-seed. Tested in Task 3.
5. **No announcement, an expired one, one that starts later by the browser's clock, and no localStorage** (private mode, or storage throws). Expected:
   - no console errors;
   - the modal shows only inside its window;
   - after "Not now" it stays closed for `dismiss_hours`;
   - editing it shows it again.

   Tested by `announcement-state.test.cjs` and the browser check (Task 6).

---

## File structure

**Plugin `wp-content/plugins/elevation-core/`:**

- `src/Forms.php` (create): the nine form keys and which are Administrator-only.
- `src/FormRules.php` (create): required messages, limits, email/phone/Gift Aid rules, postcode normaliser, declaration text.
- `src/ServiceDates.php` (create): next N service dates from the service day and start time.
- `src/RateLimit.php` (create): the sliding-window check and its message.
- `src/FormSchema.php` (create): short definitions → Fluent Forms `form_fields`, settings and notifications.
- `src/GroupFields.php` (create): meeting day and time, leader first name, directory filters.
- `src/Announcement.php` (create): dismiss hours, window checks, ISO times, editor errors.
- `includes/forms.php` (create): form lookup by key, smartcodes, validation, rate limit, stored-data fixes, visit dates, email subjects and placeholders.
- `includes/forms-cli.php` (create): `wp elevation forms seed|id|list|reset-limits`.
- `includes/forms-access.php` (create): Site Manager entry access, Gift Aid deletion guard.
- `includes/groups.php` (create): the `connect_group` post type, taxonomies, meta, queries, leader routing.
- `includes/group-render.php` (create): the group card and mini card.
- `includes/announcements.php` (create): the `announcement` post type, meta, REST route, script.
- `includes/fixtures-cli.php` (modify): `groups` and `announcements` fixtures; `remove` covers them.
- `src/blocks/form/`, `src/blocks/group-directory/`, `src/blocks/featured-groups/` (create).
- `src/editor/group-panel.js`, `src/editor/announcement-panel.js` (create); `src/editor/index.js` (modify).
- `assets/js/announcement-state.js` (create, UMD) and `assets/js/announcement.js` (create).
- `elevation-core.php` (modify): the new requires.
- `tests/{FormsTest,FormRulesTest,ServiceDatesTest,RateLimitTest,FormSchemaTest,GroupFieldsTest,AnnouncementTest}.php` and `tests/js/announcement-state.test.cjs` (create).

**Theme `wp-content/themes/elevation/`:**

- `assets/css/forms.css`, `assets/css/groups.css`, `assets/css/announcement.css` (create).
- `functions.php` (modify): enqueue them and add them as editor styles.
- `parts/footer.html` (modify): the newsletter row.

**Seed, scripts and docs:**

- `seed/forms/*.json` (create, nine files).
- `seed/pages/{contact,prayer,give,alpha,im-new,get-involved}.html` (modify) and `seed/pages/connect-groups.html` (create).
- `seed/fixtures/groups.json`, `seed/fixtures/announcements.json` (create).
- `bin/seed.sh`, `bin/check-urls.sh` (modify); `bin/submit-form.sh`, `bin/mail.sh` (create).
- `README.md`, the roadmap and the spec (modify, Task 8).

## Rulings made while writing this plan

- **Labels are Inter, not Sora.** The spec's §6.10 parenthesis says "Sora labels", but the redesign's `Label` is Inter 14px weight 500, and parity with the redesign is the success test (§1). Sora is used for fieldset headings and success headings, as the redesign does. §6.10 is corrected in Task 8.
- **Every submit button is the green pill.** The spec says "pill submit"; the redesign uses it for Gift Aid and the newsletter and a navy rectangle for Contact and Prayer. One button style for all forms matches the spec and the theme.
- **Inputs are 40px high,** not the redesign's 32px, for a comfortable touch target at 16px text. Everything else about inputs follows the redesign.
- **The newsletter sends no email.** §6.10's table says "none", which overrides the general "notifications are on for every form" line. The entry list is the mailing list (§13: no mailing-list integration).
- **IP addresses are not stored in entries.** Data minimisation, and the privacy notice doesn't list IPs. Our rate limit reads `REMOTE_ADDR` itself, so Fluent Forms' own IP-based throttle (5 per 30s) becomes inert; ours replaces it.
- **Forms are placed by a block, not a shortcode.** Seed HTML can't know database IDs, so `elevation/form {"form":"<key>"}` looks the ID up by key. If a form is missing it shows an "email us" fallback instead of nothing. The block's wrapper carries `form-box` (roadmap: "add class form-box when filling").
- **Required-field messages live in `FormRules`,** and `FormSchema` copies them into Fluent Forms' rules. There is one source for both the browser-side check and the server re-check, so whitespace-only answers get the same message.
- **Form edits in the Fluent Forms editor win,** exactly like page edits: the seed skips a form whose stored JSON no longer matches its seed hash. Force one with `SEED_FORCE="form:<key>"`, which is prefixed so it can't collide with the `contact` page slug.
- **`/connect-groups` is a seeded page** holding the directory block, not a post-type archive. Staff can edit its intro, the post type needs no public URLs (spec: "no single pages"), and the footer's existing `/connect-groups` link starts working.
- **"Featured" groups on Get Involved** are the first three published groups by menu order, then title. The spec names no featured flag, and ordering is standard WordPress (Page Attributes → Order).
- **The Join Group form sits under the directory** at `#join-group`. "Ask to join" links to `?group=<id>#join-group`, keeping the active filters, and the form's hidden `group_id` is filled from `{get.group}`. A line above the form names the chosen group, rendered on the server from the same parameter.
- **Visit dates are required.** The form exists to say when you're coming. Migrated live "Reserve a seat" entries keep a blank date (Plan 6).
- **Announcement body** is the block editor limited to paragraphs and lists. The REST route returns it as `wp_kses_post` HTML with settings tokens replaced. Its schedule uses `datetime-local` inputs holding London wall-clock `Y-m-d\TH:i`, the same format as events.
- **The announcement fixture is loaded switched off,** so local pages aren't covered by a modal. Task 6 switches it on and off to test, and Plan 6 switches it on for the parity run.
- **Alpha is rebuilt from the public live form**, not from the mirror database, which this plan doesn't touch. The field names match `docs/live-inventory.md`'s keys for form 7, and the option values and required fields are copied from the live page's form. So the one live entry maps 1:1 (spec §6.10).
- **Connect card questions** are the live Guest form's (0 entries), minus the postal address and country, plus a postcode (spec §6.7). Obvious typos in labels and options are fixed ("others" → "Other", "Free Text" → "Something else"); field names are kept.
- **Site Manager access to entries** uses Fluent Forms' own per-user manager records, synced automatically. It is set when a user gains or loses the Site Manager role, and again whenever the form IDs change. Staff never configure it. Fluent Forms' "Managers" screen is Administrator-only anyway.

---

### Task 1: Pure form rules — `Forms`, `FormRules`, `ServiceDates`, `RateLimit`

**Files:**
- Create: `wp-content/plugins/elevation-core/src/Forms.php`, `src/FormRules.php`, `src/ServiceDates.php`, `src/RateLimit.php`
- Create: `wp-content/plugins/elevation-core/tests/FormsTest.php`, `tests/FormRulesTest.php`, `tests/ServiceDatesTest.php`, `tests/RateLimitTest.php`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php` (four `require_once` lines after `src/YouTube.php`)

**Interfaces:**
- Consumes: `Elevation\Core\EventTime::TZ` (`'Europe/London'`).
- Produces (later tasks rely on these exact names):
  - `Forms::KEYS` (list of the nine keys), `Forms::ADMIN_ONLY` (`['prayer','gift-aid']`), `Forms::isKey(string): bool`, `Forms::siteManagerKeys(): list<string>`.
  - `FormRules::DECLARATION_TEXT`, `FormRules::DECLARATION_VERSION`.
  - `FormRules::requiredMessage(string $key, string $path): ?string`, which returns null when the field isn't required.
  - `FormRules::requiredPaths(string $key): list<string>`: the required field paths, in order.
  - `FormRules::emailMessage(string $key): string`.
  - `FormRules::errors(string $key, array $data, array $context = []): array<string,string>`. Keys are field paths (`'email'`, `'names.first_name'`) or `'restricted'` for a form-level error. `$context` may hold `visitDates` (list of `Y-m-d`) and `groupIds` (list of int).
  - `FormRules::normalisePostcode(string): string`.
  - `ServiceDates::next(string $day, string $startTime, DateTimeImmutable $now, int $count = 8): list<array{value:string,label:string}>`, plus `ServiceDates::weekday(string): string` and `ServiceDates::startMinutes(string): ?int`.
  - `RateLimit::MAX` (5), `RateLimit::WINDOW` (600), `RateLimit::recent(array, int, int = WINDOW): list<int>`, `RateLimit::allows(array, int, int = MAX, int = WINDOW): bool`, `RateLimit::waitMinutes(array, int, int = WINDOW): int`, `RateLimit::message(int): string`.

- [ ] **Step 1: Write the failing tests**

`tests/FormsTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Forms;
use PHPUnit\Framework\TestCase;

final class FormsTest extends TestCase {

	public function test_nine_keys_and_prayer_and_gift_aid_are_admin_only(): void {
		$this->assertCount( 9, Forms::KEYS );
		$this->assertTrue( Forms::isKey( 'plan-a-visit' ) );
		$this->assertFalse( Forms::isKey( 'Plan-a-visit' ) );
		$this->assertFalse( Forms::isKey( '' ) );
		$this->assertSame( [ 'contact', 'newsletter', 'g-squad', 'plan-a-visit', 'join-group', 'connect-card', 'alpha' ], Forms::siteManagerKeys() );
	}
}
```

`tests/FormRulesTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\FormRules;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class FormRulesTest extends TestCase {

	private const CONTACT = [ 'name' => 'Ada', 'email' => 'ada@example.com', 'message' => 'Hello' ];

	public function test_a_complete_contact_message_passes(): void {
		$this->assertSame( [], FormRules::errors( 'contact', self::CONTACT ) );
	}

	public function test_required_fields_use_the_redesign_wording_and_whitespace_counts_as_empty(): void {
		$this->assertSame(
			[
				'name'    => 'Please tell us your name.',
				'email'   => 'We need an email address to reply to.',
				'message' => 'Please write your message.',
			],
			FormRules::errors( 'contact', [ 'name' => '   ', 'email' => '', 'message' => "\n\t" ] )
		);
		$this->assertSame( 'Please tell us your name.', FormRules::requiredMessage( 'contact', 'name' ) );
		$this->assertNull( FormRules::requiredMessage( 'contact', 'phone' ) );
		$this->assertNull( FormRules::requiredMessage( 'nope', 'name' ) );
		$this->assertSame( [ 'name', 'email', 'message' ], FormRules::requiredPaths( 'contact' ) );
		$this->assertSame( [], FormRules::requiredPaths( 'nope' ) );
	}

	public function test_name_fields_are_checked_by_sub_field(): void {
		$errors = FormRules::errors( 'g-squad', [ 'names' => [ 'first_name' => 'Ada', 'last_name' => ' ' ], 'email' => 'ada@example.com' ] );
		$this->assertSame( [ 'names.last_name' => 'Please tell us your last name.' ], $errors );
	}

	public function test_bad_email_and_phone_are_refused_but_optional_blanks_pass(): void {
		$errors = FormRules::errors( 'contact', [ 'email' => 'ada@', 'phone' => 'call me' ] + self::CONTACT );
		$this->assertSame( "That doesn't look like a valid email address.", $errors['email'] );
		$this->assertSame( "That doesn't look like a phone number.", $errors['phone'] );
		$this->assertSame( [], FormRules::errors( 'contact', [ 'phone' => '' ] + self::CONTACT ) );
		$this->assertSame( [], FormRules::errors( 'contact', [ 'phone' => '+44 (0)7469 062220' ] + self::CONTACT ) );
		$this->assertSame( [ 'email' => 'Please enter a valid email address.' ], FormRules::errors( 'newsletter', [ 'email' => 'nope' ] ) );
	}

	public function test_prayer_email_is_optional_but_checked_when_given(): void {
		$this->assertSame( [], FormRules::errors( 'prayer', [ 'request' => 'For my mum' ] ) );
		$this->assertSame( [ 'email' => "That doesn't look like a valid email address." ], FormRules::errors( 'prayer', [ 'request' => 'x', 'email' => 'x@y' ] ) );
	}

	public function test_over_long_text_names_the_field_and_the_limit(): void {
		$errors = FormRules::errors( 'contact', [ 'message' => str_repeat( 'é', 5001 ) ] + self::CONTACT );
		$this->assertSame( [ 'message' => 'Your message is too long — keep it under 5000 characters.' ], $errors );
		$this->assertSame( [], FormRules::errors( 'contact', [ 'message' => str_repeat( '🙏', 5000 ) ] + self::CONTACT ) );
	}

	public function test_html_is_just_text_to_the_rules(): void {
		$this->assertSame( [], FormRules::errors( 'contact', [ 'message' => '<script>alert(1)</script> & "quotes"' ] + self::CONTACT ) );
	}

	#[DataProvider( 'giftAidCases' )]
	public function test_gift_aid_rules( array $change, array $expected ): void {
		$base = [
			'first_name'           => 'Ada',
			'last_name'            => 'Lovelace',
			'address_line1'        => '12 Crescent Road',
			'postcode'             => 'M6 6PU',
			'declaration_accepted' => 'on',
		];
		$this->assertSame( $expected, FormRules::errors( 'gift-aid', array_merge( $base, $change ) ) );
	}

	public static function giftAidCases(): array {
		return [
			'complete'            => [ [], [] ],
			'initial only'        => [ [ 'first_name' => 'A.' ], [ 'first_name' => 'HMRC needs your full first name, not an initial.' ] ],
			'spaced initials'     => [ [ 'first_name' => 'A . ' ], [ 'first_name' => 'HMRC needs your full first name, not an initial.' ] ],
			'two letters is fine' => [ [ 'first_name' => 'Jo' ], [] ],
			'blank first name'    => [ [ 'first_name' => '' ], [ 'first_name' => 'Please give your first name.' ] ],
			'short surname'       => [ [ 'last_name' => 'L' ], [ 'last_name' => 'Please give your surname.' ] ],
			'no house number'     => [ [ 'address_line1' => 'Rd' ], [ 'address_line1' => 'Please include your house name or number — HMRC requires it.' ] ],
			'house name is fine'  => [ [ 'address_line1' => 'Rose Cottage' ], [] ],
			'blank address'       => [ [ 'address_line1' => ' ' ], [ 'address_line1' => 'Please give your home address, including house name or number.' ] ],
			'lower-case postcode' => [ [ 'postcode' => 'm66pu' ], [] ],
			'half a postcode'     => [ [ 'postcode' => 'M6' ], [ 'postcode' => "That doesn't look like a full UK postcode." ] ],
			'not ticked'          => [ [ 'declaration_accepted' => '' ], [ 'declaration_accepted' => 'Please confirm the declaration so we can claim Gift Aid.' ] ],
		];
	}

	public function test_postcodes_are_normalised_like_the_redesign(): void {
		$this->assertSame( 'M6 6PU', FormRules::normalisePostcode( ' m66pu ' ) );
		$this->assertSame( 'SW1A 1AA', FormRules::normalisePostcode( 'sw1a1aa' ) );
		$this->assertSame( 'M6 6PU', FormRules::normalisePostcode( 'M6   6PU' ) );
		$this->assertSame( 'M6', FormRules::normalisePostcode( ' m6 ' ) );
	}

	public function test_a_visit_date_must_be_one_on_offer_now(): void {
		$data    = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com', 'visit_date' => '2026-10-04', 'adults' => '2' ];
		$context = [ 'visitDates' => [ '2026-10-04', '2026-10-11' ] ];
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', $data, $context ) );
		$this->assertSame(
			[ 'visit_date' => "That date isn't available any more — please choose another." ],
			FormRules::errors( 'plan-a-visit', [ 'visit_date' => '2026-09-27' ] + $data, $context )
		);
		$this->assertSame( [ 'visit_date' => 'Please choose the date you plan to come.' ], FormRules::errors( 'plan-a-visit', [ 'visit_date' => '' ] + $data, $context ) );
	}

	public function test_visitor_numbers(): void {
		$data    = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com', 'visit_date' => '2026-10-04' ];
		$context = [ 'visitDates' => [ '2026-10-04' ] ];
		$adults  = 'Please enter how many adults are coming, from 1 to 20.';
		foreach ( [ '0', '21', '-1', '1.5', 'two', '' ] as $bad ) {
			$this->assertSame( [ 'adults' => $adults ], FormRules::errors( 'plan-a-visit', [ 'adults' => $bad ] + $data, $context ), "adults=$bad" );
		}
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', [ 'adults' => '1', 'children' => '' ] + $data, $context ) );
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', [ 'adults' => '20', 'children' => '0' ] + $data, $context ) );
		$this->assertSame(
			[ 'children' => 'Please enter how many children are coming, from 0 to 20.' ],
			FormRules::errors( 'plan-a-visit', [ 'adults' => '2', 'children' => '30' ] + $data, $context )
		);
	}

	public function test_join_group_accepts_blank_or_a_listed_group_only(): void {
		$data    = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com' ];
		$context = [ 'groupIds' => [ 12, 40 ] ];
		$refused = [ 'restricted' => "That group isn't taking requests right now. Please choose another from the list, or leave it blank and we'll help you find one." ];
		$this->assertSame( [], FormRules::errors( 'join-group', [ 'group_id' => '' ] + $data, $context ) );
		$this->assertSame( [], FormRules::errors( 'join-group', [ 'group_id' => '40' ] + $data, $context ) );
		$this->assertSame( $refused, FormRules::errors( 'join-group', [ 'group_id' => '41' ] + $data, $context ) );
		$this->assertSame( $refused, FormRules::errors( 'join-group', [ 'group_id' => '12abc' ] + $data, $context ) );
		$this->assertSame( $refused, FormRules::errors( 'join-group', [ 'group_id' => '12' ] + $data ) );
	}

	public function test_a_connect_card_postcode_is_optional_but_must_look_right(): void {
		$data = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com' ];
		$this->assertSame( [], FormRules::errors( 'connect-card', $data ) );
		$this->assertSame( [], FormRules::errors( 'connect-card', [ 'postcode' => 'm6 6pu' ] + $data ) );
		$this->assertSame( [ 'postcode' => "That doesn't look like a full UK postcode." ], FormRules::errors( 'connect-card', [ 'postcode' => 'Salford' ] + $data ) );
	}

	public function test_alpha_keeps_the_live_field_names(): void {
		$errors = FormRules::errors( 'alpha', [] );
		$this->assertSame( [ 'names.first_name', 'names.last_name', 'input_text_2', 'email', 'input_radio', 'dropdown', 'input_radio_2' ], array_keys( $errors ) );
	}

	public function test_an_unknown_form_only_gets_the_generic_checks(): void {
		$this->assertSame( [], FormRules::errors( 'nope', [ 'anything' => 'x' ] ) );
	}

	public function test_the_declaration_is_the_hmrc_wording(): void {
		$this->assertSame( 'hmrc-2016-enduring-v1', FormRules::DECLARATION_VERSION );
		$this->assertStringStartsWith( 'Please treat as Gift Aid donations all qualifying gifts of money made from the date of this declaration and in the past four years.', FormRules::DECLARATION_TEXT );
		$this->assertStringEndsWith( 'it is my responsibility to pay any difference.', FormRules::DECLARATION_TEXT );
	}
}
```

`tests/ServiceDatesTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use Elevation\Core\ServiceDates;
use PHPUnit\Framework\TestCase;

final class ServiceDatesTest extends TestCase {

	public function test_the_next_eight_sundays_from_a_wednesday(): void {
		$dates = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-09-30T12:00:00+01:00' ) );
		$this->assertCount( 8, $dates );
		$this->assertSame( [ 'value' => '2026-10-04', 'label' => 'Sunday 4 October 2026' ], $dates[0] );
		$this->assertSame( '2026-11-22', $dates[7]['value'] );
	}

	public function test_today_counts_until_the_service_starts_in_london(): void {
		$before = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-10-04T09:29:00Z' ) ); // 10:29 BST
		$after  = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-10-04T09:30:00Z' ) ); // 10:30 BST
		$this->assertSame( '2026-10-04', $before[0]['value'] );
		$this->assertSame( '2026-10-11', $after[0]['value'] );
	}

	public function test_the_london_date_is_used_near_midnight_and_across_the_clock_change(): void {
		$dates = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-10-24T23:30:00Z' ) ); // Sun 25 Oct 00:30 BST
		$this->assertSame( '2026-10-25', $dates[0]['value'] );
		$this->assertSame( '2026-11-01', $dates[1]['value'] ); // after the change to GMT, still a Sunday
	}

	public function test_other_days_and_spellings(): void {
		$now = new DateTimeImmutable( '2026-09-30T12:00:00Z' ); // Wednesday
		$this->assertSame( '2026-10-03', ServiceDates::next( 'saturdays', '6pm', $now, 1 )[0]['value'] );
		$this->assertSame( '2026-10-04', ServiceDates::next( 'Funday', '10:30am', $now, 1 )[0]['value'] ); // unknown → Sunday
		$this->assertSame( [], ServiceDates::next( 'Sunday', '10:30am', $now, 0 ) );
	}

	public function test_start_times(): void {
		$this->assertSame( 630, ServiceDates::startMinutes( '10:30am' ) );
		$this->assertSame( 630, ServiceDates::startMinutes( '10.30 a.m.' ) );
		$this->assertSame( 1080, ServiceDates::startMinutes( '6pm' ) );
		$this->assertSame( 720, ServiceDates::startMinutes( '12pm' ) );
		$this->assertSame( 30, ServiceDates::startMinutes( '12:30am' ) );
		$this->assertSame( 1110, ServiceDates::startMinutes( '18:30' ) );
		foreach ( [ '', 'soon', '13pm', '10:75', '18' ] as $bad ) {
			$this->assertNull( ServiceDates::startMinutes( $bad ), $bad );
		}
	}

	public function test_an_unreadable_start_time_keeps_today_all_day(): void {
		$dates = ServiceDates::next( 'Sunday', 'mid-morning', new DateTimeImmutable( '2026-10-04T20:00:00Z' ), 1 );
		$this->assertSame( '2026-10-04', $dates[0]['value'] );
	}
}
```

`tests/RateLimitTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\RateLimit;
use PHPUnit\Framework\TestCase;

final class RateLimitTest extends TestCase {

	public function test_five_in_ten_minutes_then_a_wait(): void {
		$now    = 10_000;
		$stamps = [ $now - 590, $now - 400, $now - 300, $now - 200 ];
		$this->assertTrue( RateLimit::allows( $stamps, $now ) );
		$stamps[] = $now - 10;
		$this->assertFalse( RateLimit::allows( $stamps, $now ) );
		$this->assertSame( 1, RateLimit::waitMinutes( $stamps, $now ) ); // the oldest leaves in 10s
		$this->assertTrue( RateLimit::allows( $stamps, $now + 11 ) );
	}

	public function test_waits_are_rounded_up_to_whole_minutes(): void {
		$now = 10_000;
		$this->assertSame( 10, RateLimit::waitMinutes( array_fill( 0, 5, $now ), $now ) );
		$this->assertSame( 0, RateLimit::waitMinutes( [], $now ) );
	}

	public function test_junk_and_future_stamps_are_ignored(): void {
		$this->assertSame( [ 9_900 ], RateLimit::recent( [ 'x', null, 9_000, 9_900, 20_000 ], 10_000 ) );
	}

	public function test_the_message(): void {
		$this->assertSame( "That's a few submissions in a short time. Please wait about 1 minute and try again.", RateLimit::message( 1 ) );
		$this->assertSame( "That's a few submissions in a short time. Please wait about 7 minutes and try again.", RateLimit::message( 7 ) );
		$this->assertSame( "That's a few submissions in a short time. Please wait about 1 minute and try again.", RateLimit::message( 0 ) );
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `docker compose run --rm php vendor/bin/phpunit --filter 'FormsTest|FormRulesTest|ServiceDatesTest|RateLimitTest'`
Expected: errors such as `Class "Elevation\Core\Forms" not found`.

- [ ] **Step 3: Write the classes**

`src/Forms.php`:

```php
<?php
namespace Elevation\Core;

/**
 * The church's nine forms (spec §6.10), by the key that pages, seed files and code use. Prayer and Gift Aid
 * entries are for Administrators only (spec §7). Pure — no WordPress calls.
 */
final class Forms {

	public const KEYS       = [ 'contact', 'prayer', 'gift-aid', 'newsletter', 'g-squad', 'plan-a-visit', 'join-group', 'connect-card', 'alpha' ];
	public const ADMIN_ONLY = [ 'prayer', 'gift-aid' ];

	public static function isKey( string $key ): bool {
		return in_array( $key, self::KEYS, true );
	}

	/** @return list<string> */
	public static function siteManagerKeys(): array {
		return array_values( array_diff( self::KEYS, self::ADMIN_ONLY ) );
	}
}
```

`src/FormRules.php`:

```php
<?php
namespace Elevation\Core;

/**
 * What each church form accepts (spec §6.10), in the redesign's wording. includes/forms.php calls errors()
 * from Fluent Forms' validation filter; FormSchema copies the required messages into the form definitions,
 * so the browser check and the server re-check say the same thing. Pure — no WordPress calls.
 */
final class FormRules {

	public const DECLARATION_VERSION = 'hmrc-2016-enduring-v1';
	public const DECLARATION_TEXT    = 'Please treat as Gift Aid donations all qualifying gifts of money made from the date of this declaration and in the past four years. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.';

	private const EMAIL_RE    = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';
	private const POSTCODE_RE = '/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i';
	private const PHONE_RE    = '/^\+?[0-9 ()\-.]{7,40}$/';
	private const PHONES      = [ 'phone', 'input_text_2' ];

	private const FIRST = 'Please tell us your first name.';
	private const LAST  = 'Please tell us your last name.';

	/** Form key => field path => message. A path into a name field uses a dot: "names.first_name". */
	private const REQUIRED = [
		'contact'      => [ 'name' => 'Please tell us your name.', 'email' => 'We need an email address to reply to.', 'message' => 'Please write your message.' ],
		'prayer'       => [ 'request' => 'Please tell us what we can pray for.' ],
		'gift-aid'     => [
			'first_name'           => 'Please give your first name.',
			'last_name'            => 'Please give your surname.',
			'address_line1'        => 'Please give your home address, including house name or number.',
			'postcode'             => 'Please give your full postcode.',
			'declaration_accepted' => 'Please confirm the declaration so we can claim Gift Aid.',
		],
		'newsletter'   => [ 'email' => 'Please enter a valid email address.' ],
		'g-squad'      => [ 'names.first_name' => self::FIRST, 'names.last_name' => self::LAST, 'email' => 'We need an email address so a team leader can reply.' ],
		'plan-a-visit' => [
			'names.first_name' => self::FIRST,
			'names.last_name'  => self::LAST,
			'email'            => 'We need an email address to send your confirmation to.',
			'visit_date'       => 'Please choose the date you plan to come.',
			'adults'           => 'Please enter how many adults are coming, from 1 to 20.',
		],
		'join-group'   => [ 'names.first_name' => self::FIRST, 'names.last_name' => self::LAST, 'email' => 'We need an email address so the group leader can reply.' ],
		'connect-card' => [ 'names.first_name' => self::FIRST, 'names.last_name' => self::LAST, 'email' => 'We need an email address to reply to.' ],
		'alpha'        => [
			'names.first_name' => self::FIRST,
			'names.last_name'  => self::LAST,
			'input_text_2'     => 'Please give a phone number.',
			'email'            => 'We need an email address to reply to.',
			'input_radio'      => 'Please choose an option.',
			'dropdown'         => 'Please choose your age range.',
			'input_radio_2'    => 'Please tell us how you heard about Alpha.',
		],
	];

	/** Field path => [maximum characters, name used in the "too long" message]. */
	private const LIMITS = [
		'name'             => [ 120, 'Your name' ],
		'names.first_name' => [ 120, 'First name' ],
		'names.last_name'  => [ 120, 'Last name' ],
		'title'            => [ 20, 'Title' ],
		'first_name'       => [ 120, 'First name' ],
		'last_name'        => [ 120, 'Surname' ],
		'email'            => [ 254, 'Email' ],
		'phone'            => [ 40, 'Phone' ],
		'input_text_2'     => [ 40, 'Phone' ],
		'subject'          => [ 200, 'Subject' ],
		'message'          => [ 5000, 'Your message' ],
		'request'          => [ 5000, 'Your prayer request' ],
		'notes'            => [ 5000, 'Notes' ],
		'description'      => [ 5000, 'Your prayer request' ],
		'description_1'    => [ 5000, 'Your comments' ],
		'address_line1'    => [ 200, 'Address' ],
		'address_line2'    => [ 200, 'Address line 2' ],
		'city'             => [ 100, 'Town or city' ],
		'postcode'         => [ 12, 'Postcode' ],
		'children_ages'    => [ 100, "Children's ages" ],
		'input_text'       => [ 200, 'Your answer' ],
	];

	public static function requiredMessage( string $key, string $path ): ?string {
		return self::REQUIRED[ $key ][ $path ] ?? null;
	}

	/** @return list<string> */
	public static function requiredPaths( string $key ): array {
		return array_keys( self::REQUIRED[ $key ] ?? [] );
	}

	public static function emailMessage( string $key ): string {
		return 'newsletter' === $key ? 'Please enter a valid email address.' : "That doesn't look like a valid email address.";
	}

	/**
	 * @param array $data    The submitted values, as Fluent Forms passes them (name fields are arrays).
	 * @param array $context visitDates: list<string> of bookable Y-m-d; groupIds: list<int> of joinable groups.
	 * @return array<string,string> Field path (or "restricted") => the first problem with it.
	 */
	public static function errors( string $key, array $data, array $context = [] ): array {
		$errors = [];
		foreach ( self::REQUIRED[ $key ] ?? [] as $path => $message ) {
			if ( self::isBlank( self::at( $data, $path ) ) ) {
				$errors[ $path ] = $message;
			}
		}
		foreach ( self::LIMITS as $path => [ $max, $label ] ) {
			if ( ! isset( $errors[ $path ] ) && mb_strlen( self::text( $data, $path ) ) > $max ) {
				$errors[ $path ] = "$label is too long — keep it under $max characters.";
			}
		}
		$email = self::text( $data, 'email' );
		if ( ! isset( $errors['email'] ) && '' !== $email && ! preg_match( self::EMAIL_RE, $email ) ) {
			$errors['email'] = self::emailMessage( $key );
		}
		foreach ( self::PHONES as $path ) {
			$phone = self::text( $data, $path );
			if ( ! isset( $errors[ $path ] ) && '' !== $phone && ! preg_match( self::PHONE_RE, $phone ) ) {
				$errors[ $path ] = "That doesn't look like a phone number.";
			}
		}
		return match ( $key ) {
			'gift-aid'     => self::giftAid( $data, $errors ),
			'plan-a-visit' => self::visit( $data, $errors, $context['visitDates'] ?? [] ),
			'join-group'   => self::joinGroup( $data, $errors, $context['groupIds'] ?? [] ),
			'connect-card' => self::optionalPostcode( $data, $errors ),
			default        => $errors,
		};
	}

	/** "m66pu" → "M6 6PU", as the redesign's normalisePostcode(). Too short to split: trimmed and upper-cased. */
	public static function normalisePostcode( string $value ): string {
		$compact = strtoupper( preg_replace( '/\s+/', '', $value ) ?? '' );
		if ( strlen( $compact ) < 5 ) {
			return strtoupper( trim( $value ) );
		}
		return substr( $compact, 0, -3 ) . ' ' . substr( $compact, -3 );
	}

	private static function giftAid( array $data, array $errors ): array {
		if ( ! isset( $errors['first_name'] ) && mb_strlen( preg_replace( '/[.\s]/u', '', self::text( $data, 'first_name' ) ) ?? '' ) < 2 ) {
			$errors['first_name'] = 'HMRC needs your full first name, not an initial.';
		}
		if ( ! isset( $errors['last_name'] ) && mb_strlen( self::text( $data, 'last_name' ) ) < 2 ) {
			$errors['last_name'] = 'Please give your surname.';
		}
		$address = self::text( $data, 'address_line1' );
		if ( ! isset( $errors['address_line1'] ) && ! preg_match( '/\d/', $address ) && mb_strlen( $address ) < 4 ) {
			$errors['address_line1'] = 'Please include your house name or number — HMRC requires it.';
		}
		if ( ! isset( $errors['postcode'] ) && ! preg_match( self::POSTCODE_RE, self::text( $data, 'postcode' ) ) ) {
			$errors['postcode'] = "That doesn't look like a full UK postcode.";
		}
		return $errors;
	}

	private static function optionalPostcode( array $data, array $errors ): array {
		$postcode = self::text( $data, 'postcode' );
		if ( ! isset( $errors['postcode'] ) && '' !== $postcode && ! preg_match( self::POSTCODE_RE, $postcode ) ) {
			$errors['postcode'] = "That doesn't look like a full UK postcode.";
		}
		return $errors;
	}

	private static function visit( array $data, array $errors, array $dates ): array {
		if ( ! isset( $errors['visit_date'] ) && ! in_array( self::text( $data, 'visit_date' ), $dates, true ) ) {
			$errors['visit_date'] = "That date isn't available any more — please choose another.";
		}
		foreach ( [ 'adults' => 1, 'children' => 0 ] as $path => $min ) {
			$value = self::text( $data, $path );
			if ( isset( $errors[ $path ] ) || ( '' === $value && 'children' === $path ) ) {
				continue;
			}
			if ( ! preg_match( '/^\d{1,2}$/', $value ) || (int) $value < $min || (int) $value > 20 ) {
				$errors[ $path ] = 'adults' === $path
					? 'Please enter how many adults are coming, from 1 to 20.'
					: 'Please enter how many children are coming, from 0 to 20.';
			}
		}
		return $errors;
	}

	private static function joinGroup( array $data, array $errors, array $groupIds ): array {
		$group = self::text( $data, 'group_id' );
		if ( '' !== $group && ( ! ctype_digit( $group ) || ! in_array( (int) $group, array_map( 'intval', $groupIds ), true ) ) ) {
			$errors['restricted'] = "That group isn't taking requests right now. Please choose another from the list, or leave it blank and we'll help you find one.";
		}
		return $errors;
	}

	private static function at( array $data, string $path ): mixed {
		$value = $data;
		foreach ( explode( '.', $path ) as $part ) {
			if ( ! is_array( $value ) || ! array_key_exists( $part, $value ) ) {
				return null;
			}
			$value = $value[ $part ];
		}
		return $value;
	}

	private static function text( array $data, string $path ): string {
		$value = self::at( $data, $path );
		return is_scalar( $value ) ? trim( (string) $value ) : '';
	}

	private static function isBlank( mixed $value ): bool {
		if ( is_array( $value ) ) {
			return [] === array_filter( $value, static fn ( $v ) => is_scalar( $v ) && '' !== trim( (string) $v ) );
		}
		return ! is_scalar( $value ) || '' === trim( (string) $value );
	}
}
```

`src/ServiceDates.php`:

```php
<?php
namespace Elevation\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * The next service dates for the Plan a Visit form (spec §6.7), from Settings → Church's service day and
 * start time. Today counts until the service starts (London time). Pure — no WordPress calls.
 */
final class ServiceDates {

	private const DAYS = [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' ];

	/** "Sunday", "sundays", " SUNDAY " → "sunday"; anything else → "sunday". */
	public static function weekday( string $day ): string {
		$day = preg_replace( '/s$/', '', strtolower( trim( $day ) ) ) ?? '';
		return in_array( $day, self::DAYS, true ) ? $day : 'sunday';
	}

	/** "10:30am", "10.30 a.m.", "6pm", "18:30" → minutes after midnight; null if unreadable. */
	public static function startMinutes( string $time ): ?int {
		if ( ! preg_match( '/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*(?:m\.?)?\s*$/i', $time, $m ) || '' === trim( $time ) ) {
			return null;
		}
		$hour   = (int) $m[1];
		$minute = isset( $m[2] ) && '' !== $m[2] ? (int) $m[2] : null;
		$half   = strtolower( $m[3] ?? '' );
		if ( null !== $minute && $minute > 59 ) {
			return null;
		}
		if ( '' === $half ) {
			return ( null === $minute || $hour > 23 ) ? null : $hour * 60 + $minute;
		}
		if ( $hour < 1 || $hour > 12 ) {
			return null;
		}
		return ( $hour % 12 + ( 'p' === $half ? 12 : 0 ) ) * 60 + ( $minute ?? 0 );
	}

	/** @return list<array{value:string,label:string}> "2026-10-04" / "Sunday 4 October 2026", soonest first. */
	public static function next( string $day, string $startTime, DateTimeImmutable $now, int $count = 8 ): array {
		$local   = $now->setTimezone( new DateTimeZone( EventTime::TZ ) );
		$weekday = self::weekday( $day );
		$start   = self::startMinutes( $startTime ) ?? 24 * 60;
		$minutes = (int) $local->format( 'G' ) * 60 + (int) $local->format( 'i' );
		$first   = $local->setTime( 0, 0 );
		if ( strtolower( $local->format( 'l' ) ) !== $weekday || $minutes >= $start ) {
			$first = $first->modify( 'next ' . $weekday );
		}
		$dates = [];
		for ( $i = 0; $i < $count; $i++ ) {
			$date    = $first->modify( "+$i weeks" );
			$dates[] = [ 'value' => $date->format( 'Y-m-d' ), 'label' => $date->format( 'l j F Y' ) ];
		}
		return $dates;
	}
}
```

The start-time regex must reject `'13pm'`, `'10:75'`, `'18'`, `'soon'` and `''`, and accept every case in the test. Adjust the pattern, not the tests, if one case disagrees.

`src/RateLimit.php`:

```php
<?php
namespace Elevation\Core;

/**
 * 5 submissions per 10 minutes per IP per form (spec §6.10), as a sliding window over submission times.
 * Pure — the caller keeps the timestamps (a transient keyed by a salted hash of the IP).
 */
final class RateLimit {

	public const MAX    = 5;
	public const WINDOW = 600;

	/** @return list<int> The stamps inside the window ending now; junk and future stamps dropped. */
	public static function recent( array $stamps, int $now, int $window = self::WINDOW ): array {
		$kept = [];
		foreach ( $stamps as $stamp ) {
			if ( is_int( $stamp ) && $stamp > $now - $window && $stamp <= $now ) {
				$kept[] = $stamp;
			}
		}
		return $kept;
	}

	public static function allows( array $stamps, int $now, int $max = self::MAX, int $window = self::WINDOW ): bool {
		return count( self::recent( $stamps, $now, $window ) ) < $max;
	}

	/** Whole minutes (at least 1) until the oldest stamp leaves the window; 0 when there are none. */
	public static function waitMinutes( array $stamps, int $now, int $window = self::WINDOW ): int {
		$recent = self::recent( $stamps, $now, $window );
		return $recent ? max( 1, (int) ceil( ( min( $recent ) + $window - $now ) / 60 ) ) : 0;
	}

	public static function message( int $minutes ): string {
		$minutes = max( 1, $minutes );
		return sprintf( "That's a few submissions in a short time. Please wait about %d %s and try again.", $minutes, 1 === $minutes ? 'minute' : 'minutes' );
	}
}
```

In `elevation-core.php`, after `require_once ELEVATION_CORE_DIR . 'src/YouTube.php';`:

```php
require_once ELEVATION_CORE_DIR . 'src/Forms.php';
require_once ELEVATION_CORE_DIR . 'src/FormRules.php';
require_once ELEVATION_CORE_DIR . 'src/ServiceDates.php';
require_once ELEVATION_CORE_DIR . 'src/RateLimit.php';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK`, with all earlier tests still passing (124 before this task).

- [ ] **Step 5: Commit**

```bash
git add wp-content/plugins/elevation-core/src/{Forms,FormRules,ServiceDates,RateLimit}.php wp-content/plugins/elevation-core/tests/{FormsTest,FormRulesTest,ServiceDatesTest,RateLimitTest}.php wp-content/plugins/elevation-core/elevation-core.php
git commit -m "Form rules, service dates and rate limit as pure, tested classes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Forms as data — `FormSchema`, the nine definitions and `wp elevation forms seed`

**Files:**
- Create: `wp-content/plugins/elevation-core/src/FormSchema.php`, `tests/FormSchemaTest.php`
- Create: `wp-content/plugins/elevation-core/includes/forms-cli.php`
- Create: `seed/forms/{contact,prayer,gift-aid,newsletter,g-squad,plan-a-visit,join-group,connect-card,alpha}.json`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`: add `require_once ELEVATION_CORE_DIR . 'src/FormSchema.php';` after `src/RateLimit.php`, and `require_once ELEVATION_CORE_DIR . 'includes/forms-cli.php';` after `includes/fixtures-cli.php`.
- Modify: `bin/seed.sh`

**Interfaces:**
- Consumes: `Forms::isKey`, `FormRules::requiredMessage`, `FormRules::requiredPaths`, `FormRules::emailMessage` (Task 1); `SeedGuard::decide`, `SeedGuard::hash`.
- Produces:
  - `FormSchema::compile(array $def): array{key:string,title:string,form_fields:array,settings:array,notifications:list<array>,primaryEmail:string}`, which throws `\InvalidArgumentException` with a sentence naming the form.
  - Fluent Forms rows tagged with the form meta `_elevation_form_key` = key and `_elevation_seed_hash`.
  - WP-CLI: `wp elevation forms seed <dir> [--force=<key,key>]`, `wp elevation forms id <key>`, `wp elevation forms list` and `wp elevation forms reset-limits`. The last one is completed by Task 3, which defines the transients.
  - The action `do_action( 'elevation_forms_seeded' )` after a seed run (Task 7 listens).
  - `elevation_form_ids( bool $refresh = false ): array<string,int>`, `elevation_form_id( string $key ): int` and `elevation_form_key( int $id ): ?string` are defined in this task, at the top of `includes/forms-cli.php`'s sibling `includes/forms.php`. Create `includes/forms.php` now with just these three functions (Task 3 adds the rest), and require it after `includes/live.php`.
- Notifications carry an extra key, `elevation`, holding a role string (`''` or `'group-leader'`). Task 5 reads it in `fluentform/email_to`.

**The definition format** (`seed/forms/<key>.json`):

```jsonc
{
  "key": "contact",                    // one of Forms::KEYS
  "title": "Contact",                  // the name in wp-admin → Fluent Forms
  "submit": "Send message",
  "success": { "heading": "…", "text": "…", "more": "…" },   // text and more are optional
  "rows": [
    { "type": "textarea", "name": "message", "label": "Your message", "rows": 6 },   // a full-width field
    [ { "type": "text", "name": "name", "label": "Your name" }, { "type": "email", "name": "email", "label": "Email" } ]   // one row, two columns
  ],
  "notifications": [
    { "name": "Church office", "to": "{contact.email}", "replyTo": "{inputs.email}", "subject": "…", "body": [ "<p>…</p>", "{all_data}" ] }
  ]
}
```

- **Field types:** `text`, `tel`, `email`, `textarea`, `number`, `select`, `radio`, `checkboxes`, `checkbox` (one tick box, stored `["yes"]`), `name` (first and last), `hidden`, `consent` (the tick-box declaration, stored `on`), `html` and `section` (a heading with an optional note).
- **Field keys:**
  - `name`, `label`, `help` and `placeholder`.
  - `autocomplete` (copied onto the input).
  - `value` (the default; `{get.group}` reads the URL).
  - `options`: a list of `"Label"` strings, or of `["value", "Label"]` pairs.
  - `rows`, `min` and `max`.
  - `width` (a percentage, in rows).
  - `class` (added to the field's wrapper).
  - `html` (for `consent`, `html` and `section`).
  - `showIf`: `{ "field": "input_radio_2", "value": "Other" }`.
  - `dynamic: true`, which allows a `select` with no options (the visit dates are filled at render).
- **Required-ness is not in the JSON.** A field is required exactly when `FormRules::requiredMessage($key, $path)` has a message. `compile()` refuses a definition that lacks one of `FormRules::requiredPaths($key)`.
- **Notification keys:**
  - `to`: an address or smartcode, or `field:email` for the person who filled it in.
  - `replyTo`, `subject`, and `body` (a string, or a list of lines joined with newlines).
  - `if`: a field name. The email is sent only when that field isn't blank.
  - `role`: copied into the notification as `elevation`.

- [ ] **Step 1: Write the failing test**

`tests/FormSchemaTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\FormSchema;
use PHPUnit\Framework\TestCase;

final class FormSchemaTest extends TestCase {

	private static function contact( array $change = [] ): array {
		return array_replace(
			[
				'key'           => 'contact',
				'title'         => 'Contact',
				'submit'        => 'Send message',
				'success'       => [ 'heading' => 'Message received', 'text' => 'Thanks & bye <b>' ],
				'rows'          => [
					[
						[ 'type' => 'text', 'name' => 'name', 'label' => 'Your name', 'autocomplete' => 'name' ],
						[ 'type' => 'email', 'name' => 'email', 'label' => 'Email' ],
					],
					[ 'type' => 'tel', 'name' => 'phone', 'label' => 'Phone' ],
					[ 'type' => 'textarea', 'name' => 'message', 'label' => 'Your message', 'rows' => 6 ],
				],
				'notifications' => [ [ 'name' => 'Office', 'to' => '{contact.email}', 'replyTo' => '{inputs.email}', 'subject' => 'Enquiry', 'body' => [ '<p>Hi</p>', '{all_data}' ] ] ],
			],
			$change
		);
	}

	public function test_a_two_field_row_becomes_a_two_column_container(): void {
		$form = FormSchema::compile( self::contact() );
		$row  = $form['form_fields']['fields'][0];
		$this->assertSame( 'container', $row['element'] );
		$this->assertCount( 2, $row['columns'] );
		$this->assertSame( 50.0, (float) $row['columns'][0]['width'] );
		$this->assertSame( 'name', $row['columns'][0]['fields'][0]['attributes']['name'] );
		$this->assertSame( 'name', $row['columns'][0]['fields'][0]['attributes']['autocomplete'] );
		$this->assertSame( 'input_email', $row['columns'][1]['fields'][0]['element'] );
	}

	public function test_required_rules_and_messages_come_from_form_rules(): void {
		$form  = FormSchema::compile( self::contact() );
		$name  = $form['form_fields']['fields'][0]['columns'][0]['fields'][0];
		$email = $form['form_fields']['fields'][0]['columns'][1]['fields'][0];
		$phone = $form['form_fields']['fields'][1];
		$this->assertTrue( $name['settings']['validation_rules']['required']['value'] );
		$this->assertSame( 'Please tell us your name.', $name['settings']['validation_rules']['required']['message'] );
		$this->assertSame( "That doesn't look like a valid email address.", $email['settings']['validation_rules']['email']['message'] );
		$this->assertFalse( $phone['settings']['validation_rules']['required']['value'] );
		$this->assertSame( 'tel', $phone['attributes']['type'] );
		$this->assertSame( 'input_text', $phone['element'] );
		$this->assertSame( 'email', $form['primaryEmail'] );
	}

	public function test_a_definition_missing_a_required_field_is_refused(): void {
		$def         = self::contact();
		$def['rows'] = array_slice( $def['rows'], 0, 2 ); // no "message"
		$this->expectExceptionMessage( 'contact: FormRules requires "message", but the form has no such field.' );
		FormSchema::compile( $def );
	}

	public function test_bad_definitions_are_refused_with_a_reason(): void {
		$cases = [
			'Unknown form key "nope".'                          => self::contact( [ 'key' => 'nope' ] ),
			'contact: two fields are called "email".'           => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'email', 'name' => 'email', 'label' => 'Again' ] ] ) ] ),
			'contact: field type "date" isn\'t supported.'      => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'date', 'name' => 'when' ] ] ) ] ),
			'contact: field name "Bad Name" must be lower-case' => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'text', 'name' => 'Bad Name' ] ] ) ] ),
			'contact: each notification needs to, subject and body.' => self::contact( [ 'notifications' => [ [ 'to' => '', 'subject' => 'x', 'body' => 'y' ] ] ] ),
			'contact: "pick" has no options.'                  => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'select', 'name' => 'pick', 'options' => [] ] ] ) ] ),
		];
		foreach ( $cases as $message => $def ) {
			try {
				FormSchema::compile( $def );
				$this->fail( "accepted: $message" );
			} catch ( \InvalidArgumentException $e ) {
				$this->assertStringStartsWith( $message, $e->getMessage() );
			}
		}
	}

	public function test_name_fields_have_required_first_and_last_parts(): void {
		$form = FormSchema::compile( [
			'key'   => 'connect-card',
			'title' => 'Connect card',
			'rows'  => [ [ 'type' => 'name', 'name' => 'names' ], [ 'type' => 'email', 'name' => 'email', 'label' => 'Email' ] ],
		] );
		$names = $form['form_fields']['fields'][0];
		$this->assertSame( 'input_name', $names['element'] );
		$this->assertSame( 'First name', $names['fields']['first_name']['settings']['label'] );
		$this->assertSame( 'Please tell us your first name.', $names['fields']['first_name']['settings']['validation_rules']['required']['message'] );
		$this->assertTrue( $names['fields']['last_name']['settings']['validation_rules']['required']['value'] );
		$this->assertFalse( $names['fields']['middle_name']['settings']['visible'] );
		$this->assertSame( 'given-name', $names['fields']['first_name']['attributes']['autocomplete'] );
	}

	public function test_options_conditions_and_the_success_message(): void {
		$form = FormSchema::compile( self::contact( [
			'rows' => array_merge( self::contact()['rows'], [
				[ 'type' => 'radio', 'name' => 'how', 'label' => 'How?', 'options' => [ 'Friend', [ 'others', 'Other' ] ] ],
				[ 'type' => 'text', 'name' => 'how_other', 'label' => 'Tell us', 'showIf' => [ 'field' => 'how', 'value' => 'others' ] ],
			] ),
		] ) );
		$fields = $form['form_fields']['fields'];
		$this->assertSame( [ [ 'label' => 'Friend', 'value' => 'Friend', 'calc_value' => '' ], [ 'label' => 'Other', 'value' => 'others', 'calc_value' => '' ] ], $fields[3]['settings']['advanced_options'] );
		$this->assertTrue( $fields[4]['settings']['conditional_logics']['status'] );
		$this->assertSame( [ 'field' => 'how', 'value' => 'others', 'operator' => '=' ], $fields[4]['settings']['conditional_logics']['conditions'][0] );
		$this->assertSame( '<div class="form-success"><h3 class="form-success__title">Message received</h3><p>Thanks &amp; bye &lt;b&gt;</p></div>', $form['settings']['confirmation']['messageToShow'] );
		$this->assertSame( 'hide_form', $form['settings']['confirmation']['samePageFormBehavior'] );
		$this->assertSame( 'Send message', $form['form_fields']['submitButton']['settings']['button_ui']['text'] );
	}

	public function test_notifications(): void {
		$form = FormSchema::compile( self::contact( [
			'notifications' => [
				[ 'name' => 'Office', 'to' => '{contact.email}', 'replyTo' => '{inputs.email}', 'subject' => 'Enquiry', 'body' => [ '<p>Hi</p>', '{all_data}' ] ],
				[ 'to' => 'field:email', 'subject' => 'Thanks', 'body' => 'Bye', 'if' => 'phone', 'role' => 'group-leader' ],
			],
		] ) );
		[ $office, $visitor ] = $form['notifications'];
		$this->assertSame( [ 'email', '{contact.email}', '' ], [ $office['sendTo']['type'], $office['sendTo']['email'], $office['sendTo']['field'] ] );
		$this->assertSame( "<p>Hi</p>\n{all_data}", $office['message'] );
		$this->assertSame( '{inputs.email}', $office['replyTo'] );
		$this->assertSame( '{church.name}', $office['fromName'] );
		$this->assertFalse( $office['conditionals']['status'] );
		$this->assertTrue( $office['enabled'] );
		$this->assertSame( [ 'field', 'email' ], [ $visitor['sendTo']['type'], $visitor['sendTo']['field'] ] );
		$this->assertTrue( $visitor['conditionals']['status'] );
		$this->assertSame( [ 'field' => 'phone', 'operator' => '!=', 'value' => '' ], $visitor['conditionals']['conditions'][0] );
		$this->assertSame( 'group-leader', $visitor['elevation'] );
		$this->assertSame( 'Thanks', $visitor['name'] );
	}

	public function test_the_same_definition_compiles_to_the_same_json(): void {
		$this->assertSame( json_encode( FormSchema::compile( self::contact() ) ), json_encode( FormSchema::compile( self::contact() ) ) );
	}
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm php vendor/bin/phpunit --filter FormSchemaTest`
Expected: `Class "Elevation\Core\FormSchema" not found`.

- [ ] **Step 3: Write `src/FormSchema.php`**

```php
<?php
namespace Elevation\Core;

/**
 * Turns a short form definition (seed/forms/*.json, format in Plan 5 Task 2) into what Fluent Forms stores:
 * the form_fields JSON, the formSettings overrides and one array per email notification. Required fields
 * and their messages come from FormRules, so seed files can't disagree with the server-side check.
 * Pure — no WordPress calls.
 */
final class FormSchema {

	private const ELEMENTS = [
		'text'       => 'input_text',
		'tel'        => 'input_text',
		'email'      => 'input_email',
		'textarea'   => 'textarea',
		'number'     => 'input_number',
		'select'     => 'select',
		'radio'      => 'input_radio',
		'checkboxes' => 'input_checkbox',
		'checkbox'   => 'input_checkbox',
		'name'       => 'input_name',
		'hidden'     => 'input_hidden',
		'consent'    => 'terms_and_condition',
		'html'       => 'custom_html',
		'section'    => 'section_break',
	];

	/** Fluent Forms' editor templates (app/Services/FormBuilder/DefaultElements.php), so the forms stay editable there. */
	private const TEMPLATES = [
		'input_text'          => 'inputText',
		'input_email'         => 'inputText',
		'input_number'        => 'inputText',
		'textarea'            => 'inputTextarea',
		'select'              => 'select',
		'input_radio'         => 'inputCheckable',
		'input_checkbox'      => 'inputCheckable',
		'input_name'          => 'nameFields',
		'input_hidden'        => 'inputHidden',
		'terms_and_condition' => 'termsCheckbox',
		'custom_html'         => 'customHTML',
		'section_break'       => 'sectionBreak',
	];

	/** @return array{key:string,title:string,form_fields:array,settings:array,notifications:list<array>,primaryEmail:string} */
	public static function compile( array $def ): array {
		$key = (string) ( $def['key'] ?? '' );
		if ( ! Forms::isKey( $key ) ) {
			throw new \InvalidArgumentException( "Unknown form key \"$key\"." );
		}
		$title = trim( (string) ( $def['title'] ?? '' ) );
		if ( '' === $title ) {
			throw new \InvalidArgumentException( "$key: the form needs a title." );
		}
		$paths  = [];
		$fields = [];
		$n      = 0;
		foreach ( (array) ( $def['rows'] ?? [] ) as $row ) {
			$cells    = is_array( $row ) && array_is_list( $row ) ? $row : [ $row ];
			$compiled = [];
			foreach ( $cells as $cell ) {
				$compiled[] = self::field( $key, is_array( $cell ) ? $cell : [], $paths, ++$n );
			}
			$fields[] = 1 === count( $compiled ) ? $compiled[0] : self::container( $cells, $compiled, ++$n );
		}
		if ( ! $fields ) {
			throw new \InvalidArgumentException( "$key: the form has no fields." );
		}
		foreach ( FormRules::requiredPaths( $key ) as $path ) {
			if ( ! in_array( $path, $paths, true ) ) {
				throw new \InvalidArgumentException( "$key: FormRules requires \"$path\", but the form has no such field." );
			}
		}
		$notifications = [];
		foreach ( (array) ( $def['notifications'] ?? [] ) as $notification ) {
			$notifications[] = self::notification( $key, is_array( $notification ) ? $notification : [] );
		}
		return [
			'key'           => $key,
			'title'         => $title,
			'form_fields'   => [ 'fields' => $fields, 'submitButton' => self::submit( (string) ( $def['submit'] ?? 'Send' ) ) ],
			'settings'      => self::settings( is_array( $def['success'] ?? null ) ? $def['success'] : [] ),
			'notifications' => $notifications,
			'primaryEmail'  => in_array( 'email', $paths, true ) ? 'email' : '',
		];
	}

	private static function field( string $key, array $f, array &$paths, int $n ): array {
		$type    = (string) ( $f['type'] ?? '' );
		$element = self::ELEMENTS[ $type ] ?? null;
		if ( null === $element ) {
			throw new \InvalidArgumentException( "$key: field type \"$type\" isn't supported." );
		}
		$name  = (string) ( $f['name'] ?? '' );
		$label = (string) ( $f['label'] ?? '' );
		if ( ! in_array( $type, [ 'html', 'section' ], true ) ) {
			if ( ! preg_match( '/^[a-z][a-z0-9_]*$/', $name ) ) {
				throw new \InvalidArgumentException( "$key: field name \"$name\" must be lower-case letters, digits and underscores." );
			}
			if ( in_array( $name, $paths, true ) ) {
				throw new \InvalidArgumentException( "$key: two fields are called \"$name\"." );
			}
			$paths[] = $name;
		}
		$field = [
			'element'        => $element,
			'attributes'     => [ 'name' => $name, 'value' => (string) ( $f['value'] ?? '' ), 'class' => '', 'placeholder' => (string) ( $f['placeholder'] ?? '' ) ],
			'settings'       => [
				'container_class'    => (string) ( $f['class'] ?? '' ),
				'label'              => $label,
				'label_placement'    => '',
				'admin_field_label'  => (string) ( $f['adminLabel'] ?? $label ),
				'help_message'       => (string) ( $f['help'] ?? '' ),
				'validation_rules'   => [ 'required' => self::required( $key, $name ) ],
				'conditional_logics' => self::conditions( $f['showIf'] ?? null ),
			],
			'editor_options' => [ 'title' => $label, 'icon_class' => '', 'template' => self::TEMPLATES[ $element ] ],
			'uniqElKey'      => 'el_' . $n,
		];
		if ( isset( $f['autocomplete'] ) ) {
			$field['attributes']['autocomplete'] = (string) $f['autocomplete'];
		}
		switch ( $type ) {
			case 'text':
			case 'tel':
				$field['attributes'] += [ 'type' => $type, 'maxlength' => '' ];
				$field['settings']   += [ 'prefix_label' => '', 'suffix_label' => '', 'is_unique' => 'no' ];
				break;
			case 'email':
				$field['attributes']['type']                  = 'email';
				$field['settings']['validation_rules']['email'] = self::rule( true, FormRules::emailMessage( $key ) );
				$field['settings']['is_unique']               = 'no';
				break;
			case 'textarea':
				$field['attributes'] += [ 'rows' => (int) ( $f['rows'] ?? 4 ), 'cols' => 2, 'maxlength' => '' ];
				break;
			case 'number':
				$field['attributes'] += [ 'type' => 'number', 'min' => (string) ( $f['min'] ?? '' ), 'max' => (string) ( $f['max'] ?? '' ), 'inputmode' => 'numeric' ];
				$field['settings']   += [ 'number_step' => '', 'numeric_formatter' => '', 'prefix_label' => '', 'suffix_label' => '' ];
				break;
			case 'select':
			case 'radio':
			case 'checkboxes':
				$options = self::options( $f );
				if ( ! $options && empty( $f['dynamic'] ) ) {
					throw new \InvalidArgumentException( "$key: \"$name\" has no options." );
				}
				$field['settings'] += [ 'advanced_options' => $options, 'dynamic_default_value' => '', 'calc_value_status' => false, 'randomize_options' => 'no' ];
				if ( 'select' === $type ) {
					unset( $field['attributes']['placeholder'] );
					$field['attributes']['id']         = '';
					$field['settings']['placeholder']  = (string) ( $f['placeholder'] ?? '' );
					$field['settings']['enable_select_2'] = 'no';
				} else {
					$field['attributes']['type']       = 'radio' === $type ? 'radio' : 'checkbox';
					$field['settings']['display_type'] = '';
					$field['settings']['layout_class'] = '';
					if ( 'checkboxes' === $type ) {
						$field['attributes']['value'] = [];
					}
				}
				break;
			case 'checkbox':
				$field['attributes']                     = [ 'type' => 'checkbox', 'name' => $name, 'value' => [], 'class' => '' ];
				$field['settings']['label']              = '';
				$field['settings']['admin_field_label']  = (string) ( $f['adminLabel'] ?? $label );
				$field['settings']['advanced_options']   = [ [ 'label' => $label, 'value' => 'yes', 'calc_value' => '' ] ];
				$field['settings'] += [ 'dynamic_default_value' => '', 'calc_value_status' => false, 'randomize_options' => 'no', 'display_type' => '', 'layout_class' => '' ];
				break;
			case 'name':
				foreach ( [ 'first_name', 'last_name' ] as $part ) {
					$paths[] = "$name.$part";
				}
				$field['attributes'] = [ 'name' => $name, 'data-type' => 'name-element' ];
				$field['settings']   = [
					'container_class'    => (string) ( $f['class'] ?? '' ),
					'admin_field_label'  => (string) ( $f['adminLabel'] ?? 'Name' ),
					'conditional_logics' => self::conditions( null ),
					'label_placement'    => 'top',
				];
				$field['fields']     = [
					'first_name'  => self::namePart( $key, $name, 'first_name', (string) ( $f['first'] ?? 'First name' ), 'given-name', true ),
					'middle_name' => self::namePart( $key, $name, 'middle_name', 'Middle name', 'additional-name', false ),
					'last_name'   => self::namePart( $key, $name, 'last_name', (string) ( $f['last'] ?? 'Last name' ), 'family-name', true ),
				];
				break;
			case 'hidden':
				$field['attributes'] = [ 'type' => 'hidden', 'name' => $name, 'value' => (string) ( $f['value'] ?? '' ) ];
				$field['settings']   = [ 'admin_field_label' => $label ?: $name ];
				break;
			case 'consent':
				$field['attributes']              = [ 'type' => 'checkbox', 'name' => $name, 'value' => false, 'class' => '' ];
				$field['settings']['tnc_html']    = (string) ( $f['html'] ?? '' );
				$field['settings']['has_checkbox'] = true;
				break;
			case 'html':
				$field['attributes'] = [];
				$field['settings']   = [ 'html_codes' => (string) ( $f['html'] ?? '' ), 'conditional_logics' => self::conditions( null ), 'container_class' => (string) ( $f['class'] ?? '' ) ];
				break;
			case 'section':
				$field['attributes'] = [ 'id' => '', 'class' => (string) ( $f['class'] ?? '' ) ];
				$field['settings']   = [ 'label' => $label, 'description' => (string) ( $f['html'] ?? '' ), 'align' => 'left', 'conditional_logics' => self::conditions( null ) ];
				break;
		}
		return $field;
	}

	private static function namePart( string $key, string $name, string $part, string $label, string $autocomplete, bool $visible ): array {
		return [
			'element'        => 'input_text',
			'attributes'     => [ 'type' => 'text', 'name' => $part, 'value' => '', 'id' => '', 'class' => '', 'placeholder' => '', 'maxlength' => '', 'autocomplete' => $autocomplete ],
			'settings'       => [
				'container_class'    => '',
				'label'              => $label,
				'help_message'       => '',
				'visible'            => $visible,
				'label_placement'    => '',
				'validation_rules'   => [ 'required' => self::required( $key, "$name.$part" ) ],
				'conditional_logics' => [],
			],
			'editor_options' => [ 'template' => 'inputText' ],
		];
	}

	private static function container( array $cells, array $compiled, int $n ): array {
		$columns = [];
		foreach ( $compiled as $i => $field ) {
			$width     = isset( $cells[ $i ]['width'] ) ? (float) $cells[ $i ]['width'] : round( 100 / count( $compiled ), 2 );
			$columns[] = [ 'width' => $width, 'left' => '', 'fields' => [ $field ] ];
		}
		return [
			'element'        => 'container',
			'attributes'     => [],
			'settings'       => [ 'container_class' => 'form-row form-row--' . count( $compiled ), 'conditional_logics' => self::conditions( null ), 'container_width' => '', 'is_width_auto_calc' => true ],
			'columns'        => $columns,
			'editor_options' => [ 'title' => 'Container', 'icon_class' => 'dashicons dashicons-align-center' ],
			'uniqElKey'      => 'el_' . $n,
		];
	}

	private static function submit( string $label ): array {
		return [
			'uniqElKey'      => 'el_submit',
			'element'        => 'button',
			'attributes'     => [ 'type' => 'submit', 'class' => '' ],
			'settings'       => [
				'align'            => 'left',
				'button_style'     => '',
				'container_class'  => '',
				'help_message'     => '',
				'background_color' => '',
				'button_size'      => 'lg',
				'color'            => '',
				'button_ui'        => [ 'type' => 'default', 'text' => $label, 'img_url' => '' ],
			],
			'editor_options' => [ 'title' => 'Submit Button' ],
		];
	}

	private static function settings( array $success ): array {
		$html = '<div class="form-success"><h3 class="form-success__title">' . self::esc( (string) ( $success['heading'] ?? 'Thank you' ) ) . '</h3>';
		if ( '' !== (string) ( $success['text'] ?? '' ) ) {
			$html .= '<p>' . self::esc( (string) $success['text'] ) . '</p>';
		}
		if ( '' !== (string) ( $success['more'] ?? '' ) ) {
			$html .= '<p class="form-success__more">' . self::esc( (string) $success['more'] ) . '</p>';
		}
		return [
			'confirmation' => [ 'redirectTo' => 'samePage', 'messageToShow' => $html . '</div>', 'customPage' => null, 'samePageFormBehavior' => 'hide_form', 'customUrl' => null ],
			'layout'       => [ 'labelPlacement' => 'top', 'helpMessagePlacement' => 'under_input', 'errorMessagePlacement' => 'inline', 'asteriskPlacement' => 'asterisk-right', 'cssClassName' => '' ],
		];
	}

	private static function notification( string $key, array $n ): array {
		$to      = trim( (string) ( $n['to'] ?? '' ) );
		$subject = trim( (string) ( $n['subject'] ?? '' ) );
		$body    = is_array( $n['body'] ?? null ) ? implode( "\n", array_map( 'strval', $n['body'] ) ) : (string) ( $n['body'] ?? '' );
		if ( '' === $to || '' === $subject || '' === trim( $body ) ) {
			throw new \InvalidArgumentException( "$key: each notification needs to, subject and body." );
		}
		$field = str_starts_with( $to, 'field:' ) ? substr( $to, 6 ) : '';
		$if    = (string) ( $n['if'] ?? '' );
		return [
			'name'           => (string) ( $n['name'] ?? $subject ),
			'sendTo'         => [
				'type'    => '' !== $field ? 'field' : 'email',
				'email'   => '' !== $field ? '' : $to,
				'field'   => $field,
				'routing' => [ [ 'input_value' => '', 'field' => '', 'operator' => '=', 'value' => '' ] ],
			],
			'fromName'       => '{church.name}',
			'fromEmail'      => '',
			'replyTo'        => (string) ( $n['replyTo'] ?? '' ),
			'bcc'            => '',
			'cc'             => '',
			'subject'        => $subject,
			'message'        => $body,
			'asPlainText'    => 'no',
			'enabled'        => true,
			'conditionals'   => [
				'status'     => '' !== $if,
				'type'       => 'all',
				'conditions' => [ [ 'field' => $if, 'operator' => '' !== $if ? '!=' : '=', 'value' => '' ] ],
			],
			'email_template' => '',
			'elevation'      => (string) ( $n['role'] ?? '' ),
		];
	}

	private static function required( string $key, string $path ): array {
		$message = FormRules::requiredMessage( $key, $path );
		return self::rule( null !== $message, $message ?? '' );
	}

	private static function rule( bool $on, string $message ): array {
		return [ 'value' => $on, 'message' => $message, 'global' => false, 'global_message' => '' ];
	}

	private static function conditions( mixed $showIf ): array {
		if ( ! is_array( $showIf ) || '' === (string) ( $showIf['field'] ?? '' ) ) {
			return [ 'type' => 'any', 'status' => false, 'conditions' => [ [ 'field' => '', 'value' => '', 'operator' => '' ] ] ];
		}
		return [ 'type' => 'any', 'status' => true, 'conditions' => [ [ 'field' => (string) $showIf['field'], 'value' => (string) ( $showIf['value'] ?? '' ), 'operator' => '=' ] ] ];
	}

	/** @return list<array{label:string,value:string,calc_value:string}> */
	private static function options( array $f ): array {
		$options = [];
		foreach ( (array) ( $f['options'] ?? [] ) as $option ) {
			$value     = is_array( $option ) ? (string) ( $option[0] ?? '' ) : (string) $option;
			$label     = is_array( $option ) ? (string) ( $option[1] ?? $value ) : $value;
			$options[] = [ 'label' => $label, 'value' => $value, 'calc_value' => '' ];
		}
		return $options;
	}

	private static function esc( string $text ): string {
		return htmlspecialchars( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK`.

- [ ] **Step 5: Write the nine definitions**

Copy is the redesign's where it exists; **(new copy)** marks the rest. Smartcodes such as `{contact.welcomeInbox}` and `{service.startTime}` are resolved at send time by Task 3. `{elevation.visitDate}`, `{elevation.groupName}`, `{elevation.urgentLine}`, `{elevation.prayerFrom}`, `{elevation.shareWithTeam}` and `{elevation.declaration}` are filled by Task 3 and Task 5.

`seed/forms/contact.json`:

```json
{
  "key": "contact",
  "title": "Contact",
  "submit": "Send message",
  "success": { "heading": "Message received", "text": "Thank you — your message is with us and we'll be in touch soon." },
  "rows": [
    [ { "type": "text", "name": "name", "label": "Your name", "autocomplete": "name" },
      { "type": "email", "name": "email", "label": "Email", "autocomplete": "email" } ],
    [ { "type": "tel", "name": "phone", "label": "Phone", "autocomplete": "tel" },
      { "type": "text", "name": "subject", "label": "What's it about?", "placeholder": "Visiting, Connect Groups, serving…" } ],
    { "type": "textarea", "name": "message", "label": "Your message", "rows": 6 }
  ],
  "notifications": [
    { "name": "Church office", "to": "{contact.email}", "replyTo": "{inputs.email}",
      "subject": "Website enquiry from {inputs.name}",
      "body": [ "<p>From: {inputs.name}<br>Email: {inputs.email}<br>Phone: {inputs.phone}</p>", "<p><strong>{inputs.subject}</strong></p>", "<p>{inputs.message}</p>" ] }
  ]
}
```

`seed/forms/prayer.json`:

```json
{
  "key": "prayer",
  "title": "Prayer",
  "submit": "Send prayer request",
  "success": { "heading": "We're praying", "text": "Thank you — we've received your request and our prayer team will be praying." },
  "rows": [
    [ { "type": "text", "name": "name", "label": "Your name", "help": "Optional — you're welcome to stay anonymous.", "autocomplete": "name" },
      { "type": "email", "name": "email", "label": "Email", "help": "Only if you'd like us to follow up.", "autocomplete": "email" } ],
    { "type": "tel", "name": "phone", "label": "Phone", "autocomplete": "tel" },
    { "type": "textarea", "name": "request", "label": "What can we pray for?", "rows": 6 },
    { "type": "checkbox", "name": "share_with_team", "label": "Share this with our wider prayer team.", "adminLabel": "Share with the wider prayer team", "help": "Leave unticked and only the pastoral team will see it.", "class": "form-tick" },
    { "type": "checkbox", "name": "is_urgent", "label": "This is urgent.", "adminLabel": "Urgent", "class": "form-tick" }
  ],
  "notifications": [
    { "name": "Prayer inbox", "to": "{contact.prayerInbox}", "replyTo": "{inputs.email}",
      "subject": "New prayer request",
      "body": [ "{elevation.urgentLine}", "<p>From: {elevation.prayerFrom}<br>Email: {inputs.email}<br>Phone: {inputs.phone}<br>Share with the wider prayer team: {elevation.shareWithTeam}</p>", "<p><strong>Request:</strong></p>", "<p>{inputs.request}</p>" ] }
  ]
}
```

`seed/forms/gift-aid.json`:

```json
{
  "key": "gift-aid",
  "title": "Gift Aid",
  "submit": "Submit my declaration",
  "success": {
    "heading": "Declaration received",
    "text": "Thank you — your Gift Aid declaration is recorded. Every £10 you give is now worth £12.50 to the church, at no extra cost to you.",
    "more": "Please let us know if you change your name or address, stop paying enough tax, or want to cancel."
  },
  "rows": [
    { "type": "html", "html": "<div class=\"gift-aid-declaration\"><p>{elevation.declaration}</p></div>" },
    { "type": "section", "label": "Your details" },
    [ { "type": "select", "name": "title", "label": "Title", "placeholder": "—", "options": [ "Mr", "Mrs", "Miss", "Ms", "Dr", "Rev", "Pastor" ], "width": 20 },
      { "type": "text", "name": "first_name", "label": "First name", "help": "Please give your full first name, not an initial.", "autocomplete": "given-name", "width": 40 },
      { "type": "text", "name": "last_name", "label": "Surname", "autocomplete": "family-name", "width": 40 } ],
    { "type": "section", "label": "Your home address", "html": "HMRC requires your home address to identify you as a UK taxpayer. A work or c/o address can't be accepted." },
    { "type": "text", "name": "address_line1", "label": "House name or number, and street", "autocomplete": "address-line1" },
    { "type": "text", "name": "address_line2", "label": "Address line 2", "autocomplete": "address-line2" },
    [ { "type": "text", "name": "city", "label": "Town or city", "value": "Manchester", "autocomplete": "address-level2" },
      { "type": "text", "name": "postcode", "label": "Postcode", "autocomplete": "postal-code", "class": "is-uppercase" } ],
    { "type": "section", "label": "How we reach you", "html": "Optional, but it helps us confirm your declaration and let you know if anything changes." },
    [ { "type": "email", "name": "email", "label": "Email", "autocomplete": "email" },
      { "type": "tel", "name": "phone", "label": "Phone", "autocomplete": "tel" } ],
    { "type": "consent", "name": "declaration_accepted", "label": "Declaration", "html": "<b>Yes, I want to Gift Aid my giving.</b> I confirm the declaration above and that I am a UK taxpayer.", "class": "gift-aid-confirm" },
    { "type": "hidden", "name": "declaration_text", "label": "Declaration wording" },
    { "type": "hidden", "name": "declaration_version", "label": "Declaration version" }
  ],
  "notifications": [
    { "name": "Church office", "to": "{contact.email}",
      "subject": "New Gift Aid declaration",
      "body": [ "<p>{inputs.first_name} {inputs.last_name} ({inputs.postcode}) has made a Gift Aid declaration.</p>", "<p>The full declaration is in wp-admin under Fluent Forms → Gift Aid → Entries.</p>" ] }
  ]
}
```

`seed/forms/newsletter.json`:

```json
{
  "key": "newsletter",
  "title": "Newsletter",
  "submit": "Subscribe",
  "success": { "heading": "You're on the list — thank you." },
  "rows": [
    { "type": "email", "name": "email", "label": "Email address", "placeholder": "you@email.com", "autocomplete": "email", "class": "is-label-hidden" }
  ],
  "notifications": []
}
```

`seed/forms/g-squad.json` (new copy; team names from the redesign's `serveTeams`):

```json
{
  "key": "g-squad",
  "title": "G-Squad sign-up",
  "submit": "Join the G-Squad",
  "success": { "heading": "Welcome to the G-Squad", "text": "Thank you — a team leader will be in touch soon to help you get started." },
  "rows": [
    { "type": "name", "name": "names" },
    [ { "type": "email", "name": "email", "label": "Email", "autocomplete": "email" },
      { "type": "tel", "name": "phone", "label": "Phone", "autocomplete": "tel" } ],
    { "type": "checkboxes", "name": "teams", "label": "Where would you like to serve?", "help": "Pick as many as you like.", "class": "form-choices--columns",
      "options": [ "Care", "Family Life", "Men of Honour", "Missions", "Worship", "Ushering", "Hospitality & Guest Management", "Protocol & Traffic Management", "The Jewels (women)", "Maturity", "Surge (youth)", "4One", "Production", "Multimedia", "Setup & Sound", "Media & Broadcasting", "Membership", "Communications", "Prayer", "The Seeds", "Not sure yet — help me choose" ] },
    { "type": "textarea", "name": "message", "label": "Anything you'd like us to know?", "rows": 4 }
  ],
  "notifications": [
    { "name": "Welcome team", "to": "{contact.welcomeInbox}", "replyTo": "{inputs.email}",
      "subject": "G-Squad sign-up: {inputs.names.first_name} {inputs.names.last_name}",
      "body": [ "<p>A new G-Squad sign-up from the website.</p>", "{all_data}" ] }
  ]
}
```

`seed/forms/plan-a-visit.json` (new copy):

```json
{
  "key": "plan-a-visit",
  "title": "Plan a Visit",
  "submit": "Plan my visit",
  "success": { "heading": "We can't wait to meet you", "text": "Thank you — we've emailed you the time, the address and everything you need. See you soon!" },
  "rows": [
    { "type": "name", "name": "names" },
    [ { "type": "email", "name": "email", "label": "Email", "autocomplete": "email" },
      { "type": "tel", "name": "phone", "label": "Phone", "autocomplete": "tel" } ],
    { "type": "select", "name": "visit_date", "label": "Which {service.day} are you coming?", "placeholder": "Choose a date", "dynamic": true },
    [ { "type": "number", "name": "adults", "label": "Adults", "value": "1", "min": 1, "max": 20 },
      { "type": "number", "name": "children", "label": "Children", "value": "0", "min": 0, "max": 20 } ],
    { "type": "text", "name": "children_ages", "label": "Children's ages", "help": "For example: 3 and 7. Please don't include names." },
    { "type": "textarea", "name": "notes", "label": "Anything we should know?", "help": "Questions, access needs, or anything that would help us look after you.", "rows": 4 }
  ],
  "notifications": [
    { "name": "Welcome team", "to": "{contact.welcomeInbox}", "replyTo": "{inputs.email}",
      "subject": "Visit plan: {inputs.names.first_name} {inputs.names.last_name}, {elevation.visitDate}",
      "body": [ "<p>Someone is planning to visit on {elevation.visitDate}.</p>", "{all_data}" ] },
    { "name": "Visitor confirmation", "to": "field:email", "replyTo": "{contact.welcomeInbox}",
      "subject": "See you on {elevation.visitDate}",
      "body": [
        "<p>Hi {inputs.names.first_name},</p>",
        "<p>Thank you for letting us know you're coming — we can't wait to meet you.</p>",
        "<p><strong>When:</strong> {elevation.visitDate} at {service.startTime}. {service.arrivalNote}.</p>",
        "<p><strong>Where:</strong> {location.full}<br><a href=\"{location.mapsUrl}\">Open in Google Maps</a></p>",
        "<p><strong>What to expect:</strong> come as you are. Someone from our welcome team will meet you at the door, help you find a seat and answer any questions.</p>",
        "<p><strong>Bringing children?</strong> The Seeds is our church for children, running during the service in a safe, friendly space. Let the welcome team know when you arrive and they'll show you where to go.</p>",
        "<p>If anything changes, or you have a question before you come, just reply to this email.</p>",
        "<p>See you soon,<br>{church.name}</p>"
      ] }
  ]
}
```

`seed/forms/join-group.json` (new copy):

```json
{
  "key": "join-group",
  "title": "Join a Connect Group",
  "submit": "Ask to join",
  "success": { "heading": "Request sent", "text": "Thank you — the group leader or our welcome team will be in touch soon." },
  "rows": [
    { "type": "hidden", "name": "group_id", "label": "Group", "value": "{get.group}" },
    { "type": "name", "name": "names" },
    [ { "type": "email", "name": "email", "label": "Email", "autocomplete": "email" },
      { "type": "tel", "name": "phone", "label": "Phone", "autocomplete": "tel" } ],
    { "type": "textarea", "name": "message", "label": "Anything you'd like the leader to know?", "rows": 4 }
  ],
  "notifications": [
    { "name": "Group leader", "role": "group-leader", "if": "group_id", "to": "{contact.welcomeInbox}", "replyTo": "{inputs.email}",
      "subject": "Connect Group request: {elevation.groupName}",
      "body": [ "<p>Someone would like to join {elevation.groupName}. Please get in touch with them.</p>", "{all_data_without_hidden_fields}" ] },
    { "name": "Welcome team", "to": "{contact.welcomeInbox}", "replyTo": "{inputs.email}",
      "subject": "Connect Group request: {elevation.groupName}",
      "body": [ "<p>A Connect Group request from the website. Group: {elevation.groupName}.</p>", "{all_data_without_hidden_fields}" ] }
  ]
}
```

The group leader notification's `to` is a placeholder that Task 5 replaces with the leader's address at send time. Fluent Forms skips a notification whose recipient is empty before its `email_to` filter runs, so the placeholder must not be blank.

`seed/forms/connect-card.json` (the live Guest form's questions and field names, minus the address and country, plus a postcode):

```json
{
  "key": "connect-card",
  "title": "Connect card",
  "submit": "Send my connect card",
  "success": { "heading": "Thanks for connecting", "text": "We're so glad you came. Someone from our welcome team will be in touch." },
  "rows": [
    { "type": "name", "name": "names" },
    [ { "type": "email", "name": "email", "label": "Email", "autocomplete": "email" },
      { "type": "tel", "name": "phone", "label": "Phone", "autocomplete": "tel" } ],
    { "type": "text", "name": "postcode", "label": "Postcode", "help": "Just your postcode, not your full address — it helps us suggest a group near you.", "autocomplete": "postal-code", "class": "is-uppercase" },
    [ { "type": "select", "name": "dropdown", "label": "How did you hear about us?", "placeholder": "Choose one",
        "options": [ "A friend", "Family", "Social media", [ "Attended a Different Campus", "Another Elevation campus" ], "Passing by our venue", [ "others", "Other" ] ] },
      { "type": "select", "name": "dropdown_1", "label": "What did you enjoy most about your visit?", "placeholder": "Choose one",
        "options": [ "Worship", [ "Sermon", "The message" ], "Hospitality", [ "Altar Call", "The altar call" ], [ "Free Text", "Something else" ] ] } ],
    { "type": "radio", "name": "input_radio", "label": "Would you consider making {church.name} your church?", "options": [ "Yes", "No", "Maybe" ], "class": "form-choices--inline" },
    { "type": "textarea", "name": "description", "label": "Is there anything you'd like us to pray about?", "rows": 3 },
    { "type": "textarea", "name": "description_1", "label": "Any other comments?", "rows": 3 }
  ],
  "notifications": [
    { "name": "Welcome team", "to": "{contact.welcomeInbox}", "replyTo": "{inputs.email}",
      "subject": "Connect card: {inputs.names.first_name} {inputs.names.last_name}",
      "body": [ "<p>A connect card from the website.</p>", "{all_data}" ] }
  ]
}
```

`seed/forms/alpha.json` (the live form 7's field names and option values; labels lightly tidied):

```json
{
  "key": "alpha",
  "title": "Alpha registration",
  "submit": "Sign me up",
  "success": { "heading": "You're signed up", "text": "Thank you — the Alpha team will be in touch with the details." },
  "rows": [
    { "type": "name", "name": "names" },
    [ { "type": "tel", "name": "input_text_2", "label": "Phone", "autocomplete": "tel", "adminLabel": "Phone" },
      { "type": "email", "name": "email", "label": "Email", "autocomplete": "email" } ],
    { "type": "radio", "name": "input_radio", "label": "Gender", "options": [ "Female", "Male", "Prefer not to say" ], "class": "form-choices--inline" },
    { "type": "select", "name": "dropdown", "label": "Age range", "placeholder": "Choose one",
      "options": [ "20 or below", "21 - 30", "31 - 40", "41 - 50", "51 - 60", "61 or above", "Prefer not to say" ] },
    { "type": "radio", "name": "input_radio_1", "label": "Have you been to {church.name} before?", "options": [ [ "yes", "Yes" ], [ "no", "No" ] ], "class": "form-choices--inline" },
    { "type": "radio", "name": "input_radio_2", "label": "How did you hear about this Alpha course?",
      "options": [ "Word of mouth", "Social Media", "Posters/Invitation Card", "In Church", "The Church's Website", "Alpha Course's Website", "Church in the Park Event", "Other" ] },
    { "type": "text", "name": "input_text", "label": "If other, please tell us more", "showIf": { "field": "input_radio_2", "value": "Other" } },
    { "type": "radio", "name": "input_radio_3", "label": "Consent", "options": [ [ "I agree", "I give consent to {church.name} to contact me by email or telephone about this course." ] ] }
  ],
  "notifications": [
    { "name": "Welcome team", "to": "{contact.welcomeInbox}", "replyTo": "{inputs.email}",
      "subject": "Alpha registration: {inputs.names.first_name} {inputs.names.last_name}",
      "body": [ "<p>A new Alpha registration from the website.</p>", "{all_data}" ] }
  ]
}
```

- [ ] **Step 6: Write the CLI and the lookup functions**

`includes/forms.php` (Task 3 extends this file; for now only the lookup):

```php
<?php
/**
 * The church's Fluent Forms at run time (spec §6.7, §6.10). Forms are found by their seed key
 * (form meta "_elevation_form_key", written by `wp elevation forms seed`), never by database ID.
 */
defined( 'ABSPATH' ) || exit;

/** @return array<string,int> form key => Fluent Forms form ID. Empty when Fluent Forms isn't installed. */
function elevation_form_ids( bool $refresh = false ): array {
	static $ids = null;
	if ( null === $ids || $refresh ) {
		global $wpdb;
		$ids   = [];
		$table = $wpdb->prefix . 'fluentform_form_meta';
		if ( $table === $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) ) {
			foreach ( $wpdb->get_results( "SELECT form_id, value FROM $table WHERE meta_key = '_elevation_form_key' ORDER BY form_id" ) as $row ) { // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name only.
				$ids[ (string) $row->value ] ??= (int) $row->form_id;
			}
		}
	}
	return $ids;
}

function elevation_form_id( string $key ): int {
	return elevation_form_ids()[ $key ] ?? 0;
}

function elevation_form_key( int $id ): ?string {
	$key = array_search( $id, elevation_form_ids(), true );
	return false === $key ? null : $key;
}
```

`includes/forms-cli.php`:

```php
<?php
/** `wp elevation forms …`: the church's Fluent Forms from seed/forms/*.json (spec §6.10), plus small helpers. */
use Elevation\Core\FormSchema;
use Elevation\Core\Forms;
use Elevation\Core\SeedGuard;

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * ## EXAMPLES
 *     wp elevation forms seed /seed/forms [--force=contact,alpha]
 *     wp elevation forms id contact
 *     wp elevation forms list
 *     wp elevation forms reset-limits
 */
WP_CLI::add_command( 'elevation forms', function ( array $args, array $assoc ) {
	if ( ! function_exists( 'wpFluentForm' ) ) {
		WP_CLI::error( "Fluent Forms isn't active." );
	}
	switch ( $args[0] ?? '' ) {
		case 'seed':
			$force = array_values( array_filter( array_map( 'trim', explode( ',', (string) ( $assoc['force'] ?? '' ) ) ) ) );
			elevation_forms_seed( (string) ( $args[1] ?? '' ), $force );
			return;
		case 'id':
			$id = elevation_form_id( (string) ( $args[1] ?? '' ) );
			$id ? WP_CLI::line( (string) $id ) : WP_CLI::error( 'No church form has that key.' );
			return;
		case 'list':
			foreach ( Forms::KEYS as $key ) {
				WP_CLI::line( sprintf( '%-13s %s', $key, elevation_form_id( $key ) ?: '—' ) );
			}
			return;
		case 'reset-limits':
			global $wpdb;
			$rows = $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '\\_transient\\_elevation\\_rl\\_%' OR option_name LIKE '\\_transient\\_timeout\\_elevation\\_rl\\_%'" );
			WP_CLI::success( sprintf( 'Cleared %d rate-limit row(s).', (int) $rows ) );
			return;
	}
	WP_CLI::error( 'Usage: wp elevation forms seed <dir> [--force=<keys>] | id <key> | list | reset-limits' );
} );

function elevation_forms_seed( string $dir, array $force ): void {
	$files = glob( rtrim( $dir, '/' ) . '/*.json' ) ?: [];
	sort( $files );
	if ( ! $files ) {
		WP_CLI::error( "No form definitions in $dir." );
	}
	$seen = [];
	foreach ( $files as $file ) {
		$def = json_decode( (string) file_get_contents( $file ), true );
		if ( ! is_array( $def ) ) {
			WP_CLI::error( basename( $file ) . ' is not valid JSON.' );
		}
		try {
			$form = FormSchema::compile( $def );
		} catch ( \InvalidArgumentException $e ) {
			WP_CLI::error( basename( $file ) . ': ' . $e->getMessage() );
		}
		if ( isset( $seen[ $form['key'] ] ) ) {
			WP_CLI::error( "Two files define the {$form['key']} form." );
		}
		$seen[ $form['key'] ] = true;
		elevation_forms_seed_one( $form, in_array( $form['key'], $force, true ) );
	}
	$missing = array_diff( Forms::KEYS, array_keys( $seen ) );
	if ( $missing ) {
		WP_CLI::warning( 'No definition for: ' . implode( ', ', $missing ) );
	}
	elevation_form_ids( true );
	do_action( 'elevation_forms_seeded' );
}

/** What the seed guard compares: title, fields, settings and notifications, re-encoded the same way each time. */
function elevation_forms_seed_content( string $title, string $fields_json, array $settings, array $notifications ): string {
	return (string) wp_json_encode( [ $title, json_decode( $fields_json, true ), $settings, $notifications ] );
}

function elevation_forms_seed_one( array $form, bool $force ): void {
	global $wpdb;
	$forms_table = $wpdb->prefix . 'fluentform_forms';
	$meta_table  = $wpdb->prefix . 'fluentform_form_meta';
	$key         = $form['key'];
	$settings    = array_replace_recursive( \FluentForm\App\Models\Form::getFormsDefaultSettings(), $form['settings'] );
	$fields_json = (string) wp_json_encode( $form['form_fields'] );
	$new         = elevation_forms_seed_content( $form['title'], $fields_json, $settings, $form['notifications'] );

	$id      = elevation_form_id( $key );
	$current = null;
	$stored  = null;
	if ( $id ) {
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT title, form_fields FROM $forms_table WHERE id = %d", $id ) );
		if ( $row ) {
			$meta    = static fn ( string $k ) => $wpdb->get_col( $wpdb->prepare( "SELECT value FROM $meta_table WHERE form_id = %d AND meta_key = %s ORDER BY id", $id, $k ) );
			$current = elevation_forms_seed_content(
				(string) $row->title,
				(string) $row->form_fields,
				json_decode( (string) ( $meta( 'formSettings' )[0] ?? '' ), true ) ?: [],
				array_map( static fn ( $v ) => json_decode( (string) $v, true ), $meta( 'notifications' ) )
			);
			$stored  = $meta( '_elevation_seed_hash' )[0] ?? null;
		} else {
			$id = 0; // the tag outlived its form
		}
	}

	$decision = SeedGuard::decide( $stored, $current, $new, $force );
	if ( SeedGuard::UNCHANGED === $decision ) {
		WP_CLI::log( "Unchanged form $key (#$id)" );
		return;
	}
	if ( SeedGuard::SKIP === $decision ) {
		WP_CLI::warning( "Skipped form $key (#$id): it was edited in Fluent Forms after it was seeded. Re-run with SEED_FORCE=\"form:$key\" to overwrite it." );
		return;
	}
	$now = current_time( 'mysql' );
	if ( SeedGuard::CREATE === $decision ) {
		$wpdb->insert( $forms_table, [
			'title'       => $form['title'],
			'status'      => 'published',
			'form_fields' => $fields_json,
			'has_payment' => 0,
			'type'        => 'form',
			'created_by'  => get_current_user_id(),
			'created_at'  => $now,
			'updated_at'  => $now,
		] );
		$id = (int) $wpdb->insert_id;
		$id || WP_CLI::error( "Couldn't create the $key form: " . $wpdb->last_error );
	} else {
		$wpdb->update( $forms_table, [ 'title' => $form['title'], 'form_fields' => $fields_json, 'status' => 'published', 'updated_at' => $now ], [ 'id' => $id ] );
	}
	$wpdb->query( $wpdb->prepare( "DELETE FROM $meta_table WHERE form_id = %d AND meta_key IN ('formSettings','notifications','_primary_email_field','_elevation_form_key','_elevation_seed_hash')", $id ) );
	$rows = [
		[ 'formSettings', wp_json_encode( $settings ) ],
		[ '_primary_email_field', $form['primaryEmail'] ],
		[ '_elevation_form_key', $key ],
		[ '_elevation_seed_hash', SeedGuard::hash( $new ) ],
	];
	foreach ( $form['notifications'] as $notification ) {
		$rows[] = [ 'notifications', wp_json_encode( $notification ) ];
	}
	foreach ( $rows as [ $meta_key, $value ] ) {
		$wpdb->insert( $meta_table, [ 'form_id' => $id, 'meta_key' => $meta_key, 'value' => (string) $value ] );
	}
	WP_CLI::log( ( SeedGuard::CREATE === $decision ? 'Created' : 'Updated' ) . " form $key (#$id)" );
}
```

Before relying on it, confirm two things:
1. `\FluentForm\App\Models\Form::getFormsDefaultSettings()` can be called with no argument. It takes `$formId = false`.
2. The `fluentform_forms` columns match the insert. Run `wp db query "DESCRIBE wp6d_fluentform_forms"`.

If a column is `NOT NULL` without a default, such as `appearance_settings`, add it with `''`.

Also add the `require_once` lines listed under **Files**. `includes/forms.php` goes after `includes/live.php`, and `includes/forms-cli.php` after `includes/fixtures-cli.php`.

In `bin/seed.sh`, add this after the `wp elevation fixtures events …` line:

```bash
# The church's Fluent Forms (spec §6.10), from seed/forms/*.json. A form edited in Fluent Forms is skipped
# unless SEED_FORCE names it as "form:<key>".
form_force=$(for word in ${SEED_FORCE:-}; do case $word in form:*) printf '%s,' "${word#form:}" ;; esac; done)
wp elevation forms seed /seed/forms --force="${form_force%,}"
```

- [ ] **Step 7: Seed and check**

```bash
docker compose run --rm -T wpcli wp --user=admin elevation forms seed /seed/forms
docker compose run --rm -T wpcli wp --user=admin elevation forms list
docker compose run --rm -T wpcli wp --user=admin elevation forms seed /seed/forms
```

Expected:
- The first run prints `Created form <key> (#N)` nine times.
- `list` shows nine IDs.
- The second run prints `Unchanged form <key>` nine times.

Then check the hash guard:
1. Change the contact form's title in the database: `wp db query "UPDATE wp6d_fluentform_forms SET title='Contact (edited)' WHERE id=$(wp elevation forms id contact)"`.
2. Re-seed. Expected: `Skipped form contact … SEED_FORCE="form:contact"`.
3. Run `SEED_FORCE="form:contact"` through `./bin/seed.sh`, or pass `--force=contact` to the seed command directly. Expected: `Updated form contact`, and the title back to `Contact`.

Finally, render each form once, outside any page:

```bash
for key in contact prayer gift-aid newsletter g-squad plan-a-visit join-group connect-card alpha; do
  docker compose run --rm -T wpcli wp --user=admin eval "echo strlen( do_shortcode( '[fluentform id=\"' . elevation_form_id( '$key' ) . '\"]' ) ), PHP_EOL;"
done
```

Expected: nine numbers above 1000, with no PHP warnings in the output or in `wp-content/debug.log`. A 0 means Fluent Forms refused the form, usually because `formSettings` is missing or the fields are malformed. Compare against a form made in the Fluent Forms editor with `wp db query "SELECT form_fields FROM wp6d_fluentform_forms WHERE id=<n>"`.

- [ ] **Step 8: Commit**

```bash
git add wp-content/plugins/elevation-core/src/FormSchema.php wp-content/plugins/elevation-core/tests/FormSchemaTest.php wp-content/plugins/elevation-core/includes/forms.php wp-content/plugins/elevation-core/includes/forms-cli.php wp-content/plugins/elevation-core/elevation-core.php seed/forms bin/seed.sh
git commit -m "The nine church forms as seed JSON, compiled into Fluent Forms by wp elevation forms seed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Forms at run time — rules, rate limit, smartcodes, emails and the `elevation/form` block

**Files:**
- Modify: `wp-content/plugins/elevation-core/includes/forms.php` (append below the Task 2 lookup functions)
- Modify: `wp-content/plugins/elevation-core/includes/forms-cli.php`: add `purge-test-entries`.
- Create: `wp-content/plugins/elevation-core/src/blocks/form/{block.json,index.js,render.php}`
- Create: `bin/submit-form.sh`, `bin/mail.sh` (both `chmod +x`)

**Interfaces:**
- Consumes: Task 1 classes; `elevation_form_id`, `elevation_form_key` and `elevation_form_ids` (Task 2); `elevation_public_setting`, `elevation_setting` (`includes/settings.php`); `EventTime::formatDate`.
- Produces:
  - `elevation_form_key_of( mixed $form ): ?string`, which takes Fluent Forms' form object.
  - `elevation_visit_dates( ?DateTimeImmutable $now = null ): array`, the `ServiceDates::next()` list for the current settings.
  - `elevation_form_placeholders( string $text, array $data, bool $html ): string`.
  - The block `elevation/form` with attribute `form` (a key). It renders `<div class="wp-block-elevation-form form-box form-box--<key>">`, wrapping Fluent Forms' markup.
  - The hook point `elevation_form_before` (`do_action( 'elevation_form_before', $key )` inside the box, before the form). Task 5 prints the chosen group there.
  - Transients `elevation_rl_<md5>` (rate-limit stamps, 10 minutes).
  - Scripts `bin/submit-form.sh <key> name=value …` (prints Fluent Forms' JSON answer) and `bin/mail.sh [list|show N|clear]`.
  - Task 5 defines `elevation_group_name( int $id ): string` and `elevation_joinable_group_ids(): array`. This task calls them only through `function_exists`.

- [ ] **Step 1: Write the runtime hooks**

Put these four lines at the top of `includes/forms.php`, under its docblock and above `defined( 'ABSPATH' ) || exit;`:

```php
use Elevation\Core\EventTime;
use Elevation\Core\FormRules;
use Elevation\Core\RateLimit;
use Elevation\Core\ServiceDates;
```

Then append the rest to the end of the file:

```php
/** The seed key of a Fluent Forms form object (or null for forms that aren't the church's). */
function elevation_form_key_of( mixed $form ): ?string {
	return is_object( $form ) && isset( $form->id ) ? elevation_form_key( (int) $form->id ) : null;
}

/** @return list<array{value:string,label:string}> The next 8 service dates for the current Church Settings. */
function elevation_visit_dates( ?DateTimeImmutable $now = null ): array {
	return ServiceDates::next( (string) elevation_setting( 'service.day' ), (string) elevation_setting( 'service.startTime' ), $now ?? new DateTimeImmutable( 'now' ), 8 );
}

// Settings smartcodes: {contact.welcomeInbox}, {service.startTime}, {location.full}, … in recipients, subjects,
// email bodies and success messages resolve to the current Church Settings when the email is sent.
foreach ( [ 'church', 'service', 'location', 'contact', 'socials', 'giving' ] as $elevation_group ) {
	add_filter( "fluentform/smartcode_group_$elevation_group", static function ( $property ) use ( $elevation_group ) {
		$value = elevation_public_setting( $elevation_group . '.' . $property );
		return null === $value ? $property : esc_html( (string) $value );
	} );
}

// {elevation.declaration} inside a form's own HTML (the Gift Aid declaration box). Check the third argument's
// shape in EditorShortcodeParser.php (around line 150): it may be the handler string rather than an array.
add_filter( 'fluentform/editor_shortcode_callback_group_elevation', static function ( $value, $form, $handler ) {
	$property = is_array( $handler ) ? (string) end( $handler ) : (string) $handler;
	return in_array( $property, [ 'declaration', 'elevation.declaration' ], true ) ? esc_html( FormRules::DECLARATION_TEXT ) : $value;
}, 10, 3 );

add_filter( 'fluentform/validation_errors', static function ( $errors, $formData, $form ) {
	$key = elevation_form_key_of( $form );
	if ( null === $key ) {
		return $errors;
	}
	$context = [];
	if ( 'plan-a-visit' === $key ) {
		$context['visitDates'] = array_column( elevation_visit_dates(), 'value' );
	}
	if ( 'join-group' === $key ) {
		$context['groupIds'] = function_exists( 'elevation_joinable_group_ids' ) ? elevation_joinable_group_ids() : [];
	}
	foreach ( FormRules::errors( $key, (array) $formData, $context ) as $path => $message ) {
		$field            = elevation_form_error_key( $path );
		$errors[ $field ] = $errors[ $field ] ?? [ $message ]; // Fluent Forms' own message for the same rule wins.
	}
	if ( ! $errors ) {
		$wait = elevation_form_rate_wait( $key );
		if ( $wait ) {
			$errors['restricted'] = [ RateLimit::message( $wait ) ];
		}
	}
	return $errors;
}, 10, 3 );

/** "names.first_name" → the key Fluent Forms uses for that sub-field's errors (checked in Step 5). */
function elevation_form_error_key( string $path ): string {
	return $path;
}

function elevation_form_rate_transient( string $key ): ?string {
	$ip = filter_var( $_SERVER['REMOTE_ADDR'] ?? '', FILTER_VALIDATE_IP ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- validated as an IP.
	return $ip ? 'elevation_rl_' . md5( $key . '|' . $ip . '|' . wp_salt( 'nonce' ) ) : null;
}

/** Minutes until this visitor may send the form again, or 0 when they may send it now. */
function elevation_form_rate_wait( string $key ): int {
	$transient = elevation_form_rate_transient( $key );
	if ( ! $transient ) {
		return 0;
	}
	$stamps = (array) get_transient( $transient );
	return RateLimit::allows( $stamps, time() ) ? 0 : RateLimit::waitMinutes( $stamps, time() );
}

add_action( 'fluentform/submission_inserted', static function ( $entryId, $formData, $form ) {
	$key       = elevation_form_key_of( $form );
	$transient = $key ? elevation_form_rate_transient( $key ) : null;
	if ( $transient ) {
		$stamps   = RateLimit::recent( (array) get_transient( $transient ), time() );
		$stamps[] = time();
		set_transient( $transient, $stamps, RateLimit::WINDOW );
	}
}, 5, 3 );

// What is stored: normalised postcodes, and the Gift Aid wording and version set here, never from the browser.
add_filter( 'fluentform/insert_response_data', static function ( $formData, $formId ) {
	$key = elevation_form_key( (int) $formId );
	if ( in_array( $key, [ 'gift-aid', 'connect-card' ], true ) && isset( $formData['postcode'] ) && '' !== trim( (string) $formData['postcode'] ) ) {
		$formData['postcode'] = FormRules::normalisePostcode( (string) $formData['postcode'] );
	}
	if ( 'gift-aid' === $key ) {
		$formData['declaration_text']    = FormRules::DECLARATION_TEXT;
		$formData['declaration_version'] = FormRules::DECLARATION_VERSION;
	}
	return $formData;
}, 10, 2 );

// No visitor IP addresses in church form entries (Plan 5 ruling); the rate limit reads REMOTE_ADDR itself.
add_filter( 'fluentform/filter_insert_data', static function ( $data ) {
	if ( is_array( $data ) && elevation_form_key( (int) ( $data['form_id'] ?? 0 ) ) ) {
		unset( $data['ip'] );
	}
	return $data;
}, 20 );

// Honeypot on for every church form; Fluent Forms' own look off (the theme's forms.css styles them).
add_filter( 'fluentform/honeypot_status', static fn ( $on, $formId = 0 ) => elevation_form_key( (int) $formId ) ? true : $on, 10, 2 );
add_filter( 'fluentform/load_default_public', static fn ( $load, $form = null ) => elevation_form_key_of( $form ) ? false : $load, 10, 2 );

// The Plan a Visit date list, computed when the form is shown.
add_filter( 'fluentform/rendering_field_data_select', static function ( $data, $form ) {
	if ( 'plan-a-visit' !== elevation_form_key_of( $form ) || 'visit_date' !== ( $data['attributes']['name'] ?? '' ) ) {
		return $data;
	}
	$data['settings']['advanced_options'] = array_map(
		static fn ( array $d ) => [ 'label' => $d['label'], 'value' => $d['value'], 'calc_value' => '' ],
		elevation_visit_dates()
	);
	return $data;
}, 10, 2 );

/** {elevation.*} values in email subjects and bodies that need the submitted data. */
function elevation_form_placeholders( string $text, array $data, bool $html ): string {
	if ( ! str_contains( $text, '{elevation.' ) ) {
		return $text;
	}
	$ticked = static fn ( string $field ): bool => in_array( 'yes', (array) ( $data[ $field ] ?? [] ), true );
	$plain  = static fn ( string $s ): string => $html ? esc_html( $s ) : wp_strip_all_tags( $s );
	$date   = (string) ( $data['visit_date'] ?? '' );
	$group  = function_exists( 'elevation_group_name' ) ? elevation_group_name( (int) ( $data['group_id'] ?? 0 ) ) : '';
	return strtr( $text, [
		'{elevation.visitDate}'     => $plain( ( '' !== $date ? EventTime::formatDate( $date . 'T12:00' ) : '' ) ?: 'a date to be confirmed' ),
		'{elevation.urgentLine}'    => $ticked( 'is_urgent' ) ? ( $html ? '<p><strong>*** MARKED URGENT ***</strong></p>' : '*** MARKED URGENT ***' ) : '',
		'{elevation.prayerFrom}'    => $plain( trim( (string) ( $data['name'] ?? '' ) ) ?: 'Anonymous' ),
		'{elevation.shareWithTeam}' => $ticked( 'share_with_team' ) ? 'yes' : 'no — keep confidential',
		'{elevation.groupName}'     => $plain( '' !== $group ? $group : 'Not sure yet — please help them choose' ),
	] );
}

add_filter( 'fluentform/email_subject', static function ( $subject, $notification, $data, $form ) {
	$key = elevation_form_key_of( $form );
	if ( 'prayer' === $key && in_array( 'yes', (array) ( $data['is_urgent'] ?? [] ), true ) ) {
		return 'URGENT prayer request';
	}
	return $key ? elevation_form_placeholders( (string) $subject, (array) $data, false ) : $subject;
}, 10, 4 );

add_filter( 'fluentform/submission_message_parse', static function ( $body, $entryId, $data, $form ) {
	return elevation_form_placeholders( (string) $body, (array) $data, true );
}, 10, 4 );
```

- [ ] **Step 2: Write the block**

`src/blocks/form/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/form",
  "title": "Church form",
  "category": "widgets",
  "icon": "feedback",
  "description": "One of the church's forms. Its questions, messages and emails are edited in Fluent Forms.",
  "attributes": { "form": { "type": "string", "default": "contact" } },
  "supports": { "html": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
```

`src/blocks/form/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Placeholder } from '@wordpress/components';
import metadata from './block.json';

const FORMS = [
	[ 'contact', 'Contact' ],
	[ 'prayer', 'Prayer' ],
	[ 'gift-aid', 'Gift Aid' ],
	[ 'newsletter', 'Newsletter' ],
	[ 'g-squad', 'G-Squad sign-up' ],
	[ 'plan-a-visit', 'Plan a Visit' ],
	[ 'join-group', 'Join a Connect Group' ],
	[ 'connect-card', 'Connect card' ],
	[ 'alpha', 'Alpha registration' ],
];

registerBlockType( metadata.name, {
	edit( { attributes, setAttributes } ) {
		const label = ( FORMS.find( ( f ) => f[ 0 ] === attributes.form ) || [ '', attributes.form ] )[ 1 ];
		return (
			<div { ...useBlockProps() }>
				<InspectorControls>
					<PanelBody title="Form">
						<SelectControl
							label="Which form"
							value={ attributes.form }
							options={ FORMS.map( ( [ value, text ] ) => ( { value, label: text } ) ) }
							onChange={ ( form ) => setAttributes( { form } ) }
						/>
					</PanelBody>
				</InspectorControls>
				<Placeholder icon="feedback" label={ `Form: ${ label }` } instructions="Its questions, messages and emails are edited in wp-admin → Fluent Forms." />
			</div>
		);
	},
	save: () => null,
} );
```

`src/blocks/form/render.php`:

```php
<?php
/**
 * One of the church's Fluent Forms, found by its seed key (spec §6.10). The wrapper carries "form-box",
 * which the theme's forms.css styles. A missing form shows an "email us" line instead of nothing.
 */
defined( 'ABSPATH' ) || exit;

$elevation_key   = sanitize_key( (string) ( $attributes['form'] ?? '' ) );
$elevation_id    = elevation_form_id( $elevation_key );
$elevation_class = 'form-box form-box--' . $elevation_key;

if ( ! $elevation_id || ! shortcode_exists( 'fluentform' ) ) {
	?>
	<div <?php echo get_block_wrapper_attributes( [ 'class' => $elevation_class . ' form-box--missing' ] ); ?>>
		<p><?php esc_html_e( "This form isn't available right now. Please email us at", 'elevation-core' ); ?> <a href="mailto:{contact.email}">{contact.email}</a>.</p>
	</div>
	<?php
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => $elevation_class ] ); ?>>
	<?php do_action( 'elevation_form_before', $elevation_key ); ?>
	<?php echo do_shortcode( sprintf( '[fluentform id="%d"]', $elevation_id ) ); // Fluent Forms escapes its own markup. ?>
</div>
```

- [ ] **Step 3: The test scripts**

`bin/submit-form.sh`:

```bash
#!/usr/bin/env bash
# Submit a church form the way the browser does (local testing only; spec §12 "every form submitted locally").
#   ./bin/submit-form.sh contact name='Test Visitor' email=test@example.com message='Hello'
#   ./bin/submit-form.sh g-squad 'names[first_name]=Test' 'names[last_name]=Visitor' email=test@example.com 'teams[]=Care'
# Prints Fluent Forms' JSON answer: {"data":{"message":…}} when it was accepted, {"errors":{…}} when not.
set -euo pipefail
cd "$(dirname "$0")/.."
key=${1:?Usage: bin/submit-form.sh <form key> field=value …}; shift
id=$(docker compose run --rm -T wpcli wp --user=admin elevation forms id "$key" | tr -d '\r')
data=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.urlencode([tuple(a.split("=", 1)) if "=" in a else (a, "") for a in sys.argv[1:]]))' "item_${id}__fluent_sf=" "$@")
curl -s "${BASE_URL:-http://localhost:8080}/wp-admin/admin-ajax.php" \
  --data-urlencode "action=fluentform_submit" --data-urlencode "form_id=$id" --data-urlencode "data=$data"
echo
```

`bin/mail.sh`:

```bash
#!/usr/bin/env bash
# Local Mailpit helper.
#   ./bin/mail.sh          the latest 10 messages: to | reply-to | subject
#   ./bin/mail.sh show 1   the newest message's headers, text and HTML (2 = the one before, …)
#   ./bin/mail.sh clear    empty the inbox
set -euo pipefail
api=${MAILPIT_URL:-http://localhost:8025}/api/v1
case ${1:-list} in
  clear) curl -s -X DELETE "$api/messages" >/dev/null && echo "Mailpit cleared." ;;
  show)
    id=$(curl -s "$api/messages?limit=${2:-1}" | python3 -c 'import json, sys; print(json.load(sys.stdin)["messages"][-1]["ID"])')
    curl -s "$api/message/$id" | python3 -c '
import json, sys
m = json.load(sys.stdin)
print("To:", ", ".join(a["Address"] for a in m["To"]))
print("Reply-To:", ", ".join(a["Address"] for a in m.get("ReplyTo") or []))
print("From:", m["From"]["Name"], "<" + m["From"]["Address"] + ">")
print("Subject:", m["Subject"])
print("--- text"); print(m["Text"])
print("--- html"); print(m["HTML"])' ;;
  *)
    curl -s "$api/messages?limit=10" | python3 -c '
import json, sys
for m in json.load(sys.stdin)["messages"]:
    print(", ".join(a["Address"] for a in m["To"]), "|", ", ".join(a["Address"] for a in m.get("ReplyTo") or []), "|", m["Subject"])' ;;
esac
```

Add this case to the `switch` in `includes/forms-cli.php`, before the usage error. It is the only way test entries are removed, and it refuses to run anywhere but locally:

```php
		case 'purge-test-entries':
			if ( 'local' !== wp_get_environment_type() ) {
				WP_CLI::error( 'Test entries are only purged locally.' );
			}
			global $wpdb;
			$ids = $wpdb->get_col( "SELECT id FROM {$wpdb->prefix}fluentform_submissions WHERE response LIKE '%@example.com%'" );
			foreach ( [ 'fluentform_entry_details' => 'submission_id', 'fluentform_submission_meta' => 'response_id', 'fluentform_logs' => 'source_id', 'fluentform_submissions' => 'id' ] as $table => $column ) {
				foreach ( array_chunk( array_map( 'intval', $ids ), 200 ) as $chunk ) {
					$wpdb->query( "DELETE FROM {$wpdb->prefix}$table WHERE $column IN (" . implode( ',', $chunk ) . ')' ); // phpcs:ignore WordPress.DB.PreparedSQL -- integers only.
				}
			}
			WP_CLI::success( sprintf( 'Removed %d test entr%s (@example.com).', count( $ids ), 1 === count( $ids ) ? 'y' : 'ies' ) );
			return;
```

Check the `fluentform_logs` column name with `DESCRIBE wp6d_fluentform_logs`. If the logs table ties rows to submissions another way, such as `source_type='submission_item'` plus `source_id`, add that condition.

Update the usage line to list `purge-test-entries`.

- [ ] **Step 4: Build and render**

```bash
docker compose run --rm node npm run build
docker compose run --rm -T wpcli wp --user=admin eval 'echo do_blocks( "<!-- wp:elevation/form {\"form\":\"plan-a-visit\"} /-->" );' > /tmp/pav.html; grep -c 'form-box--plan-a-visit' /tmp/pav.html; grep -o '__fluent_sf' /tmp/pav.html | head -1; grep -o '<option[^>]*value="20[0-9-]*"[^<]*' /tmp/pav.html | head -3
docker compose run --rm -T wpcli wp --user=admin eval 'echo do_blocks( "<!-- wp:elevation/form {\"form\":\"nope\"} /-->" );'
```

Expected:
- `1`, and the honeypot field name.
- Three `<option value="2026-…">Sunday …` lines, starting at the next service.
- The `nope` block prints the "This form isn't available right now" line.

If the honeypot name isn't `item_<id>__fluent_sf`, fix `bin/submit-form.sh`.

Replacing tokens in the label ("Which Sunday are you coming?") is the job of the `render_block` token filter. Check it on a page in Task 4, since `wp eval` skips `render_block` filters that depend on the main query.

- [ ] **Step 5: Submit every form and read the mail**

Run `./bin/mail.sh clear` and `docker compose run --rm -T wpcli wp --user=admin elevation forms reset-limits` first.

For each line, run the submission, then `./bin/mail.sh` (or `./bin/mail.sh show 1`), and compare with the expected result. Record the outcomes in the task report.

1. **Contact, complete.**
   - Run: `./bin/submit-form.sh contact name='Test Visitor' email=test@example.com phone='07700 900123' subject='Parking' message='Is there parking?'`
   - Expected: a `data.message` containing "Message received". One mail to the `contact.email` setting (`info@elevationmanchester.org` by default), reply-to `test@example.com`, subject `Website enquiry from Test Visitor`. The From name is the church name.
2. **Contact, all wrong.**
   - Run: `./bin/submit-form.sh contact name='   ' email='nope@' message="$(python3 -c 'print("x"*5001)')"`
   - Expected: `errors` with `name` "Please tell us your name.", `email` "That doesn't look like a valid email address." and `message` "Your message is too long — keep it under 5000 characters." No mail is sent and no entry is created. Check the entry count with `wp db query "SELECT COUNT(*) FROM wp6d_fluentform_submissions"` before and after.
3. **Contact, hostile text.**
   - Run: `message='<b>bold</b> <script>alert(1)</script> 🙏 & "quotes"'`, with valid other fields.
   - Expected: Mailpit's HTML shows `&lt;b&gt;` and `&lt;script&gt;` as text, not markup. The emoji and quotes survive.
   - If the tags arrive as live HTML, Fluent Forms isn't escaping `{inputs.*}` in HTML emails. Find where `ShortCodeParser` returns input values (`app/Services/FormBuilder/ShortCodeParser.php`, around lines 220–265). Add an `esc_html` pass for church forms through the filter it applies there (for example `fluentform/smartcode_input_value`, whatever the file really names). Repeat until the email shows literal text.
4. **Prayer, anonymous and urgent.**
   - Run: `./bin/submit-form.sh prayer request='Test prayer for my family' 'is_urgent[]=yes' 'share_with_team[]=yes' email=test@example.com`
   - Expected: one mail to the prayer inbox (the `contact.prayerInbox` setting, which is `contact.email` while blank). Subject `URGENT prayer request`. The body starts `*** MARKED URGENT ***` and includes `From: Anonymous` and `Share with the wider prayer team: yes`.
   - Then submit without the ticks. Expected: subject `New prayer request`, no urgent line, and `no — keep confidential`.
5. **Gift Aid.**
   - Run: `./bin/submit-form.sh gift-aid first_name='A.' last_name=Tester address_line1='12 Test Road' postcode=m66pu email=test@example.com declaration_accepted=on`
   - Expected: `errors.first_name` "HMRC needs your full first name, not an initial."
   - Then submit again with `first_name=Testy` and also `declaration_text=forged declaration_version=v0`. Expected: success. The stored entry has postcode `M6 6PU`, `declaration_text` equal to `FormRules::DECLARATION_TEXT` and version `hmrc-2016-enduring-v1`. Check with `wp db query "SELECT field_name, field_value FROM wp6d_fluentform_entry_details WHERE submission_id=(SELECT MAX(id) FROM wp6d_fluentform_submissions)"`.
   - The mail goes to `contact.email` and mentions only the name and `(M6 6PU)`.
6. **Newsletter.**
   - Run: `./bin/submit-form.sh newsletter email=test@example.com`
   - Expected: success "You're on the list — thank you.", and **no** mail.
   - Then `email=nope`. Expected: "Please enter a valid email address."
7. **G-Squad.**
   - Run: `'names[first_name]=Test' 'names[last_name]=Visitor' email=test@example.com 'teams[]=Care' 'teams[]=Worship'`
   - Expected: one mail to `contact.welcomeInbox`, subject `G-Squad sign-up: Test Visitor`, listing both teams.
   - Then submit with `names[first_name]=` blank. Expected: the error for that sub-field. **Note the key Fluent Forms uses for it** (for example `names.first_name` or `names[first_name]`). If it isn't `names.first_name`, change `elevation_form_error_key()` to produce Fluent Forms' form, then check that the message appears under the field in the browser (Task 4).
8. **Plan a Visit.**
   - Get the first date: `wp eval 'echo elevation_visit_dates()[0]["value"];'`
   - Submit `'names[first_name]=Test' 'names[last_name]=Visitor' email=test@example.com visit_date=<that date> adults=2 children=1 children_ages='4'`.
   - Expected: two mails.
     - The first goes to `contact.welcomeInbox`, subject `Visit plan: Test Visitor, Sunday … 2026`.
     - The second goes to `test@example.com`, reply-to `contact.welcomeInbox`, subject `See you on Sunday …`. Its body has the service start time, the arrival note, the full address, a Google Maps link and the kids' line. No raw `{…}` is left anywhere; `./bin/check-tokens.sh` can't see mail, so read it.
   - Then submit with yesterday's date and with `adults=0`. Expected: the two Task 1 messages.
9. **Settings follow at once.**
   - Run `wp elevation setting set contact.welcomeInbox=welcome-test@example.com`, then repeat line 7. Expected: the mail goes to `welcome-test@example.com`.
   - Run `wp elevation setting set service.day=Saturday`. Expected: `elevation_visit_dates()[0]['label']` starts `Saturday`.
   - Restore both with `wp elevation setting set contact.welcomeInbox=info@elevationmanchester.org service.day=Sunday`. Use the defaults' values; check them with `wp elevation setting get` first.
10. **Join Group, no groups yet.**
    - Submit with `group_id=` blank. Expected: only the welcome-team mail, subject `Connect Group request: Not sure yet — please help them choose`. The leader notification is skipped by its `if`.
    - Then submit with `group_id=999999`. Expected: `errors.restricted` with the Task 1 message.
11. **Connect card.**
    - Submit with `postcode='m6 6pu'` and `dropdown=others`. Expected: success, stored `M6 6PU`, and one welcome-team mail.
    - Then `postcode=Salford`. Expected: the postcode message.
12. **Alpha.**
    - Submit with the live-style values: `'names[first_name]=Test' 'names[last_name]=Visitor' input_text_2='07700 900123' email=test@example.com input_radio=Female dropdown='21 - 30' input_radio_1=no input_radio_2=Other input_text='A leaflet' input_radio_3='I agree'`.
    - Expected: success, with the entry's field names exactly those. One mail to `contact.welcomeInbox`, not a personal address.
13. **Rate limit.**
    - Run `reset-limits`, then send line 1 five times. The fifth succeeds.
    - Expected: the sixth returns `errors.restricted` "That's a few submissions in a short time. Please wait about 10 minutes and try again.", and nothing is stored.
    - Another form still works. After `reset-limits`, contact works again.
14. **Honeypot.**
    - Post with the honeypot filled, by adding `item_<id>__fluent_sf=bot`. Expected: a 422 error and nothing stored.
15. **No IP stored.**
    - Run `wp db query "SELECT id, ip FROM wp6d_fluentform_submissions ORDER BY id DESC LIMIT 5"`. Expected: `ip` is NULL or empty on every row.

Finally, run `docker compose run --rm -T wpcli wp --user=admin elevation forms purge-test-entries` and `./bin/mail.sh clear`, and check `wp-content/debug.log` has no new PHP warnings.

- [ ] **Step 6: Tests still pass, and commit**

Run: `docker compose run --rm php vendor/bin/phpunit` and `docker compose run --rm node npm run test:js`
Expected: `OK` and `# fail 0`.

```bash
git add wp-content/plugins/elevation-core/includes/forms.php wp-content/plugins/elevation-core/includes/forms-cli.php wp-content/plugins/elevation-core/src/blocks/form wp-content/plugins/elevation-core/build bin/submit-form.sh bin/mail.sh
git commit -m "Church forms at run time: server-side rules, rate limit, settings smartcodes, urgent prayer subject, visit dates and the elevation/form block

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Form styling, and the forms on their pages and in the footer

**Files:**
- Create: `wp-content/themes/elevation/assets/css/forms.css`
- Modify: `wp-content/themes/elevation/functions.php`: enqueue `elevation-forms` (depends on `elevation-site`) and add it to `add_editor_style`, as `events.css`.
- Modify: `wp-content/themes/elevation/parts/footer.html`: replace `<!-- newsletter row: Plan 5 -->`.
- Modify: `seed/pages/contact.html`, `prayer.html`, `give.html`, `alpha.html`, `im-new.html` and `get-involved.html` (the G-Squad part only; the Connect Groups part is Task 5).

**Interfaces:**
- Consumes: `elevation/form` (Task 3). Its wrapper is `div.wp-block-elevation-form.form-box.form-box--<key>`, plus any `className` given in the block comment. Fluent Forms' markup sits inside:
  - wrapper `div.fluentform`, then `form.frm-fluent-form`, then `fieldset`;
  - `div.ff-el-group` holding `div.ff-el-input--label > label` and `div.ff-el-input--content > .ff-el-form-control`;
  - help text in `div.ff-el-help-message`, which appears because Task 2 set `helpMessagePlacement: under_input`;
  - rows as `div.ff-t-container.form-row.form-row--N` with `div.ff-t-cell` children;
  - `.ff-el-form-check`, `.ff-el-form-check-input` and `.ff-el-form-check-label`;
  - `div.ff-el-section-break` (with `.ff-el-section-title`), and the `custom_html` wrapper;
  - on an error, `.ff-el-is-error` plus `div.error.text-danger`, and `.ff-errors-in-stack` for the form-level ones;
  - on success, `div.ff-message-success` holding `.form-success`;
  - `button.ff-btn.ff-btn-submit`.
- Produces: the class `is-card` on a form block. It gives a white panel with a card shadow, for forms on a grey section.

Check every selector against the real DOM in the browser pane before styling, because Fluent Forms' class names drift between versions. The look below is the requirement; the selectors are the best reading of 6.2.14.

- [ ] **Step 1: Write `assets/css/forms.css`**

```css
/* The church's Fluent Forms, styled like the redesign's forms (ui/input, ui/label, form-message, btn). Plan 5 Task 4. */
.form-box {
	--form-border: #e4e4ea;
	--form-error: #cc3b3b;
	--form-focus: var(--wp--preset--color--green-700);
	font-family: var(--wp--preset--font-family--inter);
	color: var(--wp--preset--color--grey-700);
}
.form-box.is-card { background: var(--wp--preset--color--white); border-radius: 18px; box-shadow: var(--wp--preset--shadow--card); padding: 24px; }
@media (min-width: 640px) { .form-box.is-card { padding: 40px; } }

.form-box .frm-fluent-form fieldset { display: grid; gap: 24px; min-width: 0; }
.form-box .ff-el-group { margin: 0; }
.form-box .ff-t-container { display: grid; gap: 24px; margin: 0; }
.form-box .ff-t-container .ff-t-cell { width: auto; flex: none; padding: 0; min-width: 0; }
@media (min-width: 640px) {
	.form-box .form-row--2 { grid-template-columns: 1fr 1fr; }
	.form-box .form-row--3 { grid-template-columns: 120px 1fr 1fr; }
}

/* Labels: Inter 14px/500, as the redesign's Label; the asterisk in the same colour, not red. */
.form-box .ff-el-input--label { margin: 0 0 8px; padding: 0; }
.form-box .ff-el-input--label label { font-size: 14px; font-weight: 500; line-height: 1.2; color: inherit; margin: 0; }
.form-box .ff-el-is-required.asterisk-right label::after { content: " *"; color: inherit; margin: 0; }
.form-box .is-label-hidden .ff-el-input--label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Inputs: 40px high, 10px radius, #E4E4EA border; 16px text on phones (no iOS zoom), 14px from 768px. */
.form-box .ff-el-form-control {
	width: 100%;
	min-height: 40px;
	padding: 8px 12px;
	border: 1px solid var(--form-border);
	border-radius: 10px;
	background: var(--wp--preset--color--white);
	box-shadow: none;
	font: inherit;
	font-size: 16px;
	line-height: 1.4;
	color: var(--wp--preset--color--ink);
	transition: border-color 0.15s;
}
@media (min-width: 768px) { .form-box .ff-el-form-control { font-size: 14px; } }
.form-box textarea.ff-el-form-control { min-height: 8rem; resize: vertical; }
.form-box select.ff-el-form-control {
	appearance: none;
	padding-right: 36px;
	background: var(--wp--preset--color--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%234B4F58' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
}
.form-box .ff-el-form-control::placeholder { color: var(--wp--preset--color--grey-500); opacity: 1; }
.form-box .is-uppercase .ff-el-form-control { text-transform: uppercase; }
.form-box .ff-el-form-control:focus { border-color: var(--form-focus); box-shadow: none; outline: none; }
.form-box .ff-el-form-control:focus-visible { outline: 2px solid var(--form-focus); outline-offset: 2px; }
.form-box .ff-el-help-message { margin-top: 6px; font-size: 12px; font-style: normal; line-height: 1.5; color: var(--wp--preset--color--grey-500); }

/* Tick boxes and radios. */
.form-box .ff-el-form-check { margin: 0 0 10px; }
.form-box .ff-el-form-check:last-child { margin-bottom: 0; }
.form-box .ff-el-form-check-label { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; line-height: 1.45; cursor: pointer; }
.form-box .ff-el-form-check-input { flex: none; width: 18px; height: 18px; margin: 1px 0 0; accent-color: var(--wp--preset--color--green-600); }
.form-box .ff-el-form-check-input:focus-visible { outline: 2px solid var(--form-focus); outline-offset: 2px; }
.form-box .form-tick .ff-el-input--label { display: none; }
.form-box .form-choices--inline .ff-el-input--content { display: flex; flex-wrap: wrap; gap: 8px 24px; }
.form-box .form-choices--inline .ff-el-form-check { margin: 0; }
@media (min-width: 640px) { .form-box .form-choices--columns .ff-el-input--content { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; } }

/* Gift Aid: the declaration box, fieldset headings and the green confirm box (redesign gift-aid-form.tsx). */
.form-box .gift-aid-declaration { border: 1px solid var(--wp--preset--color--grey-100); background: var(--wp--preset--color--grey-50); border-radius: 18px; padding: 24px; line-height: 1.65; }
.form-box .gift-aid-declaration p { margin: 0; }
.form-box .ff-el-section-break { margin: 8px 0 -8px; }
.form-box .ff-el-section-break hr { display: none; }
.form-box .ff-el-section-title { margin: 0 0 4px; font-family: var(--wp--preset--font-family--sora); font-size: 18px; font-weight: 700; color: var(--wp--preset--color--ink); }
.form-box .ff-section_break_desk, .form-box .ff-el-section-break p { margin: 0; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.form-box .gift-aid-confirm { border: 1px solid rgb(132 194 36 / 0.4); background: var(--wp--preset--color--green-100); border-radius: 18px; padding: 24px; }
.form-box .gift-aid-confirm b { color: var(--wp--preset--color--ink); }

/* Errors: #CC3B3B (4.9:1 on white), under the field and in the stack above the button. */
.form-box .ff-el-is-error .ff-el-form-control { border-color: var(--form-error); }
.form-box .error.text-danger { margin-top: 6px; font-size: 14px; line-height: 1.45; color: var(--form-error); }
.form-box .ff-errors-in-stack { margin: 0; }
.form-box .ff-errors-in-stack .error { display: flex; gap: 8px; }
.form-box .ff-errors-in-stack .error-clear { display: none; }

/* The submit button: the green pill (redesign Btn, lg). */
.form-box .ff-btn-submit {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 16px 30px;
	border: 0;
	border-radius: 9999px;
	background: var(--wp--preset--color--green);
	color: var(--wp--preset--color--ink);
	font-family: var(--wp--preset--font-family--sora);
	font-size: 16px;
	font-weight: 600;
	line-height: 1;
	cursor: pointer;
	transition: background-color 0.2s, transform 0.2s;
}
.form-box .ff-btn-submit:hover { background: var(--wp--preset--color--green-600); }
.form-box .ff-btn-submit:focus-visible { outline: 2px solid var(--form-focus); outline-offset: 2px; }
.form-box .ff-btn-submit:disabled, .form-box .ff-working .ff-btn-submit { opacity: 0.5; pointer-events: none; }
@media (prefers-reduced-motion: no-preference) { .form-box .ff-btn-submit:hover { transform: translateY(-2px); } }

/* Success: the green-100 panel with a tick (redesign contact-form.tsx success state). */
.form-box .ff-message-success { margin: 0; padding: 32px; border: 1px solid rgb(132 194 36 / 0.5); border-radius: 18px; background: var(--wp--preset--color--green-100); box-shadow: none; text-align: center; }
.form-box .form-success__title { margin: 0; font-family: var(--wp--preset--font-family--sora); font-size: 24px; font-weight: 600; line-height: 1.25; color: var(--wp--preset--color--ink); }
.form-box .form-success__title::before {
	content: "";
	display: block;
	width: 40px;
	height: 40px;
	margin: 0 auto 16px;
	background: var(--wp--preset--color--green-600);
	-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='m9 12 2 2 4-4'/%3E%3C/svg%3E") center / contain no-repeat;
	mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='m9 12 2 2 4-4'/%3E%3C/svg%3E") center / contain no-repeat;
}
.form-box .form-success p { margin: 12px auto 0; max-width: 28rem; line-height: 1.6; color: var(--wp--preset--color--grey-500); }
.form-box .form-success .form-success__more { font-size: 14px; }

.form-box--missing p { margin: 0; padding: 24px; border-radius: 14px; background: var(--wp--preset--color--grey-50); }
.form-context { margin: 0 0 24px; font-size: 15px; }
.gift-aid-notes { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--wp--preset--color--grey-100); font-size: 14px; color: var(--wp--preset--color--grey-500); }
.gift-aid-notes strong { color: var(--wp--preset--color--ink); font-weight: 500; }

/* The footer newsletter row: on ink-800, a white pill field and the green Subscribe pill. */
.footer-newsletter { display: grid; gap: 20px 48px; align-items: center; margin: 0 0 32px; padding: 32px 0; border-top: 1px solid rgb(255 255 255 / 0.08); border-bottom: 1px solid rgb(255 255 255 / 0.08); }
@media (min-width: 1024px) { .footer-newsletter { grid-template-columns: 1fr 480px; } }
.footer-newsletter__title { margin: 0 0 6px; font-family: var(--wp--preset--font-family--sora); font-size: 18px; font-weight: 600; color: var(--wp--preset--color--white); }
.footer-newsletter p { margin: 0; font-size: 14px; line-height: 1.55; color: rgb(255 255 255 / 0.6); }
.footer-newsletter a { color: var(--wp--preset--color--green); }
.form-box--newsletter { color: var(--wp--preset--color--white); --form-error: #ff9b9b; --form-focus: var(--wp--preset--color--green); }
.form-box--newsletter .frm-fluent-form fieldset { display: flex; flex-wrap: wrap; gap: 10px; }
.form-box--newsletter .ff-el-group:not(.ff_submit_btn_wrapper) { flex: 1 1 220px; }
.form-box--newsletter .ff-el-form-control { min-height: 48px; padding: 14px 22px; border: 0; border-radius: 9999px; font-size: 15px; }
.form-box--newsletter .ff-btn-submit { padding: 16px 26px; }
.form-box--newsletter .ff-message-success { padding: 0; border: 0; background: none; text-align: left; }
.form-box--newsletter .form-success__title { display: flex; align-items: center; gap: 8px; font-family: var(--wp--preset--font-family--inter); font-size: 15px; font-weight: 500; color: var(--wp--preset--color--green); }
.form-box--newsletter .form-success__title::before { width: 20px; height: 20px; margin: 0; background: currentColor; }
```

If Fluent Forms' structural stylesheet (`fluent-form-styles`) still beats a rule, raise specificity by prefixing `.form-box .fluentform`, not with `!important`. The only exception is an inline `style` attribute that Fluent Forms writes itself. If a rule truly can't be won without `!important`, use it and add a one-line comment naming the inline style it overrides.

In `functions.php`, add `'assets/css/forms.css'` to the `add_editor_style` list, and add this after the `elevation-youtube` enqueue:

```php
	wp_enqueue_style( 'elevation-forms', get_theme_file_uri( 'assets/css/forms.css' ), [ 'elevation-site' ], (string) filemtime( get_theme_file_path( 'assets/css/forms.css' ) ) );
```

- [ ] **Step 2: Put the forms on the pages**

In each file, replace the whole empty slot group, from its opening `<!-- wp:group {"className":"form-slot …"} -->` to its `<!-- /wp:group -->`, with the block shown:

- `seed/pages/contact.html`: `<!-- wp:elevation/form {"form":"contact"} /-->`
- `seed/pages/prayer.html`: `<!-- wp:elevation/form {"form":"prayer"} /-->`
- `seed/pages/alpha.html`: `<!-- wp:elevation/form {"form":"alpha"} /-->`
- `seed/pages/give.html`: the form, then the redesign's trailing notes. The existing `gift-aid-note` paragraph stays after them. The notes are the redesign's `DECLARATION_NOTES`, `HIGHER_RATE_NOTE` and `CHARITY_LINE`, with the charity name and number as tokens:

```html
<!-- wp:elevation/form {"form":"gift-aid","className":"is-card"} /-->

<!-- wp:group {"className":"gift-aid-notes","layout":{"type":"default"}} -->
<div class="wp-block-group gift-aid-notes"><!-- wp:paragraph -->
<p><strong>Please tell us if you:</strong></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>want to cancel this declaration</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>change your name or home address</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>no longer pay sufficient tax on your income and/or capital gains</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>If you pay Income Tax at the higher or additional rate and want to receive the additional tax relief due to you, you must include all your Gift Aid donations on your Self Assessment tax return or ask HM Revenue and Customs to adjust your tax code.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>{church.legalName} is a charity registered in England and Wales, no. {church.charityNumber}.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

- `seed/pages/get-involved.html`: replace the `#serve` section's closing `<!-- wp:buttons {"className":"mt-10"} -->` … "Join the G-Squad" … `<!-- /wp:buttons -->` with the form under a heading **(new copy)**:

```html
<!-- wp:group {"anchor":"join-g-squad","className":"g-squad-join","layout":{"type":"constrained","contentSize":"760px","justifyContent":"left"}} -->
<div class="wp-block-group g-squad-join" id="join-g-squad"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Join the G-Squad</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Tell us where you'd like to serve and a team leader will be in touch to help you get started.</p>
<!-- /wp:paragraph -->

<!-- wp:elevation/form {"form":"g-squad","className":"is-card"} /--></div>
<!-- /wp:group -->
```

Give `.g-squad-join` `margin-top: 40px` and its heading `margin-bottom: 8px` in `forms.css`.

- `seed/pages/im-new.html`: insert these two sections after the `#kids` section's closing `<!-- /wp:group -->` and before the ink CTA band **(new copy)**. The heading pattern matches the Give page's centred `section-heading`:

```html
<!-- wp:group {"tagName":"section","align":"full","anchor":"plan-a-visit","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"760px"}} -->
<section class="wp-block-group alignfull" id="plan-a-visit" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"section-heading is-centered","layout":{"type":"default"}} -->
<div class="wp-block-group section-heading is-centered"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Plan a visit</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Let us know you're coming</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead"} -->
<p class="is-style-lead">Tell us which {service.day} you're planning to come and we'll look out for you. We'll email you the time, the address and everything you need to know.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:elevation/form {"form":"plan-a-visit"} /--></section>
<!-- /wp:group -->

<!-- wp:group {"tagName":"section","align":"full","anchor":"connect-card","backgroundColor":"grey-50","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"760px"}} -->
<section class="wp-block-group alignfull has-grey-50-background-color has-background" id="connect-card" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"section-heading is-centered","layout":{"type":"default"}} -->
<div class="wp-block-group section-heading is-centered"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Connect card</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Been with us already?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead"} -->
<p class="is-style-lead">We'd love to hear how your visit went, and how we can help you get connected.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:elevation/form {"form":"connect-card","className":"is-card"} /--></section>
<!-- /wp:group -->
```

Copy the exact attribute order and classes of the Give page's `#gift-aid` section heading if they differ from the above, so the block validator stays clean.

- [ ] **Step 3: The footer newsletter row** (new copy)

Replace `<!-- newsletter row: Plan 5 -->` in `parts/footer.html` with:

```html
<!-- wp:group {"className":"footer-newsletter alignwide","layout":{"type":"default"}} -->
<div class="wp-block-group footer-newsletter alignwide"><!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"className":"footer-newsletter__title"} -->
<p class="footer-newsletter__title">Stay in the loop</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>News and events from {church.name}, now and then. We only use your email for this — see our <a href="/privacy">privacy notice</a>.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:elevation/form {"form":"newsletter"} /--></div>
<!-- /wp:group -->
```

- [ ] **Step 4: Re-seed and check the pages**

```bash
SEED_FORCE="contact prayer give alpha im-new get-involved" ./bin/seed.sh
./bin/check-urls.sh
./bin/check-tokens.sh /contact/ /prayer/ /give/ /resources/alpha/ /im-new/ /get-involved/ /
```

Expected: "Seed complete.", "All URLs as expected.", and no raw tokens. The Plan a Visit label reads "Which Sunday are you coming?".

Then run the block validator (`http://localhost:8080/?elevation-validate-blocks=1`, read `window.elevationValidation`). Expected: no invalid blocks on the six pages or the footer part.

In the browser pane, at 1440px and at 390px, for `/contact`, `/prayer`, `/give#gift-aid`, `/resources/alpha`, `/im-new#plan-a-visit`, `/im-new#connect-card`, `/get-involved#serve` and the footer:

1. Layout matches the redesign's form style:
   - two columns from 640px and one below;
   - the 120px/1fr/1fr Gift Aid name row;
   - labels in Inter;
   - 40px fields with the grey border;
   - hints in small grey text under the field;
   - the green pill button;
   - the Gift Aid declaration box and green confirm box;
   - the white `is-card` panels on grey.
2. Submit each form empty. The redesign's messages appear under the right fields in red, the page doesn't jump, and focus stays usable.
3. Submit the contact form properly with test data (`Test Visitor`, `test@example.com`). The green success panel with the tick replaces the form, and Mailpit has the mail.
4. The footer row sits above the practical strip. At 390px the field and the button wrap onto two lines, and the success line shows in green on ink.
5. Keyboard only: Tab reaches every field and the button in order, each shows the 2px focus ring, and Space ticks boxes.
6. The network panel before consent shows no Google request from any form page. Fluent Forms loads only from this site.
7. The console shows no errors.

Take screenshots of the Contact, Give and I'm New forms at both widths for the Task 8 review with the user.

Afterwards, run `docker compose run --rm -T wpcli wp --user=admin elevation forms purge-test-entries` and `./bin/mail.sh clear`.

- [ ] **Step 5: Commit**

```bash
git add wp-content/themes/elevation/assets/css/forms.css wp-content/themes/elevation/functions.php wp-content/themes/elevation/parts/footer.html seed/pages/{contact,prayer,give,alpha,im-new,get-involved}.html
git commit -m "Forms styled like the redesign and placed on Contact, Prayer, Give, Alpha, I'm New, Get Involved and the footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Connect Groups — post type, directory, featured groups and Join Group routing

**Files:**
- Create: `wp-content/plugins/elevation-core/src/GroupFields.php`, `tests/GroupFieldsTest.php`
- Create: `wp-content/plugins/elevation-core/includes/groups.php`, `includes/group-render.php`
- Create: `wp-content/plugins/elevation-core/src/blocks/group-directory/{block.json,index.js,render.php}` and `src/blocks/featured-groups/{block.json,index.js,render.php}`
- Create: `wp-content/plugins/elevation-core/src/editor/group-panel.js`. Modify `src/editor/index.js` to add `import './group-panel';`.
- Modify: `wp-content/plugins/elevation-core/includes/fixtures-cli.php` (a `groups` action; `remove` covers groups and their fixture terms), `elevation-core.php` (requires)
- Create: `wp-content/themes/elevation/assets/css/groups.css`. Modify `functions.php` (enqueue and editor style).
- Create: `seed/pages/connect-groups.html`, `seed/fixtures/groups.json`
- Modify: `seed/pages/get-involved.html` (the "Find a group" button), `bin/seed.sh`, `bin/check-urls.sh`

**Interfaces:**
- Consumes: `EventTime::formatTime`; `elevation_form_before` and `elevation/form` (Task 3); `elevation_seed_media_lookup()` (`includes/cli.php`).
- Produces:
  - Post type `connect_group`: not public, shown in the admin UI and REST, `capability_type` `post`. It has two taxonomies, `group_area` and `group_category`, both hierarchical, not public, with admin columns.
  - Meta `group_meeting_day` (`monday`…`sunday`), `group_meeting_time` (`HH:MM`), `group_leader_name`, `group_leader_email` (REST `edit` context only) and `group_accepting` (bool, default true).
  - `elevation_groups( array $filters = [], int $limit = 100 ): list<WP_Post>` and `elevation_group( WP_Post ): array` (plain values; **never** the leader's email).
  - `elevation_group_name( int $id ): string` and `elevation_joinable_group_ids(): list<int>`. Task 3 already calls these.
  - `elevation_group_card( WP_Post, array $filters = [] ): string` and `elevation_group_mini( WP_Post ): string`.
  - Directory URL parameters: `area`, `type`, `meets` and `group`. `day` is a WordPress query var and must not be used.
  - Anchors on `/connect-groups`: `#groups` (the directory), `#group-<slug>` (each card) and `#join-group` (the form section).
  - `wp elevation fixtures groups <file>`.

**Rulings for this task:**
- The taxonomies are `group_area` and `group_category`, not the spec's bare `area`. The prefix matches `group_…` meta and avoids a generic slug that other plugins use.
- The description is the post excerpt, edited in the "Group details" panel. The core Excerpt panel is removed for this post type, so there is one place to type it.

- [ ] **Step 1: Write the failing test**

`tests/GroupFieldsTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\GroupFields;
use PHPUnit\Framework\TestCase;

final class GroupFieldsTest extends TestCase {

	public function test_days_and_times_are_kept_only_when_valid(): void {
		$this->assertSame( 'tuesday', GroupFields::day( ' Tuesday ' ) );
		$this->assertSame( '', GroupFields::day( 'Tues' ) );
		$this->assertSame( '', GroupFields::day( [ 'monday' ] ) );
		$this->assertSame( '19:30', GroupFields::time( '19:30' ) );
		foreach ( [ '7:30', '24:00', '19:60', '7.30pm', '', null ] as $bad ) {
			$this->assertSame( '', GroupFields::time( $bad ), var_export( $bad, true ) );
		}
	}

	public function test_when_reads_like_the_rest_of_the_site(): void {
		$this->assertSame( "Tuesdays \u{00B7} 7:30 pm", GroupFields::when( 'tuesday', '19:30' ) );
		$this->assertSame( 'Sundays', GroupFields::when( 'sunday', '' ) );
		$this->assertSame( '12:00 pm', GroupFields::when( '', '12:00' ) );
		$this->assertSame( '', GroupFields::when( '', '' ) );
	}

	public function test_only_the_leaders_first_name_is_shown(): void {
		$this->assertSame( 'Grace', GroupFields::firstName( "  Grace   O'Brien-Example " ) );
		$this->assertSame( 'Tunde', GroupFields::firstName( 'Tunde' ) );
		$this->assertSame( '', GroupFields::firstName( '   ' ) );
	}

	public function test_filters_accept_known_values_only(): void {
		$areas = [ 'salford', 'online' ];
		$types = [ 'families' ];
		$this->assertSame( [ 'area' => 'salford', 'type' => 'families', 'meets' => 'tuesday' ], GroupFields::filters( [ 'area' => 'salford', 'type' => 'families', 'meets' => 'tuesday' ], $areas, $types ) );
		$this->assertSame( [ 'area' => '', 'type' => '', 'meets' => '' ], GroupFields::filters( [ 'area' => '<script>', 'type' => [ 'families' ], 'meets' => 'someday' ], $areas, $types ) );
		$this->assertSame( [ 'area' => '', 'type' => '', 'meets' => '' ], GroupFields::filters( [], $areas, $types ) );
	}
}
```

Run: `docker compose run --rm php vendor/bin/phpunit --filter GroupFieldsTest`
Expected: FAIL, class not found.

- [ ] **Step 2: Write `src/GroupFields.php`**

```php
<?php
namespace Elevation\Core;

/**
 * A Connect Group's meeting day and time, the leader's first name for the card, and the directory's filters
 * (spec §6.6). Pure — no WordPress calls.
 */
final class GroupFields {

	public const DAYS = [
		'monday'    => 'Monday',
		'tuesday'   => 'Tuesday',
		'wednesday' => 'Wednesday',
		'thursday'  => 'Thursday',
		'friday'    => 'Friday',
		'saturday'  => 'Saturday',
		'sunday'    => 'Sunday',
	];

	public static function day( mixed $value ): string {
		$day = is_string( $value ) ? strtolower( trim( $value ) ) : '';
		return isset( self::DAYS[ $day ] ) ? $day : '';
	}

	/** "19:30" (24-hour, from the editor's time input) or "". */
	public static function time( mixed $value ): string {
		return is_string( $value ) && preg_match( '/^(?:[01]\d|2[0-3]):[0-5]\d$/', trim( $value ) ) ? trim( $value ) : '';
	}

	/** "Tuesdays · 7:30 pm", "Tuesdays", "7:30 pm" or "". */
	public static function when( string $day, string $time ): string {
		$parts = [];
		if ( isset( self::DAYS[ $day ] ) ) {
			$parts[] = self::DAYS[ $day ] . 's';
		}
		if ( '' !== self::time( $time ) ) {
			$parts[] = EventTime::formatTime( '2026-01-05T' . $time, '', false );
		}
		return implode( " \u{00B7} ", $parts );
	}

	public static function firstName( string $leader ): string {
		$leader = trim( (string) preg_replace( '/\s+/u', ' ', $leader ) );
		return '' === $leader ? '' : explode( ' ', $leader )[0];
	}

	/**
	 * @param array        $query      The request's query string ($_GET, unslashed).
	 * @param list<string> $areas      Area slugs that have published groups.
	 * @param list<string> $categories Group-type slugs that have published groups.
	 * @return array{area:string,type:string,meets:string}
	 */
	public static function filters( array $query, array $areas, array $categories ): array {
		$pick = static fn ( string $key, array $allowed ): string => is_string( $query[ $key ] ?? null ) && in_array( $query[ $key ], $allowed, true ) ? $query[ $key ] : '';
		return [ 'area' => $pick( 'area', $areas ), 'type' => $pick( 'type', $categories ), 'meets' => $pick( 'meets', array_keys( self::DAYS ) ) ];
	}
}
```

Require it in `elevation-core.php` after `src/FormSchema.php`. Run the test again. Expected: PASS.

- [ ] **Step 3: Write `includes/groups.php`**

```php
<?php
/**
 * Connect Groups (spec §6.6): the post type, its taxonomies and fields, the queries the directory uses, and
 * the Join Group leader routing. Leaders' email addresses stay on the server: they are readable only in the
 * editor (REST "edit" context) and are used only as an email recipient.
 */
use Elevation\Core\GroupFields;

defined( 'ABSPATH' ) || exit;

const ELEVATION_GROUP_META = [
	'group_meeting_day'  => 'string',
	'group_meeting_time' => 'string',
	'group_leader_name'  => 'string',
	'group_leader_email' => 'string',
	'group_accepting'    => 'boolean',
];

add_action( 'init', function () {
	register_post_type( 'connect_group', [
		'labels'          => [
			'name'          => __( 'Connect Groups', 'elevation-core' ),
			'singular_name' => __( 'Connect Group', 'elevation-core' ),
			'add_new_item'  => __( 'Add Connect Group', 'elevation-core' ),
			'edit_item'     => __( 'Edit Connect Group', 'elevation-core' ),
			'new_item'      => __( 'New Connect Group', 'elevation-core' ),
			'search_items'  => __( 'Search Connect Groups', 'elevation-core' ),
			'not_found'     => __( 'No Connect Groups yet.', 'elevation-core' ),
			'all_items'     => __( 'All Connect Groups', 'elevation-core' ),
			'menu_name'     => __( 'Connect Groups', 'elevation-core' ),
		],
		'public'          => false,
		'show_ui'         => true,
		'show_in_rest'    => true,
		'menu_icon'       => 'dashicons-groups',
		'menu_position'   => 22,
		'supports'        => [ 'title', 'excerpt', 'thumbnail', 'page-attributes', 'revisions', 'custom-fields' ],
		'map_meta_cap'    => true,
		'capability_type' => 'post',
		'rewrite'         => false,
		'query_var'       => false,
	] );
	foreach ( [ 'group_area' => [ 'Areas', 'Area' ], 'group_category' => [ 'Group types', 'Group type' ] ] as $taxonomy => [ $plural, $single ] ) {
		register_taxonomy( $taxonomy, 'connect_group', [
			'labels'            => [ 'name' => $plural, 'singular_name' => $single, 'add_new_item' => "Add $single", 'edit_item' => "Edit $single", 'search_items' => "Search $plural", 'all_items' => "All $plural" ],
			'public'            => false,
			'show_ui'           => true,
			'show_in_rest'      => true,
			'show_admin_column' => true,
			'hierarchical'      => true,
			'rewrite'           => false,
		] );
	}
	$sanitisers = [
		'group_meeting_day'  => [ GroupFields::class, 'day' ],
		'group_meeting_time' => [ GroupFields::class, 'time' ],
		'group_leader_name'  => 'sanitize_text_field',
		'group_leader_email' => 'sanitize_email',
		'group_accepting'    => 'rest_sanitize_boolean',
	];
	foreach ( ELEVATION_GROUP_META as $key => $type ) {
		register_post_meta( 'connect_group', $key, [
			'type'              => $type,
			'single'            => true,
			'default'           => 'group_accepting' === $key ? true : '',
			'show_in_rest'      => 'group_leader_email' === $key ? [ 'schema' => [ 'type' => 'string', 'context' => [ 'edit' ] ] ] : true,
			'sanitize_callback' => $sanitisers[ $key ],
			'auth_callback'     => static fn ( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', (int) $post_id ),
		] );
	}
} );

/** @return list<WP_Post> Published groups in menu order, then name. $filters: area, type, meets (from GroupFields::filters). */
function elevation_groups( array $filters = [], int $limit = 100 ): array {
	$args = [
		'post_type'      => 'connect_group',
		'post_status'    => 'publish',
		'posts_per_page' => $limit,
		'orderby'        => [ 'menu_order' => 'ASC', 'title' => 'ASC' ],
		'no_found_rows'  => true,
	];
	$tax = [];
	foreach ( [ 'area' => 'group_area', 'type' => 'group_category' ] as $key => $taxonomy ) {
		if ( '' !== (string) ( $filters[ $key ] ?? '' ) ) {
			$tax[] = [ 'taxonomy' => $taxonomy, 'field' => 'slug', 'terms' => (string) $filters[ $key ] ];
		}
	}
	if ( $tax ) {
		$args['tax_query'] = $tax; // phpcs:ignore WordPress.DB.SlowDBQuery -- a handful of groups.
	}
	if ( '' !== (string) ( $filters['meets'] ?? '' ) ) {
		$args['meta_query'] = [ [ 'key' => 'group_meeting_day', 'value' => (string) $filters['meets'] ] ]; // phpcs:ignore WordPress.DB.SlowDBQuery
	}
	return get_posts( $args );
}

/** @return list<int> Groups a Join request may name: every published group (full ones take "ask about the next one"). */
function elevation_joinable_group_ids(): array {
	return array_map( 'intval', get_posts( [ 'post_type' => 'connect_group', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'no_found_rows' => true ] ) );
}

/** A published group's plain name, or "" for anything else (drafts, trash, other post types, 0). */
function elevation_group_name( int $id ): string {
	$post = $id > 0 ? get_post( $id ) : null;
	return ( $post && 'connect_group' === $post->post_type && 'publish' === $post->post_status ) ? $post->post_title : '';
}

/** Plain values for the cards. Deliberately has no leader email. */
function elevation_group( WP_Post $post ): array {
	$terms = static function ( string $taxonomy ) use ( $post ): string {
		$list = get_the_terms( $post, $taxonomy );
		return is_array( $list ) ? implode( ', ', wp_list_pluck( $list, 'name' ) ) : '';
	};
	return [
		'id'          => $post->ID,
		'slug'        => $post->post_name,
		'name'        => $post->post_title,
		'description' => $post->post_excerpt,
		'area'        => $terms( 'group_area' ),
		'category'    => $terms( 'group_category' ),
		'when'        => GroupFields::when( GroupFields::day( get_post_meta( $post->ID, 'group_meeting_day', true ) ), GroupFields::time( get_post_meta( $post->ID, 'group_meeting_time', true ) ) ),
		'leader'      => GroupFields::firstName( (string) get_post_meta( $post->ID, 'group_leader_name', true ) ),
		'accepting'   => (bool) get_post_meta( $post->ID, 'group_accepting', true ),
		'image'       => (int) get_post_thumbnail_id( $post ),
	];
}

// The "Group leader" notification of the Join Group form goes to the chosen group's leader, looked up here.
// No group, an unknown group or no leader email: the recipient is empty and Fluent Forms sends nothing.
add_filter( 'fluentform/email_to', static function ( $to, $notification, $data, $form ) {
	if ( 'join-group' !== elevation_form_key_of( $form ) || 'group-leader' !== ( $notification['elevation'] ?? '' ) ) {
		return $to;
	}
	$id    = (int) ( $data['group_id'] ?? 0 );
	$email = '' !== elevation_group_name( $id ) ? sanitize_email( (string) get_post_meta( $id, 'group_leader_email', true ) ) : '';
	return is_email( $email ) ? $email : '';
}, 10, 4 );

// The line above the Join Group form: which group this request is for.
add_action( 'elevation_form_before', static function ( string $key ) {
	if ( 'join-group' !== $key ) {
		return;
	}
	$name = elevation_group_name( isset( $_GET['group'] ) ? absint( wp_unslash( $_GET['group'] ) ) : 0 ); // phpcs:ignore WordPress.Security.NonceVerification -- display only.
	if ( '' !== $name ) {
		printf(
			'<p class="form-context">%s <strong>%s</strong>. <a href="%s">%s</a></p>',
			esc_html__( "You're asking to join", 'elevation-core' ),
			esc_html( $name ),
			esc_url( remove_query_arg( 'group' ) . '#groups' ),
			esc_html__( 'Choose a different group', 'elevation-core' )
		);
		return;
	}
	echo '<p class="form-context">' . esc_html__( "Not sure which group? Leave it with us — tell us a little about yourself and we'll suggest one.", 'elevation-core' ) . '</p>';
} );
```

After this lands, check two things:
1. Whether Fluent Forms logs or throws when `email_to` returns `''`. Read `EmailNotification::notify` after line 185.
2. If it would still call `wp_mail` with an empty recipient, that is harmless but logs a failure. In that case return a sentinel only if a quieter path exists. Otherwise accept the log line and note it in the report.

The leader notification also carries `"if": "group_id"`, so it is skipped entirely when no group was chosen.

`includes/group-render.php`:

```php
<?php
/** The Connect Group card (directory) and mini card (Get Involved). Escaped here; callers echo. */
defined( 'ABSPATH' ) || exit;

function elevation_group_join_url( int $id, array $filters = [] ): string {
	return add_query_arg( array_filter( $filters + [ 'group' => $id ] ), home_url( '/connect-groups/' ) ) . '#join-group';
}

function elevation_group_card( WP_Post $post, array $filters = [] ): string {
	$group = elevation_group( $post );
	$meta  = implode( " \u{00B7} ", array_filter( [ $group['area'], $group['category'] ] ) );
	$label = $group['accepting'] ? __( 'Ask to join', 'elevation-core' ) : __( 'Full right now, ask about the next one', 'elevation-core' );
	ob_start();
	?>
	<article class="group-card reveal" id="group-<?php echo esc_attr( $group['slug'] ); ?>">
		<div class="group-card__media">
			<?php
			echo $group['image']
				? wp_get_attachment_image( $group['image'], 'medium_large', false, [ 'class' => 'group-card__img', 'alt' => '', 'loading' => 'lazy' ] )
				: '<span class="group-card__placeholder" aria-hidden="true"></span>';
			?>
		</div>
		<div class="group-card__body">
			<?php if ( '' !== $meta ) : ?><p class="group-card__eyebrow"><?php echo esc_html( $meta ); ?></p><?php endif; ?>
			<h3 class="group-card__name"><?php echo esc_html( $group['name'] ); ?></h3>
			<?php if ( '' !== $group['when'] ) : ?><p class="group-card__when"><?php echo esc_html( $group['when'] ); ?></p><?php endif; ?>
			<?php if ( '' !== $group['leader'] ) : ?><p class="group-card__leader"><?php echo esc_html( sprintf( __( 'Led by %s', 'elevation-core' ), $group['leader'] ) ); ?></p><?php endif; ?>
			<?php if ( '' !== trim( $group['description'] ) ) : ?><p class="group-card__description"><?php echo esc_html( $group['description'] ); ?></p><?php endif; ?>
			<p class="group-card__status <?php echo $group['accepting'] ? 'is-open' : 'is-full'; ?>"><?php echo $group['accepting'] ? esc_html__( 'Open to new members', 'elevation-core' ) : esc_html__( 'Full right now', 'elevation-core' ); ?></p>
			<div class="wp-block-buttons"><div class="wp-block-button<?php echo $group['accepting'] ? '' : ' is-style-ghost'; ?>"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( elevation_group_join_url( $group['id'], $filters ) ); ?>"><?php echo esc_html( $label ); ?><span class="screen-reader-text"> — <?php echo esc_html( $group['name'] ); ?></span></a></div></div>
		</div>
	</article>
	<?php
	return (string) ob_get_clean();
}

function elevation_group_mini( WP_Post $post ): string {
	$group = elevation_group( $post );
	$meta  = implode( " \u{00B7} ", array_filter( [ $group['area'], $group['when'] ] ) );
	return sprintf(
		'<li class="group-mini"><a href="%s"><span class="group-mini__name">%s</span>%s</a></li>',
		esc_url( home_url( '/connect-groups/' ) . '#group-' . $group['slug'] ),
		esc_html( $group['name'] ),
		'' !== $meta ? '<span class="group-mini__meta">' . esc_html( $meta ) . '</span>' : ''
	);
}
```

Require `includes/groups.php` and `includes/group-render.php` in `elevation-core.php` after `includes/forms.php`. Check the theme has a `.screen-reader-text` rule (grep `site.css`). If not, add the standard one to `groups.css`.

- [ ] **Step 4: The two blocks**

`src/blocks/group-directory/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/group-directory",
  "title": "Connect Group directory",
  "category": "widgets",
  "icon": "groups",
  "description": "Every published Connect Group, with filters for area, type and day. The blocks inside are shown instead when there are no groups.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
```

`src/blocks/featured-groups/block.json` is the same shape, with:
- name `elevation/featured-groups`;
- title `Featured Connect Groups`;
- description `The first three Connect Groups (by order) and "Browse all groups". The blocks inside are shown instead when there are no groups.`

Both `index.js` files are `home-events/index.js` with only the explanatory sentence changed:
- directory: `With groups published, visitors see the filters and group cards. With none, they see this:`
- featured: `With groups published, visitors see the first three and "Browse all groups". With none, they see this:`

`src/blocks/group-directory/render.php`:

```php
<?php
/**
 * The /connect-groups directory (spec §6.6): a filter form (area, type, day; plain GET, so it works without
 * JavaScript) and the group cards. With no published groups, the inner blocks are shown instead.
 */
use Elevation\Core\GroupFields;

defined( 'ABSPATH' ) || exit;

$elevation_all = elevation_groups();
if ( ! $elevation_all ) {
	echo $content;
	return;
}
$elevation_terms   = static function ( string $taxonomy ): array {
	$terms = get_terms( [ 'taxonomy' => $taxonomy, 'hide_empty' => true ] );
	return is_array( $terms ) ? $terms : [];
};
$elevation_areas   = $elevation_terms( 'group_area' );
$elevation_types   = $elevation_terms( 'group_category' );
$elevation_filters = GroupFields::filters( wp_unslash( $_GET ), wp_list_pluck( $elevation_areas, 'slug' ), wp_list_pluck( $elevation_types, 'slug' ) ); // phpcs:ignore WordPress.Security.NonceVerification -- read-only filters.
$elevation_days    = array_values( array_intersect( array_keys( GroupFields::DAYS ), array_map( static fn ( $p ) => GroupFields::day( get_post_meta( $p->ID, 'group_meeting_day', true ) ), $elevation_all ) ) );
$elevation_active  = array_filter( $elevation_filters );
$elevation_groups  = $elevation_active ? elevation_groups( $elevation_filters ) : $elevation_all;
$elevation_base    = home_url( '/connect-groups/' );

$elevation_select = static function ( string $name, string $label, string $any, array $options, string $current ): string {
	$html = sprintf( '<label class="group-filters__field"><span>%s</span><select name="%s"><option value="">%s</option>', esc_html( $label ), esc_attr( $name ), esc_html( $any ) );
	foreach ( $options as $value => $text ) {
		$html .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $value ), selected( $current, $value, false ), esc_html( $text ) );
	}
	return $html . '</select></label>';
};
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'group-directory', 'id' => 'groups' ] ); ?>>
	<form class="group-filters" method="get" action="<?php echo esc_url( $elevation_base ); ?>#groups" aria-label="<?php esc_attr_e( 'Filter Connect Groups', 'elevation-core' ); ?>">
		<?php
		echo $elevation_select( 'area', __( 'Area', 'elevation-core' ), __( 'All areas', 'elevation-core' ), wp_list_pluck( $elevation_areas, 'name', 'slug' ), $elevation_filters['area'] ); // Escaped inside.
		echo $elevation_select( 'type', __( 'Type', 'elevation-core' ), __( 'All types', 'elevation-core' ), wp_list_pluck( $elevation_types, 'name', 'slug' ), $elevation_filters['type'] );
		echo $elevation_select( 'meets', __( 'Day', 'elevation-core' ), __( 'Any day', 'elevation-core' ), array_intersect_key( GroupFields::DAYS, array_flip( $elevation_days ) ), $elevation_filters['meets'] );
		?>
		<div class="wp-block-button is-style-navy"><button type="submit" class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Show groups', 'elevation-core' ); ?></button></div>
		<?php if ( $elevation_active ) : ?>
			<a class="group-filters__clear" href="<?php echo esc_url( $elevation_base ); ?>#groups"><?php esc_html_e( 'Clear filters', 'elevation-core' ); ?></a>
		<?php endif; ?>
	</form>
	<p class="group-directory__count" role="status">
		<?php echo esc_html( sprintf( _n( '%d group', '%d groups', count( $elevation_groups ), 'elevation-core' ), count( $elevation_groups ) ) ); ?>
	</p>
	<?php if ( ! $elevation_groups ) : ?>
		<div class="wp-block-group is-style-panel group-directory__empty"><p>
			<?php esc_html_e( 'No groups match those filters.', 'elevation-core' ); ?>
			<a href="<?php echo esc_url( $elevation_base ); ?>#groups"><?php esc_html_e( 'Clear the filters', 'elevation-core' ); ?></a>,
			<?php esc_html_e( "or ask us below and we'll help you find one.", 'elevation-core' ); ?>
		</p></div>
	<?php else : ?>
		<div class="group-grid">
			<?php foreach ( $elevation_groups as $elevation_group ) {
				echo elevation_group_card( $elevation_group, $elevation_filters ); // Escaped inside.
			} ?>
		</div>
	<?php endif; ?>
</div>
```

`src/blocks/featured-groups/render.php`:

```php
<?php
/** Get Involved #connect-groups (spec §6.6): the first three groups and "Browse all groups", or the inner blocks. */
defined( 'ABSPATH' ) || exit;

$elevation_groups = elevation_groups( [], 3 );
if ( ! $elevation_groups ) {
	echo $content;
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'featured-groups' ] ); ?>>
	<ul class="group-mini-list">
		<?php foreach ( $elevation_groups as $elevation_group ) {
			echo elevation_group_mini( $elevation_group ); // Escaped inside.
		} ?>
	</ul>
	<div class="wp-block-buttons"><div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/connect-groups/' ) ); ?>"><?php esc_html_e( 'Browse all groups', 'elevation-core' ); ?></a></div></div>
</div>
```

- [ ] **Step 5: The editor panel**

`src/editor/group-panel.js`:

```js
/** "Group details" for Connect Groups: description, day, time, leader and whether it takes new members. */
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { SelectControl, TextControl, TextareaControl, ToggleControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

const DAYS = [ [ '', 'Choose a day' ], [ 'monday', 'Monday' ], [ 'tuesday', 'Tuesday' ], [ 'wednesday', 'Wednesday' ], [ 'thursday', 'Thursday' ], [ 'friday', 'Friday' ], [ 'saturday', 'Saturday' ], [ 'sunday', 'Sunday' ] ];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Fields() {
	const [ meta, setMeta ] = useEntityProp( 'postType', 'connect_group', 'meta' );
	const [ excerpt, setExcerpt ] = useEntityProp( 'postType', 'connect_group', 'excerpt' );
	const { lockPostSaving, unlockPostSaving, removeEditorPanel } = useDispatch( 'core/editor' );
	const m = meta || {};
	const set = ( key ) => ( value ) => setMeta( { ...m, [ key ]: value } );
	const email = ( m.group_leader_email || '' ).trim();
	const badEmail = email !== '' && ! EMAIL.test( email );

	useEffect( () => {
		removeEditorPanel( 'post-excerpt' );
	}, [ removeEditorPanel ] );
	useEffect( () => {
		( badEmail ? lockPostSaving : unlockPostSaving )( 'elevation-group' );
	}, [ badEmail, lockPostSaving, unlockPostSaving ] );

	return (
		<PluginDocumentSettingPanel name="elevation-group" title="Group details" initialOpen>
			<TextareaControl label="Description" help="One or two sentences for the group's card." value={ excerpt || '' } onChange={ setExcerpt } />
			<SelectControl label="Meets on" value={ m.group_meeting_day || '' } options={ DAYS.map( ( [ value, label ] ) => ( { value, label } ) ) } onChange={ set( 'group_meeting_day' ) } />
			<TextControl label="Time" type="time" value={ m.group_meeting_time || '' } onChange={ set( 'group_meeting_time' ) } />
			<TextControl label="Leader's name" help="Only the first name is shown on the site." value={ m.group_leader_name || '' } onChange={ set( 'group_leader_name' ) } />
			<TextControl
				label="Leader's email"
				type="email"
				help="Never shown on the site. Requests to join this group are emailed here and to the welcome team."
				value={ m.group_leader_email || '' }
				onChange={ set( 'group_leader_email' ) }
			/>
			{ badEmail && <p style={ { color: '#CC3B3B', marginTop: -8 } }>That email address doesn't look right, so the group can't be saved yet.</p> }
			<ToggleControl
				label="Taking new members"
				help={ m.group_accepting === false ? 'The card says "Full right now, ask about the next one".' : 'The card says "Ask to join".' }
				checked={ m.group_accepting !== false }
				onChange={ set( 'group_accepting' ) }
			/>
		</PluginDocumentSettingPanel>
	);
}

function GroupPanel() {
	const type = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostType(), [] );
	return type === 'connect_group' ? <Fields /> : null;
}

registerPlugin( 'elevation-group-panel', { render: GroupPanel } );
```

- [ ] **Step 6: Styles, page, fixtures and seed**

`wp-content/themes/elevation/assets/css/groups.css`. The cards follow the event cards (`events.css`): 18px radius and the card shadow. The media is 16:9 with an ink placeholder.

```css
/* Connect Groups: the directory filters, cards, and the mini list on Get Involved (Plan 5 Task 5). */
.group-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px 16px; margin: 0 0 16px; }
.group-filters__field { display: grid; gap: 6px; font-size: 14px; font-weight: 500; }
.group-filters__field select {
	min-width: 12rem;
	min-height: 44px;
	padding: 8px 36px 8px 12px;
	border: 1px solid #e4e4ea;
	border-radius: 10px;
	background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%234B4F58' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
	appearance: none;
	font: inherit;
	color: var(--wp--preset--color--ink);
}
.group-filters__field select:focus-visible, .group-filters__clear:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 2px; }
.group-filters__clear { align-self: center; font-size: 14px; color: var(--wp--preset--color--green-700); }
.group-directory__count { margin: 0 0 24px; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.group-grid { display: grid; gap: 24px; }
@media (min-width: 640px) { .group-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .group-grid { grid-template-columns: repeat(3, 1fr); } }
.group-card { display: flex; flex-direction: column; overflow: hidden; border-radius: 18px; background: #fff; box-shadow: var(--wp--preset--shadow--card); scroll-margin-top: 7rem; }
.group-card__media { aspect-ratio: 16 / 9; background: var(--wp--preset--color--ink); }
.group-card__img, .group-card__placeholder { display: block; width: 100%; height: 100%; object-fit: cover; }
.group-card__body { display: flex; flex: 1; flex-direction: column; gap: 6px; padding: 24px; }
.group-card__eyebrow { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--wp--preset--color--green-700); }
.group-card__name { margin: 0; font-family: var(--wp--preset--font-family--sora); font-size: 20px; line-height: 1.3; color: var(--wp--preset--color--ink); }
.group-card__when, .group-card__leader { margin: 0; font-size: 14px; color: var(--wp--preset--color--grey-700); }
.group-card__description { margin: 6px 0 0; font-size: 15px; line-height: 1.6; color: var(--wp--preset--color--grey-500); }
.group-card__status { margin: 10px 0 0; font-size: 13px; font-weight: 600; }
.group-card__status.is-open { color: var(--wp--preset--color--green-700); }
.group-card__status.is-full { color: var(--wp--preset--color--grey-500); }
.group-card .wp-block-buttons { margin-top: auto; padding-top: 16px; }
.group-mini-list { display: grid; gap: 10px; margin: 24px 0; padding: 0; list-style: none; }
.group-mini a { display: grid; gap: 2px; padding: 14px 18px; border-radius: 14px; background: #fff; color: var(--wp--preset--color--ink); text-decoration: none; box-shadow: var(--wp--preset--shadow--card); }
.group-mini a:hover .group-mini__name { text-decoration: underline; }
.group-mini a:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 2px; }
.group-mini__name { font-family: var(--wp--preset--font-family--sora); font-weight: 600; }
.group-mini__meta { font-size: 14px; color: var(--wp--preset--color--grey-500); }
```

Enqueue it in `functions.php` as `elevation-groups`, the same way as `elevation-forms`, and add it to `add_editor_style`.

`seed/pages/connect-groups.html` (new copy). The hero markup is copied from `seed/pages/prayer.html` lines 1–13, with its text changed:

```html
<!-- wp:group {"tagName":"section","align":"full","className":"is-style-page-hero","backgroundColor":"ink","textColor":"white","style":{"spacing":{"padding":{"top":"70px","bottom":"60px"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull is-style-page-hero has-white-color has-ink-background-color has-text-color has-background" style="padding-top:70px;padding-bottom:60px"><!-- wp:paragraph {"className":"is-style-eyebrow-on-ink"} -->
<p class="is-style-eyebrow-on-ink">Connect Groups</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1,"textColor":"white"} -->
<h1 class="wp-block-heading has-white-color has-text-color">Find your people</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead-on-ink"} -->
<p class="is-style-lead-on-ink">Small groups across Manchester and online, meeting through the week. Find one near you or around your season of life, and ask to join.</p>
<!-- /wp:paragraph --></section>
<!-- /wp:group -->

<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:elevation/group-directory -->
<!-- wp:group {"className":"is-style-panel","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-panel"><!-- wp:paragraph -->
<p>We're adding our groups here soon. In the meantime, tell us a little about yourself below and we'll help you find one.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
<!-- /wp:elevation/group-directory --></section>
<!-- /wp:group -->

<!-- wp:group {"tagName":"section","align":"full","anchor":"join-group","backgroundColor":"grey-50","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"760px"}} -->
<section class="wp-block-group alignfull has-grey-50-background-color has-background" id="join-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"section-heading is-centered","layout":{"type":"default"}} -->
<div class="wp-block-group section-heading is-centered"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Ask to join</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">We'll put you in touch</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead"} -->
<p class="is-style-lead">Send this and the group's leader or our welcome team will get back to you, usually within a few days.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:elevation/form {"form":"join-group","className":"is-card"} /--></section>
<!-- /wp:group -->
```

`seed/pages/get-involved.html`: wrap the existing "Find a group" buttons block in the featured block, and point the button at the form:

```html
<!-- wp:elevation/featured-groups -->
<!-- wp:buttons {"className":"mt-8"} -->
<div class="wp-block-buttons mt-8"><!-- wp:button {"className":"is-style-navy"} -->
<div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="/connect-groups#join-group">Find a group</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->
<!-- /wp:elevation/featured-groups -->
```

`seed/fixtures/groups.json` (local-only sample content; leader addresses are `@example.com`):

```json
[
  { "slug": "salford-families", "title": "Salford Families", "order": 1,
    "summary": "Families with young children, meeting for food, a short Bible study and prayer while the kids play.",
    "area": "Salford", "category": "Families", "day": "tuesday", "time": "18:30",
    "leader": "Grace Example", "leader_email": "leader.salford@example.com", "accepting": true,
    "image": "redesign/im-new/kids-and-teens.jpg" },
  { "slug": "city-centre-young-professionals", "title": "City Centre Young Professionals", "order": 2,
    "summary": "After-work conversation, Sunday's message unpacked, and people who'll pray for your week.",
    "area": "City Centre", "category": "Young professionals", "day": "wednesday", "time": "19:30",
    "leader": "Daniel Example", "leader_email": "leader.city@example.com", "accepting": true,
    "image": "redesign/hero/hero-city.jpg" },
  { "slug": "couples-online", "title": "Couples Online", "order": 3,
    "summary": "Married and engaged couples on a video call, working through a short course together.",
    "area": "Online", "category": "Couples", "day": "thursday", "time": "20:00",
    "leader": "Ruth Example", "leader_email": "leader.online@example.com", "accepting": false,
    "image": "" }
]
```

In `includes/fixtures-cli.php`:
- Add a `groups` action next to `events`. It loops over the rows with a new `elevation_fixture_group( array $row, int $index )`.
- That function follows the shape of `elevation_fixture_event()`:
  1. Refuse a row without slug and title.
  2. Skip a real (non-fixture) group with the same slug.
  3. Create or update the post: `post_type` `connect_group`, `post_excerpt` = summary, `menu_order` = order, status publish.
  4. Set the five meta keys through their sanitisers.
  5. Find each term by name, or create it and mark it with the term meta `_elevation_fixture` = 1, then `wp_set_object_terms`.
  6. Look the image up with `elevation_seed_media_lookup()`, and error if a named image is missing.
  7. Mark the post `_elevation_fixture`.
- Change `remove` to:
  - delete fixture posts of the types `event`, `connect_group` and `announcement` (Task 6 adds the last type's fixtures), including trash;
  - then delete terms carrying `_elevation_fixture` in `group_area` and `group_category` that have no remaining posts;
  - report counts for posts and terms.

Update the usage message to `events|groups|announcements <file> | remove`.

`bin/seed.sh`:
- After the `church-in-the-park-2025` page, add `seed_post page connect-groups pages/connect-groups.html "Connect Groups" --meta-description="Find a Connect Group at {church.name}: small groups across Manchester and online, by area, season of life and day of the week."`.
- After the events fixtures line, add `wp elevation fixtures groups /seed/fixtures/groups.json`.

`bin/check-urls.sh`: add `check /connect-groups/ 200`, `check "/connect-groups/?area=salford&meets=tuesday" 200` and `check "/connect-groups/?meets=someday&area=%3Cscript%3E" 200`.

- [ ] **Step 7: Build, seed and check**

```bash
docker compose run --rm node npm run build
docker compose run --rm php vendor/bin/phpunit
./bin/seed.sh
./bin/check-urls.sh
./bin/check-tokens.sh /connect-groups/ /get-involved/
```

Expected: `OK`, "Seed complete.", "All URLs as expected.", and no raw tokens. Then check each of these:

1. **No leader email anywhere public.**
   - `curl -s http://localhost:8080/connect-groups/ | grep -c '@example.com'` prints `0`, and the same for `/get-involved/`.
   - `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/wp-json/wp/v2/connect_group` prints `401` or `403`, or a 200 whose items have no `group_leader_email`. Show the body.
   - `curl -s 'http://localhost:8080/wp-json/wp/v2/connect_group?context=edit'` prints `401`.
2. **Filters.**
   - `?area=salford` shows 1 card and "1 group".
   - `?meets=monday` isn't offered, because no group meets on a Monday. Forcing it in the URL is refused by `GroupFields::filters` and shows all 3.
   - `?type=couples&area=salford` shows the empty panel with "Clear the filters".
   - The Day select lists only Tuesday, Wednesday and Thursday.
3. **Join links.** A card's "Ask to join" goes to `/connect-groups/?area=…&group=<id>#join-group` when a filter is on, and to `?group=<id>#join-group` otherwise. That page shows "You're asking to join **Salford Families**", and the hidden field's value is `<id>`.
   - `?group=%3Cscript%3E` shows the "Not sure which group?" line, and the hidden value is empty or escaped.
   - The full group's button reads "Full right now, ask about the next one" in the ghost style.
4. **Routing (Mailpit).** Run `./bin/mail.sh clear` first.
   - `./bin/submit-form.sh join-group group_id=<Salford id> 'names[first_name]=Test' 'names[last_name]=Visitor' email=test@example.com message='Hi'` sends exactly two mails: one to `leader.salford@example.com` and one to `contact.welcomeInbox`, both with subject `Connect Group request: Salford Families`.
   - The full group accepts the request too, and emails its leader.
   - `group_id=` blank sends one mail, to the welcome team only.
   - A draft group gets `errors.restricted`. Make one with `wp post create --post_type=connect_group --post_status=draft --post_title='Draft Test'`, then delete it. So do a trashed group, a page ID (`wp post list --post_type=page --field=ID | head -1`) and `12abc`.
   - Nothing reaches a leader address in any of those.
5. **Get Involved.** `#connect-groups` shows the three mini cards and "Browse all groups". Then:
   1. Run `wp elevation fixtures remove`. The "Find a group" button now links to `/connect-groups#join-group`, and `/connect-groups` shows the "We're adding our groups here soon" panel with the form below.
   2. Re-run `wp elevation fixtures groups /seed/fixtures/groups.json`.
6. **Browser pane** at 1440px and 390px, for `/connect-groups` and `/get-involved#connect-groups`:
   - cards in 3, 2 and 1 columns;
   - the ink placeholder on the image-less group;
   - filters wrap on a phone;
   - Tab order is filters, "Show groups", cards, form;
   - focus rings on selects, links and buttons;
   - no console errors;
   - no Google request before consent.
7. **Editor panel.** Deferred: it needs a wp-admin sign-in. Note it for the user, and give the test in the Task 8 report: add a group, fill Group details, a bad leader email blocks saving, save, and see it on `/connect-groups`.

Run `purge-test-entries` and `./bin/mail.sh clear` afterwards.

- [ ] **Step 8: Commit**

```bash
git add wp-content/plugins/elevation-core/src/GroupFields.php wp-content/plugins/elevation-core/tests/GroupFieldsTest.php wp-content/plugins/elevation-core/includes/{groups,group-render,fixtures-cli}.php wp-content/plugins/elevation-core/src/blocks/{group-directory,featured-groups} wp-content/plugins/elevation-core/src/editor wp-content/plugins/elevation-core/build wp-content/plugins/elevation-core/elevation-core.php wp-content/themes/elevation/assets/css/groups.css wp-content/themes/elevation/functions.php seed/pages/connect-groups.html seed/pages/get-involved.html seed/fixtures/groups.json bin/seed.sh bin/check-urls.sh
git commit -m "Connect Groups: post type and panel, /connect-groups directory with filters, featured groups on Get Involved, leader routing for Join Group

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Announcements — post type, REST endpoint and the modal

**Files:**
- Create: `wp-content/plugins/elevation-core/src/Announcement.php`, `tests/AnnouncementTest.php`
- Create: `wp-content/plugins/elevation-core/includes/announcements.php`
- Create: `wp-content/plugins/elevation-core/assets/js/announcement-state.js` (UMD), `assets/js/announcement.js`, `tests/js/announcement-state.test.cjs`
- Create: `wp-content/plugins/elevation-core/src/editor/announcement-panel.js`. Modify `src/editor/index.js` to add `import './announcement-panel';`.
- Create: `wp-content/themes/elevation/assets/css/announcement.css`. Modify `functions.php` (enqueue).
- Create: `seed/fixtures/announcements.json`. Modify `includes/fixtures-cli.php` (an `announcements` action) and `bin/seed.sh`.
- Modify: `elevation-core.php` (requires)

**Interfaces:**
- Consumes: `EventTime::parse`, `EventFields::normaliseDateTime`, `EventFields::normaliseCtaUrl`, `Fixtures::when`, `Fixtures::paragraphs`, `Tokens::replace`, `elevation_public_setting`, `elevation_replace_tokens` (`includes/bindings.php`).
- Produces:
  - Post type `announcement`: not public, admin UI and REST, `capability_type` `post`, block editor limited to paragraphs and lists.
  - Meta:
    - `announcement_active` (bool, default false);
    - `announcement_starts` and `announcement_ends` (London `Y-m-d\TH:i` or `''`);
    - `announcement_cta_label` and `announcement_cta_url` (`https://…` or `/…`);
    - `announcement_dismiss_hours` (int 1–720, default 24).
  - `GET /wp-json/elevation/v1/announcement`, sent with `Cache-Control: no-store, max-age=0`, answering `{"announcement": null}` or
    `{"announcement": {"id", "version", "title", "body", "image": {"src","width","height"}|null, "ctaLabel", "ctaUrl", "dismissHours", "startsAt", "endsAt"}}`.
    `version` is the post's modified time (Unix seconds, GMT). `startsAt` and `endsAt` are ISO 8601 with offset, or null.
  - `window.ecmAnnouncementState`, with `parse`, `storageKey`, `inWindow`, `shouldShow` and `store`.
  - The localStorage key `ecm-announcement-{id}-{version}`. Its value is the dismissal time in milliseconds, as a string.
  - `wp elevation fixtures announcements <file>`.

- [ ] **Step 1: Write the failing tests**

`tests/AnnouncementTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use Elevation\Core\Announcement;
use PHPUnit\Framework\TestCase;

final class AnnouncementTest extends TestCase {

	public function test_dismiss_hours_default_to_24_outside_1_to_720(): void {
		$this->assertSame( 48, Announcement::dismissHours( 48 ) );
		$this->assertSame( 720, Announcement::dismissHours( '720' ) );
		foreach ( [ 0, 721, -3, '1.5', 'week', null, '' ] as $bad ) {
			$this->assertSame( 24, Announcement::dismissHours( $bad ), var_export( $bad, true ) );
		}
	}

	public function test_live_means_switched_on_and_inside_the_london_window(): void {
		$now = new DateTimeImmutable( '2026-10-05T08:30:00Z' ); // 09:30 BST
		$this->assertTrue( Announcement::isLive( true, '', '', $now ) );
		$this->assertFalse( Announcement::isLive( false, '', '', $now ) );
		$this->assertTrue( Announcement::isLive( true, '2026-10-05T09:30', '', $now ) );   // starts this minute
		$this->assertFalse( Announcement::isLive( true, '2026-10-05T09:31', '', $now ) );
		$this->assertFalse( Announcement::isLive( true, '', '2026-10-05T09:30', $now ) );  // ended this minute
		$this->assertTrue( Announcement::isLive( true, '2026-10-01T00:00', '2026-10-12T00:00', $now ) );
		$this->assertFalse( Announcement::isLive( true, 'soon', '', $now ) );              // unreadable: not shown
	}

	public function test_iso_times_carry_the_london_offset(): void {
		$this->assertSame( '2026-10-05T09:00:00+01:00', Announcement::iso( '2026-10-05T09:00' ) );
		$this->assertSame( '2026-11-05T09:00:00+00:00', Announcement::iso( '2026-11-05T09:00' ) );
		$this->assertNull( Announcement::iso( '' ) );
		$this->assertNull( Announcement::iso( 'nope' ) );
	}

	public function test_editor_errors(): void {
		$this->assertSame( [], Announcement::errors( [ 'starts' => '2026-10-01T09:00', 'ends' => '2026-10-02T09:00', 'cta_url' => '/im-new', 'dismiss_hours' => 24 ] ) );
		$this->assertSame(
			[
				'The end must be after the start.',
				'The button link must start with https:// or with / for a page on this site.',
				'"Hide for" must be a whole number of hours from 1 to 720.',
			],
			Announcement::errors( [ 'starts' => '2026-10-02T09:00', 'ends' => '2026-10-02T09:00', 'cta_url' => 'javascript:alert(1)', 'dismiss_hours' => 0 ] )
		);
		$this->assertSame( [ "The start date and time aren't valid." ], Announcement::errors( [ 'starts' => '2026-13-01T09:00' ] ) );
	}
}
```

`tests/js/announcement-state.test.cjs`:

```js
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const A = require( '../../assets/js/announcement-state.js' );

const HOUR = 3600000;
const answer = ( extra = {} ) => ( { announcement: { id: 7, version: 1759650000, title: 'Harvest', body: '<p>Hi</p>', image: null, ctaLabel: '', ctaUrl: '/im-new', dismissHours: 24, startsAt: null, endsAt: null, ...extra } } );

test( 'parse keeps a well-formed answer and fills the defaults', () => {
	const a = A.parse( answer() );
	assert.equal( a.ctaLabel, 'Find out more' );
	assert.equal( a.dismissHours, 24 );
	assert.equal( A.storageKey( a ), 'ecm-announcement-7-1759650000' );
} );

test( 'parse refuses anything else, and unsafe links', () => {
	for ( const bad of [ null, {}, { announcement: null }, { announcement: { id: '7', version: 1, title: 'x' } }, { announcement: { id: 7, version: 1 } } ] ) {
		assert.equal( A.parse( bad ), null );
	}
	assert.equal( A.parse( answer( { ctaUrl: 'javascript:alert(1)' } ) ).ctaUrl, '' );
	assert.equal( A.parse( answer( { ctaUrl: '//evil.example' } ) ).ctaUrl, '' );
	assert.equal( A.parse( answer( { dismissHours: 9999 } ) ).dismissHours, 24 );
} );

test( 'the browser re-checks the window with its own clock', () => {
	const now = Date.parse( '2026-10-05T09:30:00+01:00' );
	assert.equal( A.shouldShow( A.parse( answer( { startsAt: '2026-10-05T10:00:00+01:00' } ) ), null, now ), false );
	assert.equal( A.shouldShow( A.parse( answer( { endsAt: '2026-10-05T09:00:00+01:00' } ) ), null, now ), false );
	assert.equal( A.shouldShow( A.parse( answer( { startsAt: '2026-10-05T09:00:00+01:00', endsAt: '2026-10-06T09:00:00+01:00' } ) ), null, now ), true );
} );

test( 'a dismissal hides it for dismissHours, then it shows again', () => {
	const a = A.parse( answer( { dismissHours: 2 } ) );
	const now = 10 * HOUR;
	assert.equal( A.shouldShow( a, null, now ), true );
	assert.equal( A.shouldShow( a, String( now - HOUR ), now ), false );
	assert.equal( A.shouldShow( a, String( now - 2 * HOUR ), now ), false );
	assert.equal( A.shouldShow( a, String( now - 2 * HOUR - 1 ), now ), true );
	assert.equal( A.shouldShow( a, 'garbage', now ), true );
} );

test( 'the store falls back to memory when storage throws or is missing', () => {
	const throwing = A.store( () => {
		throw new Error( 'SecurityError' );
	} );
	assert.equal( throwing.get( 'k' ), null );
	throwing.set( 'k', 5 );
	assert.equal( throwing.get( 'k' ), '5' );
	const missing = A.store( () => null );
	missing.set( 'k', 'v' );
	assert.equal( missing.get( 'k' ), 'v' );
	const data = {};
	const real = A.store( () => ( { getItem: ( k ) => ( k in data ? data[ k ] : null ), setItem: ( k, v ) => ( data[ k ] = v ) } ) );
	real.set( 'k', 1 );
	assert.equal( data.k, '1' );
	assert.equal( real.get( 'k' ), '1' );
} );
```

Run the PHPUnit filter `AnnouncementTest` and `docker compose run --rm node npm run test:js`.
Expected: both fail, because the class and the module don't exist.

- [ ] **Step 2: Write `src/Announcement.php` and `assets/js/announcement-state.js`**

```php
<?php
namespace Elevation\Core;

use DateTimeImmutable;

/**
 * The announcement's schedule and settings (spec §6.5). Times are London wall-clock "Y-m-d\TH:i", as events.
 * The server answers "is one showing now?"; the browser re-checks the window with its own clock. Pure.
 */
final class Announcement {

	public const DEFAULT_DISMISS_HOURS = 24;

	public static function dismissHours( mixed $value ): int {
		if ( is_string( $value ) && ctype_digit( trim( $value ) ) ) {
			$value = (int) trim( $value );
		}
		return is_int( $value ) && $value >= 1 && $value <= 720 ? $value : self::DEFAULT_DISMISS_HOURS;
	}

	/** Switched on, and now is inside [starts, ends). Blank ends are open; an unreadable time hides it. */
	public static function isLive( bool $active, string $starts, string $ends, DateTimeImmutable $now ): bool {
		if ( ! $active ) {
			return false;
		}
		$from = '' === $starts ? null : EventTime::parse( $starts );
		$to   = '' === $ends ? null : EventTime::parse( $ends );
		if ( ( '' !== $starts && null === $from ) || ( '' !== $ends && null === $to ) ) {
			return false;
		}
		return ( null === $from || $now >= $from ) && ( null === $to || $now < $to );
	}

	/** "2026-10-05T09:00" → "2026-10-05T09:00:00+01:00" for the browser; "" or unreadable → null. */
	public static function iso( string $local ): ?string {
		return ( '' === $local ? null : EventTime::parse( $local ) )?->format( DATE_ATOM );
	}

	/** @return list<string> Sentences for the editor; empty when the settings can be saved. */
	public static function errors( array $raw ): array {
		$errors   = [];
		$startRaw = trim( (string) ( $raw['starts'] ?? '' ) );
		$endRaw   = trim( (string) ( $raw['ends'] ?? '' ) );
		$start    = EventFields::normaliseDateTime( $startRaw );
		$end      = EventFields::normaliseDateTime( $endRaw );
		if ( '' !== $startRaw && '' === $start ) {
			$errors[] = "The start date and time aren't valid.";
		}
		if ( '' !== $endRaw && '' === $end ) {
			$errors[] = "The end date and time aren't valid.";
		} elseif ( '' !== $start && '' !== $end && $end <= $start ) {
			$errors[] = 'The end must be after the start.';
		}
		$cta = trim( (string) ( $raw['cta_url'] ?? '' ) );
		if ( '' !== $cta && '' === EventFields::normaliseCtaUrl( $cta ) ) {
			$errors[] = 'The button link must start with https:// or with / for a page on this site.';
		}
		if ( ! self::validHours( $raw['dismiss_hours'] ?? self::DEFAULT_DISMISS_HOURS ) ) {
			$errors[] = '"Hide for" must be a whole number of hours from 1 to 720.';
		}
		return $errors;
	}

	private static function validHours( mixed $value ): bool {
		if ( is_string( $value ) ) {
			$value = trim( $value );
			if ( ! ctype_digit( $value ) ) {
				return false;
			}
			$value = (int) $value;
		}
		return is_int( $value ) && $value >= 1 && $value <= 720;
	}
}
```

`assets/js/announcement-state.js`:

```js
/** The announcement answer and the dismissal rule (spec §6.5) — pure, shared by announcement.js and the node tests. */
( function ( root, factory ) {
	const api = factory();
	if ( typeof module === 'object' && module.exports ) {
		module.exports = api;
	} else {
		root.ecmAnnouncementState = api;
	}
} )( typeof self !== 'undefined' ? self : this, function () {
	const HOUR = 3600000;

	function hours( value ) {
		const n = Number( value );
		return Number.isInteger( n ) && n >= 1 && n <= 720 ? n : 24;
	}

	function safeUrl( url ) {
		return typeof url === 'string' && ( /^https:\/\//i.test( url ) || ( url.charAt( 0 ) === '/' && url.charAt( 1 ) !== '/' ) ) ? url : '';
	}

	function parse( json ) {
		const a = json && json.announcement;
		if ( ! a || typeof a !== 'object' || ! Number.isInteger( a.id ) || ! Number.isInteger( a.version ) || typeof a.title !== 'string' ) {
			return null;
		}
		return {
			id: a.id,
			version: a.version,
			title: a.title,
			body: typeof a.body === 'string' ? a.body : '',
			image: a.image && typeof a.image.src === 'string' ? a.image : null,
			ctaLabel: typeof a.ctaLabel === 'string' && a.ctaLabel.trim() ? a.ctaLabel : 'Find out more',
			ctaUrl: safeUrl( a.ctaUrl ),
			dismissHours: hours( a.dismissHours ),
			startsAt: typeof a.startsAt === 'string' ? a.startsAt : null,
			endsAt: typeof a.endsAt === 'string' ? a.endsAt : null,
		};
	}

	function storageKey( a ) {
		return 'ecm-announcement-' + a.id + '-' + a.version;
	}

	function inWindow( a, nowMs ) {
		const start = a.startsAt ? Date.parse( a.startsAt ) : NaN;
		const end = a.endsAt ? Date.parse( a.endsAt ) : NaN;
		return ( isNaN( start ) || nowMs >= start ) && ( isNaN( end ) || nowMs < end );
	}

	/** As the redesign: show unless dismissed less than dismissHours ago. */
	function shouldShow( a, stored, nowMs ) {
		if ( ! a || ! inWindow( a, nowMs ) ) {
			return false;
		}
		const at = Number( stored );
		if ( stored === null || stored === undefined || stored === '' || ! Number.isFinite( at ) ) {
			return true;
		}
		return nowMs - at > a.dismissHours * HOUR;
	}

	/** localStorage when it works; memory for this page view when it throws (private mode, blocked storage). */
	function store( getStorage ) {
		const memory = {};
		return {
			get( key ) {
				try {
					const s = getStorage();
					if ( s ) {
						return s.getItem( key );
					}
				} catch ( e ) {}
				return Object.prototype.hasOwnProperty.call( memory, key ) ? memory[ key ] : null;
			},
			set( key, value ) {
				memory[ key ] = String( value );
				try {
					const s = getStorage();
					if ( s ) {
						s.setItem( key, String( value ) );
					}
				} catch ( e ) {}
			},
		};
	}

	return { parse, storageKey, inWindow, shouldShow, store };
} );
```

Require `src/Announcement.php` in `elevation-core.php` after `src/GroupFields.php`. Run both test suites. Expected: PASS.

- [ ] **Step 3: Write `includes/announcements.php`**

```php
<?php
/**
 * Announcements (spec §6.5): the post type and its settings, "only one on at a time", and the uncacheable
 * endpoint the modal script asks on every page view, so switching one on or off takes effect on the next
 * page view whatever the 10-minute HTML cache holds.
 */
use Elevation\Core\Announcement;
use Elevation\Core\EventFields;
use Elevation\Core\Tokens;

defined( 'ABSPATH' ) || exit;

const ELEVATION_ANNOUNCEMENT_META = [
	'announcement_active'        => 'boolean',
	'announcement_starts'        => 'string',
	'announcement_ends'          => 'string',
	'announcement_cta_label'     => 'string',
	'announcement_cta_url'       => 'string',
	'announcement_dismiss_hours' => 'integer',
];

add_action( 'init', function () {
	register_post_type( 'announcement', [
		'labels'          => [
			'name'          => __( 'Announcements', 'elevation-core' ),
			'singular_name' => __( 'Announcement', 'elevation-core' ),
			'add_new_item'  => __( 'Add Announcement', 'elevation-core' ),
			'edit_item'     => __( 'Edit Announcement', 'elevation-core' ),
			'new_item'      => __( 'New Announcement', 'elevation-core' ),
			'search_items'  => __( 'Search Announcements', 'elevation-core' ),
			'not_found'     => __( 'No announcements yet.', 'elevation-core' ),
			'all_items'     => __( 'All Announcements', 'elevation-core' ),
			'menu_name'     => __( 'Announcements', 'elevation-core' ),
		],
		'public'          => false,
		'show_ui'         => true,
		'show_in_rest'    => true,
		'menu_icon'       => 'dashicons-megaphone',
		'menu_position'   => 23,
		'supports'        => [ 'title', 'editor', 'thumbnail', 'revisions', 'custom-fields' ],
		'map_meta_cap'    => true,
		'capability_type' => 'post',
		'rewrite'         => false,
		'query_var'       => false,
		'template'        => [ [ 'core/paragraph', [ 'placeholder' => __( 'What would you like to tell everyone?', 'elevation-core' ) ] ] ],
	] );
	$sanitisers = [
		'announcement_active'        => 'rest_sanitize_boolean',
		'announcement_starts'        => [ EventFields::class, 'normaliseDateTime' ],
		'announcement_ends'          => [ EventFields::class, 'normaliseDateTime' ],
		'announcement_cta_label'     => 'sanitize_text_field',
		'announcement_cta_url'       => [ EventFields::class, 'normaliseCtaUrl' ],
		'announcement_dismiss_hours' => [ Announcement::class, 'dismissHours' ],
	];
	foreach ( ELEVATION_ANNOUNCEMENT_META as $key => $type ) {
		register_post_meta( 'announcement', $key, [
			'type'              => $type,
			'single'            => true,
			'default'           => match ( $key ) { 'announcement_active' => false, 'announcement_dismiss_hours' => Announcement::DEFAULT_DISMISS_HOURS, default => '' },
			'show_in_rest'      => true,
			'sanitize_callback' => $sanitisers[ $key ],
			'auth_callback'     => static fn ( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', (int) $post_id ),
		] );
	}
} );

add_filter( 'allowed_block_types_all', static function ( $allowed, $context ) {
	return ( $context->post ?? null ) && 'announcement' === $context->post->post_type ? [ 'core/paragraph', 'core/list', 'core/list-item' ] : $allowed;
}, 10, 2 );

add_filter( 'rest_pre_insert_announcement', static function ( $prepared, WP_REST_Request $request ) {
	$meta   = (array) ( $request->get_param( 'meta' ) ?? [] );
	$id     = (int) ( $prepared->ID ?? 0 );
	$value  = static fn ( string $key ) => array_key_exists( $key, $meta ) ? $meta[ $key ] : ( $id ? get_post_meta( $id, $key, true ) : '' );
	$errors = Announcement::errors( [
		'starts'        => $value( 'announcement_starts' ),
		'ends'          => $value( 'announcement_ends' ),
		'cta_url'       => $value( 'announcement_cta_url' ),
		'dismiss_hours' => '' === $value( 'announcement_dismiss_hours' ) ? Announcement::DEFAULT_DISMISS_HOURS : $value( 'announcement_dismiss_hours' ),
	] );
	return $errors ? new WP_Error( 'elevation_announcement_invalid', implode( ' ', $errors ), [ 'status' => 400 ] ) : $prepared;
}, 10, 2 );

/** Switching one on switches the others off (spec §6.5). Only a published announcement counts. */
function elevation_announcement_deactivate_others( int $keep ): void {
	$others = get_posts( [
		'post_type'      => 'announcement',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
		'post__not_in'   => [ $keep ],
		'meta_key'       => 'announcement_active', // phpcs:ignore WordPress.DB.SlowDBQuery
		'meta_value'     => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
	] );
	foreach ( $others as $id ) {
		update_post_meta( (int) $id, 'announcement_active', false );
	}
}
foreach ( [ 'added_post_meta', 'updated_post_meta' ] as $elevation_hook ) {
	add_action( $elevation_hook, static function ( $meta_id, $post_id, $meta_key, $value ) {
		if ( 'announcement_active' === $meta_key && rest_sanitize_boolean( $value ) && 'publish' === get_post_status( (int) $post_id ) && 'announcement' === get_post_type( (int) $post_id ) ) {
			elevation_announcement_deactivate_others( (int) $post_id );
		}
	}, 10, 4 );
}
add_action( 'transition_post_status', static function ( $new, $old, $post ) {
	if ( 'publish' === $new && 'publish' !== $old && 'announcement' === $post->post_type && get_post_meta( $post->ID, 'announcement_active', true ) ) {
		elevation_announcement_deactivate_others( (int) $post->ID );
	}
}, 10, 3 );

function elevation_current_announcement( ?DateTimeImmutable $now = null ): ?WP_Post {
	$now   ??= new DateTimeImmutable( 'now' );
	$active = get_posts( [
		'post_type'      => 'announcement',
		'post_status'    => 'publish',
		'posts_per_page' => 5,
		'orderby'        => 'modified',
		'order'          => 'DESC',
		'meta_key'       => 'announcement_active', // phpcs:ignore WordPress.DB.SlowDBQuery
		'meta_value'     => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
	] );
	foreach ( $active as $post ) {
		if ( Announcement::isLive( true, (string) get_post_meta( $post->ID, 'announcement_starts', true ), (string) get_post_meta( $post->ID, 'announcement_ends', true ), $now ) ) {
			return $post;
		}
	}
	return null;
}

function elevation_announcement_payload( WP_Post $post ): array {
	$image = (int) get_post_thumbnail_id( $post );
	$src   = $image ? wp_get_attachment_image_src( $image, 'medium_large' ) : false;
	return [
		'id'           => $post->ID,
		'version'      => (int) get_post_modified_time( 'U', true, $post ),
		'title'        => Tokens::replace( $post->post_title, 'elevation_public_setting', false ),
		'body'         => elevation_replace_tokens( wp_kses_post( do_blocks( $post->post_content ) ) ),
		'image'        => $src ? [ 'src' => $src[0], 'width' => (int) $src[1], 'height' => (int) $src[2] ] : null,
		'ctaLabel'     => (string) get_post_meta( $post->ID, 'announcement_cta_label', true ),
		'ctaUrl'       => EventFields::normaliseCtaUrl( get_post_meta( $post->ID, 'announcement_cta_url', true ) ),
		'dismissHours' => Announcement::dismissHours( get_post_meta( $post->ID, 'announcement_dismiss_hours', true ) ),
		'startsAt'     => Announcement::iso( (string) get_post_meta( $post->ID, 'announcement_starts', true ) ),
		'endsAt'       => Announcement::iso( (string) get_post_meta( $post->ID, 'announcement_ends', true ) ),
	];
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'elevation/v1', '/announcement', [
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => static function () {
			$post     = elevation_current_announcement();
			$response = new WP_REST_Response( [ 'announcement' => $post ? elevation_announcement_payload( $post ) : null ] );
			$response->header( 'Cache-Control', 'no-store, max-age=0' );
			return $response;
		},
	] );
} );

add_action( 'wp_enqueue_scripts', function () {
	$version = static fn ( string $file ) => (string) filemtime( ELEVATION_CORE_DIR . $file );
	wp_register_script( 'elevation-announcement-state', ELEVATION_CORE_URL . 'assets/js/announcement-state.js', [], $version( 'assets/js/announcement-state.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_enqueue_script( 'elevation-announcement', ELEVATION_CORE_URL . 'assets/js/announcement.js', [ 'elevation-announcement-state' ], $version( 'assets/js/announcement.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_add_inline_script( 'elevation-announcement', 'window.ecmAnnouncement = ' . wp_json_encode( [ 'endpoint' => rest_url( 'elevation/v1/announcement' ) ] ) . ';', 'before' );
} );

// The list screen says which one is showing.
add_filter( 'manage_announcement_posts_columns', static fn ( array $columns ): array => array_slice( $columns, 0, 2, true ) + [ 'announcement_showing' => __( 'Showing', 'elevation-core' ) ] + $columns );
add_action( 'manage_announcement_posts_custom_column', static function ( string $column, int $post_id ) {
	if ( 'announcement_showing' !== $column ) {
		return;
	}
	$current = elevation_current_announcement();
	if ( $current && $current->ID === $post_id ) {
		esc_html_e( 'Showing now', 'elevation-core' );
	} elseif ( get_post_meta( $post_id, 'announcement_active', true ) ) {
		esc_html_e( 'On, but outside its dates', 'elevation-core' );
	} else {
		esc_html_e( 'Off', 'elevation-core' );
	}
}, 10, 2 );
```

Check that `elevation_replace_tokens()` takes one string argument, by reading `includes/bindings.php`. Also check that `Tokens::replace()`'s lookup can be the string `'elevation_public_setting'`. It is `callable(string)`, so a function name works.

Require `includes/announcements.php` in `elevation-core.php` after `includes/group-render.php`.

- [ ] **Step 4: The modal script and styles**

`assets/js/announcement.js`:

```js
/**
 * The site-wide announcement modal (spec §6.5; redesign announcement-modal.tsx). Asks the no-store endpoint
 * on each page view, then decides here with the browser's clock and the stored dismissal. Every way of
 * closing it (Escape, the backdrop, ×, "Not now", the button) counts as a dismissal.
 */
( function () {
	const config = window.ecmAnnouncement;
	const S = window.ecmAnnouncementState;
	if ( ! config || ! S || typeof fetch !== 'function' || typeof HTMLDialogElement === 'undefined' ) {
		return;
	}
	const store = S.store( () => window.localStorage );

	fetch( config.endpoint, { cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' } } )
		.then( ( response ) => ( response.ok ? response.json() : null ) )
		.then( ( json ) => {
			const a = S.parse( json );
			if ( a && S.shouldShow( a, store.get( S.storageKey( a ) ), Date.now() ) ) {
				open( a );
			}
		} )
		.catch( () => {} );

	function el( tag, className, text ) {
		const node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		if ( text ) {
			node.textContent = text;
		}
		return node;
	}

	function open( a ) {
		const key = S.storageKey( a );
		const dialog = el( 'dialog', 'ecm-announcement' );
		dialog.setAttribute( 'aria-labelledby', 'ecm-announcement-title' );
		const card = el( 'div', 'ecm-announcement__card' );
		if ( a.image ) {
			const media = el( 'div', 'ecm-announcement__media' );
			const img = el( 'img' );
			img.src = a.image.src;
			img.alt = '';
			img.width = a.image.width;
			img.height = a.image.height;
			media.appendChild( img );
			card.appendChild( media );
		}
		const body = el( 'div', 'ecm-announcement__body' );
		const title = el( 'h2', 'ecm-announcement__title', a.title );
		title.id = 'ecm-announcement-title';
		const text = el( 'div', 'ecm-announcement__text' );
		text.innerHTML = a.body; // wp_kses_post'd on the server, written by staff.
		const actions = el( 'div', 'ecm-announcement__actions' );
		if ( a.ctaUrl ) {
			const wrap = el( 'div', 'wp-block-button' );
			const link = el( 'a', 'wp-block-button__link wp-element-button', a.ctaLabel );
			link.href = a.ctaUrl;
			link.addEventListener( 'click', () => store.set( key, Date.now() ) );
			wrap.appendChild( link );
			actions.appendChild( wrap );
		}
		const later = el( 'div', 'wp-block-button is-style-ghost' );
		const laterButton = el( 'button', 'wp-block-button__link wp-element-button', 'Not now' );
		laterButton.type = 'button';
		laterButton.addEventListener( 'click', () => dialog.close() );
		later.appendChild( laterButton );
		actions.appendChild( later );
		body.append( title, text, actions );
		card.appendChild( body );
		const close = el( 'button', 'ecm-announcement__close' );
		close.type = 'button';
		close.setAttribute( 'aria-label', 'Close announcement' );
		close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
		close.addEventListener( 'click', () => dialog.close() );
		dialog.append( card, close );

		dialog.addEventListener( 'click', ( event ) => {
			if ( event.target === dialog ) {
				dialog.close(); // a click on the backdrop
			}
		} );
		dialog.addEventListener( 'close', () => {
			store.set( key, Date.now() );
			document.documentElement.classList.remove( 'has-announcement' );
			dialog.remove();
		} );
		window.addEventListener( 'storage', ( event ) => {
			if ( event.key === key && event.newValue && dialog.open ) {
				dialog.close(); // dismissed in another tab
			}
		} );

		document.body.appendChild( dialog );
		document.documentElement.classList.add( 'has-announcement' );
		dialog.showModal();
	}
} )();
```

`wp-content/themes/elevation/assets/css/announcement.css` (redesign: `bg-ink/60` backdrop with blur, a 448px white card with 22px radius, `p-7` body, Sora 24px bold title, 15px grey-500 text, and the corner × button):

```css
/* The announcement modal (redesign announcement-modal.tsx). Plan 5 Task 6. */
.ecm-announcement { width: min(448px, calc(100% - 32px)); max-width: none; max-height: calc(100% - 32px); margin: auto; padding: 0; border: 0; background: transparent; overflow: visible; }
.ecm-announcement::backdrop { background: rgb(14 14 44 / 0.6); backdrop-filter: blur(4px); }
.ecm-announcement__card { max-height: calc(100vh - 32px); overflow: auto; border-radius: 22px; background: #fff; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
.ecm-announcement__media { aspect-ratio: 16 / 9; background: var(--wp--preset--color--ink); }
.ecm-announcement__media img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ecm-announcement__body { padding: 28px; }
.ecm-announcement__title { margin: 0; font-family: var(--wp--preset--font-family--sora); font-size: 24px; font-weight: 700; line-height: 1.25; color: var(--wp--preset--color--ink); text-wrap: balance; }
.ecm-announcement__text { margin-top: 12px; font-size: 15px; line-height: 1.65; color: var(--wp--preset--color--grey-500); }
.ecm-announcement__text > * { margin: 0 0 0.75em; }
.ecm-announcement__text > :last-child { margin-bottom: 0; }
.ecm-announcement__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.ecm-announcement__close { position: fixed; top: 16px; right: 16px; display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 9999px; background: rgb(255 255 255 / 0.1); color: #fff; backdrop-filter: blur(12px); cursor: pointer; }
.ecm-announcement__close:hover { background: rgb(255 255 255 / 0.2); }
.ecm-announcement__close:focus-visible { outline: 2px solid var(--wp--preset--color--green); outline-offset: 2px; }
.has-announcement { overflow: hidden; }
@media (prefers-reduced-motion: no-preference) {
	.ecm-announcement[open] { animation: ecm-announcement-in 0.2s ease-out; }
	@keyframes ecm-announcement-in { from { opacity: 0; transform: translateY(8px); } }
}
```

Enqueue it in `functions.php` as `elevation-announcement`, as the other stylesheets. It isn't an editor style.

- [ ] **Step 5: The editor panel and the fixture**

`src/editor/announcement-panel.js`:
- Structure: a `PluginDocumentSettingPanel` named `elevation-announcement`, titled "Announcement settings", shown only when `getCurrentPostType() === 'announcement'`. Use the same two-component shape as `group-panel.js`.
- Fields, bound to meta with `useEntityProp`:
  - ToggleControl "Show this announcement", help: "Only one announcement shows at a time: switching this on switches the others off."
  - TextControl `type="datetime-local"` "Start showing" and "Stop showing", help: "UK time. Leave blank to start now or keep showing."
  - TextControl "Button text", help: 'Leave blank for "Find out more".'
  - TextControl "Button link", help: "https://… or a page on this site, like /im-new."
  - TextControl `type="number"` "Hide for (hours) after someone closes it", with `min=1` and `max=720`. Parse the value with `parseInt`.
- Validation: mirror `Announcement::errors()`:
  - the end must be after the start;
  - the link must be `https://` or `/…` but not `//`;
  - hours must be a whole number from 1 to 720.
- Show the first error in `#CC3B3B` under the panel, and call `lockPostSaving( 'elevation-announcement' )` while there is one.
- The datetime-local value is exactly `Y-m-d\TH:i`, the stored format, so no conversion is needed. The browser's time zone doesn't matter, because the value is wall-clock text.

`seed/fixtures/announcements.json` (local-only, **switched off**):

```json
[
  { "slug": "harvest-sunday", "title": "Harvest Sunday is coming",
    "body": "Join us on {service.day} at {service.startTime} for a special harvest service, with food to share afterwards. Bring a friend!",
    "cta_label": "Plan your visit", "cta_url": "/im-new#plan-a-visit",
    "active": false, "starts": "", "ends": "+14 23:59", "dismiss_hours": 24,
    "image": "redesign/events/greatness-community-summer-hangout.jpg" }
]
```

In `includes/fixtures-cli.php`, add an `announcements` action with `elevation_fixture_announcement( array $row, DateTimeImmutable $today, int $index )`. It follows the shape of `elevation_fixture_event()`:
- `post_content` comes from `Fixtures::paragraphs( body )`.
- `starts` and `ends` go through `Fixtures::when()`.
- Refuse a row where `Announcement::errors()` isn't empty.
- Set the image as the thumbnail, and set the six meta keys.
- Mark the post with `_elevation_fixture`.
- **Do not switch a fixture on** unless its row says `"active": true`.

In `bin/seed.sh`, add `wp elevation fixtures announcements /seed/fixtures/announcements.json` after the groups fixtures line.

- [ ] **Step 6: Build and check**

```bash
docker compose run --rm node npm run build
docker compose run --rm php vendor/bin/phpunit
docker compose run --rm node npm run test:js
./bin/seed.sh
curl -s -D - http://localhost:8080/wp-json/elevation/v1/announcement
```

Expected:
- `OK` and `# fail 0`.
- The fixture is created switched off.
- The endpoint answers `{"announcement":null}` with `Cache-Control: no-store, max-age=0`.

Then check each of these:

1. **Switch on, switch off, one at a time.**
   1. Run `wp post meta update <fixture id> announcement_active 1`. The endpoint now returns it: title, body HTML with "Sunday at 10:30am" (tokens replaced), the image `src` on this site, `ctaUrl` `/im-new#plan-a-visit`, `dismissHours` 24, `startsAt` null and `endsAt` with a `+01:00` or `+00:00` offset.
   2. Create a second published announcement with `wp post create --post_type=announcement --post_status=publish --post_title='Test notice' --porcelain`, then set its `announcement_active` to 1. The fixture's `announcement_active` is now empty (switched off), and the endpoint returns the test notice.
   3. Switch the test notice off and delete it (`wp post delete <id> --force`). Switch the fixture back on.
2. **Window.**
   - Set the fixture's `announcement_ends` to yesterday (`2026-…T12:00`). The endpoint says null.
   - Set `announcement_starts` to tomorrow and clear the end. The endpoint still says null.
   - Clear both. The endpoint returns it again.
3. **REST validation.** As admin through `wp eval` with `rest_do_request`, a `POST /wp/v2/announcement/<id>` with `meta.announcement_cta_url = "javascript:alert(1)"` returns a 400 whose message has the button-link sentence.
4. **Browser pane,** with the fixture on:
   - Load `/`. The modal opens over the page: image, title, text, the green "Plan your visit" and ghost "Not now", the corner ×, a blurred ink backdrop, and background scroll locked.
   - Keyboard: focus lands inside the dialog and Tab stays inside it. **Escape** closes it and focus returns to the page.
   - Reload. It does **not** show again. `localStorage` has `ecm-announcement-<id>-<version>`.
   - Close with the backdrop and with × on a second browser profile or after clearing site data. Both count.
   - Edit the fixture's title (`wp post update <id> --post_title='Harvest Sunday is nearly here'`). The next page view shows it again, because the version changed.
   - Set `announcement_dismiss_hours` to 1, and in the console set the stored value to `String(Date.now() - 2*3600000)`. The next page view shows it.
   - Switch it off with `wp post meta update <id> announcement_active 0`, then click to another page without reloading the first one. No modal appears, and the network panel shows the endpoint request marked no-store.
   - At 390px the card fits with a 16px margin and scrolls inside if it is tall.
   - No console errors, with and without an announcement.
   - No Google request.
5. **Storage blocked.** In the console, run `localStorage.setItem = () => { throw new Error('blocked'); }`, then reload with the fixture on and dismissed-state cleared. The modal still shows once and closes cleanly. The JS test already pins the fallback.
6. **Editor panel.** Deferred: it needs a wp-admin sign-in. Give the test in the Task 8 report: create an announcement, switch it on, set dates, a bad link blocks saving, and publish.

Finally, switch the fixture off again (`wp post meta update <id> announcement_active 0`) and clear site data in the browser pane.

- [ ] **Step 7: Commit**

```bash
git add wp-content/plugins/elevation-core/src/Announcement.php wp-content/plugins/elevation-core/tests/AnnouncementTest.php wp-content/plugins/elevation-core/tests/js/announcement-state.test.cjs wp-content/plugins/elevation-core/includes/{announcements,fixtures-cli}.php wp-content/plugins/elevation-core/assets/js/announcement{,-state}.js wp-content/plugins/elevation-core/src/editor wp-content/plugins/elevation-core/build wp-content/plugins/elevation-core/elevation-core.php wp-content/themes/elevation/assets/css/announcement.css wp-content/themes/elevation/functions.php seed/fixtures/announcements.json bin/seed.sh
git commit -m "Announcements: post type and panel, no-store endpoint, one-at-a-time, and the modal with the redesign's dismissal rule

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Who can read entries, and Gift Aid entries that can't be deleted

**Files:**
- Create: `wp-content/plugins/elevation-core/includes/forms-access.php`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`: require it after `includes/forms.php`.

**Interfaces:**
- Consumes:
  - `Forms::siteManagerKeys()`, `elevation_form_id()`, `elevation_form_key()`, `elevation_form_key_of()`;
  - the action `elevation_forms_seeded` (Task 2);
  - the `site_manager` role (`includes/roles.php`).
- Consumes from Fluent Forms 6.2.14:
  - user meta `_fluent_forms_has_role` (1), `_fluent_forms_has_specific_forms_permission` (`'yes'`) and `_fluent_forms_allowed_forms` (an array of form IDs). `FormManagerService::getUserAllowedFormsScope()` treats `[]` as "restricted to none".
  - capabilities `fluentform_dashboard_access`, `fluentform_entries_viewer` and `fluentform_manage_entries`;
  - `fluentform/before_deleting_entries` (`$ids, $formId`), which aborts when it throws;
  - `fluentform/entry_statuses_for_mutation` (`$statuses, $formId`);
  - `fluentform/before_form_delete` (`$formId`), which aborts when it throws;
  - `fluentform/before_insert_submission` (`$insertData, $data, $form`);
  - `\FluentForm\App\Helpers\Helper::{isEntryAutoDeleteEnabled,getFormMeta,setFormMeta}`.
- Produces:
  - `elevation_site_manager_form_ids(): list<int>`
  - `elevation_sync_form_access( int $user_id ): void`
  - `elevation_sync_all_form_access(): void`
  - the option `elevation_form_access_version`
  - the user meta `_elevation_form_access`, which marks grants this plugin made, so it only ever removes its own.

- [ ] **Step 1: Write `includes/forms-access.php`**

```php
<?php
/**
 * Who reads which entries (spec §7), and Gift Aid retention (spec §6.10).
 * - Site Managers get Fluent Forms' entry access to the Site Manager forms only (every form but Prayer and
 *   Gift Aid), through Fluent Forms' own per-user manager records, kept in sync here whenever a user's role
 *   or the form IDs change. Staff never set this up by hand. Editors get no Fluent Forms access.
 * - Gift Aid entries can't be deleted or trashed, the form can't be deleted, and "delete entries after
 *   submission" can't be left on for it. HMRC: keep for six years after the last gift.
 */
use Elevation\Core\Forms;

defined( 'ABSPATH' ) || exit;

const ELEVATION_FORM_MANAGER_CAPS = [ 'fluentform_dashboard_access', 'fluentform_entries_viewer', 'fluentform_manage_entries' ];

/** @return list<int> */
function elevation_site_manager_form_ids(): array {
	$ids = array_values( array_filter( array_map( 'elevation_form_id', Forms::siteManagerKeys() ) ) );
	sort( $ids );
	return $ids;
}

function elevation_sync_form_access( int $user_id ): void {
	$user = get_userdata( $user_id );
	if ( ! $user ) {
		return;
	}
	$meta_keys = [ '_fluent_forms_has_role', '_fluent_forms_has_specific_forms_permission', '_fluent_forms_allowed_forms', '_elevation_form_access' ];
	if ( in_array( 'site_manager', (array) $user->roles, true ) && ! user_can( $user, 'manage_options' ) ) {
		foreach ( ELEVATION_FORM_MANAGER_CAPS as $cap ) {
			$user->add_cap( $cap );
		}
		update_user_meta( $user_id, '_fluent_forms_has_role', 1 );
		update_user_meta( $user_id, '_fluent_forms_has_specific_forms_permission', 'yes' );
		update_user_meta( $user_id, '_fluent_forms_allowed_forms', elevation_site_manager_form_ids() ); // [] = none yet
		update_user_meta( $user_id, '_elevation_form_access', 1 );
		return;
	}
	if ( get_user_meta( $user_id, '_elevation_form_access', true ) ) {
		foreach ( ELEVATION_FORM_MANAGER_CAPS as $cap ) {
			$user->remove_cap( $cap );
		}
		foreach ( $meta_keys as $key ) {
			delete_user_meta( $user_id, $key );
		}
	}
}

foreach ( [ 'set_user_role', 'add_user_role', 'remove_user_role', 'user_register' ] as $elevation_hook ) {
	add_action( $elevation_hook, static fn ( $user_id ) => elevation_sync_form_access( (int) $user_id ), 20 );
}

function elevation_form_access_version(): string {
	return md5( wp_json_encode( elevation_site_manager_form_ids() ) . '|' . ELEVATION_ROLES_VERSION );
}

function elevation_sync_all_form_access(): void {
	$ids = array_merge(
		get_users( [ 'role__in' => [ 'site_manager' ], 'fields' => 'ID' ] ),
		get_users( [ 'meta_key' => '_elevation_form_access', 'fields' => 'ID' ] ) // phpcs:ignore WordPress.DB.SlowDBQuery -- a few users.
	);
	foreach ( array_unique( array_map( 'intval', $ids ) ) as $id ) {
		elevation_sync_form_access( $id );
	}
	update_option( 'elevation_form_access_version', elevation_form_access_version(), false );
}
add_action( 'elevation_forms_seeded', 'elevation_sync_all_form_access' );
add_action( 'admin_init', static function () {
	if ( get_option( 'elevation_form_access_version' ) !== elevation_form_access_version() ) {
		elevation_sync_all_form_access();
	}
} );

function elevation_gift_aid_keep_message(): string {
	return __( 'Gift Aid declarations can\'t be deleted: HMRC requires them to be kept for six years after the last gift. To cancel one, add a note to the entry saying "Cancelled" and the date.', 'elevation-core' );
}

add_action( 'fluentform/before_deleting_entries', static function ( $ids, $formId ) {
	if ( 'gift-aid' === elevation_form_key( (int) $formId ) ) {
		throw new \Exception( elevation_gift_aid_keep_message() );
	}
}, 1, 2 );

add_filter( 'fluentform/entry_statuses_for_mutation', static function ( $statuses, $formId = 0 ) {
	if ( 'gift-aid' === elevation_form_key( (int) $formId ) ) {
		unset( $statuses['trashed'] );
	}
	return $statuses;
}, 10, 2 );

add_action( 'fluentform/before_form_delete', static function ( $formId ) {
	if ( 'gift-aid' === elevation_form_key( (int) $formId ) ) {
		throw new \Exception( elevation_gift_aid_keep_message() );
	}
}, 1 );

// "Delete entries after submission" or an auto-delete period switched on for Gift Aid is switched off again
// before the entry is stored, so the declaration is always kept.
add_action( 'fluentform/before_insert_submission', static function ( $insertData, $data, $form ) {
	if ( 'gift-aid' !== elevation_form_key_of( $form ) ) {
		return;
	}
	$helper = \FluentForm\App\Helpers\Helper::class;
	if ( $helper::isEntryAutoDeleteEnabled( $form->id ) ) {
		$settings                               = (array) $helper::getFormMeta( $form->id, 'formSettings', [] );
		$settings['delete_entry_on_submission'] = 'no';
		$helper::setFormMeta( $form->id, 'formSettings', $settings );
	}
	\FluentForm\App\Models\FormMeta::remove( $form->id, 'auto_delete_days' );
}, 1, 3 );
```

Before relying on this, read the Fluent Forms code and adjust the hooks to match. Record what you found in the report:
1. `SubmissionService::handleBulkActions` and `SubmissionController@remove`: confirm both call `deleteEntries()`, which fires `fluentform/before_deleting_entries`, inside a `try/catch` that turns the exception into an error response.
2. `SubmissionService::updateStatus`: confirm it refuses a status missing from `getMutableEntryStatuses()`. If it doesn't check, add a `fluentform/…` status-change guard of your own that throws for `trashed` on Gift Aid.
3. `FormMeta::remove( $formId, $key )`: confirm the method exists with that signature (`app/Models/FormMeta.php`).
4. Where Fluent Forms reads `auto_delete_days` and the form setting "delete entry on submission" (`grep -rn "auto_delete_days\|isEntryAutoDeleteEnabled" app`). If some deletion path doesn't go through `deleteEntries()`, add a guard for it too.

- [ ] **Step 2: Check access with local test users**

Make two throwaway local users. Their passwords are random and never printed:

```bash
wp() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
sm=$(wp user create test-site-manager test-sm@example.com --role=site_manager --user_pass="$(openssl rand -hex 16)" --porcelain | tr -d '\r')
ed=$(wp user create test-editor test-ed@example.com --role=editor --user_pass="$(openssl rand -hex 16)" --porcelain | tr -d '\r')
contact=$(wp elevation forms id contact | tr -d '\r'); prayer=$(wp elevation forms id prayer | tr -d '\r'); giftaid=$(wp elevation forms id gift-aid | tr -d '\r')
./bin/submit-form.sh prayer request='Test prayer' email=test@example.com >/dev/null
./bin/submit-form.sh contact name='Test Visitor' email=test@example.com message='Test' >/dev/null
./bin/submit-form.sh gift-aid first_name=Testy last_name=Tester address_line1='1 Test Road' postcode='M6 6PU' email=test@example.com declaration_accepted=on >/dev/null
```

Then run these checks, printing yes or no only:

1. **Fluent Forms' own permission checks.**

   ```bash
   docker compose run --rm -T wpcli wp --user=test-site-manager eval "
     use FluentForm\App\Modules\Acl\Acl; use FluentForm\App\Services\Manager\FormManagerService as F;
     foreach ( [ 'contact' => $contact, 'prayer' => $prayer, 'gift-aid' => $giftaid ] as \$k => \$id ) {
       printf( \"%s entries_viewer=%s form=%s\n\", \$k, Acl::hasPermission( 'fluentform_entries_viewer', \$id ) ? 'yes' : 'no', F::hasFormPermission( \$id ) ? 'yes' : 'no' );
     }
     echo 'dashboard=', current_user_can( 'fluentform_dashboard_access' ) ? 'yes' : 'no', PHP_EOL;"
   ```

   Expected: `contact … yes yes`, `prayer … no no`, `gift-aid … no no` and `dashboard=yes`. Run it again with `--user=test-editor`. Expected: everything `no`, including `dashboard=no`.
2. **REST as the Site Manager.** `rest_do_request( new WP_REST_Request( 'GET', '/fluentform/v1/submissions' ) )` with `form_id` set to the Prayer, then the Gift Aid, then the Contact ID.
   - Expected: Prayer and Gift Aid are refused (401 or 403), and Contact is 200 with the test entry.
   - Fetching the Prayer entry directly (`GET /fluentform/v1/submissions/<prayer entry id>`) is refused too.
   - Print only status codes and counts.
3. **The entries page by URL** (spec §12: "can't reach the Prayer or Gift Aid entries by URL").
   1. Make short-lived auth and logged-in cookies for the Site Manager with `wp eval 'echo wp_generate_auth_cookie( <id>, time() + 300, "auth" );'` and `…"logged_in"`. Hold them in shell variables and never print them.
   2. Request `http://localhost:8080/wp-admin/admin.php?page=fluent_forms&route=entries&form_id=<id>` with `curl -s -b "wordpress_<COOKIEHASH>=$auth; wordpress_logged_in_<COOKIEHASH>=$li"`. `COOKIEHASH` is `md5( site_url )`; get it with `wp eval 'echo COOKIEHASH;'`.
   3. Grep the body. The Prayer and Gift Aid pages show Fluent Forms' no-permission message and none of the entry app's markup. The Contact page shows the entries app.
   4. `unset` the variables afterwards.
4. **Editors manage content, not forms.** As `test-editor`, run `current_user_can( 'edit_posts' )`, `current_user_can( 'edit_post', <a fixture group ID> )` and `current_user_can( 'publish_posts' )`. Expected: yes to all three. `current_user_can( 'manage_church_settings' )` and `current_user_can( 'fluentform_entries_viewer' )` give no.
5. **Role changes follow.**
   - `wp user set-role test-site-manager editor`: the three Fluent Forms capabilities and the four user meta keys are gone. Check with `wp user meta list test-site-manager --keys=_fluent_forms_has_role,_elevation_form_access`.
   - `wp user set-role test-site-manager site_manager`: they are back.
   - Re-seed the forms with `--force=contact`. The allowed-forms list still holds the seven Site Manager IDs.
6. **Gift Aid can't be deleted, trashed or lost.** As admin, via `rest_do_request`:
   - `DELETE /fluentform/v1/submissions/<gift aid entry id>` returns an error carrying the "can't be deleted" message, and the entry still exists.
   - `POST /fluentform/v1/submissions/bulk-actions` with `action_type=other.delete_permanently` is refused.
   - Setting the status to `trashed` is refused.
   - `DELETE /fluentform/v1/forms/<gift aid form id>` is refused, and the form still exists.
   - Check the route names in `app/Http/Routes/api.php` before calling them.
   - Control: the same delete on the contact entry works.
   - Then set the Gift Aid form's `delete_entry_on_submission` to `yes` with `Helper::setFormMeta` and submit a Gift Aid declaration. The entry is stored, and the setting reads `no` again.
7. **Clean up.**

   ```bash
   wp user delete "$sm" --yes --reassign=1
   wp user delete "$ed" --yes --reassign=1
   docker compose run --rm -T wpcli wp --user=admin elevation forms purge-test-entries
   ./bin/mail.sh clear
   ```

   `purge-test-entries` removes Gift Aid test entries too, because it deletes by SQL, below Fluent Forms' hooks, and only locally.

- [ ] **Step 3: Tests still pass, and commit**

Run: `docker compose run --rm php vendor/bin/phpunit` and `docker compose run --rm node npm run test:js`
Expected: `OK` and `# fail 0`.

```bash
git add wp-content/plugins/elevation-core/includes/forms-access.php wp-content/plugins/elevation-core/elevation-core.php
git commit -m "Site Managers read every form's entries but Prayer and Gift Aid; Gift Aid entries can't be deleted, trashed or auto-deleted

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Rebuild from nothing, the sweep, and the docs

**Files:**
- Modify: `README.md`, `docs/superpowers/plans/2026-09-28-roadmap.md`, `docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the Plan 5 hand-offs, and the spec's revision-5 rows.

- [ ] **Step 1: Rebuild from nothing, twice**

Put the logs in the session scratchpad. Both rebuilds must run on the same London day, because fixture dates are relative.

```bash
S=<scratchpad>
hash() {
  docker compose run --rm -T wpcli wp eval '
    foreach ( get_posts( [ "post_type" => [ "page", "event", "connect_group", "announcement" ], "post_status" => "any", "posts_per_page" => -1, "orderby" => "name", "order" => "ASC" ] ) as $p ) {
      echo $p->post_type, " ", $p->post_name, " ", sha1( $p->post_content . $p->post_excerpt . wp_json_encode( get_post_meta( $p->ID ) ) ), "\n";
    }
    global $wpdb;
    foreach ( $wpdb->get_results( "SELECT m.value AS k, h.value AS h FROM {$wpdb->prefix}fluentform_form_meta m JOIN {$wpdb->prefix}fluentform_form_meta h ON h.form_id = m.form_id AND h.meta_key = \"_elevation_seed_hash\" WHERE m.meta_key = \"_elevation_form_key\" ORDER BY m.value" ) as $r ) {
      echo "form ", $r->k, " ", $r->h, "\n";
    }'
}
docker compose down -v && ./bin/setup.sh > "$S/rebuild-1.log" 2>&1; grep -c "Seed complete." "$S/rebuild-1.log"; hash > "$S/hash-1.txt"
docker compose down -v && ./bin/setup.sh > "$S/rebuild-2.log" 2>&1; grep -c "Seed complete." "$S/rebuild-2.log"; hash > "$S/hash-2.txt"
diff "$S/hash-1.txt" "$S/hash-2.txt" && wc -l < "$S/hash-1.txt"
```

Expected:
- each `grep -c` prints `1`;
- `diff` prints nothing;
- the count is `35`: 15 pages, 7 events, 3 groups, 1 announcement and 9 forms.

If `get_post_meta()` differs between runs only in a value that is legitimately per-install (for example `_edit_lock`), leave that key out of the hash and say so in the report. Don't hide a real difference.

After the second rebuild:
- `./bin/check-urls.sh` passes.
- `./bin/check-tokens.sh / /im-new/ /give/ /contact/ /prayer/ /get-involved/ /connect-groups/ /resources/alpha/` finds no raw tokens.
- The block validator reports no problems.
- `debug.log` is empty. Use the Plan 4 command: `docker compose exec -T wordpress sh -c 'test -s /var/www/html/wp-content/debug.log && tail -20 /var/www/html/wp-content/debug.log || echo "debug.log empty"'`.

- [ ] **Step 2: Every form, once more, in the browser**

In the browser pane at 1440px, fill in and send one form of each kind with test data (`Test Visitor`, `test@example.com`):
- Contact;
- Prayer (urgent);
- Gift Aid (with postcode `m66pu`);
- the footer Newsletter;
- G-Squad;
- Plan a Visit;
- Join Group, from a card's "Ask to join";
- the connect card;
- Alpha.

For each one:
- the success panel replaces the form;
- Mailpit has the right recipient, reply-to and subject (the Global Constraints table), or none for the newsletter;
- no console errors.

At 390px, send Plan a Visit and Join Group again. Then run `purge-test-entries` and `./bin/mail.sh clear`.

- [ ] **Step 3: Consent sweep (spec §12)**

Clear site data for `localhost:8080`. For each of `/contact/`, `/give/`, `/im-new/`, `/get-involved/`, `/connect-groups/` and `/resources/alpha/`, with the announcement fixture switched **on** for this step:
1. Load the page fresh and wait 5 seconds.
2. Read the network list.

Expected: no request to any Google domain (`google`, `gstatic`, `googleapis`, `doubleclick`, `youtube`, `ytimg`, `googletagmanager`). Fluent Forms' scripts, styles and AJAX go only to `localhost:8080`, and the announcement image is served from this site.

Switch the fixture off again afterwards.

- [ ] **Step 4: Accessibility spot checks**

On `/im-new/#plan-a-visit`, `/give/#gift-aid` and `/connect-groups/`:
- Every input has a visible label tied to it: clicking the label focuses the field.
- Required fields carry `aria-required` or `required`.
- Errors are announced: Fluent Forms uses `role="alert"`. Say so if it doesn't.
- Focus rings are visible on every control.
- The colour contrast of error text (`#CC3B3B`) and hints (`grey-500` on white) is AA. Use the antislop contrast tool if available, or compute it.

Lighthouse (≥95 on Home, I'm New and Give) is in Plan 6's full §12 sweep. Note any obvious failures here for it.

- [ ] **Step 5: Docs**

`README.md`: add a `## Forms, groups and announcements` section after `## YouTube`:

```markdown
## Forms, groups and announcements

- The nine church forms are Fluent Forms, created from `seed/forms/*.json` by `bin/seed.sh`
  (`wp elevation forms seed /seed/forms`). Each has a fixed key (`contact`, `prayer`, `gift-aid`, `newsletter`,
  `g-squad`, `plan-a-visit`, `join-group`, `connect-card`, `alpha`); pages place them with the
  `elevation/form` block. Required fields and validation messages live in `src/FormRules.php`.
- A form edited in wp-admin → Fluent Forms is left alone by the seed; `SEED_FORCE="form:contact" ./bin/seed.sh`
  overwrites it.
- Recipients and email wording use settings smartcodes (`{contact.welcomeInbox}`, `{service.startTime}`, …),
  so changing Settings → Church changes the next email.
- Local mail goes to Mailpit at http://localhost:8025. `./bin/submit-form.sh <key> field=value …` sends a form
  like a browser; `./bin/mail.sh` lists what arrived; `wp elevation forms reset-limits` clears the rate limit;
  `wp elevation forms purge-test-entries` removes every entry with an `@example.com` address (local only).
- Connect Groups and Announcements are in the wp-admin menu. Local sample groups and a (switched-off)
  sample announcement come from `seed/fixtures/`; `wp elevation fixtures remove` deletes all fixtures.
```

In the roadmap:
- mark Plan 5 `done: 2026-09-29-plan-5-forms-groups-announcements.md`;
- replace the Plan 5 bullets under "Hand-offs from Plan 2", "Plan 3" and "Plan 4" with "done";
- add this section:

```markdown
## Hand-offs from Plan 5

- **Plan 6 (Go-live):**
  - Entry migration field maps (spec §6.10):
    - FF 3 → `g-squad`: `names`, `email`, `subject` → `phone`; live `message` was labelled "Your home address".
      Decide with the church whether to drop it (data minimisation) or keep it as `message` prefixed
      "Home address (old form): ".
    - FF 4 → `plan-a-visit`: `names`, `email`, `subject` → `phone`, `message` → `notes`, `visit_date` blank.
    - FF 5 → `newsletter`: `email`.
    - FF 7 → `alpha`: same keys.
    - Look up the target form by key (`elevation_form_id()`), never by ID.
  - Before packaging:
    - Run `wp elevation forms purge-test-entries` and `wp elevation fixtures remove`.
    - Check `wp db query "SELECT COUNT(*) FROM wp6d_fluentform_submissions WHERE response LIKE '%@example.com%'"`
      prints 0.
  - On live:
    - Configure FluentSMTP with Resend.
    - Send one of each form and check the real inboxes (welcome, prayer, contact) and a real visitor
      confirmation.
    - Check a Site Manager account sees seven forms' entries and not Prayer or Gift Aid (access syncs by
      itself when the role is given).
  - Parity: switch the announcement fixture on for the local Supabase comparison, then off.
  - Lighthouse a11y ≥95 on Home, I'm New and Give, with the forms in place.
  - Editing guide:
    - forms (edit wording and emails in Fluent Forms; the smartcodes; don't rename field keys);
    - Gift Aid cancellations as a "Cancelled" note, never a delete;
    - Connect Groups: the Group details panel, order = Page Attributes → Order, and the leader email is private;
    - Announcements: one at a time, UK-time dates, "Hide for", and that editing one shows it again.
  - Deferred checks needing a wp-admin sign-in:
    - the Group details and Announcement settings panels (including their save locks);
    - a form edited in the Fluent Forms editor is then skipped by the seed;
    - a Site Manager sees Fluent Forms in the menu with seven forms.
  - `docs/go-live.md`: the rate limit reads `REMOTE_ADDR`; revisit if a CDN or proxy is added (spec §6.10).
```

In the spec:
- Bump the header to "revision 5".
- In §6.10 **Styling**, replace "Sora labels" with "Inter labels (the redesign's `Label`), Sora fieldset and success headings".
- In §6.6, say the taxonomies are `group_area` and `group_category`, that `/connect-groups` is a page holding the directory block, and that the filter parameters are `area`, `type` and `meets`.
- Add `## 17. Forms, groups and announcements (revision 5, Plan 5)`, a table with one row per ruling in this plan's "Rulings made while writing this plan" and the Task 5 rulings, each pointing at the section it changes.

- [ ] **Step 6: Report the new copy for the user's review**

In the task report, list every **(new copy)** string with where it appears:
- the G-Squad heading, lead and form;
- the Plan a Visit section, form and both emails;
- the connect-card section and success message;
- the Join Group section, success message and context lines;
- the `/connect-groups` hero and empty panel;
- the footer newsletter row;
- the Alpha success message;
- the announcement fixture.

Also include the Task 4 screenshots. The controller passes this to the user after the final review.

- [ ] **Step 7: Commit**

```bash
git add README.md docs/superpowers/plans/2026-09-28-roadmap.md docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md
git commit -m "Plan 5 verified: rebuilds, form and consent sweeps, README forms section, roadmap hand-offs, spec revision 5

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
