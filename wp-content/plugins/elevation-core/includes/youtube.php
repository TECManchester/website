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
const ELEVATION_YT_LAST_GOOD = 'elevation_yt_last_good';
const ELEVATION_YT_THUMBS  = 15; // live/upcoming + 12 on Watch + 1 on Home, with room to spare.

function elevation_youtube_key(): string {
	return trim( (string) apply_filters( 'elevation_youtube_api_key', (string) elevation_setting( 'youtube.apiKey' ) ) );
}

/** GET a Data API URL as an array; on failure null, with a plain-words reason in $error (never the key). */
function elevation_youtube_request( string $endpoint, string $url, ?string &$error ): ?array {
	$response = wp_remote_get( $url, [ 'timeout' => 5, 'headers' => [ 'Accept' => 'application/json' ] ] );
	if ( is_wp_error( $response ) ) {
		$error = "YouTube didn't answer. It tries again by itself in a minute. (YouTube $endpoint request failed: " . $response->get_error_code() . ')';
	} elseif ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
		$reason    = YouTube::errorReason( wp_remote_retrieve_body( $response ) );
		$technical = sprintf( 'YouTube %s request failed: HTTP %d%s', $endpoint, (int) wp_remote_retrieve_response_code( $response ), '' !== $reason ? " ($reason)" : '' );
		$advice    = YouTube::errorAdvice( $reason );
		$error     = '' !== $advice ? "$advice ($technical)" : $technical;
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

/**
 * The 60s-cached feed. A failed fetch keeps serving the last good feed if it is under an hour old, so one
 * timeout during a live service doesn't blank the pages; the status still records the failure.
 *
 * @return array{status:string, videos:list<array>}
 */
function elevation_youtube_feed( bool $force_thumbs = false ): array {
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
	if ( 'ok' === $feed['status'] ) {
		update_option( ELEVATION_YT_LAST_GOOD, [ 'time' => time(), 'videos' => $feed['videos'] ], false );
	} else {
		$good = get_option( ELEVATION_YT_LAST_GOOD );
		if ( is_array( $good ) && is_array( $good['videos'] ?? null ) && time() - (int) ( $good['time'] ?? 0 ) < HOUR_IN_SECONDS ) {
			$feed['videos'] = $good['videos'];
		}
	}
	set_transient( ELEVATION_YT_FEED, $feed, MINUTE_IN_SECONDS );
	update_option( ELEVATION_YT_STATUS, [
		'state'   => 'ok' === $feed['status'] ? 'ok' : 'failed',
		'time'    => time(),
		'message' => 'ok' === $feed['status'] ? sprintf( '%d videos', count( $feed['videos'] ) ) : (string) $error,
	], false );
	if ( 'ok' === $feed['status'] ) {
		elevation_youtube_cache_thumbnails( $feed['videos'], $force_thumbs );
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
			$error ??= 'YouTube has no channel with the handle in Settings → Church.';
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
	$next = YouTube::nextUpcoming( $videos, new DateTimeImmutable( 'now' ) );
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

// A new key or channel handle takes effect straight away, and a replaced key doesn't show the old status.
add_action( 'update_option_elevation_settings', function () {
	elevation_youtube_flush();
	delete_option( ELEVATION_YT_STATUS );
} );

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

/** Whether an existing copy is due a refresh: forced, live/upcoming >10 min old, published <48h ago and >1h old, or >24h old. */
function elevation_youtube_thumb_stale( array $video, int $age, bool $force ): bool {
	if ( $force || $age > DAY_IN_SECONDS ) {
		return true;
	}
	if ( in_array( $video['live'] ?? 'none', [ 'live', 'upcoming' ], true ) ) {
		return $age > 10 * MINUTE_IN_SECONDS;
	}
	$published = strtotime( (string) ( $video['publishedAt'] ?? '' ) );
	return false !== $published && time() - $published < 2 * DAY_IN_SECONDS && $age > HOUR_IN_SECONDS;
}

/** Copy missing or stale thumbnails for the videos the site shows; delete copies no longer in the feed. */
function elevation_youtube_cache_thumbnails( array $videos, bool $force = false ): void {
	$dir = elevation_youtube_thumb_dir();
	if ( get_transient( 'elevation_yt_thumbs_lock' ) || ! wp_mkdir_p( $dir['path'] ) ) {
		return;
	}
	set_transient( 'elevation_yt_thumbs_lock', 1, 120 );
	try {
		$shown = array_merge( array_filter( [ YouTube::liveNow( $videos ), YouTube::nextUpcoming( $videos, new DateTimeImmutable( 'now' ) ) ] ), YouTube::past( $videos, 13 ) );
		$keep  = [];
		foreach ( array_slice( $shown, 0, ELEVATION_YT_THUMBS ) as $video ) {
			$file   = "{$dir['path']}/{$video['id']}.jpg";
			$keep[] = basename( $file );
			if ( '' === $video['thumbnail'] ) {
				continue;
			}
			if ( is_file( $file ) && ! elevation_youtube_thumb_stale( $video, max( 0, time() - (int) filemtime( $file ) ), $force ) ) {
				continue;
			}
			// No redirects: a copy must come from i.ytimg.com itself. A redirect is a failed copy (placeholder).
			$response = wp_safe_remote_get( $video['thumbnail'], [ 'timeout' => 4, 'redirection' => 0, 'limit_response_size' => 2 * MB_IN_BYTES ] );
			$body     = is_wp_error( $response ) ? '' : (string) wp_remote_retrieve_body( $response );
			$size     = '' !== $body && 200 === (int) wp_remote_retrieve_response_code( $response ) ? @getimagesizefromstring( $body ) : false; // phpcs:ignore WordPress.PHP.NoSilencedErrors
			if ( is_array( $size ) && IMAGETYPE_JPEG === $size[2] ) {
				// Write beside the target and rename, so a failed re-copy keeps the old file.
				$tmp = $file . '.tmp';
				if ( false !== file_put_contents( $tmp, $body ) && rename( $tmp, $file ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions
					continue;
				}
				wp_delete_file( $tmp );
			}
		}
		foreach ( glob( "{$dir['path']}/*.jpg" ) ?: [] as $file ) {
			if ( preg_match( '/^[A-Za-z0-9_-]{11}\.jpg$/', basename( $file ) ) && ! in_array( basename( $file ), $keep, true ) ) {
				wp_delete_file( $file );
			}
		}
	} finally {
		delete_transient( 'elevation_yt_thumbs_lock' );
	}
}

/* ---------- Settings → Church: status and "Check YouTube now" ---------- */

function elevation_youtube_status_html(): string {
	$s     = elevation_youtube_status();
	if ( 'failed' === $s['state'] && ! str_ends_with( $s['message'], '.' ) ) {
		$s['message'] .= '.';
	}
	$when  = $s['time'] ? sprintf( /* translators: %s: time ago */ __( '%s ago', 'elevation-core' ), human_time_diff( $s['time'] ) ) : '';
	$text  = match ( $s['state'] ) {
		'unconfigured' => __( 'No API key yet. Until one is added, Watch shows a link to the channel.', 'elevation-core' ),
		'ok'           => sprintf( /* translators: 1: when, 2: "N videos" */ __( 'Working. Last checked %1$s: %2$s found.', 'elevation-core' ), $when, $s['message'] ),
		'failed'       => sprintf( /* translators: 1: when, 2: error */ __( 'Not working. Last tried %1$s: %2$s Until it works, Watch shows a link to the channel.', 'elevation-core' ), $when, $s['message'] ),
		default        => __( 'Not checked yet. It checks by itself when someone opens Watch or Home.', 'elevation-core' ),
	};
	if ( isset( $_GET['elevation_youtube_checked'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification -- display only.
		$text = __( 'Checked just now.', 'elevation-core' ) . ' ' . $text;
	}
	$class = 'failed' === $s['state'] ? 'notice-error' : ( 'ok' === $s['state'] ? 'notice-success' : 'notice-info' );
	$env   = '' === (string) elevation_setting( 'youtube.apiKey' ) && '' !== elevation_youtube_key() ? ' ' . __( '(Using the key from this computer’s local settings.)', 'elevation-core' ) : '';
	return sprintf(
		'<div class="notice inline %s"><p><strong>%s</strong> %s%s</p></div>',
		esc_attr( $class ),
		esc_html__( 'YouTube:', 'elevation-core' ),
		esc_html( $text ),
		esc_html( $env )
	);
}

/** Flush, refetch with fresh thumbnails, and record the result. Used by both check paths. */
function elevation_youtube_check_now(): void {
	elevation_youtube_flush();
	delete_option( ELEVATION_YT_STATUS );
	elevation_settings( true ); // The key may have just been saved in this request.
	elevation_youtube_feed( true );
}

/**
 * "Save and check YouTube": a submit button in the settings form. options.php has verified the nonce and
 * saved by the time it redirects, so the check rides that redirect. Only for that button, that page, that capability.
 */
add_filter( 'wp_redirect', function ( $location ) {
	if ( isset( $_POST['elevation_youtube_check'], $_POST['option_page'] ) // phpcs:ignore WordPress.Security.NonceVerification -- options.php checked it.
		&& 'elevation-church' === $_POST['option_page'] // phpcs:ignore WordPress.Security.NonceVerification
		&& isset( $GLOBALS['pagenow'] ) && 'options.php' === $GLOBALS['pagenow']
		&& current_user_can( 'manage_church_settings' ) ) {
		elevation_youtube_check_now();
		$location = add_query_arg( 'elevation_youtube_checked', '1', (string) $location );
	}
	return $location;
} );

// Kept for bookmarks; the settings page no longer links to it.
add_action( 'admin_post_elevation_youtube_check', function () {
	if ( ! current_user_can( 'manage_church_settings' ) ) {
		wp_die( esc_html__( 'You are not allowed to do that.', 'elevation-core' ), 403 );
	}
	check_admin_referer( 'elevation_youtube_check' );
	elevation_youtube_check_now();
	wp_safe_redirect( add_query_arg( 'elevation_youtube_checked', '1', wp_get_referer() ?: admin_url( 'options-general.php?page=elevation-church' ) ) . '#elevation-youtube' );
	exit;
} );

/** YouTube text is never token-replaced: "{service.day}" in a title shows as typed. Escapes, then defuses "{". */
function elevation_youtube_text( string $s ): string {
	return str_replace( '{', '&#123;', esc_html( $s ) );
}
