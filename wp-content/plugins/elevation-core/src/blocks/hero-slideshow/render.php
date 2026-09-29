<?php
/**
 * Hero photos from Church Settings. Slides whose image was deleted are skipped; with none left the
 * block renders the redesign's gradient, so the hero never looks broken.
 */
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

$elevation_slides = array_values( array_filter(
	Settings::heroSlides( elevation_settings() ),
	static fn ( array $slide ): bool => (bool) wp_get_attachment_image_url( $slide['image'], 'full' )
) );
$elevation_wrapper = [ 'class' => $elevation_slides ? 'has-slides' : 'is-empty' ];
if ( ! $elevation_slides ) {
	$elevation_wrapper['aria-hidden'] = 'true';
}
?>
<div <?php echo get_block_wrapper_attributes( $elevation_wrapper ); ?>>
	<?php foreach ( $elevation_slides as $elevation_i => $elevation_slide ) :
		$elevation_attrs = [
			'class'    => 'hero-slideshow__image',
			'alt'      => '' !== $elevation_slide['alt'] ? $elevation_slide['alt'] : (string) get_post_meta( $elevation_slide['image'], '_wp_attachment_image_alt', true ),
			'sizes'    => '100vw',
			'style'    => 'object-position:' . $elevation_slide['focal'],
			'loading'  => $elevation_i <= 1 ? 'eager' : 'lazy',
			'decoding' => 'async',
		];
		if ( 0 === $elevation_i ) {
			$elevation_attrs['fetchpriority'] = 'high';
		}
		?>
		<div class="hero-slideshow__slide<?php echo 0 === $elevation_i ? ' is-active' : ''; ?>">
			<?php echo wp_get_attachment_image( $elevation_slide['image'], 'full', false, $elevation_attrs ); ?>
		</div>
	<?php endforeach; ?>
	<?php if ( $elevation_slides ) : ?>
		<span class="hero-slideshow__scrim hero-slideshow__scrim--left" aria-hidden="true"></span>
		<span class="hero-slideshow__scrim hero-slideshow__scrim--bottom" aria-hidden="true"></span>
		<span class="hero-slideshow__scrim hero-slideshow__scrim--top" aria-hidden="true"></span>
	<?php endif; ?>
</div>
