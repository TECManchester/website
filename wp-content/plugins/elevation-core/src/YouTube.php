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

	/** The soonest scheduled stream or premiere; one without a schedule doesn't count. If $now is given, drop any scheduled more than 3 hours in the past. */
	public static function nextUpcoming( array $videos, ?\DateTimeImmutable $now = null ): ?array {
		$upcoming = array_values( array_filter( $videos, static fn ( $v ) => 'upcoming' === ( $v['live'] ?? '' ) && '' !== ( $v['scheduledStart'] ?? '' ) ) );
		if ( null !== $now ) {
			$cutoff = $now->modify( '-3 hours' );
			$upcoming = array_values( array_filter( $upcoming, static fn ( $v ) => $v['scheduledStart'] >= $cutoff->format( 'Y-m-d\TH:i:s\Z' ) ) );
		}
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
		try {
			$dt = new DateTimeImmutable( $value );
			// Verify the date part survives: Y-m-d must equal input's first 10 characters after parsing in UTC.
			$utc = $dt->setTimezone( new DateTimeZone( 'UTC' ) );
			$parsed_date = $utc->format( 'Y-m-d' );
			$input_date  = substr( $value, 0, 10 );
			if ( $parsed_date !== $input_date ) {
				return '';
			}
			return $utc->format( 'Y-m-d\TH:i:s\Z' );
		} catch ( \Exception ) {
			return '';
		}
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
