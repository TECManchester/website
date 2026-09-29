<?php
/** Local-only sample content (spec §9): `wp elevation fixtures events|groups <file>` and `wp elevation fixtures remove`. */
use Elevation\Core\EventFields;
use Elevation\Core\GroupFields;
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
	if ( ! in_array( $action, [ 'events', 'groups', 'announcements' ], true ) || empty( $args[1] ) || ! is_readable( $args[1] ) ) {
		WP_CLI::error( 'Usage: wp elevation fixtures events|groups|announcements <readable json file> | remove' );
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
		} elseif ( 'groups' === $action ) {
			elevation_fixture_group( $row, (int) $i );
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

function elevation_fixture_group( array $row, int $index ): void {
	$slug = sanitize_title( (string) ( $row['slug'] ?? '' ) );
	if ( '' === $slug || '' === trim( (string) ( $row['title'] ?? '' ) ) ) {
		WP_CLI::error( "Group fixture #$index needs a slug and a title." );
	}
	$meta = [
		'group_meeting_day'  => GroupFields::day( $row['day'] ?? '' ),
		'group_meeting_time' => GroupFields::time( $row['time'] ?? '' ),
		'group_leader_name'  => sanitize_text_field( (string) ( $row['leader'] ?? '' ) ),
		'group_leader_email' => sanitize_email( (string) ( $row['leader_email'] ?? '' ) ),
		'group_accepting'    => (bool) ( $row['accepting'] ?? true ),
	];
	$image = 0;
	if ( ! empty( $row['image'] ) ) {
		$media = elevation_seed_media_lookup( (string) $row['image'] );
		$media || WP_CLI::error( "$slug: unknown media {$row['image']} (import it first)." );
		$image = $media['id'];
	}
	$existing = get_posts( [ 'post_type' => 'connect_group', 'name' => $slug, 'post_status' => [ 'any', 'trash' ], 'posts_per_page' => 1 ] )[0] ?? null;
	if ( $existing && ! get_post_meta( $existing->ID, '_elevation_fixture', true ) ) {
		WP_CLI::warning( "Skipped group $slug: a real (non-fixture) group already uses this slug." );
		return;
	}
	$data = [
		'post_type'    => 'connect_group',
		'post_name'    => $slug,
		'post_title'   => (string) $row['title'],
		'post_excerpt' => (string) ( $row['summary'] ?? '' ),
		'menu_order'   => (int) ( $row['order'] ?? 0 ),
		'post_status'  => 'publish',
	];
	if ( $existing ) {
		$data['ID'] = $existing->ID;
	}
	$id = wp_insert_post( wp_slash( $data ), true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::error( "$slug: " . $id->get_error_message() );
	}
	foreach ( $meta as $key => $value ) {
		update_post_meta( $id, $key, $value );
	}
	foreach ( [ 'area' => 'group_area', 'category' => 'group_category' ] as $field => $taxonomy ) {
		$name = trim( (string) ( $row[ $field ] ?? '' ) );
		if ( '' === $name ) {
			wp_set_object_terms( $id, [], $taxonomy );
			continue;
		}
		$term = get_term_by( 'name', $name, $taxonomy );
		if ( ! $term ) {
			$made = wp_insert_term( $name, $taxonomy );
			if ( is_wp_error( $made ) ) {
				WP_CLI::error( "$slug: " . $made->get_error_message() );
			}
			update_term_meta( (int) $made['term_id'], '_elevation_fixture', 1 );
			$term_id = (int) $made['term_id'];
		} else {
			$term_id = (int) $term->term_id;
		}
		wp_set_object_terms( $id, [ $term_id ], $taxonomy );
	}
	update_post_meta( $id, '_elevation_fixture', 1 );
	$image ? set_post_thumbnail( $id, $image ) : delete_post_thumbnail( $id );
	WP_CLI::log( ( $existing ? 'Updated' : 'Created' ) . " group $slug (#$id)" );
}
