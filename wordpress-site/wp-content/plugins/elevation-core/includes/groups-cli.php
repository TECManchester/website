<?php
/**
 * `wp elevation groups seed <file>`: the church's real Connect Groups from seed/groups.json (spec §6.6).
 * A group is created or updated by slug; one edited in wp-admin since it was seeded is skipped unless forced.
 * Leader emails and images are never seeded: staff add them in wp-admin.
 */
use Elevation\Core\GroupFields;
use Elevation\Core\SeedGuard;

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * ## EXAMPLES
 *     wp elevation groups seed /seed/groups.json [--force=salem,surge]
 */
WP_CLI::add_command( 'elevation groups', function ( array $args, array $assoc ) {
	if ( 'seed' !== ( $args[0] ?? '' ) || empty( $args[1] ) || ! is_readable( $args[1] ) ) {
		WP_CLI::error( 'Usage: wp elevation groups seed <readable json file> [--force=<slugs>]' );
	}
	$def = json_decode( (string) file_get_contents( $args[1] ), true );
	if ( ! is_array( $def ) || ! is_array( $def['groups'] ?? null ) ) {
		WP_CLI::error( 'The groups file needs a "groups" list.' );
	}
	$force = array_values( array_filter( array_map( 'trim', explode( ',', (string) ( $assoc['force'] ?? '' ) ) ) ) );
	foreach ( (array) ( $def['categories'] ?? [] ) as $category ) {
		elevation_groups_term( 'group_category', (string) ( $category['name'] ?? '' ), (string) ( $category['slug'] ?? '' ) );
	}
	foreach ( (array) ( $def['areas'] ?? [] ) as $area ) {
		elevation_groups_term( 'group_area', (string) $area );
	}
	$slugs = [];
	foreach ( $def['groups'] as $i => $row ) {
		$row  = is_array( $row ) ? $row : [];
		$slug = sanitize_title( (string) ( $row['slug'] ?? '' ) );
		if ( '' === $slug || '' === trim( (string) ( $row['title'] ?? '' ) ) ) {
			WP_CLI::error( "Group #$i needs a slug and a title." );
		}
		if ( isset( $slugs[ $slug ] ) ) {
			WP_CLI::error( "Two groups use the slug $slug." );
		}
		$slugs[ $slug ] = true;
		elevation_groups_seed_one( $slug, $row, in_array( $slug, $force, true ) );
	}
	// Group types the file retires (renamed): deleted once no group uses them, so none is left behind.
	foreach ( (array) ( $def['retired_categories'] ?? [] ) as $retired ) {
		$term = get_term_by( 'slug', sanitize_title( (string) $retired ), 'group_category' );
		if ( $term && 0 === (int) $term->count && ! is_wp_error( wp_delete_term( $term->term_id, 'group_category' ) ) ) {
			WP_CLI::log( "Deleted retired group_category {$term->slug}" );
		}
	}
} );

/** The term's ID, creating it when it is missing. The slug defaults to the name's. */
function elevation_groups_term( string $taxonomy, string $name, string $slug = '' ): int {
	$name = trim( $name );
	$slug = '' !== $slug ? sanitize_title( $slug ) : sanitize_title( $name );
	if ( '' === $name || '' === $slug ) {
		WP_CLI::error( "A $taxonomy term needs a name." );
	}
	$term = get_term_by( 'slug', $slug, $taxonomy );
	if ( $term ) {
		delete_term_meta( $term->term_id, '_elevation_fixture' ); // A real group now uses it: a sample-content sweep must keep it.
		return (int) $term->term_id;
	}
	$made = wp_insert_term( $name, $taxonomy, [ 'slug' => $slug ] );
	if ( is_wp_error( $made ) ) {
		WP_CLI::error( "$taxonomy $name: " . $made->get_error_message() );
	}
	WP_CLI::log( "Created $taxonomy $name" );
	return (int) $made['term_id'];
}

/** What the seed guard compares: title, excerpt, order, status, the seeded meta and the term slugs. */
function elevation_groups_seed_content( string $title, string $excerpt, int $order, string $status, array $meta, array $areas, array $categories ): string {
	sort( $areas );
	sort( $categories );
	return (string) wp_json_encode( [ $title, $excerpt, $order, $status, $meta, $areas, $categories ] );
}

/** The seeded meta, normalised the same way whether it comes from the file or from the post. */
function elevation_groups_seed_meta( array $raw ): array {
	return [
		'group_meeting_day'  => GroupFields::day( $raw['group_meeting_day'] ?? '' ),
		'group_meeting_time' => GroupFields::time( $raw['group_meeting_time'] ?? '' ),
		'group_frequency'    => GroupFields::frequency( $raw['group_frequency'] ?? '' ),
		'group_leader_name'  => sanitize_text_field( (string) ( $raw['group_leader_name'] ?? '' ) ),
		'group_towns'        => implode( "\n", GroupFields::towns( $raw['group_towns'] ?? '' ) ),
		'group_accepting'    => (bool) ( $raw['group_accepting'] ?? true ),
	];
}

function elevation_groups_seed_one( string $slug, array $row, bool $force ): void {
	$title      = trim( (string) $row['title'] );
	$excerpt    = trim( (string) ( $row['summary'] ?? '' ) );
	$order      = (int) ( $row['order'] ?? 0 );
	$meta       = elevation_groups_seed_meta( [
		'group_meeting_day'  => $row['day'] ?? '',
		'group_meeting_time' => $row['time'] ?? '',
		'group_frequency'    => $row['frequency'] ?? '',
		'group_leader_name'  => $row['leader'] ?? '',
		'group_towns'        => $row['towns'] ?? [],
		'group_accepting'    => $row['accepting'] ?? true,
	] );
	$areas      = array_map( 'sanitize_title', array_map( 'strval', (array) ( $row['areas'] ?? [] ) ) );
	$categories = '' !== trim( (string) ( $row['type'] ?? '' ) ) ? [ sanitize_title( (string) $row['type'] ) ] : [];
	$new        = elevation_groups_seed_content( $title, $excerpt, $order, 'publish', $meta, $areas, $categories );

	$post    = get_posts( [ 'post_type' => 'connect_group', 'name' => $slug, 'post_status' => [ 'any', 'trash' ], 'posts_per_page' => 1 ] )[0] ?? null;
	$current = null;
	$stored  = null;
	if ( $post ) {
		$raw = [];
		foreach ( array_keys( $meta ) as $key ) {
			$raw[ $key ] = get_post_meta( $post->ID, $key, true );
		}
		$current = elevation_groups_seed_content(
			$post->post_title,
			$post->post_excerpt,
			(int) $post->menu_order,
			$post->post_status,
			elevation_groups_seed_meta( $raw ),
			wp_get_object_terms( $post->ID, 'group_area', [ 'fields' => 'slugs' ] ) ?: [],
			wp_get_object_terms( $post->ID, 'group_category', [ 'fields' => 'slugs' ] ) ?: []
		);
		$stored  = get_post_meta( $post->ID, '_elevation_seed_hash', true ) ?: null;
	}

	$decision = SeedGuard::decide( $stored, $current, $new, $force );
	if ( SeedGuard::UNCHANGED === $decision ) {
		update_post_meta( $post->ID, '_elevation_seed_hash', SeedGuard::hash( $new ) );
		WP_CLI::log( "Unchanged group $slug (#{$post->ID})" );
		return;
	}
	if ( SeedGuard::SKIP === $decision ) {
		WP_CLI::warning( "Skipped group $slug (#{$post->ID}): it was edited in wp-admin after it was seeded. Re-run with SEED_FORCE=\"group:$slug\" to overwrite it." );
		return;
	}
	$data = [
		'post_type'    => 'connect_group',
		'post_name'    => $slug,
		'post_title'   => $title,
		'post_excerpt' => $excerpt,
		'menu_order'   => $order,
		'post_status'  => 'publish',
	];
	if ( $post ) {
		$data['ID'] = $post->ID;
	}
	$id = wp_insert_post( wp_slash( $data ), true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::error( "$slug: " . $id->get_error_message() );
	}
	foreach ( $meta as $key => $value ) {
		update_post_meta( $id, $key, $value );
	}
	foreach ( [ 'group_area' => [ $areas, (array) ( $row['areas'] ?? [] ) ], 'group_category' => [ $categories, [ (string) ( $row['type'] ?? '' ) ] ] ] as $taxonomy => [ $term_slugs, $names ] ) {
		$ids = [];
		foreach ( array_values( $term_slugs ) as $n => $term_slug ) {
			$ids[] = elevation_groups_term( $taxonomy, (string) $names[ $n ], $term_slug );
		}
		wp_set_object_terms( $id, $ids, $taxonomy );
	}
	update_post_meta( $id, '_elevation_seed_hash', SeedGuard::hash( $new ) );
	WP_CLI::log( ( $post ? 'Updated' : 'Created' ) . " group $slug (#$id)" );
}
