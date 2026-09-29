<?php
/** An allow-listed Lucide icon (see src/Icons.php). */
use Elevation\Core\Icons;

defined( 'ABSPATH' ) || exit;

$elevation_svg = Icons::svg( (string) ( $attributes['name'] ?? '' ), empty( $attributes['filled'] ) ? '' : 'is-filled' );
if ( '' === $elevation_svg ) {
	return;
}
$elevation_size = max( 12, min( 96, (int) ( $attributes['size'] ?? 24 ) ) );
?>
<span <?php echo get_block_wrapper_attributes( [ 'style' => '--icon-size:' . $elevation_size . 'px' ] ); ?>><?php echo $elevation_svg; // Built from the fixed allow-list. ?></span>
