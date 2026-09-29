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

	public function test_invalid_dates_do_not_throw(): void {
		// Invalid dates that pass the regex but fail on parsing or round-trip
		$v = YouTube::videos( [ 'items' => [ self::video( 'aaaaaaaaaaa', [ 'publishedAt' => '2026-13-45T25:61:61Z' ] ) ] ], [ 'aaaaaaaaaaa' ] )[0];
		$this->assertSame( '', $v['publishedAt'], 'does not throw; invalid month/day/time rejected' );

		// Date that becomes a different date after parsing (Feb 31 → Mar 3)
		$this->assertSame( '', YouTube::displayDate( '2026-02-31T10:00:00Z' ), 'Feb 31 round-trip fails' );

		// Timezone offset too large
		$this->assertSame( '', YouTube::formatScheduled( '2026-10-04T09:30:00+99:99' ), 'invalid timezone offset rejected' );
	}

	public function test_next_upcoming_drops_old_scheduled(): void {
		$v = fn ( string $id, string $start ) => [ 'id' => $id, 'live' => 'upcoming', 'scheduledStart' => $start ];
		$list = [
			$v( 'too_old', '2026-10-11T09:30:00Z' ),   // 3.5 hours before $now
			$v( 'keep_this', '2026-10-11T10:30:00Z' ), // 2.5 hours before $now
			$v( 'future', '2026-10-11T14:00:00Z' ),     // in the future
		];
		$now = new \DateTimeImmutable( '2026-10-11T13:00:00Z', new \DateTimeZone( 'UTC' ) );
		$result = YouTube::nextUpcoming( $list, $now );
		$this->assertSame( 'keep_this', $result['id'], 'keeps scheduled within 3 hours, drops older' );

		// Without $now, all scheduled videos are considered
		$all_upcoming = YouTube::nextUpcoming( $list );
		$this->assertSame( 'too_old', $all_upcoming['id'], 'without $now, soonest is returned' );
	}

	public function test_thumbnail_look_alike_host_rejected(): void {
		$v = YouTube::videos( [ 'items' => [ self::video( 'aaaaaaaaaaa', [
			'thumbnails' => [ 'high' => [ 'url' => 'https://i.ytimg.com.evil.example/x.jpg', 'width' => 480 ] ],
		] ) ] ], [ 'aaaaaaaaaaa' ] )[0];
		$this->assertSame( '', $v['thumbnail'], 'look-alike host rejected' );
	}

	public function test_iso_with_timezone_offsets_crossing_midnight(): void {
		// Valid timestamp with negative offset that crosses midnight in UTC.
		// 2026-10-04T23:30:00-05:00 is 2026-10-05T04:30:00Z.
		$v = YouTube::videos( [ 'items' => [ self::video( 'aaaaaaaaaaa', [ 'publishedAt' => '2026-10-04T23:30:00-05:00' ] ) ] ], [ 'aaaaaaaaaaa' ] )[0];
		$this->assertSame( '2026-10-05T04:30:00Z', $v['publishedAt'], 'offset crossing midnight accepted' );

		// Valid timestamp with positive offset that crosses midnight backward in UTC.
		// 2026-10-05T00:30:00+01:00 is 2026-10-04T23:30:00Z, which in London (BST, +01:00) is 2026-10-05T00:30:00.
		// So the London date is 5 Oct 2026.
		$this->assertSame( '5 Oct 2026', YouTube::displayDate( '2026-10-05T00:30:00+01:00' ), 'positive offset in London date calculation' );
	}
}
