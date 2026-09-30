<?php
/** Get Involved #connect-groups (spec §6.6): the first three groups and "Browse all groups", or the inner blocks. */
defined( 'ABSPATH' ) || exit;

$elevation_groups = elevation_groups( [], 3 );
if ( ! $elevation_groups ) {
	echo $content;
	return;
}
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'featured-groups' ] ); ?>>
	<ul class="group-mini-list">
		<?php foreach ( $elevation_groups as $elevation_group ) {
			echo elevation_group_mini( $elevation_group ); // Escaped inside.
		} ?>
	</ul>
	<div class="wp-block-buttons"><div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( home_url( '/connect-groups/' ) ); ?>"><?php esc_html_e( 'Browse all groups', 'elevation-core' ); ?></a></div></div>
</div>
