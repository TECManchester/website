<?php
/**
 * Live status freshness (spec §6.4). Pages are cached up to 10 minutes on live, so the live blocks carry
 * the state they rendered with; live-status.js asks this uncacheable endpoint (answered from the 60s
 * feed transient) and swaps in fresh HTML — re-rendered from the page's own blocks — if the state changed.
 */
defined( 'ABSPATH' ) || exit;

const ELEVATION_LIVE_BLOCKS = [ 'elevation/watch-hero', 'elevation/live-player', 'elevation/home-watch' ];

add_action( 'init', function () {
	wp_register_script( 'elevation-live-state', ELEVATION_CORE_URL . 'assets/js/live-state.js', [], (string) filemtime( ELEVATION_CORE_DIR . 'assets/js/live-state.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_register_script( 'elevation-live-status', ELEVATION_CORE_URL . 'assets/js/live-status.js', [ 'elevation-live-state' ], (string) filemtime( ELEVATION_CORE_DIR . 'assets/js/live-status.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_add_inline_script( 'elevation-live-status', 'window.ecmLive = ' . wp_json_encode( [ 'endpoint' => rest_url( 'elevation/v1/live' ) ] ) . ';', 'before' );
}, 5 ); // Before the blocks register (priority 10); their block.json names this handle.

/** Wrapper attributes every live block renders with. */
function elevation_live_attrs( string $block, string $state, array $extra = [] ): array {
	return $extra + [ 'data-live-block' => $block, 'data-live-state' => $state, 'data-live-post' => (string) (int) get_the_ID() ];
}

/** @return list<array> Live blocks anywhere in a parsed block tree. */
function elevation_live_find_blocks( array $blocks ): array {
	$found = [];
	foreach ( $blocks as $block ) {
		if ( in_array( $block['blockName'] ?? '', ELEVATION_LIVE_BLOCKS, true ) ) {
			$found[] = $block;
		}
		$found = array_merge( $found, elevation_live_find_blocks( $block['innerBlocks'] ?? [] ) );
	}
	return $found;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'elevation/v1', '/live', [
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'args'                => [ 'post' => [ 'type' => 'integer', 'default' => 0, 'minimum' => 0 ] ],
		'callback'            => function ( WP_REST_Request $request ) {
			$live   = elevation_youtube_live();
			$blocks = [];
			$post   = get_post( (int) $request['post'] );
			if ( $post && 'publish' === $post->post_status && '' === $post->post_password && is_post_publicly_viewable( $post ) ) {
				$GLOBALS['post'] = $post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride -- blocks read get_the_ID().
				setup_postdata( $post );
				foreach ( elevation_live_find_blocks( parse_blocks( $post->post_content ) ) as $block ) {
					$blocks[ $block['blockName'] ] = render_block( $block );
				}
				wp_reset_postdata();
			}
			$response = new WP_REST_Response( [ 'state' => $live['state'], 'blocks' => (object) $blocks ] );
			$response->header( 'Cache-Control', 'no-store, max-age=0' );
			return $response;
		},
	] );
} );
