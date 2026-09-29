<?php
/**
 * Connect Groups (spec §6.6): the post type, its taxonomies and fields, the queries the directory uses, and
 * the Join Group leader routing. Leaders' email addresses stay on the server: they are readable only in the
 * editor (REST "edit" context) and are used only as an email recipient.
 */
use Elevation\Core\GroupFields;

defined( 'ABSPATH' ) || exit;

const ELEVATION_GROUP_META = [
	'group_meeting_day'  => 'string',
	'group_meeting_time' => 'string',
	'group_leader_name'  => 'string',
	'group_leader_email' => 'string',
	'group_accepting'    => 'boolean',
];

add_action( 'init', function () {
	register_post_type( 'connect_group', [
		'labels'          => [
			'name'          => __( 'Connect Groups', 'elevation-core' ),
			'singular_name' => __( 'Connect Group', 'elevation-core' ),
			'add_new_item'  => __( 'Add Connect Group', 'elevation-core' ),
			'edit_item'     => __( 'Edit Connect Group', 'elevation-core' ),
			'new_item'      => __( 'New Connect Group', 'elevation-core' ),
			'search_items'  => __( 'Search Connect Groups', 'elevation-core' ),
			'not_found'     => __( 'No Connect Groups yet.', 'elevation-core' ),
			'all_items'     => __( 'All Connect Groups', 'elevation-core' ),
			'menu_name'     => __( 'Connect Groups', 'elevation-core' ),
		],
		'public'          => false,
		'show_ui'         => true,
		'show_in_rest'    => true,
		'menu_icon'       => 'dashicons-groups',
		'menu_position'   => 22,
		'supports'        => [ 'title', 'excerpt', 'thumbnail', 'page-attributes', 'revisions', 'custom-fields' ],
		'map_meta_cap'    => true,
		'capability_type' => 'post',
		'rewrite'         => false,
		'query_var'       => false,
	] );
	foreach ( [ 'group_area' => [ 'Areas', 'Area' ], 'group_category' => [ 'Group types', 'Group type' ] ] as $taxonomy => [ $plural, $single ] ) {
		register_taxonomy( $taxonomy, 'connect_group', [
			'labels'            => [ 'name' => $plural, 'singular_name' => $single, 'add_new_item' => "Add $single", 'edit_item' => "Edit $single", 'search_items' => "Search $plural", 'all_items' => "All $plural" ],
			'public'            => false,
			'show_ui'           => true,
			'show_in_rest'      => true,
			'show_admin_column' => true,
			'hierarchical'      => true,
			'rewrite'           => false,
		] );
	}
	$sanitisers = [
		'group_meeting_day'  => [ GroupFields::class, 'day' ],
		'group_meeting_time' => [ GroupFields::class, 'time' ],
		'group_leader_name'  => 'sanitize_text_field',
		'group_leader_email' => 'sanitize_email',
		'group_accepting'    => 'rest_sanitize_boolean',
	];
	foreach ( ELEVATION_GROUP_META as $key => $type ) {
		register_post_meta( 'connect_group', $key, [
			'type'              => $type,
			'single'            => true,
			'default'           => 'group_accepting' === $key ? true : '',
			'show_in_rest'      => 'group_leader_email' === $key ? [ 'schema' => [ 'type' => 'string', 'context' => [ 'edit' ] ] ] : true,
			'sanitize_callback' => $sanitisers[ $key ],
			'auth_callback'     => static fn ( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', (int) $post_id ),
		] );
	}
} );

/** @return list<WP_Post> Published groups in menu order, then name. $filters: area, type, meets (from GroupFields::filters). */
function elevation_groups( array $filters = [], int $limit = 100 ): array {
	$args = [
		'post_type'      => 'connect_group',
		'post_status'    => 'publish',
		'posts_per_page' => $limit,
		'orderby'        => [ 'menu_order' => 'ASC', 'title' => 'ASC' ],
		'no_found_rows'  => true,
	];
	$tax = [];
	foreach ( [ 'area' => 'group_area', 'type' => 'group_category' ] as $key => $taxonomy ) {
		if ( '' !== (string) ( $filters[ $key ] ?? '' ) ) {
			$tax[] = [ 'taxonomy' => $taxonomy, 'field' => 'slug', 'terms' => (string) $filters[ $key ] ];
		}
	}
	if ( $tax ) {
		$args['tax_query'] = $tax; // phpcs:ignore WordPress.DB.SlowDBQuery -- a handful of groups.
	}
	if ( '' !== (string) ( $filters['meets'] ?? '' ) ) {
		$args['meta_query'] = [ [ 'key' => 'group_meeting_day', 'value' => (string) $filters['meets'] ] ]; // phpcs:ignore WordPress.DB.SlowDBQuery
	}
	return get_posts( $args );
}

/** @return list<int> Groups a Join request may name: every published group (full ones take "ask about the next one"). */
function elevation_joinable_group_ids(): array {
	return array_map( 'intval', get_posts( [ 'post_type' => 'connect_group', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'no_found_rows' => true ] ) );
}

/** A published group's plain name, or "" for anything else (drafts, trash, other post types, 0). */
function elevation_group_name( int $id ): string {
	$post = $id > 0 ? get_post( $id ) : null;
	return ( $post && 'connect_group' === $post->post_type && 'publish' === $post->post_status ) ? $post->post_title : '';
}

/** Plain values for the cards. Deliberately has no leader email. */
function elevation_group( WP_Post $post ): array {
	$terms = static function ( string $taxonomy ) use ( $post ): string {
		$list = get_the_terms( $post, $taxonomy );
		return is_array( $list ) ? implode( ', ', wp_list_pluck( $list, 'name' ) ) : '';
	};
	return [
		'id'          => $post->ID,
		'slug'        => $post->post_name,
		'name'        => $post->post_title,
		'description' => $post->post_excerpt,
		'area'        => $terms( 'group_area' ),
		'category'    => $terms( 'group_category' ),
		'when'        => GroupFields::when( GroupFields::day( get_post_meta( $post->ID, 'group_meeting_day', true ) ), GroupFields::time( get_post_meta( $post->ID, 'group_meeting_time', true ) ) ),
		'leader'      => GroupFields::firstName( (string) get_post_meta( $post->ID, 'group_leader_name', true ) ),
		'accepting'   => (bool) get_post_meta( $post->ID, 'group_accepting', true ),
		'image'       => (int) get_post_thumbnail_id( $post ),
	];
}

// The "Group leader" notification of the Join Group form goes to the chosen group's leader, looked up here.
// No group, an unknown group or no leader email: the recipient is empty and Fluent Forms sends nothing.
add_filter( 'fluentform/email_to', static function ( $to, $notification, $data, $form ) {
	if ( 'join-group' !== elevation_form_key_of( $form ) || 'group-leader' !== ( $notification['elevation'] ?? '' ) ) {
		return $to;
	}
	$id    = (int) ( $data['group_id'] ?? 0 );
	$email = '' !== elevation_group_name( $id ) ? sanitize_email( (string) get_post_meta( $id, 'group_leader_email', true ) ) : '';
	return is_email( $email ) ? $email : '';
}, 10, 4 );

// The line above the Join Group form: which group this request is for.
add_action( 'elevation_form_before', static function ( string $key ) {
	if ( 'join-group' !== $key ) {
		return;
	}
	$name = elevation_group_name( isset( $_GET['group'] ) ? absint( wp_unslash( $_GET['group'] ) ) : 0 ); // phpcs:ignore WordPress.Security.NonceVerification -- display only.
	if ( '' !== $name ) {
		printf(
			'<p class="form-context">%s <strong>%s</strong>. <a href="%s">%s</a></p>',
			esc_html__( "You're asking to join", 'elevation-core' ),
			esc_html( $name ),
			esc_url( remove_query_arg( 'group' ) . '#groups' ),
			esc_html__( 'Choose a different group', 'elevation-core' )
		);
		return;
	}
	echo '<p class="form-context">' . esc_html__( "Not sure which group? Leave it with us — tell us a little about yourself and we'll suggest one.", 'elevation-core' ) . '</p>';
} );
