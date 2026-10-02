<?php
/**
 * Home "What's on" (redesign home-events-section.tsx): the next three events, or the inner blocks
 * ("More coming soon") when nothing is coming up.
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
</div>
