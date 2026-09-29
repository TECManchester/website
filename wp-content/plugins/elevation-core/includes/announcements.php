<?php
/**
 * Announcements (spec §6.5): the post type and its settings, "only one on at a time", and the uncacheable
 * endpoint the modal script asks on every page view, so switching one on or off takes effect on the next
 * page view whatever the 10-minute HTML cache holds.
 */
use Elevation\Core\Announcement;
use Elevation\Core\EventFields;
use Elevation\Core\Tokens;

defined( 'ABSPATH' ) || exit;

const ELEVATION_ANNOUNCEMENT_META = [
	'announcement_active'        => 'boolean',
	'announcement_starts'        => 'string',
	'announcement_ends'          => 'string',
	'announcement_cta_label'     => 'string',
	'announcement_cta_url'       => 'string',
	'announcement_dismiss_hours' => 'integer',
];

add_action( 'init', function () {
	register_post_type( 'announcement', [
		'labels'          => [
			'name'          => __( 'Announcements', 'elevation-core' ),
			'singular_name' => __( 'Announcement', 'elevation-core' ),
			'add_new_item'  => __( 'Add Announcement', 'elevation-core' ),
			'edit_item'     => __( 'Edit Announcement', 'elevation-core' ),
			'new_item'      => __( 'New Announcement', 'elevation-core' ),
			'search_items'  => __( 'Search Announcements', 'elevation-core' ),
			'not_found'     => __( 'No announcements yet.', 'elevation-core' ),
			'all_items'     => __( 'All Announcements', 'elevation-core' ),
			'menu_name'     => __( 'Announcements', 'elevation-core' ),
		],
		'public'          => false,
		'show_ui'         => true,
		'show_in_rest'    => true,
		'menu_icon'       => 'dashicons-megaphone',
		'menu_position'   => 23,
		'supports'        => [ 'title', 'editor', 'thumbnail', 'revisions', 'custom-fields' ],
		'map_meta_cap'    => true,
		'capability_type' => 'post',
		'rewrite'         => false,
		'query_var'       => false,
		'template'        => [ [ 'core/paragraph', [ 'placeholder' => __( 'What would you like to tell everyone?', 'elevation-core' ) ] ] ],
	] );
	$sanitisers = [
		'announcement_active'        => 'rest_sanitize_boolean',
		'announcement_starts'        => [ EventFields::class, 'normaliseDateTime' ],
		'announcement_ends'          => [ EventFields::class, 'normaliseDateTime' ],
		'announcement_cta_label'     => 'sanitize_text_field',
		'announcement_cta_url'       => [ EventFields::class, 'normaliseCtaUrl' ],
		'announcement_dismiss_hours' => [ Announcement::class, 'dismissHours' ],
	];
	foreach ( ELEVATION_ANNOUNCEMENT_META as $key => $type ) {
		register_post_meta( 'announcement', $key, [
			'type'              => $type,
			'single'            => true,
			'default'           => match ( $key ) { 'announcement_active' => false, 'announcement_dismiss_hours' => Announcement::DEFAULT_DISMISS_HOURS, default => '' },
			'show_in_rest'      => true,
			'sanitize_callback' => $sanitisers[ $key ],
			'auth_callback'     => static fn ( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', (int) $post_id ),
		] );
	}
} );

add_filter( 'allowed_block_types_all', static function ( $allowed, $context ) {
	return ( $context->post ?? null ) && 'announcement' === $context->post->post_type ? [ 'core/paragraph', 'core/list', 'core/list-item' ] : $allowed;
}, 10, 2 );

add_filter( 'rest_pre_insert_announcement', static function ( $prepared, WP_REST_Request $request ) {
	$meta   = (array) ( $request->get_param( 'meta' ) ?? [] );
	$id     = (int) ( $prepared->ID ?? 0 );
	$value  = static fn ( string $key ) => array_key_exists( $key, $meta ) ? $meta[ $key ] : ( $id ? get_post_meta( $id, $key, true ) : '' );
	$errors = Announcement::errors( [
		'starts'        => $value( 'announcement_starts' ),
		'ends'          => $value( 'announcement_ends' ),
		'cta_url'       => $value( 'announcement_cta_url' ),
		'dismiss_hours' => '' === $value( 'announcement_dismiss_hours' ) ? Announcement::DEFAULT_DISMISS_HOURS : $value( 'announcement_dismiss_hours' ),
	] );
	return $errors ? new WP_Error( 'elevation_announcement_invalid', implode( ' ', $errors ), [ 'status' => 400 ] ) : $prepared;
}, 10, 2 );

/** Switching one on switches the others off (spec §6.5). Only a published announcement counts. */
function elevation_announcement_deactivate_others( int $keep ): void {
	$others = get_posts( [
		'post_type'      => 'announcement',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
		'post__not_in'   => [ $keep ],
		'meta_key'       => 'announcement_active', // phpcs:ignore WordPress.DB.SlowDBQuery
		'meta_value'     => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
	] );
	foreach ( $others as $id ) {
		update_post_meta( (int) $id, 'announcement_active', false );
	}
}
foreach ( [ 'added_post_meta', 'updated_post_meta' ] as $elevation_hook ) {
	add_action( $elevation_hook, static function ( $meta_id, $post_id, $meta_key, $value ) {
		if ( 'announcement_active' === $meta_key && rest_sanitize_boolean( $value ) && 'publish' === get_post_status( (int) $post_id ) && 'announcement' === get_post_type( (int) $post_id ) ) {
			elevation_announcement_deactivate_others( (int) $post_id );
		}
	}, 10, 4 );
}
add_action( 'transition_post_status', static function ( $new, $old, $post ) {
	if ( 'publish' === $new && 'publish' !== $old && 'announcement' === $post->post_type && get_post_meta( $post->ID, 'announcement_active', true ) ) {
		elevation_announcement_deactivate_others( (int) $post->ID );
	}
}, 10, 3 );

function elevation_current_announcement( ?DateTimeImmutable $now = null ): ?WP_Post {
	$now   ??= new DateTimeImmutable( 'now' );
	$active = get_posts( [
		'post_type'      => 'announcement',
		'post_status'    => 'publish',
		'posts_per_page' => 5,
		'orderby'        => 'modified',
		'order'          => 'DESC',
		'meta_key'       => 'announcement_active', // phpcs:ignore WordPress.DB.SlowDBQuery
		'meta_value'     => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
	] );
	foreach ( $active as $post ) {
		if ( Announcement::isLive( true, (string) get_post_meta( $post->ID, 'announcement_starts', true ), (string) get_post_meta( $post->ID, 'announcement_ends', true ), $now ) ) {
			return $post;
		}
	}
	return null;
}

function elevation_announcement_payload( WP_Post $post ): array {
	$image = (int) get_post_thumbnail_id( $post );
	$src   = $image ? wp_get_attachment_image_src( $image, 'medium_large' ) : false;
	return [
		'id'           => $post->ID,
		'version'      => (int) get_post_modified_time( 'U', true, $post ),
		'title'        => Tokens::replace( $post->post_title, 'elevation_public_setting', false ),
		'body'         => elevation_replace_tokens( wp_kses_post( do_blocks( $post->post_content ) ) ),
		'image'        => $src ? [ 'src' => $src[0], 'width' => (int) $src[1], 'height' => (int) $src[2] ] : null,
		'ctaLabel'     => (string) get_post_meta( $post->ID, 'announcement_cta_label', true ),
		'ctaUrl'       => EventFields::normaliseCtaUrl( get_post_meta( $post->ID, 'announcement_cta_url', true ) ),
		'dismissHours' => Announcement::dismissHours( get_post_meta( $post->ID, 'announcement_dismiss_hours', true ) ),
		'startsAt'     => Announcement::iso( (string) get_post_meta( $post->ID, 'announcement_starts', true ) ),
		'endsAt'       => Announcement::iso( (string) get_post_meta( $post->ID, 'announcement_ends', true ) ),
	];
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'elevation/v1', '/announcement', [
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => static function () {
			$post     = elevation_current_announcement();
			$response = new WP_REST_Response( [ 'announcement' => $post ? elevation_announcement_payload( $post ) : null ] );
			$response->header( 'Cache-Control', 'no-store, max-age=0' );
			return $response;
		},
	] );
} );

add_action( 'wp_enqueue_scripts', function () {
	$version = static fn ( string $file ) => (string) filemtime( ELEVATION_CORE_DIR . $file );
	wp_register_script( 'elevation-announcement-state', ELEVATION_CORE_URL . 'assets/js/announcement-state.js', [], $version( 'assets/js/announcement-state.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_enqueue_script( 'elevation-announcement', ELEVATION_CORE_URL . 'assets/js/announcement.js', [ 'elevation-announcement-state' ], $version( 'assets/js/announcement.js' ), [ 'in_footer' => true, 'strategy' => 'defer' ] );
	wp_add_inline_script( 'elevation-announcement', 'window.ecmAnnouncement = ' . wp_json_encode( [ 'endpoint' => rest_url( 'elevation/v1/announcement' ) ] ) . ';', 'before' );
} );

// The list screen says which one is showing.
add_filter( 'manage_announcement_posts_columns', static fn ( array $columns ): array => array_slice( $columns, 0, 2, true ) + [ 'announcement_showing' => __( 'Showing', 'elevation-core' ) ] + $columns );
add_action( 'manage_announcement_posts_custom_column', static function ( string $column, int $post_id ) {
	if ( 'announcement_showing' !== $column ) {
		return;
	}
	$current = elevation_current_announcement();
	if ( $current && $current->ID === $post_id ) {
		esc_html_e( 'Showing now', 'elevation-core' );
	} elseif ( get_post_meta( $post_id, 'announcement_active', true ) ) {
		esc_html_e( 'On, but outside its dates', 'elevation-core' );
	} else {
		esc_html_e( 'Off', 'elevation-core' );
	}
}, 10, 2 );
