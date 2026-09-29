<?php
/**
 * The live stream (inside the consent gate) or the next scheduled one. With neither it renders an empty,
 * hidden marker so the live swap has something to replace.
 */
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

$elevation_live  = elevation_youtube_live();
$elevation_state = $elevation_live['state'];
$elevation_video = $elevation_live['video'];

if ( 'none' === $elevation_state || ! $elevation_video ) {
	echo '<div ' . get_block_wrapper_attributes( elevation_live_attrs( 'elevation/live-player', 'none', [ 'hidden' => 'hidden' ] ) ) . '></div>';
	return;
}
?>
<section <?php echo get_block_wrapper_attributes( elevation_live_attrs( 'elevation/live-player', $elevation_state, [ 'class' => 'alignfull ecm-section is-active has-global-padding' ] ) ); ?>>
	<div class="ecm-section__inner">
		<?php if ( 'live' === $elevation_state ) : ?>
			<div class="live-player">
				<div class="live-player__video">
					<?php echo render_block( [ 'blockName' => 'elevation/embed-gate', 'attrs' => [ 'kind' => 'video', 'src' => YouTube::embedUrl( $elevation_video['id'] ), 'title' => __( 'Watch the stream', 'elevation-core' ), 'link' => $elevation_video['url'] ], 'innerBlocks' => [], 'innerHTML' => '', 'innerContent' => [] ] ); // Escaped by the gate. ?>
				</div>
				<div class="live-player__text">
					<?php echo elevation_live_badge(); // Escaped inside. ?>
					<h2 class="wp-block-heading"><?php echo esc_html( $elevation_video['title'] ); ?></h2>
					<p><?php esc_html_e( "We're streaming right now — come and join us.", 'elevation-core' ); ?></p>
					<div class="wp-block-buttons">
						<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'Watch on YouTube', 'elevation-core' ); ?></a></div>
						<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/im-new"><?php esc_html_e( 'Join us in person', 'elevation-core' ); ?></a></div>
					</div>
				</div>
			</div>
		<?php else : ?>
			<div class="upcoming-stream">
				<div>
					<p class="is-style-eyebrow"><?php esc_html_e( 'Next stream', 'elevation-core' ); ?></p>
					<h2 class="wp-block-heading"><?php echo esc_html( $elevation_video['title'] ); ?></h2>
					<p class="upcoming-stream__when"><?php echo esc_html( YouTube::formatScheduled( $elevation_video['scheduledStart'] ) ); ?></p>
				</div>
				<div class="wp-block-buttons"><div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'Set a reminder', 'elevation-core' ); ?></a></div></div>
			</div>
		<?php endif; ?>
	</div>
</section>
