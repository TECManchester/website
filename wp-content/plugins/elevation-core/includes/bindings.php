<?php
use Elevation\Core\Tokens;

defined( 'ABSPATH' ) || exit;

// Whole-element bindings: a paragraph, heading or button whose content is one setting.
add_action( 'init', function () {
	register_block_bindings_source( 'elevation/settings', [
		'label'              => __( 'Church Settings', 'elevation-core' ),
		'get_value_callback' => function ( array $args ) {
			$value = elevation_public_setting( (string) ( $args['key'] ?? '' ) );
			return null === $value ? null : esc_html( (string) $value );
		},
	] );
} );

// Inline tokens inside ordinary text and attributes, e.g. "Sundays at {service.startTime}".
add_filter( 'render_block', function ( string $html ): string {
	return Tokens::replace( $html, 'elevation_public_setting' );
}, 20 );
