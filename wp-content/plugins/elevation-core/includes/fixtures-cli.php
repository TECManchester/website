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
