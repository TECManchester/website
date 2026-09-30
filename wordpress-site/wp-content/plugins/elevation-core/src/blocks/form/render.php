<?php
/**
 * One of the church's Fluent Forms, found by its seed key (spec §6.10). The wrapper carries "form-box",
 * which the theme's forms.css styles. A missing form shows an "email us" line instead of nothing.
 */
defined( 'ABSPATH' ) || exit;

$elevation_key   = sanitize_key( (string) ( $attributes['form'] ?? '' ) );
$elevation_id    = elevation_form_id( $elevation_key );
$elevation_class = 'form-box form-box--' . $elevation_key;

if ( ! $elevation_id || ! shortcode_exists( 'fluentform' ) ) {
	?>
	<div <?php echo get_block_wrapper_attributes( [ 'class' => $elevation_class . ' form-box--missing' ] ); ?>>
		<p><?php esc_html_e( "This form isn't available right now. Please email us at", 'elevation-core' ); ?> <a href="mailto:{contact.email}">{contact.email}</a>.</p>
	</div>
	<?php
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => $elevation_class ] ); ?>>
	<?php do_action( 'elevation_form_before', $elevation_key ); ?>
	<?php echo do_shortcode( sprintf( '[fluentform id="%d"]', $elevation_id ) ); // Fluent Forms escapes its own markup. ?>
</div>
