<?php
/** The event post type (spec §6.2): fields, publish validation, the upcoming query and a data accessor. */
use Elevation\Core\EventFields;
use Elevation\Core\EventTime;

defined( 'ABSPATH' ) || exit;

const ELEVATION_EVENT_META = [
	'event_start'     => 'string',
	'event_end'       => 'string',
	'event_time_tbc'  => 'boolean',
	'event_venue'     => 'string',
	'event_cta_label' => 'string',
	'event_cta_url'   => 'string',
];

add_action( 'init', function () {
	register_post_type( 'event', [
		'labels'        => [
			'name'               => __( 'Events', 'elevation-core' ),
			'singular_name'      => __( 'Event', 'elevation-core' ),
			'add_new_item'       => __( 'Add new event', 'elevation-core' ),
			'edit_item'          => __( 'Edit event', 'elevation-core' ),
			'new_item'           => __( 'New event', 'elevation-core' ),
			'view_item'          => __( 'View event', 'elevation-core' ),
			'view_items'         => __( 'View events', 'elevation-core' ),
			'search_items'       => __( 'Search events', 'elevation-core' ),
			'not_found'          => __( 'No events found.', 'elevation-core' ),
			'not_found_in_trash' => __( 'No events found in Trash.', 'elevation-core' ),
			'all_items'          => __( 'All events', 'elevation-core' ),
			'archives'           => __( 'Events', 'elevation-core' ),
			'menu_name'          => __( 'Events', 'elevation-core' ),
		],
		'public'        => true,
		'show_in_rest'  => true,
		'menu_icon'     => 'dashicons-calendar-alt',
		'menu_position' => 21,
		'has_archive'   => 'events',
		'rewrite'       => [ 'slug' => 'events', 'with_front' => false ],
		'supports'      => [ 'title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'custom-fields' ],
		'map_meta_cap'  => true,
		'capability_type' => 'post',
	] );

	$sanitisers = [
		'event_start'     => [ EventFields::class, 'normaliseDateTime' ],
		'event_end'       => [ EventFields::class, 'normaliseDateTime' ],
		'event_time_tbc'  => 'rest_sanitize_boolean',
		'event_venue'     => 'sanitize_text_field',
		'event_cta_label' => 'sanitize_text_field',
		'event_cta_url'   => [ EventFields::class, 'normaliseCtaUrl' ],
	];
	foreach ( ELEVATION_EVENT_META as $key => $type ) {
		register_post_meta( 'event', $key, [
			'type'              => $type,
			'single'            => true,
			'default'           => 'boolean' === $type ? false : '',
			'show_in_rest'      => true,
			'sanitize_callback' => $sanitisers[ $key ],
			'auth_callback'     => fn ( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', (int) $post_id ),
		] );
	}
} );

/** Keep _event_until (the last London date the event is on) in step with the dates, however they're saved. */
function elevation_event_sync_until( int $post_id ): void {
	if ( 'event' !== get_post_type( $post_id ) ) {
		return;
	}
	$start = (string) get_post_meta( $post_id, 'event_start', true );
	$until = EventTime::untilKey( $start, (string) get_post_meta( $post_id, 'event_end', true ) );
	'' === $until ? delete_post_meta( $post_id, '_event_until' ) : update_post_meta( $post_id, '_event_until', $until );
}
foreach ( [ 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ] as $elevation_hook ) {
	add_action( $elevation_hook, function ( $meta_id, $object_id, $meta_key ) {
		if ( in_array( $meta_key, [ 'event_start', 'event_end' ], true ) ) {
			elevation_event_sync_until( (int) $object_id );
		}
	}, 10, 3 );
}
unset( $elevation_hook );

// Refuse to publish (or schedule) an event whose dates or link are wrong; drafts save regardless of a missing start.
add_filter( 'rest_pre_insert_event', function ( $prepared, WP_REST_Request $request ) {
	$id     = (int) ( $prepared->ID ?? 0 );
	$meta   = is_array( $request['meta'] ?? null ) ? $request['meta'] : [];
	$value  = fn ( string $key ) => array_key_exists( $key, $meta ) ? $meta[ $key ] : ( $id ? get_post_meta( $id, $key, true ) : '' );
	$status = $prepared->post_status ?? ( $id ? get_post_status( $id ) : 'draft' );
	$errors = EventFields::errors(
		[ 'start' => $value( 'event_start' ), 'end' => $value( 'event_end' ), 'cta_url' => $value( 'event_cta_url' ) ],
		in_array( $status, [ 'publish', 'future' ], true )
	);
	return $errors ? new WP_Error( 'elevation_event_invalid', implode( ' ', $errors ), [ 'status' => 400 ] ) : $prepared;
}, 10, 2 );

// wp-admin list: a sortable "Starts" column, so staff can see what's on when.
add_filter( 'manage_event_posts_columns', function ( array $columns ): array {
	$out = [];
	foreach ( $columns as $key => $label ) {
		$out[ $key ] = $label;
		if ( 'title' === $key ) {
			$out['event_start'] = __( 'Starts', 'elevation-core' );
		}
	}
	return $out;
} );
add_action( 'manage_event_posts_custom_column', function ( string $column, int $post_id ) {
	if ( 'event_start' !== $column ) {
		return;
	}
	$start = (string) get_post_meta( $post_id, 'event_start', true );
	$tbc   = (bool) get_post_meta( $post_id, 'event_time_tbc', true );
	echo '' === $start ? '—' : esc_html( EventTime::formatDate( $start ) . ', ' . EventTime::formatTime( $start, '', $tbc ) );
}, 10, 2 );
add_filter( 'manage_edit-event_sortable_columns', fn ( array $columns ): array => $columns + [ 'event_start' => 'event_start' ] );
add_action( 'pre_get_posts', function ( WP_Query $query ) {
	if ( is_admin() && $query->is_main_query() && 'event_start' === $query->get( 'orderby' ) ) {
		$query->set( 'meta_key', 'event_start' );
		$query->set( 'orderby', 'meta_value' );
	}
} );

/** @return list<WP_Post> Published events that haven't finished (London time), soonest first. */
function elevation_upcoming_events( int $limit, int $exclude = 0 ): array {
	return get_posts( [
		'post_type'        => 'event',
		'post_status'      => 'publish',
		'posts_per_page'   => max( 1, $limit ),
		'post__not_in'     => $exclude ? [ $exclude ] : [],
		'meta_query'       => [
			'until' => [ 'key' => '_event_until', 'value' => EventTime::todayKey( new DateTimeImmutable( 'now' ) ), 'compare' => '>=', 'type' => 'CHAR' ],
			'start' => [ 'key' => 'event_start', 'compare' => 'EXISTS' ],
		],
		'orderby'          => [ 'start' => 'ASC', 'title' => 'ASC' ],
		'no_found_rows'    => true,
		'suppress_filters' => false,
	] );
}

/** @return list<WP_Post> Every published event with a start, past and future — for the calendar. */
function elevation_calendar_events(): array {
	return get_posts( [
		'post_type'      => 'event',
		'post_status'    => 'publish',
		'posts_per_page' => 500,
		'meta_query'     => [ 'has_until' => [ 'key' => '_event_until', 'compare' => 'EXISTS' ], 'start' => [ 'key' => 'event_start', 'compare' => 'EXISTS' ] ],
		'orderby'        => [ 'start' => 'ASC', 'title' => 'ASC' ],
		'no_found_rows'  => true,
	] );
}

/**
 * An event's fields as plain text (never HTML), for renderers.
 *
 * @return array{id:int,title:string,url:string,summary:string,start:string,end:string,tbc:bool,venue:string,cta_label:string,cta_url:string,image:int}
 */
function elevation_event( WP_Post $post ): array {
	$text = fn ( string $value ): string => trim( html_entity_decode( wp_strip_all_tags( $value ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	return [
		'id'        => $post->ID,
		'title'     => $text( get_the_title( $post ) ),
		'url'       => (string) get_permalink( $post ),
		'summary'   => $text( $post->post_excerpt ),
		'start'     => (string) get_post_meta( $post->ID, 'event_start', true ),
		'end'       => (string) get_post_meta( $post->ID, 'event_end', true ),
		'tbc'       => (bool) get_post_meta( $post->ID, 'event_time_tbc', true ),
		'venue'     => (string) get_post_meta( $post->ID, 'event_venue', true ),
		'cta_label' => (string) get_post_meta( $post->ID, 'event_cta_label', true ),
		'cta_url'   => (string) get_post_meta( $post->ID, 'event_cta_url', true ),
		'image'     => (int) get_post_thumbnail_id( $post ),
	];
}
