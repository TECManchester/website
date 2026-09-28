<?php
use Elevation\Core\SeedGuard;

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
 */
WP_CLI::add_command( 'elevation seed', function ( array $args, array $assoc ) {
	[ $type, $slug, $file ] = $args;
	if ( ! is_readable( $file ) ) {
		WP_CLI::error( "Seed file not readable: $file" );
	}
	$content = (string) file_get_contents( $file );

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
	WP_CLI::log( ( SeedGuard::CREATE === $decision ? 'Created' : 'Updated' ) . " $type $slug (#$id)" );
} );
