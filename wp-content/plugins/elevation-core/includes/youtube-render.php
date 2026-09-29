<?php
/**
 * Video card (redesign video-card.tsx) and live badge. Cards open YouTube in a new tab (spec §6.3). The
 * image is the site's own copy (includes/youtube.php) or the ink placeholder — never i.ytimg.com (§12).
 */
use Elevation\Core\Icons;
use Elevation\Core\YouTube;

defined( 'ABSPATH' ) || exit;

function elevation_video_card( array $video ): string {
	$thumb    = elevation_youtube_thumb_url( (string) ( $video['id'] ?? '' ) );
	$duration = YouTube::formatDuration( (int) ( $video['durationSecs'] ?? 0 ) );
	$date     = YouTube::displayDate( (string) ( $video['publishedAt'] ?? '' ) );
	ob_start();
	?>
	<article class="video-card reveal">
		<a class="video-card__link" href="<?php echo esc_url( (string) $video['url'] ); ?>" target="_blank" rel="noreferrer noopener">
			<div class="video-card__media">
				<?php if ( '' !== $thumb ) : ?>
					<img src="<?php echo esc_url( $thumb ); ?>" alt="" loading="lazy" decoding="async">
				<?php else : ?>
					<span class="video-card__placeholder" aria-hidden="true"></span>
				<?php endif; ?>
				<span class="video-card__play" aria-hidden="true"><?php echo Icons::svg( 'play', 'is-filled' ); ?></span>
				<?php if ( '' !== $duration ) : ?>
					<span class="video-card__duration"><span class="screen-reader-text"><?php esc_html_e( 'Length', 'elevation-core' ); ?> </span><?php echo esc_html( $duration ); ?></span>
				<?php endif; ?>
			</div>
			<h3 class="video-card__title"><?php echo esc_html( (string) $video['title'] ); ?><span class="screen-reader-text"> <?php esc_html_e( '(opens YouTube in a new tab)', 'elevation-core' ); ?></span></h3>
			<?php if ( '' !== $date ) : ?>
				<p class="video-card__date"><?php echo esc_html( $date ); ?></p>
			<?php endif; ?>
		</a>
	</article>
	<?php
	return (string) ob_get_clean();
}

function elevation_live_badge(): string {
	return '<span class="live-badge"><span class="live-badge__dot" aria-hidden="true"></span>' . esc_html__( 'Live now', 'elevation-core' ) . '</span>';
}
