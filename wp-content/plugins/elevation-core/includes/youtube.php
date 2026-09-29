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
	$shown = array_merge( array_filter( [ YouTube::liveNow( $videos ), YouTube::nextUpcoming( $videos, new DateTimeImmutable( 'now' ) ) ] ), YouTube::past( $videos, 13 ) );
	$keep  = [];
	foreach ( array_slice( $shown, 0, ELEVATION_YT_THUMBS ) as $video ) {
		$file   = "{$dir['path']}/{$video['id']}.jpg";
		$keep[] = basename( $file );
		if ( is_file( $file ) || '' === $video['thumbnail'] ) {
			continue;
		}
		// No redirects: a copy must come from i.ytimg.com itself. A redirect is a failed copy (placeholder).
		$response = wp_safe_remote_get( $video['thumbnail'], [ 'timeout' => 4, 'redirection' => 0, 'limit_response_size' => 2 * MB_IN_BYTES ] );
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
