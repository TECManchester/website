<?php
defined( 'ABSPATH' ) || exit;

const ELEVATION_THEME_VERSION = '0.1.0';

add_action( 'after_setup_theme', function () {
	add_editor_style( 'assets/css/site.css' );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'elevation-site', get_theme_file_uri( 'assets/css/site.css' ), [], ELEVATION_THEME_VERSION );
	wp_enqueue_script( 'elevation-header', get_theme_file_uri( 'assets/js/header.js' ), [], ELEVATION_THEME_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
} );

add_action( 'init', function () {
	$styles = [
		'core/button'    => [ 'navy' => 'Navy', 'ghost' => 'Ghost', 'ghost-on-dark' => 'Ghost on dark' ],
		'core/paragraph' => [ 'eyebrow' => 'Eyebrow', 'eyebrow-on-ink' => 'Eyebrow on dark' ],
		'core/group'     => [ 'card' => 'Card', 'card-ink' => 'Card on dark', 'strip-green' => 'Green strip' ],
		'core/image'     => [ 'rounded-2xl' => 'Rounded' ],
	];
	foreach ( $styles as $block => $variants ) {
		foreach ( $variants as $name => $label ) {
			register_block_style( $block, [ 'name' => $name, 'label' => $label ] );
		}
	}
	register_block_pattern_category( 'elevation', [ 'label' => __( 'Elevation', 'elevation' ) ] );
} );
