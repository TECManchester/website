<?php
defined( 'ABSPATH' ) || exit;

/**
 * Pin the header's Navigation block to the seeded "header" menu.
 *
 * The header template part has no `ref`, so core would fall back to the most recent
 * menu, and any menu a Site Manager creates would take over the header.
 */
add_filter( 'render_block_data', function ( array $block ): array {
	if ( 'core/navigation' !== ( $block['blockName'] ?? '' ) || isset( $block['attrs']['ref'] ) ) {
		return $block;
	}
	if ( ! in_array( 'site-nav', preg_split( '/\s+/', trim( (string) ( $block['attrs']['className'] ?? '' ) ) ), true ) ) {
		return $block;
	}
	static $header_id = null;
	if ( null === $header_id ) {
		$found     = get_posts( [
			'post_type'      => 'wp_navigation',
			'name'           => 'header',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'fields'         => 'ids',
		] );
		$header_id = $found ? (int) $found[0] : 0;
	}
	if ( $header_id ) {
		$block['attrs']['ref'] = $header_id;
	}
	return $block;
} );
