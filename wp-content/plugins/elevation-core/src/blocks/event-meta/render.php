<?php
/** One part of the event being viewed (redesign events/[slug]/page.tsx). Nothing outside an event. */
use Elevation\Core\EventTime;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_post = get_post( (int) ( $block->context['postId'] ?? get_the_ID() ) );
if ( ! $elevation_post || 'event' !== $elevation_post->post_type ) {
	return;
}
$elevation_e    = elevation_event( $elevation_post );
$elevation_part = (string) ( $attributes['part'] ?? 'details' );
$elevation_wrap = static fn ( string $html ): string => '' === $html ? '' : '<div ' . get_block_wrapper_attributes( [ 'class' => 'event-meta event-meta--' . sanitize_html_class( $elevation_part ) ] ) . '>' . $html . '</div>';
$elevation_full = '' !== $elevation_e['venue'] ? $elevation_e['venue'] : (string) elevation_setting( 'location.full' );

switch ( $elevation_part ) {
	case 'back':
		echo $elevation_wrap( '<a class="event-back" href="' . esc_url( (string) get_post_type_archive_link( 'event' ) ) . '">' . Icons::svg( 'arrow-left' ) . esc_html__( 'All events', 'elevation-core' ) . '</a>' );
		break;

	case 'summary':
		echo $elevation_wrap( '' === $elevation_e['summary'] ? '' : '<p class="event-summary">' . esc_html( $elevation_e['summary'] ) . '</p>' );
		break;

	case 'details':
		$elevation_date = EventTime::isMultiDay( $elevation_e['start'], $elevation_e['end'] ) ? EventTime::formatRange( $elevation_e['start'], $elevation_e['end'] ) : EventTime::formatDate( $elevation_e['start'] );
		$elevation_rows = [
			[ 'calendar-days', $elevation_date ],
			[ 'clock', EventTime::formatTime( $elevation_e['start'], $elevation_e['end'], $elevation_e['tbc'] ) ],
			[ 'map-pin', $elevation_full ],
		];
		$elevation_html = '';
		foreach ( $elevation_rows as [ $elevation_icon, $elevation_text ] ) {
			if ( '' !== $elevation_text ) {
				$elevation_html .= '<li>' . Icons::svg( $elevation_icon ) . '<span>' . esc_html( $elevation_text ) . '</span></li>';
			}
		}
		echo $elevation_wrap( '' === $elevation_html ? '' : '<ul class="event-details">' . $elevation_html . '</ul>' );
		break;

	case 'cta':
		if ( '' !== $elevation_e['cta_url'] ) {
			$elevation_external = str_starts_with( $elevation_e['cta_url'], 'http' );
			echo $elevation_wrap( sprintf(
				'<div class="wp-block-buttons"><div class="wp-block-button is-size-lg"><a class="wp-block-button__link wp-element-button" href="%s"%s>%s</a></div></div>',
				esc_url( $elevation_e['cta_url'] ),
				$elevation_external ? ' target="_blank" rel="noreferrer noopener"' : '',
				esc_html( '' !== $elevation_e['cta_label'] ? $elevation_e['cta_label'] : __( 'Register', 'elevation-core' ) )
			) );
		}
		break;

	case 'getting-there':
		$elevation_lines = array_filter( array_map( 'trim', explode( ',', $elevation_full ) ) );
		$elevation_addr  = implode( '', array_map( static fn ( $l ) => '<p>' . esc_html( $l ) . '</p>', $elevation_lines ) );
		echo $elevation_wrap( sprintf(
			'<aside class="event-getting-there"><h2>%s</h2><address>%s</address><div class="wp-block-buttons is-vertical"><div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="%s" target="_blank" rel="noreferrer noopener">%s</a></div><div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/contact">%s</a></div></div></aside>',
			esc_html__( 'Getting there', 'elevation-core' ),
			$elevation_addr,
			esc_url( elevation_event_maps_url( $elevation_e ) ),
			esc_html__( 'Get directions', 'elevation-core' ),
			esc_html__( 'Ask a question', 'elevation-core' )
		) );
		break;

	case 'no-description':
		if ( '' === trim( wp_strip_all_tags( excerpt_remove_blocks( $elevation_post->post_content ) ) ) ) {
			echo $elevation_wrap( '<p class="event-no-description">' . esc_html__( 'More details coming soon. In the meantime, just turn up — you’re very welcome.', 'elevation-core' ) . '</p>' );
		}
		break;
}
