<?php
/**
 * Placeholder with a load button; the iframe waits in a <template> until consent.js opens it.
 * Sources outside EmbedGate's allow-list render nothing.
 */
use Elevation\Core\EmbedGate;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_kind = (string) ( $attributes['kind'] ?? 'map' );
$elevation_src  = (string) ( $attributes['src'] ?? '' );
$elevation_link = (string) ( $attributes['link'] ?? '' );
if ( 'map' === $elevation_kind ) {
	$elevation_src  = '' !== $elevation_src ? $elevation_src : (string) elevation_setting( 'location.embedUrl' );
	$elevation_link = '' !== $elevation_link ? $elevation_link : (string) elevation_setting( 'location.mapsUrl' );
}
$elevation_src  = EmbedGate::allowedSrc( $elevation_kind, $elevation_src );
$elevation_copy = EmbedGate::copy( $elevation_kind );
if ( null === $elevation_src || ! $elevation_copy ) {
	return;
}
$elevation_title       = '' !== (string) ( $attributes['title'] ?? '' ) ? (string) $attributes['title'] : $elevation_copy['title'];
$elevation_frame_title = 'map' === $elevation_kind ? 'Map showing ' . elevation_setting( 'location.full' ) : $elevation_title;
$elevation_height      = max( 0, (int) ( $attributes['height'] ?? 0 ) );
$elevation_ratio       = in_array( $attributes['aspectRatio'] ?? '', [ '16/9', '4/3' ], true ) ? $attributes['aspectRatio'] : '16/9';
$elevation_style       = $elevation_height > 0 ? 'height:' . $elevation_height . 'px' : 'aspect-ratio:' . $elevation_ratio;
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'is-kind-' . $elevation_kind, 'style' => $elevation_style, 'data-ecm-embed' => $elevation_kind ] ); ?>>
	<div class="embed-gate__placeholder">
		<span class="embed-gate__icon"><?php echo Icons::svg( $elevation_copy['icon'] ); ?></span>
		<p class="embed-gate__title"><?php echo esc_html( $elevation_title ); ?></p>
		<button type="button" class="embed-gate__button" data-ecm-embed-load disabled><?php echo Icons::svg( $elevation_copy['icon'] ); ?><?php echo esc_html( $elevation_copy['button'] ); ?></button>
		<p class="embed-gate__note"><?php echo esc_html( $elevation_copy['note'] ); ?><?php if ( '' !== $elevation_link ) : ?> · <a href="<?php echo esc_url( $elevation_link ); ?>" target="_blank" rel="noreferrer">Open in a new tab</a><?php endif; ?></p>
	</div>
	<template><iframe src="<?php echo esc_url( $elevation_src ); ?>" title="<?php echo esc_attr( $elevation_frame_title ); ?>" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></template>
</div>
