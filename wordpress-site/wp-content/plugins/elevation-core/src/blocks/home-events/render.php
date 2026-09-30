<?php
/**
 * Home "What's on" (redesign home-events-section.tsx): the next three events with the weekly strip under
 * them, or the inner blocks (the Sunday card and "More coming soon") when nothing is coming up.
 * Tokens in the strip are replaced by the render_block filter (includes/bindings.php).
 */
defined( 'ABSPATH' ) || exit;

$elevation_events = elevation_upcoming_events( 3 );
if ( ! $elevation_events ) {
	echo $content;
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'home-events' ] ); ?>>
	<div class="event-grid event-grid--cols-3">
		<?php foreach ( $elevation_events as $elevation_event ) {
			echo elevation_event_card( $elevation_event ); // Escaped inside.
		} ?>
	</div>
	<div class="home-events__strip reveal">
		<div class="home-events__strip-text">
			<p class="is-style-eyebrow"><?php esc_html_e( 'Every week', 'elevation-core' ); ?></p>
			<h3>{service.day} Gathering · {service.startTime}</h3>
			<p class="home-events__place">{location.full}</p>
		</div>
		<div class="wp-block-buttons"><div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="/im-new"><?php esc_html_e( 'Plan your visit', 'elevation-core' ); ?></a></div></div>
	</div>
</div>
