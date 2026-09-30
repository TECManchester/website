<?php
/**
 * Upcoming event cards. With no upcoming events it shows its inner blocks (the empty state), which may
 * be nothing at all.
 */
defined( 'ABSPATH' ) || exit;

$elevation_limit   = max( 1, min( 24, (int) ( $attributes['limit'] ?? 24 ) ) );
$elevation_columns = 3 === (int) ( $attributes['columns'] ?? 2 ) ? 3 : 2;
$elevation_exclude = empty( $attributes['excludeCurrent'] ) ? 0 : (int) ( $block->context['postId'] ?? get_the_ID() );
$elevation_events  = elevation_upcoming_events( $elevation_limit, $elevation_exclude );

if ( ! $elevation_events ) {
	echo $content; // Inner blocks, already rendered.
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'event-grid event-grid--cols-' . $elevation_columns ] ); ?>>
	<?php foreach ( $elevation_events as $elevation_event ) {
		echo elevation_event_card( $elevation_event ); // Escaped inside.
	} ?>
</div>
