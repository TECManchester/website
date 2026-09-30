<?php
/** The Connect Group card (directory) and mini card (Get Involved). Escaped here; callers echo. */
defined( 'ABSPATH' ) || exit;

function elevation_group_join_url( int $id, array $filters = [] ): string {
	return add_query_arg( array_filter( $filters + [ 'group' => $id ] ), home_url( '/connect-groups/' ) ) . '#join-group';
}

function elevation_group_card( WP_Post $post, array $filters = [] ): string {
	$group = elevation_group( $post );
	$meta  = implode( " \u{00B7} ", array_filter( [ $group['category'], $group['area'] ] ) );
	$label = $group['accepting'] ? __( 'Ask to join', 'elevation-core' ) : __( 'Full right now, ask about the next one', 'elevation-core' );
	ob_start();
	?>
	<article class="group-card reveal" id="group-<?php echo esc_attr( $group['slug'] ); ?>">
		<div class="group-card__media">
			<?php
			echo $group['image']
				? wp_get_attachment_image( $group['image'], 'medium_large', false, [ 'class' => 'group-card__img', 'alt' => '', 'loading' => 'lazy' ] )
				: '<span class="group-card__placeholder" aria-hidden="true"></span>';
			?>
		</div>
		<div class="group-card__body">
			<?php if ( '' !== $meta ) : ?><p class="group-card__eyebrow"><?php echo esc_html( $meta ); ?></p><?php endif; ?>
			<h3 class="group-card__name"><?php echo esc_html( $group['name'] ); ?></h3>
			<p class="group-card__when"><?php echo esc_html( '' !== $group['when'] ? $group['when'] : __( 'Day and time to be confirmed', 'elevation-core' ) ); ?></p>
			<?php if ( '' !== $group['leader'] ) : ?><p class="group-card__leader"><?php echo esc_html( sprintf( __( 'Led by %s', 'elevation-core' ), $group['leader'] ) ); ?></p><?php endif; ?>
			<?php if ( '' !== trim( $group['description'] ) ) : ?><p class="group-card__description"><?php echo esc_html( $group['description'] ); ?></p><?php endif; ?>
			<?php if ( $group['towns'] ) : ?>
				<details class="group-card__towns"><summary><?php esc_html_e( 'Towns covered', 'elevation-core' ); ?></summary><p><?php echo esc_html( implode( ', ', $group['towns'] ) ); ?></p></details>
			<?php endif; ?>
			<p class="group-card__status <?php echo $group['accepting'] ? 'is-open' : 'is-full'; ?>"><?php echo $group['accepting'] ? esc_html__( 'Open to new members', 'elevation-core' ) : esc_html__( 'Full right now', 'elevation-core' ); ?></p>
			<div class="wp-block-buttons"><div class="wp-block-button<?php echo $group['accepting'] ? '' : ' is-style-ghost'; ?>"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( elevation_group_join_url( $group['id'], $filters ) ); ?>"><?php echo esc_html( $label ); ?><span class="screen-reader-text"> — <?php echo esc_html( $group['name'] ); ?></span></a></div></div>
		</div>
	</article>
	<?php
	return (string) ob_get_clean();
}

function elevation_group_mini( WP_Post $post ): string {
	$group = elevation_group( $post );
	$meta  = '' !== $group['area'] ? implode( " \u{00B7} ", array_filter( [ $group['area'], $group['when'] ] ) ) : $group['category'];
	return sprintf(
		'<li class="group-mini"><a href="%s"><span class="group-mini__name">%s</span>%s</a></li>',
		esc_url( home_url( '/connect-groups/' ) . '#group-' . $group['slug'] ),
		esc_html( $group['name'] ),
		'' !== $meta ? '<span class="group-mini__meta">' . esc_html( $meta ) . '</span>' : ''
	);
}
