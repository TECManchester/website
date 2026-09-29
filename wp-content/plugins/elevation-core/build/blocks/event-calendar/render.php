<?php
/**
 * Month calendar of every published event. The dates are worked out here in London time; view.js only
 * draws them, so the calendar is hidden until it runs (the event list beside it works without it).
 */
use Elevation\Core\EventTime;
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_items = [];
foreach ( elevation_calendar_events() as $elevation_post ) {
	$elevation_e = elevation_event( $elevation_post );
	$elevation_t = EventTime::formatTime( $elevation_e['start'], $elevation_e['end'], $elevation_e['tbc'] );
	foreach ( EventTime::dayKeys( $elevation_e['start'], $elevation_e['end'] ) as $elevation_key ) {
		$elevation_items[] = [ 'date' => $elevation_key, 'title' => $elevation_e['title'], 'url' => $elevation_e['url'], 'time' => $elevation_t ];
	}
}

// Open on the month of the next event (or today, if it's already under way), not an empty current month.
$elevation_today = EventTime::todayKey( new DateTimeImmutable( 'now' ) );
$elevation_next  = elevation_upcoming_events( 1 );
$elevation_first = $elevation_next ? max( EventTime::dateKey( elevation_event( $elevation_next[0] )['start'] ), $elevation_today ) : $elevation_today;
?>
<div <?php echo get_block_wrapper_attributes( [
	'data-events' => (string) wp_json_encode( $elevation_items ),
	'data-month'  => substr( $elevation_first, 0, 7 ),
] ); ?>>
	<div class="event-calendar" hidden>
		<div class="event-calendar__head">
			<h3 class="event-calendar__title" aria-live="polite"></h3>
			<div class="event-calendar__nav">
				<button type="button" class="event-calendar__step" data-step="-1" aria-label="<?php esc_attr_e( 'Previous month', 'elevation-core' ); ?>"><?php echo Icons::svg( 'chevron-left' ); ?></button>
				<button type="button" class="event-calendar__step" data-step="1" aria-label="<?php esc_attr_e( 'Next month', 'elevation-core' ); ?>"><?php echo Icons::svg( 'chevron-right' ); ?></button>
			</div>
		</div>
		<div class="event-calendar__weekdays" aria-hidden="true"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
		<div class="event-calendar__grid" role="group" aria-label="<?php esc_attr_e( 'Events calendar', 'elevation-core' ); ?>"></div>
		<div class="event-calendar__selection" aria-live="polite"><ul class="event-calendar__list" hidden></ul></div>
	</div>
	<p class="event-calendar__caption" hidden><?php esc_html_e( 'Dates with a marker have something on. Tap one to see what.', 'elevation-core' ); ?></p>
</div>
