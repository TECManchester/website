<?php
/**
 * Watch → "Recent messages" (spec §6.3): the channel's 12 latest finished live streams, or the redesign's
 * fallback panel. The section turns grey under an active live or upcoming player (youtube.css).
 */
use Elevation\Core\Icons;
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

// Icons here are printed by hand, so load the icon block's stylesheet (it sizes the SVG).
wp_enqueue_style( generate_block_asset_handle( 'elevation/icon', 'style' ) );

$elevation_feed   = elevation_youtube_feed();
$elevation_videos = YouTube::past( $elevation_feed['videos'], 12 );
?>
<section <?php echo get_block_wrapper_attributes( [ 'class' => 'alignfull ecm-section watch-messages has-global-padding' ] ); ?>>
	<div class="ecm-section__inner">
		<?php if ( $elevation_videos ) : ?>
			<div class="section-heading">
				<p class="is-style-eyebrow"><?php esc_html_e( 'Catch up', 'elevation-core' ); ?></p>
				<h2 class="wp-block-heading"><?php esc_html_e( 'Recent messages', 'elevation-core' ); ?></h2>
				<p class="is-style-lead"><?php esc_html_e( 'Straight from our YouTube channel — this list updates itself.', 'elevation-core' ); ?></p>
			</div>
			<div class="video-grid">
				<?php foreach ( $elevation_videos as $elevation_video ) {
					echo elevation_video_card( $elevation_video ); // Escaped inside.
				} ?>
			</div>
			<div class="wp-block-buttons watch-messages__more">
				<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'See everything on YouTube', 'elevation-core' ); ?></a></div>
			</div>
		<?php else : ?>
			<div class="panel-watch">
				<span class="wp-block-elevation-icon" style="--icon-size:40px"><?php echo Icons::svg( 'monitor-play' ); ?></span>
				<h2 class="wp-block-heading"><?php esc_html_e( 'Every message, on our channel', 'elevation-core' ); ?></h2>
				<p><?php echo 'failed' === $elevation_feed['status']
					? esc_html__( "We couldn't load the archive just now. It's all on YouTube in the meantime.", 'elevation-core' )
					: esc_html__( "Full services and recent messages are on YouTube. Subscribe and you'll know the moment a new one lands.", 'elevation-core' ); ?></p>
				<div class="wp-block-buttons is-content-justification-center"><div class="wp-block-button is-size-lg"><a class="wp-block-button__link wp-element-button" href="{socials.youtube.url}" target="_blank" rel="noreferrer noopener"><?php esc_html_e( 'Watch on YouTube', 'elevation-core' ); ?></a></div></div>
			</div>
		<?php endif; ?>
	</div>
</section>
