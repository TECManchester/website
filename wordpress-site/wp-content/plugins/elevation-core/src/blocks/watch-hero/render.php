<?php
/** Watch page hero: "Watch & grow", or "We're live right now" while streaming. */
defined( 'ABSPATH' ) || exit;

$elevation_state = elevation_youtube_live()['state'];
$elevation_live  = 'live' === $elevation_state;
?>
<section <?php echo get_block_wrapper_attributes( elevation_live_attrs( 'elevation/watch-hero', $elevation_state, [ 'class' => 'alignfull is-style-page-hero has-white-color has-ink-background-color has-text-color has-background watch-hero has-global-padding' ] ) ); ?>>
	<div class="ecm-section__inner">
		<p class="is-style-eyebrow-on-ink"><?php esc_html_e( 'Messages', 'elevation-core' ); ?></p>
		<h1 class="wp-block-heading has-white-color has-text-color"><?php echo $elevation_live ? esc_html__( "We're live right now", 'elevation-core' ) : esc_html__( 'Watch & grow', 'elevation-core' ); ?></h1>
		<p class="is-style-lead-on-ink"><?php echo $elevation_live
			? esc_html__( 'Join the service from wherever you are.', 'elevation-core' )
			: esc_html__( "Catch this week's message or dig into the archive. Live every {service.day} at {service.startTime}.", 'elevation-core' ); ?></p>
	</div>
</section>
