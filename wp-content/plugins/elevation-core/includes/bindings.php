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

/**
 * Replace inline tokens in a string. $escape true for HTML contexts (the default), false for plain text
 * that the caller escapes itself (document titles, SEO meta, JSON-LD).
 */
function elevation_replace_tokens( string $text, bool $escape = true ): string {
	return Tokens::replace( $text, 'elevation_public_setting', $escape );
}

// Inline tokens inside ordinary text and attributes, e.g. "Sundays at {service.startTime}".
add_filter( 'render_block', fn ( string $html ): string => elevation_replace_tokens( $html ), 20 );

// Places that read raw post_content without render_block: excerpts, document title, SmartCrawl's meta output.
$elevation_html_filters = [ 'get_the_excerpt', 'the_excerpt', 'wp_trim_excerpt' ];
foreach ( $elevation_html_filters as $hook ) {
	add_filter( $hook, fn ( $text ) => is_string( $text ) ? elevation_replace_tokens( $text ) : $text, 20 );
}
unset( $elevation_html_filters, $hook );

add_filter( 'document_title_parts', function ( $parts ) {
	return is_array( $parts ) ? array_map( fn ( $part ) => is_string( $part ) ? elevation_replace_tokens( $part, false ) : $part, $parts ) : $parts;
}, 20 );

// SmartCrawl passes plain text and escapes it when printing, so no HTML escaping here.
foreach ( [
	'smartcrawl_get_meta_title',
	'smartcrawl_get_meta_description',
	'smartcrawl_get_opengraph_title',
	'smartcrawl_get_opengraph_description',
	'smartcrawl_get_twitter_title',
	'smartcrawl_get_twitter_description',
	'wds-schema-post-data-name',
	'wds-schema-site-data-description',
] as $hook ) {
	add_filter( $hook, fn ( $text ) => is_string( $text ) ? elevation_replace_tokens( $text, false ) : $text, 20 );
}
unset( $hook );
