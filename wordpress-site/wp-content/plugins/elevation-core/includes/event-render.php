<?php
/** Shared event markup: the card (redesign event-card.tsx) and the "hide this section if no events" rule. */
use Elevation\Core\EventTime;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

/** @param bool $hidden Rendered with the hidden attribute: a past event the events-page calendar can reveal. */
function elevation_event_card( WP_Post $post, bool $hidden = false ): string {
	$e     = elevation_event( $post );
	$past  = ! EventTime::isUpcoming( $e['start'], $e['end'], new DateTimeImmutable( 'now' ) );
	$dates = implode( ',', EventTime::dayKeys( $e['start'], $e['end'] ) );
	$image = $e['image'] ? wp_get_attachment_image( $e['image'], 'large', false, [
		'alt'      => '',
		'sizes'    => '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
		'loading'  => 'lazy',
		'decoding' => 'async',
	] ) : '';
	$multi = EventTime::isMultiDay( $e['start'], $e['end'] );
	$when  = $multi ? EventTime::formatRange( $e['start'], $e['end'] ) : EventTime::formatTime( $e['start'], $e['end'], $e['tbc'] );
	$venue = '' !== $e['venue'] ? $e['venue'] : ( $e['online'] ? __( 'Online', 'elevation-core' ) : (string) elevation_setting( 'location.venue' ) );
	ob_start();
	?>
	<article class="event-card reveal<?php echo $past ? ' is-past' : ''; ?>" data-dates="<?php echo esc_attr( $dates ); ?>"<?php echo $hidden ? ' hidden' : ''; ?>>
		<a class="event-card__link" href="<?php echo esc_url( $e['url'] ); ?>">
			<div class="event-card__media">
				<?php echo $image ?: '<span class="event-card__placeholder" aria-hidden="true"></span>'; // wp_get_attachment_image() escapes. ?>
				<span class="event-card__chip">
					<span class="event-card__day"><?php echo esc_html( EventTime::dayNumber( $e['start'] ) ); ?></span>
					<span class="event-card__month"><?php echo esc_html( EventTime::monthShort( $e['start'] ) ); ?></span>
				</span>
			</div>
			<div class="event-card__body">
				<h3 class="event-card__title"><?php echo esc_html( $e['title'] ); ?></h3>
				<?php if ( '' !== $e['summary'] ) : ?>
					<p class="event-card__summary"><?php echo esc_html( $e['summary'] ); ?></p>
				<?php endif; ?>
				<div class="event-card__meta">
					<p><?php echo Icons::svg( $multi ? 'calendar-days' : 'clock' ); ?><?php echo esc_html( $when ); ?></p>
					<p><?php echo Icons::svg( $e['online'] ? 'monitor-play' : 'map-pin' ); ?><?php echo esc_html( $venue ); ?></p>
					<?php if ( $past ) : ?>
						<p class="event-card__finished"><?php echo Icons::svg( 'circle-check' ); ?><?php esc_html_e( 'This event has finished', 'elevation-core' ); ?></p>
					<?php endif; ?>
				</div>
			</div>
		</a>
	</article>
	<?php
	return (string) ob_get_clean();
}

/** Directions for the event's own venue when it has one, otherwise to the church (Church Settings). */
function elevation_event_maps_url( array $event ): string {
	return '' !== $event['venue']
		? 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $event['venue'] )
		: (string) elevation_setting( 'location.mapsUrl' );
}

// A group with the class "hide-if-no-events" disappears when nothing inside it rendered an event card.
add_filter( 'render_block_core/group', function ( string $html, array $block ): string {
	$classes = preg_split( '/\s+/', (string) ( $block['attrs']['className'] ?? '' ) ) ?: [];
	return in_array( 'hide-if-no-events', $classes, true ) && ! str_contains( $html, 'class="event-card' ) ? '' : $html;
}, 10, 2 );
