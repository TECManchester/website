<?php
/**
 * The /connect-groups directory (spec §6.6): a filter form (area, type, day; plain GET, so it works without
 * JavaScript) and the group cards. With no published groups, the inner blocks are shown instead.
 */
use Elevation\Core\GroupFields;

defined( 'ABSPATH' ) || exit;

$elevation_all = elevation_groups();
if ( ! $elevation_all ) {
	echo $content;
	return;
}
$elevation_terms   = static function ( string $taxonomy ): array {
	$terms = get_terms( [ 'taxonomy' => $taxonomy, 'hide_empty' => true ] );
	return is_array( $terms ) ? $terms : [];
};
$elevation_areas   = $elevation_terms( 'group_area' );
$elevation_types   = $elevation_terms( 'group_category' );
$elevation_filters = GroupFields::filters( wp_unslash( $_GET ), wp_list_pluck( $elevation_areas, 'slug' ), wp_list_pluck( $elevation_types, 'slug' ) ); // phpcs:ignore WordPress.Security.NonceVerification -- read-only filters.
$elevation_days    = array_values( array_intersect( array_keys( GroupFields::DAYS ), array_map( static fn ( $p ) => GroupFields::day( get_post_meta( $p->ID, 'group_meeting_day', true ) ), $elevation_all ) ) );
if ( ! in_array( $elevation_filters['meets'], $elevation_days, true ) ) {
	$elevation_filters['meets'] = ''; // A day nobody meets on isn't offered, so it isn't applied either.
}
$elevation_active  = array_filter( $elevation_filters );
$elevation_groups  = $elevation_active ? elevation_groups( $elevation_filters ) : $elevation_all;
$elevation_base    = home_url( '/connect-groups/' );

// Every town any published group covers, for the town box's suggestions.
$elevation_towns = [];
foreach ( $elevation_all as $elevation_post ) {
	foreach ( elevation_group( $elevation_post )['towns'] as $elevation_town ) {
		$elevation_towns[ mb_strtolower( $elevation_town ) ] = $elevation_town;
	}
}
natcasesort( $elevation_towns );

// A town search keeps the groups covering it (and the other filters still apply). A town nobody covers shows
// every group instead, with a note saying so.
$elevation_town     = $elevation_filters['town'];
$elevation_no_town  = false;
$elevation_open_note = '';
if ( '' !== $elevation_town ) {
	$elevation_covers = static fn ( WP_Post $post ): bool => GroupFields::matchesTown( $elevation_town, elevation_group( $post )['towns'], elevation_group( $post )['areas'] );
	if ( ! array_filter( $elevation_all, $elevation_covers ) ) {
		$elevation_no_town = true;
		$elevation_groups  = $elevation_all;
	} else {
		$elevation_groups = array_values( array_filter( $elevation_groups, $elevation_covers ) );
		$elevation_links  = [];
		foreach ( elevation_groups( [ 'type' => 'interest-based' ] ) as $elevation_interest ) {
			$elevation_links[] = sprintf( '<a href="%s">%s</a>', esc_url( $elevation_base . '#group-' . $elevation_interest->post_name ), esc_html( $elevation_interest->post_title ) );
		}
		if ( $elevation_links ) {
			$elevation_last      = array_pop( $elevation_links );
			$elevation_names     = $elevation_links ? implode( ', ', $elevation_links ) . ' ' . esc_html__( 'and', 'elevation-core' ) . ' ' . $elevation_last : $elevation_last;
			$elevation_verb      = count( $elevation_links ) ? esc_html__( 'are', 'elevation-core' ) : esc_html__( 'is', 'elevation-core' );
			$elevation_open_note = sprintf( '<p class="group-directory__note">%s %s %s</p>', $elevation_names, $elevation_verb, esc_html__( 'open to everyone, wherever you live.', 'elevation-core' ) );
		}
	}
}

$elevation_select = static function ( string $name, string $label, string $any, array $options, string $current ): string {
	$html = sprintf( '<label class="group-filters__field"><span>%s</span><select name="%s"><option value="">%s</option>', esc_html( $label ), esc_attr( $name ), esc_html( $any ) );
	foreach ( $options as $value => $text ) {
		$html .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $value ), selected( $current, $value, false ), esc_html( $text ) );
	}
	return $html . '</select></label>';
};
?>
<div <?php echo get_block_wrapper_attributes( [ 'class' => 'group-directory', 'id' => 'groups' ] ); ?>>
	<form class="group-filters" method="get" action="<?php echo esc_url( $elevation_base ); ?>#groups" aria-label="<?php esc_attr_e( 'Filter Connect Groups', 'elevation-core' ); ?>">
		<label class="group-filters__field"><span><?php esc_html_e( 'Your town', 'elevation-core' ); ?></span><input type="text" name="town" list="group-towns" autocomplete="address-level2" maxlength="60" value="<?php echo esc_attr( $elevation_town ); ?>"></label>
		<datalist id="group-towns">
			<?php foreach ( $elevation_towns as $elevation_option ) : ?><option value="<?php echo esc_attr( $elevation_option ); ?>"></option><?php endforeach; ?>
		</datalist>
		<?php
		echo $elevation_select( 'area', __( 'Area', 'elevation-core' ), __( 'All areas', 'elevation-core' ), wp_list_pluck( $elevation_areas, 'name', 'slug' ), $elevation_filters['area'] ); // Escaped inside.
		echo $elevation_select( 'type', __( 'Type', 'elevation-core' ), __( 'All types', 'elevation-core' ), wp_list_pluck( $elevation_types, 'name', 'slug' ), $elevation_filters['type'] );
		echo $elevation_select( 'meets', __( 'Day', 'elevation-core' ), __( 'Any day', 'elevation-core' ), array_intersect_key( GroupFields::DAYS, array_flip( $elevation_days ) ), $elevation_filters['meets'] );
		?>
		<div class="wp-block-button is-style-navy"><button type="submit" class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Show groups', 'elevation-core' ); ?></button></div>
		<?php if ( $elevation_active ) : ?>
			<a class="group-filters__clear" href="<?php echo esc_url( $elevation_base ); ?>#groups"><?php esc_html_e( 'Clear filters', 'elevation-core' ); ?></a>
		<?php endif; ?>
	</form>
	<p class="group-directory__count" role="status">
		<?php echo esc_html( sprintf( _n( '%d group', '%d groups', count( $elevation_groups ), 'elevation-core' ), count( $elevation_groups ) ) ); ?>
	</p>
	<?php if ( $elevation_no_town ) : ?>
		<div class="wp-block-group is-style-panel group-directory__empty"><p>
			<?php echo esc_html( sprintf( __( 'We couldn\'t find "%s". Here are all our groups — or ask us below and we\'ll help you find one.', 'elevation-core' ), $elevation_town ) ); ?>
		</p></div>
	<?php endif; ?>
	<?php echo $elevation_open_note; // Escaped when built. ?>
	<?php if ( ! $elevation_groups ) : ?>
		<div class="wp-block-group is-style-panel group-directory__empty"><p>
			<?php esc_html_e( 'No groups match those filters.', 'elevation-core' ); ?>
			<a href="<?php echo esc_url( $elevation_base ); ?>#groups"><?php esc_html_e( 'Clear the filters', 'elevation-core' ); ?></a>,
			<?php esc_html_e( "or ask us below and we'll help you find one.", 'elevation-core' ); ?>
		</p></div>
	<?php else : ?>
		<div class="group-grid">
			<?php foreach ( $elevation_groups as $elevation_group ) {
				echo elevation_group_card( $elevation_group, $elevation_filters ); // Escaped inside.
			} ?>
		</div>
	<?php endif; ?>
</div>
