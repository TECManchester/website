<?php
/**
 * The "Group details" meta box on the classic Connect Group edit screen (spec §6.6). The post type has no editor
 * support, so WordPress shows the classic screen and this box is the one place staff edit a group's fields. The
 * description (`excerpt`) and order (`menu_order`) are saved by core from the same form; everything else is saved
 * here through the same sanitisers the REST meta uses (GroupFields).
 */
use Elevation\Core\GroupFields;

defined( 'ABSPATH' ) || exit;

add_action( 'add_meta_boxes_connect_group', static function () {
	add_meta_box( 'elevation-group-details', __( 'Group details', 'elevation-core' ), 'elevation_group_details_render', 'connect_group', 'normal', 'high' );
} );

// The boxes the Group details box replaces. Removed after core and taxonomy registration have added them.
add_action( 'add_meta_boxes_connect_group', static function () {
	remove_meta_box( 'postexcerpt', 'connect_group', 'normal' );
	remove_meta_box( 'postcustom', 'connect_group', 'normal' );
	remove_meta_box( 'group_areadiv', 'connect_group', 'side' );
	remove_meta_box( 'group_categorydiv', 'connect_group', 'side' );
	remove_meta_box( 'pageparentdiv', 'connect_group', 'side' );
}, 99 );

/** The Connect Groups inbox, the address "Ask to join" requests use when a group has none of its own. */
function elevation_group_inbox(): string {
	return trim( (string) elevation_setting( 'contact.connectGroupInbox' ) );
}

/** One row of the Group details table: a label, the control and its help line. */
function elevation_group_details_row( string $id, string $label, string $control, string $help ): void {
	printf(
		'<tr><th scope="row"><label for="%1$s">%2$s</label></th><td>%3$s<p class="description">%4$s</p></td></tr>',
		esc_attr( $id ),
		esc_html( $label ),
		$control, // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts by the caller.
		esc_html( $help )
	);
}

/** @param array<string,string> $options value => label */
function elevation_group_details_select( string $id, string $name, array $options, string $current ): string {
	$html = sprintf( '<select id="%s" name="%s">', esc_attr( $id ), esc_attr( $name ) );
	foreach ( $options as $value => $label ) {
		$html .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( (string) $value ), selected( $current, (string) $value, false ), esc_html( $label ) );
	}
	return $html . '</select>';
}

function elevation_group_details_render( WP_Post $post ): void {
	wp_nonce_field( 'elevation_group_details', 'elevation_group_details_nonce' );

	$meta = static fn ( string $key ) => get_post_meta( $post->ID, $key, true );
	$stored_email = trim( (string) $meta( 'group_leader_email' ) );
	$email        = '' !== $stored_email ? $stored_email : elevation_group_inbox();

	$types = get_terms( [ 'taxonomy' => 'group_category', 'hide_empty' => false, 'orderby' => 'name' ] );
	$types = is_array( $types ) ? $types : [];
	$areas = get_terms( [ 'taxonomy' => 'group_area', 'hide_empty' => false, 'orderby' => 'name' ] );
	$areas = is_array( $areas ) ? $areas : [];

	$type_ids   = wp_get_object_terms( $post->ID, 'group_category', [ 'fields' => 'ids' ] );
	$type_now   = is_array( $type_ids ) && $type_ids ? (string) $type_ids[0] : '';
	$area_ids   = wp_get_object_terms( $post->ID, 'group_area', [ 'fields' => 'ids' ] );
	$area_now   = is_array( $area_ids ) ? array_map( 'intval', $area_ids ) : [];
	$type_opts  = [ '' => __( 'Choose a type', 'elevation-core' ) ];
	foreach ( $types as $term ) {
		$type_opts[ (string) $term->term_id ] = $term->name;
	}
	$day_opts = [ '' => __( 'Not set yet', 'elevation-core' ) ] + GroupFields::DAYS;
	$freq_now = GroupFields::frequency( $meta( 'group_frequency' ) );
	// A group that has never been saved has no stored flag: new members are welcome by default.
	$accepting = metadata_exists( 'post', $post->ID, 'group_accepting' ) ? (bool) $meta( 'group_accepting' ) : true;
	?>
	<style>
		.elevation-group-details h3 { margin: 1.5em 0 0; padding: 0 0 8px; border-bottom: 1px solid #dcdcde; font-size: 14px; }
		.elevation-group-details h3:first-of-type { margin-top: 0.5em; }
		.elevation-group-details .form-table th { width: 170px; padding: 15px 10px 15px 0; }
		.elevation-group-details .form-table td { padding: 12px 0; }
		.elevation-group-details .form-table td .description { margin: 6px 0 0; max-width: 640px; }
		.elevation-group-details .elevation-group-areas { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px 16px; max-width: 640px; }
		.elevation-group-details textarea.large-text { max-width: 640px; }
		.elevation-group-details input[type="text"], .elevation-group-details input[type="email"] { width: 100%; max-width: 400px; }
		.elevation-group-details input[type="number"] { width: 80px; }
	</style>
	<div class="elevation-group-details">
		<h3><?php esc_html_e( 'About', 'elevation-core' ); ?></h3>
		<table class="form-table" role="presentation"><tbody>
		<?php
		elevation_group_details_row( 'elevation-group-excerpt', __( 'Description', 'elevation-core' ), '<textarea id="elevation-group-excerpt" name="excerpt" rows="3" class="large-text">' . esc_textarea( $post->post_excerpt ) . '</textarea>', __( "One or two sentences shown on the group's card.", 'elevation-core' ) );
		elevation_group_details_row( 'elevation-group-type', __( 'Group type', 'elevation-core' ), elevation_group_details_select( 'elevation-group-type', 'elevation_group_type', $type_opts, $type_now ), __( 'Geography-based groups serve an area; interest-based groups are open to anyone, wherever they live.', 'elevation-core' ) );
		elevation_group_details_row( 'elevation-group-accepting', __( 'Taking new members', 'elevation-core' ), '<label><input type="checkbox" id="elevation-group-accepting" name="elevation_group_accepting" value="1"' . checked( $accepting, true, false ) . '> ' . esc_html__( 'Yes, this group is taking new members', 'elevation-core' ) . '</label>', __( "When unticked, the card says 'Full right now, ask about the next one'.", 'elevation-core' ) );
		?>
		</tbody></table>

		<h3><?php esc_html_e( 'When it meets', 'elevation-core' ); ?></h3>
		<table class="form-table" role="presentation"><tbody>
		<?php
		elevation_group_details_row( 'elevation-group-day', __( 'Meets on', 'elevation-core' ), elevation_group_details_select( 'elevation-group-day', 'elevation_group_day', $day_opts, GroupFields::day( $meta( 'group_meeting_day' ) ) ), __( "Leave as 'Not set yet' to show 'Day and time to be confirmed'.", 'elevation-core' ) );
		elevation_group_details_row( 'elevation-group-time', __( 'Time', 'elevation-core' ), '<input type="time" id="elevation-group-time" name="elevation_group_time" value="' . esc_attr( GroupFields::time( $meta( 'group_meeting_time' ) ) ) . '">', __( 'Shown on the site as, for example, 8:00 pm.', 'elevation-core' ) );
		elevation_group_details_row( 'elevation-group-frequency', __( 'How often', 'elevation-core' ), elevation_group_details_select( 'elevation-group-frequency', 'elevation_group_frequency', [ 'weekly' => __( 'Every week', 'elevation-core' ), 'fortnightly' => __( 'Every other week', 'elevation-core' ) ], $freq_now ), __( "Every other week shows, for example, 'Every other Sunday'.", 'elevation-core' ) );
		?>
		</tbody></table>

		<h3><?php esc_html_e( 'Where', 'elevation-core' ); ?></h3>
		<table class="form-table" role="presentation"><tbody>
		<?php
		if ( $areas ) {
			$boxes = '<fieldset class="elevation-group-areas" id="elevation-group-areas"><legend class="screen-reader-text">' . esc_html__( 'Areas', 'elevation-core' ) . '</legend>';
			foreach ( $areas as $term ) {
				$boxes .= sprintf( '<label><input type="checkbox" name="elevation_group_areas[]" value="%d"%s> %s</label>', (int) $term->term_id, checked( in_array( (int) $term->term_id, $area_now, true ), true, false ), esc_html( $term->name ) );
			}
			$boxes .= '</fieldset>';
		} else {
			$boxes = '<span id="elevation-group-areas">' . esc_html__( 'No areas yet', 'elevation-core' ) . '</span>';
		}
		printf(
			'<tr><th scope="row">%s</th><td>%s<p class="description">%s</p></td></tr>',
			esc_html__( 'Areas', 'elevation-core' ),
			$boxes, // phpcs:ignore WordPress.Security.EscapeOutput -- escaped above.
			esc_html__( 'Used by the Area filter. Leave empty for interest-based groups. Add new areas under Connect Groups → Areas.', 'elevation-core' )
		);
		elevation_group_details_row( 'elevation-group-towns', __( 'Towns covered', 'elevation-core' ), '<textarea id="elevation-group-towns" name="elevation_group_towns" rows="4" class="large-text">' . esc_textarea( (string) $meta( 'group_towns' ) ) . '</textarea>', __( 'One town per line. Used by the town search on the Connect Groups page.', 'elevation-core' ) );
		?>
		</tbody></table>

		<h3><?php esc_html_e( 'Leader and requests', 'elevation-core' ); ?></h3>
		<table class="form-table" role="presentation"><tbody>
		<?php
		elevation_group_details_row( 'elevation-group-leader', __( "Leader's name", 'elevation-core' ), '<input type="text" id="elevation-group-leader" name="elevation_group_leader" value="' . esc_attr( (string) $meta( 'group_leader_name' ) ) . '">', __( 'Only the first name is shown on the site.', 'elevation-core' ) );
		elevation_group_details_row( 'elevation-group-email', __( 'Ask to join email', 'elevation-core' ), '<input type="email" id="elevation-group-email" name="elevation_group_email" value="' . esc_attr( $email ) . '">', __( "Where this group's 'Ask to join' requests are emailed. Leave as the Connect Groups inbox unless the group leader should get them directly. Never shown on the site.", 'elevation-core' ) );
		?>
		</tbody></table>

		<h3><?php esc_html_e( 'Order', 'elevation-core' ); ?></h3>
		<table class="form-table" role="presentation"><tbody>
		<?php
		elevation_group_details_row( 'elevation-group-order', __( 'Order', 'elevation-core' ), '<input type="number" min="0" id="elevation-group-order" name="menu_order" value="' . esc_attr( (string) (int) $post->menu_order ) . '">', __( 'Lower numbers show first on the Connect Groups page. The first three appear on the Get Involved page.', 'elevation-core' ) );
		?>
		</tbody></table>
	</div>
	<?php
}

/** Saves the box. Returns nothing; an unusable Ask to join email is left as it was and reported after the redirect. */
function elevation_group_details_save( int $post_id, ?WP_Post $post = null ): void {
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	$nonce = isset( $_POST['elevation_group_details_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['elevation_group_details_nonce'] ) ) : '';
	if ( '' === $nonce || ! wp_verify_nonce( $nonce, 'elevation_group_details' ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$in = static fn ( string $key ): string => isset( $_POST[ $key ] ) && is_scalar( $_POST[ $key ] ) ? wp_unslash( (string) $_POST[ $key ] ) : ''; // phpcs:ignore WordPress.Security -- nonce checked above; each value is sanitised below.

	update_post_meta( $post_id, 'group_meeting_day', GroupFields::day( $in( 'elevation_group_day' ) ) );
	update_post_meta( $post_id, 'group_meeting_time', GroupFields::time( $in( 'elevation_group_time' ) ) );
	update_post_meta( $post_id, 'group_frequency', GroupFields::frequency( $in( 'elevation_group_frequency' ) ) );
	update_post_meta( $post_id, 'group_towns', implode( "\n", GroupFields::towns( $in( 'elevation_group_towns' ) ) ) );
	update_post_meta( $post_id, 'group_leader_name', sanitize_text_field( $in( 'elevation_group_leader' ) ) );
	update_post_meta( $post_id, 'group_accepting', isset( $_POST['elevation_group_accepting'] ) ? true : false ); // phpcs:ignore WordPress.Security.NonceVerification

	// Ask to join email: the inbox (or nothing) is stored as '' so later changes to the setting still apply.
	$email = trim( $in( 'elevation_group_email' ) );
	if ( '' === $email || 0 === strcasecmp( $email, elevation_group_inbox() ) ) {
		update_post_meta( $post_id, 'group_leader_email', '' );
	} elseif ( is_email( sanitize_email( $email ) ) ) {
		update_post_meta( $post_id, 'group_leader_email', sanitize_email( $email ) );
	} else {
		set_transient( 'elevation_group_email_bad_' . get_current_user_id() . '_' . $post_id, 1, MINUTE_IN_SECONDS * 5 );
	}

	$type = absint( $in( 'elevation_group_type' ) );
	wp_set_object_terms( $post_id, $type && term_exists( $type, 'group_category' ) ? [ $type ] : [], 'group_category' );

	$areas = isset( $_POST['elevation_group_areas'] ) && is_array( $_POST['elevation_group_areas'] ) ? array_map( 'absint', wp_unslash( $_POST['elevation_group_areas'] ) ) : []; // phpcs:ignore WordPress.Security
	$areas = array_values( array_unique( array_filter( $areas, static fn ( int $id ): bool => $id > 0 && term_exists( $id, 'group_area' ) ) ) );
	wp_set_object_terms( $post_id, $areas, 'group_area' );
}
add_action( 'save_post_connect_group', 'elevation_group_details_save', 10, 2 );

add_action( 'admin_notices', static function () {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	$post   = get_post();
	if ( ! $screen || 'connect_group' !== $screen->post_type || 'post' !== $screen->base || ! $post ) {
		return;
	}
	$key = 'elevation_group_email_bad_' . get_current_user_id() . '_' . $post->ID;
	if ( get_transient( $key ) ) {
		delete_transient( $key );
		printf( '<div class="notice notice-error is-dismissible"><p>%s</p></div>', esc_html__( "That Ask to join email doesn't look right, so it wasn't saved.", 'elevation-core' ) );
	}
} );
