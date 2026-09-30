# Plan 4 — YouTube Feed and Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the church's YouTube channel on the Watch page and in the Home watch section:
- the latest finished videos, as cards that open YouTube;
- the live stream behind the consent gate while streaming, or a "Next stream" strip when one is scheduled, switching over without a page reload;
- everything configured, checked and diagnosed in Settings → Church.

**Architecture:**
- **Parsing.** A pure `Elevation\Core\YouTube` class turns Data API responses into plain video arrays. It is unit-tested with saved sample responses, which are used only as test inputs.
- **Fetching.** `includes/youtube.php` fetches the channel's uploads and caches them (1 day for the playlist ID, 60s for the feed). It records a status for Settings → Church. It also copies the thumbnails it will show into `uploads/elevation-youtube/`, so visitors never request YouTube images before consent.
- **Blocks.** Four dynamic blocks render the feed: `recent-videos`, `watch-hero`, `live-player` and `home-watch`.
- **Live swap.** An uncacheable REST endpoint re-renders the three live blocks, so a small script can swap them when a stream starts or ends.

**Tech Stack:** WordPress 7.1.2 block theme and plugin, PHP 8.3, PHPUnit 11, `@wordpress/scripts` 36.0.0, `node --test`, WP-CLI, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md`, **revision 4**: §6.3 Messages (the YouTube channel feed), §6.4 YouTube client and live status, and §16. Also relevant: §3 (live has wp-admin access only), §6.8 (consent) and §12.

Layout and copy come from `docs/superpowers/specs/2026-09-28-redesign-inventory.md`: §1 "Watch", and §2 `home-watch-section.tsx`, `live-player.tsx` and `video-card.tsx`. The redesign source is `~/Projects.nosync/website` at `e0cf43e`: `src/lib/youtube.ts` and `src/components/{live-player,video-card,home-watch-section}.tsx`.

## Global Constraints

- **No messages in WordPress.** No sermon post type, no series or speakers, no import and no `/sermons` pages (spec rev 4, §16). Every message card opens the video on YouTube in a new tab.
- **The local site uses the real channel. There is no mock data.**
  - Locally, the API key can come from `.env` as `YOUTUBE_API_KEY`. Only `wp-content/mu-plugins/local-dev.php` reads it, and only when Settings → Church has no key.
  - The executor never reads `.env`. It checks only whether the variable is set, using `test -n` and printing "set" or "unset".
  - Sample API responses exist only inside PHPUnit tests.
- **Live has wp-admin access only (spec §3).** Everything is configured and diagnosed in Settings → Church:
  - the API key and channel handle (these fields already exist);
  - a YouTube status line: the last successful check, with its time and video count, or the last error and when it happened;
  - a "Check YouTube now" button that clears the cache and fetches again.

  Nothing may need server access, a server cron, or reading a log file.
- **Quota (spec §6.4).**
  - Resolve the handle to the uploads playlist ID and cache it for 1 day.
  - `playlistItems.list` + `videos.list` cost 2 units per refresh; cache the result for 60s. Failures are cached too.
  - Classify each video as live, upcoming or none.
  - Always fetch up to 50 videos.
  - Every failure degrades to empty results, one log line and the status. Nothing throws.
- **No Google request from a visitor's browser before consent (spec §12).**
  - Thumbnails are served only from `uploads/elevation-youtube/{videoId}.jpg`. The server copies them from `https://i.ytimg.com/`.
  - A thumbnail that can't be copied shows the ink placeholder.
  - Players are `youtube-nocookie.com` embeds inside the existing embed gate (`elevation/embed-gate`, kind `video`).
- **Freshness (spec §6.4).**
  - The server renders the last-known state.
  - A view script calls `GET /wp-json/elevation/v1/live`, which is sent with `Cache-Control: no-store` and answered from the 60s transient.
  - The script swaps `watch-hero`, `home-watch` and `live-player`.
  - Without JS, the server state is shown.
- **London time.** Card dates read like "5 Oct 2026", with "Sept" for September as in Plan 3. Scheduled streams read like "Sunday 5 October, 10:30".
- **Copy.**
  - Use the inventory copy verbatim, except that every "Sunday" becomes `{service.day}`.
  - Use `{service.startTime}`, `{location.full}` and `{socials.youtube.url}` for the service time, address and channel.
  - Tokens are replaced at render by the existing `render_block` filter.
- **Escaping.** Everything from YouTube is untrusted. It is kept as plain text and escaped with `esc_html`, `esc_attr` or `esc_url` when output, including in the REST-rendered HTML.
- **Code conventions.**
  - Blocks are named `elevation/<name>`, use apiVersion 3 and have a `render.php` in `src/blocks/<name>/`.
  - Globals in `render.php` use the `$elevation_` prefix.
  - Pure classes live in `src/` (namespace `Elevation\Core`) and make no WordPress calls.
  - `build/` is committed. Rebuild with `docker compose run --rm node npm run build`.
- **Colours and focus.**
  - Text-safe green is the `green-700` preset.
  - On ink backgrounds, use `--wp--preset--color--green` for text and focus.
  - Focus rings are 2px solid with a 2px offset.
  - Motion stops under `prefers-reduced-motion: reduce`.
- **Access.** "Check YouTube now" needs `manage_church_settings`, which Site Managers and Administrators have.
- **Commands.**
  - PHPUnit: `docker compose run --rm php vendor/bin/phpunit`
  - JS tests: `docker compose run --rm node npm run test:js`
  - URL and token checks: `./bin/check-urls.sh` and `./bin/check-tokens.sh <paths>`
  - WP-CLI: `docker compose run --rm -T wpcli wp --user=admin <command>`
  - Block validator: `http://localhost:8080/?elevation-validate-blocks=1`, then read `window.elevationValidation`
- **Standing rules.**
  - Never read, list or copy anything under `private/`.
  - Never read `import/export.xml`.
  - Never touch `docker-compose.mirror.yml` or the `elevation-mirror` project.
  - Never read or print `.env` values or passwords.
  - Nobody signs in to wp-admin during execution, so defer and note any browser checks that need a login.
  - Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **YouTube is down, over quota, or the key is wrong or missing.** Watch and Home show their fallbacks with no PHP warnings, at most one log line a minute is written, and Settings → Church states the error plainly (for example "quotaExceeded" or "keyInvalid") with the time. Tested in Task 2, with a deliberately bogus key set through a one-off filter, and in Task 3.
2. **A Google request from the visitor's browser before consent,** from thumbnails, cards, the live player or swapped-in HTML. Tested with network checks in Tasks 3 and 4, and in the Task 5 sweep.
3. **Hostile or odd video titles** (HTML, quotes, emoji, very long text). They show as literal text, including in the REST-swapped HTML. Tested in the Task 1 unit tests and in Task 3, with a one-off render that injects a crafted title in memory only and never stores it.
4. **Thumbnails that can't be copied** (a 404, not an image, or oversized). The page doesn't break, uploads don't fill with junk, the placeholder shows, and old copies are pruned. Tested in Task 2.
5. **A page cached before a stream started** (up to 10 minutes on live). It switches to live within about a minute without a reload, and back again when the stream ends. Tested in Task 4 with an in-memory feed injected through the transient for the duration of the check only, because the real channel is rarely live on demand. If the channel happens to be live during execution, check against it instead.

---

## File structure

**Plugin `wp-content/plugins/elevation-core/`:**

- `src/YouTube.php` (create): Data API URLs, response parsing, live/upcoming/past selection, and the duration and date formats.
- `includes/youtube.php` (create): HTTP with transients, the status, thumbnail copies, and "Check YouTube now".
- `includes/youtube-render.php` (create): the video card and the live badge.
- `includes/live.php` (create): the REST route `elevation/v1/live` and the `elevation-live-status` script registration.
- `includes/settings-page.php` (modify): the YouTube status and button inside the YouTube group.
- `src/blocks/{recent-videos,watch-hero,live-player,home-watch}/` (create).
- `assets/js/live-state.js` (create, UMD): pure logic, shared with the tests.
- `assets/js/live-status.js` (create).
- `assets/js/consent.js` (modify): adds `window.ecmConsent.scan(root)`.
- `elevation-core.php` (modify): the new requires.
- `tests/YouTubeTest.php` and `tests/js/live-state.test.cjs` (create).

**Theme:**

- `wp-content/themes/elevation/assets/css/youtube.css` (create).
- `functions.php` (modify): enqueue the stylesheet and add it as an editor style.

**Local environment:**

- `wp-content/mu-plugins/local-dev.php` (modify): the `.env` key fallback.
- `docker-compose.yml` (modify): pass `YOUTUBE_API_KEY` through.
- `.env.example` (modify).

**Seed and docs:** `seed/pages/watch.html`, `seed/pages/home.html`, `README.md` and `docs/superpowers/plans/2026-09-28-roadmap.md` (modify).

## Rulings made while writing this plan

- **Naming.** The spec's `YouTube_Client` becomes the pure `Elevation\Core\YouTube` plus the functions in `includes/youtube.php`, which matches the plugin's naming.
- **Which thumbnails are copied.**
  - Only the videos the site shows: the live or upcoming stream plus the 13 newest finished videos (12 on Watch, 1 on Home).
  - Copies are made while the feed refreshes, at most 15 per refresh, with a 4s timeout each.
  - Files for videos that have left the feed are deleted.
  - The widest `https://i.ytimg.com/` thumbnail the API offers is used, and cards crop it to 16:9 with `object-fit: cover`.
- **The Home tile while live** uses the live video's copied thumbnail if there is one, otherwise the placeholder. It links to YouTube, as the redesign does.
- **Checking the live switch without mock data.** A stream can't be started on demand. So Task 4 checks the swap by writing a crafted live feed into the 60s feed transient for the length of the check, then clearing it. This is a test fixture that lives in memory for about a minute; it is not seeded data. The site's normal state is always the real channel. If the executor finds the channel really live or upcoming, it uses that instead.
- **The one log line.** The status option is what staff see. `error_log` stays as a secondary trace and never includes the key.

---

### Task 1: The pure `YouTube` class

**Files:**
- Create: `wp-content/plugins/elevation-core/src/YouTube.php`
- Create: `wp-content/plugins/elevation-core/tests/YouTubeTest.php`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`

**Interfaces:**
- **Consumes:** `EventTime::TZ`, `EventTime::dayNumber()` and `EventTime::monthShort()` from Plan 3.
- **Produces the `Video` shape:**

  ```php
  Video = array{
      id: string,
      title: string,
      description: string,
      publishedAt: string,
      thumbnail: string,
      durationSecs: int,
      live: 'live'|'upcoming'|'none',
      scheduledStart: string,
      url: string,
  }
  ```

  - `publishedAt` and `scheduledStart` are UTC `Y-m-d\TH:i:s\Z`, or `''`.
  - `thumbnail` is the source `https://i.ytimg.com/…` URL, which the server copies, or `''`.
- **Produces on `YouTube`, all `public static`:**
  - `API`
  - `isVideoId(string): bool`
  - `channelsUrl(string $handle, string $key): string`
  - `playlistItemsUrl(string $playlistId, int $max, string $key): string`
  - `videosUrl(list<string> $ids, string $key): string`
  - `uploadsPlaylistId(mixed): ?string`
  - `playlistVideoIds(mixed): list<string>`
  - `videos(mixed $response, list<string> $order): list<Video>`
  - `errorReason(mixed $body): string`
  - `parseDuration(mixed): int`
  - `formatDuration(int): string`
  - `embedUrl(string): string`
  - `watchUrl(string): string`
  - `liveNow(list<Video>): ?Video`
  - `nextUpcoming(list<Video>): ?Video`
  - `past(list<Video>, int): list<Video>`
  - `formatScheduled(string $iso): string`
  - `displayDate(string $iso): string`

- [ ] **Step 1: Write the failing test**

Create `tests/YouTubeTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\YouTube;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** Saved-shape Data API responses as unit-test inputs only; the site itself always reads the real channel. */
final class YouTubeTest extends TestCase {

	private static function video( string $id, array $snippet = [], array $extra = [] ): array {
		return array_merge( [
			'id'             => $id,
			'snippet'        => array_merge( [
				'title'                => "Title $id",
				'description'          => "About $id",
				'publishedAt'          => '2026-10-04T09:30:00Z',
				'liveBroadcastContent' => 'none',
				'thumbnails'           => [
					'default' => [ 'url' => "https://i.ytimg.com/vi/$id/default.jpg", 'width' => 120 ],
					'high'    => [ 'url' => "https://i.ytimg.com/vi/$id/hqdefault.jpg", 'width' => 480 ],
				],
			], $snippet ),
			'contentDetails' => [ 'duration' => 'PT1H2M3S' ],
		], $extra );
	}

	public function test_ids_and_urls(): void {
		$this->assertTrue( YouTube::isVideoId( 'dQw4w9WgXcQ' ) );
		$this->assertTrue( YouTube::isVideoId( 'a-b_c-D_e1Z' ) );
		foreach ( [ '', 'short', 'dQw4w9WgXcQx', 'dQw4 w9WgXc', 'dQw<w9WgXc>' ] as $bad ) {
			$this->assertFalse( YouTube::isVideoId( $bad ), $bad );
		}
		$this->assertSame( 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=%40TheChannel&key=K', YouTube::channelsUrl( '@TheChannel', 'K' ) );
		$this->assertSame( 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=%40TheChannel&key=K', YouTube::channelsUrl( 'TheChannel', 'K' ) );
		$this->assertSame( 'https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=UU1&maxResults=50&key=K', YouTube::playlistItemsUrl( 'UU1', 99, 'K' ) );
		$this->assertSame( 'https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2CliveStreamingDetails&id=aaaaaaaaaaa%2Cbbbbbbbbbbb&key=K', YouTube::videosUrl( [ 'aaaaaaaaaaa', 'bbbbbbbbbbb' ], 'K' ) );
		$this->assertSame( 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', YouTube::embedUrl( 'dQw4w9WgXcQ' ) );
		$this->assertSame( '', YouTube::embedUrl( 'bad id' ) );
		$this->assertSame( 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', YouTube::watchUrl( 'dQw4w9WgXcQ' ) );
	}

	public function test_uploads_playlist_and_playlist_ids_tolerate_junk(): void {
		$this->assertSame( 'UUabc', YouTube::uploadsPlaylistId( [ 'items' => [ [ 'contentDetails' => [ 'relatedPlaylists' => [ 'uploads' => 'UUabc' ] ] ] ] ] ) );
		foreach ( [ null, [], [ 'items' => [] ], [ 'items' => 'x' ], [ 'items' => [ [ 'contentDetails' => [ 'relatedPlaylists' => [ 'uploads' => '<x>' ] ] ] ] ] ] as $junk ) {
			$this->assertNull( YouTube::uploadsPlaylistId( $junk ) );
		}
		$playlist = [ 'items' => [
			[ 'contentDetails' => [ 'videoId' => 'aaaaaaaaaaa' ] ],
			[ 'contentDetails' => [ 'videoId' => 'bad' ] ],
			'junk',
			[ 'contentDetails' => [ 'videoId' => 'bbbbbbbbbbb' ] ],
			[ 'contentDetails' => [ 'videoId' => 'aaaaaaaaaaa' ] ],
		] ];
		$this->assertSame( [ 'aaaaaaaaaaa', 'bbbbbbbbbbb' ], YouTube::playlistVideoIds( $playlist ) );
		$this->assertSame( [], YouTube::playlistVideoIds( null ) );
	}

	public function test_videos_are_parsed_in_playlist_order(): void {
		$response = [ 'items' => [
			self::video( 'bbbbbbbbbbb' ),
			self::video( 'aaaaaaaaaaa', [ 'liveBroadcastContent' => 'upcoming' ], [ 'liveStreamingDetails' => [ 'scheduledStartTime' => '2026-10-11T09:30:00Z' ] ] ),
			[ 'id' => 'bad' ],
			'junk',
		] ];
		$videos = YouTube::videos( $response, [ 'aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc' ] );
		$this->assertSame( [ 'aaaaaaaaaaa', 'bbbbbbbbbbb' ], array_column( $videos, 'id' ) );
		$this->assertSame( [
			'id'             => 'bbbbbbbbbbb',
			'title'          => 'Title bbbbbbbbbbb',
			'description'    => 'About bbbbbbbbbbb',
			'publishedAt'    => '2026-10-04T09:30:00Z',
			'thumbnail'      => 'https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg',
			'durationSecs'   => 3723,
			'live'           => 'none',
			'scheduledStart' => '',
			'url'            => 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
		], $videos[1] );
		$this->assertSame( 'upcoming', $videos[0]['live'] );
		$this->assertSame( '2026-10-11T09:30:00Z', $videos[0]['scheduledStart'] );
		$this->assertSame( [], YouTube::videos( null, [ 'aaaaaaaaaaa' ] ) );
	}

	public function test_untrusted_fields_are_normalised(): void {
		$v = YouTube::videos( [ 'items' => [ self::video( 'aaaaaaaaaaa', [
			'title'                => "  <b>Hi</b> \"x\" 🙏\u{0007} ",
			'description'          => [ 'not a string' ],
			'publishedAt'          => 'yesterday',
			'liveBroadcastContent' => 'LIVE!',
			'thumbnails'           => [ 'high' => [ 'url' => 'http://evil.example/x.jpg', 'width' => 999 ] ],
		] ) ] ], [ 'aaaaaaaaaaa' ] )[0];
		$this->assertSame( '<b>Hi</b> "x" 🙏', $v['title'], 'kept as text (control characters removed); escaping happens on output' );
		$this->assertSame( '', $v['description'] );
		$this->assertSame( '', $v['publishedAt'] );
		$this->assertSame( 'none', $v['live'] );
		$this->assertSame( '', $v['thumbnail'], 'only https://i.ytimg.com thumbnails, so the server never fetches anything else' );
		$this->assertSame( 'Untitled', YouTube::videos( [ 'items' => [ self::video( 'aaaaaaaaaaa', [ 'title' => '   ' ] ) ] ], [ 'aaaaaaaaaaa' ] )[0]['title'] );
		$this->assertSame( 300, mb_strlen( YouTube::videos( [ 'items' => [ self::video( 'aaaaaaaaaaa', [ 'title' => str_repeat( 'é', 500 ) ] ) ] ], [ 'aaaaaaaaaaa' ] )[0]['title'] ), 'capped' );
	}

	public function test_error_reason_names_the_problem_without_echoing_junk(): void {
		$this->assertSame( 'quotaExceeded', YouTube::errorReason( '{"error":{"code":403,"errors":[{"reason":"quotaExceeded"}],"message":"The request cannot be completed"}}' ) );
		$this->assertSame( 'keyInvalid', YouTube::errorReason( '{"error":{"errors":[{"reason":"keyInvalid"}]}}' ) );
		$this->assertSame( 'badRequest', YouTube::errorReason( '{"error":{"errors":[{"reason":"bad<script>Request"}]}}' ), 'letters only' );
		$this->assertSame( '', YouTube::errorReason( 'not json' ) );
		$this->assertSame( '', YouTube::errorReason( null ) );
	}

	/** @return array<string, array{mixed, int, string}> */
	public static function durations(): array {
		return [
			'h m s'   => [ 'PT1H2M3S', 3723, '1:02:03' ],
			'm s'     => [ 'PT45M7S', 2707, '45:07' ],
			'seconds' => [ 'PT9S', 9, '0:09' ],
			'day'     => [ 'P1DT1S', 86401, '24:00:01' ],
			'zero'    => [ 'P0D', 0, '' ],
			'missing' => [ null, 0, '' ],
			'junk'    => [ 'soon', 0, '' ],
		];
	}

	#[DataProvider( 'durations' )]
	public function test_durations( mixed $iso, int $secs, string $label ): void {
		$this->assertSame( $secs, YouTube::parseDuration( $iso ) );
		$this->assertSame( $label, YouTube::formatDuration( $secs ) );
	}

	public function test_live_upcoming_and_past_selection(): void {
		$v    = fn ( string $id, string $live, string $start = '' ) => [ 'id' => $id, 'live' => $live, 'scheduledStart' => $start ];
		$list = [ $v( 'u2', 'upcoming', '2026-10-18T09:30:00Z' ), $v( 'p1', 'none' ), $v( 'l1', 'live' ), $v( 'u1', 'upcoming', '2026-10-11T09:30:00Z' ), $v( 'u0', 'upcoming' ), $v( 'p2', 'none' ), $v( 'p3', 'none' ) ];
		$this->assertSame( 'l1', YouTube::liveNow( $list )['id'] );
		$this->assertSame( 'u1', YouTube::nextUpcoming( $list )['id'], 'soonest with a schedule' );
		$this->assertSame( [ 'p1', 'p2' ], array_column( YouTube::past( $list, 2 ), 'id' ) );
		$this->assertNull( YouTube::liveNow( [ $v( 'p1', 'none' ) ] ) );
		$this->assertNull( YouTube::nextUpcoming( [ $v( 'u0', 'upcoming' ) ] ) );
	}

	public function test_london_formats(): void {
		$this->assertSame( 'Sunday 11 October, 10:30', YouTube::formatScheduled( '2026-10-11T09:30:00Z' ) ); // BST
		$this->assertSame( 'Sunday 1 November, 10:30', YouTube::formatScheduled( '2026-11-01T10:30:00Z' ) ); // GMT
		$this->assertSame( '', YouTube::formatScheduled( '' ) );
		$this->assertSame( '5 Oct 2026', YouTube::displayDate( '2026-10-04T23:30:00Z' ), 'already the 5th in London' );
		$this->assertSame( '7 Sept 2026', YouTube::displayDate( '2026-09-07T09:00:00Z' ) );
		$this->assertSame( '', YouTube::displayDate( 'nope' ) );
	}
}
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `docker compose run --rm php vendor/bin/phpunit --filter YouTubeTest`
Expected: an error saying that class `Elevation\Core\YouTube` is not found.

- [ ] **Step 3: Implement**

Create `src/YouTube.php`:

```php
<?php
namespace Elevation\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * YouTube Data API v3: request URLs and response parsing (spec §6.4). Pure — the HTTP, caching and
 * thumbnail copies are in includes/youtube.php. The uploads playlist (1 unit) + videos.list (1 unit) =
 * 2 units per refresh; search.list (100 units) is never used. Everything from the API is untrusted:
 * parsed defensively and kept as plain text for the renderers to escape.
 */
final class YouTube {

	public const API = 'https://www.googleapis.com/youtube/v3';

	public static function isVideoId( string $id ): bool {
		return 1 === preg_match( '/^[A-Za-z0-9_-]{11}$/', $id );
	}

	public static function channelsUrl( string $handle, string $key ): string {
		return self::API . '/channels?' . http_build_query( [ 'part' => 'contentDetails', 'forHandle' => '@' . ltrim( $handle, '@' ), 'key' => $key ] );
	}

	public static function playlistItemsUrl( string $playlistId, int $max, string $key ): string {
		return self::API . '/playlistItems?' . http_build_query( [ 'part' => 'contentDetails', 'playlistId' => $playlistId, 'maxResults' => max( 1, min( 50, $max ) ), 'key' => $key ] );
	}

	/** @param list<string> $ids */
	public static function videosUrl( array $ids, string $key ): string {
		return self::API . '/videos?' . http_build_query( [ 'part' => 'snippet,contentDetails,liveStreamingDetails', 'id' => implode( ',', $ids ), 'key' => $key ] );
	}

	public static function uploadsPlaylistId( mixed $channels ): ?string {
		$id = is_array( $channels ) ? ( $channels['items'][0]['contentDetails']['relatedPlaylists']['uploads'] ?? null ) : null;
		return is_string( $id ) && 1 === preg_match( '/^[A-Za-z0-9_-]{2,64}$/', $id ) ? $id : null;
	}

	/** @return list<string> Valid, unique video IDs in playlist order (newest first). */
	public static function playlistVideoIds( mixed $playlist ): array {
		$items = is_array( $playlist ) && is_array( $playlist['items'] ?? null ) ? $playlist['items'] : [];
		$ids   = [];
		foreach ( $items as $item ) {
			$id = is_array( $item ) ? ( $item['contentDetails']['videoId'] ?? null ) : null;
			if ( is_string( $id ) && self::isVideoId( $id ) && ! in_array( $id, $ids, true ) ) {
				$ids[] = $id;
			}
		}
		return $ids;
	}

	/** @param list<string> $order Playlist order; videos.list doesn't preserve it. */
	public static function videos( mixed $response, array $order ): array {
		$items = is_array( $response ) && is_array( $response['items'] ?? null ) ? $response['items'] : [];
		$byId  = [];
		foreach ( $items as $item ) {
			$id = is_array( $item ) ? ( $item['id'] ?? null ) : null;
			if ( ! is_string( $id ) || ! self::isVideoId( $id ) ) {
				continue;
			}
			$s     = is_array( $item['snippet'] ?? null ) ? $item['snippet'] : [];
			$live  = $s['liveBroadcastContent'] ?? 'none';
			$title = mb_substr( self::text( $s['title'] ?? '' ), 0, 300 );
			$byId[ $id ] = [
				'id'             => $id,
				'title'          => '' !== $title ? $title : 'Untitled',
				'description'    => is_string( $s['description'] ?? null ) ? $s['description'] : '',
				'publishedAt'    => self::iso( $s['publishedAt'] ?? '' ),
				'thumbnail'      => self::thumbnail( $s['thumbnails'] ?? null ),
				'durationSecs'   => self::parseDuration( $item['contentDetails']['duration'] ?? null ),
				'live'           => in_array( $live, [ 'live', 'upcoming' ], true ) ? $live : 'none',
				'scheduledStart' => self::iso( $item['liveStreamingDetails']['scheduledStartTime'] ?? '' ),
				'url'            => self::watchUrl( $id ),
			];
		}
		$out = [];
		foreach ( $order as $id ) {
			if ( isset( $byId[ $id ] ) ) {
				$out[] = $byId[ $id ];
			}
		}
		return $out;
	}

	/** The API's error reason ("quotaExceeded", "keyInvalid"…) from a response body, letters only; "" if none. */
	public static function errorReason( mixed $body ): string {
		$data   = is_string( $body ) ? json_decode( $body, true ) : null;
		$reason = is_array( $data ) ? ( $data['error']['errors'][0]['reason'] ?? '' ) : '';
		return is_string( $reason ) ? (string) preg_replace( '/[^A-Za-z]/', '', strip_tags( $reason ) ) : '';
	}

	public static function parseDuration( mixed $iso ): int {
		if ( ! is_string( $iso ) || ! preg_match( '/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/', $iso, $m ) ) {
			return 0;
		}
		return (int) ( $m[1] ?? 0 ) * 86400 + (int) ( $m[2] ?? 0 ) * 3600 + (int) ( $m[3] ?? 0 ) * 60 + (int) ( $m[4] ?? 0 );
	}

	/** "1:02:03" or "45:07"; "" for no duration. */
	public static function formatDuration( int $secs ): string {
		if ( $secs <= 0 ) {
			return '';
		}
		$h = intdiv( $secs, 3600 );
		$m = intdiv( $secs % 3600, 60 );
		$s = $secs % 60;
		return $h > 0 ? sprintf( '%d:%02d:%02d', $h, $m, $s ) : sprintf( '%d:%02d', $m, $s );
	}

	public static function embedUrl( string $id ): string {
		return self::isVideoId( $id ) ? 'https://www.youtube-nocookie.com/embed/' . $id : '';
	}

	public static function watchUrl( string $id ): string {
		return self::isVideoId( $id ) ? 'https://www.youtube.com/watch?v=' . $id : '';
	}

	public static function liveNow( array $videos ): ?array {
		foreach ( $videos as $v ) {
			if ( 'live' === ( $v['live'] ?? '' ) ) {
				return $v;
			}
		}
		return null;
	}

	/** The soonest scheduled stream or premiere; one without a schedule doesn't count. */
	public static function nextUpcoming( array $videos ): ?array {
		$upcoming = array_values( array_filter( $videos, static fn ( $v ) => 'upcoming' === ( $v['live'] ?? '' ) && '' !== ( $v['scheduledStart'] ?? '' ) ) );
		usort( $upcoming, static fn ( $a, $b ) => strcmp( $a['scheduledStart'], $b['scheduledStart'] ) );
		return $upcoming[0] ?? null;
	}

	/** @return list<array> Finished videos, newest first. */
	public static function past( array $videos, int $limit ): array {
		return array_slice( array_values( array_filter( $videos, static fn ( $v ) => 'none' === ( $v['live'] ?? '' ) ) ), 0, max( 0, $limit ) );
	}

	/** "Sunday 5 October, 10:30" in London time. */
	public static function formatScheduled( string $iso ): string {
		$iso = self::iso( $iso );
		return '' === $iso ? '' : ( new DateTimeImmutable( $iso ) )->setTimezone( new DateTimeZone( EventTime::TZ ) )->format( 'l j F, H:i' );
	}

	/** "5 Oct 2026" (en-GB, "Sept") for a UTC timestamp, in London time. */
	public static function displayDate( string $iso ): string {
		$iso = self::iso( $iso );
		if ( '' === $iso ) {
			return '';
		}
		$local = ( new DateTimeImmutable( $iso ) )->setTimezone( new DateTimeZone( EventTime::TZ ) )->format( 'Y-m-d\TH:i' );
		return EventTime::dayNumber( $local ) . ' ' . EventTime::monthShort( $local ) . ' ' . substr( $local, 0, 4 );
	}

	private static function text( mixed $value ): string {
		return is_string( $value ) ? trim( (string) preg_replace( '/[\x00-\x1F\x7F]/u', '', $value ) ) : '';
	}

	private static function iso( mixed $value ): string {
		if ( ! is_string( $value ) || ! preg_match( '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/', $value ) ) {
			return '';
		}
		return ( new DateTimeImmutable( $value ) )->setTimezone( new DateTimeZone( 'UTC' ) )->format( 'Y-m-d\TH:i:s\Z' );
	}

	/** The widest https://i.ytimg.com thumbnail, or "" (anything else could point the server's copy anywhere). */
	private static function thumbnail( mixed $thumbnails ): string {
		$best  = '';
		$width = -1;
		foreach ( is_array( $thumbnails ) ? $thumbnails : [] as $thumb ) {
			$url = is_array( $thumb ) ? ( $thumb['url'] ?? '' ) : '';
			$w   = is_array( $thumb ) ? (int) ( $thumb['width'] ?? 0 ) : 0;
			if ( is_string( $url ) && str_starts_with( $url, 'https://i.ytimg.com/' ) && ! preg_match( '/[\s"\'<>\\\\]/', $url ) && $w > $width ) {
				$best  = $url;
				$width = $w;
			}
		}
		return $best;
	}
}
```

In `elevation-core.php`, add `require_once ELEVATION_CORE_DIR . 'src/YouTube.php';` after the `src/Fixtures.php` line.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK`, with the 93 existing tests plus the new ones.

- [ ] **Step 5: Commit**

```bash
git add wp-content/plugins/elevation-core/src/YouTube.php wp-content/plugins/elevation-core/tests/YouTubeTest.php wp-content/plugins/elevation-core/elevation-core.php
git commit -m "YouTube: pure Data API parsing, live/upcoming/past selection and London formats (spec §6.4)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The feed client, status, thumbnail copies and Settings → Church

**Files:**
- Create: `wp-content/plugins/elevation-core/includes/youtube.php`
- Modify:
  - `wp-content/plugins/elevation-core/includes/settings-page.php`
  - `wp-content/plugins/elevation-core/elevation-core.php`
  - `wp-content/mu-plugins/local-dev.php`
  - `docker-compose.yml`
  - `.env.example`

**Interfaces:**
- **Consumes:** `YouTube::*` (Task 1) and `elevation_setting()`.
- **Produces:**
  - `elevation_youtube_key(): string`, via the filter `elevation_youtube_api_key`.
  - `elevation_youtube_feed(): array{status:'ok'|'unconfigured'|'failed', videos:list<Video>}`
  - `elevation_youtube_live(): array{state:'live'|'upcoming'|'none', video:?Video}`
  - `elevation_youtube_status(): array{state:'ok'|'failed'|'unconfigured', time:int, message:string}`
  - `elevation_youtube_flush(): void`
  - `elevation_youtube_thumb_url(string $video_id): string`, which returns the local URL or `''`.
  - `elevation_youtube_status_html(): string`
  - The transients `elevation_yt_feed` and `elevation_yt_uploads`, and the option `elevation_youtube_status`.
  - The admin-post action `elevation_youtube_check`.
  - The folder `uploads/elevation-youtube/`.

- [ ] **Step 1: The client**

Create `includes/youtube.php`:

```php
<?php
/**
 * The church's YouTube channel (spec §6.3, §6.4). Uploads playlist ID cached a day; the 50 newest videos
 * cached 60s, failures included, so a dead API costs one request a minute. The result of each fetch is
 * recorded for Settings → Church, because live has no server access to read logs (spec §3). Thumbnails
 * the site shows are copied to uploads/elevation-youtube/ so visitors never ask YouTube for them.
 */
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

const ELEVATION_YT_FEED    = 'elevation_yt_feed';
const ELEVATION_YT_UPLOADS = 'elevation_yt_uploads';
const ELEVATION_YT_STATUS  = 'elevation_youtube_status';
const ELEVATION_YT_THUMBS  = 15; // live/upcoming + 12 on Watch + 1 on Home, with room to spare.

function elevation_youtube_key(): string {
	return trim( (string) apply_filters( 'elevation_youtube_api_key', (string) elevation_setting( 'youtube.apiKey' ) ) );
}

/** GET a Data API URL as an array; on failure null, with a plain-words reason in $error (never the key). */
function elevation_youtube_request( string $endpoint, string $url, ?string &$error ): ?array {
	$response = wp_remote_get( $url, [ 'timeout' => 5, 'headers' => [ 'Accept' => 'application/json' ] ] );
	if ( is_wp_error( $response ) ) {
		$error = "YouTube $endpoint request failed: " . $response->get_error_code();
	} elseif ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
		$reason = YouTube::errorReason( wp_remote_retrieve_body( $response ) );
		$error  = sprintf( 'YouTube %s request failed: HTTP %d%s', $endpoint, (int) wp_remote_retrieve_response_code( $response ), '' !== $reason ? " ($reason)" : '' );
	} else {
		$data = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		if ( is_array( $data ) ) {
			return $data;
		}
		$error = "YouTube $endpoint returned something that isn't JSON";
	}
	error_log( 'elevation-core: ' . $error ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
	return null;
}

/** @return array{status:string, videos:list<array>} */
function elevation_youtube_feed(): array {
	$key = elevation_youtube_key();
	if ( '' === $key ) {
		return [ 'status' => 'unconfigured', 'videos' => [] ];
	}
	$cached = get_transient( ELEVATION_YT_FEED );
	if ( is_array( $cached ) && isset( $cached['status'], $cached['videos'] ) && is_array( $cached['videos'] ) ) {
		return $cached;
	}
	$error = null;
	$feed  = elevation_youtube_fetch( $key, $error );
	set_transient( ELEVATION_YT_FEED, $feed, MINUTE_IN_SECONDS );
	update_option( ELEVATION_YT_STATUS, [
		'state'   => $feed['status'],
		'time'    => time(),
		'message' => 'ok' === $feed['status'] ? sprintf( '%d videos', count( $feed['videos'] ) ) : (string) $error,
	], false );
	if ( 'ok' === $feed['status'] ) {
		elevation_youtube_cache_thumbnails( $feed['videos'] );
	}
	return $feed;
}

/** @return array{status:string, videos:list<array>} */
function elevation_youtube_fetch( string $key, ?string &$error ): array {
	$failed  = [ 'status' => 'failed', 'videos' => [] ];
	$uploads = get_transient( ELEVATION_YT_UPLOADS );
	if ( ! is_string( $uploads ) || '' === $uploads ) {
		$uploads = YouTube::uploadsPlaylistId( elevation_youtube_request( 'channels', YouTube::channelsUrl( (string) elevation_setting( 'youtube.channelHandle' ), $key ), $error ) );
		if ( null === $uploads ) {
			$error ??= 'YouTube has no channel with the handle in Settings → Church';
			return $failed;
		}
		set_transient( ELEVATION_YT_UPLOADS, $uploads, DAY_IN_SECONDS );
	}
	$playlist = elevation_youtube_request( 'playlistItems', YouTube::playlistItemsUrl( $uploads, 50, $key ), $error );
	if ( null === $playlist ) {
		return $failed;
	}
	$ids = YouTube::playlistVideoIds( $playlist );
	if ( ! $ids ) {
		return [ 'status' => 'ok', 'videos' => [] ];
	}
	$videos = elevation_youtube_request( 'videos', YouTube::videosUrl( $ids, $key ), $error );
	return null === $videos ? $failed : [ 'status' => 'ok', 'videos' => YouTube::videos( $videos, $ids ) ];
}

/** @return array{state:string, video:?array} */
function elevation_youtube_live(): array {
	$videos = elevation_youtube_feed()['videos'];
	$live   = YouTube::liveNow( $videos );
	if ( $live ) {
		return [ 'state' => 'live', 'video' => $live ];
	}
	$next = YouTube::nextUpcoming( $videos );
	return $next ? [ 'state' => 'upcoming', 'video' => $next ] : [ 'state' => 'none', 'video' => null ];
}

/** @return array{state:string, time:int, message:string} */
function elevation_youtube_status(): array {
	if ( '' === elevation_youtube_key() ) {
		return [ 'state' => 'unconfigured', 'time' => 0, 'message' => '' ];
	}
	$s = (array) get_option( ELEVATION_YT_STATUS, [] );
	return [ 'state' => (string) ( $s['state'] ?? '' ), 'time' => (int) ( $s['time'] ?? 0 ), 'message' => (string) ( $s['message'] ?? '' ) ];
}

function elevation_youtube_flush(): void {
	delete_transient( ELEVATION_YT_FEED );
	delete_transient( ELEVATION_YT_UPLOADS );
}

// A new key or channel handle takes effect straight away.
add_action( 'update_option_elevation_settings', 'elevation_youtube_flush' );

/* ---------- Thumbnail copies ---------- */

/** @return array{path:string, url:string} */
function elevation_youtube_thumb_dir(): array {
	$uploads = wp_upload_dir( null, false );
	return [ 'path' => $uploads['basedir'] . '/elevation-youtube', 'url' => $uploads['baseurl'] . '/elevation-youtube' ];
}

function elevation_youtube_thumb_url( string $video_id ): string {
	$dir = elevation_youtube_thumb_dir();
	return YouTube::isVideoId( $video_id ) && is_file( "{$dir['path']}/$video_id.jpg" ) ? "{$dir['url']}/$video_id.jpg" : '';
}

/** Copy missing thumbnails for the videos the site shows; delete copies no longer in the feed. */
function elevation_youtube_cache_thumbnails( array $videos ): void {
	$dir = elevation_youtube_thumb_dir();
	if ( ! wp_mkdir_p( $dir['path'] ) ) {
		return;
	}
	$shown = array_merge( array_filter( [ YouTube::liveNow( $videos ), YouTube::nextUpcoming( $videos ) ] ), YouTube::past( $videos, 13 ) );
	$keep  = [];
	foreach ( array_slice( $shown, 0, ELEVATION_YT_THUMBS ) as $video ) {
		$file   = "{$dir['path']}/{$video['id']}.jpg";
		$keep[] = basename( $file );
		if ( is_file( $file ) || '' === $video['thumbnail'] ) {
			continue;
		}
		$response = wp_safe_remote_get( $video['thumbnail'], [ 'timeout' => 4, 'limit_response_size' => 2 * MB_IN_BYTES ] );
		$body     = is_wp_error( $response ) ? '' : (string) wp_remote_retrieve_body( $response );
		$size     = '' !== $body && 200 === (int) wp_remote_retrieve_response_code( $response ) ? @getimagesizefromstring( $body ) : false; // phpcs:ignore WordPress.PHP.NoSilencedErrors
		if ( is_array( $size ) && IMAGETYPE_JPEG === $size[2] ) {
			file_put_contents( $file, $body ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		}
	}
	foreach ( glob( "{$dir['path']}/*.jpg" ) ?: [] as $file ) {
		if ( preg_match( '/^[A-Za-z0-9_-]{11}\.jpg$/', basename( $file ) ) && ! in_array( basename( $file ), $keep, true ) ) {
			wp_delete_file( $file );
		}
	}
}

/* ---------- Settings → Church: status and "Check YouTube now" ---------- */

function elevation_youtube_status_html(): string {
	$s     = elevation_youtube_status();
	$when  = $s['time'] ? sprintf( /* translators: %s: time ago */ __( '%s ago', 'elevation-core' ), human_time_diff( $s['time'] ) ) : '';
	$text  = match ( $s['state'] ) {
		'unconfigured' => __( 'No API key yet. Watch and Home show the “Watch on YouTube” panel until one is added.', 'elevation-core' ),
		'ok'           => sprintf( /* translators: 1: when, 2: "N videos" */ __( 'Working. Last checked %1$s: %2$s found.', 'elevation-core' ), $when, $s['message'] ),
		'failed'       => sprintf( /* translators: 1: when, 2: error */ __( 'Not working. Last tried %1$s: %2$s. Watch and Home show the “Watch on YouTube” panel meanwhile.', 'elevation-core' ), $when, $s['message'] ),
		default        => __( 'Not checked yet. It checks by itself when someone opens Watch or Home.', 'elevation-core' ),
	};
	$class = 'failed' === $s['state'] ? 'notice-error' : ( 'ok' === $s['state'] ? 'notice-success' : 'notice-info' );
	$env   = '' === (string) elevation_setting( 'youtube.apiKey' ) && '' !== elevation_youtube_key() ? ' ' . __( '(Using the key from this computer’s local settings.)', 'elevation-core' ) : '';
	return sprintf(
		'<div class="notice inline %s"><p><strong>%s</strong> %s%s</p><p><a class="button" href="%s">%s</a></p></div>',
		esc_attr( $class ),
		esc_html__( 'YouTube:', 'elevation-core' ),
		esc_html( $text ),
		esc_html( $env ),
		esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=elevation_youtube_check' ), 'elevation_youtube_check' ) ),
		esc_html__( 'Check YouTube now', 'elevation-core' )
	);
}

add_action( 'admin_post_elevation_youtube_check', function () {
	if ( ! current_user_can( 'manage_church_settings' ) ) {
		wp_die( esc_html__( 'You are not allowed to do that.', 'elevation-core' ), 403 );
	}
	check_admin_referer( 'elevation_youtube_check' );
	elevation_youtube_flush();
	elevation_youtube_feed();
	wp_safe_redirect( add_query_arg( 'elevation_youtube_checked', '1', wp_get_referer() ?: admin_url( 'options-general.php?page=elevation-church' ) ) . '#elevation-youtube' );
	exit;
} );
```

In `elevation-core.php`, add `require_once ELEVATION_CORE_DIR . 'includes/youtube.php';` after the `includes/event-render.php` line.

- [ ] **Step 2: Show the status in Settings → Church**

In `includes/settings-page.php`, inside `elevation_render_settings_page()`, give the YouTube group an anchor, a line of explanation and the status box. Replace:

```php
				<h2><?php echo esc_html( ucfirst( $group ) ); ?></h2>
```

with:

```php
				<h2<?php echo 'youtube' === $group ? ' id="elevation-youtube"' : ''; ?>><?php echo esc_html( 'youtube' === $group ? 'YouTube' : ucfirst( $group ) ); ?></h2>
				<?php if ( 'youtube' === $group ) : ?>
					<p><?php esc_html_e( 'Watch and the home page show the latest videos from this channel, and switch to the live stream while you are streaming. Videos open on YouTube.', 'elevation-core' ); ?></p>
					<?php echo elevation_youtube_status_html(); // Escaped inside. ?>
				<?php endif; ?>
```

"Check YouTube now" is a link, not a form, because the settings page is already one `<form>`.

- [ ] **Step 3: The local key from `.env`**

In `docker-compose.yml`, add this to the `x-wp-env: &wp-env` map, after `WORDPRESS_DEBUG: "1"`. Both the `wordpress` and `wpcli` services use `*wp-env`.

```yaml
  YOUTUBE_API_KEY: ${YOUTUBE_API_KEY:-}
```

Append to `.env.example`:

```
# Local only: a YouTube Data API v3 key so the local site shows the real channel. On live, the key is
# entered in Settings → Church instead. Leave empty to see the "Watch on YouTube" fallback.
YOUTUBE_API_KEY=
```

Append to `wp-content/mu-plugins/local-dev.php`. The file already returns early unless the environment is `local`.

```php
// Local only: use YOUTUBE_API_KEY from .env (passed in by docker-compose.yml) when Settings → Church has none.
add_filter( 'elevation_youtube_api_key', function ( $key ) {
	return '' !== trim( (string) $key ) ? $key : (string) getenv( 'YOUTUBE_API_KEY' );
} );
```

Run `docker compose up -d` so the containers pick up the new environment variable.

- [ ] **Step 4: Check the unconfigured, failed and working paths (Review Focus 1 and 4)**

```bash
wp() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
docker compose exec -T wordpress sh -c 'test -n "$YOUTUBE_API_KEY" && echo "local key: set" || echo "local key: unset"'
wp eval 'remove_all_filters( "elevation_youtube_api_key" ); elevation_youtube_flush(); $f = elevation_youtube_feed(); echo $f["status"], " ", elevation_youtube_status()["state"], "\n";'
docker compose exec -T wordpress sh -c ': > /var/www/html/wp-content/debug.log'
wp eval 'add_filter( "elevation_youtube_api_key", fn () => "not-a-real-key", 99 ); elevation_youtube_flush(); $a = elevation_youtube_feed(); $b = elevation_youtube_feed(); $s = elevation_youtube_status(); echo $a["status"], " ", $b["status"], " | ", $s["state"], " | ", $s["message"], "\n";'
docker compose exec -T wordpress sh -c 'grep -c "elevation-core: YouTube" /var/www/html/wp-content/debug.log; grep -c "not-a-real-key" /var/www/html/wp-content/debug.log || true'
wp eval 'elevation_youtube_flush();'
```

Expected:
- **Key check:** `local key: set` or `local key: unset`. The key itself is never printed.
- **No key at all:** `unconfigured unconfigured`.
- **Bogus key:** `failed failed | failed | YouTube channels request failed: HTTP 400 (badRequest)`, or a similar reason such as `keyInvalid`.
- **Log:** the count is `1`, because the second call is cached. `not-a-real-key` appears `0` times.

The bogus key is a test value set through a filter inside one `wp eval`. It is never saved.

If the local key is set, check the real channel:

```bash
wp eval 'elevation_youtube_flush(); $f = elevation_youtube_feed(); $l = elevation_youtube_live(); echo $f["status"], " ", count( $f["videos"] ), " ", $l["state"], "\n"; foreach ( array_slice( $f["videos"], 0, 3 ) as $v ) echo $v["id"], " ", $v["live"], " ", $v["durationSecs"], " ", $v["publishedAt"], " ", elevation_youtube_thumb_url( $v["id"] ) ? "thumb" : "no-thumb", "\n"; echo elevation_youtube_status()["message"], "\n";'
ls wp-content/uploads/elevation-youtube | wc -l
```

Expected:
- `ok N <state>`, where N is at most 50;
- three lines, each with an 11-character ID, `none` (or `live` or `upcoming`), a duration, a date and `thumb`;
- `N videos`;
- between 1 and 15 files in the thumbnails folder.

If the local key is unset, record "real-channel check deferred: YOUTUBE_API_KEY not set in .env" and carry on. Every later task has a fallback check that doesn't need the key.

Check pruning and junk handling next. Create a stale file and an invalid copy, then refresh:

```bash
d=wp-content/uploads/elevation-youtube; mkdir -p "$d"; printf 'x' > "$d/aaaaaaaaaaa.jpg"; printf 'x' > "$d/notes.txt"
wp eval 'elevation_youtube_cache_thumbnails( [ [ "id" => "bbbbbbbbbbb", "live" => "none", "scheduledStart" => "", "thumbnail" => "https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg" ] ] );'
ls "$d" | sort; rm -f "$d/notes.txt"
```

Expected:
- `aaaaaaaaaaa.jpg` is gone, because it is stale.
- `notes.txt` is untouched, because only 11-character-ID `.jpg` files are pruned.
- `bbbbbbbbbbb.jpg` is absent, since YouTube returns an error or placeholder for a made-up ID. If the response happens to be a real JPEG it may exist, which is fine either way.
- No other files appear.

Afterwards, if the key is set, refresh the real feed again so the folder holds the real thumbnails.

Check that a key stored through wp-admin is the one the site uses, and that removing it works. The user will enter the real key in Settings → Church. This check runs the settings page's own save path (`elevation_sanitize_settings`) with a test value, then puts the saved option back exactly as it was:

```bash
save() { wp eval "update_option( 'elevation_settings', elevation_sanitize_settings( [ 'youtube' => $1 ] ) );"; }
wp eval 'update_option( "elevation_settings_backup_plan4", get_option( "elevation_settings", [] ), false );'
save "[ 'apiKey' => 'test-key-from-admin' ]"
wp eval 'echo elevation_youtube_key() === "test-key-from-admin" ? "admin key used" : "admin key NOT used", "\n";'
save "[ 'apiKey' => '' ]"
wp eval 'echo elevation_youtube_key() === "test-key-from-admin" ? "blank keeps the saved key" : "blank LOST the key", "\n"; echo str_contains( elevation_youtube_status_html(), "test-key-from-admin" ) ? "KEY LEAKED" : "key not shown", "\n";'
save "[ 'apiKey' => '', 'removeApiKey' => '1' ]"
wp eval 'echo "" === (string) elevation_setting( "youtube.apiKey" ) ? "removed" : "NOT removed", "\n";'
wp eval 'update_option( "elevation_settings", get_option( "elevation_settings_backup_plan4", [] ) ); delete_option( "elevation_settings_backup_plan4" ); elevation_youtube_flush();'
```

Each read runs in its own `wp eval`, because `elevation_settings()` caches the settings for the rest of a request. Expected: `admin key used`, `blank keeps the saved key`, `removed`, `key not shown`.

The "Check YouTube now" button needs a wp-admin sign-in. If the browser pane is signed in, open Settings → Church, check the YouTube box and press the button. Otherwise, run `wp eval 'echo wp_strip_all_tags( elevation_youtube_status_html() ), "\n";'`, confirm the sentence reads correctly, and record that the button check is deferred.

- [ ] **Step 5: Run the tests and commit**

Run: `docker compose run --rm php vendor/bin/phpunit`
Expected: `OK`.

```bash
git add wp-content/plugins/elevation-core/includes/youtube.php wp-content/plugins/elevation-core/includes/settings-page.php wp-content/plugins/elevation-core/elevation-core.php wp-content/mu-plugins/local-dev.php docker-compose.yml .env.example
git commit -m "YouTube feed client: caching, status and Check YouTube now in Settings → Church, local thumbnail copies, local .env key

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Video cards and Watch "Recent messages"

**Files:**
- Create: `wp-content/plugins/elevation-core/includes/youtube-render.php`
- Create: `wp-content/plugins/elevation-core/src/blocks/recent-videos/{block.json,index.js,render.php}`
- Create: `wp-content/themes/elevation/assets/css/youtube.css`
- Modify: `wp-content/themes/elevation/functions.php`, `wp-content/plugins/elevation-core/elevation-core.php`, `seed/pages/watch.html`
- Rebuild: `build/blocks/recent-videos/*`

**Interfaces:**
- **Consumes:**
  - `elevation_youtube_feed()` and `elevation_youtube_thumb_url()` (Task 2)
  - `YouTube::past()`, `formatDuration()` and `displayDate()` (Task 1)
  - `Icons::svg('play', 'is-filled')`
- **Produces:**
  - `elevation_video_card(array $video): string`, which returns `<article class="video-card reveal">`
  - `elevation_live_badge(): string`
  - the block `elevation/recent-videos`
  - the stylesheet handle `elevation-youtube`
  - the CSS classes `.ecm-section` and `.ecm-section__inner`

- [ ] **Step 1: The card and badge**

Create `includes/youtube-render.php`:

```php
<?php
/**
 * Video card (redesign video-card.tsx) and live badge. Cards open YouTube in a new tab (spec §6.3). The
 * image is the site's own copy (includes/youtube.php) or the ink placeholder — never i.ytimg.com (§12).
 */
use Elevation\Core\Icons;
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

function elevation_video_card( array $video ): string {
	$thumb    = elevation_youtube_thumb_url( (string) ( $video['id'] ?? '' ) );
	$duration = YouTube::formatDuration( (int) ( $video['durationSecs'] ?? 0 ) );
	$date     = YouTube::displayDate( (string) ( $video['publishedAt'] ?? '' ) );
	ob_start();
	?>
	<article class="video-card reveal">
		<a class="video-card__link" href="<?php echo esc_url( (string) $video['url'] ); ?>" target="_blank" rel="noreferrer noopener">
			<div class="video-card__media">
				<?php if ( '' !== $thumb ) : ?>
					<img src="<?php echo esc_url( $thumb ); ?>" alt="" loading="lazy" decoding="async">
				<?php else : ?>
					<span class="video-card__placeholder" aria-hidden="true"></span>
				<?php endif; ?>
				<span class="video-card__play" aria-hidden="true"><?php echo Icons::svg( 'play', 'is-filled' ); ?></span>
				<?php if ( '' !== $duration ) : ?>
					<span class="video-card__duration"><span class="screen-reader-text"><?php esc_html_e( 'Length', 'elevation-core' ); ?> </span><?php echo esc_html( $duration ); ?></span>
				<?php endif; ?>
			</div>
			<h3 class="video-card__title"><?php echo esc_html( (string) $video['title'] ); ?><span class="screen-reader-text"> <?php esc_html_e( '(opens YouTube in a new tab)', 'elevation-core' ); ?></span></h3>
			<?php if ( '' !== $date ) : ?>
				<p class="video-card__date"><?php echo esc_html( $date ); ?></p>
			<?php endif; ?>
		</a>
	</article>
	<?php
	return (string) ob_get_clean();
}

function elevation_live_badge(): string {
	return '<span class="live-badge"><span class="live-badge__dot" aria-hidden="true"></span>' . esc_html__( 'Live now', 'elevation-core' ) . '</span>';
}
```

In `elevation-core.php`, add `require_once ELEVATION_CORE_DIR . 'includes/youtube-render.php';` after the `includes/youtube.php` line.

- [ ] **Step 2: The block**

Create `src/blocks/recent-videos/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/recent-videos",
  "title": "Recent messages (YouTube)",
  "category": "widgets",
  "icon": "video-alt3",
  "description": "The 12 latest finished videos from the church's YouTube channel; each opens YouTube. Without a working API key, a link to the channel.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "render": "file:./render.php"
}
```

Create `src/blocks/recent-videos/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="video-alt3" label="Recent messages (YouTube)" instructions="The 12 latest videos from the YouTube channel in Settings → Church. They open on YouTube." />
		</div>
	),
} );
```

Create `src/blocks/recent-videos/render.php`. The copy is verbatim from inventory §1 Watch.

```php
<?php
/**
 * Watch → "Recent messages" (spec §6.3): the channel's 12 latest finished videos, or the redesign's
 * fallback panel. The section turns grey under an active live or upcoming player (youtube.css).
 */
use Elevation\Core\Icons;
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

$elevation_feed   = elevation_youtube_feed();
$elevation_videos = YouTube::past( $elevation_feed['videos'], 12 );
?>
<section <?php echo get_block_wrapper_attributes( [ 'class' => 'alignfull ecm-section watch-messages has-global-padding' ] ); ?>>
	<div class="ecm-section__inner">
		<?php if ( $elevation_videos ) : ?>
			<div class="section-heading">
				<p class="is-style-eyebrow"><?php esc_html_e( 'Catch up', 'elevation-core' ); ?></p>
				<h2 class="wp-block-heading"><?php esc_html_e( 'Recent messages', 'elevation-core' ); ?></h2>
				<p class="is-style-lead"><?php esc_html_e( 'Straight from our YouTube channel — this list updates itself.', 'elevation-core' ); ?></p>
			</div>
			<div class="video-grid">
				<?php foreach ( $elevation_videos as $elevation_video ) {
					echo elevation_video_card( $elevation_video ); // Escaped inside.
				} ?>
			</div>
			<div class="wp-block-buttons watch-messages__more">
				<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'See everything on YouTube', 'elevation-core' ); ?></a></div>
			</div>
		<?php else : ?>
			<div class="panel-watch">
				<span class="wp-block-elevation-icon" style="--icon-size:40px"><?php echo Icons::svg( 'monitor-play' ); ?></span>
				<h2 class="wp-block-heading"><?php esc_html_e( 'Every message, on our channel', 'elevation-core' ); ?></h2>
				<p><?php echo 'failed' === $elevation_feed['status']
					? esc_html__( "We couldn't load the archive just now. It's all on YouTube in the meantime.", 'elevation-core' )
					: esc_html__( "Full services and recent messages are on YouTube. Subscribe and you'll know the moment a new one lands.", 'elevation-core' ); ?></p>
				<div class="wp-block-buttons is-content-justification-center"><div class="wp-block-button is-size-lg"><a class="wp-block-button__link wp-element-button" href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'Watch on YouTube', 'elevation-core' ); ?></a></div></div>
			</div>
		<?php endif; ?>
	</div>
</section>
```

- [ ] **Step 3: Styles**

Create `wp-content/themes/elevation/assets/css/youtube.css`:

```css
/* YouTube (Plan 4): block sections, video cards, the live badge and player, the Home watch tile. */

/* ---------- Full-width sections rendered by blocks ---------- */
.ecm-section { box-sizing: border-box; padding-block: var(--wp--preset--spacing--60); margin-block: 0 !important; }
.ecm-section__inner { max-width: 1240px; margin-inline: auto; }
.ecm-section__inner > * { margin-block: 0; }
/* "Recent messages" turns grey under an active live or upcoming player (inventory §1 Watch). */
.wp-block-elevation-live-player.is-active + .watch-messages { background: var(--wp--preset--color--grey-50); }
.watch-messages__more { justify-content: center; margin-top: 2.75rem !important; }

/* ---------- Video cards (redesign video-card.tsx) ---------- */
.video-grid { display: grid; gap: 26px; }
.video-grid > * { margin: 0; }
@media (min-width: 640px) { .video-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .video-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.video-card__link { display: block; color: inherit; text-decoration: none; }
.video-card__link:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 4px; border-radius: 14px; }
.video-card__media { position: relative; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 14px; background: var(--wp--preset--color--ink); box-shadow: var(--wp--preset--shadow--card); transition: transform 0.25s ease, box-shadow 0.25s ease; }
.video-card__link:hover .video-card__media { box-shadow: var(--wp--preset--shadow--card-lg); }
@media (prefers-reduced-motion: no-preference) { .video-card__link:hover .video-card__media { transform: translateY(-4px); } }
.video-card__media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.video-card__placeholder { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 20%, #2a2a5e 0%, transparent 60%); }
.video-card__media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgb(14 14 44 / 0.6)); pointer-events: none; }
.video-card__play { position: absolute; top: 50%; left: 50%; z-index: 1; display: grid; place-items: center; width: 56px; height: 56px; margin: -28px 0 0 -28px; border-radius: 50%; background: rgb(255 255 255 / 0.9); color: var(--wp--preset--color--ink); transition: background-color 0.2s ease; }
.video-card__play svg { width: 22px; height: 22px; margin-left: 2px; fill: currentColor; }
.video-card__link:hover .video-card__play { background: var(--wp--preset--color--green); }
.video-card__duration { position: absolute; right: 10px; bottom: 10px; z-index: 1; padding: 2px 8px; border-radius: 6px; background: rgb(14 14 44 / 0.8); color: #fff; font-size: 12px; font-weight: 600; }
.video-card__title { margin: 14px 0 0; font-size: 18px; transition: color 0.2s ease; }
.video-card__link:hover .video-card__title { color: var(--wp--preset--color--green-700); }
.video-card__date { margin: 4px 0 0; font-size: 13.5px; color: var(--wp--preset--color--grey-500); }

/* ---------- Live badge (redesign LiveBadge; #D64545 is the redesign's exact red, no preset) ---------- */
.live-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 9999px; background: #D64545; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.live-badge__dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: #fff; }
@media (prefers-reduced-motion: no-preference) {
	.live-badge__dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: #fff; opacity: 0.75; animation: live-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
}
@keyframes live-ping { 75%, 100% { transform: scale(2); opacity: 0; } }
```

In `wp-content/themes/elevation/functions.php`, add `'assets/css/youtube.css'` to the `add_editor_style( [ … ] )` array. Then add this after the `elevation-events` enqueue:

```php
	wp_enqueue_style( 'elevation-youtube', get_theme_file_uri( 'assets/css/youtube.css' ), [ 'elevation-site' ], (string) filemtime( get_theme_file_path( 'assets/css/youtube.css' ) ) );
```

- [ ] **Step 4: The Watch page**

In `seed/pages/watch.html`, replace the middle section with a single line. That section starts at the second `<!-- wp:group {"tagName":"section","align":"full","style":…` line, holds the `panel-watch` group, and ends at its closing `<!-- /wp:group -->`. The replacement line is:

```html
<!-- wp:elevation/recent-videos /-->
```

Leave the hero and the ink CTA band unchanged.

- [ ] **Step 5: Build, seed and check (Review Focus 1, 2 and 3)**

Run: `docker compose run --rm node npm run build`, then `./bin/seed.sh 2>&1 | grep -E "page watch|Seed complete"`.
Expected: `Updated page watch`, then `Seed complete.`

```bash
w() { curl -s http://localhost:8080/watch/; }
w | grep -oE 'Recent messages|Straight from our YouTube channel|class="video-card reveal"|See everything on YouTube|Every message, on our channel|i\.ytimg\.com|googleapis|uploads/elevation-youtube/[A-Za-z0-9_-]{11}\.jpg' | sort | uniq -c
./bin/check-tokens.sh /watch/
```

Expected with the local key set:
- "Recent messages", the lead and "See everything on YouTube" once each;
- 12 video cards, or fewer only if the channel has fewer than 12 finished videos;
- local thumbnail URLs;
- no `i.ytimg.com` and no `googleapis`;
- no raw tokens.

Expected without the key: the "Every message, on our channel" panel with the no-key text.

Check the fallback copy and escaping, whether or not the key is set. The crafted feed exists only in PHP memory inside one `wp eval`, as a filter on the transient; nothing is stored.

```bash
wp() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
wp eval 'add_filter( "elevation_youtube_api_key", fn () => "", 99 ); echo render_block( [ "blockName" => "elevation/recent-videos", "attrs" => [], "innerBlocks" => [], "innerHTML" => "", "innerContent" => [] ] );' | grep -oE "Every message, on our channel|Full services and recent messages are on YouTube" | sort | uniq -c
wp eval 'add_filter( "elevation_youtube_api_key", fn () => "x", 99 ); add_filter( "pre_transient_elevation_yt_feed", fn () => [ "status" => "failed", "videos" => [] ] ); echo render_block( [ "blockName" => "elevation/recent-videos", "attrs" => [], "innerBlocks" => [], "innerHTML" => "", "innerContent" => [] ] );' | grep -oE "We couldn&#039;t load the archive just now|We couldn.t load the archive just now" | sort | uniq -c
wp eval 'add_filter( "elevation_youtube_api_key", fn () => "x", 99 ); add_filter( "pre_transient_elevation_yt_feed", fn () => [ "status" => "ok", "videos" => [ [ "id" => "aaaaaaaaaaa", "title" => "Q&A: \"Faith\" <script>alert(1)</script> 🙏", "description" => "", "publishedAt" => "2026-10-04T09:30:00Z", "thumbnail" => "", "durationSecs" => 2707, "live" => "none", "scheduledStart" => "", "url" => "https://www.youtube.com/watch?v=aaaaaaaaaaa" ] ] ] ); echo render_block( [ "blockName" => "elevation/recent-videos", "attrs" => [], "innerBlocks" => [], "innerHTML" => "", "innerContent" => [] ] );' | grep -oE 'Q&amp;A: &quot;Faith&quot; &lt;script&gt;alert\(1\)&lt;/script&gt; 🙏|<script>alert|video-card__placeholder|45:07|4 Oct 2026|target="_blank" rel="noreferrer noopener"' | sort | uniq -c
docker compose exec -T wordpress sh -c 'grep -c "PHP Warning\|PHP Notice" /var/www/html/wp-content/debug.log || true'
```

Expected:
1. **No key:** the panel heading and the no-key text.
2. **Failed:** the "couldn't load" text.
3. **Crafted title:**
   - the escaped title once, and no `<script>alert`;
   - the placeholder, because no local thumbnail exists for that ID;
   - `45:07` and `4 Oct 2026`;
   - at least one `target="_blank" rel="noreferrer noopener"`.
4. **Warnings:** `0`.

In the browser pane, check `/watch/` at 1440px (3 cards across) and at 390px (1 per row):
- There is no horizontal scroll.
- Clicking a card opens YouTube in a new tab.
- The network list shows nothing from `i.ytimg.com`, `youtube.com`, `googleapis.com` or `gstatic.com`.

Reset the viewport to desktop afterwards.

- [ ] **Step 6: Run the tests and commit**

Run `docker compose run --rm php vendor/bin/phpunit` and `./bin/check-urls.sh`.

```bash
git add wp-content/plugins/elevation-core wp-content/themes/elevation/assets/css/youtube.css wp-content/themes/elevation/functions.php seed/pages/watch.html
git commit -m "Watch Recent messages from the YouTube channel: cards open YouTube, local thumbnails, redesign fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Live status: Watch hero, live player, Home watch and the REST swap

**Files:**
- Create:
  - `wp-content/plugins/elevation-core/includes/live.php`
  - `assets/js/live-state.js`
  - `assets/js/live-status.js`
  - `tests/js/live-state.test.cjs`
- Create: `src/blocks/{watch-hero,live-player,home-watch}/{block.json,index.js,render.php}`
- Modify:
  - `assets/js/consent.js`
  - `elevation-core.php`
  - `seed/pages/watch.html`
  - `seed/pages/home.html`
  - `wp-content/themes/elevation/assets/css/youtube.css` (append)
- Rebuild: `build/blocks/*`

**Interfaces:**
- **Consumes:**
  - `elevation_youtube_live()`, `elevation_youtube_feed()` and `elevation_youtube_thumb_url()` (Task 2)
  - `elevation_live_badge()` (Task 3)
  - `YouTube::*`
  - the embed gate block
- **Produces:**
  - `ELEVATION_LIVE_BLOCKS`
  - REST `GET /wp-json/elevation/v1/live?post=<id>`, which returns `{ state, blocks: { '<block name>': '<html>' } }` with `Cache-Control: no-store`
  - the script handle `elevation-live-status`, plus `window.ecmLive = { endpoint }`
  - `elevation_live_attrs(string $block, string $state, array $extra = []): array`
  - live block wrappers carrying `data-live-block`, `data-live-state` and `data-live-post`
  - `window.ecmConsent.scan(root)`
  - `window.ecmLiveState = { parse, needsSwap }`

- [ ] **Step 1: The pure swap decision (TDD)**

Create `tests/js/live-state.test.cjs`:

```js
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const L = require( '../../assets/js/live-state.js' );

test( 'a well-formed answer is kept, with only string blocks', () => {
	assert.deepEqual( L.parse( { state: 'live', blocks: { 'elevation/watch-hero': '<section></section>', bad: 3 } } ), { state: 'live', blocks: { 'elevation/watch-hero': '<section></section>' } } );
} );

test( 'anything else is no answer', () => {
	for ( const bad of [ null, 'live', {}, { state: 'LIVE', blocks: {} }, { state: 'live' }, { state: 'live', blocks: [] } ] ) {
		assert.equal( L.parse( bad ), null );
	}
} );

test( 'swap only when the state changed and there is something to swap in', () => {
	const next = L.parse( { state: 'live', blocks: { 'elevation/home-watch': '<div></div>' } } );
	assert.equal( L.needsSwap( 'none', next ), true );
	assert.equal( L.needsSwap( 'live', next ), false );
	assert.equal( L.needsSwap( 'none', null ), false );
	assert.equal( L.needsSwap( 'none', L.parse( { state: 'live', blocks: {} } ) ), false );
} );
```

Run `docker compose run --rm node npm run test:js`.
Expected: this file fails with `Cannot find module`.

Create `assets/js/live-state.js`:

```js
/** The live-status answer from /wp-json/elevation/v1/live — pure, shared by live-status.js and the node tests. */
( function ( root, factory ) {
	const api = factory();
	if ( typeof module === 'object' && module.exports ) {
		module.exports = api;
	} else {
		root.ecmLiveState = api;
	}
} )( typeof self !== 'undefined' ? self : this, function () {
	const STATES = [ 'live', 'upcoming', 'none' ];

	function parse( json ) {
		if ( ! json || typeof json !== 'object' || STATES.indexOf( json.state ) === -1 || ! json.blocks || typeof json.blocks !== 'object' || Array.isArray( json.blocks ) ) {
			return null;
		}
		const blocks = {};
		Object.keys( json.blocks ).forEach( function ( name ) {
			if ( typeof json.blocks[ name ] === 'string' ) {
				blocks[ name ] = json.blocks[ name ];
			}
		} );
		return { state: json.state, blocks: blocks };
	}

	function needsSwap( current, next ) {
		return !! next && next.state !== current && Object.keys( next.blocks ).length > 0;
	}

	return { parse: parse, needsSwap: needsSwap };
} );
```

Run `docker compose run --rm node npm run test:js`.
Expected: `# fail 0`.

- [ ] **Step 2: Make swapped-in embed gates work**

In `assets/js/consent.js`, replace the final `window.ecmConsent = { … };` with the version below, and mention `scan` in the file's header comment.

```js
	window.ecmConsent = {
		get: function () {
			return state;
		},
		open: function () {
			showBanner( true );
		},
		/** Wire up embed gates added after load (the live swap): enable their buttons, open them if allowed. */
		scan: function ( root ) {
			( root || document ).querySelectorAll( '[data-ecm-embed-load]' ).forEach( function ( button ) {
				button.disabled = false;
			} );
			if ( state && state.embeds ) {
				( root || document ).querySelectorAll( '[data-ecm-embed]:not(.is-loaded)' ).forEach( function ( gate ) {
					openEmbed( gate, false );
				} );
			}
		},
	};
```

- [ ] **Step 3: The REST endpoint and the swap script**

Create `includes/live.php`:

```php
<?php
/**
 * Live status freshness (spec §6.4). Pages are cached up to 10 minutes on live, so the live blocks carry
 * the state they rendered with; live-status.js asks this uncacheable endpoint (answered from the 60s
 * feed transient) and swaps in fresh HTML — re-rendered from the page's own blocks — if the state changed.
 */
defined( 'ABSPATH' ) || exit;

const ELEVATION_LIVE_BLOCKS = [ 'elevation/watch-hero', 'elevation/live-player', 'elevation/home-watch' ];

add_action( 'init', function () {
	wp_register_script( 'elevation-live-state', ELEVATION_CORE_URL . 'assets/js/live-state.js', [], (string) filemtime( ELEVATION_CORE_DIR . 'assets/js/live-state.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_register_script( 'elevation-live-status', ELEVATION_CORE_URL . 'assets/js/live-status.js', [ 'elevation-live-state' ], (string) filemtime( ELEVATION_CORE_DIR . 'assets/js/live-status.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_add_inline_script( 'elevation-live-status', 'window.ecmLive = ' . wp_json_encode( [ 'endpoint' => rest_url( 'elevation/v1/live' ) ] ) . ';', 'before' );
}, 5 ); // Before the blocks register (priority 10); their block.json names this handle.

/** Wrapper attributes every live block renders with. */
function elevation_live_attrs( string $block, string $state, array $extra = [] ): array {
	return $extra + [ 'data-live-block' => $block, 'data-live-state' => $state, 'data-live-post' => (string) (int) get_the_ID() ];
}

/** @return list<array> Live blocks anywhere in a parsed block tree. */
function elevation_live_find_blocks( array $blocks ): array {
	$found = [];
	foreach ( $blocks as $block ) {
		if ( in_array( $block['blockName'] ?? '', ELEVATION_LIVE_BLOCKS, true ) ) {
			$found[] = $block;
		}
		$found = array_merge( $found, elevation_live_find_blocks( $block['innerBlocks'] ?? [] ) );
	}
	return $found;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'elevation/v1', '/live', [
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'args'                => [ 'post' => [ 'type' => 'integer', 'default' => 0, 'minimum' => 0 ] ],
		'callback'            => function ( WP_REST_Request $request ) {
			$live   = elevation_youtube_live();
			$blocks = [];
			$post   = get_post( (int) $request['post'] );
			if ( $post && 'publish' === $post->post_status && '' === $post->post_password && is_post_publicly_viewable( $post ) ) {
				$GLOBALS['post'] = $post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride -- blocks read get_the_ID().
				setup_postdata( $post );
				foreach ( elevation_live_find_blocks( parse_blocks( $post->post_content ) ) as $block ) {
					$blocks[ $block['blockName'] ] = render_block( $block );
				}
				wp_reset_postdata();
			}
			$response = new WP_REST_Response( [ 'state' => $live['state'], 'blocks' => (object) $blocks ] );
			$response->header( 'Cache-Control', 'no-store, max-age=0' );
			return $response;
		},
	] );
} );
```

Create `assets/js/live-status.js`:

```js
/**
 * Live swap (spec §6.4): on load, then every minute while the tab is visible, ask /elevation/v1/live
 * whether the stream state changed since this (possibly cached) page was rendered; if so, replace each
 * live block with the fresh HTML the server rendered for it. Without JS the rendered state stays.
 */
( function () {
	const M = window.ecmLiveState;
	const config = window.ecmLive || {};
	const blocks = () => Array.prototype.slice.call( document.querySelectorAll( '[data-live-block]' ) );
	if ( ! M || ! config.endpoint || ! blocks().length ) {
		return;
	}

	function swap( el, html ) {
		const tpl = document.createElement( 'template' );
		tpl.innerHTML = html.trim(); // Same-origin HTML, rendered and escaped by the server.
		const next = tpl.content.firstElementChild;
		if ( ! next ) {
			return;
		}
		// reveal.js only watched the original nodes: show swapped-in content straight away.
		[ next ].concat( Array.prototype.slice.call( next.querySelectorAll( '.reveal' ) ) ).forEach( function ( node ) {
			if ( node.classList.contains( 'reveal' ) ) {
				node.classList.add( 'is-visible' );
			}
		} );
		el.replaceWith( next );
		if ( window.ecmConsent && window.ecmConsent.scan ) {
			window.ecmConsent.scan( next );
		}
	}

	function check() {
		const first = blocks()[ 0 ];
		if ( ! first ) {
			return;
		}
		const url = config.endpoint + ( config.endpoint.indexOf( '?' ) === -1 ? '?' : '&' ) + 'post=' + encodeURIComponent( first.dataset.livePost || '0' );
		fetch( url, { cache: 'no-store', credentials: 'omit' } )
			.then( function ( res ) {
				return res.ok ? res.json() : null;
			} )
			.then( function ( json ) {
				const next = M.parse( json );
				if ( ! M.needsSwap( first.dataset.liveState, next ) ) {
					return;
				}
				blocks().forEach( function ( el ) {
					const html = next.blocks[ el.dataset.liveBlock ];
					if ( typeof html === 'string' ) {
						swap( el, html );
					}
				} );
			} )
			.catch( function () {} );
	}

	check();
	window.setInterval( function () {
		if ( ! document.hidden ) {
			check();
		}
	}, 60000 );
} )();
```

In `elevation-core.php`, add `require_once ELEVATION_CORE_DIR . 'includes/live.php';` after the `includes/youtube-render.php` line.

- [ ] **Step 4: The three blocks**

Create `src/blocks/watch-hero/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/watch-hero",
  "title": "Watch: page hero",
  "category": "widgets",
  "icon": "video-alt3",
  "description": "The Watch page hero. It says “We're live right now” while the church is streaming.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "viewScript": "elevation-live-status",
  "render": "file:./render.php"
}
```

Create `src/blocks/live-player/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/live-player",
  "title": "Watch: live player",
  "category": "widgets",
  "icon": "controls-play",
  "description": "While streaming: the live player (loads after consent). With a stream scheduled: the “Next stream” strip. Otherwise nothing.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "viewScript": "elevation-live-status",
  "render": "file:./render.php"
}
```

Create `src/blocks/home-watch/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/home-watch",
  "title": "Home: watch",
  "category": "widgets",
  "icon": "video-alt3",
  "description": "While streaming, the live stream; otherwise the latest YouTube video. The blocks inside show when there is neither.",
  "supports": { "html": false, "multiple": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "viewScript": "elevation-live-status",
  "render": "file:./render.php"
}
```

Create `src/blocks/watch-hero/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="video-alt3" label="Watch: page hero" instructions="“Watch & grow”, or “We're live right now” while the church is streaming on YouTube." />
		</div>
	),
} );
```

Create `src/blocks/live-player/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="controls-play" label="Watch: live player" instructions="Shows the live stream, or the next scheduled stream, from YouTube. Hidden otherwise." />
		</div>
	),
} );
```

Create `src/blocks/home-watch/index.js`:

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
					While streaming, visitors see the live stream; otherwise the latest YouTube video. With neither, they see this:
				</p>
				<div { ...innerProps } />
			</div>
		);
	},
	save: () => <InnerBlocks.Content />,
} );
```

Create `src/blocks/watch-hero/render.php`. The copy is verbatim from inventory §1 Watch.

```php
<?php
/** Watch page hero: "Watch & grow", or "We're live right now" while streaming. */
defined( 'ABSPATH' ) || exit;

$elevation_state = elevation_youtube_live()['state'];
$elevation_live  = 'live' === $elevation_state;
?>
<section <?php echo get_block_wrapper_attributes( elevation_live_attrs( 'elevation/watch-hero', $elevation_state, [ 'class' => 'alignfull is-style-page-hero has-white-color has-ink-background-color has-text-color has-background watch-hero has-global-padding' ] ) ); ?>>
	<div class="ecm-section__inner">
		<p class="is-style-eyebrow-on-ink"><?php esc_html_e( 'Messages', 'elevation-core' ); ?></p>
		<h1 class="wp-block-heading has-white-color has-text-color"><?php echo $elevation_live ? esc_html__( "We're live right now", 'elevation-core' ) : esc_html__( 'Watch & grow', 'elevation-core' ); ?></h1>
		<p class="is-style-lead-on-ink"><?php echo $elevation_live
			? esc_html__( 'Join the service from wherever you are.', 'elevation-core' )
			: esc_html__( "Catch this week's message or dig into the archive. Live every {service.day} at {service.startTime}.", 'elevation-core' ); ?></p>
	</div>
</section>
```

Create `src/blocks/live-player/render.php`. The copy is verbatim from inventory §2 `live-player.tsx`.

```php
<?php
/**
 * The live stream (inside the consent gate) or the next scheduled one. With neither it renders an empty,
 * hidden marker so the live swap has something to replace.
 */
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

$elevation_live  = elevation_youtube_live();
$elevation_state = $elevation_live['state'];
$elevation_video = $elevation_live['video'];

if ( 'none' === $elevation_state || ! $elevation_video ) {
	echo '<div ' . get_block_wrapper_attributes( elevation_live_attrs( 'elevation/live-player', 'none', [ 'hidden' => 'hidden' ] ) ) . '></div>';
	return;
}
?>
<section <?php echo get_block_wrapper_attributes( elevation_live_attrs( 'elevation/live-player', $elevation_state, [ 'class' => 'alignfull ecm-section is-active has-global-padding' ] ) ); ?>>
	<div class="ecm-section__inner">
		<?php if ( 'live' === $elevation_state ) : ?>
			<div class="live-player">
				<div class="live-player__video">
					<?php echo render_block( [ 'blockName' => 'elevation/embed-gate', 'attrs' => [ 'kind' => 'video', 'src' => YouTube::embedUrl( $elevation_video['id'] ), 'title' => __( 'Watch the stream', 'elevation-core' ), 'link' => $elevation_video['url'] ], 'innerBlocks' => [], 'innerHTML' => '', 'innerContent' => [] ] ); // Escaped by the gate. ?>
				</div>
				<div class="live-player__text">
					<?php echo elevation_live_badge(); // Escaped inside. ?>
					<h2 class="wp-block-heading"><?php echo esc_html( $elevation_video['title'] ); ?></h2>
					<p><?php esc_html_e( "We're streaming right now — come and join us.", 'elevation-core' ); ?></p>
					<div class="wp-block-buttons">
						<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'Watch on YouTube', 'elevation-core' ); ?></a></div>
						<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/im-new"><?php esc_html_e( 'Join us in person', 'elevation-core' ); ?></a></div>
					</div>
				</div>
			</div>
		<?php else : ?>
			<div class="upcoming-stream">
				<div>
					<p class="is-style-eyebrow"><?php esc_html_e( 'Next stream', 'elevation-core' ); ?></p>
					<h2 class="wp-block-heading"><?php echo esc_html( $elevation_video['title'] ); ?></h2>
					<p class="upcoming-stream__when"><?php echo esc_html( YouTube::formatScheduled( $elevation_video['scheduledStart'] ) ); ?></p>
				</div>
				<div class="wp-block-buttons"><div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'Set a reminder', 'elevation-core' ); ?></a></div></div>
			</div>
		<?php endif; ?>
	</div>
</section>
```

Create `src/blocks/home-watch/render.php`. The copy is verbatim from inventory §2 `home-watch-section.tsx`.

```php
<?php
/**
 * Home watch section (spec §6.3): the live stream while streaming, else the latest finished video, else
 * the inner blocks (the Plan 2 "Missed a Sunday?" section). Everything links to YouTube. The tile image
 * is the site's own copy of the thumbnail, or the placeholder (spec §12).
 */
use Elevation\Core\Icons;
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

$elevation_live  = elevation_youtube_live();
$elevation_is_on = 'live' === $elevation_live['state'];
$elevation_video = $elevation_is_on ? $elevation_live['video'] : ( YouTube::past( elevation_youtube_feed()['videos'], 1 )[0] ?? null );

if ( ! $elevation_video ) {
	echo '<div ' . get_block_wrapper_attributes( elevation_live_attrs( 'elevation/home-watch', $elevation_live['state'] ) ) . '>' . $content . '</div>';
	return;
}
$elevation_thumb = elevation_youtube_thumb_url( $elevation_video['id'] );
$elevation_cta   = $elevation_is_on ? __( 'Watch live', 'elevation-core' ) : __( 'Watch now', 'elevation-core' );
?>
<div <?php echo get_block_wrapper_attributes( elevation_live_attrs( 'elevation/home-watch', $elevation_live['state'], [ 'class' => 'split split--watch' ] ) ); ?>>
	<a class="watch-tile reveal" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener" aria-label="<?php echo esc_attr( $elevation_cta . ': ' . $elevation_video['title'] . ' ' . __( '(opens YouTube in a new tab)', 'elevation-core' ) ); ?>">
		<?php if ( '' !== $elevation_thumb ) : ?>
			<img class="watch-tile__image" src="<?php echo esc_url( $elevation_thumb ); ?>" alt="" loading="lazy" decoding="async">
		<?php endif; ?>
		<span class="watch-tile__badge"><?php echo $elevation_is_on ? elevation_live_badge() : '<span class="watch-tile__chip">' . esc_html__( 'Latest message', 'elevation-core' ) . '</span>'; // Escaped. ?></span>
		<span class="watch-tile__play wp-block-elevation-icon" style="--icon-size:30px"><?php echo Icons::svg( 'play', 'is-filled' ); ?></span>
	</a>
	<div class="watch-intro reveal">
		<p class="is-style-eyebrow"><?php echo $elevation_is_on ? esc_html__( 'On air now', 'elevation-core' ) : esc_html__( 'Messages', 'elevation-core' ); ?></p>
		<h2 class="wp-block-heading"><?php echo esc_html( $elevation_video['title'] ); ?></h2>
		<p><?php echo $elevation_is_on
			? esc_html__( "We're streaming right now — join us from wherever you are.", 'elevation-core' )
			: esc_html__( "Full services and recent messages go up on our YouTube channel. Subscribe and you'll know the moment a new one lands.", 'elevation-core' ); ?></p>
		<div class="wp-block-buttons">
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener"><?php echo esc_html( $elevation_cta ); ?></a></div>
			<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/watch"><?php esc_html_e( 'All messages', 'elevation-core' ); ?></a></div>
		</div>
	</div>
</div>
```

- [ ] **Step 5: Styles**

Append to `youtube.css`:

```css
/* ---------- Watch hero, live player and next stream (redesign live-player.tsx) ---------- */
.watch-hero { padding-top: 70px; padding-bottom: 60px; margin-block: 0 !important; }
.watch-hero .ecm-section__inner > * + * { margin-top: 12px; }
.watch-hero .is-style-lead-on-ink { max-width: 560px; }
.live-player { display: grid; gap: 48px; align-items: center; }
@media (min-width: 1024px) { .live-player { grid-template-columns: 1.3fr 1fr; } }
.live-player__video .wp-block-elevation-embed-gate { border-radius: 18px; overflow: hidden; box-shadow: var(--wp--preset--shadow--card-lg); }
.live-player__text > * { margin: 0; }
.live-player__text h2 { margin-top: 16px; font-size: 34px; text-wrap: balance; }
.live-player__text p { margin-top: 12px; color: var(--wp--preset--color--grey-500); }
.live-player__text .wp-block-buttons { gap: 12px; margin-top: 24px; }
.upcoming-stream { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; padding: 28px; border: 1px solid rgb(132 194 36 / 0.4); border-radius: 18px; background: var(--wp--preset--color--green-100); }
@media (min-width: 640px) { .upcoming-stream { flex-direction: row; align-items: center; justify-content: space-between; } }
.upcoming-stream h2 { margin: 8px 0 0; font-size: 24px; }
.upcoming-stream > div > p { margin: 0; }
.upcoming-stream__when { margin-top: 8px !important; font-size: 14px; color: var(--wp--preset--color--grey-500); }

/* ---------- Home watch tile (block version of the Plan 2 group; .watch-tile/.watch-intro are in site.css) ---------- */
a.watch-tile { color: inherit; text-decoration: none; }
a.watch-tile:focus-visible { outline: 2px solid var(--wp--preset--color--green-700); outline-offset: 4px; }
.watch-tile > .watch-tile__image { position: absolute !important; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; }
.watch-tile > .watch-tile__badge { position: absolute !important; top: 16px; left: 16px; z-index: 2; }
.watch-tile__badge .watch-tile__chip { display: inline-block; padding: 6px 12px; border-radius: 8px; background: rgb(14 14 44 / 0.7); backdrop-filter: blur(12px); color: #fff; font-family: var(--wp--preset--font-family--sora); font-size: 12px; font-weight: 600; }
a.watch-tile .watch-tile__play { display: grid; place-items: center; }
a.watch-tile:hover .watch-tile__play { background: var(--wp--preset--color--green); }
@media (prefers-reduced-motion: no-preference) { a.watch-tile:hover .watch-tile__play { transform: scale(1.08); } }
```

- [ ] **Step 6: The Watch and Home seeds**

In `seed/pages/watch.html`, replace the page-hero group with the two lines below. The group runs from the first `<!-- wp:group {… "className":"is-style-page-hero" …} -->` to its `<!-- /wp:group -->`. Afterwards the page runs watch-hero, live-player, recent-videos, then the CTA band.

```html
<!-- wp:elevation/watch-hero /-->

<!-- wp:elevation/live-player /-->
```

In `seed/pages/home.html`, find the grey watch section and wrap its content in the new block:
- Insert `<!-- wp:elevation/home-watch -->` on its own line, directly before `<!-- wp:group {"className":"split split--watch","layout":{"type":"default"}} -->`.
- The section currently ends:

```
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
```

  Change the ending to:

```
<!-- /wp:group --></div>
<!-- /wp:group -->
<!-- /wp:elevation/home-watch --></section>
<!-- /wp:group -->
```

`grep -n "home-watch" seed/pages/home.html` must print exactly two lines, both inside the grey section.

- [ ] **Step 7: Build, seed and check each state and the swap (Review Focus 2, 3 and 5)**

Run: `docker compose run --rm node npm run build`, then `./bin/seed.sh 2>&1 | grep -E "page (home|watch)|Seed complete"`.
Expected: both pages report `Updated`, then `Seed complete.`

Check the real state:

```bash
wp() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
curl -s http://localhost:8080/watch/ | grep -oE 'Watch &amp; grow|We&#039;re live right now|data-live-state="[a-z]+"|Next stream|live-badge' | sort | uniq -c
curl -s http://localhost:8080/ | grep -oE 'Latest message|On air now|data-live-block="elevation/home-watch"|Missed a|uploads/elevation-youtube/[A-Za-z0-9_-]{11}\.jpg|i\.ytimg' | sort | uniq -c
watch=$(wp post list --post_type=page --name=watch --field=ID | tr -d '\r')
curl -sI "http://localhost:8080/wp-json/elevation/v1/live?post=$watch" | grep -i '^cache-control'
curl -s "http://localhost:8080/wp-json/elevation/v1/live?post=999999"; echo
```

Expected with the key set:
- Watch shows whatever the channel is doing. Usually that's `data-live-state="none"` and "Watch &amp; grow".
- Home shows "Latest message", the home-watch wrapper and a local thumbnail, with no "Missed a" and no `i.ytimg`.

Expected without the key: Watch shows "Watch &amp; grow", and Home shows the "Missed a" fallback inside the wrapper.

Either way:
- The cache header line is `Cache-Control: no-store, max-age=0`.
- The unknown post returns `{"state":"…","blocks":{}}`.

Next, check the live and upcoming rendering and the swap. If the channel isn't live, write a crafted feed into the 60s feed transient for the check only, then clear it at the end. It isn't seeded, and it expires by itself. If the channel is really live or upcoming now, skip the crafted feed and use the real one.

```bash
wp() { docker compose run --rm -T wpcli wp --user=admin "$@"; }
feed() { wp eval "set_transient( 'elevation_yt_feed', [ 'status' => 'ok', 'videos' => [ [ 'id' => 'aaaaaaaaaaa', 'title' => 'LIVE <script>alert(1)</script> & \"now\"', 'description' => '', 'publishedAt' => gmdate( 'Y-m-d\TH:i:s\Z' ), 'thumbnail' => '', 'durationSecs' => 0, 'live' => '$1', 'scheduledStart' => '$2', 'url' => 'https://www.youtube.com/watch?v=aaaaaaaaaaa' ] ] ], 600 );"; }
feed upcoming 2026-12-06T10:30:00Z
curl -s http://localhost:8080/watch/ | grep -oE 'Next stream|Sunday 6 December, 10:30|Set a reminder|data-live-state="upcoming"' | sort | uniq -c
feed live ''
curl -s http://localhost:8080/watch/ | grep -oE 'We&#039;re live right now|live-badge|data-ecm-embed="video"|youtube-nocookie\.com/embed/aaaaaaaaaaa|LIVE &lt;script&gt;alert\(1\)&lt;/script&gt; &amp; &quot;now&quot;|<script>alert' | sort | uniq -c
curl -s "http://localhost:8080/wp-json/elevation/v1/live?post=$(wp post list --post_type=page --name=watch --field=ID | tr -d '\r')" | grep -oE '"state":"live"|LIVE &lt;script&gt;alert\(1\)&lt;\\/script&gt;|<script>alert' | sort | uniq -c
wp eval 'elevation_youtube_flush();'
```

The site reads the transient only when a key is configured. If the local `.env` key is unset, the web requests show the unconfigured fallback instead. In that case, run the same `feed …` checks by rendering the blocks inside one `wp eval`, with `add_filter( 'elevation_youtube_api_key', fn () => 'x', 99 );` and `echo render_block( [ 'blockName' => 'elevation/live-player', 'attrs' => [], 'innerBlocks' => [], 'innerHTML' => '', 'innerContent' => [] ] );`. Do the same for `elevation/watch-hero`. Say in the report that you did this.

Expected:
- **Upcoming:** "Next stream", "Sunday 6 December, 10:30", "Set a reminder" and `data-live-state="upcoming"`.
- **Live:** the live heading and the badge; the gate, with the nocookie URL only inside its `<template>`; the escaped title, and no `<script>alert`.
- **REST:** `"state":"live"` with the escaped title and no raw script.

The final command restores the real feed.

Check the swap in the browser pane. This needs the local key; without it, record the check as deferred.
1. Open `http://localhost:8080/watch/` showing the real state, and note the H1, "Watch & grow".
2. Run `feed live ''` from the block above.
3. Within 65 seconds (use `computer` wait, then re-read the page), expect all of these:
   - the H1 becomes "We're live right now";
   - the live player appears;
   - "Recent messages" turns grey.
4. Click "Play the video" in the swapped player. It loads, which shows that `ecmConsent.scan` enabled the button.
5. Before that click, the network list must show no request to `youtube-nocookie.com`, `youtube.com`, `i.ytimg.com`, `googleapis.com` or `gstatic.com`, apart from `/wp-json/elevation/v1/live`.
6. Repeat on `/`: the tile swaps to "On air now".
7. Run `wp eval 'elevation_youtube_flush();'`. Within a minute, both pages swap back to the real state.
8. `read_console_messages` shows no errors.

Then:
- Open `/?elevation-validate-blocks=1`. Expected: no problems.
- Run `./bin/check-tokens.sh / /watch/`. Expected: no raw tokens.

- [ ] **Step 8: Run the tests and commit**

Run:
- `docker compose run --rm php vendor/bin/phpunit`
- `docker compose run --rm node npm run test:js`
- `./bin/check-urls.sh`

Expected: `OK`, `# fail 0`, then `All URLs as expected.`

```bash
git add wp-content/plugins/elevation-core wp-content/themes/elevation/assets/css/youtube.css seed/pages/watch.html seed/pages/home.html
git commit -m "Live status: Watch hero, live player and Home watch from the YouTube channel, swapped via an uncacheable REST endpoint

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Rebuild from nothing, consent sweep and docs

**Files:**
- Modify: `README.md`, `docs/superpowers/plans/2026-09-28-roadmap.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the Plan 4 hand-offs.

- [ ] **Step 1: Rebuild from nothing, twice**

Put the logs in the session scratchpad. Both rebuilds must run on the same London day.

```bash
S=<scratchpad>
hash() { docker compose run --rm -T wpcli wp eval 'foreach ( get_posts( [ "post_type" => [ "page", "event" ], "posts_per_page" => -1, "orderby" => "name", "order" => "ASC" ] ) as $p ) echo $p->post_type, " ", $p->post_name, " ", sha1( $p->post_content . get_post_meta( $p->ID, "event_start", true ) . get_post_meta( $p->ID, "event_end", true ) ), "\n";'; }
docker compose down -v && ./bin/setup.sh > "$S/rebuild-1.log" 2>&1; grep -c "Seed complete." "$S/rebuild-1.log"; hash > "$S/hash-1.txt"
docker compose down -v && ./bin/setup.sh > "$S/rebuild-2.log" 2>&1; grep -c "Seed complete." "$S/rebuild-2.log"; hash > "$S/hash-2.txt"
diff "$S/hash-1.txt" "$S/hash-2.txt" && wc -l < "$S/hash-1.txt"
```

Expected:
- each `grep -c` prints `1`;
- `diff` prints nothing;
- the count is `21` (14 pages and 7 events).

Nothing from YouTube is stored in the database.

After the second rebuild:
- `./bin/check-urls.sh` passes.
- `./bin/check-tokens.sh / /watch/` finds no raw tokens.
- The validator reports no problems.
- If the key is set, `/watch/` shows the real videos. A fresh install wipes the uploads contents, and the thumbnail copies return on the first page view.
- Run `docker compose exec -T wordpress sh -c 'test -s /var/www/html/wp-content/debug.log && tail -20 /var/www/html/wp-content/debug.log || echo "debug.log empty"'`. Expected: `debug.log empty`. If there are older lines, explain them, then truncate the log and re-check.

- [ ] **Step 2: Consent sweep (spec §12)**

In the browser pane, clear site data for `localhost:8080`, so no consent choice is stored. For each of `/`, `/watch/` and `/events/`:
1. Load the page fresh.
2. Wait 5 seconds.
3. Read the network list.

There must be no request to any host containing `google`, `youtube`, `ytimg`, `gstatic` or `doubleclick`. Thumbnails come from `localhost:8080/wp-content/uploads/elevation-youtube/`.

Then:
- Press "Reject all" and reload `/watch/`. There should still be no such request.
- Click a video card. It opens YouTube in a new tab. That is the visitor's own navigation, and it's expected.

- [ ] **Step 3: README**

In `README.md`, add after the "## Seeding" section:

```markdown
## YouTube

- Watch and Home show the church's YouTube channel (Settings → Church → YouTube): the latest videos, which open on YouTube, and the live stream while streaming. Nothing from YouTube is stored in WordPress.
- Locally, put a YouTube Data API v3 key in `.env` as `YOUTUBE_API_KEY=` and run `docker compose up -d`; the local site then shows the real channel. Without a key you see the "Watch on YouTube" panel. On live, the key goes in Settings → Church.
- Settings → Church shows whether YouTube is working (or the last error) and has "Check YouTube now".
- Thumbnails are copied into `wp-content/uploads/elevation-youtube/` so visitors' browsers never contact YouTube before they consent.
```

- [ ] **Step 4: Roadmap**

Make these changes in `docs/superpowers/plans/2026-09-28-roadmap.md`:
- Change row 4's status to ``done: `2026-09-29-plan-4-youtube-feed.md` ``.
- In "Hand-offs from Plan 2", begin the Plan 4 bullet with "**Plan 4 (YouTube feed and live):** done."
- In "Hand-offs from Plan 3", begin the Plan 4 bullet with "done:".
- Add this section at the end:

```markdown
## Hand-offs from Plan 4

- **Plan 5 (Forms etc.):** `window.ecmConsent.scan(root)` wires up embed gates inserted after load; use it if a form injects a map or video.
- **Plan 6 (Go-live):**
  - Enter the YouTube API key in Settings → Church after the restore, press "Check YouTube now", and confirm it says "Working".
  - The package already excludes `mu-plugins/local-dev.php`, which holds the local `.env` key fallback. `uploads/elevation-youtube/` may be excluded too; it refills on the first page view.
  - Restrict the API key in Google Cloud to the YouTube Data API. It is used only server-side, so it doesn't need an HTTP referrer restriction.
  - The §12 sweep covers Watch against the real channel, the live swap during a real Sunday stream, and the consent network check.
  - Editing guide: explain the YouTube box in Settings → Church (what "Working" and each error mean, and "Check YouTube now"), and that videos appear by themselves and open on YouTube.
```

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/plans/2026-09-28-roadmap.md
git commit -m "Plan 4 verified: rebuilds, consent sweep, README YouTube, roadmap hand-offs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
