# Plan 3 — Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff can publish events in wp-admin, and visitors see them on `/events` (cards and a month calendar), on `/events/{slug}` and in the Home "What's on" section, matching the redesign.

**Architecture:** `elevation-core` adds an `event` post type whose dates are London wall-clock strings in post meta. All date rules and wording live in one pure class (`EventTime`) and all field rules in another (`EventFields`); both are unit-tested. Four dynamic blocks render from them: `event-grid`, `home-events`, `event-calendar`, `event-meta`. The theme adds `archive-event` and `single-event` templates plus `assets/css/events.css`. Local-only fixtures come from `seed/fixtures/events.json`, with dates relative to the day of seeding.

**Tech Stack:** WordPress 7.1.2 block theme and plugin, PHP 8.3, PHPUnit 11, `@wordpress/scripts` 36.0.0, `node --test`, WP-CLI, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md` (§6.2 Events; also §5.5, §9, §12). The per-page layout and copy are in `docs/superpowers/specs/2026-09-28-redesign-inventory.md` §1 "Events index" and "Event detail", §2 `event-card.tsx`, `event-calendar.tsx` and `home-events-section.tsx`, and §4 "Events model". The redesign source is `~/Projects.nosync/website` at `e0cf43e`: `src/lib/events.ts`, `src/components/event-*.tsx`, `src/components/home-events-section.tsx` and `src/app/(site)/events/**`.

## Global Constraints

- **Versions and dependencies:** PHP 8.3 and WordPress 7.1.2 (pinned in `bin/versions.lock`). Add no plugins, no Composer packages and no npm packages. `@wordpress/*` imports are externals that `@wordpress/scripts` 36.0.0 already provides.
- **Timezone:** every event date rule uses `Europe/London` explicitly, through `EventTime`. Never use PHP `date()`, `time()`-based formatting or the server's timezone for events. The stored format is a London wall-clock string `Y-m-d\TH:i`, e.g. `2026-10-18T19:00`.
- **"Upcoming" (spec §6.2):** an event is upcoming when (end, or start if there is no end) falls on or after today at 00:00 London time. So a multi-day event already in progress stays upcoming.
- **Wording (spec §6.2):**
  - Time: "Time to be confirmed"; "7:00 pm"; "7:00 pm – 9:30 pm"; only the start time for a multi-day event.
  - Date: "Sunday 5 October 2026".
  - Range: "18 Oct – 20 Oct".
  - Date keys: `Y-m-d`.
  - The dash in ranges is U+2013 with a space on each side.
- **Copy:** use the inventory text verbatim, except that every "Sunday" becomes `{service.day}`. The service time, venue, postcode and Instagram URL use tokens: `{service.startTime}`, `{location.venue}`, `{location.postcode}`, `{location.full}`, `{socials.instagram.url}`. Tokens are replaced at render by the existing `render_block` filter (`includes/bindings.php`).
- **Escaping:** escape every value when it is output: `esc_html`, `esc_attr`, `esc_url`, and `wp_json_encode` for JSON inside attributes. Titles and summaries are plain text; they are never output as HTML.
- **Code conventions:**
  - Blocks are `elevation/<name>` with `apiVersion` 3 and a `render.php`, in `wp-content/plugins/elevation-core/src/blocks/<name>/`.
  - Globals in `render.php` are prefixed `$elevation_`.
  - Pure classes go in `src/` under namespace `Elevation\Core`, with no WordPress calls.
  - WordPress glue goes in `includes/*.php`.
  - `build/` is committed. Rebuild with `docker compose run --rm node npm run build`.
- **Colours:** text-safe green is the `green-700` preset. `green` and `green-600` are for fills only. Focus rings are `2px solid var(--wp--preset--color--green-700)` with a 2px offset (Plan 2 ruling). Motion stops under `prefers-reduced-motion: reduce`.
- **Access:** events use the standard post capabilities (`capability_type` `post`), so Editors and Site Managers manage them (spec §7).
- **Fixtures:** they are local-only. The fixtures command refuses to run unless `wp_get_environment_type()` is `local`, and it never overwrites an event it didn't create.
- **Test commands:**
  - `docker compose run --rm php vendor/bin/phpunit` (plugin PHPUnit).
  - `docker compose run --rm node npm run test:js` (node tests in `tests/js/*.test.cjs`).
  - `./bin/check-urls.sh` and `./bin/check-tokens.sh <paths>`.
  - WP-CLI: `docker compose run --rm -T wpcli wp --user=admin <command>`.
- **Standing rules:**
  - Never read, list or copy anything under `private/`.
  - Never read `import/export.xml`.
  - Never touch `docker-compose.mirror.yml` or the `elevation-mirror` project.
  - Never print or read passwords from `.env`.
  - Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Bad dates or links in the editor:** a missing start, an end before the start, or a `javascript:` or `http://` button link on an event someone is publishing. The publish is refused with a sentence that says what to fix, and drafts still save. Tested in Task 2 (`EventFields` unit tests plus a REST publish attempt).
2. **HTML or entities in a title or summary**, e.g. `Q&A <b>night</b> "late"`. Cards, the calendar's JSON and the detail page show the text literally and never inject markup. Tested in Task 5 (a temporary post, grepped output) and Task 6 (calendar JSON uses `textContent`).
3. **Unpublished events:** drafts, private and scheduled (`future`) events never appear in grids, on Home or in the calendar. Tested in Task 2 (a query check with a draft and a future post).
4. **Visitors in another timezone:** a visitor in New York near London midnight still sees London dates, and "today" is London's today. Tested in Task 6 (`londonDateKey` with a fixed instant).
5. **Missing images:** an event whose featured image was deleted shows the gradient placeholder, not a broken `<img>`. Tested in Task 5 (delete the attachment of a temporary event, grep the card).

---

## File structure

**Plugin `wp-content/plugins/elevation-core/`:**

- **`src/EventTime.php`** (create): pure date rules and wording.
- **`src/EventFields.php`** (create): pure meta sanitising and validation.
- **`src/Fixtures.php`** (create): pure helpers for relative fixture dates and paragraph blocks.
- **`includes/events.php`** (create):
  - post type, meta, `_event_until` upkeep;
  - REST publish validation and admin list column;
  - queries and the `elevation_event()` accessor.
- **`includes/event-render.php`** (create): `elevation_event_card()`, the `hide-if-no-events` group filter and the Getting there maps link.
- **`includes/fixtures-cli.php`** (create): `wp elevation fixtures events|remove`.
- **`includes/editor.php`** (modify): pass the default venue to the editor bundle.
- **`src/editor/index.js`** (modify): import `./event-panel`.
- **`src/editor/event-panel.js`** (create): the "Event details" sidebar panel.
- **`src/blocks/event-grid/`** (create): `block.json`, `index.js`, `render.php`.
- **`src/blocks/home-events/`** (create): `block.json`, `index.js`, `render.php`.
- **`src/blocks/event-calendar/`** (create):
  - `block.json`, `index.js`, `render.php`;
  - `model.js` (pure, CommonJS);
  - `view.js`.
- **`src/blocks/event-meta/`** (create): `block.json`, `index.js`, `render.php`.
- **`src/blocks/icon/block.json`** (modify): add three icon names to the enum.
- **`scripts/build-icons.mjs`** (modify) and `src/Icons.php` (regenerate): add `arrow-left`, `chevron-left`, `chevron-right`.
- **`elevation-core.php`** (modify): require the new files.
- **Tests:**
  - `tests/EventTimeTest.php`, `tests/EventFieldsTest.php`, `tests/FixturesTest.php`;
  - `tests/IconsTest.php` (modify: count 24);
  - `tests/js/event-calendar.test.cjs`.

**Theme `wp-content/themes/elevation/`:**

- `templates/archive-event.html`, `templates/single-event.html` (create).
- `assets/css/events.css` (create); `functions.php` (modify): enqueue it and add it to the editor styles.

**Seed and tools:**

- `seed/fixtures/events.json` (create).
- `seed/media/redesign/events/*.jpg` (create): copied from `~/Projects.nosync/website/public/events/`.
- `seed/pages/home.html` (modify): wrap the "What's on" fallback in `elevation/home-events`.
- `bin/seed.sh` (modify):
  - SmartCrawl event titles;
  - load the fixtures.
- `bin/check-urls.sh` (modify): event URLs.
- `wp-content/mu-plugins/local-dev.php` (modify): the validator also checks the theme's templates.
- `README.md` and `docs/superpowers/plans/2026-09-28-roadmap.md` (modify).

## Rulings made while writing this plan

These are recorded here so the executor doesn't re-open them:

- **Class names:** the spec's `Event_Time` becomes `Elevation\Core\EventTime`, which matches the plugin's naming (`SeedGuard`, `MediaRefs`).
- **No comma in full dates:** a full date is "Sunday 18 October 2026", as the spec writes it. Current ICU (Node 22) formats `en-GB` as "Sunday, 18 October 2026", but the spec is binding.
- **Month abbreviation for September:** it is "Sept". The redesign formats with `Intl` `en-GB`, and CLDR's en-GB short month for September is "Sept"; the others are the usual three letters.
- **Multi-day events in the calendar:** every day from start to end gets a marker, capped at 31 days. The redesign marks only the start day. The spec's "in progress stays upcoming" rule implies that the middle days are "something on".
- **Getting there links:** for an event with its own venue, "Get directions" searches Google Maps for that venue. Without a venue it uses the settings `mapsUrl`. The redesign always used the church's address.
- **Calendar without JavaScript:** the calendar is built in the browser from server-computed date keys. It is `hidden` until its script runs, so visitors without JavaScript see only the event list, never an empty box.
- **"More events":** the detail page's grey "More events" section is removed when no other event is coming up. A `core/group` with class `hide-if-no-events` is dropped if its rendered output contains no event card.
- **Event images:** the redesign's three event images are redesign assets, so they are committed under `seed/media/redesign/events/`, as Plan 2 did for the hero and I'm New images.

---

### Task 1: `EventTime` — London dates and wording

**Files:**
- Create: `wp-content/plugins/elevation-core/src/EventTime.php`
- Create: `wp-content/plugins/elevation-core/tests/EventTimeTest.php`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php` (require the class)

**Interfaces:**
- Consumes: nothing.
- Produces (all `public static`, class `Elevation\Core\EventTime`, constant `TZ = 'Europe/London'`):
  - `parse(string $local): ?\DateTimeImmutable`
  - `todayKey(\DateTimeImmutable $now): string`
  - `dateKey(string $local): string`
  - `untilKey(string $start, string $end): string`
  - `isUpcoming(string $start, string $end, \DateTimeImmutable $now): bool`
  - `isMultiDay(string $start, string $end): bool`
  - `formatTime(string $start, string $end, bool $tbc): string`
  - `formatDate(string $local): string`
  - `formatRange(string $start, string $end): string`
  - `dayNumber(string $local): string`
  - `monthShort(string $local): string`
  - `dayKeys(string $start, string $end, int $cap = 31): list<string>`

  `$end` is `''` when there is no end. Every function returns `''` (or `false`, or `[]`) for an unparseable `$start`.

- [ ] **Step 1: Write the failing test**

Create `tests/EventTimeTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use DateTimeZone;
use Elevation\Core\EventTime;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class EventTimeTest extends TestCase {

	private static function utc( string $iso ): DateTimeImmutable {
		return new DateTimeImmutable( $iso, new DateTimeZone( 'UTC' ) );
	}

	public function test_parse_accepts_only_real_london_wall_clock_times(): void {
		$this->assertSame( '2026-10-18 19:00 Europe/London', EventTime::parse( '2026-10-18T19:00' )?->format( 'Y-m-d H:i e' ) );
		foreach ( [ '', '2026-10-18', '2026-10-18T19:00:00', '2026-02-30T10:00', '2026-10-18T24:00', '2026-10-18T19:60', 'tomorrow', '2026-10-18T19:00Z' ] as $bad ) {
			$this->assertNull( EventTime::parse( $bad ), $bad );
		}
	}

	public function test_today_is_londons_date_not_the_servers(): void {
		// 23:30 UTC on 24 Oct 2026 is 00:30 BST on 25 Oct (the clocks change at 01:00 UTC that night).
		$this->assertSame( '2026-10-25', EventTime::todayKey( self::utc( '2026-10-24T23:30:00' ) ) );
		// In winter (GMT) London and UTC agree.
		$this->assertSame( '2026-12-01', EventTime::todayKey( self::utc( '2026-12-01T23:30:00' ) ) );
		// 00:30 BST on 1 Jun is still 31 May in UTC.
		$this->assertSame( '2026-06-01', EventTime::todayKey( self::utc( '2026-05-31T23:30:00' ) ) );
	}

	public function test_upcoming_uses_the_london_midnight_boundary(): void {
		$justAfterLondonMidnight = self::utc( '2026-06-30T23:05:00' ); // 00:05 BST, 1 July
		$this->assertFalse( EventTime::isUpcoming( '2026-06-30T19:00', '2026-06-30T21:00', $justAfterLondonMidnight ), 'finished last night' );
		$this->assertTrue( EventTime::isUpcoming( '2026-07-01T19:00', '', $justAfterLondonMidnight ), 'tonight' );
		$lateSameDay = self::utc( '2026-06-30T22:55:00' ); // 23:55 BST, 30 June
		$this->assertTrue( EventTime::isUpcoming( '2026-06-30T19:00', '2026-06-30T21:00', $lateSameDay ), 'earlier today still counts all day' );
	}

	public function test_multi_day_event_in_progress_stays_upcoming(): void {
		$now = self::utc( '2026-10-19T12:00:00' );
		$this->assertTrue( EventTime::isUpcoming( '2026-10-18T10:00', '2026-10-20T16:00', $now ) );
		$this->assertFalse( EventTime::isUpcoming( '2026-10-16T10:00', '2026-10-18T16:00', $now ) );
		$this->assertSame( '2026-10-20', EventTime::untilKey( '2026-10-18T10:00', '2026-10-20T16:00' ) );
		$this->assertSame( '2026-10-18', EventTime::untilKey( '2026-10-18T10:00', '' ) );
	}

	/** @return array<string, array{string, string, bool, string}> */
	public static function times(): array {
		return [
			'start only'            => [ '2026-10-18T19:00', '', false, '7:00 pm' ],
			'same-day range'        => [ '2026-10-18T19:00', '2026-10-18T21:30', false, "7:00 pm \u{2013} 9:30 pm" ],
			'end equals start'      => [ '2026-10-18T19:00', '2026-10-18T19:00', false, '7:00 pm' ],
			'morning and noon'      => [ '2026-10-18T09:05', '2026-10-18T12:00', false, "9:05 am \u{2013} 12:00 pm" ],
			'multi-day: start only' => [ '2026-10-18T10:00', '2026-10-20T16:00', false, '10:00 am' ],
			'TBC wins'              => [ '2026-10-18T12:00', '2026-10-18T14:00', true, 'Time to be confirmed' ],
			'unparseable'           => [ 'soon', '', false, '' ],
		];
	}

	#[DataProvider( 'times' )]
	public function test_format_time( string $start, string $end, bool $tbc, string $expected ): void {
		$this->assertSame( $expected, EventTime::formatTime( $start, $end, $tbc ) );
	}

	public function test_dates_and_ranges(): void {
		$this->assertSame( 'Monday 5 October 2026', EventTime::formatDate( '2026-10-05T10:30' ) ); // no comma after the weekday (spec §6.2)
		$this->assertSame( "18 Oct \u{2013} 20 Oct", EventTime::formatRange( '2026-10-18T10:00', '2026-10-20T16:00' ) );
		$this->assertSame( "30 Sept \u{2013} 2 Oct", EventTime::formatRange( '2026-09-30T10:00', '2026-10-02T16:00' ) );
		$this->assertSame( 'Sunday 18 October 2026', EventTime::formatRange( '2026-10-18T10:00', '2026-10-18T16:00' ) );
		$this->assertTrue( EventTime::isMultiDay( '2026-10-18T22:00', '2026-10-19T01:00' ) );
		$this->assertFalse( EventTime::isMultiDay( '2026-10-18T10:00', '' ) );
		$this->assertSame( [ '18', 'Oct' ], [ EventTime::dayNumber( '2026-10-18T19:00' ), EventTime::monthShort( '2026-10-18T19:00' ) ] );
		$this->assertSame( [ '7', 'Sept' ], [ EventTime::dayNumber( '2026-09-07T19:00' ), EventTime::monthShort( '2026-09-07T19:00' ) ] );
		$this->assertSame( '2026-10-18', EventTime::dateKey( '2026-10-18T19:00' ) );
		$this->assertSame( '', EventTime::dateKey( 'nope' ) );
	}

	public function test_day_keys_cover_every_day_up_to_the_cap(): void {
		$this->assertSame( [ '2026-10-18' ], EventTime::dayKeys( '2026-10-18T19:00', '' ) );
		$this->assertSame( [ '2026-10-31', '2026-11-01', '2026-11-02' ], EventTime::dayKeys( '2026-10-31T10:00', '2026-11-02T12:00' ) );
		$this->assertCount( 31, EventTime::dayKeys( '2026-01-01T10:00', '2026-12-31T10:00' ) );
		$this->assertSame( [ '2026-10-18' ], EventTime::dayKeys( '2026-10-18T19:00', '2026-10-17T10:00' ), 'end before start' );
		$this->assertSame( [], EventTime::dayKeys( 'nope', '' ) );
	}
}
```

The spec's example "Sunday 5 October 2026" only shows the format. 5 October 2026 is really a Monday, and 18 October 2026 is a Sunday.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `docker compose run --rm php vendor/bin/phpunit --filter EventTimeTest`
Expected: an error that class `Elevation\Core\EventTime` is not found.

- [ ] **Step 3: Implement**

Create `src/EventTime.php`:

```php
<?php
namespace Elevation\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Event dates and their wording, always in Europe/London (spec §6.2). Pure — no WordPress calls.
 *
 * Times are stored as London wall-clock strings "Y-m-d\TH:i" (what the editor's date picker gives), so a
 * stored 19:00 means 7pm in London whatever the server's timezone. String order is time order.
 */
final class EventTime {

	public const TZ = 'Europe/London';

	/** en-GB short months as the redesign's Intl formatting prints them (CLDR: "Sept"). */
	private const MONTHS_SHORT = [ 1 => 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ];

	public static function parse( string $local ): ?DateTimeImmutable {
		if ( ! preg_match( '/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/', $local, $m ) ) {
			return null;
		}
		if ( ! checkdate( (int) $m[2], (int) $m[3], (int) $m[1] ) || (int) $m[4] > 23 || (int) $m[5] > 59 ) {
			return null;
		}
		return new DateTimeImmutable( $local, new DateTimeZone( self::TZ ) );
	}

	public static function todayKey( DateTimeImmutable $now ): string {
		return $now->setTimezone( new DateTimeZone( self::TZ ) )->format( 'Y-m-d' );
	}

	public static function dateKey( string $local ): string {
		return null === self::parse( $local ) ? '' : substr( $local, 0, 10 );
	}

	/** The last day the event is on: the end's date, or the start's when there is no end. */
	public static function untilKey( string $start, string $end ): string {
		$startKey = self::dateKey( $start );
		$endKey   = self::dateKey( $end );
		return ( '' !== $endKey && $endKey > $startKey ) ? $endKey : $startKey;
	}

	public static function isUpcoming( string $start, string $end, DateTimeImmutable $now ): bool {
		$until = self::untilKey( $start, $end );
		return '' !== $until && $until >= self::todayKey( $now );
	}

	public static function isMultiDay( string $start, string $end ): bool {
		$endKey = self::dateKey( $end );
		return '' !== $endKey && '' !== self::dateKey( $start ) && $endKey !== self::dateKey( $start );
	}

	public static function formatTime( string $start, string $end, bool $tbc ): string {
		$from = self::parse( $start );
		if ( null === $from ) {
			return '';
		}
		if ( $tbc ) {
			return 'Time to be confirmed';
		}
		$first = $from->format( 'g:i a' );
		$to    = self::parse( $end );
		if ( null === $to || $end === $start || self::isMultiDay( $start, $end ) ) {
			return $first;
		}
		return $first . " \u{2013} " . $to->format( 'g:i a' );
	}

	public static function formatDate( string $local ): string {
		return self::parse( $local )?->format( 'l j F Y' ) ?? '';
	}

	/** "18 Oct – 20 Oct" for a multi-day event; otherwise the full date. */
	public static function formatRange( string $start, string $end ): string {
		if ( ! self::isMultiDay( $start, $end ) ) {
			return self::formatDate( $start );
		}
		return self::dayNumber( $start ) . ' ' . self::monthShort( $start ) . " \u{2013} " . self::dayNumber( $end ) . ' ' . self::monthShort( $end );
	}

	public static function dayNumber( string $local ): string {
		return self::parse( $local )?->format( 'j' ) ?? '';
	}

	public static function monthShort( string $local ): string {
		$date = self::parse( $local );
		return null === $date ? '' : self::MONTHS_SHORT[ (int) $date->format( 'n' ) ];
	}

	/** @return list<string> Every date the event is on, start first, at most $cap of them. */
	public static function dayKeys( string $start, string $end, int $cap = 31 ): array {
		$first = self::dateKey( $start );
		if ( '' === $first ) {
			return [];
		}
		$last = self::untilKey( $start, $end );
		$keys = [];
		$day  = new DateTimeImmutable( $first . 'T12:00', new DateTimeZone( self::TZ ) );
		while ( count( $keys ) < $cap && $day->format( 'Y-m-d' ) <= $last ) {
			$keys[] = $day->format( 'Y-m-d' );
			$day    = $day->modify( '+1 day' );
		}
		return $keys;
	}
}
```

In `elevation-core.php`, after `require_once ELEVATION_CORE_DIR . 'src/EmbedGate.php';`, add:

```php
require_once ELEVATION_CORE_DIR . 'src/EventTime.php';
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK`, with 62 + 7 test methods (plus the data-provider cases) and no failures.

- [ ] **Step 5: Commit**

```bash
git add wp-content/plugins/elevation-core/src/EventTime.php wp-content/plugins/elevation-core/tests/EventTimeTest.php wp-content/plugins/elevation-core/elevation-core.php
git commit -m "EventTime: London event dates, upcoming rule and wording (spec §6.2)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The `event` post type, its fields and queries

**Files:**
- Create: `wp-content/plugins/elevation-core/src/EventFields.php`
- Create: `wp-content/plugins/elevation-core/tests/EventFieldsTest.php`
- Create: `wp-content/plugins/elevation-core/includes/events.php`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`

**Interfaces:**
- Consumes: `EventTime::untilKey()`, `EventTime::todayKey()`, `EventTime::parse()` (Task 1).
- Produces:
  - **Post type `event`:** archive `/events/`, singles `/events/{slug}/`.
  - **Meta, registered with `show_in_rest`:**
    - `event_start`, `event_end` (strings, `Y-m-d\TH:i` or `''`)
    - `event_time_tbc` (boolean)
    - `event_venue`, `event_cta_label`, `event_cta_url` (strings)
    - `_event_until` (protected, derived `Y-m-d`)
  - **`EventFields`** (`public static`):
    - `normaliseDateTime(mixed $value): string`
    - `normaliseCtaUrl(mixed $value): string`
    - `errors(array $raw, bool $publishing): list<string>`, where `$raw` has keys `start`, `end` and `cta_url`
  - **Functions:**
    - `elevation_upcoming_events(int $limit, int $exclude = 0): list<WP_Post>`
    - `elevation_calendar_events(): list<WP_Post>`
    - `elevation_event(WP_Post $post): array{id:int,title:string,url:string,summary:string,start:string,end:string,tbc:bool,venue:string,cta_label:string,cta_url:string,image:int}`
    - `elevation_event_sync_until(int $post_id): void`

- [ ] **Step 1: Write the failing test**

Create `tests/EventFieldsTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\EventFields;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class EventFieldsTest extends TestCase {

	public function test_date_times_are_normalised_to_minutes(): void {
		$this->assertSame( '2026-10-18T19:00', EventFields::normaliseDateTime( '2026-10-18T19:00:00' ) ); // the date picker's format
		$this->assertSame( '2026-10-18T19:00', EventFields::normaliseDateTime( ' 2026-10-18 19:00 ' ) );
		$this->assertSame( '2026-10-18T19:00', EventFields::normaliseDateTime( '2026-10-18T19:00' ) );
		foreach ( [ '', null, 42, [], '2026-10-18', '2026-13-01T10:00', '18/10/2026 19:00', '2026-10-18T19:00Z' ] as $bad ) {
			$this->assertSame( '', EventFields::normaliseDateTime( $bad ) );
		}
	}

	/** @return array<string, array{mixed, string}> */
	public static function urls(): array {
		return [
			'site path'           => [ '/contact', '/contact' ],
			'path with anchor'    => [ '/im-new#plan-a-visit', '/im-new#plan-a-visit' ],
			'https'               => [ ' https://www.eventbrite.co.uk/e/123 ', 'https://www.eventbrite.co.uk/e/123' ],
			'http'                => [ 'http://example.org', '' ],
			'protocol-relative'   => [ '//evil.example/x', '' ],
			'javascript'          => [ 'javascript:alert(1)', '' ],
			'backslash trick'     => [ '/\\evil.example', '' ],
			'credentials in host' => [ 'https://user@evil.example', '' ],
			'bare word'           => [ 'contact', '' ],
			'not a string'        => [ [ '/x' ], '' ],
		];
	}

	#[DataProvider( 'urls' )]
	public function test_cta_urls_must_be_https_or_a_site_path( mixed $in, string $out ): void {
		$this->assertSame( $out, EventFields::normaliseCtaUrl( $in ) );
	}

	public function test_a_valid_event_has_no_errors(): void {
		$this->assertSame( [], EventFields::errors( [ 'start' => '2026-10-18T19:00:00', 'end' => '2026-10-20T16:00', 'cta_url' => '/contact' ], true ) );
		$this->assertSame( [], EventFields::errors( [ 'start' => '2026-10-18T19:00', 'end' => '2026-10-18T19:00' ], true ), 'end may equal start' );
	}

	public function test_start_is_required_only_to_publish(): void {
		$this->assertSame( [], EventFields::errors( [ 'start' => '' ], false ) );
		$this->assertSame( [ 'An event needs a start date and time before it can be published.' ], EventFields::errors( [ 'start' => '' ], true ) );
	}

	public function test_each_problem_is_named(): void {
		$this->assertSame(
			[
				"The start date and time aren't valid.",
				'The button link must start with https:// or with / for a page on this site.',
			],
			EventFields::errors( [ 'start' => 'next week', 'cta_url' => 'javascript:alert(1)' ], false )
		);
		$this->assertSame( [ 'The end must be the same as or after the start.' ], EventFields::errors( [ 'start' => '2026-10-18T19:00', 'end' => '2026-10-18T18:59' ], false ) );
		$this->assertSame( [ "The end date and time aren't valid." ], EventFields::errors( [ 'start' => '2026-10-18T19:00', 'end' => '2026-02-30T10:00' ], false ) );
	}
}
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `docker compose run --rm php vendor/bin/phpunit --filter EventFieldsTest`
Expected: an error that class `Elevation\Core\EventFields` is not found.

- [ ] **Step 3: Implement `EventFields`**

Create `src/EventFields.php`:

```php
<?php
namespace Elevation\Core;

/**
 * Rules for an event's fields (spec §6.2): used to sanitise stored meta and to refuse a publish whose
 * dates or button link are wrong. Pure — no WordPress calls.
 */
final class EventFields {

	/** "2026-10-18T19:00", "…T19:00:00" (the editor's date picker) or "2026-10-18 19:00" → "2026-10-18T19:00"; else "". */
	public static function normaliseDateTime( mixed $value ): string {
		if ( ! is_string( $value ) || ! preg_match( '/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/', trim( $value ), $m ) ) {
			return '';
		}
		$local = $m[1] . 'T' . $m[2];
		return null === EventTime::parse( $local ) ? '' : $local;
	}

	/** An https:// URL or a path on this site ("/contact"); anything else becomes "". */
	public static function normaliseCtaUrl( mixed $value ): string {
		$url = is_string( $value ) ? trim( $value ) : '';
		if ( '' === $url || str_contains( $url, '\\' ) || preg_match( '/\s/', $url ) ) {
			return '';
		}
		if ( str_starts_with( $url, '/' ) && ! str_starts_with( $url, '//' ) ) {
			return $url;
		}
		return preg_match( '#^https://[a-z0-9.-]+(?::\d+)?(?:[/?\#].*)?$#i', $url ) ? $url : '';
	}

	/**
	 * @param array{start?:mixed, end?:mixed, cta_url?:mixed} $raw Values as submitted, before sanitising.
	 * @return list<string> Sentences for the editor, in field order.
	 */
	public static function errors( array $raw, bool $publishing ): array {
		$errors   = [];
		$startRaw = is_string( $raw['start'] ?? null ) ? trim( $raw['start'] ) : '';
		$endRaw   = is_string( $raw['end'] ?? null ) ? trim( $raw['end'] ) : '';
		$ctaRaw   = is_string( $raw['cta_url'] ?? null ) ? trim( $raw['cta_url'] ) : '';
		$start    = self::normaliseDateTime( $startRaw );
		$end      = self::normaliseDateTime( $endRaw );

		if ( '' !== $startRaw && '' === $start ) {
			$errors[] = "The start date and time aren't valid.";
		} elseif ( '' === $start && $publishing ) {
			$errors[] = 'An event needs a start date and time before it can be published.';
		}
		if ( '' !== $endRaw && '' === $end ) {
			$errors[] = "The end date and time aren't valid.";
		} elseif ( '' !== $start && '' !== $end && $end < $start ) {
			$errors[] = 'The end must be the same as or after the start.';
		}
		if ( '' !== $ctaRaw && '' === self::normaliseCtaUrl( $ctaRaw ) ) {
			$errors[] = 'The button link must start with https:// or with / for a page on this site.';
		}
		return $errors;
	}
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `docker compose run --rm php vendor/bin/phpunit --filter EventFieldsTest`
Expected: `OK`.

- [ ] **Step 5: Register the post type, meta, validation and queries**

Create `includes/events.php`:

```php
<?php
/** The event post type (spec §6.2): fields, publish validation, the upcoming query and a data accessor. */
use Elevation\Core\EventFields;
use Elevation\Core\EventTime;

defined( 'ABSPATH' ) || exit;

const ELEVATION_EVENT_META = [
	'event_start'     => 'string',
	'event_end'       => 'string',
	'event_time_tbc'  => 'boolean',
	'event_venue'     => 'string',
	'event_cta_label' => 'string',
	'event_cta_url'   => 'string',
];

add_action( 'init', function () {
	register_post_type( 'event', [
		'labels'        => [
			'name'               => __( 'Events', 'elevation-core' ),
			'singular_name'      => __( 'Event', 'elevation-core' ),
			'add_new_item'       => __( 'Add new event', 'elevation-core' ),
			'edit_item'          => __( 'Edit event', 'elevation-core' ),
			'new_item'           => __( 'New event', 'elevation-core' ),
			'view_item'          => __( 'View event', 'elevation-core' ),
			'view_items'         => __( 'View events', 'elevation-core' ),
			'search_items'       => __( 'Search events', 'elevation-core' ),
			'not_found'          => __( 'No events found.', 'elevation-core' ),
			'not_found_in_trash' => __( 'No events found in Trash.', 'elevation-core' ),
			'all_items'          => __( 'All events', 'elevation-core' ),
			'archives'           => __( 'Events', 'elevation-core' ),
			'menu_name'          => __( 'Events', 'elevation-core' ),
		],
		'public'        => true,
		'show_in_rest'  => true,
		'menu_icon'     => 'dashicons-calendar-alt',
		'menu_position' => 21,
		'has_archive'   => 'events',
		'rewrite'       => [ 'slug' => 'events', 'with_front' => false ],
		'supports'      => [ 'title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'custom-fields' ],
		'map_meta_cap'  => true,
		'capability_type' => 'post',
	] );

	$sanitisers = [
		'event_start'     => [ EventFields::class, 'normaliseDateTime' ],
		'event_end'       => [ EventFields::class, 'normaliseDateTime' ],
		'event_time_tbc'  => 'rest_sanitize_boolean',
		'event_venue'     => 'sanitize_text_field',
		'event_cta_label' => 'sanitize_text_field',
		'event_cta_url'   => [ EventFields::class, 'normaliseCtaUrl' ],
	];
	foreach ( ELEVATION_EVENT_META as $key => $type ) {
		register_post_meta( 'event', $key, [
			'type'              => $type,
			'single'            => true,
			'default'           => 'boolean' === $type ? false : '',
			'show_in_rest'      => true,
			'sanitize_callback' => $sanitisers[ $key ],
			'auth_callback'     => fn ( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', (int) $post_id ),
		] );
	}
} );

/** Keep _event_until (the last London date the event is on) in step with the dates, however they're saved. */
function elevation_event_sync_until( int $post_id ): void {
	if ( 'event' !== get_post_type( $post_id ) ) {
		return;
	}
	$start = (string) get_post_meta( $post_id, 'event_start', true );
	$until = EventTime::untilKey( $start, (string) get_post_meta( $post_id, 'event_end', true ) );
	'' === $until ? delete_post_meta( $post_id, '_event_until' ) : update_post_meta( $post_id, '_event_until', $until );
}
foreach ( [ 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ] as $elevation_hook ) {
	add_action( $elevation_hook, function ( $meta_id, $object_id, $meta_key ) {
		if ( in_array( $meta_key, [ 'event_start', 'event_end' ], true ) ) {
			elevation_event_sync_until( (int) $object_id );
		}
	}, 10, 3 );
}
unset( $elevation_hook );

// Refuse to publish (or schedule) an event whose dates or link are wrong; drafts save regardless of a missing start.
add_filter( 'rest_pre_insert_event', function ( $prepared, WP_REST_Request $request ) {
	$id     = (int) ( $prepared->ID ?? 0 );
	$meta   = is_array( $request['meta'] ?? null ) ? $request['meta'] : [];
	$value  = fn ( string $key ) => array_key_exists( $key, $meta ) ? $meta[ $key ] : ( $id ? get_post_meta( $id, $key, true ) : '' );
	$status = $prepared->post_status ?? ( $id ? get_post_status( $id ) : 'draft' );
	$errors = EventFields::errors(
		[ 'start' => $value( 'event_start' ), 'end' => $value( 'event_end' ), 'cta_url' => $value( 'event_cta_url' ) ],
		in_array( $status, [ 'publish', 'future' ], true )
	);
	return $errors ? new WP_Error( 'elevation_event_invalid', implode( ' ', $errors ), [ 'status' => 400 ] ) : $prepared;
}, 10, 2 );

// wp-admin list: a sortable "Starts" column, so staff can see what's on when.
add_filter( 'manage_event_posts_columns', function ( array $columns ): array {
	$out = [];
	foreach ( $columns as $key => $label ) {
		$out[ $key ] = $label;
		if ( 'title' === $key ) {
			$out['event_start'] = __( 'Starts', 'elevation-core' );
		}
	}
	return $out;
} );
add_action( 'manage_event_posts_custom_column', function ( string $column, int $post_id ) {
	if ( 'event_start' !== $column ) {
		return;
	}
	$start = (string) get_post_meta( $post_id, 'event_start', true );
	$tbc   = (bool) get_post_meta( $post_id, 'event_time_tbc', true );
	echo '' === $start ? '—' : esc_html( EventTime::formatDate( $start ) . ', ' . EventTime::formatTime( $start, '', $tbc ) );
}, 10, 2 );
add_filter( 'manage_edit-event_sortable_columns', fn ( array $columns ): array => $columns + [ 'event_start' => 'event_start' ] );
add_action( 'pre_get_posts', function ( WP_Query $query ) {
	if ( is_admin() && $query->is_main_query() && 'event_start' === $query->get( 'orderby' ) ) {
		$query->set( 'meta_key', 'event_start' );
		$query->set( 'orderby', 'meta_value' );
	}
} );

/** @return list<WP_Post> Published events that haven't finished (London time), soonest first. */
function elevation_upcoming_events( int $limit, int $exclude = 0 ): array {
	return get_posts( [
		'post_type'        => 'event',
		'post_status'      => 'publish',
		'posts_per_page'   => max( 1, $limit ),
		'post__not_in'     => $exclude ? [ $exclude ] : [],
		'meta_query'       => [
			'until' => [ 'key' => '_event_until', 'value' => EventTime::todayKey( new DateTimeImmutable( 'now' ) ), 'compare' => '>=', 'type' => 'CHAR' ],
			'start' => [ 'key' => 'event_start', 'compare' => 'EXISTS' ],
		],
		'orderby'          => [ 'start' => 'ASC', 'title' => 'ASC' ],
		'no_found_rows'    => true,
		'suppress_filters' => false,
	] );
}

/** @return list<WP_Post> Every published event with a start, past and future — for the calendar. */
function elevation_calendar_events(): array {
	return get_posts( [
		'post_type'      => 'event',
		'post_status'    => 'publish',
		'posts_per_page' => 500,
		'meta_query'     => [ 'has_until' => [ 'key' => '_event_until', 'compare' => 'EXISTS' ], 'start' => [ 'key' => 'event_start', 'compare' => 'EXISTS' ] ],
		'orderby'        => [ 'start' => 'ASC', 'title' => 'ASC' ],
		'no_found_rows'  => true,
	] );
}

/**
 * An event's fields as plain text (never HTML), for renderers.
 *
 * @return array{id:int,title:string,url:string,summary:string,start:string,end:string,tbc:bool,venue:string,cta_label:string,cta_url:string,image:int}
 */
function elevation_event( WP_Post $post ): array {
	$text = fn ( string $value ): string => trim( html_entity_decode( wp_strip_all_tags( $value ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	return [
		'id'        => $post->ID,
		'title'     => $text( get_the_title( $post ) ),
		'url'       => (string) get_permalink( $post ),
		'summary'   => $text( $post->post_excerpt ),
		'start'     => (string) get_post_meta( $post->ID, 'event_start', true ),
		'end'       => (string) get_post_meta( $post->ID, 'event_end', true ),
		'tbc'       => (bool) get_post_meta( $post->ID, 'event_time_tbc', true ),
		'venue'     => (string) get_post_meta( $post->ID, 'event_venue', true ),
		'cta_label' => (string) get_post_meta( $post->ID, 'event_cta_label', true ),
		'cta_url'   => (string) get_post_meta( $post->ID, 'event_cta_url', true ),
		'image'     => (int) get_post_thumbnail_id( $post ),
	];
}
```

In `elevation-core.php`, add `require_once ELEVATION_CORE_DIR . 'src/EventFields.php';` after the `EventTime` line. Add `require_once ELEVATION_CORE_DIR . 'includes/events.php';` after `includes/editor.php`.

- [ ] **Step 6: Flush rewrites and check the archive and a draft-safe query**

Run:

```bash
docker compose run --rm -T wpcli wp rewrite flush --hard
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/events/
```

Expected: `200`. The theme has no archive template yet, so the page may look plain.

Then check the query rules (Review Focus 3) and the derived key with temporary posts:

```bash
docker compose run --rm -T wpcli wp --user=admin eval '
$d = gmdate( "Y-m-d", time() + 5 * DAY_IN_SECONDS ) . "T19:00";
$mk = fn( $s, $status ) => wp_insert_post( [ "post_type" => "event", "post_title" => "Probe $s", "post_status" => $status, "post_date" => $status === "future" ? gmdate( "Y-m-d H:i:s", time() + DAY_IN_SECONDS ) : "", "meta_input" => [ "event_start" => $d ] ] );
$ids = [ $mk( "pub", "publish" ), $mk( "draft", "draft" ), $mk( "future", "future" ), $mk( "private", "private" ) ];
echo "until: ", get_post_meta( $ids[0], "_event_until", true ), "\n";
echo "upcoming: ", implode( ",", wp_list_pluck( elevation_upcoming_events( 50 ), "post_title" ) ), "\n";
echo "calendar: ", implode( ",", wp_list_pluck( elevation_calendar_events(), "post_title" ) ), "\n";
foreach ( $ids as $id ) wp_delete_post( $id, true );'
```

Expected: the `until:` line prints the date part of `$d`. The `upcoming:` and `calendar:` lines each list only `Probe pub`.

- [ ] **Step 7: Check REST publish validation (Review Focus 1)**

Run:

```bash
docker compose run --rm -T wpcli wp --user=admin eval '
$try = function ( array $body ) { $r = new WP_REST_Request( "POST", "/wp/v2/event" ); $r->set_body_params( $body ); $res = rest_do_request( $r ); echo $res->get_status(), " ", $res->is_error() ? $res->as_error()->get_error_message() : "ok", "\n"; if ( ! $res->is_error() ) wp_delete_post( $res->get_data()["id"], true ); };
$try( [ "title" => "No start", "status" => "draft" ] );
$try( [ "title" => "No start", "status" => "publish" ] );
$try( [ "title" => "Backwards", "status" => "publish", "meta" => [ "event_start" => "2026-10-18T19:00:00", "event_end" => "2026-10-18T18:00:00" ] ] );
$try( [ "title" => "Bad link", "status" => "publish", "meta" => [ "event_start" => "2026-10-18T19:00:00", "event_cta_url" => "javascript:alert(1)" ] ] );
$try( [ "title" => "Good", "status" => "publish", "meta" => [ "event_start" => "2026-10-18T19:00:00", "event_cta_url" => "/contact" ] ] );'
```

Expected, line by line:

```
201 ok
400 An event needs a start date and time before it can be published.
400 The end must be the same as or after the start.
400 The button link must start with https:// or with / for a page on this site.
201 ok
```

Also check that Editors get the standard capabilities:

```bash
docker compose run --rm -T wpcli wp eval 'echo get_post_type_object( "event" )->cap->edit_posts, " ", get_role( "editor" )->has_cap( "publish_posts" ) ? "yes" : "no", " ", get_role( "site_manager" )->has_cap( "publish_posts" ) ? "yes" : "no", "\n";'
```

Expected: `edit_posts yes yes`.

- [ ] **Step 8: Run all tests and commit**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK`.

```bash
git add wp-content/plugins/elevation-core/src/EventFields.php wp-content/plugins/elevation-core/tests/EventFieldsTest.php wp-content/plugins/elevation-core/includes/events.php wp-content/plugins/elevation-core/elevation-core.php
git commit -m "Event post type: London date fields, publish validation, upcoming and calendar queries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: "Event details" editor panel

**Files:**
- Create: `wp-content/plugins/elevation-core/src/editor/event-panel.js`
- Modify: `wp-content/plugins/elevation-core/src/editor/index.js` (import the panel)
- Modify: `wp-content/plugins/elevation-core/includes/editor.php` (pass the default venue)
- Rebuild: `wp-content/plugins/elevation-core/build/editor/*`

**Interfaces:**
- Consumes: the meta keys from Task 2 (`event_start`, `event_end`, `event_time_tbc`, `event_venue`, `event_cta_label`, `event_cta_url`) and the server errors from `rest_pre_insert_event`.
- Produces: `window.elevationEventDefaults = { venue: string }`, set before `elevation-editor` runs.

- [ ] **Step 1: Pass the default venue to the editor**

In `includes/editor.php`, inside the `enqueue_block_editor_assets` callback, after the existing `wp_add_inline_script( … elevationTokens … )` line, add:

```php
	wp_add_inline_script( 'elevation-editor', 'window.elevationEventDefaults = ' . wp_json_encode( [ 'venue' => (string) elevation_setting( 'location.full' ) ] ) . ';', 'before' );
```

- [ ] **Step 2: Write the panel**

Create `src/editor/event-panel.js`:

```js
/**
 * "Event details" in the event editor's sidebar: when it starts and ends, whether the time is still
 * to be confirmed, where it is, and an optional button. The server refuses a publish with a missing
 * start, an end before the start or a bad link (includes/events.php); this panel says so first.
 */
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel, store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
import { BaseControl, Button, DateTimePicker, Dropdown, Notice, TextControl, ToggleControl } from '@wordpress/components';

const LOCK = 'elevation-event-details';
const DEFAULT_VENUE = ( window.elevationEventDefaults || {} ).venue || '';
const toMinutes = ( value ) => ( value ? String( value ).slice( 0, 16 ) : '' );
const okUrl = ( url ) => url === '' || ( /^\/(?!\/)/.test( url ) && ! url.includes( '\\' ) ) || /^https:\/\/[a-z0-9.-]+(:\d+)?([/?#]\S*)?$/i.test( url );
const label = ( value ) =>
	value
		? new Intl.DateTimeFormat( 'en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' } ).format( new Date( `${ value }:00Z` ) )
		: 'Not set';

function WhenControl( { title, value, onChange, allowClear } ) {
	return (
		<BaseControl label={ title } __nextHasNoMarginBottom>
			<Dropdown
				popoverProps={ { placement: 'left-start' } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button variant="secondary" onClick={ onToggle } aria-expanded={ isOpen } style={ { display: 'block', width: '100%', textAlign: 'left' } }>
						{ label( value ) }
					</Button>
				) }
				renderContent={ () => (
					<div style={ { padding: 8 } }>
						<DateTimePicker currentDate={ value || null } onChange={ ( next ) => onChange( toMinutes( next ) ) } is12Hour />
						{ allowClear && value && (
							<Button variant="link" isDestructive onClick={ () => onChange( '' ) }>
								Remove end
							</Button>
						) }
					</div>
				) }
			/>
		</BaseControl>
	);
}

function EventDetailsPanel() {
	const postType = useSelect( ( select ) => select( editorStore ).getCurrentPostType(), [] );
	const [ meta, setMeta ] = useEntityProp( 'postType', 'event', 'meta' );
	const { lockPostSaving, unlockPostSaving } = useDispatch( editorStore );
	const m = meta || {};
	const set = ( key ) => ( value ) => setMeta( { ...m, [ key ]: value } );

	const start = toMinutes( m.event_start );
	const end = toMinutes( m.event_end );
	const url = ( m.event_cta_url || '' ).trim();
	const problems = [];
	if ( start && end && end < start ) {
		problems.push( 'The end must be the same as or after the start.' );
	}
	if ( ! okUrl( url ) ) {
		problems.push( 'The button link must start with https:// or with / for a page on this site.' );
	}
	const blocked = problems.length > 0;

	useEffect( () => {
		if ( 'event' !== postType ) {
			return undefined;
		}
		blocked ? lockPostSaving( LOCK ) : unlockPostSaving( LOCK );
		return () => unlockPostSaving( LOCK );
	}, [ postType, blocked ] );

	if ( 'event' !== postType ) {
		return null;
	}
	return (
		<PluginDocumentSettingPanel name="elevation-event-details" title="Event details" initialOpen>
			{ ! start && <Notice status="warning" isDismissible={ false }>Add a start date and time before publishing.</Notice> }
			{ problems.map( ( p ) => (
				<Notice key={ p } status="error" isDismissible={ false }>{ p }</Notice>
			) ) }
			<WhenControl title="Starts" value={ start } onChange={ set( 'event_start' ) } />
			<WhenControl title="Ends (optional; can be another day)" value={ end } onChange={ set( 'event_end' ) } allowClear />
			<ToggleControl
				__nextHasNoMarginBottom
				label="Time to be confirmed"
				help="Shows “Time to be confirmed” instead of the times. The date is still used."
				checked={ !! m.event_time_tbc }
				onChange={ set( 'event_time_tbc' ) }
			/>
			<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label="Venue" help="Leave empty for our usual venue." placeholder={ DEFAULT_VENUE } value={ m.event_venue || '' } onChange={ set( 'event_venue' ) } />
			<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label="Button label" placeholder="Register" value={ m.event_cta_label || '' } onChange={ set( 'event_cta_label' ) } />
			<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label="Button link" help="https://… or /page-on-this-site. Leave empty for no button." value={ m.event_cta_url || '' } onChange={ set( 'event_cta_url' ) } />
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'elevation-event-details', { render: EventDetailsPanel } );
```

The label formatter uses `timeZone: 'UTC'` on a `…Z` string on purpose. That prints the stored London wall-clock value unchanged, whatever timezone the editor's browser is in.

- [ ] **Step 3: Import it**

At the end of the import block in `src/editor/index.js` (after `import { createHigherOrderComponent } from '@wordpress/compose';`), add:

```js
import './event-panel';
```

Also add a third bullet to the file's header comment: ` * - "Event details" sidebar panel for events (event-panel.js).`

- [ ] **Step 4: Build and check the bundle**

Run: `docker compose run --rm node npm run build`
Expected: webpack reports "compiled successfully" for both builds.

Then run: `grep -c "elevation-event-details" wp-content/plugins/elevation-core/build/editor/index.js; grep -o "'wp-[a-z-]*'" wp-content/plugins/elevation-core/build/editor/index.asset.php | sort -u | tr '\n' ' '`
Expected: a count of at least 1. The dependency list includes `'wp-core-data'`, `'wp-editor'` and `'wp-plugins'`.

- [ ] **Step 5: Check it in the browser (needs a wp-admin sign-in)**

This step needs someone signed in to wp-admin. The executor must not read the admin password.
- If the browser pane is already signed in, open `http://localhost:8080/wp-admin/post-new.php?post_type=event` and check the following:
  - The "Event details" panel shows.
  - Picking an end before the start disables Publish and shows the red notice.
  - Removing the end re-enables Publish.
  - Publishing with no start shows the server's message.
- Otherwise, record in the ledger: "Browser check of the event panel deferred until a wp-admin sign-in".

- [ ] **Step 6: Commit**

```bash
git add wp-content/plugins/elevation-core/src/editor wp-content/plugins/elevation-core/includes/editor.php wp-content/plugins/elevation-core/build/editor
git commit -m "Editor: Event details panel (dates, time TBC, venue, button) with inline validation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Local event fixtures and seeding

**Files:**
- Create: `wp-content/plugins/elevation-core/src/Fixtures.php`
- Create: `wp-content/plugins/elevation-core/tests/FixturesTest.php`
- Create: `wp-content/plugins/elevation-core/includes/fixtures-cli.php`
- Create: `seed/fixtures/events.json`
- Create: `seed/media/redesign/events/greatness-community-summer-hangout.jpg`, `jewels-chill-and-cheer.jpg`, `men-of-honour-august.jpg`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`, `bin/seed.sh`

**Interfaces:**
- Consumes:
  - `EventFields::errors()` and `EventFields::normaliseDateTime()` (Task 2);
  - `elevation_seed_media_lookup(string $path): ?array{id:int,url:string}` (existing, `includes/cli.php`).
- Produces:
  - **`Fixtures`:**
    - `Fixtures::when(string $relative, \DateTimeImmutable $today): string`, where `"+9 19:00"` gives `Y-m-d\TH:i` and `''` gives `''`;
    - `Fixtures::paragraphs(string $text): string`, which turns paragraphs separated by blank lines into escaped `core/paragraph` block markup.
  - **WP-CLI:**
    - `wp elevation fixtures events <file>` (upsert);
    - `wp elevation fixtures remove` (delete every fixture post).
  - **Meta marker:** `_elevation_fixture` = `1` on fixture posts.
  - **Slugs, which later tasks and `check-urls.sh` rely on:**
    - `leadership-weekend` (multi-day, in progress);
    - `men-of-honour`;
    - `jewels-chill-and-cheer`;
    - `greatness-community-hangout` (external button);
    - `baptism-sunday` (TBC, no image, no description);
    - `youth-weekend-away` (future multi-day);
    - `prayer-and-worship-evening` (past).

- [ ] **Step 1: Write the failing test**

Create `tests/FixturesTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use DateTimeZone;
use Elevation\Core\Fixtures;
use PHPUnit\Framework\TestCase;

final class FixturesTest extends TestCase {

	public function test_relative_days_and_a_time_become_london_wall_clock(): void {
		$today = new DateTimeImmutable( '2026-10-24T23:30:00', new DateTimeZone( 'UTC' ) ); // already 25 Oct in London
		$this->assertSame( '2026-11-03T19:00', Fixtures::when( '+9 19:00', $today ) );
		$this->assertSame( '2026-10-24T10:00', Fixtures::when( '-1 10:00', $today ) );
		$this->assertSame( '2026-10-25T07:30', Fixtures::when( '+0 07:30', $today ) );
		$this->assertSame( '', Fixtures::when( '', $today ) );
	}

	public function test_bad_relative_values_are_refused(): void {
		foreach ( [ '9 19:00', '+9', '+9 7pm', 'tomorrow', '+9 25:00' ] as $bad ) {
			try {
				Fixtures::when( $bad, new DateTimeImmutable( '2026-10-01T12:00:00Z' ) );
				$this->fail( "accepted $bad" );
			} catch ( \InvalidArgumentException $e ) {
				$this->assertStringContainsString( $bad, $e->getMessage() );
			}
		}
	}

	public function test_paragraphs_are_escaped_paragraph_blocks(): void {
		$this->assertSame(
			"<!-- wp:paragraph -->\n<p>Food &amp; games.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Bring &lt;everyone&gt;.</p>\n<!-- /wp:paragraph -->",
			Fixtures::paragraphs( "Food & games.\n\n\n  Bring <everyone>.  \n" )
		);
		$this->assertSame( '', Fixtures::paragraphs( "  \n\n " ) );
	}
}
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `docker compose run --rm php vendor/bin/phpunit --filter FixturesTest`
Expected: an error that class `Elevation\Core\Fixtures` is not found.

- [ ] **Step 3: Implement `Fixtures`**

Create `src/Fixtures.php`:

```php
<?php
namespace Elevation\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Helpers for seed/fixtures/*.json: dates relative to the day of seeding (so fixtures are always "coming
 * up") and plain-text descriptions as paragraph blocks. Pure — no WordPress calls.
 */
final class Fixtures {

	/** "+9 19:00" → nine days after today (London) at 19:00, as "Y-m-d\TH:i". "" stays "". */
	public static function when( string $relative, DateTimeImmutable $today ): string {
		if ( '' === $relative ) {
			return '';
		}
		if ( ! preg_match( '/^([+-]\d{1,3}) ([01]\d|2[0-3]):([0-5]\d)$/', $relative, $m ) ) {
			throw new \InvalidArgumentException( "Fixture date must look like \"+9 19:00\": $relative" );
		}
		$day = $today->setTimezone( new DateTimeZone( EventTime::TZ ) )->setTime( 12, 0 )->modify( $m[1] . ' days' );
		return $day->format( 'Y-m-d' ) . 'T' . $m[2] . ':' . $m[3];
	}

	public static function paragraphs( string $text ): string {
		$blocks = [];
		foreach ( preg_split( '/\n\s*\n/', trim( str_replace( "\r\n", "\n", $text ) ) ) ?: [] as $para ) {
			$para = trim( $para );
			if ( '' !== $para ) {
				$blocks[] = "<!-- wp:paragraph -->\n<p>" . htmlspecialchars( $para, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) . "</p>\n<!-- /wp:paragraph -->";
			}
		}
		return implode( "\n\n", $blocks );
	}
}
```

The test expects `&lt;everyone&gt;` and `&amp;`. `ENT_QUOTES | ENT_HTML5` gives exactly those for `<`, `>` and `&`.

Run: `docker compose run --rm php vendor/bin/phpunit --filter FixturesTest`
Expected: `OK`.

- [ ] **Step 4: The fixtures command**

Create `includes/fixtures-cli.php`:

```php
<?php
/** Local-only sample content (spec §9): `wp elevation fixtures events <file>` and `wp elevation fixtures remove`. */
use Elevation\Core\EventFields;
use Elevation\Core\Fixtures;

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Local sample events. Dates are relative to today, so re-running on another day moves them.
 *
 * ## EXAMPLES
 *     wp elevation fixtures events /seed/fixtures/events.json
 *     wp elevation fixtures remove
 */
WP_CLI::add_command( 'elevation fixtures', function ( array $args ) {
	if ( 'local' !== wp_get_environment_type() ) {
		WP_CLI::error( 'Fixtures are local-only sample content; this is not a local environment.' );
	}
	$action = $args[0] ?? '';
	if ( 'remove' === $action ) {
		$ids = get_posts( [ 'post_type' => 'any', 'post_status' => 'any', 'meta_key' => '_elevation_fixture', 'fields' => 'ids', 'posts_per_page' => -1 ] );
		foreach ( $ids as $id ) {
			wp_delete_post( (int) $id, true );
		}
		WP_CLI::success( sprintf( 'Removed %d fixture post(s).', count( $ids ) ) );
		return;
	}
	if ( 'events' !== $action || empty( $args[1] ) || ! is_readable( $args[1] ) ) {
		WP_CLI::error( 'Usage: wp elevation fixtures events <readable json file> | remove' );
	}
	$rows = json_decode( (string) file_get_contents( $args[1] ), true );
	if ( ! is_array( $rows ) ) {
		WP_CLI::error( 'Fixture file is not a JSON array.' );
	}
	$today = new DateTimeImmutable( 'now' );
	foreach ( $rows as $i => $row ) {
		elevation_fixture_event( is_array( $row ) ? $row : [], $today, (int) $i );
	}
} );

function elevation_fixture_event( array $row, DateTimeImmutable $today, int $index ): void {
	$slug = sanitize_title( (string) ( $row['slug'] ?? '' ) );
	if ( '' === $slug || '' === trim( (string) ( $row['title'] ?? '' ) ) ) {
		WP_CLI::error( "Fixture #$index needs a slug and a title." );
	}
	try {
		$meta = [
			'event_start'     => Fixtures::when( (string) ( $row['start'] ?? '' ), $today ),
			'event_end'       => Fixtures::when( (string) ( $row['end'] ?? '' ), $today ),
			'event_time_tbc'  => (bool) ( $row['time_tbc'] ?? false ),
			'event_venue'     => (string) ( $row['venue'] ?? '' ),
			'event_cta_label' => (string) ( $row['cta_label'] ?? '' ),
			'event_cta_url'   => (string) ( $row['cta_url'] ?? '' ),
		];
	} catch ( \InvalidArgumentException $e ) {
		WP_CLI::error( "$slug: " . $e->getMessage() );
	}
	$errors = EventFields::errors( [ 'start' => $meta['event_start'], 'end' => $meta['event_end'], 'cta_url' => $meta['event_cta_url'] ], true );
	if ( $errors ) {
		WP_CLI::error( "$slug: " . implode( ' ', $errors ) );
	}
	$image = 0;
	if ( ! empty( $row['image'] ) ) {
		$media = elevation_seed_media_lookup( (string) $row['image'] );
		$media || WP_CLI::error( "$slug: unknown media {$row['image']} (import it first)." );
		$image = $media['id'];
	}
	$data = [
		'post_type'    => 'event',
		'post_name'    => $slug,
		'post_title'   => (string) $row['title'],
		'post_excerpt' => (string) ( $row['summary'] ?? '' ),
		'post_content' => Fixtures::paragraphs( (string) ( $row['description'] ?? '' ) ),
		'post_status'  => 'publish',
	];

	$existing = get_posts( [ 'post_type' => 'event', 'name' => $slug, 'post_status' => 'any', 'posts_per_page' => 1 ] )[0] ?? null;
	if ( $existing && ! get_post_meta( $existing->ID, '_elevation_fixture', true ) ) {
		WP_CLI::warning( "Skipped event $slug: a real (non-fixture) event already uses this slug." );
		return;
	}
	if ( $existing ) {
		$same = $existing->post_title === $data['post_title'] && $existing->post_excerpt === $data['post_excerpt']
			&& $existing->post_content === $data['post_content'] && 'publish' === $existing->post_status
			&& (int) get_post_thumbnail_id( $existing ) === $image;
		foreach ( $meta as $key => $value ) {
			$same = $same && get_post_meta( $existing->ID, $key, true ) == $value; // phpcs:ignore Universal.Operators.StrictComparisons -- booleans are stored as "1"/"".
		}
		if ( $same ) {
			WP_CLI::log( "Unchanged event $slug" );
			return;
		}
		$data['ID'] = $existing->ID;
	}
	$id = wp_insert_post( wp_slash( $data ), true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::error( "$slug: " . $id->get_error_message() );
	}
	foreach ( $meta as $key => $value ) {
		update_post_meta( $id, $key, $value );
	}
	update_post_meta( $id, '_elevation_fixture', 1 );
	$image ? set_post_thumbnail( $id, $image ) : delete_post_thumbnail( $id );
	WP_CLI::log( ( $existing ? 'Updated' : 'Created' ) . " event $slug (#$id)" );
}
```

In `elevation-core.php`, add `require_once ELEVATION_CORE_DIR . 'src/Fixtures.php';` after the `EventFields` line. Add `require_once ELEVATION_CORE_DIR . 'includes/fixtures-cli.php';` after `includes/cli.php`.

- [ ] **Step 5: Add the images and the fixture file**

```bash
mkdir -p seed/media/redesign/events
cp ~/Projects.nosync/website/public/events/{greatness-community-summer-hangout,jewels-chill-and-cheer,men-of-honour-august}.jpg seed/media/redesign/events/
```

Create `seed/fixtures/events.json`. The same file is meant for Plan 6's local Supabase parity run, so keep it to these fields:

```json
[
  {
    "slug": "leadership-weekend",
    "title": "Leadership Weekend",
    "summary": "Two days of teaching and workshops for everyone who serves on the G-Squad.",
    "description": "Whether you lead a team or joined one last month, this weekend is for you. We'll open the Word together, share what we're learning, and plan the season ahead.\n\nLunch is provided on both days. Kids are welcome in The Seeds on Saturday morning.",
    "start": "-1 10:00",
    "end": "+1 16:00",
    "time_tbc": false,
    "venue": "",
    "image": "",
    "cta_label": "",
    "cta_url": ""
  },
  {
    "slug": "men-of-honour",
    "title": "Men of Honour",
    "summary": "An evening for the men of Elevation: food, honest conversation and prayer.",
    "description": "Come as you are. We'll eat together, hear from one of our pastors and pray for one another.\n\nBring a friend — it's a great first step into church.",
    "start": "+9 19:00",
    "end": "+9 21:30",
    "time_tbc": false,
    "venue": "",
    "image": "redesign/events/men-of-honour-august.jpg",
    "cta_label": "",
    "cta_url": ""
  },
  {
    "slug": "jewels-chill-and-cheer",
    "title": "Jewels: Chill & Cheer",
    "summary": "A relaxed evening for the women of Elevation, with food, games and good company.",
    "description": "Jewels is our women's ministry. This is an easy evening to meet people, laugh a lot and be encouraged.",
    "start": "+16 18:00",
    "end": "+16 21:00",
    "time_tbc": false,
    "venue": "",
    "image": "redesign/events/jewels-chill-and-cheer.jpg",
    "cta_label": "Save your seat",
    "cta_url": "/contact"
  },
  {
    "slug": "greatness-community-hangout",
    "title": "Greatness Community Hangout",
    "summary": "Food, games and music in the park — bring the whole family.",
    "description": "Our church family and our neighbours, together in the park for an afternoon. Everything is free.",
    "start": "+23 13:00",
    "end": "+23 17:00",
    "time_tbc": false,
    "venue": "Peel Park, The Crescent, Salford M5 4WU",
    "image": "redesign/events/greatness-community-summer-hangout.jpg",
    "cta_label": "Get the details",
    "cta_url": "https://www.instagram.com/elevationmanchester/"
  },
  {
    "slug": "baptism-sunday",
    "title": "Baptism Sunday",
    "summary": "Ready to take the step? Speak to the welcome team to be baptised.",
    "description": "",
    "start": "+40 12:00",
    "end": "",
    "time_tbc": true,
    "venue": "",
    "image": "",
    "cta_label": "",
    "cta_url": ""
  },
  {
    "slug": "youth-weekend-away",
    "title": "412 Nation Weekend Away",
    "summary": "A weekend away for teenagers, with worship, activities and time to grow.",
    "description": "Parents: a full kit list and consent form will be shared with everyone who signs up.",
    "start": "+45 17:00",
    "end": "+47 14:00",
    "time_tbc": false,
    "venue": "Lakeside YMCA, Ulverston, Cumbria LA12 8BD",
    "image": "",
    "cta_label": "Ask about places",
    "cta_url": "/contact"
  },
  {
    "slug": "prayer-and-worship-evening",
    "title": "Prayer and Worship Evening",
    "summary": "An evening of worship and prayer for our city.",
    "description": "Thank you to everyone who came.",
    "start": "-20 19:00",
    "end": "-20 20:30",
    "time_tbc": false,
    "venue": "",
    "image": "",
    "cta_label": "",
    "cta_url": ""
  }
]
```

- [ ] **Step 6: Wire into `bin/seed.sh`**

Add SmartCrawl's event titles, following the redesign's "site | page" pattern. In the existing `wp eval '$o = (array) get_option( "wds_onpage_options", [] ); …'` block, add these lines before `update_option( "wds_onpage_options", $o );`:

```php
  $o["title-event"] = "%%sitename%% %%sep%% %%title%%";
  $o["metadesc-event"] = "%%excerpt%%";
  $o["title-pt-archive-event"] = "%%sitename%% %%sep%% Events";
  $o["metadesc-pt-archive-event"] = "What'"'"'s coming up at {church.name} — {service.day} gatherings, conferences and everything else in the diary.";
```

The `'"'"'` is how an apostrophe is written inside the single-quoted `wp eval` argument. The keys were checked against SmartCrawl 3.16.4: `class-onpage.php` builds `'title-' . $posttype` and `'title-pt-archive-' . $posttype`.

Then, after the `church-in-the-park-2025` `seed_post` line and before `wp option update show_on_front page`, add:

```bash
# Local-only sample events (spec §9), dated relative to today. Plan 6 removes them before go-live:
#   wp elevation fixtures remove
wp elevation fixtures events /seed/fixtures/events.json
```

- [ ] **Step 7: Seed and check**

Run: `./bin/seed.sh 2>&1 | grep -E "media redesign/events|event |Seed complete"`

Expected:
- three `Imported media redesign/events/… (#N)` lines;
- seven `Created event …` lines;
- `Seed complete.`

Run the seed a second time: `./bin/seed.sh 2>&1 | grep -cE "^(Created|Updated) (event|page)"`
Expected: `0`.

Run:

```bash
docker compose run --rm -T wpcli wp eval 'foreach ( elevation_upcoming_events( 10 ) as $p ) { $e = elevation_event( $p ); echo $p->post_name, " | ", $e["start"], " | ", $e["end"], "\n"; }'
```

Expected: six lines, in this order:

1. `leadership-weekend`
2. `men-of-honour`
3. `jewels-chill-and-cheer`
4. `greatness-community-hangout`
5. `baptism-sunday`
6. `youth-weekend-away`

`prayer-and-worship-evening` is not listed. Run `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/events/men-of-honour/`; expected `200`.

- [ ] **Step 8: Run all tests and commit**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK`.

```bash
git add wp-content/plugins/elevation-core/src/Fixtures.php wp-content/plugins/elevation-core/tests/FixturesTest.php wp-content/plugins/elevation-core/includes/fixtures-cli.php wp-content/plugins/elevation-core/elevation-core.php seed/fixtures seed/media/redesign/events bin/seed.sh
git commit -m "Local event fixtures dated relative to today; SmartCrawl titles for events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Event cards and the `event-grid` block

**Files:**
- Modify: `wp-content/plugins/elevation-core/scripts/build-icons.mjs`, regenerate `src/Icons.php`, modify `src/blocks/icon/block.json` and `tests/IconsTest.php`
- Create: `wp-content/plugins/elevation-core/includes/event-render.php`
- Create: `wp-content/plugins/elevation-core/src/blocks/event-grid/{block.json,index.js,render.php}`
- Create: `wp-content/themes/elevation/assets/css/events.css`
- Modify: `wp-content/themes/elevation/functions.php`, `wp-content/plugins/elevation-core/elevation-core.php`
- Rebuild: `wp-content/plugins/elevation-core/build/blocks/*`

**Interfaces:**
- Consumes: `elevation_event()`, `elevation_upcoming_events()` (Task 2); `EventTime::*` (Task 1); `Icons::svg()`; `elevation_setting()`.
- Produces:
  - **`elevation_event_card(WP_Post $post): string`:** an `<article class="event-card reveal">` card.
  - **`elevation_event_maps_url(array $event): string`.**
  - **Block `elevation/event-grid`:**
    - attributes `limit` (1–24, default 24), `columns` (2|3, default 2), `excludeCurrent` (bool);
    - inner blocks are shown when there are no events.
  - **Group class `hide-if-no-events`:** such a group is removed when it contains no event card.
  - **Icons:** `arrow-left`, `chevron-left`, `chevron-right`.
  - **Stylesheet handle `elevation-events`.**

- [ ] **Step 1: Add three icons**

In `scripts/build-icons.mjs`, change `NAMES` to:

```js
const NAMES = [
	'arrow-left', 'arrow-right', 'baby', 'building-2', 'calendar-days', 'car', 'chevron-left', 'chevron-right',
	'circle-check', 'clock', 'compass', 'hand-coins', 'headphones', 'heart-handshake', 'house', 'mail', 'map-pin',
	'monitor-play', 'phone', 'play', 'shield-check', 'shirt', 'sparkles', 'users',
];
```

Run: `docker compose run --rm node node scripts/build-icons.mjs`. This downloads `lucide-static@1.26.0` with `npm pack`.

In `src/blocks/icon/block.json`, set `attributes.name.enum` to the same 24 names in the same order. In `tests/IconsTest.php`, change `assertCount( 21, …)` to `assertCount( 24, …)`.

Run: `docker compose run --rm php vendor/bin/phpunit --filter IconsTest`
Expected: `OK`, including `test_block_enum_matches_the_icon_set`.

- [ ] **Step 2: The card renderer and the empty-section filter**

Create `includes/event-render.php`:

```php
<?php
/** Shared event markup: the card (redesign event-card.tsx) and the "hide this section if no events" rule. */
use Elevation\Core\EventTime;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

function elevation_event_card( WP_Post $post ): string {
	$e     = elevation_event( $post );
	$image = $e['image'] ? wp_get_attachment_image( $e['image'], 'large', false, [
		'alt'      => '',
		'sizes'    => '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
		'loading'  => 'lazy',
		'decoding' => 'async',
	] ) : '';
	$multi = EventTime::isMultiDay( $e['start'], $e['end'] );
	$when  = $multi ? EventTime::formatRange( $e['start'], $e['end'] ) : EventTime::formatTime( $e['start'], $e['end'], $e['tbc'] );
	$venue = '' !== $e['venue'] ? $e['venue'] : (string) elevation_setting( 'location.venue' );
	ob_start();
	?>
	<article class="event-card reveal">
		<a class="event-card__link" href="<?php echo esc_url( $e['url'] ); ?>">
			<div class="event-card__media">
				<?php echo $image ?: '<span class="event-card__placeholder" aria-hidden="true"></span>'; // wp_get_attachment_image() escapes. ?>
				<span class="event-card__chip">
					<span class="event-card__day"><?php echo esc_html( EventTime::dayNumber( $e['start'] ) ); ?></span>
					<span class="event-card__month"><?php echo esc_html( EventTime::monthShort( $e['start'] ) ); ?></span>
				</span>
			</div>
			<div class="event-card__body">
				<h3 class="event-card__title"><?php echo esc_html( $e['title'] ); ?></h3>
				<?php if ( '' !== $e['summary'] ) : ?>
					<p class="event-card__summary"><?php echo esc_html( $e['summary'] ); ?></p>
				<?php endif; ?>
				<div class="event-card__meta">
					<p><?php echo Icons::svg( $multi ? 'calendar-days' : 'clock' ); ?><?php echo esc_html( $when ); ?></p>
					<p><?php echo Icons::svg( 'map-pin' ); ?><?php echo esc_html( $venue ); ?></p>
				</div>
			</div>
		</a>
	</article>
	<?php
	return (string) ob_get_clean();
}

/** Directions for the event's own venue when it has one, otherwise to the church (Church Settings). */
function elevation_event_maps_url( array $event ): string {
	return '' !== $event['venue']
		? 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $event['venue'] )
		: (string) elevation_setting( 'location.mapsUrl' );
}

// A group with the class "hide-if-no-events" disappears when nothing inside it rendered an event card.
add_filter( 'render_block_core/group', function ( string $html, array $block ): string {
	$classes = preg_split( '/\s+/', (string) ( $block['attrs']['className'] ?? '' ) ) ?: [];
	return in_array( 'hide-if-no-events', $classes, true ) && ! str_contains( $html, 'class="event-card' ) ? '' : $html;
}, 10, 2 );
```

In `elevation-core.php`, add `require_once ELEVATION_CORE_DIR . 'includes/event-render.php';` after `includes/events.php`.

- [ ] **Step 3: The `event-grid` block**

Create `src/blocks/event-grid/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/event-grid",
  "title": "Upcoming events",
  "category": "widgets",
  "icon": "calendar-alt",
  "description": "Cards for the next published events, soonest first. The blocks inside are shown instead when nothing is coming up.",
  "attributes": {
    "limit": { "type": "number", "default": 24 },
    "columns": { "type": "number", "enum": [ 2, 3 ], "default": 2 },
    "excludeCurrent": { "type": "boolean", "default": false }
  },
  "usesContext": [ "postId" ],
  "supports": { "html": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
```

Create `src/blocks/event-grid/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: ( { attributes: { limit, columns, excludeCurrent }, setAttributes } ) => {
		const blockProps = useBlockProps();
		const innerProps = useInnerBlocksProps( { style: { outline: '1px dashed #D7D9D6', padding: 12 } } );
		return (
			<div { ...blockProps }>
				<InspectorControls>
					<PanelBody title="Events">
						<RangeControl __nextHasNoMarginBottom __next40pxDefaultSize label="How many" min={ 1 } max={ 24 } value={ limit } onChange={ ( v ) => setAttributes( { limit: v } ) } />
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label="Columns on wide screens"
							value={ String( columns ) }
							options={ [ { label: '2', value: '2' }, { label: '3', value: '3' } ] }
							onChange={ ( v ) => setAttributes( { columns: Number( v ) } ) }
						/>
						<ToggleControl __nextHasNoMarginBottom label="Leave out the event being viewed" checked={ excludeCurrent } onChange={ ( v ) => setAttributes( { excludeCurrent: v } ) } />
					</PanelBody>
				</InspectorControls>
				<p style={ { margin: '0 0 8px', fontSize: 13, color: '#676767' } }>
					Shows up to { limit } upcoming events from Events. When nothing is coming up, visitors see this instead:
				</p>
				<div { ...innerProps } />
			</div>
		);
	},
	save: () => <InnerBlocks.Content />,
} );
```

Create `src/blocks/event-grid/render.php`:

```php
<?php
/**
 * Upcoming event cards. With no upcoming events it shows its inner blocks (the empty state), which may
 * be nothing at all.
 */
defined( 'ABSPATH' ) || exit;

$elevation_limit   = max( 1, min( 24, (int) ( $attributes['limit'] ?? 24 ) ) );
$elevation_columns = 3 === (int) ( $attributes['columns'] ?? 2 ) ? 3 : 2;
$elevation_exclude = empty( $attributes['excludeCurrent'] ) ? 0 : (int) ( $block->context['postId'] ?? get_the_ID() );
$elevation_events  = elevation_upcoming_events( $elevation_limit, $elevation_exclude );

if ( ! $elevation_events ) {
	echo $content; // Inner blocks, already rendered.
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'event-grid event-grid--cols-' . $elevation_columns ] ); ?>>
	<?php foreach ( $elevation_events as $elevation_event ) {
		echo elevation_event_card( $elevation_event ); // Escaped inside.
	} ?>
</div>
```

- [ ] **Step 4: Styles**

Create `wp-content/themes/elevation/assets/css/events.css`:

```css
/* Events (Plan 3): cards, calendar, the events page and the event page. Tokens from theme.json. */

/* ---------- Event cards (elevation/event-grid, elevation/home-events) ---------- */
.event-grid { display: grid; gap: 24px; }
.event-grid > * { margin: 0; }
@media (min-width: 640px) { .event-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .event-grid--cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.event-card { overflow: hidden; border: 1px solid var(--wp--preset--color--grey-100); border-radius: 18px; background: #fff; transition: transform 0.25s ease, box-shadow 0.25s ease; }
.event-card:hover { box-shadow: var(--wp--preset--shadow--card-lg); }
@media (prefers-reduced-motion: no-preference) { .event-card:hover { transform: translateY(-6px); } }
.event-card__link { display: block; height: 100%; color: inherit; text-decoration: none; }
.event-card__link:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 2px; border-radius: 18px; }
.event-card__media { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--wp--preset--color--ink); }
.event-card__media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.event-card:hover .event-card__media img { transform: scale(1.05); }
.event-card__placeholder { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 20%, #2a2a5e 0%, transparent 60%); }
.event-card__media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(14 14 44 / 0.5), transparent); pointer-events: none; }
.event-card__chip { position: absolute; top: 14px; left: 14px; z-index: 1; padding: 8px 12px; border-radius: 11px; background: #fff; box-shadow: var(--wp--preset--shadow--card); text-align: center; line-height: 1; }
.event-card__day { display: block; font-family: var(--wp--preset--font-family--sora); font-size: 20px; font-weight: 800; color: var(--wp--preset--color--ink); }
.event-card__month { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--wp--preset--color--green-700); }
.event-card__body { padding: 22px; }
.event-card__title { margin: 0; font-size: 20px; text-wrap: balance; transition: color 0.2s ease; }
.event-card:hover .event-card__title { color: var(--wp--preset--color--green-700); }
.event-card__summary { display: -webkit-box; margin: 8px 0 0; overflow: hidden; font-size: 14px; color: var(--wp--preset--color--grey-500); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.event-card__meta { margin-top: 14px; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.event-card__meta p { display: flex; align-items: center; gap: 8px; margin: 0; }
.event-card__meta p + p { margin-top: 6px; }
.event-card__meta svg { flex-shrink: 0; width: 16px; height: 16px; color: var(--wp--preset--color--green-700); }

@media (prefers-reduced-motion: reduce) {
	.event-card:hover .event-card__media img { transform: none; }
}
```

In `wp-content/themes/elevation/functions.php`:
- Change `add_editor_style( 'assets/css/site.css' );` to `add_editor_style( [ 'assets/css/site.css', 'assets/css/events.css' ] );`.
- After the `elevation-site` `wp_enqueue_style` line, add:

```php
	wp_enqueue_style( 'elevation-events', get_theme_file_uri( 'assets/css/events.css' ), [ 'elevation-site' ], (string) filemtime( get_theme_file_path( 'assets/css/events.css' ) ) );
```

- [ ] **Step 5: Build, then check escaping and the missing-image fallback (Review Focus 2 and 5)**

Run: `docker compose run --rm node npm run build`
Expected: "compiled successfully".

Then create a temporary tricky event and a temporary page that holds only the grid. The event's image is a copy of a real file, and the copy is deleted straight away, so the event points at a missing attachment:

```bash
ids=$(docker compose run --rm -T wpcli wp --user=admin eval '
$img = (int) elevation_seed_media_lookup( "redesign/events/men-of-honour-august.jpg" )["id"];
$f = wp_upload_dir()["basedir"] . "/probe.jpg"; copy( get_attached_file( $img ), $f );
$copy = wp_insert_attachment( [ "post_mime_type" => "image/jpeg", "post_title" => "probe", "post_status" => "inherit" ], $f );
$e = wp_insert_post( [ "post_type" => "event", "post_status" => "publish", "post_title" => "Q&A <b>night</b> \"late\"", "post_excerpt" => "<script>alert(1)</script> & more", "meta_input" => [ "event_start" => gmdate( "Y-m-d", time() + 2 * DAY_IN_SECONDS ) . "T19:00" ] ] );
set_post_thumbnail( $e, $copy ); wp_delete_attachment( $copy, true );
$p = wp_insert_post( [ "post_type" => "page", "post_status" => "publish", "post_name" => "probe-grid", "post_title" => "Probe", "post_content" => "<!-- wp:elevation/event-grid {\"limit\":3,\"columns\":3} /-->" ] );
echo "$e $p";')
curl -s http://localhost:8080/probe-grid/ | grep -oE 'class="event-card reveal"|Q&amp;A night|<b>night|&amp; more|alert\(1\)|event-card__placeholder' | sort | uniq -c
```

The three soonest events are `leadership-weekend` (under way, no image), the probe (+2 days, image deleted) and `men-of-honour`. Expected:
- 3 × `class="event-card reveal"`;
- 2 × `event-card__placeholder`;
- `Q&amp;A night` and `&amp; more` once each;
- no `<b>night` and no `alert(1)`: `wp_strip_all_tags` removes tags, including a script and its contents.

Clean up, then confirm the probe page has gone:

```bash
docker compose run --rm -T wpcli wp post delete $ids --force
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/probe-grid/
```

Expected: two `Success: Deleted post` lines, then `404`.

- [ ] **Step 6: Run all tests and commit**

Run: `docker compose run --rm php vendor/bin/phpunit` (expected `OK`) and `docker compose run --rm node npm run test:js` (expected `# fail 0`).

```bash
git add wp-content/plugins/elevation-core wp-content/themes/elevation/assets/css/events.css wp-content/themes/elevation/functions.php
git commit -m "Event cards and the Upcoming events block, with an empty state from its inner blocks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The `event-calendar` block

**Files:**
- Create: `wp-content/plugins/elevation-core/src/blocks/event-calendar/{block.json,index.js,render.php,model.js,view.js}`
- Create: `wp-content/plugins/elevation-core/tests/js/event-calendar.test.cjs`
- Modify: `wp-content/themes/elevation/assets/css/events.css` (append)
- Rebuild: `build/blocks/event-calendar/*`

**Interfaces:**
- Consumes:
  - `elevation_calendar_events()`, `elevation_upcoming_events()` and `elevation_event()` (Task 2);
  - `EventTime::dayKeys()`, `formatTime()`, `dateKey()`, `todayKey()` (Task 1);
  - `Icons::svg('chevron-left'|'chevron-right')` (Task 5).
- Produces:
  - **Block `elevation/event-calendar`** (no attributes). Its wrapper has two data attributes:
    - `data-events`: a JSON list of `{date, title, url, time}`;
    - `data-month`: `YYYY-MM`.
  - **`model.js` exports:** `monthCells(month)`, `shiftMonth(month, delta)`, `groupByDate(items)`, `londonDateKey(date)`, `monthLabel(month)`, `isMonth(value)`.

- [ ] **Step 1: Write the failing JS test**

Create `tests/js/event-calendar.test.cjs`:

```js
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const M = require( '../../src/blocks/event-calendar/model.js' );

test( 'months start on Monday with blank leading cells', () => {
	const oct = M.monthCells( '2026-10' ); // 1 Oct 2026 is a Thursday
	assert.deepEqual( oct.slice( 0, 4 ), [ null, null, null, '2026-10-01' ] );
	assert.equal( oct.at( -1 ), '2026-10-31' );
	assert.equal( oct.length, 3 + 31 );
	const feb = M.monthCells( '2027-02' ); // 1 Feb 2027 is a Monday
	assert.equal( feb[ 0 ], '2027-02-01' );
	assert.equal( feb.length, 28 );
	assert.equal( M.monthCells( '2026-11' )[ 6 ], '2026-11-01' ); // a Sunday: six blanks first
	assert.equal( M.monthCells( '2028-02' ).at( -1 ), '2028-02-29' );
} );

test( 'shifting months crosses years', () => {
	assert.equal( M.shiftMonth( '2026-12', 1 ), '2027-01' );
	assert.equal( M.shiftMonth( '2026-01', -1 ), '2025-12' );
	assert.equal( M.shiftMonth( '2026-10', 0 ), '2026-10' );
} );

test( 'events group by date, keeping order', () => {
	const map = M.groupByDate( [ { date: '2026-10-18', title: 'A' }, { date: '2026-10-19', title: 'B' }, { date: '2026-10-18', title: 'C' } ] );
	assert.deepEqual( map.get( '2026-10-18' ).map( ( e ) => e.title ), [ 'A', 'C' ] );
	assert.equal( map.get( '2026-10-20' ), undefined );
} );

test( 'today is London’s date for visitors anywhere', () => {
	// 01:30 UTC on 26 Oct 2026 = 01:30 GMT on the 26th in London (clocks went back on the 25th), but 21:30 on the 25th in New York.
	assert.equal( M.londonDateKey( new Date( '2026-10-26T01:30:00Z' ) ), '2026-10-26' );
	// 23:30 UTC on 30 Jun = 00:30 BST on 1 Jul in London, still 30 Jun in New York.
	assert.equal( M.londonDateKey( new Date( '2026-06-30T23:30:00Z' ) ), '2026-07-01' );
} );

test( 'month labels and month validation', () => {
	assert.equal( M.monthLabel( '2026-10' ), 'October 2026' );
	assert.equal( M.isMonth( '2026-10' ), true );
	for ( const bad of [ '', '2026-13', '2026-1', 'October', undefined ] ) {
		assert.equal( M.isMonth( bad ), false, String( bad ) );
	}
} );
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `docker compose run --rm node npm run test:js`
Expected: the new file fails with `Cannot find module '../../src/blocks/event-calendar/model.js'`, and the consent tests still pass.

- [ ] **Step 3: Implement the model**

Create `src/blocks/event-calendar/model.js`:

```js
/**
 * Calendar maths on "YYYY-MM-DD" strings. Pure; used by view.js and tests/js/event-calendar.test.cjs.
 * Event dates arrive as strings computed on the server in London time: doing date maths on Date objects
 * in the browser would move events across midnight for visitors in other timezones.
 */
const pad = ( n ) => String( n ).padStart( 2, '0' );
const parts = ( month ) => month.split( '-' ).map( Number );

function isMonth( value ) {
	return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test( value );
}

/** Cells for a Monday-first month grid: null for leading blanks, then each date. */
function monthCells( month ) {
	const [ y, m ] = parts( month );
	const lead = ( new Date( Date.UTC( y, m - 1, 1 ) ).getUTCDay() + 6 ) % 7;
	const days = new Date( Date.UTC( y, m, 0 ) ).getUTCDate();
	const cells = Array( lead ).fill( null );
	for ( let d = 1; d <= days; d++ ) {
		cells.push( `${ y }-${ pad( m ) }-${ pad( d ) }` );
	}
	return cells;
}

function shiftMonth( month, delta ) {
	const [ y, m ] = parts( month );
	const d = new Date( Date.UTC( y, m - 1 + delta, 1 ) );
	return `${ d.getUTCFullYear() }-${ pad( d.getUTCMonth() + 1 ) }`;
}

function groupByDate( items ) {
	const map = new Map();
	for ( const item of items ) {
		if ( ! map.has( item.date ) ) {
			map.set( item.date, [] );
		}
		map.get( item.date ).push( item );
	}
	return map;
}

function londonDateKey( date ) {
	return new Intl.DateTimeFormat( 'en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/London' } ).format( date );
}

function monthLabel( month ) {
	const [ y, m ] = parts( month );
	return new Intl.DateTimeFormat( 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' } ).format( new Date( Date.UTC( y, m - 1, 1 ) ) );
}

module.exports = { isMonth, monthCells, shiftMonth, groupByDate, londonDateKey, monthLabel };
```

Run: `docker compose run --rm node npm run test:js`
Expected: `# fail 0`, with 9 + 5 tests passing.

- [ ] **Step 4: The block**

Create `src/blocks/event-calendar/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/event-calendar",
  "title": "Events calendar",
  "category": "widgets",
  "icon": "calendar",
  "description": "A month calendar of every published event. Dates with something on can be tapped to list it.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "viewScript": "file:./view.js",
  "render": "file:./render.php"
}
```

Create `src/blocks/event-calendar/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="calendar" label="Events calendar" instructions="Shows every published event by month. Nothing to set here: add or edit events under Events." />
		</div>
	),
} );
```

Create `src/blocks/event-calendar/render.php`:

```php
<?php
/**
 * Month calendar of every published event. The dates are worked out here in London time; view.js only
 * draws them, so the calendar is hidden until it runs (the event list beside it works without it).
 */
use Elevation\Core\EventTime;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_items = [];
foreach ( elevation_calendar_events() as $elevation_post ) {
	$elevation_e = elevation_event( $elevation_post );
	$elevation_t = EventTime::formatTime( $elevation_e['start'], $elevation_e['end'], $elevation_e['tbc'] );
	foreach ( EventTime::dayKeys( $elevation_e['start'], $elevation_e['end'] ) as $elevation_key ) {
		$elevation_items[] = [ 'date' => $elevation_key, 'title' => $elevation_e['title'], 'url' => $elevation_e['url'], 'time' => $elevation_t ];
	}
}

// Open on the month of the next event (or today, if it's already under way), not an empty current month.
$elevation_today = EventTime::todayKey( new DateTimeImmutable( 'now' ) );
$elevation_next  = elevation_upcoming_events( 1 );
$elevation_first = $elevation_next ? max( EventTime::dateKey( elevation_event( $elevation_next[0] )['start'] ), $elevation_today ) : $elevation_today;
?>
<div <?php echo get_block_wrapper_attributes( [
	'data-events' => (string) wp_json_encode( $elevation_items ),
	'data-month'  => substr( $elevation_first, 0, 7 ),
] ); ?>>
	<div class="event-calendar" hidden>
		<div class="event-calendar__head">
			<h3 class="event-calendar__title" aria-live="polite"></h3>
			<div class="event-calendar__nav">
				<button type="button" class="event-calendar__step" data-step="-1" aria-label="<?php esc_attr_e( 'Previous month', 'elevation-core' ); ?>"><?php echo Icons::svg( 'chevron-left' ); ?></button>
				<button type="button" class="event-calendar__step" data-step="1" aria-label="<?php esc_attr_e( 'Next month', 'elevation-core' ); ?>"><?php echo Icons::svg( 'chevron-right' ); ?></button>
			</div>
		</div>
		<div class="event-calendar__weekdays" aria-hidden="true"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
		<div class="event-calendar__grid" role="group" aria-label="<?php esc_attr_e( 'Events calendar', 'elevation-core' ); ?>"></div>
		<ul class="event-calendar__list" hidden></ul>
	</div>
	<p class="event-calendar__caption" hidden><?php esc_html_e( 'Dates with a marker have something on. Tap one to see what.', 'elevation-core' ); ?></p>
</div>
```

`get_block_wrapper_attributes()` runs each value through `esc_attr()`, so the JSON is safe inside the attribute.

Create `src/blocks/event-calendar/view.js`:

```js
/**
 * Draws the events calendar from the server's London date keys (render.php). All text goes in through
 * textContent, never innerHTML, so event titles can't inject markup.
 */
import model from './model.js';

const { isMonth, monthCells, shiftMonth, groupByDate, londonDateKey, monthLabel } = model;
const dayName = new Intl.DateTimeFormat( 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' } );

function el( tag, className, text ) {
	const node = document.createElement( tag );
	if ( className ) {
		node.className = className;
	}
	if ( text !== undefined ) {
		node.textContent = text;
	}
	return node;
}

document.querySelectorAll( '.wp-block-elevation-event-calendar' ).forEach( ( root ) => {
	let items = [];
	try {
		items = JSON.parse( root.dataset.events || '[]' );
	} catch ( e ) {
		items = [];
	}
	const byDate = groupByDate( Array.isArray( items ) ? items : [] );
	const today = londonDateKey( new Date() );
	let month = isMonth( root.dataset.month ) ? root.dataset.month : today.slice( 0, 7 );
	let selected = null;

	const card = root.querySelector( '.event-calendar' );
	const title = root.querySelector( '.event-calendar__title' );
	const grid = root.querySelector( '.event-calendar__grid' );
	const list = root.querySelector( '.event-calendar__list' );

	function renderList() {
		const events = selected ? byDate.get( selected ) || [] : [];
		list.replaceChildren(
			...events.map( ( event ) => {
				const li = el( 'li' );
				const a = el( 'a', 'event-calendar__event' );
				a.href = event.url;
				a.append( el( 'span', 'event-calendar__event-title', event.title ), el( 'span', 'event-calendar__event-time', event.time ) );
				li.append( a );
				return li;
			} )
		);
		list.hidden = events.length === 0;
	}

	function render( focusDate ) {
		title.textContent = monthLabel( month );
		grid.replaceChildren(
			...monthCells( month ).map( ( key ) => {
				const cell = el( 'div', 'event-calendar__cell' );
				if ( ! key ) {
					return cell;
				}
				const day = String( Number( key.slice( -2 ) ) );
				const events = byDate.get( key ) || [];
				const inner = events.length ? el( 'button', 'event-calendar__day has-events', day ) : el( 'span', 'event-calendar__day', day );
				if ( events.length ) {
					inner.type = 'button';
					inner.dataset.date = key;
					inner.setAttribute( 'aria-pressed', String( key === selected ) );
					inner.setAttribute( 'aria-label', `${ dayName.format( new Date( `${ key }T12:00:00Z` ) ) }: ${ events.length } event${ events.length > 1 ? 's' : '' }` );
					inner.addEventListener( 'click', () => {
						selected = selected === key ? null : key;
						render( key );
					} );
				}
				if ( key === today ) {
					inner.classList.add( 'is-today' );
					inner.setAttribute( 'aria-current', 'date' );
				}
				if ( key === selected ) {
					inner.classList.add( 'is-selected' );
				}
				cell.append( inner );
				return cell;
			} )
		);
		renderList();
		if ( focusDate ) {
			grid.querySelector( `[data-date="${ focusDate }"]` )?.focus();
		}
	}

	root.querySelectorAll( '.event-calendar__step' ).forEach( ( button ) => {
		button.addEventListener( 'click', () => {
			month = shiftMonth( month, Number( button.dataset.step ) );
			selected = null;
			render();
		} );
	} );

	card.hidden = false;
	root.querySelector( '.event-calendar__caption' ).hidden = false;
	render();
} );
```

- [ ] **Step 5: Calendar styles**

Append to `wp-content/themes/elevation/assets/css/events.css`:

```css
/* ---------- Events calendar (elevation/event-calendar) ---------- */
.event-calendar { padding: 24px; border: 1px solid var(--wp--preset--color--grey-100); border-radius: 18px; background: #fff; box-shadow: var(--wp--preset--shadow--card); }
.event-calendar[hidden], .event-calendar__caption[hidden], .event-calendar__list[hidden] { display: none; }
.event-calendar__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.event-calendar__title { margin: 0; font-size: 18px; }
.event-calendar__nav { display: flex; gap: 6px; }
.event-calendar__step { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 1px solid var(--wp--preset--color--grey-300); border-radius: 50%; background: #fff; color: var(--wp--preset--color--ink); cursor: pointer; transition: border-color 0.2s ease; }
.event-calendar__step:hover { border-color: var(--wp--preset--color--ink); }
.event-calendar__step svg { width: 16px; height: 16px; }
.event-calendar__weekdays, .event-calendar__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; text-align: center; }
.event-calendar__weekdays span { padding-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--wp--preset--color--grey-500); }
.event-calendar__cell { aspect-ratio: 1; padding: 2px; }
.event-calendar__day { position: relative; display: grid; place-items: center; width: 100%; height: 100%; box-sizing: border-box; border-radius: 8px; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.event-calendar__day.is-today { box-shadow: inset 0 0 0 1.5px var(--wp--preset--color--grey-300); color: var(--wp--preset--color--ink); font-weight: 600; }
button.event-calendar__day { padding: 0; border: 0; background: var(--wp--preset--color--green-100); color: var(--wp--preset--color--ink); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.2s ease; }
button.event-calendar__day:hover { background: var(--wp--preset--color--green); }
button.event-calendar__day::after { content: ""; position: absolute; bottom: 4px; left: 50%; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: var(--wp--preset--color--green-600); }
button.event-calendar__day.is-selected { background: var(--wp--preset--color--ink); color: #fff; }
button.event-calendar__day.is-selected::after { background: var(--wp--preset--color--green); }
.event-calendar__step:focus-visible, button.event-calendar__day:focus-visible, .event-calendar__event:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 2px; }
.event-calendar__list { margin: 20px 0 0; padding: 20px 0 0; border-top: 1px solid var(--wp--preset--color--grey-100); list-style: none; }
.event-calendar__list li + li { margin-top: 12px; }
.event-calendar__event { display: block; margin: 0 -8px; padding: 8px; border-radius: 8px; color: inherit; text-decoration: none; transition: background-color 0.2s ease; }
.event-calendar__event:hover { background: var(--wp--preset--color--grey-50); }
.event-calendar__event-title { display: block; font-family: var(--wp--preset--font-family--sora); font-weight: 600; color: var(--wp--preset--color--ink); }
.event-calendar__event-time { display: block; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.event-calendar__caption { margin: 16px 0 0; padding: 0 4px; font-size: 12px; line-height: 1.6; color: var(--wp--preset--color--grey-500); }
```

- [ ] **Step 6: Build and smoke-test on a temporary page**

Run: `docker compose run --rm node npm run build`, then:

```bash
docker compose run --rm -T wpcli wp --user=admin post create --post_type=page --post_status=publish --post_name=probe-calendar --post_title=Probe '--post_content=<!-- wp:elevation/event-calendar /-->'
curl -s http://localhost:8080/probe-calendar/ | grep -oE 'data-month="[0-9-]+"|event-calendar__caption|build/blocks/event-calendar/view.js' | sort -u
```

Expected: `data-month="YYYY-MM"` is the current London month, because `leadership-weekend` is under way. The other two strings also appear.

In the browser pane, open `http://localhost:8080/probe-calendar/`, then:
- Check that today's date and the day either side of it are green buttons, and that today has the outline.
- Click one: the list shows "Leadership Weekend" and "10:00 am".
- Click "Next month" twice: the Youth Weekend days are marked, if they fall in that month.
- Check that `read_console_messages` shows no errors.

Then delete the probe page and confirm it has gone:

```bash
docker compose run --rm -T wpcli wp post delete "$(docker compose run --rm -T wpcli wp post list --post_type=page --name=probe-calendar --field=ID)" --force
```

- [ ] **Step 7: Run all tests and commit**

Run: `docker compose run --rm node npm run test:js` (expected `# fail 0`) and `docker compose run --rm php vendor/bin/phpunit` (expected `OK`).

```bash
git add wp-content/plugins/elevation-core/src/blocks/event-calendar wp-content/plugins/elevation-core/build/blocks/event-calendar wp-content/plugins/elevation-core/tests/js/event-calendar.test.cjs wp-content/themes/elevation/assets/css/events.css
git commit -m "Events calendar block: London date keys from the server, month view in the browser

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `event-meta` block and the Events and event page templates

**Files:**
- Create: `wp-content/plugins/elevation-core/src/blocks/event-meta/{block.json,index.js,render.php}`
- Create: `wp-content/themes/elevation/templates/archive-event.html`, `wp-content/themes/elevation/templates/single-event.html`
- Modify: `wp-content/themes/elevation/assets/css/events.css` (append)
- Modify: `wp-content/mu-plugins/local-dev.php` (the validator also checks theme templates)
- Rebuild: `build/blocks/event-meta/*`

**Interfaces:**
- Consumes:
  - `elevation_event()` and `elevation_event_maps_url()` (Tasks 2 and 5);
  - `EventTime` (Task 1);
  - `elevation/event-grid` (Task 5) and `elevation/event-calendar` (Task 6);
  - pattern `elevation/sunday-strip` (Plan 2).
- Produces: block `elevation/event-meta`, whose attribute `part` is one of:
  - `back`
  - `summary`
  - `details`
  - `cta`
  - `getting-there`
  - `no-description`

  It renders nothing outside an event.

- [ ] **Step 1: The `event-meta` block**

Create `src/blocks/event-meta/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/event-meta",
  "title": "Event detail",
  "category": "widgets",
  "icon": "calendar-alt",
  "description": "One part of the event being viewed: back link, summary, date/time/place, button, Getting there box, or the note shown when there is no description.",
  "attributes": {
    "part": { "type": "string", "enum": [ "back", "summary", "details", "cta", "getting-there", "no-description" ], "default": "details" }
  },
  "usesContext": [ "postId", "postType" ],
  "supports": { "html": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
```

Create `src/blocks/event-meta/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import metadata from './block.json';

const PARTS = {
	back: '← All events link',
	summary: 'Summary (the excerpt)',
	details: 'Date, time and place',
	cta: 'Button (when the event has a link)',
	'getting-there': 'Getting there box',
	'no-description': 'Note shown when the event has no description',
};

registerBlockType( metadata.name, {
	edit: ( { attributes: { part }, setAttributes } ) => (
		<div { ...useBlockProps( { style: { padding: 8, border: '1px dashed #D7D9D6', fontSize: 13 } } ) }>
			<InspectorControls>
				<PanelBody title="Show">
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label="Part of the event"
						value={ part }
						options={ Object.entries( PARTS ).map( ( [ value, label ] ) => ( { value, label } ) ) }
						onChange={ ( v ) => setAttributes( { part: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			Event: { PARTS[ part ] }
		</div>
	),
} );
```

Create `src/blocks/event-meta/render.php`:

```php
<?php
/** One part of the event being viewed (redesign events/[slug]/page.tsx). Nothing outside an event. */
use Elevation\Core\EventTime;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_post = get_post( (int) ( $block->context['postId'] ?? get_the_ID() ) );
if ( ! $elevation_post || 'event' !== $elevation_post->post_type ) {
	return;
}
$elevation_e    = elevation_event( $elevation_post );
$elevation_part = (string) ( $attributes['part'] ?? 'details' );
$elevation_wrap = static fn ( string $html ): string => '' === $html ? '' : '<div ' . get_block_wrapper_attributes( [ 'class' => 'event-meta event-meta--' . sanitize_html_class( $elevation_part ) ] ) . '>' . $html . '</div>';
$elevation_full = '' !== $elevation_e['venue'] ? $elevation_e['venue'] : (string) elevation_setting( 'location.full' );

switch ( $elevation_part ) {
	case 'back':
		echo $elevation_wrap( '<a class="event-back" href="' . esc_url( (string) get_post_type_archive_link( 'event' ) ) . '">' . Icons::svg( 'arrow-left' ) . esc_html__( 'All events', 'elevation-core' ) . '</a>' );
		break;

	case 'summary':
		echo $elevation_wrap( '' === $elevation_e['summary'] ? '' : '<p class="event-summary">' . esc_html( $elevation_e['summary'] ) . '</p>' );
		break;

	case 'details':
		$elevation_date = EventTime::isMultiDay( $elevation_e['start'], $elevation_e['end'] ) ? EventTime::formatRange( $elevation_e['start'], $elevation_e['end'] ) : EventTime::formatDate( $elevation_e['start'] );
		$elevation_rows = [
			[ 'calendar-days', $elevation_date ],
			[ 'clock', EventTime::formatTime( $elevation_e['start'], $elevation_e['end'], $elevation_e['tbc'] ) ],
			[ 'map-pin', $elevation_full ],
		];
		$elevation_html = '';
		foreach ( $elevation_rows as [ $elevation_icon, $elevation_text ] ) {
			if ( '' !== $elevation_text ) {
				$elevation_html .= '<li>' . Icons::svg( $elevation_icon ) . '<span>' . esc_html( $elevation_text ) . '</span></li>';
			}
		}
		echo $elevation_wrap( '' === $elevation_html ? '' : '<ul class="event-details">' . $elevation_html . '</ul>' );
		break;

	case 'cta':
		if ( '' !== $elevation_e['cta_url'] ) {
			$elevation_external = str_starts_with( $elevation_e['cta_url'], 'http' );
			echo $elevation_wrap( sprintf(
				'<div class="wp-block-buttons"><div class="wp-block-button is-size-lg"><a class="wp-block-button__link wp-element-button" href="%s"%s>%s</a></div></div>',
				esc_url( $elevation_e['cta_url'] ),
				$elevation_external ? ' target="_blank" rel="noreferrer noopener"' : '',
				esc_html( '' !== $elevation_e['cta_label'] ? $elevation_e['cta_label'] : __( 'Register', 'elevation-core' ) )
			) );
		}
		break;

	case 'getting-there':
		$elevation_lines = array_filter( array_map( 'trim', explode( ',', $elevation_full ) ) );
		$elevation_addr  = implode( '', array_map( static fn ( $l ) => '<p>' . esc_html( $l ) . '</p>', $elevation_lines ) );
		echo $elevation_wrap( sprintf(
			'<aside class="event-getting-there"><h2>%s</h2><address>%s</address><div class="wp-block-buttons is-vertical"><div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="%s" target="_blank" rel="noreferrer noopener">%s</a></div><div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/contact">%s</a></div></div></aside>',
			esc_html__( 'Getting there', 'elevation-core' ),
			$elevation_addr,
			esc_url( elevation_event_maps_url( $elevation_e ) ),
			esc_html__( 'Get directions', 'elevation-core' ),
			esc_html__( 'Ask a question', 'elevation-core' )
		) );
		break;

	case 'no-description':
		if ( '' === trim( wp_strip_all_tags( excerpt_remove_blocks( $elevation_post->post_content ) ) ) ) {
			echo $elevation_wrap( '<p class="event-no-description">' . esc_html__( 'More details coming soon. In the meantime, just turn up — you’re very welcome.', 'elevation-core' ) . '</p>' );
		}
		break;
}
```

Check the `no-description` rule before relying on it. `excerpt_remove_blocks()` keeps only the allowed text blocks. An event whose description is a single image block would therefore count as empty. That's acceptable, because the redesign's description was plain text only.

- [ ] **Step 2: The event page template**

Create `wp-content/themes/elevation/templates/single-event.html`:

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","anchor":"main","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}},"layout":{"type":"default"}} -->
<main id="main" class="wp-block-group" style="margin-top:0;margin-bottom:0"><!-- wp:group {"tagName":"section","align":"full","className":"event-hero","backgroundColor":"ink","textColor":"white","layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull event-hero has-white-color has-ink-background-color has-text-color has-background"><!-- wp:post-featured-image {"className":"event-hero__image"} /-->

<!-- wp:elevation/event-meta {"part":"back"} /-->

<!-- wp:post-title {"level":1,"className":"event-hero__title","textColor":"white"} /-->

<!-- wp:elevation/event-meta {"part":"summary"} /-->

<!-- wp:elevation/event-meta {"part":"details"} /-->

<!-- wp:elevation/event-meta {"part":"cta"} /--></section>
<!-- /wp:group -->

<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"event-body","layout":{"type":"default"}} -->
<div class="wp-block-group event-body"><!-- wp:group {"className":"event-body__main","layout":{"type":"default"}} -->
<div class="wp-block-group event-body__main"><!-- wp:post-content {"layout":{"type":"default"}} /-->

<!-- wp:elevation/event-meta {"part":"no-description"} /--></div>
<!-- /wp:group -->

<!-- wp:elevation/event-meta {"part":"getting-there"} /--></div>
<!-- /wp:group --></section>
<!-- /wp:group -->

<!-- wp:group {"tagName":"section","align":"full","className":"hide-if-no-events","backgroundColor":"grey-50","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull hide-if-no-events has-grey-50-background-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"section-heading","layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group section-heading"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Also coming up</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">More events</h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:elevation/event-grid {"limit":3,"columns":3,"excludeCurrent":true} /--></section>
<!-- /wp:group --></main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

- [ ] **Step 3: The Events page template**

Create `wp-content/themes/elevation/templates/archive-event.html`. The hero copy and the empty-state copy are verbatim from the inventory, with "Sunday" replaced by `{service.day}`:

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","anchor":"main","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}},"layout":{"type":"default"}} -->
<main id="main" class="wp-block-group" style="margin-top:0;margin-bottom:0"><!-- wp:group {"tagName":"section","align":"full","className":"is-style-page-hero","backgroundColor":"ink","textColor":"white","style":{"spacing":{"padding":{"top":"70px","bottom":"60px"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull is-style-page-hero has-white-color has-ink-background-color has-text-color has-background" style="padding-top:70px;padding-bottom:60px"><!-- wp:paragraph {"className":"is-style-eyebrow-on-ink"} -->
<p class="is-style-eyebrow-on-ink">What's on</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1,"textColor":"white"} -->
<h1 class="wp-block-heading has-white-color has-text-color">Events &amp; gatherings</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead-on-ink"} -->
<p class="is-style-lead-on-ink">There's always something happening. Find your next step, from {service.day} gatherings to city-wide conferences.</p>
<!-- /wp:paragraph --></section>
<!-- /wp:group -->

<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:pattern {"slug":"elevation/sunday-strip"} /-->

<!-- wp:group {"className":"events-layout","layout":{"type":"default"}} -->
<div class="wp-block-group events-layout"><!-- wp:group {"className":"events-layout__main","layout":{"type":"default"}} -->
<div class="wp-block-group events-layout__main"><!-- wp:group {"className":"section-heading is-compact","layout":{"type":"default"}} -->
<div class="wp-block-group section-heading is-compact"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Coming up</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Upcoming events</h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:elevation/event-grid {"limit":24,"columns":2} -->
<!-- wp:group {"className":"panel-diary","layout":{"type":"default"}} -->
<div class="wp-block-group panel-diary"><!-- wp:elevation/icon {"name":"calendar-days","size":40} /-->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Nothing else in the diary just yet</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Our {service.day} gathering runs every week. Everything else gets announced on Instagram first.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"linkTarget":"_blank","rel":"noreferrer noopener"} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{socials.instagram.url}" target="_blank" rel="noreferrer noopener">Follow on Instagram</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-ghost"} -->
<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/contact">Ask what's coming up</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->
<!-- /wp:elevation/event-grid --></div>
<!-- /wp:group -->

<!-- wp:group {"tagName":"aside","className":"events-layout__aside","layout":{"type":"default"}} -->
<aside class="wp-block-group events-layout__aside"><!-- wp:elevation/event-calendar /--></aside>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group --></main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

- [ ] **Step 4: Page and hero styles**

Append to `wp-content/themes/elevation/assets/css/events.css`:

```css
/* ---------- Events page (templates/archive-event.html) ---------- */
.events-layout { display: grid; gap: 48px; margin-top: 3.5rem !important; }
.events-layout > * { margin-block: 0; min-width: 0; }
@media (min-width: 1024px) {
	.events-layout { grid-template-columns: minmax(0, 1fr) 340px; gap: 56px; }
	.events-layout__aside { position: sticky; top: 7rem; align-self: start; }
}
.section-heading.is-compact { margin-bottom: 2rem; }
.panel-diary { box-sizing: border-box; padding: 48px; border: 1px solid var(--wp--preset--color--grey-100); border-radius: 18px; background: #fff; text-align: center; }
.panel-diary > * { margin-block: 0; }
.panel-diary .wp-block-elevation-icon { justify-content: center; margin-inline: auto; color: var(--wp--preset--color--green-700); }
.panel-diary > h3 { margin-top: 20px; font-size: 20px; }
.panel-diary > p { max-width: 448px; margin: 12px auto 0; line-height: 1.625; color: var(--wp--preset--color--grey-500); }
.panel-diary > .wp-block-buttons { justify-content: center; gap: 12px; margin-top: 28px; }

/* ---------- Event page (templates/single-event.html) ---------- */
.event-hero { position: relative; overflow: hidden; padding-block: 64px; }
@media (min-width: 640px) { .event-hero { padding-block: 80px; } }
.event-hero::before { content: ""; position: absolute; top: -200px; right: -100px; width: 500px; height: 500px; border-radius: 50%; background: var(--glow); pointer-events: none; }
.event-hero > * { position: relative; z-index: 1; margin-block: 0; }
.event-hero > .event-hero__image { position: absolute; inset: 0; z-index: 0; max-width: none !important; width: 100%; height: 100%; margin: 0 !important; }
.event-hero > .event-hero__image img { width: 100%; height: 100%; object-fit: cover; opacity: 0.4; }
.event-hero > .event-hero__image::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, var(--wp--preset--color--ink), rgb(14 14 44 / 0.8), transparent); }
.event-back { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 28px; font-size: 14px; color: rgb(255 255 255 / 0.7); text-decoration: none; transition: color 0.2s ease; }
.event-back:hover { color: var(--wp--preset--color--green); }
.event-back svg { width: 16px; height: 16px; }
.event-hero__title { max-width: 48rem; font-size: clamp(32px, 5vw, 52px); font-weight: 800; text-wrap: balance; }
.event-summary { max-width: 42rem; margin: 16px 0 0; font-size: 18px; color: rgb(255 255 255 / 0.75); text-wrap: pretty; }
.event-details { display: flex; flex-wrap: wrap; gap: 16px 32px; margin: 32px 0 0; padding: 0; list-style: none; }
.event-details li { display: flex; align-items: center; gap: 10px; font-family: var(--wp--preset--font-family--sora); font-weight: 600; color: #fff; }
.event-details svg { flex-shrink: 0; width: 20px; height: 20px; color: var(--wp--preset--color--green); }
.event-meta--cta { margin-top: 36px !important; }

.event-body { display: grid; gap: 48px; }
.event-body > * { margin-block: 0; min-width: 0; }
@media (min-width: 1024px) { .event-body { grid-template-columns: minmax(0, 1fr) 320px; gap: 64px; } }
.event-body__main > * { margin-block: 0; }
.event-body__main .wp-block-post-content > p { font-size: 18px; line-height: 1.625; text-wrap: pretty; }
.event-body__main .wp-block-post-content > * + * { margin-top: 20px; }
.event-no-description { margin: 0; font-size: 18px; color: var(--wp--preset--color--grey-500); }
.event-getting-there { box-sizing: border-box; padding: 24px; border: 1px solid var(--wp--preset--color--grey-100); border-radius: 18px; }
.event-getting-there h2 { margin: 0; font-size: 18px; }
.event-getting-there address { margin-top: 12px; font-size: 14px; font-style: normal; color: var(--wp--preset--color--grey-500); }
.event-getting-there address p { margin: 0 0 4px; }
.event-getting-there .wp-block-buttons { flex-direction: column; align-items: stretch; gap: 10px; margin-top: 20px; }
.event-getting-there .wp-block-button, .event-getting-there .wp-block-button__link { width: 100%; box-sizing: border-box; text-align: center; }
```

- [ ] **Step 5: Validator covers templates**

In `wp-content/mu-plugins/local-dev.php`, find where the validator builds `$sources`. After the loop that adds patterns (`$sources[] = array( 'pattern ' . $pattern['name'], $pattern['content'] );` and its closing braces), add:

```php
	foreach ( get_block_templates( array(), 'wp_template' ) as $template ) {
		if ( 'elevation' === $template->theme ) {
			$sources[] = array( 'template ' . $template->slug, $template->content );
		}
	}
```

- [ ] **Step 6: Build and check both templates**

Run: `docker compose run --rm node npm run build`. Then:

```bash
for p in /events/ /events/men-of-honour/ /events/baptism-sunday/ /events/leadership-weekend/ /events/greatness-community-hangout/ /events/prayer-and-worship-evening/; do
  printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8080$p"; done
curl -s http://localhost:8080/events/ | grep -oE 'Events &amp; gatherings|Sunday Gathering|Upcoming events|class="event-card reveal"|wp-block-elevation-event-calendar|Nothing else in the diary' | sort | uniq -c
curl -s http://localhost:8080/events/baptism-sunday/ | grep -oE 'Time to be confirmed|More details coming soon|All events|Getting there|More events|Mary Seacole Building' | sort | uniq -c
curl -s http://localhost:8080/events/leadership-weekend/ | grep -oE '[0-9]+ [A-Z][a-z]+ – [0-9]+ [A-Z][a-z]+|10:00 am' | sort -u
curl -s http://localhost:8080/events/greatness-community-hangout/ | grep -oE 'target="_blank" rel="noreferrer noopener">Get the details|maps/search/\?api=1&amp;query=Peel%20Park' | sort -u
./bin/check-tokens.sh /events/ /events/men-of-honour/ /events/baptism-sunday/
```

Expected:
- **Status codes:** every path returns `200`.
- **`/events/`:**
  - `Events &amp; gatherings` once, `Sunday Gathering` at least once (the strip);
  - 6 event cards and the calendar wrapper;
  - no "Nothing else in the diary".
- **`/events/baptism-sunday/`:**
  - "Time to be confirmed", "More details coming soon", "All events", "Getting there" and "More events";
  - `Mary Seacole Building` at least once, from the default venue.
- **`/events/leadership-weekend/`:** a range like `28 Sept – 30 Sept` and `10:00 am`.
- **`/events/greatness-community-hangout/`:** the external button and the Peel Park maps link.
- **`check-tokens`:** `No raw tokens on 3 page(s).`

Check the empty states by temporarily drafting events. The last command publishes every fixture again.

```bash
wpe() { docker compose run --rm -T wpcli wp eval "$1"; }
draft_all_except() { wpe "foreach ( get_posts( [ 'post_type' => 'event', 'posts_per_page' => -1 ] ) as \$p ) if ( \$p->post_name !== '$1' ) wp_update_post( [ 'ID' => \$p->ID, 'post_status' => 'draft' ] );"; }
draft_all_except none
curl -s http://localhost:8080/events/ | grep -oE 'Nothing else in the diary just yet|Follow on Instagram|class="event-card' | sort | uniq -c
wpe "wp_update_post( [ 'ID' => get_posts( [ 'post_type' => 'event', 'post_status' => 'draft', 'name' => 'men-of-honour', 'fields' => 'ids' ] )[0], 'post_status' => 'publish' ] );"
curl -s http://localhost:8080/events/men-of-honour/ | grep -c 'More events'
wpe "foreach ( get_posts( [ 'post_type' => 'event', 'post_status' => 'draft', 'posts_per_page' => -1, 'meta_key' => '_elevation_fixture' ] ) as \$p ) wp_update_post( [ 'ID' => \$p->ID, 'post_status' => 'publish' ] );"
curl -s http://localhost:8080/events/men-of-honour/ | grep -c 'More events'
```

Expected:
- the first `curl` shows "Nothing else in the diary just yet" and "Follow on Instagram" once each, and no `class="event-card`;
- with only `men-of-honour` published, its page has no "More events": the count is `0`;
- once everything is published again, the count is `1`.

In the browser pane at 1440px and 390px, compare `/events/` and `/events/men-of-honour/` against the redesign's layout in the inventory:
- the hero;
- the green strip;
- the two-column list and sticky calendar at 1440px;
- the calendar stacked under the list at 390px;
- the detail hero with the image at 40%;
- the Getting there box.

Check that `read_console_messages` shows no errors. Then open `http://localhost:8080/?elevation-validate-blocks=1` and read `window.elevationValidation`. Expected: `problems` is empty, and `total` now includes the theme's templates.

- [ ] **Step 7: Run all tests and commit**

Run: `docker compose run --rm php vendor/bin/phpunit` (expected `OK`) and `docker compose run --rm node npm run test:js` (expected `# fail 0`).

```bash
git add wp-content/plugins/elevation-core/src/blocks/event-meta wp-content/plugins/elevation-core/build/blocks/event-meta wp-content/themes/elevation/templates/archive-event.html wp-content/themes/elevation/templates/single-event.html wp-content/themes/elevation/assets/css/events.css wp-content/mu-plugins/local-dev.php
git commit -m "Events page and event page templates, with the Event detail block

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Home "What's on" with live events

**Files:**
- Create: `wp-content/plugins/elevation-core/src/blocks/home-events/{block.json,index.js,render.php}`
- Modify: `seed/pages/home.html`
- Modify: `wp-content/themes/elevation/assets/css/events.css` (append)
- Rebuild: `build/blocks/home-events/*`

**Interfaces:**
- Consumes: `elevation_upcoming_events()` (Task 2) and `elevation_event_card()` (Task 5).
- Produces: block `elevation/home-events`. It shows the next three events plus the weekly strip, and its inner blocks (the Plan 2 fallback) when nothing is coming up.

- [ ] **Step 1: The block**

Create `src/blocks/home-events/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/home-events",
  "title": "Home: what's on",
  "category": "widgets",
  "icon": "calendar-alt",
  "description": "The next three events and the weekly gathering strip. The blocks inside are shown instead when nothing is coming up.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
```

Create `src/blocks/home-events/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => {
		const blockProps = useBlockProps();
		const innerProps = useInnerBlocksProps( { style: { outline: '1px dashed #D7D9D6', padding: 12 } } );
		return (
			<div { ...blockProps }>
				<p style={ { margin: '0 0 8px', fontSize: 13, color: '#676767' } }>
					With events coming up, visitors see the next three and the weekly gathering strip. With none, they see this:
				</p>
				<div { ...innerProps } />
			</div>
		);
	},
	save: () => <InnerBlocks.Content />,
} );
```

Create `src/blocks/home-events/render.php`:

```php
<?php
/**
 * Home "What's on" (redesign home-events-section.tsx): the next three events with the weekly strip under
 * them, or the inner blocks (the Sunday card and "More coming soon") when nothing is coming up.
 * Tokens in the strip are replaced by the render_block filter (includes/bindings.php).
 */
defined( 'ABSPATH' ) || exit;

$elevation_events = elevation_upcoming_events( 3 );
if ( ! $elevation_events ) {
	echo $content;
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'home-events' ] ); ?>>
	<div class="event-grid event-grid--cols-3">
		<?php foreach ( $elevation_events as $elevation_event ) {
			echo elevation_event_card( $elevation_event ); // Escaped inside.
		} ?>
	</div>
	<div class="home-events__strip reveal">
		<div class="home-events__strip-text">
			<p class="is-style-eyebrow"><?php esc_html_e( 'Every week', 'elevation-core' ); ?></p>
			<h3>{service.day} Gathering · {service.startTime}</h3>
			<p class="home-events__place">{location.full}</p>
		</div>
		<div class="wp-block-buttons"><div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="/im-new"><?php esc_html_e( 'Plan your visit', 'elevation-core' ); ?></a></div></div>
	</div>
</div>
```

- [ ] **Step 2: Wrap the Home fallback**

In `seed/pages/home.html`, the "What's on" section contains the `grid-3` group that holds `card-gathering` and `card-soon`:
- Insert a line `<!-- wp:elevation/home-events -->` directly before its opening line `<!-- wp:group {"className":"grid-3","layout":{"type":"default"}} -->`.
- That section ends with these three lines:

```
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
```

  Change them to:

```
<!-- /wp:group --></div>
<!-- /wp:group -->
<!-- /wp:elevation/home-events --></section>
<!-- /wp:group -->
```

Only this one occurrence changes: the one right after the `card-soon` "Follow along" button. Check with `grep -n "home-events" seed/pages/home.html`, which should print exactly two lines: the opener just before the `grid-3` line and the closer.

- [ ] **Step 3: Strip styles**

Append to `wp-content/themes/elevation/assets/css/events.css`:

```css
/* ---------- Home "What's on" with events (elevation/home-events) ---------- */
.home-events__strip { display: flex; flex-direction: column; gap: 20px; margin-top: 2rem; padding: 24px; border: 1px solid rgb(132 194 36 / 0.4); border-radius: 18px; background: var(--wp--preset--color--green-100); }
@media (min-width: 640px) { .home-events__strip { flex-direction: row; align-items: center; justify-content: space-between; } }
.home-events__strip-text > * { margin: 0; }
.home-events__strip-text > h3 { margin-top: 6px; font-size: 20px; }
.home-events__place { margin-top: 6px !important; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.home-events__strip .wp-block-buttons { flex-shrink: 0; }
```

- [ ] **Step 4: Build, seed and check**

Run: `docker compose run --rm node npm run build`, then `./bin/seed.sh 2>&1 | grep -E "page home|Seed complete"`
Expected: `Updated page home (#N)` and `Seed complete.`

```bash
curl -s http://localhost:8080/ | grep -oE 'class="event-card reveal"|Sunday Gathering · 10:30am|Mary Seacole Building, University of Salford, Manchester M6 6PU|More coming soon' | sort | uniq -c
./bin/check-tokens.sh /
```

Expected: 3 × `class="event-card reveal"`, the strip heading and the full address once each, no "More coming soon", and no raw tokens.

Check the fallback by drafting every event, as in Task 7:

```bash
docker compose run --rm -T wpcli wp eval 'foreach ( get_posts( [ "post_type" => "event", "posts_per_page" => -1 ] ) as $p ) wp_update_post( [ "ID" => $p->ID, "post_status" => "draft" ] );'
curl -s http://localhost:8080/ | grep -oE 'More coming soon|card-gathering|class="event-card' | sort | uniq -c
docker compose run --rm -T wpcli wp eval 'foreach ( get_posts( [ "post_type" => "event", "post_status" => "draft", "posts_per_page" => -1, "meta_key" => "_elevation_fixture" ] ) as $p ) wp_update_post( [ "ID" => $p->ID, "post_status" => "publish" ] );'
```

Expected: `More coming soon` and `card-gathering` appear, and there is no `class="event-card`.

Open `http://localhost:8080/?elevation-validate-blocks=1` and read `window.elevationValidation`. Expected: `problems` is empty, including `page home`. In the browser pane, compare Home's "What's on" at 1440px and 390px with the inventory: three cards across at 1440px, one per row at 390px, and the green strip under them.

- [ ] **Step 5: Run all tests and commit**

Run: `docker compose run --rm php vendor/bin/phpunit` (expected `OK`) and `./bin/check-urls.sh` (expected `All URLs as expected.`).

```bash
git add wp-content/plugins/elevation-core/src/blocks/home-events wp-content/plugins/elevation-core/build/blocks/home-events seed/pages/home.html wp-content/themes/elevation/assets/css/events.css
git commit -m "Home What's on: the next three events and the weekly strip, falling back to the Plan 2 cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: URL checks, rebuild from nothing, and docs

**Files:**
- Modify: `bin/check-urls.sh`, `README.md`, `docs/superpowers/plans/2026-09-28-roadmap.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the Plan 3 hand-offs to Plans 4–6 in the roadmap.

- [ ] **Step 1: URL checks**

In `bin/check-urls.sh`, after the `for p in …; done` loop of pages, add:

```bash
# Events (Plan 3): the archive, a fixture, a past fixture (still reachable by URL) and a missing one.
for p in /events/ /events/men-of-honour/ /events/prayer-and-worship-evening/; do
  check "$p" 200
done
check /events/no-such-event/ 404
```

Run: `./bin/check-urls.sh`
Expected: `All URLs as expected.`

- [ ] **Step 2: Rebuild from nothing, twice**

This is the same procedure Plan 2 used. It deletes only the local project's volumes and never touches the mirror project.

```bash
docker compose down -v && ./bin/setup.sh > /tmp/claude-rebuild-1.log 2>&1; tail -1 /tmp/claude-rebuild-1.log
docker compose run --rm -T wpcli wp eval 'foreach ( get_posts( [ "post_type" => [ "page", "event" ], "posts_per_page" => -1, "orderby" => "name", "order" => "ASC" ] ) as $p ) echo $p->post_type, " ", $p->post_name, " ", sha1( $p->post_content . get_post_meta( $p->ID, "event_start", true ) . get_post_meta( $p->ID, "event_end", true ) ), "\n";' > /tmp/claude-hash-1.txt
docker compose down -v && ./bin/setup.sh > /tmp/claude-rebuild-2.log 2>&1; tail -1 /tmp/claude-rebuild-2.log
docker compose run --rm -T wpcli wp eval 'foreach ( get_posts( [ "post_type" => [ "page", "event" ], "posts_per_page" => -1, "orderby" => "name", "order" => "ASC" ] ) as $p ) echo $p->post_type, " ", $p->post_name, " ", sha1( $p->post_content . get_post_meta( $p->ID, "event_start", true ) . get_post_meta( $p->ID, "event_end", true ) ), "\n";' > /tmp/claude-hash-2.txt
diff /tmp/claude-hash-1.txt /tmp/claude-hash-2.txt && wc -l < /tmp/claude-hash-1.txt
```

Use the session scratchpad directory instead of `/tmp` if the executor has one. Expected:
- both logs end with `Seed complete.`;
- `diff` prints nothing;
- the count is `21` (14 pages and 7 events).

Both rebuilds must run on the same London day, because fixture dates are relative to today.

Then, after the second rebuild:
- run `./bin/check-urls.sh` (expected `All URLs as expected.`);
- run `./bin/check-tokens.sh / /events/ /events/men-of-honour/` (expected no raw tokens);
- open `/?elevation-validate-blocks=1` and confirm there are no problems;
- run `docker compose exec -T wordpress sh -c 'test -s /var/www/html/wp-content/debug.log && tail -20 /var/www/html/wp-content/debug.log || echo "debug.log empty"'` (expected `debug.log empty`);
- in the browser pane, check the network panel on `/events/` before consent: no request to any Google, YouTube or Podbean domain. Event images are local, and the Google Maps link is only a link.

- [ ] **Step 3: README**

In `README.md`, under "## Seeding", add this bullet after the `bin/fetch-live-media.sh` bullet:

```markdown
- `seed/fixtures/events.json` holds **local-only** sample events, dated relative to the day you seed (`+9 19:00` = nine days from today at 7pm). `./bin/seed.sh` loads them with `wp elevation fixtures events`; `wp elevation fixtures remove` deletes them (Plan 6 does this before go-live). Fixtures never overwrite a real event with the same slug.
```

Under "## Day to day", add the line `docker compose run --rm -T wpcli wp elevation fixtures events /seed/fixtures/events.json   # re-date the sample events` after the `export-page.sh` line.

- [ ] **Step 4: Roadmap**

In `docs/superpowers/plans/2026-09-28-roadmap.md`:
- Change row 3's status from `not written` to `done: \`2026-09-29-plan-3-events.md\``.
- In "## Hand-offs from Plan 2", change the **Plan 3 (Events)** bullet to begin "**Plan 3 (Events):** done." and keep its text.
- Add a section after it:

```markdown
## Hand-offs from Plan 3

- **Plan 4 (YouTube and sermons):** reuse the Plan 3 shapes. Pure date/format logic in `src/`, one card renderer in `includes/*-render.php`, grid blocks whose inner blocks are the empty state, and `hide-if-no-events`-style section hiding. Sermon cards should share `events.css`'s card rules or move them to a shared `cards.css`.
- **Plan 5 (Forms etc.):** an event's button (`event_cta_url`) can point at a form section, e.g. `/im-new#plan-a-visit`.
- **Plan 6 (Go-live):** run `wp elevation fixtures remove` before packaging, and check `wp post list --post_type=event --meta_key=_elevation_fixture` prints nothing. Load `seed/fixtures/events.json` into the local Supabase for parity (dates are relative: `"+9 19:00"`). Add the events archive to `docs/editing-guide.md` ("Event details" panel, Time to be confirmed, venue fallback, button link rules, and that a draft saves without a start date but publishing needs one). SmartCrawl's event titles are set by `bin/seed.sh`.
```

- [ ] **Step 5: Commit**

```bash
git add bin/check-urls.sh README.md docs/superpowers/plans/2026-09-28-roadmap.md
git commit -m "Plan 3 verified: event URL checks, README fixtures, roadmap hand-offs for Plans 4-6

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
