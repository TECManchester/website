<?php
/**
 * Upcoming event cards. With no upcoming events it shows its inner blocks (the empty state), which may
 * be nothing at all.
 *
 * With showPast (the events page), finished events are rendered too, hidden, each card carrying the dates
 * it is on; view.js shows the matching cards when the events calendar announces a picked date.
 */
defined( 'ABSPATH' ) || exit;

$elevation_limit     = max( 1, min( 24, (int) ( $attributes['limit'] ?? 24 ) ) );
$elevation_columns   = 3 === (int) ( $attributes['columns'] ?? 2 ) ? 3 : 2;
$elevation_exclude   = empty( $attributes['excludeCurrent'] ) ? 0 : (int) ( $block->context['postId'] ?? get_the_ID() );
$elevation_show_past = ! empty( $attributes['showPast'] );
$elevation_events    = elevation_upcoming_events( $elevation_limit, $elevation_exclude );
$elevation_past      = $elevation_show_past ? elevation_past_events( 120, $elevation_exclude ) : [];
$elevation_grid      = 'event-grid event-grid--cols-' . $elevation_columns;

if ( ! $elevation_events && ! $elevation_past ) {
	echo $content; // Inner blocks, already rendered.
	return;
}

if ( ! $elevation_show_past ) : ?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => $elevation_grid ] ); ?>>
	<?php foreach ( $elevation_events as $elevation_event ) {
		echo elevation_event_card( $elevation_event ); // Escaped inside.
	} ?>
</div>
<?php return; endif; ?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'event-grid-wrap' ] ); ?>>
	<div class="events-filter" hidden>
		<p class="events-filter__text" aria-live="polite"></p>
		<button type="button" class="events-filter__reset"><?php esc_html_e( 'Show upcoming events', 'elevation-core' ); ?></button>
	</div>
	<div class="<?php echo esc_attr( $elevation_grid ); ?>"<?php echo $elevation_events ? '' : ' hidden'; ?>>
		<?php foreach ( $elevation_events as $elevation_event ) {
			echo elevation_event_card( $elevation_event ); // Escaped inside.
		}
		foreach ( $elevation_past as $elevation_event ) {
			echo elevation_event_card( $elevation_event, true );
		} ?>
	</div>
	<div class="event-grid__empty"<?php echo $elevation_events ? ' hidden' : ''; ?>><?php echo $content; ?></div>
</div>
