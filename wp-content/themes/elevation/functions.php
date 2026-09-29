<?php
defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', function () {
	add_editor_style( [ 'assets/css/site.css', 'assets/css/events.css' ] );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'elevation-site', get_theme_file_uri( 'assets/css/site.css' ), [], (string) filemtime( get_theme_file_path( 'assets/css/site.css' ) ) );
	wp_enqueue_style( 'elevation-events', get_theme_file_uri( 'assets/css/events.css' ), [ 'elevation-site' ], (string) filemtime( get_theme_file_path( 'assets/css/events.css' ) ) );
	wp_enqueue_script( 'elevation-header', get_theme_file_uri( 'assets/js/header.js' ), [], (string) filemtime( get_theme_file_path( 'assets/js/header.js' ) ), [ 'strategy' => 'defer', 'in_footer' => true ] );
	wp_enqueue_script( 'elevation-reveal', get_theme_file_uri( 'assets/js/reveal.js' ), [], (string) filemtime( get_theme_file_path( 'assets/js/reveal.js' ) ), [ 'strategy' => 'defer', 'in_footer' => true ] );
} );

add_action( 'init', function () {
	$styles = [
		'core/button'    => [ 'navy' => 'Navy', 'ghost' => 'Ghost', 'ghost-on-dark' => 'Ghost on dark' ],
		'core/paragraph' => [ 'eyebrow' => 'Eyebrow', 'eyebrow-on-ink' => 'Eyebrow on dark', 'lead' => 'Lead', 'lead-on-ink' => 'Lead on dark' ],
		'core/group'     => [
			'card'        => 'Card',
			'card-ink'    => 'Card on dark',
			'card-flat'   => 'Flat card',
			'strip-green' => 'Green strip',
			'panel'       => 'Grey panel',
			'panel-alert' => 'Alert panel',
			'page-hero'   => 'Page hero',
			'section-ink' => 'Dark section',
		],
		'core/image'     => [ 'rounded-2xl' => 'Rounded' ],
		'core/list'      => [ 'badges' => 'Badges' ],
		'core/details'   => [ 'accordion' => 'Accordion' ],
		'core/cover'     => [ 'portrait' => 'Portrait card' ],
	];
	foreach ( $styles as $block => $variants ) {
		foreach ( $variants as $name => $label ) {
			register_block_style( $block, [ 'name' => $name, 'label' => $label ] );
		}
	}
	register_block_pattern_category( 'elevation', [ 'label' => __( 'Elevation', 'elevation' ) ] );
} );
