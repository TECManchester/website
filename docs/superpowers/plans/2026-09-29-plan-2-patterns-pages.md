# Plan 2 — Patterns and pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the section styles, patterns and blocks the redesign needs, add consent-gated GA4, and seed the static redesign pages, the four kept live pages and the redesign redirects. After this plan the local site reads as the redesign everywhere except events, sermons, connect groups and forms (Plans 3–5).

**Architecture:**
- The `elevation` theme owns presentation: section and card styles, the reveal effect, and patterns (one PHP file each, category "Elevation").
- `elevation-core` owns behaviour:
  - media seeding and settings WP-CLI commands;
  - the hero-slides settings group;
  - four dynamic blocks rendered by `render.php`: `icon`, `hero-slideshow`, `embed-gate` and `consent-controls`;
  - the consent runtime and GA4 loader;
  - the editor's settings-token button;
  - redirect seeding.
- Pages are block markup in `seed/pages/*.html`, created by `wp elevation seed`. Their media references (`{{media:…}}`) are resolved at seed time.

**Tech Stack:** WordPress 7.1.2 block theme, PHP 8.3, WP-CLI, `@wordpress/scripts` 36.0.0, PHPUnit 11, the Node 22 built-in test runner, the Redirection 5.10.1 PHP API, SmartCrawl 3.16.4 options.

**Spec:** `docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md` (binding). Page content: `docs/superpowers/specs/2026-09-28-redesign-inventory.md` and the redesign source at `~/Projects.nosync/website` (commit `e0cf43e`). This plan quotes all the copy it needs.

**Branch:** create `plan-2-patterns-pages` from `plan-1-foundation` (tag `plan-1-done`). Plan 1 is kept as its own branch and not merged (the user's choice), so Plan 2 stacks on it.

## Decisions made while writing this plan (for review)

1. **Events are not seeded here.** `/events` becomes Plan 3's post-type archive, so this plan seeds 10 of the 11 redesign pages.
2. **Dynamic sections are seeded in their "no data" state as static markup.** This covers Home "Watch" (no video), Home "What's on" (no events) and the Watch page's archive panel (no YouTube key). These match what the redesign shows today. Plans 3 and 4 replace each one with a block that renders the same fallback when it has nothing to show.
3. **Form slots are empty groups with a class**, for example `form-slot form-slot--contact`. Plan 5 finds each by class and inserts its form. Until then, the Contact and Prayer form columns are blank.
4. **Leadership uses core Cover with an `is-style-portrait` block style** instead of a custom `leadership-grid` block (spec §6.8). It looks the same, and staff can change a photo, name or bio without a developer. Cost if wrong: one small block later.
5. **The embed gate gets a third kind, `audio`**, for the Podbean player on the kept Resources page. It is the only other third-party embed, and the privacy notice lists Podbean.
6. **The consent-state logic is JavaScript**, so it is tested with `node --test` in the node container. Spec §12 lists it among the PHPUnit pure functions, but it cannot run in PHPUnit.
7. **Two derived settings handle the redesign's conditional copy:**
   - `service.arrivalNote` is "Doors from X", or "Come a little early for a coffee".
   - `service.startSentence` is "Doors open at X and we start at Y.", or "We start at Y."
8. **Media:**
   - The redesign's images (about 2.5 MB) are committed in `seed/media/redesign/`.
   - The kept pages' 36 images are downloaded once from their public live URLs into `seed/media/live/`. That folder is gitignored, and the files are verified against committed SHA-256 sums.
   - Uploads use a flat folder (`uploads_use_yearmonth_folders` 0), so URLs don't depend on the month the site was built.
9. **Every "Sunday" in seeded copy is `{service.day}`**, and every "Sundays" is `{service.day}s`. This includes "Sunday Gathering" and "Sunday service". Otherwise changing the service day would leave stale copy on 20 or more pages.
10. **Titles:**
    - The site title comes from `church.name`, so it reads "Elevation Church Manchester" rather than the `.env` title.
    - SmartCrawl formats page titles as "Elevation Church Manchester | {Page}" and the home title as "Elevation Church Manchester | Making Greatness Common", as in the redesign.
11. **The privacy notice's retention periods for the new data sets are drafts.** The church must confirm them before go-live (Task 11 lists them).
12. **Local analytics never reaches the real GA4 property.** `local-dev.php` swaps in the dummy measurement ID `G-LOCAL0000`.
13. **Green text and icons on light backgrounds use `green-700`, a Plan 1 ruling.** The redesign's `text-green-600` and `text-grey-500/70` both fail AA contrast.

**Carried forward from Plan 1 (ledger), owned here:**

| Item | Task |
|---|---|
| Hero marker class for the over-hero header | 6 |
| `is-size-lg` for editors | 5 |
| No `{token}` in `<head>` | 1 and 14 |
| Seed twice, everything Unchanged | 14 |
| The 1024px boundary | 14 |

## Global Constraints

- Versions: WordPress 7.1.2, PHP 8.3, MariaDB 10.6, table prefix `wp6d_`. Don't change `bin/versions.lock`.
- Commands:
  - WP-CLI: `docker compose run --rm -T wpcli wp --user=admin <cmd>`.
  - PHP tests: `docker compose run --rm php vendor/bin/phpunit`.
  - JS tests: `docker compose run --rm node node --test tests/js/`.
  - Block build: `docker compose run --rm node npm run build`.
  - Tool services mount the plugin at `/app`. The `wpcli` service mounts `./seed` at `/seed` (read-only).
- `build/` is committed and never edited by hand. Rebuild it after any `src/blocks` or `src/editor` change.
- Colours come only from theme.json palette slugs:
  - Green text or icons on white or grey: `green-700` (#517A15).
  - `green` (#84C224): fills, and text or icons on ink.
  - `green-600`: hover fills.
  - Literal colours only where the redesign has them and the palette has no slug: `#20204a` (navy hover), `#26265c` and `#1a1a3f` (hero fallback gradient), `#2a2a5e` (watch tile), and `#D64545` (alert red).
- Copy is verbatim from this plan, in British English with straight apostrophes. Em dashes are `—`.
- Tokens: any service day or time, venue, campus, city, postcode, email, phone, charity number, legal or short church name, bank detail or social URL in copy is a `{token}` (spec §6.1).
  - Keys: `church.name`, `church.shortName`, `church.legalName`, `church.mission`, `church.charityNumber`, `church.launched`, `church.bedrockText`, `church.bedrockReference`, `service.day`, `service.startTime`, `service.arrivalNote`, `service.startSentence`, `location.venue`, `location.campus`, `location.city`, `location.postcode`, `location.full`, `location.mapsUrl`, `contact.email`, `contact.phoneLabel`, `contact.phoneTel`, `socials.<youtube|instagram|facebook|x>.<name|handle|url>`, `giving.paypalUrl`, `giving.bankAccountName`, `giving.bankAccountNumber`, `giving.bankSortCode`, `giving.chequePayableTo`.
- No page builder. Use core blocks plus the registered block styles. Patterns live in `wp-content/themes/elevation/patterns/<slug>.php`, with slug `elevation/<slug>` and category `elevation`.
- Blocks are dynamic (`render.php`), `apiVersion` 3, and every output is escaped (`esc_html`, `esc_attr`, `esc_url`, or `Icons::svg`, which uses a fixed allow-list).
- Privacy: nothing is requested from Google, YouTube or Podbean before consent or a click.
- Accessibility:
  - AA contrast.
  - Visible focus on everything interactive.
  - Content is visible and usable without JavaScript.
  - `prefers-reduced-motion` turns off every animation.
- Seeding: content reaches WordPress only through `seed/` and `wp elevation seed`. Every run is idempotent, and hand-edited posts are skipped.
- Never read, list or copy anything under `private/`. Never touch `docker-compose.mirror.yml` or the `elevation-mirror` project. Never print passwords.
- Commit messages end with exactly `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These are the inputs most likely to bite a real person that no task's main tests exercise. Each line names the test that pins it.

1. **A Site Manager changes Church Settings**, for example start time 11:00am, doors open 10:15am and a new venue. Every page, meta description, image alt and the `<title>` should show the new values, with no literal `{…}` anywhere in the HTML, `<head>` included. Pinned by Task 2 (derived-copy unit tests), Task 1 Step 9 (meta description token check) and Task 14 Step 4 (the settings-change sweep).
2. **The hero slideshow with zero slides, one slide, or a slide whose image was deleted from the Media Library.** Expected: a gradient or a single static image, no broken `<img>`, no JS error, and no rotation under reduced motion. Pinned by Task 2 (`heroSlides` tests) and Task 3 Step 8 (render and edge-case checks).
3. **Consent storage that throws or is odd.** Cases: Safari private mode throwing on `localStorage`; only the redesign's legacy `ecm.consent.embeds` key present; corrupt JSON; an older record version. Each is treated as "no choice", or migrated, and nothing from Google loads until a choice is made. Pinned by Task 4 (node tests) and Task 4 Step 12 (browser checks).
4. **Hand edits and re-seeding.** An editor changes /about in wp-admin; `seed.sh` then skips it with a warning, and `export-page.sh about` writes it back to `seed/` so the next seed reports it Unchanged. Every seeded page and pattern opens in the editor without block-validation errors. Pinned by Task 13 Steps 7–8 and by the validator run in Tasks 7–12 and 14.
5. **Keyboard-only and no-JS visitors.**
   - The consent banner is the first thing Tab reaches, and every button in it is operable.
   - Escape closes it only once a choice exists.
   - The embed placeholder offers a plain link when JS is off.
   - The header shows the transparent over-hero state only on a page with a `.site-hero`; the 404 page and interior pages get the solid header.

   Pinned by Task 4 Step 12 and Task 6 Step 9.

---

### Task 1: Seed media, settings CLI, page metadata and titles

**Files:**
- Create: `wp-content/plugins/elevation-core/src/MediaRefs.php`
- Create: `wp-content/plugins/elevation-core/tests/MediaRefsTest.php`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php` (require `src/MediaRefs.php`)
- Modify: `wp-content/plugins/elevation-core/includes/cli.php`
- Create: `seed/media/redesign/hero/*.jpg`, `seed/media/redesign/im-new/*.jpg`, `seed/media/redesign/leadership/*.jpg` (copied from the redesign)
- Modify: `bin/seed.sh`

**Interfaces:**
- Consumes (Plan 1):
  - `SeedGuard::decide()` and `SeedGuard::hash()`;
  - `Settings::flatten()`, `unflatten()`, `defaults()` and `SECRET_KEYS`;
  - `elevation_sanitize_settings( $input ): array` (in `includes/settings-page.php`, loaded on every request);
  - the `seed_post` function in `seed.sh`.
- Produces:
  - `MediaRefs::replace( string $content, callable $lookup ): string`, where `$lookup(string $path): ?array{id:int,url:string}`. It throws `\RuntimeException` on an unknown or unsafe path.
  - `MediaRefs::paths( string $content ): list<string>`.
  - `MediaRefs::unresolve( string $content, array $byId ): string`, where `$byId` is `[id => ['path' => string, 'url' => string]]`. Task 13 uses it.
  - `wp elevation media import <file>... --base=<dir>`: the key is the path relative to `--base`, stored in attachment meta `_elevation_seed_media`.
  - `wp elevation media id <key>`: prints the attachment ID, or errors.
  - `wp elevation media map`: prints JSON `{id: {path, url}}` for every seeded attachment. Task 13 uses it.
  - `wp elevation setting set <key=value>... [--if-empty]`. A value of the form `@media:<key>` becomes that attachment's ID.
  - `wp elevation setting get <key>`.
  - `wp elevation seed … [--meta-description=<text>] [--seo-title=<text>]`, which writes SmartCrawl's `_wds_metadesc` and `_wds_title`.
  - Seed files may contain `{{media:<key>}}`, which resolves to a URL, and `{{media-id:<key>}}`, which resolves to an ID.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b plan-2-patterns-pages plan-1-done
```

- [ ] **Step 2: Write the failing MediaRefs tests**

`wp-content/plugins/elevation-core/tests/MediaRefsTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\MediaRefs;
use PHPUnit\Framework\TestCase;

final class MediaRefsTest extends TestCase {

	private function lookup(): callable {
		$known = [
			'redesign/hero/hero-worship.jpg' => [ 'id' => 12, 'url' => 'http://localhost:8080/wp-content/uploads/hero-worship.jpg' ],
			'live/etracts/god-is-not-partial.jpg' => [ 'id' => 40, 'url' => 'http://localhost:8080/wp-content/uploads/god-is-not-partial.jpg' ],
		];
		return static fn ( string $path ) => $known[ $path ] ?? null;
	}

	public function test_replaces_url_and_id_refs(): void {
		$in  = '<!-- wp:image {"id":{{media-id:redesign/hero/hero-worship.jpg}}} --><img src="{{media:redesign/hero/hero-worship.jpg}}" class="wp-image-{{media-id:redesign/hero/hero-worship.jpg}}"/>';
		$out = MediaRefs::replace( $in, $this->lookup() );
		$this->assertSame( '<!-- wp:image {"id":12} --><img src="http://localhost:8080/wp-content/uploads/hero-worship.jpg" class="wp-image-12"/>', $out );
	}

	public function test_content_without_refs_is_unchanged(): void {
		$html = '<p>{service.day}s at {service.startTime} {{not a ref}}</p>';
		$this->assertSame( $html, MediaRefs::replace( $html, $this->lookup() ) );
	}

	public function test_unknown_path_throws_naming_it(): void {
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'redesign/hero/missing.jpg' );
		MediaRefs::replace( '<img src="{{media:redesign/hero/missing.jpg}}">', $this->lookup() );
	}

	public function test_parent_directory_paths_are_rejected(): void {
		$this->expectException( \RuntimeException::class );
		MediaRefs::replace( '{{media:redesign/../../wp-config.php}}', static fn () => [ 'id' => 1, 'url' => 'x' ] );
	}

	public function test_paths_are_distinct_in_order_of_first_use(): void {
		$in = '{{media:b/two.jpg}} {{media-id:a/one.jpg}} {{media:b/two.jpg}}';
		$this->assertSame( [ 'b/two.jpg', 'a/one.jpg' ], MediaRefs::paths( $in ) );
	}

	public function test_unresolve_is_the_inverse_of_replace(): void {
		$seed     = '<!-- wp:image {"id":{{media-id:redesign/hero/hero-worship.jpg}},"sizeSlug":"large"} --><figure><img src="{{media:redesign/hero/hero-worship.jpg}}" class="wp-image-{{media-id:redesign/hero/hero-worship.jpg}}"/></figure><p>Room 12, "id":12 in prose stays.</p>';
		$resolved = MediaRefs::replace( $seed, $this->lookup() );
		$byId     = [ 12 => [ 'path' => 'redesign/hero/hero-worship.jpg', 'url' => 'http://localhost:8080/wp-content/uploads/hero-worship.jpg' ] ];
		$this->assertSame( $seed, MediaRefs::unresolve( $resolved, $byId ) );
	}
}
```

The last test's prose contains `"id":12`, which is outside a block comment. `unresolve` must only rewrite `"id":N` inside `<!-- wp:… -->` comments, so the prose survives unchanged.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `docker compose run --rm php vendor/bin/phpunit --filter MediaRefsTest`
Expected: FAIL with `Class "Elevation\Core\MediaRefs" not found`.

- [ ] **Step 4: Implement MediaRefs**

`wp-content/plugins/elevation-core/src/MediaRefs.php`:

```php
<?php
namespace Elevation\Core;

/**
 * Seed files refer to media by their path under seed/media: {{media:redesign/hero/x.jpg}} becomes the
 * attachment URL and {{media-id:…}} its ID. unresolve() turns an exported page back into refs.
 * Pure — no WordPress calls.
 */
final class MediaRefs {

	private const PATTERN = '/\{\{media(-id)?:([a-z0-9][a-z0-9._\/-]*)\}\}/';

	/** @return list<string> */
	public static function paths( string $content ): array {
		preg_match_all( self::PATTERN, $content, $m );
		return array_values( array_unique( $m[2] ) );
	}

	/** @param callable(string): (array{id:int,url:string}|null) $lookup */
	public static function replace( string $content, callable $lookup ): string {
		return (string) preg_replace_callback(
			self::PATTERN,
			static function ( array $m ) use ( $lookup ): string {
				$path = $m[2];
				if ( str_contains( $path, '..' ) ) {
					throw new \RuntimeException( "Unsafe media path: $path" );
				}
				$media = $lookup( $path );
				if ( null === $media ) {
					throw new \RuntimeException( "Unknown media (import it first): $path" );
				}
				return '-id' === $m[1] ? (string) (int) $media['id'] : (string) $media['url'];
			},
			$content
		);
	}

	/**
	 * Replace seeded attachments' URLs and IDs with refs again. IDs are only rewritten where blocks keep
	 * them: "id":N inside block comments, and the wp-image-N class.
	 *
	 * @param array<int, array{path:string, url:string}> $byId
	 */
	public static function unresolve( string $content, array $byId ): string {
		foreach ( $byId as $id => $media ) {
			$content = str_replace( $media['url'], '{{media:' . $media['path'] . '}}', $content );
			$content = preg_replace( '/\bwp-image-' . (int) $id . '\b/', 'wp-image-{{media-id:' . $media['path'] . '}}', $content );
		}
		return (string) preg_replace_callback(
			'/<!-- wp:[^>]*?-->/s',
			static function ( array $m ) use ( $byId ): string {
				return preg_replace_callback(
					'/"(id|mediaId)":(\d+)\b/',
					static fn ( array $n ) => isset( $byId[ (int) $n[2] ] ) ? '"' . $n[1] . '":{{media-id:' . $byId[ (int) $n[2] ]['path'] . '}}' : $n[0],
					$m[0]
				);
			},
			$content
		);
	}
}
```

Add `require_once ELEVATION_CORE_DIR . 'src/MediaRefs.php';` after the `SeedGuard.php` require in `elevation-core.php`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK (31 tests, …)`, which is the 25 existing tests plus these 6.

- [ ] **Step 6: Add the media and setting commands, and seed metadata, to the CLI**

In `wp-content/plugins/elevation-core/includes/cli.php`, add `use Elevation\Core\MediaRefs;` and `use Elevation\Core\Settings;` below the existing `use`. Then:

(a) In the `elevation seed` command, directly after `$content = (string) file_get_contents( $file );`, resolve media refs:

```php
	try {
		$content = MediaRefs::replace( $content, 'elevation_seed_media_lookup' );
	} catch ( \RuntimeException $e ) {
		WP_CLI::error( $e->getMessage() );
	}
```

(b) Add these two options to the command's docblock, after `[--force]`:

```
 * [--meta-description=<text>]
 * : SmartCrawl meta description (tokens allowed). Written on create/update, or when empty.
 * [--seo-title=<text>]
 * : SmartCrawl title format for this page, e.g. "%%sitename%% %%sep%% %%sitedesc%%".
```

(c) Replace the `UNCHANGED` branch and the final `WP_CLI::log` so that metadata is written:

```php
	if ( SeedGuard::UNCHANGED === $decision ) {
		update_post_meta( $post->ID, '_elevation_seed_hash', SeedGuard::hash( $content ) );
		elevation_seed_meta( $post->ID, $assoc, false );
		WP_CLI::log( "Unchanged $type $slug" );
		return;
	}
```

and, after `update_post_meta( $id, '_elevation_seed_hash', … );`:

```php
	elevation_seed_meta( $id, $assoc, true );
	kses_init_filters();
```

This also re-enables kses, which Plan 1 left off (a deferred minor).

(d) Add below the seed command:

```php
/** SmartCrawl metadata from seed options. $overwrite false only fills empty values (keeps hand edits). */
function elevation_seed_meta( int $post_id, array $assoc, bool $overwrite ): void {
	foreach ( [ 'meta-description' => '_wds_metadesc', 'seo-title' => '_wds_title' ] as $option => $meta ) {
		if ( ! isset( $assoc[ $option ] ) ) {
			continue;
		}
		if ( $overwrite || '' === (string) get_post_meta( $post_id, $meta, true ) ) {
			update_post_meta( $post_id, $meta, wp_slash( (string) $assoc[ $option ] ) );
		}
	}
}

/** @return array{id:int,url:string}|null */
function elevation_seed_media_lookup( string $path ): ?array {
	$ids = get_posts( [
		'post_type'      => 'attachment',
		'post_status'    => 'inherit',
		'meta_key'       => '_elevation_seed_media',
		'meta_value'     => $path,
		'fields'         => 'ids',
		'posts_per_page' => 1,
	] );
	if ( ! $ids ) {
		return null;
	}
	return [ 'id' => (int) $ids[0], 'url' => (string) wp_get_attachment_url( (int) $ids[0] ) ];
}

/**
 * Seeded media.
 *
 * ## EXAMPLES
 *     wp elevation media import /seed/media/redesign/hero/hero-worship.jpg --base=/seed/media
 *     wp elevation media id redesign/hero/hero-worship.jpg
 *     wp elevation media map
 */
WP_CLI::add_command( 'elevation media', function ( array $args, array $assoc ) {
	$action = array_shift( $args );
	if ( 'id' === $action ) {
		$media = elevation_seed_media_lookup( (string) ( $args[0] ?? '' ) );
		$media ? WP_CLI::line( (string) $media['id'] ) : WP_CLI::error( 'No seeded media ' . ( $args[0] ?? '' ) );
		return;
	}
	if ( 'map' === $action ) {
		$map = [];
		foreach ( get_posts( [ 'post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_elevation_seed_media', 'posts_per_page' => -1 ] ) as $att ) {
			$map[ $att->ID ] = [ 'path' => (string) get_post_meta( $att->ID, '_elevation_seed_media', true ), 'url' => (string) wp_get_attachment_url( $att->ID ) ];
		}
		WP_CLI::line( (string) wp_json_encode( $map ) );
		return;
	}
	if ( 'import' !== $action ) {
		WP_CLI::error( 'Usage: wp elevation media import <file>... --base=<dir> | id <key> | map' );
	}
	$base = rtrim( (string) ( $assoc['base'] ?? '' ), '/' ) . '/';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	foreach ( $args as $file ) {
		if ( ! str_starts_with( $file, $base ) || ! is_readable( $file ) ) {
			WP_CLI::error( "Not a readable file under $base: $file" );
		}
		$key = substr( $file, strlen( $base ) );
		if ( elevation_seed_media_lookup( $key ) ) {
			WP_CLI::log( "Unchanged media $key" );
			continue;
		}
		$tmp = wp_tempnam( basename( $file ) );
		copy( $file, $tmp );
		$id = media_handle_sideload( [ 'name' => basename( $file ), 'tmp_name' => $tmp ], 0 );
		if ( is_wp_error( $id ) ) {
			WP_CLI::error( "$key: " . $id->get_error_message() );
		}
		update_post_meta( $id, '_elevation_seed_media', $key );
		WP_CLI::log( "Imported media $key (#$id)" );
	}
} );

/**
 * Read or set Church Settings by dotted key.
 *
 * ## EXAMPLES
 *     wp elevation setting get church.name
 *     wp elevation setting set hero.slide1.image=@media:redesign/hero/hero-worship.jpg "hero.slide1.focal=62% 30%" --if-empty
 */
WP_CLI::add_command( 'elevation setting', function ( array $args, array $assoc ) {
	$action = array_shift( $args );
	if ( 'get' === $action ) {
		$value = elevation_setting( (string) ( $args[0] ?? '' ) );
		is_scalar( $value ) ? WP_CLI::line( (string) $value ) : WP_CLI::error( 'Unknown setting ' . ( $args[0] ?? '' ) );
		return;
	}
	if ( 'set' !== $action || ! $args ) {
		WP_CLI::error( 'Usage: wp elevation setting get <key> | set <key=value>... [--if-empty]' );
	}
	$allowed = Settings::flatten( Settings::defaults() );
	$stored  = get_option( Settings::OPTION, [] );
	$flat    = Settings::flatten( is_array( $stored ) ? $stored : [] );
	foreach ( $args as $pair ) {
		[ $key, $value ] = array_pad( explode( '=', $pair, 2 ), 2, null );
		if ( null === $value || ! array_key_exists( $key, $allowed ) || in_array( $key, Settings::SECRET_KEYS, true ) ) {
			WP_CLI::error( "Not a settable key=value: $pair" );
		}
		if ( str_starts_with( $value, '@media:' ) ) {
			$media = elevation_seed_media_lookup( substr( $value, 7 ) );
			$media ?: WP_CLI::error( "No seeded media for $pair" );
			$value = (string) $media['id'];
		}
		if ( isset( $assoc['if-empty'] ) && '' !== trim( (string) ( $flat[ $key ] ?? '' ) ) ) {
			WP_CLI::log( "Kept $key" );
			continue;
		}
		$flat[ $key ] = $value;
		WP_CLI::log( "Set $key" );
	}
	update_option( Settings::OPTION, elevation_sanitize_settings( Settings::unflatten( $flat ) ) );
} );
```

`elevation_sanitize_settings()` already keeps only known keys and blank-keeps the API key.

- [ ] **Step 7: Copy the redesign's images into the seed**

```bash
mkdir -p seed/media/redesign
cp -R ~/Projects.nosync/website/public/hero ~/Projects.nosync/website/public/im-new ~/Projects.nosync/website/public/leadership seed/media/redesign/
find seed/media/redesign -name 'README.md' -delete
ls -R seed/media/redesign
```

Expected, 11 files:
- `hero/`: `hero-city.jpg`, `hero-kids.jpg`, `hero-welcome-desk.jpg`, `hero-welcome.jpg`, `hero-worship.jpg`
- `im-new/`: `kids-and-teens.jpg`, `times-and-location.jpg`, `what-to-expect.jpg`
- `leadership/`: `pastor-bola-akinlabi.jpg`, `pastor-godman-akinlabi.jpg`, `pastor-tosin-babalola.jpg`

- [ ] **Step 8: Import media and set titles in seed.sh**

In `bin/seed.sh`:

- Replace `wp option update blogname "$WP_TITLE"` and `wp option update blogdescription "Making Greatness Common"` with the block below.
- Leave the rest of the script as it is.

```bash
wp option update uploads_use_yearmonth_folders 0
wp option update blogname "$(wp elevation setting get church.name)"
wp option update blogdescription "$(wp elevation setting get church.tagline)"
# SmartCrawl: "Elevation Church Manchester | About", as the redesign's title template.
wp eval '$o = (array) get_option( "wds_onpage_options", [] );
  $o["title-page"] = "%%sitename%% %%sep%% %%title%%";
  $o["title-home"] = "%%sitename%% %%sep%% %%sitedesc%%";
  $o["preset-separator"] = "pipe";
  update_option( "wds_onpage_options", $o );'

# Media first: pages refer to it by path. Sorted, so attachment IDs are the same on every rebuild.
media_files=$(cd seed/media && find redesign live -type f \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' \) 2>/dev/null | LC_ALL=C sort | sed 's#^#/seed/media/#')
# shellcheck disable=SC2086
[ -n "$media_files" ] && wp elevation media import $media_files --base=/seed/media
```

Change the home seed line to carry its metadata:

```bash
seed_post page home pages/home.html "Home" \
  --seo-title="%%sitename%% %%sep%% %%sitedesc%%" \
  --meta-description="A Spirit-filled church family in Manchester on one mission: making greatness common. Join us {service.day}s at {service.startTime}, {location.venue}, {location.campus}."
```

- [ ] **Step 9: Verify media refs, metadata and titles end to end**

```bash
./bin/seed.sh
docker compose run --rm -T wpcli bash -c 'printf "%s" "<!-- wp:paragraph --><p>{{media:redesign/hero/hero-worship.jpg}}</p><!-- /wp:paragraph -->" > /tmp/t.html && wp --user=admin elevation seed page media-test /tmp/t.html --title=T && wp --user=admin post list --post_type=page --name=media-test --field=post_content && wp --user=admin post delete $(wp --user=admin post list --post_type=page --name=media-test --field=ID) --force'
curl -s http://localhost:8080/ | grep -o '<title>[^<]*</title>\|<meta name="description"[^>]*>'
curl -s http://localhost:8080/ | sed -n '/<head>/,/<\/head>/p' | grep -c '{[a-z][a-zA-Z0-9]*\.[a-zA-Z0-9.]*}' || true
./bin/seed.sh 2>&1 | grep -E 'media|Unchanged|Imported'
```

Expected:
- The seed prints `Imported media redesign/…` 11 times on the first run.
- The test page's content contains `http://localhost:8080/wp-content/uploads/hero-worship.jpg`, with no year/month folder.
- `<title>Elevation Church Manchester | Making Greatness Common</title>`.
- The meta description contains "Join us Sundays at 10:30am, Mary Seacole Building, University of Salford."
- The `grep -c` count is `0`, so no token is left in `<head>`.
- The second seed prints `Unchanged media …` 11 times and `Unchanged page home`.

If the home title still shows the old format, check `_wds_title` on the home page with `wp post meta get <id> _wds_title` before changing anything else.

- [ ] **Step 10: Commit**

```bash
git add wp-content/plugins/elevation-core seed/media/redesign bin/seed.sh
git commit -m "Seed media by path, settings and media CLI commands, SmartCrawl titles and meta descriptions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Hero slides settings and derived service copy

**Files:**
- Modify: `wp-content/plugins/elevation-core/src/Settings.php`
- Modify: `wp-content/plugins/elevation-core/tests/SettingsTest.php`
- Modify: `wp-content/plugins/elevation-core/includes/settings-page.php`
- Create: `wp-content/plugins/elevation-core/assets/admin/hero-slides.js`
- Modify: `bin/seed.sh`

**Interfaces:**
- Consumes: `wp elevation setting set … --if-empty` and `@media:` values (Task 1).
- Produces:
  - Settings group `hero.slide1` … `hero.slide6`, each `{ image: string (attachment ID or ''), focal: string ('62% 30%' or ''), alt: string }`.
  - Derived keys `service.arrivalNote` and `service.startSentence`, available as tokens.
  - `Settings::heroSlides( array $settings ): list<array{image:int, focal:string, alt:string}>`.

- [ ] **Step 1: Write the failing tests**

Append to `SettingsTest`:

```php
	public function test_arrival_copy_without_doors_open(): void {
		$s = Settings::resolve( [] );
		$this->assertSame( 'Come a little early for a coffee', Settings::get( $s, 'service.arrivalNote' ) );
		$this->assertSame( 'We start at 10:30am.', Settings::get( $s, 'service.startSentence' ) );
	}

	public function test_arrival_copy_with_doors_open(): void {
		$s = Settings::resolve( [ 'service' => [ 'doorsOpen' => '10:15am', 'startTime' => '11:00am' ] ] );
		$this->assertSame( 'Doors from 10:15am', Settings::get( $s, 'service.arrivalNote' ) );
		$this->assertSame( 'Doors open at 10:15am and we start at 11:00am.', Settings::get( $s, 'service.startSentence' ) );
	}

	public function test_derived_copy_is_not_a_stored_setting(): void {
		$this->assertArrayNotHasKey( 'service.arrivalNote', Settings::flatten( Settings::defaults() ) );
		$this->assertArrayHasKey( 'service.arrivalNote', Settings::publicValues( Settings::resolve( [] ) ) );
	}

	public function test_hero_slides_default_to_none(): void {
		$this->assertSame( [], Settings::heroSlides( Settings::resolve( [] ) ) );
		$this->assertArrayHasKey( 'hero.slide6.alt', Settings::flatten( Settings::defaults() ) );
	}

	public function test_hero_slides_keep_slot_order_and_skip_empty_slots(): void {
		$s = Settings::resolve( [ 'hero' => [
			'slide5' => [ 'image' => '31', 'focal' => '70% 26%', 'alt' => 'City' ],
			'slide2' => [ 'image' => '12', 'focal' => '62% 30%', 'alt' => 'Worship' ],
			'slide3' => [ 'image' => '', 'focal' => '10% 10%', 'alt' => 'Nothing' ],
		] ] );
		$this->assertSame( [
			[ 'image' => 12, 'focal' => '62% 30%', 'alt' => 'Worship' ],
			[ 'image' => 31, 'focal' => '70% 26%', 'alt' => 'City' ],
		], Settings::heroSlides( $s ) );
	}

	public function test_hero_slide_focal_falls_back_to_centre(): void {
		$s = Settings::resolve( [ 'hero' => [ 'slide1' => [ 'image' => '9', 'focal' => 'left; background:red', 'alt' => '' ] ] ] );
		$this->assertSame( '50% 50%', Settings::heroSlides( $s )[0]['focal'] );
	}

	public function test_hero_slide_with_non_numeric_image_is_skipped(): void {
		$s = Settings::resolve( [ 'hero' => [ 'slide1' => [ 'image' => 'abc' ] ] ] );
		$this->assertSame( [], Settings::heroSlides( $s ) );
	}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `docker compose run --rm php vendor/bin/phpunit --filter SettingsTest`
Expected: FAIL. The new tests fail on the missing `arrivalNote` and `heroSlides`.

- [ ] **Step 3: Implement**

In `Settings::defaults()`, add the hero group after `'giving'`:

```php
			'hero'      => array_fill_keys(
				[ 'slide1', 'slide2', 'slide3', 'slide4', 'slide5', 'slide6' ],
				[ 'image' => '', 'focal' => '', 'alt' => '' ]
			),
```

In `resolve()`, before the `prayerInbox` fallback:

```php
		$svc = $settings['service'];
		$settings['service']['arrivalNote']   = '' !== $svc['doorsOpen'] ? 'Doors from ' . $svc['doorsOpen'] : 'Come a little early for a coffee';
		$settings['service']['startSentence'] = '' !== $svc['doorsOpen']
			? sprintf( 'Doors open at %s and we start at %s.', $svc['doorsOpen'], $svc['startTime'] )
			: sprintf( 'We start at %s.', $svc['startTime'] );
```

Add the method:

```php
	/** @return list<array{image:int, focal:string, alt:string}> Slides that have an image, in slot order. */
	public static function heroSlides( array $settings ): array {
		$slides = [];
		foreach ( (array) ( $settings['hero'] ?? [] ) as $slot ) {
			$image = (string) ( $slot['image'] ?? '' );
			if ( ! ctype_digit( $image ) || 0 === (int) $image ) {
				continue;
			}
			$focal    = (string) ( $slot['focal'] ?? '' );
			$slides[] = [
				'image' => (int) $image,
				'focal' => preg_match( '/^\d{1,3}% \d{1,3}%$/', $focal ) ? $focal : '50% 50%',
				'alt'   => (string) ( $slot['alt'] ?? '' ),
			];
		}
		return $slides;
	}
```

Slot order holds because `merge()` walks the defaults' key order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK (38 tests, …)`.

- [ ] **Step 5: Sanitise and render the hero fields in Settings → Church**

In `elevation_sanitize_settings()`, add these branches before the `email|Inbox` branch:

```php
		if ( str_ends_with( $key, '.image' ) ) {
			$clean[ $key ] = '' === trim( $value ) ? '' : (string) absint( $value );
			continue;
		}
		if ( str_ends_with( $key, '.focal' ) ) {
			$clean[ $key ] = preg_match( '/^\d{1,3}% \d{1,3}%$/', trim( $value ) ) ? trim( $value ) : '';
			continue;
		}
```

The existing chain is `if/elseif`; wrap it or put these before it with `continue` so neither branch falls through.

In `elevation_render_settings_page()`, change the group loop so `hero` is rendered by its own function. Directly inside `foreach ( $groups as $group => $fields ) :`, before the `<h2>`, add:

```php
				<?php if ( 'hero' === $group ) { elevation_render_hero_fields( $stored ); continue; } ?>
```

Add the renderer and its script:

```php
function elevation_render_hero_fields( array $stored ): void {
	?>
	<h2><?php esc_html_e( 'Home page slideshow', 'elevation-core' ); ?></h2>
	<p><?php esc_html_e( 'Up to six photos behind the home page headline. Keep the subject right of centre; the left side sits under the text. Focal point is the part to keep in frame on phones, as "horizontal% vertical%" (e.g. 62% 30%).', 'elevation-core' ); ?></p>
	<table class="form-table" role="presentation">
		<?php for ( $n = 1; $n <= 6; $n++ ) :
			$base  = "hero.slide$n";
			$name  = Settings::OPTION . "[hero][slide$n]";
			$id    = (int) ( $stored[ "$base.image" ] ?? 0 );
			$thumb = $id ? wp_get_attachment_image_url( $id, 'medium' ) : '';
			?>
			<tr class="elevation-slide">
				<th scope="row"><?php echo esc_html( sprintf( __( 'Slide %d', 'elevation-core' ), $n ) ); ?></th>
				<td>
					<input type="hidden" class="elevation-slide__id" name="<?php echo esc_attr( $name ); ?>[image]" value="<?php echo esc_attr( $id ?: '' ); ?>">
					<img class="elevation-slide__preview" src="<?php echo esc_url( (string) $thumb ); ?>" alt="" style="max-width:240px;display:block;margin-bottom:8px" <?php echo $thumb ? '' : 'hidden'; ?>>
					<button type="button" class="button elevation-slide__choose"><?php esc_html_e( 'Choose image', 'elevation-core' ); ?></button>
					<button type="button" class="button-link elevation-slide__remove" <?php echo $thumb ? '' : 'hidden'; ?>><?php esc_html_e( 'Remove', 'elevation-core' ); ?></button>
					<p><label><?php esc_html_e( 'Focal point', 'elevation-core' ); ?> <input type="text" class="small-text" name="<?php echo esc_attr( $name ); ?>[focal]" value="<?php echo esc_attr( (string) ( $stored[ "$base.focal" ] ?? '' ) ); ?>" placeholder="50% 50%" pattern="\d{1,3}% \d{1,3}%"></label></p>
					<p><label><?php esc_html_e( 'Description for screen readers', 'elevation-core' ); ?><br><input type="text" class="large-text" name="<?php echo esc_attr( $name ); ?>[alt]" value="<?php echo esc_attr( (string) ( $stored[ "$base.alt" ] ?? '' ) ); ?>"></label></p>
				</td>
			</tr>
		<?php endfor; ?>
	</table>
	<?php
}

add_action( 'admin_enqueue_scripts', function ( string $hook ) {
	if ( ! in_array( $hook, [ 'settings_page_' . ELEVATION_SETTINGS_PAGE, 'toplevel_page_' . ELEVATION_SETTINGS_PAGE ], true ) ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_script( 'elevation-hero-slides', ELEVATION_CORE_URL . 'assets/admin/hero-slides.js', [ 'media-editor' ], (string) filemtime( ELEVATION_CORE_DIR . 'assets/admin/hero-slides.js' ), true );
} );
```

`wp-content/plugins/elevation-core/assets/admin/hero-slides.js`:

```js
/** Settings → Church: pick a hero slide image from the Media Library. */
( function () {
	document.querySelectorAll( '.elevation-slide' ).forEach( function ( row ) {
		const input = row.querySelector( '.elevation-slide__id' );
		const preview = row.querySelector( '.elevation-slide__preview' );
		const remove = row.querySelector( '.elevation-slide__remove' );
		let frame = null;
		row.querySelector( '.elevation-slide__choose' ).addEventListener( 'click', function () {
			frame = frame || wp.media( { title: 'Choose a slideshow photo', library: { type: 'image' }, multiple: false, button: { text: 'Use this photo' } } );
			frame.off( 'select' ).on( 'select', function () {
				const image = frame.state().get( 'selection' ).first().toJSON();
				input.value = String( image.id );
				preview.src = ( image.sizes && image.sizes.medium ? image.sizes.medium : image ).url;
				preview.hidden = false;
				remove.hidden = false;
			} );
			frame.open();
		} );
		remove.addEventListener( 'click', function () {
			input.value = '';
			preview.hidden = true;
			remove.hidden = true;
		} );
	} );
} )();
```

- [ ] **Step 6: Seed the five redesign slides (only into empty slots)**

In `bin/seed.sh`, add this after the media import:

```bash
wp elevation setting set --if-empty \
  "hero.slide1.image=@media:redesign/hero/hero-worship.jpg" "hero.slide1.focal=62% 30%" \
  "hero.slide1.alt=Members of the congregation worshipping together on a Sunday morning" \
  "hero.slide2.image=@media:redesign/hero/hero-welcome.jpg" "hero.slide2.focal=64% 28%" \
  "hero.slide2.alt=Two young members smiling and making a heart shape with their hands" \
  "hero.slide3.image=@media:redesign/hero/hero-kids.jpg" "hero.slide3.focal=66% 32%" \
  "hero.slide3.alt=Two children from The Seeds smiling together on a Sunday morning" \
  "hero.slide4.image=@media:redesign/hero/hero-welcome-desk.jpg" "hero.slide4.focal=68% 28%" \
  "hero.slide4.alt=Two members smiling outside the welcome entrance to our venue" \
  "hero.slide5.image=@media:redesign/hero/hero-city.jpg" "hero.slide5.focal=70% 26%" \
  "hero.slide5.alt=A member standing outside our venue on the University of Salford campus"
```

- [ ] **Step 7: Verify**

```bash
./bin/seed.sh | grep -E '^(Set|Kept) hero' | sort | uniq -c | head
docker compose run --rm -T wpcli wp --user=admin eval 'echo count( Elevation\Core\Settings::heroSlides( elevation_settings() ) ), " ", elevation_setting( "service.arrivalNote" ), "\n";'
./bin/seed.sh | grep -c '^Kept hero'
```

Expected:
- First run: 15 `Set hero…` lines.
- The `eval` prints `5 Come a little early for a coffee`.
- The second run prints 15 `Kept` lines.

In the browser at `/wp-admin/options-general.php?page=elevation-church`:
- Six slide rows show; five have thumbnails.
- "Choose image" opens the Media Library.
- Saving with slide 5 removed keeps slides 1–4.

Re-run `./bin/seed.sh`. Slide 5 comes back, because its slot is empty; that is expected.

- [ ] **Step 8: Commit**

```bash
git add wp-content/plugins/elevation-core bin/seed.sh
git commit -m "Hero slideshow settings with a Media Library picker; derived arrival copy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Icon and hero slideshow blocks

**Files:**
- Create: `wp-content/plugins/elevation-core/scripts/build-icons.mjs`
- Create: `wp-content/plugins/elevation-core/src/Icons.php` (generated, committed)
- Create: `wp-content/plugins/elevation-core/LICENSE-lucide.txt`
- Create: `wp-content/plugins/elevation-core/tests/IconsTest.php`
- Create: `wp-content/plugins/elevation-core/src/blocks/icon/{block.json,index.js,render.php,style.css}`
- Create: `wp-content/plugins/elevation-core/src/blocks/hero-slideshow/{block.json,index.js,render.php,style.css,view.js}`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php` (require `src/Icons.php`)
- Build: `wp-content/plugins/elevation-core/build/blocks/…`

**Interfaces:**
- Consumes: `Settings::heroSlides()` and `elevation_settings()` (Task 2).
- Produces:
  - `Icons::svg( string $name, string $class = '' ): string`, which returns `''` for an unknown name.
  - `Icons::names(): list<string>`.
  - Block `elevation/icon`, with attributes `name` (enum), `size` (number, 12–96, default 24) and `filled` (bool). It supports text and background colour.
  - Block `elevation/hero-slideshow`, with no attributes. Use it with `"align":"full"` inside a `.site-hero` group.
- Icon set, in this order: `arrow-right`, `baby`, `building-2`, `calendar-days`, `car`, `circle-check`, `clock`, `compass`, `hand-coins`, `headphones`, `heart-handshake`, `house`, `mail`, `map-pin`, `monitor-play`, `phone`, `play`, `shield-check`, `shirt`, `sparkles`, `users`.

- [ ] **Step 1: Write the icon generator**

`wp-content/plugins/elevation-core/scripts/build-icons.mjs`:

```js
// Regenerates src/Icons.php from lucide-static (the redesign uses lucide-react ^1.26.0).
// Run: docker compose run --rm node node scripts/build-icons.mjs
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VERSION = '1.26.0';
const NAMES = [
	'arrow-right', 'baby', 'building-2', 'calendar-days', 'car', 'circle-check', 'clock', 'compass',
	'hand-coins', 'headphones', 'heart-handshake', 'house', 'mail', 'map-pin', 'monitor-play', 'phone',
	'play', 'shield-check', 'shirt', 'sparkles', 'users',
];

const dir = mkdtempSync( join( tmpdir(), 'lucide-' ) );
execFileSync( 'npm', [ 'pack', `lucide-static@${ VERSION }`, '--pack-destination', dir ], { stdio: 'inherit' } );
execFileSync( 'tar', [ '-xzf', join( dir, `lucide-static-${ VERSION }.tgz` ), '-C', dir ] );

const rows = NAMES.map( ( name ) => {
	const svg = readFileSync( join( dir, 'package', 'icons', `${ name }.svg` ), 'utf8' );
	const inner = svg.replace( /^[\s\S]*?<svg[^>]*>/, '' ).replace( /<\/svg>\s*$/, '' ).replace( /\s*\n\s*/g, '' ).trim();
	return `\t\t'${ name }' => '${ inner.replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" ) }',`;
} );

copyFileSync( join( dir, 'package', 'LICENSE' ), 'LICENSE-lucide.txt' );
writeFileSync( 'src/Icons.php', `<?php
namespace Elevation\\Core;

/**
 * Allow-listed Lucide icons (lucide-static ${ VERSION }, ISC licence: LICENSE-lucide.txt).
 * Generated by scripts/build-icons.mjs — edit NAMES there and re-run; don't edit this file.
 */
final class Icons {

	public const PATHS = [
${ rows.join( '\n' ) }
	];

	/** Inline SVG for an allow-listed icon, or '' for an unknown name. */
	public static function svg( string $name, string $class = '' ): string {
		if ( ! isset( self::PATHS[ $name ] ) ) {
			return '';
		}
		$class = htmlspecialchars( trim( 'lucide lucide-' . $name . ' ' . $class ), ENT_QUOTES, 'UTF-8' );
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' . $class . '" aria-hidden="true" focusable="false">' . self::PATHS[ $name ] . '</svg>';
	}

	/** @return list<string> */
	public static function names(): array {
		return array_keys( self::PATHS );
	}
}
` );
console.log( `Wrote src/Icons.php (${ NAMES.length } icons, lucide-static ${ VERSION })` );
```

Run: `docker compose run --rm node node scripts/build-icons.mjs`

Expected: `Wrote src/Icons.php (21 icons, lucide-static 1.26.0)`.

If `npm pack` reports that version 1.26.0 doesn't exist, run `docker compose run --rm node npm view lucide-static versions --json`. Set `VERSION` to the lowest published version at or above 1.26.0 within 1.x, and record the choice in your report. If an icon file is missing in that version, report `NEEDS_CONTEXT` with the name.

- [ ] **Step 2: Write the failing icon tests**

`wp-content/plugins/elevation-core/tests/IconsTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Icons;
use PHPUnit\Framework\TestCase;

final class IconsTest extends TestCase {

	public function test_known_icon_is_decorative_svg(): void {
		$svg = Icons::svg( 'clock' );
		$this->assertStringStartsWith( '<svg ', $svg );
		$this->assertStringContainsString( 'aria-hidden="true"', $svg );
		$this->assertStringContainsString( 'class="lucide lucide-clock"', $svg );
		$this->assertStringEndsWith( '</svg>', $svg );
	}

	public function test_unknown_icon_is_empty(): void {
		$this->assertSame( '', Icons::svg( 'not-an-icon' ) );
		$this->assertSame( '', Icons::svg( '../clock' ) );
	}

	public function test_extra_class_is_escaped(): void {
		$this->assertStringContainsString( 'class="lucide lucide-play is-filled &quot;x"', Icons::svg( 'play', 'is-filled "x' ) );
	}

	public function test_block_enum_matches_the_icon_set(): void {
		$block = json_decode( (string) file_get_contents( __DIR__ . '/../src/blocks/icon/block.json' ), true );
		$this->assertSame( Icons::names(), $block['attributes']['name']['enum'] );
		$this->assertCount( 21, Icons::names() );
	}
}
```

Run: `docker compose run --rm php vendor/bin/phpunit --filter IconsTest`
Expected: FAIL. The first three tests fail on the missing `require`, and the last fails because `block.json` is missing.

- [ ] **Step 3: Create the icon block**

Add `require_once ELEVATION_CORE_DIR . 'src/Icons.php';` to `elevation-core.php`.

`src/blocks/icon/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/icon",
  "title": "Icon",
  "category": "design",
  "icon": "star-empty",
  "description": "A line icon from the site's icon set.",
  "attributes": {
    "name": { "type": "string", "enum": [ "arrow-right", "baby", "building-2", "calendar-days", "car", "circle-check", "clock", "compass", "hand-coins", "headphones", "heart-handshake", "house", "mail", "map-pin", "monitor-play", "phone", "play", "shield-check", "shirt", "sparkles", "users" ], "default": "clock" },
    "size": { "type": "number", "default": 24 },
    "filled": { "type": "boolean", "default": false }
  },
  "supports": { "html": false, "color": { "text": true, "background": true }, "spacing": { "margin": true } },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "style": "file:./style-index.css",
  "render": "file:./render.php"
}
```

`src/blocks/icon/render.php`:

```php
<?php
/** An allow-listed Lucide icon (see src/Icons.php). */
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_svg = Icons::svg( (string) ( $attributes['name'] ?? '' ), empty( $attributes['filled'] ) ? '' : 'is-filled' );
if ( '' === $elevation_svg ) {
	return;
}
$elevation_size = max( 12, min( 96, (int) ( $attributes['size'] ?? 24 ) ) );
?>
<span <?php echo get_block_wrapper_attributes( [ 'style' => '--icon-size:' . $elevation_size . 'px' ] ); ?>><?php echo $elevation_svg; // Built from the fixed allow-list. ?></span>
```

`src/blocks/icon/style.css`:

```css
.wp-block-elevation-icon { display: inline-grid; place-items: center; line-height: 0; flex-shrink: 0; }
.wp-block-elevation-icon svg { width: var(--icon-size, 24px); height: var(--icon-size, 24px); }
.wp-block-elevation-icon .is-filled { fill: currentColor; }
```

`src/blocks/icon/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes } ) => (
		<>
			<InspectorControls>
				<PanelBody title="Icon">
					<SelectControl
						label="Icon"
						value={ attributes.name }
						options={ metadata.attributes.name.enum.map( ( value ) => ( { label: value, value } ) ) }
						onChange={ ( name ) => setAttributes( { name } ) }
					/>
					<RangeControl label="Size (px)" value={ attributes.size } min={ 12 } max={ 96 } onChange={ ( size ) => setAttributes( { size } ) } />
					<ToggleControl label="Filled" checked={ attributes.filled } onChange={ ( filled ) => setAttributes( { filled } ) } />
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<ServerSideRender block={ metadata.name } attributes={ attributes } />
			</div>
		</>
	),
} );
```

- [ ] **Step 4: Create the hero slideshow block**

`src/blocks/hero-slideshow/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/hero-slideshow",
  "title": "Hero slideshow",
  "category": "media",
  "icon": "images-alt2",
  "description": "The home page photos from Church Settings → Home page slideshow, cross-fading behind the headline.",
  "supports": { "html": false, "align": [ "full" ], "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "style": "file:./style-index.css",
  "viewScript": "file:./view.js",
  "render": "file:./render.php"
}
```

`src/blocks/hero-slideshow/render.php`:

```php
<?php
/**
 * Hero photos from Church Settings. Slides whose image was deleted are skipped; with none left the
 * block renders the redesign's gradient, so the hero never looks broken.
 */
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

$elevation_slides = array_values( array_filter(
	Settings::heroSlides( elevation_settings() ),
	static fn ( array $slide ): bool => (bool) wp_get_attachment_image_url( $slide['image'], 'full' )
) );
$elevation_wrapper = [ 'class' => $elevation_slides ? 'has-slides' : 'is-empty' ];
if ( ! $elevation_slides ) {
	$elevation_wrapper['aria-hidden'] = 'true';
}
?>
<div <?php echo get_block_wrapper_attributes( $elevation_wrapper ); ?>>
	<?php foreach ( $elevation_slides as $elevation_i => $elevation_slide ) :
		$elevation_attrs = [
			'class'    => 'hero-slideshow__image',
			'alt'      => '' !== $elevation_slide['alt'] ? $elevation_slide['alt'] : (string) get_post_meta( $elevation_slide['image'], '_wp_attachment_image_alt', true ),
			'sizes'    => '100vw',
			'style'    => 'object-position:' . $elevation_slide['focal'],
			'loading'  => $elevation_i <= 1 ? 'eager' : 'lazy',
			'decoding' => 'async',
		];
		if ( 0 === $elevation_i ) {
			$elevation_attrs['fetchpriority'] = 'high';
		}
		?>
		<div class="hero-slideshow__slide<?php echo 0 === $elevation_i ? ' is-active' : ''; ?>">
			<?php echo wp_get_attachment_image( $elevation_slide['image'], 'full', false, $elevation_attrs ); ?>
		</div>
	<?php endforeach; ?>
	<?php if ( $elevation_slides ) : ?>
		<span class="hero-slideshow__scrim hero-slideshow__scrim--left" aria-hidden="true"></span>
		<span class="hero-slideshow__scrim hero-slideshow__scrim--bottom" aria-hidden="true"></span>
		<span class="hero-slideshow__scrim hero-slideshow__scrim--top" aria-hidden="true"></span>
	<?php endif; ?>
</div>
```

`src/blocks/hero-slideshow/style.css`:

```css
/* Fills the .site-hero section behind its content (redesign hero-slideshow.tsx). */
.wp-block-elevation-hero-slideshow { position: absolute; inset: 0; z-index: 0; overflow: hidden; max-width: none !important; margin: 0 !important; }
.wp-block-elevation-hero-slideshow.is-empty {
	background: radial-gradient(ellipse at 20% -10%, #26265c 0%, transparent 55%), radial-gradient(ellipse at 90% 110%, #1a1a3f 0%, transparent 50%);
}
.hero-slideshow__slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.2s ease-in-out; }
.hero-slideshow__slide.is-active { opacity: 1; }
.hero-slideshow__image { display: block; width: 100%; height: 100%; object-fit: cover; }
@media (prefers-reduced-motion: no-preference) {
	.hero-slideshow__slide.is-active .hero-slideshow__image { animation: elevation-kenburns 9s ease-out forwards; }
}
@media (prefers-reduced-motion: reduce) {
	.hero-slideshow__slide { transition: none; }
}
@keyframes elevation-kenburns {
	from { transform: scale(1); }
	to { transform: scale(1.03) translateY(-0.5%); }
}
/* Every seeded slide is "pre-treated" (gradient baked in), so the left wash is the light one. */
.hero-slideshow__scrim { position: absolute; inset: 0; pointer-events: none; }
.hero-slideshow__scrim--left { background: linear-gradient(to right, rgb(14 14 44 / 0.45), rgb(14 14 44 / 0.1), transparent); }
.hero-slideshow__scrim--bottom { background: linear-gradient(to top, #0e0e2c, transparent, transparent); opacity: 0.9; }
@media (min-width: 640px) { .hero-slideshow__scrim--bottom { opacity: 0.55; } }
.hero-slideshow__scrim--top { inset: 0 0 auto 0; height: 160px; background: linear-gradient(to bottom, rgb(14 14 44 / 0.8), transparent); }
```

`src/blocks/hero-slideshow/view.js`:

```js
/**
 * Hero slideshow: a new photo every 6.5s (the 1.2s cross-fade is CSS). Never rotates with fewer
 * than two slides, under reduced motion, or while the tab is hidden.
 */
const SLIDE_MS = 6500;

document.querySelectorAll( '.wp-block-elevation-hero-slideshow.has-slides' ).forEach( ( root ) => {
	const slides = [ ...root.querySelectorAll( '.hero-slideshow__slide' ) ];
	if ( slides.length < 2 ) {
		return;
	}
	const reduce = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	let index = 0;
	let timer = null;

	const schedule = () => {
		clearTimeout( timer );
		if ( reduce.matches || document.hidden ) {
			return;
		}
		timer = setTimeout( () => {
			slides[ index ].classList.remove( 'is-active' );
			index = ( index + 1 ) % slides.length;
			slides[ index ].classList.add( 'is-active' );
			schedule();
		}, SLIDE_MS );
	};

	document.addEventListener( 'visibilitychange', schedule );
	reduce.addEventListener( 'change', schedule );
	schedule();
} );
```

`src/blocks/hero-slideshow/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps( { style: { position: 'absolute', inset: 0 } } ) }>
			<ServerSideRender block={ metadata.name } />
		</div>
	),
} );
```

- [ ] **Step 5: Build**

Run: `docker compose run --rm node npm run build`
Expected: webpack reports `build/blocks/icon/` and `build/blocks/hero-slideshow/` (each with `index.js`, `index.asset.php`, `render.php`, `style-index.css` and `block.json`, plus `view.js` for the slideshow) alongside `social-links`, with no errors.

- [ ] **Step 6: Run the tests**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK (42 tests, …)`.

- [ ] **Step 7: Render the blocks on a scratch page**

```bash
docker compose run --rm -T wpcli bash -c 'cat > /tmp/t.html <<EOF
<!-- wp:group {"tagName":"section","align":"full","className":"site-hero","backgroundColor":"ink","layout":{"type":"constrained"}} -->
<section class="wp-block-group alignfull site-hero has-ink-background-color has-background"><!-- wp:elevation/hero-slideshow {"align":"full"} /--><!-- wp:elevation/icon {"name":"map-pin","size":18,"textColor":"green"} /--><!-- wp:elevation/icon {"name":"nope"} /--></section>
<!-- /wp:group -->
EOF
wp --user=admin elevation seed page block-test /tmp/t.html --title=T'
curl -s http://localhost:8080/block-test/ > /tmp/bt.html
grep -o 'hero-slideshow__slide[^"]*' /tmp/bt.html | sort | uniq -c
grep -c 'fetchpriority="high"' /tmp/bt.html
grep -o '<span class="wp-block-elevation-icon[^>]*>' /tmp/bt.html
```

Expected:
- `4 hero-slideshow__slide` and `1 hero-slideshow__slide is-active`.
- `1` for `fetchpriority="high"`.
- One icon span with `has-green-color` and `style="--icon-size:18px"`. The unknown icon renders nothing.

- [ ] **Step 8: Edge cases (Review Focus 2)**

```bash
w() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
w elevation setting set hero.slide2.image=999999
curl -s http://localhost:8080/block-test/ | grep -c 'hero-slideshow__slide'
w eval '$o = get_option( "elevation_settings" ); foreach ( $o["hero"] as $k => $v ) { $o["hero"][ $k ]["image"] = ""; } update_option( "elevation_settings", $o );'
curl -s http://localhost:8080/block-test/ | grep -o 'wp-block-elevation-hero-slideshow[^"]*'
./bin/seed.sh >/dev/null
```

Expected:
- `4`: a missing attachment is skipped, and 999999 does not exist.
- Then `wp-block-elevation-hero-slideshow alignfull is-empty`, with no `<img>`.
- The final seed restores all five slides, because the slots are now empty.

In the browser at `/block-test/`:
- After 7 seconds the second slide is active.
- With DevTools' "Emulate CSS prefers-reduced-motion: reduce", the first slide stays, and there is no console error in either case.

Then delete the page:
```bash
docker compose run --rm -T wpcli wp --user=admin post delete $(docker compose run --rm -T wpcli wp --user=admin post list --post_type=page --name=block-test --field=ID) --force
```

- [ ] **Step 9: Commit**

```bash
git add wp-content/plugins/elevation-core
git commit -m "Icon block with an allow-listed Lucide set; hero slideshow block from Church Settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Consent, GA4, embed gate and consent controls

**Files:**
- Create: `wp-content/plugins/elevation-core/assets/js/consent-state.js`
- Create: `wp-content/plugins/elevation-core/assets/js/consent.js`
- Create: `wp-content/plugins/elevation-core/assets/css/consent.css`
- Create: `wp-content/plugins/elevation-core/includes/consent.php`
- Create: `wp-content/plugins/elevation-core/src/EmbedGate.php`
- Create: `wp-content/plugins/elevation-core/tests/EmbedGateTest.php`
- Create: `wp-content/plugins/elevation-core/tests/js/consent-state.test.cjs`
- Create: `wp-content/plugins/elevation-core/src/blocks/embed-gate/{block.json,index.js,render.php,style.css}`
- Create: `wp-content/plugins/elevation-core/src/blocks/consent-controls/{block.json,index.js,render.php,style.css}`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php` (require `src/EmbedGate.php` and `includes/consent.php`)
- Modify: `wp-content/plugins/elevation-core/package.json` (add `"test:js": "node --test tests/js/"`)
- Modify: `wp-content/mu-plugins/local-dev.php`
- Modify: `wp-content/themes/elevation/parts/footer.html`

**Interfaces:**
- Consumes:
  - `Icons::svg()` (Task 3);
  - the settings `analytics.ga4MeasurementId`, `location.embedUrl`, `location.mapsUrl` and `location.full`.
- Produces:
  - `localStorage["ecm.consent"]` = `{"analytics":bool,"embeds":bool,"version":1,"ts":number}`.
  - The DOM event `ecm:consent-changed`.
  - `window.ecmConsent.get()` and `window.ecmConsent.open()`.
  - Any element with `[data-ecm-consent-open]` reopens the banner.
  - The PHP filter `elevation_consent_config` (an array with a `ga4` key).
  - `EmbedGate::allowedSrc( string $kind, string $src ): ?string` and `EmbedGate::copy( string $kind ): array{button:string,note:string,icon:string,title:string}`.
  - Block `elevation/embed-gate`, with attributes:
    - `kind` (`map`, `video` or `audio`);
    - `title`;
    - `src` (for a map, blank means Church Settings' map);
    - `link` (a plain "Open in a new tab" link; for a map, blank means `location.mapsUrl`);
    - `aspectRatio` (`16/9` or `4/3`);
    - `height` (px; 0 means use the aspect ratio).
  - Block `elevation/consent-controls`, with no attributes.

- [ ] **Step 1: Write the failing consent-state tests**

`wp-content/plugins/elevation-core/tests/js/consent-state.test.cjs`:

```js
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const S = require( '../../assets/js/consent-state.js' );

const NOW = 1_780_000_000_000;
const record = ( analytics, embeds, ts = 5 ) => JSON.stringify( { analytics, embeds, version: 1, ts } );

test( 'no stored choice is null', () => {
	assert.equal( S.parse( null, null, NOW ), null );
} );

test( 'a valid record is read back', () => {
	assert.deepEqual( S.parse( record( true, false ), null, NOW ), { analytics: true, embeds: false, version: 1, ts: 5 } );
} );

test( 'corrupt, old-version or mistyped records are no choice', () => {
	assert.equal( S.parse( '{', null, NOW ), null );
	assert.equal( S.parse( JSON.stringify( { analytics: true, embeds: true, version: 0 } ), null, NOW ), null );
	assert.equal( S.parse( JSON.stringify( { analytics: 'yes', embeds: true, version: 1 } ), null, NOW ), null );
	assert.equal( S.parse( 'null', null, NOW ), null );
} );

test( 'the redesign legacy key migrates to embeds only, analytics off', () => {
	assert.deepEqual( S.parse( null, 'granted', NOW ), { analytics: false, embeds: true, version: 1, ts: NOW } );
	assert.deepEqual( S.parse( null, 'declined', NOW ), { analytics: false, embeds: false, version: 1, ts: NOW } );
	assert.equal( S.parse( null, 'maybe', NOW ), null );
} );

test( 'a current record wins over the legacy key', () => {
	assert.equal( S.parse( record( true, true ), 'declined', NOW ).embeds, true );
} );

test( 'choices', () => {
	assert.deepEqual( S.choose( { type: 'acceptAll' }, NOW ), { analytics: true, embeds: true, version: 1, ts: NOW } );
	assert.deepEqual( S.choose( { type: 'rejectAll' }, NOW ), { analytics: false, embeds: false, version: 1, ts: NOW } );
	assert.deepEqual( S.choose( { type: 'save', analytics: false, embeds: true }, NOW ), { analytics: false, embeds: true, version: 1, ts: NOW } );
	assert.equal( S.choose( { type: 'clear' }, NOW ), null );
	assert.throws( () => S.choose( { type: 'nope' }, NOW ) );
} );

test( 'withdrawing analytics is detected', () => {
	const on = { analytics: true, embeds: false };
	assert.equal( S.withdrewAnalytics( on, { analytics: false, embeds: true } ), true );
	assert.equal( S.withdrewAnalytics( on, null ), true );
	assert.equal( S.withdrewAnalytics( null, on ), false );
	assert.equal( S.withdrewAnalytics( { analytics: false }, null ), false );
} );

test( 'GA cookie names are found in document.cookie', () => {
	assert.deepEqual( S.gaCookieNames( '_ga=GA1.1; _ga_ABC123=GS1; _gid=x; theme=dark; _gat=1' ), [ '_ga', '_ga_ABC123', '_gat' ] );
	assert.deepEqual( S.gaCookieNames( '' ), [] );
} );

test( 'cookie domains cover host-only and each parent', () => {
	assert.deepEqual( S.cookieDomains( 'www.elevationmanchester.org' ), [ '', '.www.elevationmanchester.org', '.elevationmanchester.org' ] );
	assert.deepEqual( S.cookieDomains( 'localhost' ), [ '' ] );
} );
```

Add `"test:js": "node --test tests/js/"` to `package.json` scripts.

Run: `docker compose run --rm node node --test tests/js/`
Expected: FAIL with `Cannot find module '../../assets/js/consent-state.js'`.

- [ ] **Step 2: Implement consent-state.js**

`wp-content/plugins/elevation-core/assets/js/consent-state.js`:

```js
/**
 * The consent record — pure functions shared by the browser runtime (consent.js) and the node tests.
 * Stored in localStorage "ecm.consent" as { analytics, embeds, version, ts }.
 */
( function ( root, factory ) {
	const api = factory();
	if ( typeof module === 'object' && module.exports ) {
		module.exports = api;
	} else {
		root.ecmConsentState = api;
	}
} )( typeof self !== 'undefined' ? self : this, function () {
	const VERSION = 1;
	const KEY = 'ecm.consent';
	const LEGACY_KEY = 'ecm.consent.embeds';

	function record( analytics, embeds, now ) {
		return { analytics: analytics, embeds: embeds, version: VERSION, ts: now };
	}

	function parseRecord( raw ) {
		if ( typeof raw !== 'string' ) {
			return null;
		}
		try {
			const value = JSON.parse( raw );
			if ( value && value.version === VERSION && typeof value.analytics === 'boolean' && typeof value.embeds === 'boolean' ) {
				return record( value.analytics, value.embeds, Number( value.ts ) || 0 );
			}
		} catch ( e ) {}
		return null;
	}

	/** The visitor's choice, or null for "not chosen". legacyRaw is the redesign's embeds-only key. */
	function parse( raw, legacyRaw, now ) {
		const current = parseRecord( raw );
		if ( current ) {
			return current;
		}
		if ( legacyRaw === 'granted' || legacyRaw === 'declined' ) {
			return record( false, legacyRaw === 'granted', now );
		}
		return null;
	}

	function choose( action, now ) {
		switch ( action.type ) {
			case 'acceptAll':
				return record( true, true, now );
			case 'rejectAll':
				return record( false, false, now );
			case 'save':
				return record( !! action.analytics, !! action.embeds, now );
			case 'clear':
				return null;
		}
		throw new Error( 'Unknown consent action: ' + action.type );
	}

	function serialise( state ) {
		return JSON.stringify( state );
	}

	function withdrewAnalytics( before, after ) {
		return !! ( before && before.analytics ) && ! ( after && after.analytics );
	}

	/** Names of the GA cookies (_ga, _ga_<id>, _gat) present in a document.cookie string. */
	function gaCookieNames( cookieString ) {
		return String( cookieString || '' )
			.split( ';' )
			.map( function ( part ) {
				return part.split( '=' )[ 0 ].trim();
			} )
			.filter( function ( name ) {
				return /^_ga/.test( name );
			} );
	}

	/** Domains a cookie for this host may have been set on: host-only (''), then each parent. */
	function cookieDomains( hostname ) {
		const parts = String( hostname ).split( '.' );
		const out = [ '' ];
		for ( let i = 0; i < parts.length - 1; i++ ) {
			out.push( '.' + parts.slice( i ).join( '.' ) );
		}
		return out;
	}

	return { VERSION, KEY, LEGACY_KEY, parse, choose, serialise, withdrewAnalytics, gaCookieNames, cookieDomains };
} );
```

Run: `docker compose run --rm node node --test tests/js/`
Expected: `# pass 9`, `# fail 0`.

- [ ] **Step 3: Write the failing EmbedGate tests**

`wp-content/plugins/elevation-core/tests/EmbedGateTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\EmbedGate;
use Elevation\Core\Settings;
use PHPUnit\Framework\TestCase;

final class EmbedGateTest extends TestCase {

	public function test_settings_map_embed_is_allowed(): void {
		$src = Settings::resolve( [] )['location']['embedUrl'];
		$this->assertSame( $src, EmbedGate::allowedSrc( 'map', $src ) );
	}

	public function test_nocookie_youtube_and_podbean_are_allowed(): void {
		$this->assertNotNull( EmbedGate::allowedSrc( 'video', 'https://www.youtube-nocookie.com/embed/abc123' ) );
		$this->assertNotNull( EmbedGate::allowedSrc( 'audio', 'https://www.podbean.com/player-v2/?i=ktx57-6f746-pbblog-playlist' ) );
	}

	/** @return array<string, array{string, string}> */
	public static function rejected(): array {
		return [
			'plain http'           => [ 'map', 'http://www.google.com/maps?q=x&output=embed' ],
			'lookalike host'       => [ 'map', 'https://www.google.com.evil.example/maps' ],
			'google, not maps'     => [ 'map', 'https://www.google.com/search?q=x' ],
			'tracking youtube'     => [ 'video', 'https://www.youtube.com/embed/abc123' ],
			'wrong kind for host'  => [ 'audio', 'https://www.youtube-nocookie.com/embed/abc123' ],
			'javascript url'       => [ 'video', 'javascript:alert(1)' ],
			'unknown kind'         => [ 'iframe', 'https://www.google.com/maps' ],
			'empty'                => [ 'map', '' ],
		];
	}

	#[\PHPUnit\Framework\Attributes\DataProvider( 'rejected' )]
	public function test_other_sources_are_rejected( string $kind, string $src ): void {
		$this->assertNull( EmbedGate::allowedSrc( $kind, $src ) );
	}

	public function test_copy_per_kind(): void {
		$this->assertSame( 'Show the map', EmbedGate::copy( 'map' )['button'] );
		$this->assertSame( 'Loads from YouTube', EmbedGate::copy( 'video' )['note'] );
		$this->assertSame( 'headphones', EmbedGate::copy( 'audio' )['icon'] );
		$this->assertSame( [], EmbedGate::copy( 'nope' ) );
	}
}
```

Run: `docker compose run --rm php vendor/bin/phpunit --filter EmbedGateTest`
Expected: FAIL with `Class "Elevation\Core\EmbedGate" not found`.

- [ ] **Step 4: Implement EmbedGate**

`wp-content/plugins/elevation-core/src/EmbedGate.php`:

```php
<?php
namespace Elevation\Core;

/**
 * Which third-party players the embed gate may load. Anything else renders nothing, so the privacy
 * notice's list of processors stays true whatever an editor pastes in.
 */
final class EmbedGate {

	private const RULES = [
		'map'   => [ 'hosts' => [ 'www.google.com', 'maps.google.com' ], 'path' => '/maps' ],
		'video' => [ 'hosts' => [ 'www.youtube-nocookie.com' ], 'path' => '/embed/' ],
		'audio' => [ 'hosts' => [ 'www.podbean.com' ], 'path' => '/player-v2/' ],
	];

	public static function allowedSrc( string $kind, string $src ): ?string {
		$rule  = self::RULES[ $kind ] ?? null;
		$parts = parse_url( $src );
		if ( null === $rule || ! is_array( $parts ) || 'https' !== ( $parts['scheme'] ?? '' ) ) {
			return null;
		}
		$host_ok = in_array( strtolower( $parts['host'] ?? '' ), $rule['hosts'], true );
		$path_ok = str_starts_with( $parts['path'] ?? '', $rule['path'] );
		return $host_ok && $path_ok ? $src : null;
	}

	/** @return array{button:string, note:string, icon:string, title:string}|array{} */
	public static function copy( string $kind ): array {
		return [
			'map'   => [ 'button' => 'Show the map', 'note' => 'Loads from Google Maps', 'icon' => 'map-pin', 'title' => 'Find us on the map' ],
			'video' => [ 'button' => 'Play the video', 'note' => 'Loads from YouTube', 'icon' => 'play', 'title' => 'Watch the video' ],
			'audio' => [ 'button' => 'Play the podcast', 'note' => 'Loads from Podbean', 'icon' => 'headphones', 'title' => 'Listen to the podcast' ],
		][ $kind ] ?? [];
	}
}
```

Require it from `elevation-core.php`.

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK (53 tests, …)`: 42 plus 11 (8 data-provider cases and 3 other tests).

- [ ] **Step 5: The consent runtime**

`wp-content/plugins/elevation-core/assets/js/consent.js`:

```js
/**
 * Consent runtime (spec §6.8): the banner, GA4 after analytics consent, embed gates and the
 * Privacy page controls. Needs consent-state.js; config in window.ecmConsentConfig = { ga4 }.
 */
( function () {
	const S = window.ecmConsentState;
	const config = window.ecmConsentConfig || {};
	const EVENT = 'ecm:consent-changed';

	const storage = {
		get: function ( key ) {
			try {
				return window.localStorage.getItem( key );
			} catch ( e ) {
				return null; // Private browsing can refuse storage: treat as "no choice yet".
			}
		},
		set: function ( key, value ) {
			try {
				if ( value === null ) {
					window.localStorage.removeItem( key );
				} else {
					window.localStorage.setItem( key, value );
				}
			} catch ( e ) {}
		},
	};

	const raw = storage.get( S.KEY );
	let state = S.parse( raw, storage.get( S.LEGACY_KEY ), Date.now() );
	if ( state && ! S.parse( raw, null, 0 ) ) {
		// Came from the redesign's legacy key: store it in the new format once and drop the old key.
		storage.set( S.KEY, S.serialise( state ) );
		storage.set( S.LEGACY_KEY, null );
	}

	/* ---------- GA4 ---------- */
	let gaLoaded = false;
	const gaId = /^G-[A-Z0-9]+$/.test( config.ga4 || '' ) ? config.ga4 : '';

	function loadAnalytics() {
		if ( ! gaId ) {
			return;
		}
		window[ 'ga-disable-' + gaId ] = false;
		if ( gaLoaded ) {
			return;
		}
		gaLoaded = true;
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () {
			window.dataLayer.push( arguments );
		};
		window.gtag( 'js', new Date() );
		window.gtag( 'config', gaId );
		const script = document.createElement( 'script' );
		script.async = true;
		script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent( gaId );
		document.head.appendChild( script );
	}

	function clearAnalytics() {
		if ( gaId ) {
			window[ 'ga-disable-' + gaId ] = true;
		}
		S.gaCookieNames( document.cookie ).forEach( function ( name ) {
			S.cookieDomains( window.location.hostname ).forEach( function ( domain ) {
				document.cookie = name + '=; Max-Age=0; path=/' + ( domain ? '; domain=' + domain : '' );
			} );
		} );
	}

	/* ---------- Embeds ---------- */
	function openEmbed( gate, focus ) {
		const template = gate && gate.querySelector( 'template' );
		if ( ! template ) {
			return;
		}
		gate.replaceChildren( template.content.cloneNode( true ) );
		gate.classList.add( 'is-loaded' );
		if ( focus ) {
			const frame = gate.querySelector( 'iframe' );
			if ( frame ) {
				frame.focus();
			}
		}
	}

	/* ---------- Banner ---------- */
	const banner = document.getElementById( 'ecm-consent' );
	let opener = null;

	function showBanner( withChoices ) {
		if ( ! banner ) {
			return;
		}
		banner.hidden = false;
		banner.querySelector( '.ecm-consent__choose' ).hidden = ! withChoices;
		banner.querySelector( '[name="analytics"]' ).checked = !! ( state && state.analytics );
		banner.querySelector( '[name="embeds"]' ).checked = !! ( state && state.embeds );
	}

	function hideBanner() {
		if ( banner ) {
			banner.hidden = true;
		}
		if ( opener ) {
			opener.focus();
			opener = null;
		}
	}

	/* ---------- Privacy page controls ---------- */
	function statusText() {
		if ( ! state ) {
			return "You haven't made a choice yet, so analytics is off and maps and videos wait until you click them.";
		}
		return ( state.analytics ? 'Analytics is on.' : 'Analytics is off.' ) +
			( state.embeds ? ' Maps and videos load automatically.' : ' Maps and videos wait until you click them.' );
	}

	function syncControls() {
		document.querySelectorAll( '[data-ecm-consent-controls]' ).forEach( function ( root ) {
			root.querySelector( '[data-ecm-status]' ).textContent = statusText();
			root.querySelector( '[name="analytics"]' ).checked = !! ( state && state.analytics );
			root.querySelector( '[name="embeds"]' ).checked = !! ( state && state.embeds );
			root.querySelector( '[data-ecm-controls-body]' ).hidden = false;
		} );
	}

	/* ---------- State ---------- */
	function sync() {
		if ( state && state.analytics ) {
			loadAnalytics();
		}
		if ( state && state.embeds ) {
			document.querySelectorAll( '[data-ecm-embed]:not(.is-loaded)' ).forEach( function ( gate ) {
				openEmbed( gate, false );
			} );
		}
		syncControls();
	}

	function apply( next ) {
		const before = state;
		state = next;
		storage.set( S.KEY, next ? S.serialise( next ) : null );
		if ( S.withdrewAnalytics( before, next ) ) {
			clearAnalytics();
		}
		sync();
		window.dispatchEvent( new CustomEvent( EVENT, { detail: state } ) );
	}

	document.addEventListener( 'click', function ( event ) {
		const load = event.target.closest( '[data-ecm-embed-load]' );
		if ( load ) {
			openEmbed( load.closest( '[data-ecm-embed]' ), true );
			return;
		}
		const open = event.target.closest( '[data-ecm-consent-open]' );
		if ( open && banner ) {
			event.preventDefault();
			opener = open;
			showBanner( true );
			banner.querySelector( '.ecm-consent__choose input' ).focus();
			return;
		}
		if ( event.target.closest( '[data-ecm-consent-clear]' ) ) {
			apply( S.choose( { type: 'clear' }, Date.now() ) );
			showBanner( false );
			return;
		}
		const action = event.target.closest( '[data-ecm-action]' );
		if ( ! action || ! banner ) {
			return;
		}
		const type = action.dataset.ecmAction;
		if ( type === 'choose' ) {
			showBanner( true );
			banner.querySelector( '.ecm-consent__choose input' ).focus();
			return;
		}
		apply( type === 'save'
			? S.choose( { type: 'save', analytics: banner.querySelector( '[name="analytics"]' ).checked, embeds: banner.querySelector( '[name="embeds"]' ).checked }, Date.now() )
			: S.choose( { type: type }, Date.now() ) );
		hideBanner();
	} );

	document.addEventListener( 'change', function ( event ) {
		const box = event.target.closest( '[data-ecm-consent-controls] input[type="checkbox"]' );
		if ( ! box ) {
			return;
		}
		const root = box.closest( '[data-ecm-consent-controls]' );
		apply( S.choose( { type: 'save', analytics: root.querySelector( '[name="analytics"]' ).checked, embeds: root.querySelector( '[name="embeds"]' ).checked }, Date.now() ) );
		if ( banner ) {
			banner.hidden = true;
		}
	} );

	if ( banner ) {
		banner.addEventListener( 'keydown', function ( event ) {
			if ( event.key === 'Escape' && state ) {
				hideBanner();
			}
		} );
	}

	window.addEventListener( 'storage', function ( event ) {
		if ( event.key !== S.KEY ) {
			return;
		}
		const before = state;
		state = S.parse( event.newValue, null, Date.now() );
		if ( S.withdrewAnalytics( before, state ) ) {
			clearAnalytics();
		}
		sync();
	} );

	document.querySelectorAll( '[data-ecm-embed-load]' ).forEach( function ( button ) {
		button.disabled = false;
	} );
	sync();
	if ( ! state ) {
		showBanner( false );
	}
	window.ecmConsent = {
		get: function () {
			return state;
		},
		open: function () {
			showBanner( true );
		},
	};
} )();
```

- [ ] **Step 6: Enqueue, configure and render the banner**

`wp-content/plugins/elevation-core/includes/consent.php`:

```php
<?php
/**
 * Consent banner and runtime (spec §6.8). Nothing from Google loads until the visitor chooses.
 * The banner is printed first in <body> so keyboard and screen-reader users reach it first.
 */
defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', function () {
	$dir  = ELEVATION_CORE_DIR . 'assets/';
	$args = [ 'in_footer' => true, 'strategy' => 'defer' ];
	wp_register_script( 'elevation-consent-state', ELEVATION_CORE_URL . 'assets/js/consent-state.js', [], (string) filemtime( $dir . 'js/consent-state.js' ), $args );
	wp_enqueue_script( 'elevation-consent', ELEVATION_CORE_URL . 'assets/js/consent.js', [ 'elevation-consent-state' ], (string) filemtime( $dir . 'js/consent.js' ), $args );
	$config = apply_filters( 'elevation_consent_config', [ 'ga4' => (string) elevation_setting( 'analytics.ga4MeasurementId' ) ] );
	wp_add_inline_script( 'elevation-consent', 'window.ecmConsentConfig = ' . wp_json_encode( $config ) . ';', 'before' );
	wp_enqueue_style( 'elevation-consent', ELEVATION_CORE_URL . 'assets/css/consent.css', [], (string) filemtime( $dir . 'css/consent.css' ) );
} );

add_action( 'wp_body_open', function () {
	$privacy = esc_url( home_url( '/privacy/#cookies' ) );
	?>
	<section id="ecm-consent" class="ecm-consent" aria-labelledby="ecm-consent-title" hidden>
		<div class="ecm-consent__panel">
			<h2 id="ecm-consent-title" class="ecm-consent__title">Your privacy choices</h2>
			<p class="ecm-consent__text">We'd like to use Google Analytics to see how people use this site, and to show maps and videos from Google and Podbean. None of it loads until you say so. <a href="<?php echo $privacy; ?>">How we use your information</a></p>
			<div class="ecm-consent__choose" hidden>
				<label class="ecm-consent__option"><input type="checkbox" name="analytics"> <span><strong>Analytics</strong> Google Analytics counts visits and which pages help people. It sets _ga cookies.</span></label>
				<label class="ecm-consent__option"><input type="checkbox" name="embeds"> <span><strong>Maps &amp; videos</strong> Load Google Maps, YouTube and Podbean players without asking each time.</span></label>
				<button type="button" class="ecm-consent__btn" data-ecm-action="save">Save my choices</button>
			</div>
			<div class="ecm-consent__actions">
				<button type="button" class="ecm-consent__btn" data-ecm-action="acceptAll">Accept all</button>
				<button type="button" class="ecm-consent__btn" data-ecm-action="rejectAll">Reject all</button>
				<button type="button" class="ecm-consent__btn ecm-consent__btn--ghost" data-ecm-action="choose">Choose</button>
			</div>
		</div>
	</section>
	<?php
} );
```

Require it from `elevation-core.php`.

"Accept all" and "Reject all" share one style, as the spec asks for equal prominence.

`wp-content/plugins/elevation-core/assets/css/consent.css`:

```css
/* Consent banner: ink panel and pill buttons, in the redesign's style. */
.ecm-consent { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 250; display: flex; justify-content: center; }
.ecm-consent[hidden] { display: none; }
.ecm-consent__panel {
	box-sizing: border-box; width: 100%; max-width: 720px; padding: 20px 24px; border-radius: 22px;
	background: var(--wp--preset--color--ink, #0e0e2c); color: rgb(255 255 255 / 0.8);
	box-shadow: 0 24px 60px rgb(14 14 44 / 0.16); font-size: 14px; line-height: 1.6;
}
.ecm-consent__title { margin: 0 0 6px; font-family: var(--wp--preset--font-family--sora, sans-serif); font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: #fff; }
.ecm-consent__text { margin: 0 0 14px; }
.ecm-consent__text a { color: var(--wp--preset--color--green, #84c224); }
.ecm-consent__actions, .ecm-consent__choose { display: flex; flex-wrap: wrap; gap: 10px; }
.ecm-consent__choose { flex-direction: column; align-items: flex-start; margin-bottom: 14px; }
.ecm-consent__choose[hidden] { display: none; }
.ecm-consent__option { display: flex; gap: 10px; align-items: flex-start; }
.ecm-consent__option input { flex-shrink: 0; width: 18px; height: 18px; margin: 3px 0 0; accent-color: var(--wp--preset--color--green, #84c224); }
.ecm-consent__option strong { display: block; color: #fff; }
.ecm-consent__btn {
	padding: 10px 20px; border: 1.5px solid transparent; border-radius: 9999px; cursor: pointer;
	background: var(--wp--preset--color--green, #84c224); color: var(--wp--preset--color--ink, #0e0e2c);
	font-family: var(--wp--preset--font-family--sora, sans-serif); font-size: 14px; font-weight: 600;
}
.ecm-consent__btn:hover { background: var(--wp--preset--color--green-600, #6fa61c); }
.ecm-consent__btn--ghost { background: transparent; color: #fff; border-color: rgb(255 255 255 / 0.35); }
.ecm-consent__btn--ghost:hover { background: transparent; border-color: #fff; }
.ecm-consent__btn:focus-visible, .ecm-consent__text a:focus-visible, .ecm-consent__option input:focus-visible { outline: 2px solid var(--wp--preset--color--green, #84c224); outline-offset: 2px; }
```

In `wp-content/mu-plugins/local-dev.php`, append:

```php
// Local pages must never count in the church's real GA4 property.
add_filter( 'elevation_consent_config', function ( array $config ) {
	$config['ga4'] = 'G-LOCAL0000';
	return $config;
} );
```

- [ ] **Step 7: The embed-gate block**

`src/blocks/embed-gate/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/embed-gate",
  "title": "Map, video or podcast (click to load)",
  "category": "embed",
  "icon": "location-alt",
  "description": "A Google map, YouTube video or Podbean player that loads only when the visitor asks, or has allowed maps and videos.",
  "attributes": {
    "kind": { "type": "string", "enum": [ "map", "video", "audio" ], "default": "map" },
    "title": { "type": "string", "default": "" },
    "src": { "type": "string", "default": "" },
    "link": { "type": "string", "default": "" },
    "aspectRatio": { "type": "string", "enum": [ "16/9", "4/3" ], "default": "16/9" },
    "height": { "type": "number", "default": 0 }
  },
  "supports": { "html": false, "align": [ "wide", "full" ], "spacing": { "margin": true } },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "style": "file:./style-index.css",
  "render": "file:./render.php"
}
```

`src/blocks/embed-gate/render.php`:

```php
<?php
/**
 * Placeholder with a load button; the iframe waits in a <template> until consent.js opens it.
 * Sources outside EmbedGate's allow-list render nothing.
 */
use Elevation\Core\EmbedGate;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_kind = (string) ( $attributes['kind'] ?? 'map' );
$elevation_src  = (string) ( $attributes['src'] ?? '' );
$elevation_link = (string) ( $attributes['link'] ?? '' );
if ( 'map' === $elevation_kind ) {
	$elevation_src  = '' !== $elevation_src ? $elevation_src : (string) elevation_setting( 'location.embedUrl' );
	$elevation_link = '' !== $elevation_link ? $elevation_link : (string) elevation_setting( 'location.mapsUrl' );
}
$elevation_src  = EmbedGate::allowedSrc( $elevation_kind, $elevation_src );
$elevation_copy = EmbedGate::copy( $elevation_kind );
if ( null === $elevation_src || ! $elevation_copy ) {
	return;
}
$elevation_title       = '' !== (string) ( $attributes['title'] ?? '' ) ? (string) $attributes['title'] : $elevation_copy['title'];
$elevation_frame_title = 'map' === $elevation_kind ? 'Map showing ' . elevation_setting( 'location.full' ) : $elevation_title;
$elevation_height      = max( 0, (int) ( $attributes['height'] ?? 0 ) );
$elevation_ratio       = in_array( $attributes['aspectRatio'] ?? '', [ '16/9', '4/3' ], true ) ? $attributes['aspectRatio'] : '16/9';
$elevation_style       = $elevation_height > 0 ? 'height:' . $elevation_height . 'px' : 'aspect-ratio:' . $elevation_ratio;
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'is-kind-' . $elevation_kind, 'style' => $elevation_style, 'data-ecm-embed' => $elevation_kind ] ); ?>>
	<div class="embed-gate__placeholder">
		<span class="embed-gate__icon"><?php echo Icons::svg( $elevation_copy['icon'] ); ?></span>
		<p class="embed-gate__title"><?php echo esc_html( $elevation_title ); ?></p>
		<button type="button" class="embed-gate__button" data-ecm-embed-load disabled><?php echo Icons::svg( $elevation_copy['icon'] ); ?><?php echo esc_html( $elevation_copy['button'] ); ?></button>
		<p class="embed-gate__note"><?php echo esc_html( $elevation_copy['note'] ); ?><?php if ( '' !== $elevation_link ) : ?> · <a href="<?php echo esc_url( $elevation_link ); ?>" target="_blank" rel="noreferrer">Open in a new tab</a><?php endif; ?></p>
	</div>
	<template><iframe src="<?php echo esc_url( $elevation_src ); ?>" title="<?php echo esc_attr( $elevation_frame_title ); ?>" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></template>
</div>
```

`src/blocks/embed-gate/style.css`:

```css
.wp-block-elevation-embed-gate { position: relative; box-sizing: border-box; width: 100%; overflow: hidden; border-radius: 14px; }
.wp-block-elevation-embed-gate:not(.is-loaded) {
	display: grid; place-items: center; padding: 32px; text-align: center;
	background: var(--wp--preset--color--grey-100); border: 1px dashed var(--wp--preset--color--grey-300);
}
.wp-block-elevation-embed-gate iframe { display: block; width: 100%; height: 100%; border: 0; }
.embed-gate__placeholder { max-width: 384px; }
.embed-gate__icon {
	display: grid; place-items: center; width: 48px; height: 48px; margin: 0 auto; border-radius: 18px;
	background: rgb(255 255 255 / 0.8); color: var(--wp--preset--color--green-700);
}
.embed-gate__icon svg { width: 20px; height: 20px; }
.embed-gate__title { margin: 16px 0 0; font-family: var(--wp--preset--font-family--sora); font-weight: 700; color: var(--wp--preset--color--ink); }
.embed-gate__button {
	display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; padding: 10px 20px; border: 0; border-radius: 9999px; cursor: pointer;
	background: var(--wp--preset--color--green); color: var(--wp--preset--color--ink);
	font-family: var(--wp--preset--font-family--sora); font-size: 14px; font-weight: 700;
}
.embed-gate__button svg { width: 16px; height: 16px; }
.embed-gate__button:hover { filter: brightness(1.05); }
.embed-gate__button:disabled { opacity: 0.5; cursor: default; }
.embed-gate__button:focus-visible, .embed-gate__note a:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 2px; }
.embed-gate__note { margin: 12px 0 0; font-size: 12px; color: var(--wp--preset--color--grey-500); }
.embed-gate__note a { color: var(--wp--preset--color--ink); }
```

`src/blocks/embed-gate/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, __experimentalNumberControl as NumberControl } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes } ) => (
		<>
			<InspectorControls>
				<PanelBody title="Embed">
					<SelectControl
						label="Type"
						value={ attributes.kind }
						options={ [ { label: 'Google map', value: 'map' }, { label: 'YouTube video (youtube-nocookie.com/embed/…)', value: 'video' }, { label: 'Podbean player', value: 'audio' } ] }
						onChange={ ( kind ) => setAttributes( { kind } ) }
					/>
					<TextControl label="Title" value={ attributes.title } onChange={ ( title ) => setAttributes( { title } ) } />
					<TextControl label="Embed address" help="Leave blank on a map to use the church's address." value={ attributes.src } onChange={ ( src ) => setAttributes( { src } ) } />
					<TextControl label="Open-in-new-tab link" value={ attributes.link } onChange={ ( link ) => setAttributes( { link } ) } />
					<SelectControl label="Shape" value={ attributes.aspectRatio } options={ [ { label: 'Wide (16:9)', value: '16/9' }, { label: 'Standard (4:3)', value: '4/3' } ] } onChange={ ( aspectRatio ) => setAttributes( { aspectRatio } ) } />
					<NumberControl label="Fixed height in px (0 = use the shape)" value={ attributes.height } min={ 0 } onChange={ ( height ) => setAttributes( { height: Number( height ) || 0 } ) } />
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<ServerSideRender block={ metadata.name } attributes={ attributes } />
			</div>
		</>
	),
} );
```

- [ ] **Step 8: The consent-controls block**

`src/blocks/consent-controls/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/consent-controls",
  "title": "Privacy choices",
  "category": "widgets",
  "icon": "privacy",
  "description": "Lets visitors see and change their analytics and maps/videos choices. For the Privacy page.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "style": "file:./style-index.css",
  "render": "file:./render.php"
}
```

`src/blocks/consent-controls/render.php`:

```php
<?php
/** Privacy page controls; consent.js fills in the status and reveals the toggles. */
defined( 'ABSPATH' ) || exit;
?>
<div <?php echo get_block_wrapper_attributes( [ 'data-ecm-consent-controls' => '' ] ); ?>>
	<p class="consent-controls__status" data-ecm-status role="status">Your choices are saved in this browser. Turn on JavaScript to change them here.</p>
	<div class="consent-controls__body" data-ecm-controls-body hidden>
		<label class="consent-controls__option"><input type="checkbox" name="analytics"> Analytics (Google Analytics)</label>
		<label class="consent-controls__option"><input type="checkbox" name="embeds"> Maps and videos (Google Maps, YouTube, Podbean)</label>
		<button type="button" class="consent-controls__clear" data-ecm-consent-clear>Clear my choice</button>
	</div>
</div>
```

`src/blocks/consent-controls/style.css`:

```css
.wp-block-elevation-consent-controls { padding: 20px 24px; border-radius: 14px; background: var(--wp--preset--color--grey-50); border: 1px solid var(--wp--preset--color--grey-100); }
.consent-controls__status { margin: 0; font-weight: 500; color: var(--wp--preset--color--ink); }
.consent-controls__body { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; margin-top: 14px; }
.consent-controls__body[hidden] { display: none; }
.consent-controls__option { display: flex; gap: 10px; align-items: center; }
.consent-controls__option input { width: 18px; height: 18px; accent-color: var(--wp--preset--color--green-700); }
.consent-controls__clear {
	margin-top: 4px; padding: 9px 18px; border-radius: 9999px; cursor: pointer; background: transparent;
	border: 1.5px solid var(--wp--preset--color--grey-300); color: var(--wp--preset--color--ink);
	font-family: var(--wp--preset--font-family--sora); font-size: 14px; font-weight: 600;
}
.consent-controls__clear:hover { border-color: var(--wp--preset--color--ink); }
.consent-controls__clear:focus-visible, .consent-controls__option input:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 2px; }
```

`src/blocks/consent-controls/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<ServerSideRender block={ metadata.name } />
		</div>
	),
} );
```

- [ ] **Step 9: Add "Cookie settings" to the footer**

In `wp-content/themes/elevation/parts/footer.html`, change the second paragraph of `.footer-bottom` to:

```html
	<p><a href="/privacy">Privacy &amp; cookies</a> <span aria-hidden="true" class="footer-bottom__dot">·</span> <a href="/privacy#cookies" data-ecm-consent-open>Cookie settings</a> <span aria-hidden="true" class="footer-bottom__dot">·</span> <span>{church.legalName} · registered charity no. {church.charityNumber}</span></p>
```

Without JS the link simply goes to the privacy notice's cookies section.

- [ ] **Step 10: Build and run all tests**

```bash
docker compose run --rm node npm run build
docker compose run --rm node node --test tests/js/
docker compose run --rm php vendor/bin/phpunit
```

Expected:
- The build lists `embed-gate` and `consent-controls`.
- The JS tests pass 9, fail 0.
- PHPUnit reports `OK (53 tests, …)`.

- [ ] **Step 11: Scratch page for the browser checks**

```bash
docker compose run --rm -T wpcli bash -c 'cat > /tmp/t.html <<EOF
<!-- wp:elevation/embed-gate {"aspectRatio":"4/3"} /-->
<!-- wp:elevation/embed-gate {"kind":"video","src":"https://www.youtube-nocookie.com/embed/jNQXAC9IVRw","title":"A video"} /-->
<!-- wp:elevation/embed-gate {"kind":"video","src":"https://www.youtube.com/embed/jNQXAC9IVRw"} /-->
<!-- wp:elevation/consent-controls /-->
EOF
wp --user=admin elevation seed page consent-test /tmp/t.html --title=T'
curl -s http://localhost:8080/consent-test/ | grep -c 'data-ecm-embed='
curl -s http://localhost:8080/consent-test/ | grep -o 'ecmConsentConfig = {[^;]*'
```

Expected:
- `2`: the youtube.com (non-nocookie) gate renders nothing.
- `ecmConsentConfig = {"ga4":"G-LOCAL0000"}`.

- [ ] **Step 12: Browser checks (Review Focus 3 and 5)**

Use the browser pane. If the implementer has no browser tools, report `DONE_WITH_CONCERNS` and list this step as "for the controller". Start from a clean state each time with `localStorage.clear()` and a reload.

1. Load `/consent-test/`. Run `performance.getEntriesByType('resource').map(e => e.name).filter(n => /google|gstatic|youtube|podbean|doubleclick/.test(n))`. It must be `[]`. The banner is visible.
2. Press Tab once from the top of the page. Focus lands on "How we use your information" inside the banner, before the skip link or header. Press Escape: the banner stays open, because no choice exists yet.
3. Click "Reject all". The banner hides. The resource check is still `[]`. `localStorage['ecm.consent']` has `"analytics":false,"embeds":false`. Click "Show the map". Only that map loads, and the second gate is still a placeholder.
4. Clear storage and reload. Click "Accept all". There is a request to `googletagmanager.com/gtag/js?id=G-LOCAL0000`, and both embeds load.
5. Set `document.cookie = '_ga=GA1.1.x; path=/'`. Toggle Analytics off in the Privacy choices block. `document.cookie` no longer contains `_ga`. The status reads "Analytics is off. Maps and videos load automatically."
6. Click "Clear my choice". The banner reappears.
7. Legacy key: run `localStorage.clear(); localStorage.setItem('ecm.consent.embeds','granted')` and reload. The banner does not show, both embeds load, `ecm.consent` exists and `ecm.consent.embeds` is gone.
8. Storage that throws: clear storage and reload. In the console, run `Storage.prototype.setItem = () => { throw new DOMException( 'denied', 'SecurityError' ); }`, then click "Accept all". There is no console error, the banner hides and gtag loads; the choice lasts only for this page view. `storage.get` and `storage.set` wrap every access in try/catch, and reading is covered by review.
9. The footer's "Cookie settings" opens the banner with the choices panel and focus on the first checkbox. Escape closes it and returns focus to the link.

Then delete the page:
```bash
docker compose run --rm -T wpcli wp --user=admin post delete $(docker compose run --rm -T wpcli wp --user=admin post list --post_type=page --name=consent-test --field=ID) --force
```

- [ ] **Step 13: Commit**

```bash
git add wp-content/plugins/elevation-core wp-content/mu-plugins/local-dev.php wp-content/themes/elevation/parts/footer.html
git commit -m "Consent banner and store, GA4 only after consent, click-to-load embed gate, Privacy choices block

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Editor tools — settings tokens and large buttons

**Files:**
- Create: `wp-content/plugins/elevation-core/src/editor/index.js`
- Create: `wp-content/plugins/elevation-core/includes/editor.php`
- Modify: `wp-content/plugins/elevation-core/package.json` (the build script)
- Modify: `wp-content/plugins/elevation-core/elevation-core.php` (require `includes/editor.php`)
- Build: `wp-content/plugins/elevation-core/build/editor/`

**Interfaces:**
- Consumes:
  - `elevation_public_setting()` and `Settings::publicValues()`;
  - `elevation_settings_label( string $key ): string` (in `settings-page.php`);
  - the theme's `.is-size-lg` button CSS (Plan 1).
- Produces:
  - A toolbar button "Insert church setting" on every rich-text field. It inserts `{group.key}` at the cursor.
  - A "Large button" toggle in the core Button sidebar, which adds or removes the class `is-size-lg`. This is the Plan 1 carry-forward.

- [ ] **Step 1: Two build entry points**

In `package.json`, set:

```json
    "build": "wp-scripts build --webpack-src-dir=src/blocks --output-path=build/blocks --webpack-copy-php && wp-scripts build src/editor/index.js --output-path=build/editor",
    "start": "wp-scripts start --webpack-src-dir=src/blocks --output-path=build/blocks --webpack-copy-php",
```

- [ ] **Step 2: The editor script**

`wp-content/plugins/elevation-core/src/editor/index.js`:

```js
/**
 * Editor additions:
 * - "Insert church setting" on every rich-text toolbar: inserts {group.key}, which the site replaces
 *   with the current Church Settings value when the page is shown (spec §6.1).
 * - "Large button" toggle for core/button (adds is-size-lg alongside the colour style).
 */
import { registerFormatType, insert } from '@wordpress/rich-text';
import { RichTextToolbarButton, InspectorControls } from '@wordpress/block-editor';
import { Popover, MenuGroup, MenuItem, SearchControl, PanelBody, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

const TOKENS = window.elevationTokens || [];

function TokenButton( { value, onChange, contentRef } ) {
	const [ open, setOpen ] = useState( false );
	const [ search, setSearch ] = useState( '' );
	const needle = search.toLowerCase();
	const matches = TOKENS.filter( ( t ) => `${ t.label } ${ t.key } ${ t.value }`.toLowerCase().includes( needle ) ).slice( 0, 40 );
	return (
		<>
			<RichTextToolbarButton icon="database" title="Insert church setting" onClick={ () => setOpen( ( o ) => ! o ) } isActive={ open } />
			{ open && (
				<Popover anchor={ contentRef?.current } placement="bottom-start" onClose={ () => setOpen( false ) }>
					<div style={ { padding: 12, width: 340 } }>
						<SearchControl label="Find a setting" value={ search } onChange={ setSearch } />
						<MenuGroup label="Shows the current value from Settings → Church">
							{ matches.map( ( t ) => (
								<MenuItem
									key={ t.key }
									info={ String( t.value ) }
									onClick={ () => {
										onChange( insert( value, `{${ t.key }}` ) );
										setOpen( false );
									} }
								>
									{ t.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					</div>
				</Popover>
			) }
		</>
	);
}

registerFormatType( 'elevation/token', {
	title: 'Church setting',
	tagName: 'span',
	className: 'elevation-token',
	edit: TokenButton,
} );

const withLargeToggle = createHigherOrderComponent( ( BlockEdit ) => ( props ) => {
	if ( props.name !== 'core/button' ) {
		return <BlockEdit { ...props } />;
	}
	const classes = ( props.attributes.className || '' ).split( /\s+/ ).filter( Boolean );
	const large = classes.includes( 'is-size-lg' );
	const toggle = ( on ) => {
		const next = classes.filter( ( c ) => c !== 'is-size-lg' );
		if ( on ) {
			next.push( 'is-size-lg' );
		}
		props.setAttributes( { className: next.length ? next.join( ' ' ) : undefined } );
	};
	return (
		<>
			<BlockEdit { ...props } />
			<InspectorControls>
				<PanelBody title="Size">
					<ToggleControl label="Large button" checked={ large } onChange={ toggle } />
				</PanelBody>
			</InspectorControls>
		</>
	);
}, 'withLargeToggle' );

addFilter( 'editor.BlockEdit', 'elevation/button-size', withLargeToggle );
```

- [ ] **Step 3: Enqueue it with the token list**

`wp-content/plugins/elevation-core/includes/editor.php`:

```php
<?php
/** Block editor additions: the settings-token button and the large-button toggle (src/editor). */
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

/** Tokens offered in the editor: public settings people put in copy (not hero slides or tracking IDs). */
function elevation_editor_tokens(): array {
	$groups = [ 'church', 'service', 'location', 'contact', 'socials', 'giving', 'site' ];
	$tokens = [];
	foreach ( Settings::publicValues( elevation_settings() ) as $key => $value ) {
		if ( ! in_array( strtok( $key, '.' ), $groups, true ) ) {
			continue;
		}
		$tokens[] = [
			'key'   => $key,
			'label' => ucfirst( strtok( $key, '.' ) ) . ' · ' . elevation_settings_label( $key ),
			'value' => (string) $value,
		];
	}
	return $tokens;
}

add_action( 'enqueue_block_editor_assets', function () {
	$asset_file = ELEVATION_CORE_DIR . 'build/editor/index.asset.php';
	if ( ! is_readable( $asset_file ) ) {
		return;
	}
	$asset = include $asset_file;
	wp_enqueue_script( 'elevation-editor', ELEVATION_CORE_URL . 'build/editor/index.js', $asset['dependencies'], $asset['version'], true );
	wp_add_inline_script( 'elevation-editor', 'window.elevationTokens = ' . wp_json_encode( elevation_editor_tokens() ) . ';', 'before' );
} );
```

Derived keys such as `service.arrivalNote` or `location.full` have no settings label; `elevation_settings_label()` humanises the last segment, so they read "Service · Arrival note". That is fine.

- [ ] **Step 4: Build and verify**

```bash
docker compose run --rm node npm run build
ls wp-content/plugins/elevation-core/build/editor/
docker compose run --rm -T wpcli wp --user=admin eval 'echo count( elevation_editor_tokens() ), " ", elevation_editor_tokens()[0]["label"], "\n";'
```

Expected:
- `build/editor/` contains `index.js` and `index.asset.php`.
- The count is above 30, and the first label is `Church · Name`.

In the browser, create a draft page and add a paragraph.
- The toolbar's "More" (chevron) menu shows "Insert church setting".
- Searching "start" and clicking "Service · Start time" inserts `{service.startTime}`.
- Preview shows `10:30am`.
- Add a Button, choose the Navy style and turn on "Large button". The Code editor shows `"className":"is-style-navy is-size-lg"`, and the front end shows the 16px/30px button.
- Delete the draft.

- [ ] **Step 5: Commit**

```bash
git add wp-content/plugins/elevation-core
git commit -m "Editor: insert-church-setting toolbar button and large-button toggle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Section styles, reveal, hero marker and the block validator

**Files:**
- Modify: `wp-content/themes/elevation/functions.php`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append)
- Create: `wp-content/themes/elevation/assets/js/reveal.js`
- Modify: `wp-content/themes/elevation/assets/js/header.js`
- Create: `bin/validate-blocks.js`

**Interfaces:**
- Consumes: the Plan 1 block styles (button `navy`, `ghost`, `ghost-on-dark`; paragraph `eyebrow`, `eyebrow-on-ink`; group `card`, `card-ink`, `strip-green`; image `rounded-2xl`) and `--header-h`.
- Produces, used by every pattern and page in Tasks 7–12:
  - **Block styles:**
    - group `page-hero`, `section-ink`, `card-flat`, `panel` and `panel-alert`;
    - paragraph `lead` and `lead-on-ink`;
    - list `badges`;
    - details `accordion`;
    - cover `portrait`.
  - **Structure classes:**
    - `site-hero` and its `__content`, `__lead`, `__facts`, `__fact`, `__fact-label` and `__fact-sub` parts;
    - `section-heading` (plus `is-centered`) and `section-head-row`;
    - `grid-2`, `grid-3`, `grid-3-lg`, `grid-4`, `grid-2-3` and `grid-sm2-lg3`, with `span-2`;
    - `split`, plus the `split--story`, `split--form` and `split--watch` variants;
    - `cta-band__row`, `card__media`, `card__badge`, `card__body` and `card__cta`;
    - `card__tile`, `card--green`, `card--feature` and `card--ink`;
    - `value-card`, `value-card__letter` and `value-card__name`;
    - `growth-track`, `growth-step`, `growth-step__number` and `growth-step__scripture`;
    - `accordion__scripture`;
    - `leader`, `leader__role` and `leader__bio`;
    - `aside-stack` and `aside-heading`;
    - `watch-tile`, `watch-tile__chip`, `watch-tile__play` and `watch-intro`;
    - `card-gathering`, `card-gathering__meta`, `card-soon` and `card-soon__tile`;
    - `panel-watch`, `form-slot`, `form-box`, `map-band` and `media-frame`;
    - `address-block`, `dl-label`, `dl-value`, `is-mono` and `rich-text`;
    - `stats`, `stat__number` and `stat__label`;
    - `date-card` and its `__tile`, `__day`, `__month` and `__meta` parts;
    - the margin utilities `mt-8`, `mt-10`, `mt-11`, `mt-12` and `mt-14`;
    - `reveal`, `link-arrow`, `has-arrow` and `has-play`.
  - **Header:** it goes over the hero only when the page has a `.site-hero`.
  - **Validator:** `bin/validate-blocks.js`, a console snippet that lists invalid blocks in every page and every `elevation/*` pattern.

- [ ] **Step 1: Register the block styles and the reveal script**

In `wp-content/themes/elevation/functions.php`, replace the `$styles` array with:

```php
	$styles = [
		'core/button'    => [ 'navy' => 'Navy', 'ghost' => 'Ghost', 'ghost-on-dark' => 'Ghost on dark' ],
		'core/paragraph' => [ 'eyebrow' => 'Eyebrow', 'eyebrow-on-ink' => 'Eyebrow on dark', 'lead' => 'Lead', 'lead-on-ink' => 'Lead on dark' ],
		'core/group'     => [
			'card'        => 'Card',
			'card-ink'    => 'Card on dark',
			'card-flat'   => 'Flat card',
			'strip-green' => 'Green strip',
			'panel'       => 'Grey panel',
			'panel-alert' => 'Alert panel',
			'page-hero'   => 'Page hero',
			'section-ink' => 'Dark section',
		],
		'core/image'     => [ 'rounded-2xl' => 'Rounded' ],
		'core/list'      => [ 'badges' => 'Badges' ],
		'core/details'   => [ 'accordion' => 'Accordion' ],
		'core/cover'     => [ 'portrait' => 'Portrait card' ],
	];
```

In the `wp_enqueue_scripts` callback, add:

```php
	wp_enqueue_script( 'elevation-reveal', get_theme_file_uri( 'assets/js/reveal.js' ), [], (string) filemtime( get_theme_file_path( 'assets/js/reveal.js' ) ), [ 'strategy' => 'defer', 'in_footer' => true ] );
```

- [ ] **Step 2: Reveal**

`wp-content/themes/elevation/assets/js/reveal.js`:

```js
/**
 * Fade-up on scroll for .reveal elements (redesign reveal.tsx). The hiding CSS only applies once
 * this has set data-reveal-ready, so without JS — or under reduced motion — everything stays visible.
 */
( () => {
	if ( ! ( 'IntersectionObserver' in window ) || window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		return;
	}
	document.documentElement.dataset.revealReady = 'true';
	const observer = new IntersectionObserver( ( entries ) => {
		for ( const entry of entries ) {
			if ( entry.isIntersecting ) {
				entry.target.classList.add( 'is-visible' );
				observer.unobserve( entry.target );
			}
		}
	}, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 } );
	document.querySelectorAll( '.reveal' ).forEach( ( el ) => observer.observe( el ) );
} )();
```

- [ ] **Step 3: Header over the hero only where a hero exists**

In `wp-content/themes/elevation/assets/js/header.js`:
- Replace `const isHome = document.body.classList.contains( 'home' );` with `const hasHero = !! document.querySelector( '.site-hero' );`.
- In `update()`, replace `isHome && ! scrolled` with `hasHero && ! scrolled`.
- Update the file's opening comment: "…transparent "over hero" state on pages whose content starts with a .site-hero…".

- [ ] **Step 4: Section styles**

Append to `wp-content/themes/elevation/assets/css/site.css`:

```css
/* ================= Plan 2: sections, cards and patterns ================= */
:root {
	--icon-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12h14'/%3E%3Cpath d='m12 5 7 7-7 7'/%3E%3C/svg%3E");
	--icon-play: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpolygon points='6 3 20 12 6 21 6 3' fill='black'/%3E%3C/svg%3E");
	--icon-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
	--glow: radial-gradient(circle, rgb(132 194 36 / 0.3), transparent 65%);
}

/* Full-width bands sit edge to edge. */
.wp-block-post-content > .alignfull { margin-block: 0; }

/* Margin utilities (the redesign's mt-8 … mt-14). */
.mt-8 { margin-top: 2rem !important; }
.mt-10 { margin-top: 2.5rem !important; }
.mt-11 { margin-top: 2.75rem !important; }
.mt-12 { margin-top: 3rem !important; }
.mt-14 { margin-top: 3.5rem !important; }

/* Text */
.is-style-lead { font-size: 18px; color: var(--wp--preset--color--grey-500); text-wrap: pretty; }
.is-style-lead-on-ink { font-size: 18px; color: rgb(255 255 255 / 0.6); text-wrap: pretty; }
.is-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.link-arrow a, .card__cta a { color: var(--wp--preset--color--green-700); text-decoration: none; font-family: var(--wp--preset--font-family--sora); font-weight: 600; }
.wp-block-button.has-arrow .wp-block-button__link::after,
.link-arrow a::after,
.card__cta a::after {
	content: ""; display: inline-block; width: 16px; height: 16px; margin-left: 8px; vertical-align: -3px;
	background: currentColor; -webkit-mask: var(--icon-arrow) center / contain no-repeat; mask: var(--icon-arrow) center / contain no-repeat;
	transition: margin-left 0.2s ease;
}
.wp-block-button.has-play .wp-block-button__link::before {
	content: ""; display: inline-block; width: 16px; height: 16px; margin-right: 8px; vertical-align: -3px;
	background: currentColor; -webkit-mask: var(--icon-play) center / contain no-repeat; mask: var(--icon-play) center / contain no-repeat;
}

/* Section heading: eyebrow, h2, lead; 620px wide, 52px below. */
.section-heading { margin-bottom: 3.25rem; }
.section-heading > * { margin-block: 0; }
.section-heading > h2 { margin-block: 14px; text-wrap: balance; }
.section-heading.is-centered { text-align: center; }
.section-head-row { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 3.25rem; }
.section-head-row > .section-heading { margin-bottom: 0; }

/* Glows (the redesign's brand-glow) */
.is-style-page-hero, .is-style-section-ink, .site-hero, .card-gathering { position: relative; overflow: hidden; }
.is-style-page-hero::before, .is-style-section-ink::before, .site-hero::after, .card-gathering::before {
	content: ""; position: absolute; border-radius: 50%; pointer-events: none; background: var(--glow);
}
.is-style-page-hero::before { top: -200px; right: -100px; width: 500px; height: 500px; }
.is-style-section-ink::before { bottom: -200px; left: -120px; width: 500px; height: 500px; opacity: 0.6; }
.site-hero::after { top: -160px; right: -120px; width: 600px; height: 600px; filter: blur(20px); z-index: 1; }
.card-gathering::before { top: -80px; right: -60px; width: 280px; height: 280px; }
.is-style-page-hero > *, .is-style-section-ink > *, .card-gathering > * { position: relative; z-index: 1; }

/* Page hero (interior pages) */
.is-style-page-hero > * { margin-block: 0; }
.is-style-page-hero > * + * { margin-block-start: 12px; }
.is-style-page-hero > h1 { text-wrap: balance; }
.is-style-page-hero > .is-style-lead-on-ink { max-width: 560px; color: rgb(255 255 255 / 0.66); }

/* Home hero: under the sticky header, full viewport height. */
.site-hero { margin-top: calc(var(--header-h) * -1) !important; min-height: 100dvh; display: flex; align-items: center; box-sizing: border-box; padding-top: calc(var(--header-h) + 3.5rem); padding-bottom: 3.5rem; }
@media (min-width: 640px) { .site-hero { padding-top: calc(var(--header-h) + 4rem); } }
.site-hero > .site-hero__content { position: relative; z-index: 2; width: 100%; }
.site-hero__content > * { margin-block: 0; }
.site-hero__content > h1 { margin-bottom: 20px; }
.site-hero__content > .site-hero__lead { max-width: 560px; margin-bottom: 32px; font-size: clamp(17px, 2vw, 20px); color: rgb(255 255 255 / 0.82); text-wrap: pretty; }
.site-hero__content > .wp-block-buttons { gap: 14px; }
.site-hero__content > .site-hero__facts { margin-top: 40px; gap: 20px 32px; }
.site-hero__fact > * { margin: 0; }
.site-hero__fact-label { gap: 8px; }
.site-hero__fact-label p { margin: 0; font-family: var(--wp--preset--font-family--sora); font-size: 15px; font-weight: 700; color: #fff; }
.site-hero__fact-sub { margin-top: 2px !important; padding-left: 26px; font-size: 13.5px; color: rgb(255 255 255 / 0.65); }

/* Grids */
.grid-2, .grid-3, .grid-3-lg, .grid-4, .grid-2-3, .grid-sm2-lg3 { display: grid; gap: 24px; }
.grid-4 { gap: 20px; }
.grid-sm2-lg3 { gap: 32px; }
:is(.grid-2, .grid-3, .grid-3-lg, .grid-4, .grid-2-3, .grid-sm2-lg3) > * { margin-block: 0; }
@media (min-width: 640px) {
	.grid-2, .grid-4, .grid-sm2-lg3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
	.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.grid-2-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.grid-3 > .span-2 { grid-column: span 2; }
}
@media (min-width: 1024px) {
	.grid-3-lg, .grid-2-3, .grid-sm2-lg3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
	.grid-3-lg > .span-2 { grid-column: span 2; }
}
.split { display: grid; gap: 48px; }
.split > * { margin-block: 0; }
@media (min-width: 1024px) {
	.split { grid-template-columns: 1fr 1fr; gap: 64px; }
	.split--story { grid-template-columns: 1fr 1.2fr; }
	.split--form { grid-template-columns: 1.4fr 1fr; }
}
.split--watch { align-items: center; }
@media (min-width: 1024px) { .split--watch { grid-template-columns: 1.3fr 1fr; gap: 48px; } }

/* Ink CTA band: heading left, buttons right from 1024px. */
.cta-band__row { display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 32px; }
.cta-band__row > * { margin-block: 0; }
@media (min-width: 1024px) { .cta-band__row { flex-direction: row; align-items: center; } }
.cta-band__row > .wp-block-buttons { flex-shrink: 0; }

/* Image card (home "I'm new" cards): whole card is the link. */
.wp-block-group.is-style-card { position: relative; display: flex; flex-direction: column; }
.wp-block-group.is-style-card > * { margin-block: 0; }
.wp-block-group.is-style-card:hover { box-shadow: var(--wp--preset--shadow--card-lg); }
@media (prefers-reduced-motion: no-preference) { .wp-block-group.is-style-card:hover { transform: translateY(-6px); } }
.card__media { position: relative; }
.card__media > .wp-block-image { position: relative; margin: 0; overflow: hidden; border-radius: 18px 18px 0 0; background: var(--wp--preset--color--green-100); }
.card__media > .wp-block-image img { display: block; width: 100%; transition: transform 0.5s ease; }
.card__media > .wp-block-image::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgb(14 14 44 / 0.35), transparent); pointer-events: none; }
.is-style-card:hover .card__media img { transform: scale(1.05); }
.card__badge { position: absolute !important; left: 24px; bottom: 0; z-index: 2; width: 56px; height: 56px; border-radius: 18px; transform: translateY(50%); box-shadow: var(--wp--preset--shadow--card); }
.card__body { flex: 1; display: flex; flex-direction: column; padding: 48px 24px 24px; }
.card__body > * { margin-block: 0; }
.card__body > h3 { font-size: 21px; }
.card__body > p:not(.card__cta) { flex: 1; margin-top: 8px; font-size: 15px; color: var(--wp--preset--color--grey-500); }
.card__body > .card__cta { margin-top: 16px; font-size: 14px; }
.card__cta a::before { content: ""; position: absolute; inset: 0; border-radius: 18px; }
.card__cta a:focus-visible { outline: none; }
.card__cta a:focus-visible::before { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 2px; }
.is-style-card:hover .card__cta a::after { margin-left: 12px; }

/* Dark cards (home "Don't do life alone") */
.wp-block-group.is-style-card-ink { position: relative; }
.wp-block-group.is-style-card-ink > * { margin-block: 0; }
.wp-block-group.is-style-card-ink:hover { background: rgb(255 255 255 / 0.08); border-color: rgb(132 194 36 / 0.4); }
@media (prefers-reduced-motion: no-preference) { .wp-block-group.is-style-card-ink:hover { transform: translateY(-6px); } }
.is-style-card-ink .card__tile { width: 50px; height: 50px; margin-bottom: 18px; border-radius: 13px; background: rgb(132 194 36 / 0.16); }
.is-style-card-ink h3 { margin-bottom: 6px; font-size: 19px; color: #fff; }
.is-style-card-ink h3 a { color: inherit; text-decoration: none; }
.is-style-card-ink h3 a::before { content: ""; position: absolute; inset: 0; border-radius: 18px; }
.is-style-card-ink h3 a:focus-visible { outline: none; }
.is-style-card-ink h3 a:focus-visible::before { outline: 2px solid var(--wp--preset--color--green); outline-offset: 2px; }
.is-style-card-ink p { font-size: 14px; color: rgb(255 255 255 / 0.6); }

/* Flat card (the redesign's shadcn Card) */
.wp-block-group.is-style-card-flat { box-sizing: border-box; height: 100%; padding: 16px; border-radius: 14px; background: #fff; box-shadow: 0 0 0 1px rgb(14 14 44 / 0.1); }
.wp-block-group.is-style-card-flat > * { margin-block: 0; }
.is-style-card-flat > * + * { margin-top: 8px; }
.is-style-card-flat > h2, .is-style-card-flat > h3 { margin-top: 16px; font-size: 18px; font-weight: 600; }
.is-style-card-flat > h3.has-large-font-size { margin-top: 0; font-size: 20px; }
.is-style-card-flat > .wp-block-elevation-icon + * { margin-top: 16px; }
.is-style-card-flat > p { font-size: 14px; color: var(--wp--preset--color--grey-500); }
.is-style-card-flat > .is-style-eyebrow { margin-top: 8px; font-size: 12px; color: var(--wp--preset--color--green-700); }
.is-style-card-flat > .is-style-eyebrow + p { margin-top: 12px; }
.is-style-card-flat .wp-block-elevation-icon { color: var(--wp--preset--color--green-700); }
.is-style-card-flat.card--green { background: var(--wp--preset--color--green-100); box-shadow: 0 0 0 1px rgb(132 194 36 / 0.4); }
.is-style-card-flat.card--green .wp-block-elevation-icon { color: var(--wp--preset--color--ink); }
.is-style-card-flat.card--green ul { margin: 16px 0 0; padding-left: 20px; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.is-style-card-flat.card--green li + li { margin-top: 12px; }
.is-style-card-flat.card--feature { box-shadow: 0 0 0 1px rgb(132 194 36 / 0.5), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
.is-style-card-flat.card--feature > h2 { font-size: 24px; }
.is-style-card-flat.card--feature > p { font-size: 16px; }
.is-style-card-flat.card--feature > .wp-block-buttons { margin-top: 32px; }
.is-style-card-flat.card--feature > .card-note { margin-top: 16px; font-size: 12px; }
.is-style-card-flat.card--ink { background: var(--wp--preset--color--ink); box-shadow: none; }
.is-style-card-flat.card--ink .wp-block-elevation-icon { color: var(--wp--preset--color--green); }
.is-style-card-flat.card--ink > h2 { font-size: 20px; color: #fff; }
.is-style-card-flat.card--ink > p { margin-top: 12px; color: rgb(255 255 255 / 0.8); }
.is-style-card-flat.card--ink strong { color: var(--wp--preset--color--green); font-weight: 600; }
.is-style-card-flat.card--ink > .wp-block-buttons { margin-top: 24px; }
.is-style-card-flat .dl-label { margin-top: 12px; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.is-style-card-flat .dl-value { margin-top: 0; font-size: 14px; font-weight: 500; color: var(--wp--preset--color--ink); }
.is-style-card-flat .card-note { margin-top: 20px; font-size: 12px; }

/* Values (About) */
.value-card { display: flex; align-items: baseline; gap: 16px; }
.value-card > * { margin: 0 !important; }
.value-card__letter { font-family: var(--wp--preset--font-family--sora); font-size: 36px; font-weight: 600; line-height: 1; color: var(--wp--preset--color--green-700); }
.value-card__name { font-size: 18px !important; font-weight: 500; color: var(--wp--preset--color--ink) !important; }

/* Badges */
.wp-block-list.is-style-badges { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.is-style-badges li { margin: 0; padding: 4px 12px; border-radius: 9999px; background: var(--wp--preset--color--grey-100); color: var(--wp--preset--color--ink); font-size: 14px; font-weight: 500; line-height: 1.5; }
.is-style-badges.is-roomy li { padding: 6px 12px; }

/* Growth Track */
.growth-track { display: grid; gap: 32px; }
@media (min-width: 768px) { .growth-track { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.growth-step { padding-left: 24px; border-left: 4px solid var(--wp--preset--color--green-700); }
.growth-step > * { margin-block: 0; }
.growth-step__number { font-family: var(--wp--preset--font-family--sora); font-size: 24px; font-weight: 600; color: var(--wp--preset--color--green-700); }
.growth-step > h3 { margin-top: 4px; font-size: 20px; font-weight: 600; }
.growth-step > p:not([class]) { margin-top: 8px; color: var(--wp--preset--color--grey-500); }
.growth-step > .growth-step__scripture { margin-top: 12px; font-size: 14px; color: var(--wp--preset--color--grey-500); }

/* Accordion (What we believe) */
.wp-block-details.is-style-accordion { margin: 0; padding: 16px 0; border-bottom: 1px solid rgb(14 14 44 / 0.1); }
.is-style-accordion > summary { display: flex; justify-content: space-between; gap: 16px; list-style: none; cursor: pointer; font-size: 18px; font-weight: 600; color: var(--wp--preset--color--ink); }
.is-style-accordion > summary::-webkit-details-marker { display: none; }
.is-style-accordion > summary::after { content: ""; flex-shrink: 0; width: 16px; height: 16px; margin-top: 6px; background: currentColor; -webkit-mask: var(--icon-chevron) center / contain no-repeat; mask: var(--icon-chevron) center / contain no-repeat; transition: transform 0.2s ease; }
.is-style-accordion[open] > summary::after { transform: rotate(180deg); }
.is-style-accordion > summary:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 4px; }
.is-style-accordion > :not(summary) { margin-block: 8px 0; }
.is-style-accordion p { color: var(--wp--preset--color--grey-500); }
.is-style-accordion > .accordion__scripture { margin-top: 12px; font-size: 14px; font-weight: 500; color: var(--wp--preset--color--green-700); }

/* Leadership portraits */
.leader > * { margin-block: 0; }
.wp-block-cover.is-style-portrait { aspect-ratio: 4 / 5; min-height: 0 !important; height: auto; padding: 24px; align-items: flex-end; justify-content: flex-start; overflow: hidden; border-radius: 18px; background: var(--wp--preset--color--grey-100); box-shadow: var(--wp--preset--shadow--card); transition: box-shadow 0.3s ease; }
.wp-block-cover.is-style-portrait:hover { box-shadow: var(--wp--preset--shadow--card-lg); }
.is-style-portrait .wp-block-cover__image-background { transition: transform 0.5s ease; }
.is-style-portrait:hover .wp-block-cover__image-background { transform: scale(1.05); }
.is-style-portrait .wp-block-cover__background { opacity: 1 !important; background: linear-gradient(to top, rgb(14 14 44 / 0.85), rgb(14 14 44 / 0.4) 20%, transparent 40%) !important; }
.is-style-portrait .wp-block-cover__inner-container { width: 100%; }
.is-style-portrait .wp-block-cover__inner-container > * { margin-block: 0; }
.is-style-portrait h3 { font-size: 20px; color: #fff; }
.is-style-portrait .leader__role { margin-top: 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--wp--preset--color--green); }
.leader > .leader__bio { margin-top: 20px; font-size: 15px; color: var(--wp--preset--color--grey-500); }

/* Panels and asides (Prayer, Contact) */
.wp-block-group.is-style-panel { padding: 24px; border-radius: 14px; background: var(--wp--preset--color--grey-50); }
.wp-block-group.is-style-panel-alert { padding: 24px; border-radius: 14px; background: rgb(214 69 69 / 0.05); border: 1px solid rgb(214 69 69 / 0.3); }
:is(.is-style-panel, .is-style-panel-alert) > * { margin-block: 0; }
:is(.is-style-panel, .is-style-panel-alert) > h2 { font-size: 18px; font-weight: 600; }
:is(.is-style-panel, .is-style-panel-alert) > p { margin-top: 12px; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.aside-stack { display: flex; flex-direction: column; gap: 32px; }
.aside-stack > * { margin: 0 !important; }
.aside-stack a { color: var(--wp--preset--color--ink); font-weight: 500; text-decoration: underline; text-underline-offset: 4px; }
.aside-stack > div > * { margin-block: 0; }
.aside-stack > div > * + * { margin-top: 12px; }
.aside-heading { gap: 8px; }
.aside-heading h2 { margin: 0; font-size: 18px; font-weight: 600; }
.aside-heading .wp-block-elevation-icon { color: var(--wp--preset--color--green-700); }
.aside-stack .address-block p { margin: 0; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.aside-stack .aside-text { font-size: 14px; color: var(--wp--preset--color--grey-500); }
.aside-stack ul { margin: 12px 0 0; padding: 0; list-style: none; font-size: 14px; }
.aside-stack ul li + li { margin-top: 8px; }
.aside-stack ul a { text-decoration: none; font-weight: 400; color: var(--wp--preset--color--grey-500); }
.aside-stack ul a strong { font-weight: 500; color: var(--wp--preset--color--ink); }
.aside-stack ul a:hover { color: var(--wp--preset--color--green-700); }

/* Address and map (I'm New "Where we meet", Contact) */
.address-block > p { margin: 0; }
.address-block > p:first-child { font-weight: 600; }
.media-frame { overflow: hidden; border-radius: 14px; border: 1px solid rgb(14 14 44 / 0.1); box-shadow: 0 1px 2px rgb(0 0 0 / 0.05); }
.media-frame > * { margin: 0 !important; }
.media-frame .wp-block-elevation-embed-gate { border-radius: 0; border: 0; }
.map-band { border-top: 1px solid rgb(14 14 44 / 0.1); }
.map-band > * { margin: 0 !important; }
.map-band .wp-block-elevation-embed-gate { border-radius: 0; border-left: 0; border-right: 0; border-bottom: 0; }

/* Home watch tile (no video yet) */
.watch-tile { position: relative; display: grid; place-items: center; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 18px; background: radial-gradient(ellipse at 30% 20%, #2a2a5e 0%, transparent 60%), var(--wp--preset--color--ink-800); box-shadow: var(--wp--preset--shadow--card-lg); }
.watch-tile::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgb(14 14 44 / 0.1), rgb(14 14 44 / 0.6)); pointer-events: none; }
.watch-tile > * { position: relative; z-index: 1; margin: 0 !important; }
.watch-tile > .watch-tile__chip { position: absolute; top: 16px; left: 16px; z-index: 2; padding: 6px 12px; border-radius: 8px; background: rgb(14 14 44 / 0.7); backdrop-filter: blur(12px); font-family: var(--wp--preset--font-family--sora); font-size: 12px; font-weight: 600; }
.watch-tile__chip a { color: #fff; text-decoration: none; }
.watch-tile__chip a::before { content: ""; position: absolute; inset: -9999px; }
.watch-tile { isolation: isolate; }
.watch-tile__chip a:focus-visible { outline: 2px solid var(--wp--preset--color--green); outline-offset: 2px; }
.watch-tile__play { width: 82px; height: 82px; border-radius: 50%; background: rgb(255 255 255 / 0.92); box-shadow: 0 10px 30px rgb(0 0 0 / 0.3); transition: transform 0.25s ease, background-color 0.25s ease; }
.watch-tile__play svg { margin-left: 4px; }
.watch-tile:hover .watch-tile__play { background: var(--wp--preset--color--green); transform: scale(1.08); }
.watch-intro > * { margin-block: 0; }
.watch-intro > h2 { margin-block: 12px 14px; font-size: 34px; text-wrap: balance; }
.watch-intro > p:not(.is-style-eyebrow) { margin-bottom: 24px; }

/* Home "What's on" with no events */
.card-gathering { display: flex; flex-direction: column; justify-content: flex-end; min-height: 220px; padding: 28px; box-sizing: border-box; border-radius: 18px; border: 1px solid var(--wp--preset--color--grey-100); background: linear-gradient(to bottom right, var(--wp--preset--color--ink), var(--wp--preset--color--ink-800)); }
.card-gathering > * { margin-block: 0; }
.card-gathering > h3 { margin-top: 8px; font-size: 26px; color: #fff; }
.card-gathering__meta { margin-top: 8px !important; gap: 4px 20px; font-size: 14px; color: rgb(255 255 255 / 0.7); }
.card-gathering__meta .wp-block-group { gap: 6px; }
.card-gathering__meta p { margin: 0; }
.card-gathering > .wp-block-buttons { margin-top: 20px; }
.card-soon { display: flex; flex-direction: column; justify-content: center; padding: 32px; box-sizing: border-box; border-radius: 18px; border: 1px solid var(--wp--preset--color--grey-100); background: #fff; }
.card-soon > * { margin-block: 0; }
.card-soon__tile { width: 54px; height: 54px; margin-bottom: 20px; border-radius: 14px; }
.card-soon > h3 { margin-bottom: 8px; font-size: 21px; }
.card-soon > p { margin-bottom: 20px; font-size: 15px; color: var(--wp--preset--color--grey-500); }

/* Watch page archive panel (no YouTube key yet) */
.panel-watch { box-sizing: border-box; max-width: 672px; margin-inline: auto !important; padding: 48px; border-radius: 18px; border: 1px solid var(--wp--preset--color--grey-100); background: #fff; text-align: center; }
.panel-watch > * { margin-block: 0; }
.panel-watch .wp-block-elevation-icon { color: var(--wp--preset--color--green-700); }
.panel-watch > h2 { margin-top: 24px; font-size: 24px; }
.panel-watch > p { max-width: 448px; margin: 12px auto 0; color: var(--wp--preset--color--grey-500); }
.panel-watch > .wp-block-buttons { margin-top: 32px; }

/* Form slots (Plan 5 fills these) and the Gift Aid box */
.form-slot:empty { min-height: 1px; }
.form-box { box-sizing: border-box; padding: 24px; border-radius: 18px; border: 1px solid var(--wp--preset--color--grey-100); background: #fff; box-shadow: var(--wp--preset--shadow--card); }
@media (min-width: 640px) { .form-box { padding: 40px; } }

/* Long-form text (Privacy, kept pages) */
.rich-text > h2 { margin-top: 48px; font-size: var(--wp--preset--font-size--x-large); scroll-margin-top: 7rem; }
.rich-text > h2:first-child { margin-top: 0; }
.rich-text > h3 { margin-top: 32px; font-size: var(--wp--preset--font-size--medium); }
.rich-text a { font-weight: 500; text-decoration: underline; text-underline-offset: 2px; }
.rich-text ul { padding-left: 24px; }
.rich-text li + li { margin-top: 8px; }
.rich-text .rich-text__meta { font-size: 14px; color: var(--wp--preset--color--grey-500); }
.rich-text .rich-text__footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgb(14 14 44 / 0.1); font-size: 14px; color: var(--wp--preset--color--grey-500); }

/* Stats and date card (CMS patterns) */
.stats { display: grid; gap: 24px; padding-block: 32px; border-block: 1px solid var(--wp--preset--color--grey-100); }
.stats > * { margin: 0 !important; }
@media (min-width: 640px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.stat__number { margin: 0; font-family: var(--wp--preset--font-family--sora); font-size: clamp(36px, 5vw, 52px); font-weight: 800; line-height: 1.1; color: var(--wp--preset--color--ink); }
.stat__label { margin: 4px 0 0 !important; font-size: 14px; color: var(--wp--preset--color--grey-500); }
.date-card { display: flex; align-items: center; gap: 24px; padding: 16px; border-radius: 22px; background: #fff; box-shadow: var(--wp--preset--shadow--card); }
.date-card > * { margin: 0 !important; }
.date-card__tile { flex-shrink: 0; display: grid; place-content: center; width: 112px; aspect-ratio: 1; border-radius: 18px; background: var(--wp--preset--color--ink); text-align: center; }
.date-card__tile > * { margin: 0 !important; }
.date-card__day { font-family: var(--wp--preset--font-family--sora); font-size: 48px; font-weight: 800; line-height: 1; color: var(--wp--preset--color--green); }
.date-card__month { margin-top: 4px !important; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #fff; }
.date-card h3 { font-size: 21px; }
.date-card__meta { margin-top: 4px !important; font-size: 15px; color: var(--wp--preset--color--grey-500); }

/* Reveal (reveal.js): hidden only once JS is running and motion is allowed. */
@media (prefers-reduced-motion: no-preference) {
	html[data-reveal-ready] .reveal { transition: opacity 0.7s ease, transform 0.7s ease, box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease; }
	html[data-reveal-ready] .reveal:not(.is-visible) { opacity: 0; transform: translateY(24px); }
}
```

The watch tile's chip link uses a large `::before` clipped by the tile's `overflow: hidden`. That makes the whole tile one link, named by the chip's text, without an empty link.

- [ ] **Step 5: The block validator snippet**

`bin/validate-blocks.js`:

```js
// Block validation for every page and every elevation/* pattern.
// Paste into the browser console on any block-editor screen, e.g. /wp-admin/post-new.php?post_type=page,
// or run it with the browser tool's JavaScript action there. Prints and returns the invalid blocks.
( async () => {
	const pages = await wp.apiFetch( { path: '/wp/v2/pages?context=edit&per_page=100&status=publish,draft,private' } );
	const patterns = ( await wp.apiFetch( { path: '/wp/v2/block-patterns/patterns' } ) ).filter( ( p ) => p.name.startsWith( 'elevation/' ) );
	const sources = [
		...pages.map( ( p ) => [ `page ${ p.slug }`, p.content.raw ] ),
		...patterns.map( ( p ) => [ `pattern ${ p.name }`, p.content ] ),
	];
	const problems = [];
	const walk = ( label, blocks ) => blocks.forEach( ( block ) => {
		if ( block.name && ! block.isValid ) {
			problems.push( `${ label }: ${ block.name }` );
		}
		walk( label, block.innerBlocks || [] );
	} );
	for ( const [ label, raw ] of sources ) {
		walk( label, wp.blocks.parse( raw ) );
	}
	console.log( problems.length ? problems.join( '\n' ) : `All ${ sources.length } pages and patterns are valid.` );
	return problems;
} )();
```

**How to fix a flagged block** (every later task uses this): open the page or a draft containing the pattern in the editor, click the block's "Attempt recovery", switch to the Code editor, and copy the corrected markup back into the seed or pattern file.

- [ ] **Step 6: Commit the styles before patterns exist**

```bash
git add wp-content/themes/elevation bin/validate-blocks.js
git commit -m "Section, card and pattern styles; reveal on scroll; over-hero header only with a .site-hero; block validator

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Verify the header marker and the base styles**

```bash
curl -s http://localhost:8080/ | grep -c 'site-hero'
curl -s http://localhost:8080/does-not-exist | grep -c 'site-hero'
curl -s http://localhost:8080/ | grep -o 'reveal\.js[^"]*'
```

Expected:
- `0` for both `site-hero` counts. The home page still has Plan 1's placeholder, and Task 9 adds the hero.
- The reveal script is enqueued.

In the browser:
- Temporarily add `site-hero` to the home placeholder's group class: in the editor, set Advanced → Additional CSS class to `site-hero`, then view the page. The header is transparent with white links, and it turns solid after 80px of scroll.
- `/does-not-exist` shows the solid header.
- Undo the edit with `SEED_FORCE=home ./bin/seed.sh`.

- [ ] **Step 8: Validator smoke test**

In the browser pane, open `/wp-admin/post-new.php?post_type=page` and run the contents of `bin/validate-blocks.js`. Expected: `All N pages and patterns are valid.`. At this point there are only the home page and two logo patterns.

- [ ] **Step 9: Keyboard check (Review Focus 5)**

On `/`, Tab from the address bar:
1. The consent banner's link and buttons, in order.
2. Then the skip link, which becomes visible.
3. Then the logo, the nav links, Plan a Visit and Give, each with a visible focus ring.

Choose "Reject all" and reload. The first Tab now lands on the skip link.

### Task 7: Patterns, part 1 — heroes, headings, cards and bands

**Files:**
- Create: `wp-content/themes/elevation/patterns/page-hero.php`, `section-heading.php`, `home-hero.php`, `image-cards-3.php`, `ink-cards-4.php`, `info-cards.php`, `cta-band.php`, `sunday-strip.php`, `two-col-text-media.php`, `rich-text-section.php`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append the Sunday strip styles)

**Interfaces:**
- Consumes:
  - the block styles and classes from Task 6;
  - the blocks `elevation/icon`, `elevation/hero-slideshow` and `elevation/embed-gate`;
  - the `elevation` pattern category (Plan 1).
- Produces: patterns `elevation/<slug>` for each file above. Tasks 9–12 copy their markup into page seeds and replace the copy.

**Section wrappers.** Every full-width section in Tasks 7–12 is one of these three groups. Add `"anchor":"<id>"` to the JSON and `id="<id>"` to the tag when a section has an id.

White:
```html
<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">…</section>
<!-- /wp:group -->
```
Grey: the same with `"backgroundColor":"grey-50"` and `has-grey-50-background-color has-background` added to the class.
Ink: the same with `"className":"is-style-section-ink","backgroundColor":"ink","textColor":"white"` and `is-style-section-ink has-white-color has-ink-background-color has-text-color has-background`. Headings inside ink sections take `"textColor":"white"`.

Each pattern file starts with this header, filled in per pattern:

```php
<?php
/**
 * Title: <Title>
 * Slug: elevation/<slug>
 * Categories: elevation
 * Description: <one line>
 */
?>
```

- [ ] **Step 1: `page-hero.php`** (Title "Page hero". Description "Dark hero for interior pages: eyebrow, page title and lead.")

```html
<!-- wp:group {"tagName":"section","align":"full","className":"is-style-page-hero","backgroundColor":"ink","textColor":"white","style":{"spacing":{"padding":{"top":"70px","bottom":"60px"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull is-style-page-hero has-white-color has-ink-background-color has-text-color has-background" style="padding-top:70px;padding-bottom:60px"><!-- wp:paragraph {"className":"is-style-eyebrow-on-ink"} -->
<p class="is-style-eyebrow-on-ink">About us</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1,"textColor":"white"} -->
<h1 class="wp-block-heading has-white-color has-text-color">A church family with one mandate</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead-on-ink"} -->
<p class="is-style-lead-on-ink">{church.mission}</p>
<!-- /wp:paragraph --></section>
<!-- /wp:group -->
```

- [ ] **Step 2: `section-heading.php`** (Title "Section heading". Description "Eyebrow, heading and lead, 620px wide.")

```html
<!-- wp:group {"className":"section-heading","layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group section-heading"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">First time?</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">We'd love to meet you</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead"} -->
<p class="is-style-lead">Coming to a new church can feel like a big step. Here's everything you need to feel at home before you even arrive.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

In the variants used by later tasks, the wrapper and the lead change like this:

| Variant | Wrapper JSON | Wrapper class | Lead |
|---|---|---|---|
| Centred | `{"className":"section-heading is-centered","layout":{"type":"constrained","contentSize":"620px"}}` | `section-heading is-centered` | unchanged |
| On ink | unchanged | unchanged | `is-style-eyebrow-on-ink`, `"textColor":"white"` on the heading, and `is-style-lead-on-ink` |

- [ ] **Step 3: `home-hero.php`** (Title "Home hero". Description "Full-height hero with the Church Settings slideshow, headline, two buttons and the service facts.")

```html
<!-- wp:group {"tagName":"section","align":"full","className":"site-hero","backgroundColor":"ink","textColor":"white","layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull site-hero has-white-color has-ink-background-color has-text-color has-background"><!-- wp:elevation/hero-slideshow {"align":"full"} /-->

<!-- wp:group {"className":"site-hero__content","layout":{"type":"constrained","contentSize":"760px","justifyContent":"left"}} -->
<div class="wp-block-group site-hero__content"><!-- wp:heading {"level":1,"textColor":"white","fontSize":"hero"} -->
<h1 class="wp-block-heading has-white-color has-text-color has-hero-font-size">Making greatness <mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-green-color">common.</mark></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"site-hero__lead"} -->
<p class="site-hero__lead">We're a Spirit-filled family in the heart of Manchester on one mission. Wherever you're coming from, there's a place for you here.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-size-lg has-arrow"} -->
<div class="wp-block-button is-size-lg has-arrow"><a class="wp-block-button__link wp-element-button" href="/im-new">Plan your visit</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-ghost-on-dark is-size-lg has-play"} -->
<div class="wp-block-button is-style-ghost-on-dark is-size-lg has-play"><a class="wp-block-button__link wp-element-button" href="/watch">Watch online</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:group {"className":"site-hero__facts","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-group site-hero__facts"><!-- wp:group {"className":"site-hero__fact","layout":{"type":"default"}} -->
<div class="wp-block-group site-hero__fact"><!-- wp:group {"className":"site-hero__fact-label","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group site-hero__fact-label"><!-- wp:elevation/icon {"name":"clock","size":18,"textColor":"green"} /-->

<!-- wp:paragraph -->
<p>{service.day}s {service.startTime}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"site-hero__fact-sub"} -->
<p class="site-hero__fact-sub">{service.arrivalNote}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"site-hero__fact","layout":{"type":"default"}} -->
<div class="wp-block-group site-hero__fact"><!-- wp:group {"className":"site-hero__fact-label","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group site-hero__fact-label"><!-- wp:elevation/icon {"name":"map-pin","size":18,"textColor":"green"} /-->

<!-- wp:paragraph -->
<p>{location.venue}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"site-hero__fact-sub"} -->
<p class="site-hero__fact-sub">{location.campus} · {location.postcode}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
```

- [ ] **Step 4: `image-cards-3.php`** (Title "Image cards (3)". Description "Three photo cards with an icon badge and a link; the whole card is clickable.")

Write a white section containing, in order:
- a centred section heading (Step 2's copy);
- `<!-- wp:group {"className":"grid-3","layout":{"type":"default"}} --><div class="wp-block-group grid-3">` holding **three** copies of the card below;
- a centred buttons row (`{"layout":{"type":"flex","justifyContent":"center"}}`, class `mt-11`) with one `is-style-navy is-size-lg` button, "Plan my visit — everything you need to know" → `/im-new`.

Card 1 is below. Cards 2 and 3 are the same, with icon `map-pin`, "Times & location", "Get directions" and `/im-new#find-us`, then `baby`, "Kids & teens", "See their spaces" and `/im-new#kids`. Their body text is in Task 9.

```html
<!-- wp:group {"className":"is-style-card reveal","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card reveal"><!-- wp:group {"className":"card__media","layout":{"type":"default"}} -->
<div class="wp-block-group card__media"><!-- wp:image {"aspectRatio":"4/3","scale":"cover","sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img alt="" style="aspect-ratio:4/3;object-fit:cover"/></figure>
<!-- /wp:image -->

<!-- wp:elevation/icon {"name":"house","className":"card__badge","backgroundColor":"green","textColor":"ink"} /--></div>
<!-- /wp:group -->

<!-- wp:group {"className":"card__body","layout":{"type":"default"}} -->
<div class="wp-block-group card__body"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What to expect</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Passionate worship, a practical message from the Bible, and a genuinely warm welcome. Come as you are — nobody is checking what you're wearing.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"card__cta"} -->
<p class="card__cta"><a href="/im-new#what-to-expect">Learn more</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
```

- [ ] **Step 5: `ink-cards-4.php`** (Title "Dark cards (4)". Description "Dark section with four linked cards, each with an icon tile.")

Write an ink section containing:
- an on-ink section heading: "Community" / "Don't do life alone" / "Church is more than a Sunday. Find your people, use your gifts, and grow.";
- a `grid-4` group holding four copies of the card below.

The cards' copy is in Task 9.

```html
<!-- wp:group {"className":"is-style-card-ink reveal","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-ink reveal"><!-- wp:elevation/icon {"name":"users","className":"card__tile","textColor":"green"} /-->

<!-- wp:heading {"level":3,"textColor":"white"} -->
<h3 class="wp-block-heading has-white-color has-text-color"><a href="/get-involved#connect-groups">Connect Groups</a></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Small groups across Manchester. Big enough to receive you, small enough to know you.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

- [ ] **Step 6: `info-cards.php`** (Title "Info cards". Description "Section heading and a grid of flat cards with an icon, heading and text.")

Write a white section containing:
- a section heading with eyebrow "What to expect" and title "The honest answers to the questions everyone asks", and no lead paragraph;
- `<!-- wp:group {"className":"grid-2-3 mt-12","layout":{"type":"default"}} -->` holding three copies of the card below, with icons `clock`, `shirt` and `users`.

```html
<!-- wp:group {"className":"is-style-card-flat","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat"><!-- wp:elevation/icon {"name":"clock"} /-->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">When should I arrive?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>{service.startSentence} Come a little early if you'd like to say hello, and stay afterwards for coffee — we'd genuinely love to meet you.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

The "name + eyebrow" card variant is used for the kids and teens cards:

```html
<!-- wp:group {"className":"is-style-card-flat","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat"><!-- wp:heading {"level":3,"fontSize":"large"} -->
<h3 class="wp-block-heading has-large-font-size">The Seeds</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Children's Church, including a baby class</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A safe, fun and faith-building space for our youngest every {service.day}.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

- [ ] **Step 7: `cta-band.php`** (Title "Call to action band". Description "Dark band: heading and lead on the left, buttons on the right.")

```html
<!-- wp:group {"tagName":"section","align":"full","className":"is-style-section-ink","backgroundColor":"ink","textColor":"white","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull is-style-section-ink has-white-color has-ink-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"cta-band__row","layout":{"type":"default"}} -->
<div class="wp-block-group cta-band__row"><!-- wp:group {"className":"section-heading","layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group section-heading"><!-- wp:heading {"textColor":"white"} -->
<h2 class="wp-block-heading has-white-color has-text-color">Still have a question?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead-on-ink"} -->
<p class="is-style-lead-on-ink">Send it over before you come. No question is too small.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/contact">Get in touch</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
```

- [ ] **Step 8: `sunday-strip.php`** (Title "Sunday strip". Description "Green strip for the weekly gathering, with time, place and a button.")

```html
<!-- wp:group {"className":"is-style-strip-green sunday-strip","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-strip-green sunday-strip"><!-- wp:group {"className":"sunday-strip__text","layout":{"type":"default"}} -->
<div class="wp-block-group sunday-strip__text"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Every week</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">{service.day} Gathering</h2>
<!-- /wp:heading -->

<!-- wp:group {"className":"sunday-strip__line","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group sunday-strip__line"><!-- wp:elevation/icon {"name":"clock","size":16} /-->

<!-- wp:paragraph -->
<p>{service.day}s at {service.startTime}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"sunday-strip__line","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group sunday-strip__line"><!-- wp:elevation/icon {"name":"map-pin","size":16} /-->

<!-- wp:paragraph -->
<p>{location.full}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-navy"} -->
<div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="/im-new">Plan your visit</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->
```

Append to `site.css`:

```css
/* Sunday strip */
.sunday-strip { display: flex; flex-direction: column; gap: 20px; }
.sunday-strip > * { margin-block: 0; }
@media (min-width: 640px) { .sunday-strip { flex-direction: row; align-items: center; justify-content: space-between; } }
.sunday-strip__text > * { margin-block: 0; }
.sunday-strip__text > h2 { margin-top: 6px; font-size: 24px; }
.sunday-strip__text > .sunday-strip__line { margin-top: 8px; gap: 8px; font-size: 15px; }
.sunday-strip__line p { margin: 0; }
.sunday-strip .wp-block-elevation-icon { color: var(--wp--preset--color--green-700); }
```

- [ ] **Step 9: `two-col-text-media.php`** (Title "Text and map". Description "Heading, address and buttons beside a click-to-load map.")

Write a grey section with `"anchor":"find-us"` containing `<!-- wp:group {"className":"split","layout":{"type":"default"}} -->`, which holds a left group and a right group.

The left group contains:
- a section heading: eyebrow "Find us", title "Where we meet", lead "We gather every {service.day} at {service.startTime} in the {location.venue} on the {location.campus} campus.";
- an address group, shown below;
- a buttons row with class `mt-8`: a navy "Open in Google Maps" button → `{location.mapsUrl}` opening in a new tab (`"linkTarget":"_blank","rel":"noreferrer noopener"`, and `target="_blank" rel="noreferrer noopener"` on the link), and a ghost "Ask us a question" button → `/contact`.

```html
<!-- wp:group {"className":"address-block mt-8","layout":{"type":"default"}} -->
<div class="wp-block-group address-block mt-8"><!-- wp:paragraph -->
<p>{location.venue}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>{location.campus}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>{location.city} {location.postcode}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

The right group is:

```html
<!-- wp:group {"className":"media-frame","layout":{"type":"default"}} -->
<div class="wp-block-group media-frame"><!-- wp:elevation/embed-gate {"aspectRatio":"4/3"} /--></div>
<!-- /wp:group -->
```

- [ ] **Step 10: `rich-text-section.php`** (Title "Text section". Description "A white section of long-form text, 760px wide.")

```html
<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"rich-text","layout":{"type":"constrained","contentSize":"760px"}} -->
<div class="wp-block-group rich-text"><!-- wp:heading -->
<h2 class="wp-block-heading">A heading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Write here. Use the "Insert church setting" button for the service time, address or email so they stay up to date.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
```

- [ ] **Step 11: Verify the patterns register, render and validate**

```bash
docker compose run --rm -T wpcli wp --user=admin eval 'foreach ( WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $p ) { if ( str_starts_with( $p["name"], "elevation/" ) ) { echo $p["name"], "\n"; } }' | sort
```

Expected: 12 names, which are the 10 new patterns plus `elevation/header-logo` and `elevation/footer-logo`.

Create a scratch page from all ten patterns:

```bash
docker compose run --rm -T wpcli bash -c 'for s in page-hero section-heading home-hero image-cards-3 ink-cards-4 info-cards cta-band sunday-strip two-col-text-media rich-text-section; do printf "<!-- wp:pattern {\"slug\":\"elevation/%s\"} /-->\n" "$s"; done > /tmp/p.html && wp --user=admin elevation seed page pattern-test /tmp/p.html --title=Patterns'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/pattern-test/
```

Expected: `200`.

In the browser:
- Run `bin/validate-blocks.js` on `/wp-admin/post-new.php?post_type=page`. Expected: every `elevation/*` pattern is valid. Fix any flagged pattern with the recovery rule in Task 6 Step 5.
- View `/pattern-test/` at 1440px and 390px:
  - the page hero is ink with a glow at the top right;
  - the image cards lift on hover, and their badge straddles the image edge;
  - the ink cards are 4 across at 1440px and 1 across at 390px;
  - the CTA band stacks on mobile;
  - the map placeholder shows "Show the map";
  - there are no horizontal scrollbars.

Delete the page:
```bash
docker compose run --rm -T wpcli wp --user=admin post delete $(docker compose run --rm -T wpcli wp --user=admin post list --post_type=page --name=pattern-test --field=ID) --force
```

- [ ] **Step 12: Commit**

```bash
git add wp-content/themes/elevation
git commit -m "Patterns: page hero, section heading, home hero, image and dark cards, info cards, CTA band, Sunday strip, text and map, text section

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Patterns, part 2 — content sections

**Files:**
- Create: `wp-content/themes/elevation/patterns/values-grid.php`, `badge-cloud.php`, `growth-track.php`, `accordion.php`, `leadership.php`, `give-cards.php`, `aside-boxes.php`, `stats.php`, `date-card.php`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append the Give styles in Step 6)

**Interfaces:**
- Consumes: the Task 6 classes and styles, and the Task 7 section wrappers and header format.
- Produces: patterns `elevation/<slug>` for each file above.

- [ ] **Step 1: `values-grid.php`** (Title "Values grid". Description "Letter-and-word value cards, e.g. the ASHLIE values.")

A `grid-sm2-lg3 mt-12` group holding six cards like this one, for A Accountability, S Service, H Humility, L Love, I Integrity and E Excellence:

```html
<!-- wp:group {"className":"is-style-card-flat value-card","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat value-card"><!-- wp:paragraph {"className":"value-card__letter"} -->
<p class="value-card__letter">A</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"value-card__name"} -->
<p class="value-card__name">Accountability</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

- [ ] **Step 2: `badge-cloud.php`** (Title "Badge cloud". Description "Eyebrow and a row of pill badges.")

```html
<!-- wp:group {"className":"mt-14","layout":{"type":"default"}} -->
<div class="wp-block-group mt-14"><!-- wp:paragraph {"className":"is-style-eyebrow","style":{"spacing":{"margin":{"bottom":"16px"}}}} -->
<p class="is-style-eyebrow" style="margin-bottom:16px">Our personality</p>
<!-- /wp:paragraph -->

<!-- wp:list {"className":"is-style-badges"} -->
<ul class="wp-block-list is-style-badges"><!-- wp:list-item -->
<li>Humble</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Simple</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Youthful</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></div>
<!-- /wp:group -->
```

- [ ] **Step 3: `growth-track.php`** (Title "Growth Track". Description "Numbered steps with a green rule, two columns.")

Write a grey section containing:
- a section heading: "Your next steps" / "The Growth Track" / "Believing is the beginning. This is the path we walk together from there.";
- `<!-- wp:group {"className":"growth-track mt-12","layout":{"type":"default"}} -->` holding four steps like the one below.

The steps are:
- 01 "Know God", "Begin a relationship with Jesus.", John 17:3
- 02 "Find Freedom", "Take the Membership Class and join a Connect Group.", John 8:32–36
- 03 "Discover Purpose", "Grow through TECi and Maturity School.", 1 Peter 2:9; Ephesians 2:10
- 04 "Make Greatness Common", "Serve on the G-Squad and step into leadership.", Matthew 23:11

```html
<!-- wp:group {"className":"growth-step","layout":{"type":"default"}} -->
<div class="wp-block-group growth-step"><!-- wp:paragraph {"className":"growth-step__number"} -->
<p class="growth-step__number">01</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Know God</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Begin a relationship with Jesus.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"growth-step__scripture"} -->
<p class="growth-step__scripture">John 17:3</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

- [ ] **Step 4: `accordion.php`** (Title "Accordion". Description "Questions or beliefs that open and close; open by default.")

A white section containing a `{"layout":{"type":"constrained","contentSize":"768px","justifyContent":"left"}}` group that holds details blocks like this one:

```html
<!-- wp:details {"showContent":true,"className":"is-style-accordion"} -->
<details class="wp-block-details is-style-accordion" open><summary>One God, three persons</summary><!-- wp:paragraph -->
<p>There is one God, manifested in three persons — Father, Son and Holy Spirit.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"accordion__scripture"} -->
<p class="accordion__scripture">Deuteronomy 6:4</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
```

The pattern has two items: this one, and "Jesus Christ" / "Jesus Christ is the Son of God, and the only way to the Father." / "Matthew 1:18–25; John 14:6".

- [ ] **Step 5: `leadership.php`** (Title "Leadership". Description "Portrait cards with name and role over the photo, bio below.")

A `grid-sm2-lg3` group holding three copies of this leader. The pattern has no image; the page supplies one.

```html
<!-- wp:group {"className":"leader reveal","layout":{"type":"default"}} -->
<div class="wp-block-group leader reveal"><!-- wp:cover {"dimRatio":100,"overlayColor":"ink","isUserOverlayColor":true,"className":"is-style-portrait","layout":{"type":"default"}} -->
<div class="wp-block-cover is-style-portrait"><span aria-hidden="true" class="wp-block-cover__background has-ink-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:heading {"level":3,"textColor":"white"} -->
<h3 class="wp-block-heading has-white-color has-text-color">Pastor Tosin Babalola</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"leader__role"} -->
<p class="leader__role">Resident Pastor, Manchester</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->

<!-- wp:paragraph {"className":"leader__bio"} -->
<p class="leader__bio">Pastor Tosin leads the Manchester expression of The Elevation Church, which launched on {church.launched}.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
```

On a page, the cover gets an image by adding `"url":"{{media:…}}","id":{{media-id:…}},"alt":"Portrait of …"` to its JSON, and this element directly after the opening `<div class="wp-block-cover is-style-portrait">`, before the `<span>`:

```html
<img class="wp-block-cover__image-background wp-image-{{media-id:…}}" alt="Portrait of …" src="{{media:…}}" data-object-fit="cover"/>
```

If the validator prefers the `<span>` first, move it. Follow what the editor saves.

- [ ] **Step 6: `give-cards.php`** (Title "Giving cards". Description "Online giving, Gift Aid, bank transfer and cheque.")

Write a white section containing, in order: `grid-3-lg` (the online card spanning two columns, then the Gift Aid card); a separator; a section heading; and a `grid-2 mt-10` group with the bank and cheque cards. Task 10 copies this markup unchanged into the Give page.

```html
<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"grid-3-lg","layout":{"type":"default"}} -->
<div class="wp-block-group grid-3-lg"><!-- wp:group {"className":"is-style-card-flat card--feature span-2","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat card--feature span-2"><!-- wp:elevation/icon {"name":"hand-coins","size":28} /-->

<!-- wp:heading -->
<h2 class="wp-block-heading">Give online</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The quickest way to give — card, PayPal balance, Apple Pay or Google Pay. You can make a one-off gift or set up a recurring one.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"linkTarget":"_blank","rel":"noreferrer noopener"} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{giving.paypalUrl}" target="_blank" rel="noreferrer noopener">Give securely now</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:paragraph {"className":"card-note"} -->
<p class="card-note">You'll be taken to PayPal's secure donation page. A PayPal account isn't required to give by card.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"is-style-card-flat card--ink","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat card--ink"><!-- wp:elevation/icon {"name":"shield-check","size":28} /-->

<!-- wp:heading {"textColor":"white"} -->
<h2 class="wp-block-heading has-white-color has-text-color">Gift Aid</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If you pay UK tax, Gift Aid adds <strong>25%</strong> to your gift at no extra cost to you — every £10 becomes £12.50.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>{church.legalName} is a registered charity in England and Wales, no. {church.charityNumber}.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#gift-aid">Make your declaration</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:separator {"className":"give-separator"} -->
<hr class="wp-block-separator has-alpha-channel-opacity give-separator"/>
<!-- /wp:separator -->

<!-- wp:group {"className":"section-heading","layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group section-heading"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Other ways</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Prefer not to give online?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead"} -->
<p class="is-style-lead">Both of these work just as well, and Gift Aid still applies.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"grid-2 mt-10","layout":{"type":"default"}} -->
<div class="wp-block-group grid-2 mt-10"><!-- wp:group {"className":"is-style-card-flat","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat"><!-- wp:elevation/icon {"name":"building-2"} /-->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Bank transfer</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"dl-label"} -->
<p class="dl-label">Account name</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-value"} -->
<p class="dl-value">{giving.bankAccountName}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-label"} -->
<p class="dl-label">Account number</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-value is-mono"} -->
<p class="dl-value is-mono">{giving.bankAccountNumber}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-label"} -->
<p class="dl-label">Sort code</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-value is-mono"} -->
<p class="dl-value is-mono">{giving.bankSortCode}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"card-note"} -->
<p class="card-note">These details are also shown on screen on a {service.day}. If anything you see elsewhere differs from this, please check with us in person before sending money.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"is-style-card-flat","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat"><!-- wp:elevation/icon {"name":"mail"} /-->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Cheque</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Make cheques payable to:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"cheque-payee"} -->
<p class="cheque-payee">{giving.chequePayableTo}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hand it to a member of the team on a {service.day} and we'll make sure it reaches the right place.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
```

Append to `site.css`:

```css
/* Give */
.give-separator { margin: 56px 0 !important; border: 0; border-top: 1px solid rgb(14 14 44 / 0.1); opacity: 1; }
.is-style-card-flat > .cheque-payee { margin-top: 8px; font-size: 16px; font-weight: 600; color: var(--wp--preset--color--ink); }
```

- [ ] **Step 7: `aside-boxes.php`** (Title "Side boxes". Description "Grey and alert panels for a page's side column.")

```html
<!-- wp:group {"className":"aside-stack","layout":{"type":"default"}} -->
<div class="wp-block-group aside-stack"><!-- wp:group {"className":"is-style-panel","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-panel"><!-- wp:heading {"textColor":"ink"} -->
<h2 class="wp-block-heading has-ink-color has-text-color">Who sees this?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Prayer requests go to our pastoral team only. Nothing you write is published on this site, and it's never shared beyond the team unless you tick the box asking us to.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"is-style-panel-alert","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-panel-alert"><!-- wp:heading {"textColor":"ink"} -->
<h2 class="wp-block-heading has-ink-color has-text-color">If it's an emergency</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This form isn't monitored around the clock. If you or someone else is in immediate danger, please call <strong>999</strong>. For urgent mental health support, call <strong>111</strong>, or Samaritans free on <strong>116 123</strong>, any time.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
```

- [ ] **Step 8: `stats.php`** (Title "Stats". Description "Up to four big numbers with labels (the redesign's stats block).")

```html
<!-- wp:group {"className":"stats","layout":{"type":"default"}} -->
<div class="wp-block-group stats"><!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"className":"stat__number"} -->
<p class="stat__number">500+</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"stat__label"} -->
<p class="stat__label">people at Church in the Park</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"className":"stat__number"} -->
<p class="stat__number">40+</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"stat__label"} -->
<p class="stat__label">G-Squad units to serve on</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
```

- [ ] **Step 9: `date-card.php`** (Title "Date card". Description "A dark date tile with the event's title, day, time and place (the redesign's date-card block).")

```html
<!-- wp:group {"className":"date-card","layout":{"type":"default"}} -->
<div class="wp-block-group date-card"><!-- wp:group {"className":"date-card__tile","layout":{"type":"default"}} -->
<div class="wp-block-group date-card__tile"><!-- wp:paragraph {"className":"date-card__day"} -->
<p class="date-card__day">17</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"date-card__month"} -->
<p class="date-card__month">Aug</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Church in the Park</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"date-card__meta"} -->
<p class="date-card__meta">{service.day} · {service.startTime}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"date-card__meta"} -->
<p class="date-card__meta">{location.full}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
```

- [ ] **Step 10: Verify**

Repeat Task 7 Step 11 with these nine slugs:
- the registry lists 21 `elevation/*` patterns;
- the scratch page returns 200;
- the validator passes;
- at 1440px and 390px the values grid is 3, then 2, then 1 across;
- the badges wrap;
- the Growth Track is 2 across from 768px;
- the accordion chevron turns when an item is closed;
- the portrait cards show the ink gradient with the name over it.

Delete the scratch page afterwards.

- [ ] **Step 11: Commit**

```bash
git add wp-content/themes/elevation
git commit -m "Patterns: values, badges, Growth Track, accordion, leadership, giving cards, side boxes, stats, date card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Pages — Home, I'm New, About, What We Believe

**Files:**
- Modify: `seed/pages/home.html` (replaces Plan 1's placeholder)
- Create: `seed/pages/im-new.html`, `seed/pages/about.html`, `seed/pages/what-we-believe.html`
- Create: `bin/check-tokens.sh`
- Modify: `bin/seed.sh`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append the About story styles)

**Interfaces:**
- Consumes:
  - every Task 7 and 8 pattern (copy its markup, then change the copy as listed);
  - the media keys under `redesign/`;
  - the `seed_post` metadata options (Task 1).
- Produces:
  - Pages `home` (the front page), `im-new`, `about` and `about/what-we-believe`.
  - The anchors `imnew`, `involve`, `what-to-expect`, `find-us`, `kids`, `our-story`, `vision-values` and `leadership`. These are the targets the Plan 1 footer and menu already link to.
  - `bin/check-tokens.sh <path>...`, which exits 1 and lists any raw `{token}` it finds.

**How to build a page.**
- A page seed is its sections in order, each copied from the pattern named below with the copy replaced exactly as quoted.
- Use the wrappers from Task 7, and keep every `reveal` class the patterns have.
- Every "Sunday" is `{service.day}` (decision 9).

- [ ] **Step 1: `bin/check-tokens.sh`**

```bash
#!/usr/bin/env bash
# Fails if a page still shows a raw {settings.token}. Usage: bin/check-tokens.sh / /about/ …
set -euo pipefail
base=${BASE_URL:-http://localhost:8080}
status=0
for path in "$@"; do
  found=$(curl -fsS "$base$path" | grep -oE '\{[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+\}' | sort -u || true)
  if [ -n "$found" ]; then
    echo "$path: $(echo "$found" | tr '\n' ' ')"
    status=1
  fi
done
[ "$status" -eq 0 ] && echo "No raw tokens on $# page(s)."
exit "$status"
```

`chmod +x bin/check-tokens.sh`.

- [ ] **Step 2: `seed/pages/home.html`**

1. **`home-hero`**, unchanged.
2. **`image-cards-3`**, as a white section with `"anchor":"imnew"`. Each card's image block gets `"id":{{media-id:<key>}}`, the `src` and the `wp-image-{{media-id:<key>}}` class.

   | Card | Image key | Icon | Title | Body | CTA → |
   |---|---|---|---|---|---|
   | 1 | `redesign/im-new/what-to-expect.jpg` | `house` | What to expect | Passionate worship, a practical message from the Bible, and a genuinely warm welcome. Come as you are — nobody is checking what you're wearing. | Learn more → `/im-new#what-to-expect` |
   | 2 | `redesign/im-new/times-and-location.jpg` | `map-pin` | Times & location | {service.day}s at {service.startTime} in the {location.venue} on the {location.campus} campus. We'll help you find your way in. | Get directions → `/im-new#find-us` |
   | 3 | `redesign/im-new/kids-and-teens.jpg` | `baby` | Kids & teens | The Seeds runs every {service.day} for children, including a baby class, and 412 Nation is for teenagers. They're in good hands. | See their spaces → `/im-new#kids` |
3. **Watch** (grey section, no video yet). Plan 4 replaces this section.

```html
<!-- wp:group {"className":"split split--watch","layout":{"type":"default"}} -->
<div class="wp-block-group split split--watch"><!-- wp:group {"className":"watch-tile reveal","layout":{"type":"default"}} -->
<div class="wp-block-group watch-tile reveal"><!-- wp:paragraph {"className":"watch-tile__chip"} -->
<p class="watch-tile__chip"><a href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener">Every message, on YouTube</a></p>
<!-- /wp:paragraph -->

<!-- wp:elevation/icon {"name":"play","size":30,"filled":true,"className":"watch-tile__play","textColor":"ink"} /--></div>
<!-- /wp:group -->

<!-- wp:group {"className":"watch-intro reveal","layout":{"type":"default"}} -->
<div class="wp-block-group watch-intro reveal"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Messages</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Missed a {service.day}?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Full services and recent messages go up on our YouTube channel. Subscribe and you'll know the moment a new one lands.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"linkTarget":"_blank","rel":"noreferrer noopener"} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener">Watch now</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-ghost"} -->
<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/watch">All messages</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
```

4. **What's on** (white section, no events yet). Plan 3 replaces this section.

```html
<!-- wp:group {"className":"section-head-row","layout":{"type":"default"}} -->
<div class="wp-block-group section-head-row"><!-- wp:group {"className":"section-heading","layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group section-heading"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">What's on</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">This week at Elevation</h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-ghost has-arrow"} -->
<div class="wp-block-button is-style-ghost has-arrow"><a class="wp-block-button__link wp-element-button" href="/events">View all</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"grid-3","layout":{"type":"default"}} -->
<div class="wp-block-group grid-3"><!-- wp:group {"tagName":"article","className":"card-gathering span-2 reveal","layout":{"type":"default"}} -->
<article class="wp-block-group card-gathering span-2 reveal"><!-- wp:paragraph {"className":"is-style-eyebrow-on-ink"} -->
<p class="is-style-eyebrow-on-ink">Every week</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3,"textColor":"white"} -->
<h3 class="wp-block-heading has-white-color has-text-color">{service.day} Gathering</h3>
<!-- /wp:heading -->

<!-- wp:group {"className":"card-gathering__meta","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-group card-gathering__meta"><!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:elevation/icon {"name":"clock","size":16,"textColor":"green"} /-->

<!-- wp:paragraph -->
<p>{service.startTime}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:elevation/icon {"name":"map-pin","size":16,"textColor":"green"} /-->

<!-- wp:paragraph -->
<p>{location.venue}, {location.postcode}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/im-new">Plan your visit</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></article>
<!-- /wp:group -->

<!-- wp:group {"tagName":"article","className":"card-soon reveal","layout":{"type":"default"}} -->
<article class="wp-block-group card-soon reveal"><!-- wp:elevation/icon {"name":"sparkles","size":26,"className":"card-soon__tile","backgroundColor":"green-100","textColor":"green-700"} /-->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">More coming soon</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Conferences, socials and midweek gatherings get announced on Instagram first.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-ghost","linkTarget":"_blank","rel":"noreferrer noopener"} -->
<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="{socials.instagram.url}" target="_blank" rel="noreferrer noopener">Follow along</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></article>
<!-- /wp:group --></div>
<!-- /wp:group -->
```

5. **`ink-cards-4`**, with `"anchor":"involve"`.

   | Icon | Title (link) | Body |
   |---|---|---|
   | `users` | Connect Groups → `/get-involved#connect-groups` | Small groups across Manchester. Big enough to receive you, small enough to know you. |
   | `sparkles` | Serve on the G-Squad → `/get-involved#serve` | Worship, welcome, kids, tech, production — more than forty teams to join. |
   | `baby` | The Seeds & 412 Nation → `/get-involved#kids-and-teens` | Safe, joyful spaces for children and teenagers, every single {service.day}. |
   | `compass` | Next steps → `/get-involved#next-steps` | The Growth Track — from your first {service.day} to living out your purpose. |

- [ ] **Step 3: `seed/pages/im-new.html`**

1. **`page-hero`**: "Plan a visit" / "Your first {service.day}, made simple" / "Walking into a new church can feel like a lot. Here's everything you need so that it doesn't."
2. **`info-cards`**, as a white section with `"anchor":"what-to-expect"`. Heading: "What to expect" / "The honest answers to the questions everyone asks" (no lead). There are five cards:

   | Icon | Title | Body |
   |---|---|---|
   | `clock` | When should I arrive? | {service.startSentence} Come a little early if you'd like to say hello, and stay afterwards for coffee — we'd genuinely love to meet you. |
   | `shirt` | What should I wear? | Whatever you're comfortable in. You'll see suits and you'll see trainers — nobody is checking. |
   | `users` | What actually happens? | Passionate worship, a practical message from the Bible, and time to pray. It's Spirit-filled, warm and jargon-light — you won't feel lost. |
   | `baby` | What about my children? | The Seeds runs every {service.day} for children, including a baby class, and 412 Nation is for teenagers. Our team will help you get them settled. |
   | `car` | Where do I park? | We meet in the {location.venue} on the {location.campus} campus. Our Protocol team will point you in the right direction when you arrive. |
3. **`two-col-text-media`**, unchanged (grey, `find-us`).
4. **Kids** (white section with `"anchor":"kids"`):
   - Section heading: "For your family" / "Kids and teens are looked after" / "They get their own space, their own team and their own thing going on — while you get to be present in the service."
   - Then a `grid-3 mt-12` group of three "name + eyebrow" info cards:

   | Name | Eyebrow | Body |
   |---|---|---|
   | The Seeds | Children's Church, including a baby class | A safe, fun and faith-building space for our youngest every {service.day}. |
   | 412 Nation | Teens Church | Where teenagers belong, ask real questions and build real friendships. |
   | Surge | Youth ministry | The Elevation Church's global youth ministry. |
5. **`cta-band`**, unchanged: "Still have a question?" / "Get in touch".

   Plan 5 inserts the Plan a Visit and Connect card sections before this band.

- [ ] **Step 4: `seed/pages/about.html`**

1. **`page-hero`**, unchanged: "About us" / "A church family with one mandate" / `{church.mission}`.
2. **Our story** (white section with `"anchor":"our-story"`). A `split split--story` group holds:
   - a section heading: "Our story" / "How we got here" (no lead);
   - a `story-text` group with three paragraphs:
     1. The Elevation Church began in Lagos, Nigeria, on 10 October 2010 — 10.10.10 — founded by Pastor Godman Akinlabi in response to a leading from God, and inaugurated later that year with Rev. Sam Adeyemi.
     2. What started as one gathering has grown into a global family of churches — we call them `<strong>expressions</strong>` — across Nigeria, the UK, Europe and the US.
     3. {church.shortName} launched on {church.launched}, led by Pastor Tosin Babalola, to bring that same message of hope and greatness to this city.
3. **Vision & values** (grey section with `"anchor":"vision-values"`), containing:
   - a section heading: "Vision & values" / "What we're built on" / `Everything we do traces back to one line of scripture: "{church.bedrockText}" — {church.bedrockReference}.`;
   - **`values-grid`**, with all six ASHLIE cards;
   - **`badge-cloud`**, with seven badges: Humble, Simple, Youthful, Audacious, Intelligent, Compassionate, Friendly.
4. **Leadership** (white section with `"anchor":"leadership"`), containing:
   - a section heading: "Leadership" / "The people who serve this house" (no lead);
   - **`leadership`**, with an image on each cover (Task 8 Step 5):

   | Image key | Name | Role | Bio |
   |---|---|---|---|
   | `redesign/leadership/pastor-tosin-babalola.jpg` | Pastor Tosin Babalola | Resident Pastor, Manchester | Pastor Tosin leads the Manchester expression of The Elevation Church, which launched on {church.launched}. |
   | `redesign/leadership/pastor-godman-akinlabi.jpg` | Pastor Godman Akinlabi | Lead Pastor & Founder | Pastor Godman founded The Elevation Church in Lagos, Nigeria on 10 October 2010, and leads the global family of expressions alongside Pastor Bola Akinlabi. |
   | `redesign/leadership/pastor-bola-akinlabi.jpg` | Pastor Bola Akinlabi | Founding Pastor | Pastor Bola serves alongside Pastor Godman in leading The Elevation Church globally. |

   Each cover's alt is "Portrait of <name>".
5. **`cta-band`**: "What we believe" / "The convictions underneath everything above — set out plainly, with the scripture behind each one." / one green button with `has-arrow`, "Read our statement of faith" → `/about/what-we-believe`.

Append to `site.css`:

```css
/* About: our story */
.story-text > p { margin: 0; font-size: 18px; color: var(--wp--preset--color--grey-500); text-wrap: pretty; }
.story-text > p + p { margin-top: 20px; }
.story-text strong { font-weight: 500; color: var(--wp--preset--color--ink); }
```

- [ ] **Step 5: `seed/pages/what-we-believe.html`**

1. **`page-hero`**: "Statement of faith" / "What we believe" / "We're a Pentecostal church — Bible-centred and Spirit-filled. Here's what that actually means, in plain English."
2. **`accordion`**, with seven items, all `showContent: true`:

   | Title | Body | Scripture |
   |---|---|---|
   | One God, three persons | There is one God, manifested in three persons — Father, Son and Holy Spirit. | Deuteronomy 6:4 |
   | Jesus Christ | Jesus Christ is the Son of God, and the only way to the Father. | Matthew 1:18–25; John 14:6 |
   | The Bible | The Bible is God's inspired Word. | 2 Timothy 3:16 |
   | Salvation | All people need salvation, and it is received freely by grace through faith — believing in your heart and confessing with your mouth. | Romans 3:23; Romans 10:9; Ephesians 2:8 |
   | Death, resurrection and return | Jesus died, rose again and is coming again; the dead will rise. | 1 Corinthians 15:4; Acts 1:11; 1 Thessalonians 4:16–17 |
   | Baptism and the Lord's Supper | We practise Water Baptism and the Lord's Supper. | Matthew 28:19; Matthew 26:26–29 |
   | The Holy Spirit and healing | We believe in the Baptism of the Holy Spirit, and that healing is provided in the atonement of Christ. | Mark 16:17–18; Acts 1:8; James 5:14–15; 1 Peter 2:24 |
3. **`growth-track`**, unchanged (grey, with all four steps).
4. **`cta-band`**: "Questions are welcome here" / "If something above raised a question rather than answered one, that's a good sign. Come and ask." Its buttons are a green "Plan a visit" → `/im-new` and a ghost-on-dark "Contact us" → `/contact`.

- [ ] **Step 6: Seed lines**

In `bin/seed.sh`, keep the home line from Task 1. After it, add:

```bash
seed_post page im-new pages/im-new.html "I'm New" \
  --meta-description="Planning your first visit to {church.name}? Here's what to expect on a {service.day}, where to park, and what happens with your kids."
seed_post page about pages/about.html "About" \
  --meta-description="Our story, our vision and values, and the people who lead {church.name} — an expression of The Elevation Church."
seed_post page what-we-believe pages/what-we-believe.html "What We Believe" --parent=about \
  --meta-description="The statement of faith of {church.name} — one God in three persons, salvation by grace through faith, the Baptism of the Holy Spirit, and healing in the atonement."
```

- [ ] **Step 7: Seed and check**

```bash
./bin/seed.sh
for p in / /im-new/ /about/ /about/what-we-believe/; do printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8080$p"; done
./bin/check-tokens.sh / /im-new/ /about/ /about/what-we-believe/
for a in imnew involve; do curl -s http://localhost:8080/ | grep -c "id=\"$a\""; done
for a in what-to-expect find-us kids; do curl -s http://localhost:8080/im-new/ | grep -c "id=\"$a\""; done
for a in our-story vision-values leadership; do curl -s http://localhost:8080/about/ | grep -c "id=\"$a\""; done
curl -s http://localhost:8080/about/ | grep -o '<title>[^<]*</title>'
```

Expected:
- Four `200`s.
- `No raw tokens on 4 page(s).`
- Every anchor count is `1`.
- `<title>Elevation Church Manchester | About</title>`.

- [ ] **Step 8: Validate and compare**

In the browser:
- Run `bin/validate-blocks.js`. The four pages must be valid.
- Then view each page at 1440px and 390px against the redesign sections in inventory §1 (Home, I'm New, About, What We Believe). Check in particular:
  - Home: the hero fills the viewport under a transparent header, and the slideshow rotates. The three image cards have overhanging badges. The watch tile is 16:9 with a white play circle. The Gathering card spans two columns at 1440px. There are four dark cards at 1440px, and one per row at 390px.
  - I'm New: the flat cards are 3, then 2, then 1 across. The map placeholder sits in a bordered frame. The CTA band stacks at 390px.
  - About: story columns are 1fr/1.2fr at 1440px; the values letters are green-700; the badges wrap; the portraits are 4:5 with the name over a gradient.
  - What We Believe: all seven items are open, and each closes on click with the chevron turning.
- Hover states lift cards unless reduced motion is emulated.
- The footer links "What to expect", "Times & location" and "Kids & youth" now land on their sections, below the sticky header thanks to `scroll-margin-top`.

Record any intentional difference in the report. For example, green text is green-700 by design.

- [ ] **Step 9: Commit**

```bash
git add seed/pages bin/seed.sh bin/check-tokens.sh wp-content/themes/elevation/assets/css/site.css
git commit -m "Seed Home, I'm New, About and What We Believe from the patterns; token check script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Pages — Watch, Get Involved, Give, Prayer, Contact

**Files:**
- Create: `seed/pages/watch.html`, `get-involved.html`, `give.html`, `prayer.html`, `contact.html`
- Modify: `bin/seed.sh`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append the Give page styles)

**Interfaces:**
- Consumes: the patterns, `bin/check-tokens.sh` and the section wrappers.
- Produces:
  - Pages `watch`, `get-involved`, `give`, `prayer` and `contact`.
  - The anchors `connect-groups`, `serve`, `kids-and-teens`, `support`, `next-steps` and `gift-aid`.
  - The empty form slots `form-slot--prayer`, `form-slot--contact` and `form-slot--gift-aid` (Plan 5).
  - The Watch archive panel `panel-watch` (Plan 4 replaces it).

An empty form slot is written as:

```html
<!-- wp:group {"className":"form-slot form-slot--contact","layout":{"type":"default"}} -->
<div class="wp-block-group form-slot form-slot--contact"></div>
<!-- /wp:group -->
```

- [ ] **Step 1: `seed/pages/watch.html`**

1. **`page-hero`**: "Messages" / "Watch & grow" / "Catch this week's message or dig into the archive. Live every {service.day} at {service.startTime}."
2. **Archive panel** (white section):

```html
<!-- wp:group {"className":"panel-watch","layout":{"type":"default"}} -->
<div class="wp-block-group panel-watch"><!-- wp:elevation/icon {"name":"monitor-play","size":40} /-->

<!-- wp:heading -->
<h2 class="wp-block-heading">Every message, on our channel</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Full services and recent messages are on YouTube. Subscribe and you'll know the moment a new one lands.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-size-lg","linkTarget":"_blank","rel":"noreferrer noopener"} -->
<div class="wp-block-button is-size-lg"><a class="wp-block-button__link wp-element-button" href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener">Watch on YouTube</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->
```

3. **`cta-band`**: "Better in the room" / "Online is good. In person is better. {service.day}s at {service.startTime}, {location.full}." / a green `is-size-lg` "Plan a visit" → `/im-new`.

- [ ] **Step 2: `seed/pages/get-involved.html`**

1. **`page-hero`**: "Belong here" / "Get involved" / "{service.day} is the front door, not the whole house. This is where church stops being an event and starts being a family."
2. **Connect Groups** (white section with `"anchor":"connect-groups"`). A `split` group holds two parts.

   The left group contains:
   - a section heading: "Connect Groups" / "Big enough to receive you, small enough to know you" / "Connect Groups are our small-group system and the main way we care for one another through the week. Some are based on where you live, others on a shared season or interest — families, young couples, professionals, fitness and more.";
   - a navy button "Find a group" → `/contact`, in buttons with class `mt-8`.

   The right part is this card:

```html
<!-- wp:group {"className":"is-style-card-flat card--green","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat card--green"><!-- wp:elevation/icon {"name":"users","size":28} /-->

<!-- wp:heading {"level":3,"fontSize":"large"} -->
<h3 class="wp-block-heading has-large-font-size">What actually happens</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>Food, usually. Always conversation.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Working through what was taught on {service.day}, in a room small enough to ask the awkward question.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Praying for each other by name.</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Showing up when life gets hard — the reason the group exists.</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></div>
<!-- /wp:group -->
```

3. **G-Squad** (grey section with `"anchor":"serve"`), containing:
   - a section heading: "G-Squad" / "Serve on the Greatness Squad" / "The G-Squad is our volunteer workforce and the engine of this church. There are more than forty units to serve on — whatever you're good at, there's a place for it.";
   - a badge list with class `is-style-badges is-roomy mt-10`, holding the 20 teams in this order: Care, Family Life, Men of Honour, Missions, Worship, Ushering, Hospitality & Guest Management, Protocol & Traffic Management, The Jewels (women), Maturity, Surge (youth), 4One, Production, Multimedia, Setup & Sound, Media & Broadcasting, Membership, Communications, Prayer, The Seeds;
   - a navy "Join the G-Squad" button → `/contact`, in buttons with class `mt-10`.
4. **Kids & teens** (white section with `"anchor":"kids-and-teens"`), containing:
   - a section heading: "Kids & teens" / "Where the next generation belongs" (no lead);
   - `grid-3 mt-12` with three "name + eyebrow" info cards (Task 7 Step 6):

   | Name | Eyebrow | Body |
   |---|---|---|
   | The Seeds | Children's Church, including a baby class | A safe, fun and faith-building space for our youngest every {service.day}. |
   | 412 Nation | Teens Church | Where teenagers belong, ask real questions and build real friendships. |
   | Surge | Youth ministry | The Elevation Church's global youth ministry. |
5. **Support** (grey section with `"anchor":"support"`), containing:
   - a section heading: "Support" / "When you need more than a {service.day}" / "These are here for anyone — you don't have to be a member, and you don't have to explain yourself first.";
   - `grid-2 mt-12` with four flat info cards, each with icon `heart-handshake`:

   | Title | Body |
   |---|---|
   | Family Life | Marriage, premarital and parenting counselling. |
   | Counselling | Confidential support when life is hard. |
   | CareerPro | Career counselling and professional guidance. |
   | Care Unit | Benevolence and practical support for those in need. |
6. **`growth-track`** as a **white** section: remove `backgroundColor` and add `"anchor":"next-steps"`. Heading: "Your next steps" / "The Growth Track" / "Not sure where to start? Start at the top and work down." The steps are unchanged.
7. **`cta-band`**: "Not sure where you'd fit?" / "Tell us a bit about yourself and we'll point you somewhere sensible." / a green "Talk to us" button → `/contact`.

- [ ] **Step 3: `seed/pages/give.html`**

1. **`page-hero`**: "Generosity" / "Give" / "Your generosity fuels the mission in Manchester — {service.day} gatherings, our children's and teens' work, and practical care for people who need it."
2. **`give-cards`**, unchanged.
3. **Gift Aid** (grey section with `"anchor":"gift-aid"`), holding a `{"layout":{"type":"constrained","contentSize":"768px"}}` group that contains:
   - a centred section heading: "Gift Aid" / "Add 25% to your giving, at no cost to you" / "If you pay UK tax, Gift Aid lets us reclaim 25p for every £1 you give — so £10 becomes £12.50. You only need to do this once; it covers your future giving and the past four years.";
   - the empty form slot `form-slot form-slot--gift-aid`;
   - `<!-- wp:paragraph {"className":"gift-aid-note"} -->`: "We store your declaration securely and use it only to claim Gift Aid on your giving. HMRC requires us to keep it for as long as you give, and for six years afterwards."
4. **Thank you** (white section), holding a `{"className":"give-thanks","layout":{"type":"constrained","contentSize":"672px"}}` group that contains:
   - the heading "Thank you";
   - the paragraph "Every gift, of every size, goes towards making greatness common in this city. If you'd like to know more about how giving is used, just ask — we're happy to talk it through.";
   - a centred buttons row (class `mt-8`) with a ghost "Ask about giving" → `/contact`.

Append to `site.css`:

```css
.gift-aid-note { max-width: 576px; margin: 24px auto 0 !important; text-align: center; font-size: 12px; color: var(--wp--preset--color--grey-500); }
.give-thanks { text-align: center; }
.give-thanks > h2 { font-size: 24px; font-weight: 600; }
.give-thanks > p { margin-top: 16px; color: var(--wp--preset--color--grey-500); }
```

- [ ] **Step 4: `seed/pages/prayer.html`**

1. **`page-hero`**: "Prayer" / "Let us pray with you" / "Whatever you're carrying, you don't have to carry it on your own. Tell us and our team will pray."
2. **White section** with a `split split--form` group. It holds `form-slot form-slot--prayer`, then **`aside-boxes`** with three boxes:
   1. The panel "Who sees this?", with the pattern's text.
   2. The panel "Need to talk to someone?", with two paragraphs:
      - "We offer free, confidential counselling, alongside Family Life support for marriage, premarital and parenting."
      - `Email <a href="mailto:{contact.email}">{contact.email}</a> and we'll arrange it.`
   3. The alert panel "If it's an emergency", with the pattern's text.

- [ ] **Step 5: `seed/pages/contact.html`**

1. **`page-hero`**: "Say hello" / "Get in touch" / "Questions about visiting, joining a Connect Group, serving, or anything else — this reaches a real person."
2. **White section** with a `split split--form` group. It holds `form-slot form-slot--contact`, then a `{"className":"aside-stack"}` group with five groups. Each of the first four starts with an `aside-heading` row:

```html
<!-- wp:group {"className":"aside-heading","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group aside-heading"><!-- wp:elevation/icon {"name":"map-pin","size":20} /-->

<!-- wp:heading -->
<h2 class="wp-block-heading">Where we meet</h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->
```

   | Icon | Heading | Then |
   |---|---|---|
   | `map-pin` | Where we meet | the `address-block` group (Task 7 Step 9), then a paragraph `<a href="{location.mapsUrl}" target="_blank" rel="noreferrer noopener">Get directions</a>` |
   | `clock` | {service.day} service | a paragraph with class `aside-text`: {service.day}s at {service.startTime} |
   | `mail` | Email | a paragraph `<a href="mailto:{contact.email}">{contact.email}</a>` |
   | `phone` | Phone | a paragraph `<a href="tel:{contact.phoneTel}">{contact.phoneLabel}</a>` |
   | none | "Follow us" (a plain h2) | a list of four items, one per social (`youtube`, `instagram`, `facebook`, `x`): `<a href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener"><strong>{socials.youtube.name}</strong> {socials.youtube.handle}</a>` |

3. **Map band.** Add the Contact address style to `site.css` as well:

```html
<!-- wp:group {"align":"full","className":"map-band","layout":{"type":"default"}} -->
<div class="wp-block-group alignfull map-band"><!-- wp:elevation/embed-gate {"height":420,"align":"full"} /--></div>
<!-- /wp:group -->
```

```css
.aside-stack .address-block > p:first-child { font-weight: 400; }
```

- [ ] **Step 6: Seed lines**

```bash
seed_post page watch pages/watch.html "Watch" \
  --meta-description="Watch {church.name} live on {service.day}s at {service.startTime}, or catch up on recent messages."
seed_post page get-involved pages/get-involved.html "Get Involved" \
  --meta-description="Connect Groups, serving on the G-Squad, The Seeds and 412 Nation, and the support ministries at {church.name}."
seed_post page give pages/give.html "Give" \
  --meta-description="Give to {church.name} online, by bank transfer or by cheque. UK taxpayers can Gift Aid their gift to add 25% at no extra cost."
seed_post page prayer pages/prayer.html "Prayer" \
  --meta-description="Send a prayer request to {church.name}. Our team will pray, and nothing you share is made public."
seed_post page contact pages/contact.html "Contact" \
  --meta-description="Get in touch with {church.name} — {location.venue}, {location.campus}. {service.day}s at {service.startTime}."
```

- [ ] **Step 7: Seed and check**

```bash
./bin/seed.sh
for p in /watch/ /get-involved/ /give/ /prayer/ /contact/; do printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8080$p"; done
./bin/check-tokens.sh /watch/ /get-involved/ /give/ /prayer/ /contact/
for a in connect-groups serve kids-and-teens support next-steps; do curl -s http://localhost:8080/get-involved/ | grep -c "id=\"$a\""; done
curl -s http://localhost:8080/give/ | grep -c 'id="gift-aid"'
curl -s http://localhost:8080/give/ | grep -o 'paypal.com/donate/?hosted_button_id=[A-Z0-9]*'
curl -s http://localhost:8080/contact/ | grep -o 'tel:+447469062220'
```

Expected:
- Five `200`s.
- No raw tokens.
- Every anchor count is `1`.
- The PayPal URL is the settings value.
- The `tel:` link is present.

- [ ] **Step 8: Validate and compare**

In the browser:
- The validator passes.
- At 1440px and 390px against inventory §1:
  - Watch: the panel is centred and 672px wide, with the monitor icon.
  - Get Involved: the green card sits beside the text at 1440px; there are 20 badges; the support cards are 2 across.
  - Give: the online card spans two columns next to the ink Gift Aid card; the separator and "Other ways" follow; the bank numbers are monospace; "Make your declaration" scrolls to `#gift-aid`.
  - Prayer: the aside is on the right at 1440px, and the alert panel is red-tinted.
  - Contact: the aside headings have green-700 icons; the full-width map placeholder is 420px tall; "Show the map" loads only that map.
- Contact and Prayer each have an empty left column. That is expected (decision 3); note it in the report.

- [ ] **Step 9: Commit**

```bash
git add seed/pages bin/seed.sh wp-content/themes/elevation/assets/css/site.css
git commit -m "Seed Watch, Get Involved, Give, Prayer and Contact; form slots for Plan 5

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Privacy notice

**Files:**
- Create: `seed/pages/privacy.html`
- Modify: `bin/seed.sh`

**Interfaces:**
- Consumes: `page-hero`, `rich-text-section` and `elevation/consent-controls`.
- Produces:
  - The page `privacy`, set as WordPress's privacy policy page.
  - The anchors `who-we-are`, `what-we-collect`, `how-long`, `who-we-share-with`, `cookies`, `your-rights`, `complaints` and `changes`.
  - The WordPress default content is removed: the `sample-page` and `privacy-policy` pages and the `hello-world` post.

This notice follows spec §11: the WordPress processors, GA4 only with consent, the new data sets, and six-year Gift Aid retention. **The retention periods for contact messages, visit plans, connect cards, group requests, and G-Squad and Alpha sign-ups are drafts.** Task 14 lists them for the church to confirm.

**Notation.** The notice below is written one block per line:

| Prefix | Block |
|---|---|
| `H2#id` | `core/heading` level 2 with that `anchor` |
| `H3` | `core/heading` level 3 |
| `P` | `core/paragraph` |
| `P.<class>` | `core/paragraph` with that `className` |
| `LI` | a `core/list-item` (consecutive items form one `core/list`) |
| `CONTROLS` | `<!-- wp:elevation/consent-controls /-->` |

`<strong>`, `<a>` and `<code>` are inline markup inside the text.

- [ ] **Step 1: `seed/pages/privacy.html`**

1. **`page-hero`**: "Legal" / "Privacy notice" / "What we collect, why we collect it, how long we keep it, and what you can ask us to do about it."
2. **`rich-text-section`**, with the `rich-text` group holding, in order:

```
P.rich-text__meta  Last updated 29 September 2026.
H2#who-we-are  Who we are
P  {church.name} is part of {church.legalName}, a charity registered in England and Wales (number {church.charityNumber}). We meet at {location.venue}, {location.campus}, {location.postcode}.
P  For data protection purposes we are the "controller" of the information described here — that means we decide what is collected and why. If you have any question about this notice, or want to make a request about your information, email us at <a href="mailto:{contact.email}">{contact.email}</a>.
H2#what-we-collect  What we collect, and why
P  We collect the information you choose to give us through the forms on this site. If you allow it, we also use Google Analytics to understand how the site is used (see Cookies below). We don't advertise, we don't sell your information, and we don't build profiles of you.
H3  When you contact us
P  The contact form asks for your name and email address, and optionally a phone number and subject. We use it to answer you. Our lawful basis is <strong>legitimate interests</strong> — you have asked us a question and we need your details to reply.
H3  When you send a prayer request
P  You can send a prayer request anonymously. If you give your name or contact details, they are stored with the request. A prayer request may reveal things about your religious beliefs or your health, which the law treats as <strong>special category data</strong> and protects more strictly.
P  Our lawful basis is <strong>consent</strong>, and the additional condition we rely on for special category data is your <strong>explicit consent</strong>, given when you submit the form. You can withdraw it at any time by emailing us, and we will delete the request.
P  Prayer requests are treated as pastoral confidences. They are sent to a separate prayer inbox rather than the church's general email, and on the website only the small number of people trusted with pastoral confidences can read them. If you tick the box to share a request with the wider prayer team, we take that as your permission to pass it beyond the immediate pastoral team; if you don't, we won't.
H3  When you make a Gift Aid declaration
P  To claim Gift Aid we are required by HMRC to record your title, full first name and surname, your home address including house name or number, and your postcode. We also record the wording of the declaration you agreed to and when you made it. Email and phone are optional and used only to confirm the declaration or contact you about changes.
P  Our lawful basis is <strong>legal obligation</strong> — we cannot make a valid Gift Aid claim without these details. This information is shared with <strong>HM Revenue &amp; Customs</strong> when we make a claim.
H3  When you plan a visit
P  The Plan a Visit form asks for your name, email and phone number, the {service.day} you plan to come, how many adults and children are coming, your children's ages if you'd like us to be ready for them, and anything else you'd like us to know. We use it to welcome you, and we email you a confirmation with the time and address. Our lawful basis is <strong>legitimate interests</strong> — you have asked us to expect you. Please don't include children's names.
H3  When you fill in a connect card
P  The connect card asks for your name, contact details, postcode and how you'd like to get involved, so our welcome team can follow up. We ask only for your postcode, not your full address. Our lawful basis is <strong>consent</strong>, which you can withdraw at any time.
H3  When you ask to join a Connect Group
P  We pass your name, contact details and message to the leader of the group you chose, and to our welcome team, so they can get in touch. Group leaders' email addresses are never shown on the site. Our lawful basis is <strong>legitimate interests</strong> — you have asked to be put in touch.
H3  When you sign up for the G-Squad or Alpha
P  We store the details you give so the team leader or Alpha host can contact you and arrange your place. Our lawful basis is <strong>legitimate interests</strong>.
H3  When you join the mailing list
P  We store your email address to send you church news. Our lawful basis is <strong>consent</strong>. Email us at any time and we will remove your address.
H3  When you have a website account
P  If you help run the website, we store your name, email address, your role, and the changes you make — WordPress keeps earlier versions of pages so mistakes can be undone. Our lawful basis is <strong>legitimate interests</strong> in running the site securely.
H2#how-long  How long we keep it
LI  <strong>Gift Aid declarations</strong> — for six years after the last gift they cover, because HMRC requires it. A cancelled declaration is kept for the same period as evidence of when it applied.
LI  <strong>Prayer requests</strong> — only while they are being prayed for and followed up, then deleted. Ask us sooner and we will delete them straight away.
LI  <strong>Contact messages</strong> — up to 12 months after we have dealt with your enquiry.
LI  <strong>Visit plans</strong> — up to 12 months after the date you planned to visit.
LI  <strong>Connect cards, Connect Group requests, and G-Squad and Alpha sign-ups</strong> — up to two years, or until you ask us to delete them.
LI  <strong>Mailing list</strong> — until you ask to be removed.
LI  <strong>Website accounts</strong> — while the account is active; page history is kept afterwards so the record of changes stays intact.
H2#who-we-share-with  Who else is involved
P  We do not sell your information and we do not share it for marketing. We use a small number of suppliers to run the site, who process information on our instructions:
LI  <strong>The Elevation Church, our parent church</strong> — hosts this website and its database on a server it runs with Liquid Web. Form submissions and website accounts are stored there.
LI  <strong>Resend</strong> — sends the site's emails, such as form notifications and visit confirmations.
LI  <strong>Google</strong> — Google Analytics, only if you allow analytics; and the embedded Google Maps and YouTube players, only if you allow them or press play.
LI  <strong>Podbean</strong> — the podcast player on our Resources page, only if you allow it or press play.
LI  <strong>HM Revenue &amp; Customs</strong> — receives Gift Aid claims.
P  Some of these suppliers are based outside the UK. Where information is transferred abroad, it is protected by the safeguards UK data protection law requires, such as the International Data Transfer Agreement or an adequacy decision.
H2#cookies  Cookies and similar technology
P  We ask before anything optional loads. On your first visit a small banner lets you accept or reject analytics and embedded maps and videos, or choose each one. Nothing from Google or Podbean loads until you decide.
LI  <strong>Your privacy choice</strong> — kept in your browser's local storage, not a cookie, so we don't have to ask again. It never leaves your device.
LI  <strong>Google Analytics cookies</strong> — only if you allow analytics. Google Analytics 4 sets <code>_ga</code> and <code>_ga_&lt;id&gt;</code> cookies, which last up to two years, to count visits and see which pages help people. Google Analytics 4 does not log or store IP addresses. If you later turn analytics off, we stop loading it and delete these cookies.
LI  <strong>Dismissed announcements</strong> — if you close a pop-up notice, we remember that in local storage so it doesn't reappear straight away.
LI  <strong>Login cookies</strong> — only for people who help run the website, so WordPress knows it is them. They are essential and can't be turned off while you are signed in.
P  <strong>Embedded maps, videos and the podcast player</strong> come from Google (Google Maps and YouTube) and Podbean. Loading one tells that company your IP address and details about your browser, and it may set its own cookies. Unless you have allowed maps and videos, you'll see a placeholder with a button instead, and nothing is requested until you press it.
P  You can change your choices here at any time:
CONTROLS
H2#your-rights  Your rights
P  You have the right to:
LI  ask for a copy of the information we hold about you;
LI  ask us to correct anything that is wrong;
LI  ask us to delete it, where we don't have a legal reason to keep it;
LI  ask us to restrict how we use it, or object to our using it;
LI  ask us to transfer it to you or another organisation, where it was given with your consent;
LI  withdraw consent at any time, where consent is what we relied on.
P  To exercise any of these, email <a href="mailto:{contact.email}">{contact.email}</a>. We will respond within one month. There is no charge.
H2#complaints  If you're unhappy
P  Please tell us first — we would rather put it right. If you are still not satisfied, you can complain to the Information Commissioner's Office, the UK regulator for data protection, at <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer noopener">ico.org.uk/make-a-complaint</a> or on 0303 123 1113.
H2#changes  Changes to this notice
P  If we change how we use your information we will update this page and the date at the top. If the change is significant we will say so clearly on the site.
P.rich-text__footer  Looking for something else? <a href="/contact">Get in touch</a> and we'll help.
```

A heading with an anchor is written like this:

```html
<!-- wp:heading {"anchor":"who-we-are"} -->
<h2 class="wp-block-heading" id="who-we-are">Who we are</h2>
<!-- /wp:heading -->
```

- [ ] **Step 2: Seed, remove WordPress defaults, set the privacy page**

In `bin/seed.sh`, before the page seeds, add:

```bash
# WordPress's sample content would shadow /sample-page and /privacy-policy, which now redirect (Task 13).
for spec in page:sample-page page:privacy-policy post:hello-world; do
  ids=$(wp post list --post_type="${spec%%:*}" --name="${spec#*:}" --post_status=any --format=ids)
  [ -n "$ids" ] && wp post delete $ids --force
done
```

After the other pages, add:

```bash
seed_post page privacy pages/privacy.html "Privacy notice" \
  --meta-description="How {church.name} collects, uses and protects your personal information, and the choices you have."
wp option update wp_page_for_privacy_policy "$(wp post list --post_type=page --name=privacy --field=ID)"
```

- [ ] **Step 3: Verify**

```bash
./bin/seed.sh
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/privacy/
./bin/check-tokens.sh /privacy/
for a in who-we-are what-we-collect how-long who-we-share-with cookies your-rights complaints changes; do curl -s http://localhost:8080/privacy/ | grep -c "id=\"$a\""; done
curl -s http://localhost:8080/privacy/ | grep -c 'data-ecm-consent-controls'
docker compose run --rm -T wpcli wp --user=admin post list --post_type=page,post --name=sample-page --format=count
```

Expected:
- `200`.
- No raw tokens.
- Eight `1`s for the anchors, and `1` for the controls.
- `0` for `sample-page`.

In the browser:
- The validator passes.
- The footer's "Privacy & cookies" opens the page.
- "Cookie settings" on /privacy scrolls to nothing new but opens the banner.
- The Privacy choices block toggles as in Task 4 Step 12.

- [ ] **Step 4: Commit**

```bash
git add seed/pages/privacy.html bin/seed.sh
git commit -m "Privacy notice for the WordPress site: consent-gated GA4, processors, new data sets, retention

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Kept live pages — Resources, Alpha, E-tracts, Church in the Park 2025

**Files:**
- Create: `bin/fetch-live-media.sh`
- Create: `seed/media/live.manifest` and `seed/media/live.sha256`
- Modify: `.gitignore` (add `seed/media/live/`)
- Create: `seed/pages/resources.html`, `alpha.html`, `etracts.html`, `church-in-the-park-2025.html`
- Modify: `bin/seed.sh`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append the gallery styles)

**Interfaces:**
- Consumes: the media import (Task 1), `elevation/embed-gate` with the `audio` kind (Task 4), the patterns, and `form-slot` (Task 10).
- Produces:
  - The pages `resources`, `resources/alpha`, `resources/etracts` and `church-in-the-park-2025`, at their live slugs.
  - The media keys `live/…`.
  - `form-slot--alpha`, which Plan 5 fills with the rebuilt Alpha form.

**Source:** the live site's export, `import/export.xml`, which has public page content only. The copy below was taken from its Elementor data; don't read `private/`. The 36 images are the pages' public attachment URLs on https://elevationmanchester.org. Downloading them once is part of this task.

- [ ] **Step 1: The manifest**

`seed/media/live.manifest`, one `<seed path> <public URL>` per line:

```
# Images used by the kept live pages (spec §5.5), fetched by bin/fetch-live-media.sh into seed/media/live/.
live/resources/pastors-godman-and-bola-akinlabi.png https://elevationmanchester.org/wp-content/uploads/2023/04/Image.png
live/alpha/alpha-promo.png https://elevationmanchester.org/wp-content/uploads/2025/08/Alpha-promo.png
live/etracts/jesus-loves-you-do-you-believe-this.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/jesus-loves-you-do-you-believer-this.jpg
live/etracts/the-peace-you-need-in-uncertain-times.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/the-peace-you-need-in-uncertain-times.jpg
live/etracts/jesus-is-the-only-way.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/jesus-is-the-only-way.jpg
live/etracts/reality-check.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/reality-check.jpg
live/etracts/why-carry-burdens.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/why-carry-burdens.jpg
live/etracts/heaven-is-for-you.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/heaven-is-for-you.jpg
live/etracts/if-you-have-jesus.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/if-you-have-jesus.jpg
live/etracts/jesus-love-is-unconditional.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/jesus-love-is-unconditional.jpg
live/etracts/there-is-rest-for-your-soul.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/there-is-rest-for-your-soul.jpg
live/etracts/god-is-not-partial.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/god-is-not-partial.jpg
live/etracts/what-can-be-more-valuable.jpg https://elevationmanchester.org/wp-content/uploads/2025/08/what-can-be-more-valuable.jpg
live/church-in-the-park-2025/cip-01.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06105.jpg
live/church-in-the-park-2025/cip-02.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06047.jpg
live/church-in-the-park-2025/cip-03.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06089.jpg
live/church-in-the-park-2025/cip-04.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06009.jpg
live/church-in-the-park-2025/cip-05.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06040.jpg
live/church-in-the-park-2025/cip-06.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05930-2.jpg
live/church-in-the-park-2025/cip-07.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05965.jpg
live/church-in-the-park-2025/cip-08.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05925-2.jpg
live/church-in-the-park-2025/cip-09.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05921-2-1-scaled.jpg
live/church-in-the-park-2025/cip-10.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05933-2.jpg
live/church-in-the-park-2025/cip-11.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05934-2-1-scaled.jpg
live/church-in-the-park-2025/cip-12.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05944-2-scaled.jpg
live/church-in-the-park-2025/cip-13.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05985.jpg
live/church-in-the-park-2025/cip-14.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05996-scaled.jpg
live/church-in-the-park-2025/cip-15.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC05994-scaled.jpg
live/church-in-the-park-2025/cip-16.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06007-scaled.jpg
live/church-in-the-park-2025/cip-17.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06035-scaled.jpg
live/church-in-the-park-2025/cip-18.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06048.jpg
live/church-in-the-park-2025/cip-19.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06050.jpg
live/church-in-the-park-2025/cip-20.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06052-scaled.jpg
live/church-in-the-park-2025/cip-21.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06069.jpg
live/church-in-the-park-2025/cip-22.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06108.jpg
live/church-in-the-park-2025/cip-23.jpg https://elevationmanchester.org/wp-content/uploads/2025/09/DSC06102.jpg
```

- [ ] **Step 2: The fetch script**

`bin/fetch-live-media.sh`:

```bash
#!/usr/bin/env bash
# Downloads the kept pages' images from the live site's public URLs into seed/media/live/ (gitignored),
# then checks them against seed/media/live.sha256. Run once with --record to write the checksums.
set -euo pipefail
cd "$(dirname "$0")/.."
while read -r path url; do
  case "$path" in '' | '#'*) continue ;; esac
  dest="seed/media/$path"
  [ -f "$dest" ] && continue
  mkdir -p "$(dirname "$dest")"
  curl -fsSL --retry 3 -o "$dest.part" "$url"
  mv "$dest.part" "$dest"
  echo "Fetched $path"
done < seed/media/live.manifest
if [ "${1:-}" = "--record" ]; then
  (cd seed/media && grep -v '^#' live.manifest | awk 'NF { print $1 }' | xargs shasum -a 256) > seed/media/live.sha256
  echo "Recorded $(wc -l < seed/media/live.sha256 | tr -d ' ') checksums."
else
  (cd seed/media && shasum -a 256 -c --quiet live.sha256)
fi
```

Then:

```bash
chmod +x bin/fetch-live-media.sh
echo 'seed/media/live/' >> .gitignore
./bin/fetch-live-media.sh --record
./bin/fetch-live-media.sh && echo verified
git status --short seed/media
```

Expected:
- 36 `Fetched …` lines, then `Recorded 36 checksums.`
- The second run prints `verified` with nothing fetched.
- `git status` shows only `live.manifest` and `live.sha256`, not the images.

In `bin/seed.sh`, before the media import, add:

```bash
./bin/fetch-live-media.sh || { echo "Couldn't fetch or verify the kept pages' images (bin/fetch-live-media.sh)." >&2; exit 1; }
```

- [ ] **Step 3: `seed/pages/resources.html`**

1. **`page-hero`**: eyebrow "Resources", title "View Free Resources", with no lead paragraph.
2. **White section** containing:
   - a section heading with only the title "Godman Akinlabi Podcast";
   - `<!-- wp:elevation/embed-gate {"kind":"audio","title":"Godman Akinlabi Podcast","src":"https://www.podbean.com/player-v2/?i=ktx57-6f746-pbblog-playlist&share=1&download=1&fonts=Arial&skin=1&font-color=&rtl=0&logo_link=&btn-skin=7&size=315","height":600} /-->`
3. **Grey section** with a `split` group.
   - Left: the h2 "Our Mission", then a paragraph with class `is-style-lead`, "{church.mission}".
   - Right: the h2 "Our Beliefs", then a list of five items:
     - We believe in the Godhead- the Father, the Son and the Holy Spirit.
     - We believe that God the Father, loved us so much that He sent Jesus Christ His son, to take on flesh so that He could die and save us (the world) from sin.
     - We believe that Jesus died and resurrected and is seated now at the right hand of the Father.
     - We believe that we have another comforter, The Holy Spirit who is God and with whose fellowship we enjoy here on earth.
     - We believe that we are joint heirs with Jesus to God's inheritance by His word and that we will rule and reign with Him forever more
4. **White section** with a `split` group.
   - Left: an image with class `is-style-rounded-2xl`, key `live/resources/pastors-godman-and-bola-akinlabi.png`, alt "Pastors Godman and Bola Akinlabi".
   - Right: a section heading with eyebrow "Global Lead Pastors", title "Pastors Godman and Bola Akinlabi", and lead "Our Church is led by Pastors Godman and Bolarinwa Akinlabi supported by a team of pastors and ministers who are committed to the Elevation church's God-given mandate to make greatness common."

   The live text repeats that sentence three times; it appears once here.
5. **Grey section**: a section heading with only the title "More resources", then a `grid-2` of two image cards (the Task 7 Step 4 card):

   | Image key | Icon | Title | Body | CTA → |
   |---|---|---|---|---|
   | `live/alpha/alpha-promo.png` | `users` | Alpha | Why not try Alpha online at {church.name}? | Sign up → `/resources/alpha` |
   | `live/etracts/jesus-is-the-only-way.jpg` | `heart-handshake` | E-tracts | Short tracts to read and share. | Read them → `/resources/etracts` |

- [ ] **Step 4: `seed/pages/alpha.html`**

1. **`page-hero`**: "Alpha" / "You are invited" / "Why not try Alpha online at {church.name}?"
2. **White section** with a `split` group.
   - Left: the image `live/alpha/alpha-promo.png` with class `is-style-rounded-2xl`, alt "Alpha at {church.name}".
   - Right: the h2 "Use the form below to sign up", then `form-slot form-slot--alpha`.

- [ ] **Step 5: `seed/pages/etracts.html`**

1. **`page-hero`**: eyebrow "Resources", title "E-tracts", with no lead.
2. **White section** holding a gallery with three columns and no cropping, so the tract text isn't cut off. Every image opens in the lightbox:

```html
<!-- wp:gallery {"columns":3,"imageCrop":false,"linkTo":"none","sizeSlug":"large"} -->
<figure class="wp-block-gallery has-nested-images columns-3"><!-- wp:image {"lightbox":{"enabled":true},"id":{{media-id:live/etracts/jesus-loves-you-do-you-believe-this.jpg}},"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="{{media:live/etracts/jesus-loves-you-do-you-believe-this.jpg}}" alt="E-tract: Jesus loves you. Do you believe this?" class="wp-image-{{media-id:live/etracts/jesus-loves-you-do-you-believe-this.jpg}}"/></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->
```

The gallery has 11 images in manifest order. The alt text is "E-tract: " followed by, respectively:
1. Jesus loves you. Do you believe this?
2. The peace you need in uncertain times
3. Jesus is the only way
4. Reality check
5. Why carry burdens?
6. Heaven is for you
7. If you have Jesus
8. Jesus' love is unconditional
9. There is rest for your soul
10. God is not partial
11. What can be more valuable?

- [ ] **Step 6: `seed/pages/church-in-the-park-2025.html`**

1. **`page-hero`**: eyebrow "Church in the Park", title "Church In The Park 2025", with no lead.
2. **White section** holding the `rich-text` group with two paragraphs, verbatim from live. The date is historical, so it is **not** a token.
   - "On Sunday 17th August 2025, we stepped out of our usual building and gathered in the park to show that church can be joyful, welcoming, and fun for everyone. Over 500 people joined us—families, friends, and first-time guests—for a vibrant time of worship, fellowship, games, and community. It was a day filled with laughter, testimonies, and the love of God in the heart of Manchester."
   - "Scroll down to relive some of the best moments from <strong>Church in the Park 2025!</strong>"
3. **White section** holding a gallery like Step 5's, but with `"imageCrop":true`, which adds the `is-cropped` class. It has 23 images, `cip-01` to `cip-23`, with alt "Church in the Park 2025, photo N of 23".

Append to `site.css`:

```css
/* Galleries (kept pages) */
.wp-block-gallery.has-nested-images figure.wp-block-image img { border-radius: 14px; }
```

- [ ] **Step 7: Seed lines**

```bash
seed_post page resources pages/resources.html "Resources" \
  --meta-description="Free resources from {church.name}: the Godman Akinlabi podcast, our mission and what we believe."
seed_post page alpha pages/alpha.html "Alpha" --parent=resources \
  --meta-description="Try Alpha online with {church.name}. Sign up below."
seed_post page etracts pages/etracts.html "ETracts" --parent=resources \
  --meta-description="E-tracts from {church.name} to read and share."
seed_post page church-in-the-park-2025 pages/church-in-the-park-2025.html "Church In The Park 2025" \
  --meta-description="Over 500 people joined {church.name} in the park on 17 August 2025. Relive the best moments."
```

- [ ] **Step 8: Verify**

```bash
./bin/seed.sh
for p in /resources/ /resources/alpha/ /resources/etracts/ /church-in-the-park-2025/; do printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8080$p"; done
./bin/check-tokens.sh /resources/ /resources/alpha/ /resources/etracts/ /church-in-the-park-2025/
curl -s http://localhost:8080/resources/etracts/ | grep -c 'E-tract:'
curl -s http://localhost:8080/church-in-the-park-2025/ | grep -c 'photo [0-9]* of 23'
curl -s http://localhost:8080/resources/ | grep -c 'podbean.com/player-v2' 
```

Expected:
- Four `200`s.
- No raw tokens.
- `11` tract images and `23` park photos. The count may double if the lightbox copies the alt; any value of 11 or more, and 23 or more, is fine.
- `1` for Podbean. It is inside the `<template>` only; no `<iframe` is loaded until the button is clicked.

In the browser:
- The validator passes.
- At 1440px and 390px:
  - The Podbean placeholder says "Play the podcast · Loads from Podbean".
  - The tracts are uncropped, 3 across, and open in the lightbox.
  - The park gallery is cropped, 3 across.
  - The Resources cards link to Alpha and E-tracts.
- There is no request to podbean.com before a click.

- [ ] **Step 9: Commit**

```bash
git add .gitignore bin/fetch-live-media.sh bin/seed.sh seed/media/live.manifest seed/media/live.sha256 seed/pages wp-content/themes/elevation/assets/css/site.css
git commit -m "Rebuild the kept live pages (Resources, Alpha, E-tracts, Church in the Park 2025) with their images

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Redirects, URL check and export-page

**Files:**
- Create: `wp-content/plugins/elevation-core/src/Redirects.php`
- Create: `wp-content/plugins/elevation-core/tests/RedirectsTest.php`
- Modify: `wp-content/plugins/elevation-core/includes/cli.php` (the `elevation redirects` and `elevation export` commands)
- Modify: `wp-content/plugins/elevation-core/elevation-core.php` (require `src/Redirects.php`)
- Create: `seed/redirects.txt`
- Create: `bin/check-urls.sh`
- Create: `bin/export-page.sh`
- Modify: `bin/seed.sh`

**Interfaces:**
- Consumes: the Redirection 5.10.1 classes `Red_Group::create( $name, $module_id )`, which returns `Red_Group|false`, and `Red_Item::create( array $details )`, which returns `Red_Item|WP_Error`; the tables `{prefix}redirection_groups` and `{prefix}redirection_items`; and `MediaRefs::unresolve()` (Task 1).
- Produces:
  - `Redirects::parse( string $text ): list<array{0:string,1:string}>`, which throws `\InvalidArgumentException` naming the line.
  - `wp elevation redirects <file>`, which puts every line into the Redirection group "Redesign 2026" as a 301. It is idempotent by source URL.
  - `wp elevation export <type> <slug>`, which prints the post's content with seeded media turned back into refs.
  - `bin/export-page.sh <slug> [seed-relative-file]`.
  - `bin/check-urls.sh`.

- [ ] **Step 1: Write the failing Redirects tests**

`wp-content/plugins/elevation-core/tests/RedirectsTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Redirects;
use PHPUnit\Framework\TestCase;

final class RedirectsTest extends TestCase {

	public function test_parses_pairs_skipping_comments_and_blank_lines(): void {
		$text = "# old pages\n\n/home /\n/volunteer   /get-involved#serve\r\n/x https://example.org/y\n";
		$this->assertSame( [ [ '/home', '/' ], [ '/volunteer', '/get-involved#serve' ], [ '/x', 'https://example.org/y' ] ], Redirects::parse( $text ) );
	}

	/** @return array<string, array{string}> */
	public static function bad(): array {
		return [
			'one field'            => [ "/home\n" ],
			'three fields'         => [ "/a /b /c\n" ],
			'source not a path'    => [ "home /\n" ],
			'protocol-relative'    => [ "//evil.example /\n" ],
			'plain http target'    => [ "/a http://example.org\n" ],
			'javascript target'    => [ "/a javascript:alert(1)\n" ],
		];
	}

	#[\PHPUnit\Framework\Attributes\DataProvider( 'bad' )]
	public function test_rejects_bad_lines_naming_the_line( string $text ): void {
		$this->expectException( \InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Line 1' );
		Redirects::parse( $text );
	}
}
```

Run: `docker compose run --rm php vendor/bin/phpunit --filter RedirectsTest`
Expected: FAIL with `Class "Elevation\Core\Redirects" not found`.

- [ ] **Step 2: Implement**

`wp-content/plugins/elevation-core/src/Redirects.php`:

```php
<?php
namespace Elevation\Core;

/** seed/redirects.txt: "<from> <to>" per line; # comments. Pure — no WordPress calls. */
final class Redirects {

	/** @return list<array{0:string, 1:string}> */
	public static function parse( string $text ): array {
		$pairs = [];
		foreach ( preg_split( '/\R/', $text ) as $i => $line ) {
			$line = trim( $line );
			if ( '' === $line || str_starts_with( $line, '#' ) ) {
				continue;
			}
			$where = 'Line ' . ( $i + 1 );
			$parts = preg_split( '/\s+/', $line );
			if ( 2 !== count( $parts ) ) {
				throw new \InvalidArgumentException( "$where: expected \"<from> <to>\"" );
			}
			[ $from, $to ] = $parts;
			if ( ! str_starts_with( $from, '/' ) || str_starts_with( $from, '//' ) ) {
				throw new \InvalidArgumentException( "$where: the source must be a path starting with one /" );
			}
			if ( ! ( ( str_starts_with( $to, '/' ) && ! str_starts_with( $to, '//' ) ) || str_starts_with( $to, 'https://' ) ) ) {
				throw new \InvalidArgumentException( "$where: the target must be a /path or an https:// URL" );
			}
			$pairs[] = [ $from, $to ];
		}
		return $pairs;
	}
}
```

Require it from `elevation-core.php`.

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK (60 tests, …)`: 53 plus 7 (one parse test and six data-provider cases).

- [ ] **Step 3: The redirects and export commands**

First confirm the Redirection API names:

```bash
grep -n "public function get_id\|public static function create" wp-content/plugins/redirection/models/group.php wp-content/plugins/redirection/models/redirect/redirect.php
```

Expected: `Red_Group::get_id()`, `Red_Group::create()` and `Red_Item::create()`. If the group ID method is named differently, use that name and say so in the report.

Append to `includes/cli.php`, and add `use Elevation\Core\Redirects;` at the top:

```php
/**
 * Seed redirects into Redirection's "Redesign 2026" group (301s). Existing sources are left alone.
 *
 * ## OPTIONS
 * <file>
 * : Path to a redirects file: "<from> <to>" per line.
 */
WP_CLI::add_command( 'elevation redirects', function ( array $args ) {
	if ( ! class_exists( 'Red_Group' ) || ! class_exists( 'Red_Item' ) ) {
		WP_CLI::error( 'Redirection is not active.' );
	}
	try {
		$pairs = Redirects::parse( (string) file_get_contents( $args[0] ) );
	} catch ( \InvalidArgumentException $e ) {
		WP_CLI::error( $e->getMessage() );
	}
	global $wpdb;
	$group_id = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}redirection_groups WHERE name = %s", 'Redesign 2026' ) );
	if ( ! $group_id ) {
		$group = Red_Group::create( 'Redesign 2026', 1 );
		$group || WP_CLI::error( 'Could not create the "Redesign 2026" redirect group.' );
		$group_id = (int) $group->get_id();
	}
	foreach ( $pairs as [ $from, $to ] ) {
		if ( $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}redirection_items WHERE url = %s", $from ) ) ) {
			WP_CLI::log( "Unchanged redirect $from" );
			continue;
		}
		$item = Red_Item::create( [
			'url'         => $from,
			'match_type'  => 'url',
			'action_type' => 'url',
			'action_code' => 301,
			'action_data' => [ 'url' => $to ],
			'group_id'    => $group_id,
		] );
		if ( is_wp_error( $item ) ) {
			WP_CLI::error( "$from: " . $item->get_error_message() );
		}
		WP_CLI::log( "Created redirect $from → $to" );
	}
} );

/**
 * Print a post's content with seeded media turned back into {{media:…}} refs (for bin/export-page.sh).
 *
 * ## OPTIONS
 * <post_type>
 * : e.g. page
 * <slug>
 * : Post slug
 */
WP_CLI::add_command( 'elevation export', function ( array $args ) {
	[ $type, $slug ] = $args;
	$posts = get_posts( [ 'post_type' => $type, 'name' => $slug, 'post_status' => 'any', 'posts_per_page' => 1 ] );
	$posts || WP_CLI::error( "No $type '$slug'." );
	$by_id = [];
	foreach ( get_posts( [ 'post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_elevation_seed_media', 'posts_per_page' => -1 ] ) as $att ) {
		$by_id[ $att->ID ] = [ 'path' => (string) get_post_meta( $att->ID, '_elevation_seed_media', true ), 'url' => (string) wp_get_attachment_url( $att->ID ) ];
	}
	echo MediaRefs::unresolve( $posts[0]->post_content, $by_id ), "\n"; // Raw content for a file, not HTML output.
} );
```

- [ ] **Step 4: The redirects file and seed lines**

`seed/redirects.txt`:

```
# Live URLs replaced by the redesign (spec §6.9). The 10 live short links are copied from the
# live database by bin/migrate-live-data.php (Plan 6), keeping their hit counts.
/home /
/sample-page /
/who-we-are /about
/volunteer /get-involved#serve
/join-our-community /im-new#plan-a-visit
/guest /im-new#connect-card
/privacy-policy /privacy
```

In `bin/seed.sh`, before `wp rewrite flush --hard`, add:

```bash
wp redirection database install >/dev/null
wp elevation redirects /seed/redirects.txt
```

- [ ] **Step 5: `bin/check-urls.sh`**

```bash
#!/usr/bin/env bash
# Every seeded page answers 200 and every redesign redirect answers 301 to the right place (spec §6.9, §12).
set -euo pipefail
base=${BASE_URL:-http://localhost:8080}
fail=0
check() { # path expected-status [expected-location]
  local headers got loc
  headers=$(curl -sI "$base$1")
  got=$(printf '%s\n' "$headers" | awk 'NR == 1 { print $2 }')
  loc=$(printf '%s\n' "$headers" | awk 'tolower($1) == "location:" { print $2 }' | tr -d '\r')
  case "$loc" in /*) loc="$base$loc" ;; esac
  if [ "$got" != "$2" ] || { [ -n "${3:-}" ] && [ "$loc" != "$base$3" ]; }; then
    echo "FAIL $1: got $got ${loc:-} (want $2 ${3:+$base$3})"
    fail=1
  fi
}
for p in / /im-new/ /about/ /about/what-we-believe/ /watch/ /get-involved/ /give/ /prayer/ /contact/ /privacy/ \
         /resources/ /resources/alpha/ /resources/etracts/ /church-in-the-park-2025/; do
  check "$p" 200
done
check /home 301 /
check /sample-page 301 /
check /who-we-are 301 /about
check /volunteer 301 '/get-involved#serve'
check /join-our-community 301 '/im-new#plan-a-visit'
check /guest 301 '/im-new#connect-card'
check /privacy-policy 301 /privacy
[ "$fail" -eq 0 ] && echo "All URLs as expected."
exit "$fail"
```

`chmod +x bin/check-urls.sh`, then:

```bash
./bin/seed.sh | grep -i redirect
./bin/check-urls.sh
./bin/seed.sh | grep -c 'Unchanged redirect'
```

Expected:
- Seven `Created redirect …` lines on the first run.
- `All URLs as expected.`
- `7` on the second run.

If `/home` answers 301 to `/` from WordPress itself before Redirection, that still passes.

- [ ] **Step 6: `bin/export-page.sh`**

```bash
#!/usr/bin/env bash
# Write a page's current content back into seed/ so a hand edit made in wp-admin before the cut-off
# becomes part of the seed. Media become {{media:…}} refs again. Review the diff, then commit.
#   bin/export-page.sh about                     → seed/pages/about.html
#   bin/export-page.sh what-we-believe pages/what-we-believe.html
set -euo pipefail
cd "$(dirname "$0")/.."
slug=${1:?usage: bin/export-page.sh <slug> [seed-relative-file]}
file=seed/${2:-pages/$slug.html}
docker compose run --rm -T wpcli wp --user=admin elevation export page "$slug" > "$file.tmp"
mv "$file.tmp" "$file"
echo "Wrote $file — check it with git diff, then commit."
```

`chmod +x bin/export-page.sh`.

- [ ] **Step 7: The hand-edit round trip (Review Focus 4)**

```bash
w() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
id=$(w post list --post_type=page --name=about --field=ID)
w eval "\$p = get_post( $id ); wp_update_post( [ 'ID' => $id, 'post_content' => str_replace( 'How we got here', 'How we got here, so far', \$p->post_content ) ] );"
./bin/seed.sh 2>&1 | grep 'page about'
./bin/export-page.sh about
git diff --stat seed/pages/about.html
grep -c '{{media:redesign/leadership/' seed/pages/about.html
./bin/seed.sh 2>&1 | grep 'page about'
```

Expected:
- `Warning: Skipped page about: edited since it was seeded …`
- The diff shows only the heading change.
- The leadership images are refs again (`3`), not `http://localhost:8080/…` URLs.
- The next seed says `Unchanged page about`.

- [ ] **Step 8: Restore the page and check the export is exact**

```bash
git checkout seed/pages/about.html
SEED_FORCE=about ./bin/seed.sh 2>&1 | grep 'page about'
./bin/export-page.sh about && git diff --exit-code seed/pages/about.html && echo "export is exact"
```

Expected: `Updated page about`, then `export is exact`.

If the diff shows whitespace-only changes, for example a trailing newline, fix the export (not the seed file) so that the round trip is exact.

- [ ] **Step 9: Commit**

```bash
git add wp-content/plugins/elevation-core seed/redirects.txt bin/check-urls.sh bin/export-page.sh bin/seed.sh
git commit -m "Seed the redesign redirects into Redirection; URL check; export a hand-edited page back into seed/

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Verification sweep, docs and hand-offs

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-09-28-roadmap.md`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - A verified and reproducible site.
  - The tag `plan-2-done`.
  - Roadmap hand-offs for Plans 3–6.

- [ ] **Step 1: Rebuild from nothing, twice (spec §12 reproducibility)**

This wipes the local WordPress data. It is disposable; the seed recreates it. It never touches the `elevation-mirror` project.

```bash
docker compose down -v && ./bin/setup.sh && ./bin/check-env.sh
docker compose run --rm -T wpcli wp --user=admin eval 'foreach ( get_posts( [ "post_type" => "page", "posts_per_page" => -1, "orderby" => "name", "order" => "ASC" ] ) as $p ) { echo $p->post_name, " ", sha1( $p->post_content ), "\n"; }' > /tmp/plan2-hashes-1.txt
docker compose down -v && ./bin/setup.sh
docker compose run --rm -T wpcli wp --user=admin eval 'foreach ( get_posts( [ "post_type" => "page", "posts_per_page" => -1, "orderby" => "name", "order" => "ASC" ] ) as $p ) { echo $p->post_name, " ", sha1( $p->post_content ), "\n"; }' > /tmp/plan2-hashes-2.txt
diff /tmp/plan2-hashes-1.txt /tmp/plan2-hashes-2.txt && wc -l < /tmp/plan2-hashes-1.txt
```

Expected: `check-env` exits 0; the diff is empty; and there are **14** pages, which are home, im-new, about, what-we-believe, watch, get-involved, give, prayer, contact, privacy, resources, alpha, etracts and church-in-the-park-2025.

- [ ] **Step 2: Seed twice, everything Unchanged (Plan 1 carry-forward)**

```bash
./bin/seed.sh > /tmp/seed-2.txt 2>&1
grep -cE '^(Created|Updated|Imported|Set |Fetched)' /tmp/seed-2.txt || true
grep -cE '^(Unchanged|Kept)' /tmp/seed-2.txt
grep -i 'warning\|error' /tmp/seed-2.txt || echo "no warnings"
```

Expected: `0` changes; more than 60 Unchanged/Kept lines; `no warnings`.

- [ ] **Step 3: URLs, tokens, tests and build**

```bash
./bin/check-urls.sh
./bin/check-tokens.sh / /im-new/ /about/ /about/what-we-believe/ /watch/ /get-involved/ /give/ /prayer/ /contact/ /privacy/ /resources/ /resources/alpha/ /resources/etracts/ /church-in-the-park-2025/ /does-not-exist
docker compose run --rm php vendor/bin/phpunit
docker compose run --rm node node --test tests/js/
docker compose run --rm node npm run build && git status --porcelain wp-content/plugins/elevation-core/build
wc -c < wp-content/debug.log 2>/dev/null || echo 0
```

Expected:
- `All URLs as expected.`
- `No raw tokens on 15 page(s).`
- PHPUnit reports `OK (60 tests, …)`.
- The JS tests pass 9.
- The build leaves no diff.
- The `debug.log` size is `0`.

- [ ] **Step 4: Settings-change sweep (Review Focus 1)**

```bash
w() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
w elevation setting set "service.startTime=11:00am" "service.doorsOpen=10:15am" "location.venue=Test Hall"
./bin/check-tokens.sh / /im-new/ /about/ /watch/ /get-involved/ /give/ /contact/ /privacy/
for p in / /im-new/ /about/ /watch/ /get-involved/ /give/ /contact/ /privacy/; do html=$(curl -s "http://localhost:8080$p"); echo "$p old=$(grep -c '10:30am\|Mary Seacole' <<<"$html" || true) new=$(grep -c '11:00am\|Test Hall' <<<"$html" || true)"; done
curl -s http://localhost:8080/ | grep -o 'Doors from 10:15am'
curl -s http://localhost:8080/im-new/ | grep -o 'Doors open at 10:15am and we start at 11:00am.'
curl -s http://localhost:8080/ | grep -o '<meta name="description"[^>]*>'
w elevation setting set "service.startTime=" "service.doorsOpen=" "location.venue="
curl -s http://localhost:8080/ | grep -c '10:30am'
```

Expected:
- No raw tokens.
- `old=0` on every page, and `new` is 1 or more on every page; the footer strip alone carries both values.
- Both conditional sentences appear.
- The meta description says `11:00am` and `Test Hall`.
- After the reset, blank values fall back to the defaults and `10:30am` is back.

`location.mapsQuery` is a separate setting, so the map still points at the old place until a Site Manager changes it too. That is expected; Plan 6's editing guide says so.

- [ ] **Step 5: Block validation**

Run `bin/validate-blocks.js` in the browser. Expected: `All N pages and patterns are valid.`, where N is 14 pages plus 21 patterns, or more.

- [ ] **Step 6: Visual and behaviour sweep in the browser**

**Widths.** Check each of the 14 pages at 1440px and 390px:
- no horizontal scroll;
- no clipped text;
- no console errors;
- card hover lifts, with none under reduced motion;
- reveal fades once, and everything is visible with JS disabled.

**Header at the 1024px boundary** (Plan 1 carry-forward):
- at 1023px there is a hamburger and no CTAs;
- at 1024px the inline menu and CTAs fit on one line with nothing wrapping;
- on Home the header starts transparent over the hero and turns solid after 80px;
- on every other page it is solid from the top.

**Consent.** In a fresh profile with storage cleared, on `/`, `/im-new/`, `/contact/` and `/resources/`, the resource list has no request to `google`, `gstatic`, `youtube` or `podbean` until "Accept all" or a "Show the map" / "Play" click.

**Against the redesign.** Compare each redesign page section by section against inventory §1. Record every visible difference in the report as one of:
- *intended*: green-700 text, forms not yet present, events, watch or sermons still in their fallback;
- *fix now*: anything else. Fix it in this task.

- [ ] **Step 7: README and roadmap**

In `README.md`, under "Day to day", add:

```bash
docker compose run --rm node npm run test:js                 # consent logic (node --test)
./bin/check-urls.sh                                          # pages 200, redesign redirects 301
./bin/check-tokens.sh / /about/                              # no raw {settings.tokens} on a page
./bin/export-page.sh about                                   # write a wp-admin edit back into seed/
```

Under "Seeding", add:
- `bin/fetch-live-media.sh` downloads the kept pages' images from the live site into the gitignored `seed/media/live/`, verified by `seed/media/live.sha256`.
- `bin/validate-blocks.js` is pasted into the editor's console to check every page and pattern for block-validation errors.

In the roadmap:
- Set Plan 2's status to `done: 2026-09-29-plan-2-patterns-pages.md`.
- Add this section below the table:

```markdown
## Hand-offs from Plan 2

- **Plan 3 (Events):** `/events` is the post-type archive. Replace the Home "What's on" section (the `section-head-row` + `grid-3` with `card-gathering` / `card-soon`) with an events block that renders that same fallback when there are no events. The `sunday-strip` and `date-card` patterns exist.
- **Plan 4 (YouTube and sermons):** replace the Home watch section (`split--watch`) and the Watch page's `panel-watch` with live/latest blocks that render those fallbacks with no API key or no videos. The embed gate's `video` kind takes `https://www.youtube-nocookie.com/embed/<id>`.
- **Plan 5 (Forms etc.):** fill `form-slot--contact`, `--prayer`, `--gift-aid` (add class `form-box` when filling) and `--alpha`; insert the Plan a Visit (`#plan-a-visit`) and Connect card (`#connect-card`) sections on I'm New before the CTA band; replace the Get Involved "Find a group" and "Join the G-Squad" buttons; add the footer newsletter row at `<!-- newsletter row: Plan 5 -->`. The privacy notice already describes these data sets.
- **Plan 6 (Go-live):** the church confirms the draft retention periods in the privacy notice (contact 12 months, visit plans 12 months after the visit, connect cards / group requests / G-Squad / Alpha 2 years) and its "Last updated" date; the 10 live short links go into Redirection by migration, alongside the "Redesign 2026" group.
```

- [ ] **Step 8: Commit and tag**

```bash
git add README.md docs/superpowers/plans/2026-09-28-roadmap.md
git commit -m "Plan 2 verified: README commands, roadmap hand-offs for Plans 3-6

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git tag plan-2-done
```
