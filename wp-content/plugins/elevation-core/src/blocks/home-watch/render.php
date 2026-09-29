<?php
/**
 * Home watch section (spec §6.3): the live stream while streaming, else the latest finished video, else
 * the inner blocks (the Plan 2 "Missed a Sunday?" section). Everything links to YouTube. The tile image
 * is the site's own copy of the thumbnail, or the placeholder (spec §12).
 */
use Elevation\Core\Icons;
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

$elevation_live  = elevation_youtube_live();
$elevation_is_on = 'live' === $elevation_live['state'];
$elevation_video = $elevation_is_on ? $elevation_live['video'] : ( YouTube::past( elevation_youtube_feed()['videos'], 1 )[0] ?? null );

if ( ! $elevation_video ) {
	echo '<div ' . get_block_wrapper_attributes( elevation_live_attrs( 'elevation/home-watch', $elevation_live['state'] ) ) . '>' . $content . '</div>';
	return;
}
$elevation_thumb = elevation_youtube_thumb_url( $elevation_video['id'] );
$elevation_cta   = $elevation_is_on ? __( 'Watch live', 'elevation-core' ) : __( 'Watch now', 'elevation-core' );
?>
<div <?php echo get_block_wrapper_attributes( elevation_live_attrs( 'elevation/home-watch', $elevation_live['state'], [ 'class' => 'split split--watch' ] ) ); ?>>
	<a class="watch-tile reveal" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener" aria-label="<?php echo str_replace( '{', '&#123;', esc_attr( $elevation_cta . ': ' . $elevation_video['title'] . ' ' . __( '(opens YouTube in a new tab)', 'elevation-core' ) ) ); ?>">
		<?php if ( '' !== $elevation_thumb ) : ?>
			<img class="watch-tile__image" src="<?php echo esc_url( $elevation_thumb ); ?>" alt="" loading="lazy" decoding="async">
		<?php endif; ?>
		<span class="watch-tile__badge"><?php echo $elevation_is_on ? elevation_live_badge() : '<span class="watch-tile__chip">' . esc_html__( 'Latest message', 'elevation-core' ) . '</span>'; // Escaped. ?></span>
		<span class="watch-tile__play wp-block-elevation-icon" style="--icon-size:30px"><?php echo Icons::svg( 'play', 'is-filled' ); ?></span>
	</a>
	<div class="watch-intro reveal">
		<p class="is-style-eyebrow"><?php echo $elevation_is_on ? esc_html__( 'On air now', 'elevation-core' ) : esc_html__( 'Messages', 'elevation-core' ); ?></p>
		<h2 class="wp-block-heading"><?php echo elevation_youtube_text( $elevation_video['title'] ); ?></h2>
		<p><?php echo $elevation_is_on
			? esc_html__( "We're streaming right now — join us from wherever you are.", 'elevation-core' )
			: esc_html__( "Full services and recent messages go up on our YouTube channel. Subscribe and you'll know the moment a new one lands.", 'elevation-core' ); ?></p>
		<div class="wp-block-buttons">
			<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( $elevation_video['url'] ); ?>" target="_blank" rel="noreferrer noopener"><?php echo esc_html( $elevation_cta ); ?></a></div>
			<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/watch"><?php esc_html_e( 'All messages', 'elevation-core' ); ?></a></div>
		</div>
	</div>
</div>
