<?php
use Elevation\Core\MediaRefs;
use Elevation\Core\SeedGuard;
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Create or update a post from a seed file, without overwriting hand edits.
 *
 * ## OPTIONS
 * <post_type>
 * : Post type, e.g. page or wp_navigation.
 * <slug>
 * : Post slug (name).
 * <file>
 * : Path to a file of block markup.
 * --title=<title>
 * : Post title.
 * [--parent=<parent>]
 * : Slug of the parent page (pages only).
 * [--force]
 * : Overwrite even if the post was edited by hand.
 * [--meta-description=<text>]
 * : SmartCrawl meta description (tokens allowed). Written on create/update, or when empty.
 * [--seo-title=<text>]
 * : SmartCrawl title format for this page, e.g. "%%sitename%% %%sep%% %%sitedesc%%".
 */
WP_CLI::add_command( 'elevation seed', function ( array $args, array $assoc ) {
	[ $type, $slug, $file ] = $args;
	if ( ! is_readable( $file ) ) {
		WP_CLI::error( "Seed file not readable: $file" );
	}
	$content = (string) file_get_contents( $file );
	try {
		$content = MediaRefs::replace( $content, 'elevation_seed_media_lookup' );
	} catch ( \RuntimeException $e ) {
		WP_CLI::error( $e->getMessage() );
	}

	$parent_id = 0;
	if ( ! empty( $assoc['parent'] ) ) {
		$parent = get_page_by_path( $assoc['parent'], OBJECT, $type );
		if ( ! $parent ) {
			WP_CLI::error( "Parent '{$assoc['parent']}' not found; seed it first." );
		}
		$parent_id = $parent->ID;
	}

	$existing = get_posts( [
		'post_type'      => $type,
		'name'           => $slug,
		'post_parent'    => $parent_id,
		'post_status'    => 'any',
		'posts_per_page' => 1,
	] );
	$post     = $existing[0] ?? null;
	$stored   = $post ? ( get_post_meta( $post->ID, '_elevation_seed_hash', true ) ?: null ) : null;
	$decision = SeedGuard::decide( $stored, $post?->post_content, $content, isset( $assoc['force'] ) );

	if ( SeedGuard::SKIP === $decision ) {
		WP_CLI::warning( "Skipped $type $slug: edited since it was seeded (use SEED_FORCE=\"$slug\" to overwrite)." );
		return;
	}
	if ( SeedGuard::UNCHANGED === $decision ) {
		update_post_meta( $post->ID, '_elevation_seed_hash', SeedGuard::hash( $content ) );
		elevation_seed_meta( $post->ID, $assoc, false );
		WP_CLI::log( "Unchanged $type $slug" );
		return;
	}

	kses_remove_filters(); // Seed files are trusted theme content (SVG, HTML blocks).
	$data = [
		'post_type'    => $type,
		'post_name'    => $slug,
		'post_title'   => $assoc['title'],
		'post_content' => wp_slash( $content ),
		'post_status'  => 'publish',
		'post_parent'  => $parent_id,
	];
	if ( $post ) {
		$data['ID'] = $post->ID;
	}
	$id = wp_insert_post( $data, true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::error( $id->get_error_message() );
	}
	update_post_meta( $id, '_elevation_seed_hash', SeedGuard::hash( (string) get_post( $id )->post_content ) );
	elevation_seed_meta( $id, $assoc, true );
	kses_init_filters();
	WP_CLI::log( ( SeedGuard::CREATE === $decision ? 'Created' : 'Updated' ) . " $type $slug (#$id)" );
} );

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
