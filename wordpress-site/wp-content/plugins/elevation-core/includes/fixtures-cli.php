<?php
/** Local-only sample content (spec §9): `wp elevation fixtures events|announcements <file>` and `wp elevation fixtures remove`. */
use Elevation\Core\Announcement;
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
		$ids = get_posts( [ 'post_type' => [ 'event', 'connect_group', 'announcement' ], 'post_status' => [ 'any', 'trash' ], 'meta_key' => '_elevation_fixture', 'fields' => 'ids', 'posts_per_page' => -1 ] );
		foreach ( $ids as $id ) {
			wp_delete_post( (int) $id, true );
		}
		// Old sample groups only: the church's real groups (seed/groups.json) carry no _elevation_fixture meta.
		$terms = 0;
		foreach ( [ 'group_area', 'group_category' ] as $taxonomy ) {
			$found = get_terms( [ 'taxonomy' => $taxonomy, 'hide_empty' => false, 'meta_key' => '_elevation_fixture', 'meta_value' => '1' ] );
			foreach ( is_array( $found ) ? $found : [] as $term ) {
				if ( 0 === (int) $term->count && wp_delete_term( $term->term_id, $taxonomy ) === true ) {
					++$terms;
				}
			}
		}
		WP_CLI::success( sprintf( 'Removed %d fixture post(s) and %d fixture term(s).', count( $ids ), $terms ) );
		return;
	}
	if ( ! in_array( $action, [ 'events', 'announcements' ], true ) || empty( $args[1] ) || ! is_readable( $args[1] ) ) {
		WP_CLI::error( 'Usage: wp elevation fixtures events|announcements <readable json file> | remove' );
	}
	$rows = json_decode( (string) file_get_contents( $args[1] ), true );
	if ( ! is_array( $rows ) ) {
		WP_CLI::error( 'Fixture file is not a JSON array.' );
	}
	$today = new DateTimeImmutable( 'now' );
	foreach ( $rows as $i => $row ) {
		$row = is_array( $row ) ? $row : [];
		if ( 'events' === $action ) {
			elevation_fixture_event( $row, $today, (int) $i );
		} elseif ( function_exists( 'elevation_fixture_announcement' ) ) {
			elevation_fixture_announcement( $row, $today, (int) $i );
		} else {
			WP_CLI::error( 'Announcement fixtures are not available yet.' );
		}
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
			'event_online_url' => (string) ( $row['online_url'] ?? '' ),
		];
	} catch ( \InvalidArgumentException $e ) {
		WP_CLI::error( "$slug: " . $e->getMessage() );
	}
	$errors = EventFields::errors( [ 'start' => $meta['event_start'], 'end' => $meta['event_end'], 'cta_url' => $meta['event_cta_url'], 'online_url' => $meta['event_online_url'] ], true );
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

	$existing = get_posts( [ 'post_type' => 'event', 'name' => $slug, 'post_status' => [ 'any', 'trash' ], 'posts_per_page' => 1 ] )[0] ?? null;
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

function elevation_fixture_announcement( array $row, DateTimeImmutable $today, int $index ): void {
	$slug = sanitize_title( (string) ( $row['slug'] ?? '' ) );
	if ( '' === $slug || '' === trim( (string) ( $row['title'] ?? '' ) ) ) {
		WP_CLI::error( "Announcement fixture #$index needs a slug and a title." );
	}
	try {
		$starts = Fixtures::when( (string) ( $row['starts'] ?? '' ), $today );
		$ends   = Fixtures::when( (string) ( $row['ends'] ?? '' ), $today );
	} catch ( \InvalidArgumentException $e ) {
		WP_CLI::error( "$slug: " . $e->getMessage() );
	}
	$meta   = [
		'announcement_starts'        => $starts,
		'announcement_ends'          => $ends,
		'announcement_cta_label'     => sanitize_text_field( (string) ( $row['cta_label'] ?? '' ) ),
		'announcement_cta_url'       => (string) ( $row['cta_url'] ?? '' ),
		'announcement_dismiss_hours' => (int) ( $row['dismiss_hours'] ?? Announcement::DEFAULT_DISMISS_HOURS ),
	];
	$errors = Announcement::errors( [ 'starts' => $starts, 'ends' => $ends, 'cta_url' => $meta['announcement_cta_url'], 'dismiss_hours' => $meta['announcement_dismiss_hours'] ] );
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
		'post_type'    => 'announcement',
		'post_name'    => $slug,
		'post_title'   => (string) $row['title'],
		'post_content' => Fixtures::paragraphs( (string) ( $row['body'] ?? '' ) ),
		'post_status'  => 'publish',
	];

	$existing = get_posts( [ 'post_type' => 'announcement', 'name' => $slug, 'post_status' => [ 'any', 'trash' ], 'posts_per_page' => 1 ] )[0] ?? null;
	if ( $existing && ! get_post_meta( $existing->ID, '_elevation_fixture', true ) ) {
		WP_CLI::warning( "Skipped announcement $slug: a real (non-fixture) announcement already uses this slug." );
		return;
	}
	if ( $existing ) {
		$same = $existing->post_title === $data['post_title'] && $existing->post_content === $data['post_content']
			&& 'publish' === $existing->post_status && (int) get_post_thumbnail_id( $existing ) === $image;
		foreach ( $meta as $key => $value ) {
			$same = $same && get_post_meta( $existing->ID, $key, true ) == $value; // phpcs:ignore Universal.Operators.StrictComparisons -- integers are stored as strings.
		}
		if ( $same ) {
			WP_CLI::log( "Unchanged announcement $slug" );
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
	// A fixture is never switched on unless its row says so; re-seeding leaves a switch someone flipped alone.
	if ( ! $existing ) {
		update_post_meta( $id, 'announcement_active', ! empty( $row['active'] ) );
	} elseif ( ! empty( $row['active'] ) ) {
		update_post_meta( $id, 'announcement_active', true );
	}
	WP_CLI::log( ( $existing ? 'Updated' : 'Created' ) . " announcement $slug (#$id)" );
}
