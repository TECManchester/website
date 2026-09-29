<?php
/**
 * Who reads which entries (spec §7), and Gift Aid retention (spec §6.10).
 * - Site Managers get Fluent Forms' entry access to the Site Manager forms only (every form but Prayer and
 *   Gift Aid), through Fluent Forms' own per-user manager records, kept in sync here whenever a user's role
 *   or the form IDs change. Staff never set this up by hand. Editors get no Fluent Forms access.
 * - Gift Aid entries can't be deleted or trashed, the form can't be deleted, and "delete entries after
 *   submission" can't be left on for it. HMRC: keep for six years after the last gift.
 */
use Elevation\Core\Forms;

defined( 'ABSPATH' ) || exit;

const ELEVATION_FORM_MANAGER_CAPS = [ 'fluentform_dashboard_access', 'fluentform_entries_viewer', 'fluentform_manage_entries' ];

/** @return list<int> */
function elevation_site_manager_form_ids(): array {
	$ids = array_values( array_filter( array_map( 'elevation_form_id', Forms::siteManagerKeys() ) ) );
	sort( $ids );
	return $ids;
}

function elevation_sync_form_access( int $user_id ): void {
	$user = get_userdata( $user_id );
	if ( ! $user ) {
		return;
	}
	$meta_keys = [ '_fluent_forms_has_role', '_fluent_forms_has_specific_forms_permission', '_fluent_forms_allowed_forms', '_elevation_form_access' ];
	if ( in_array( 'site_manager', (array) $user->roles, true ) && ! user_can( $user, 'manage_options' ) ) {
		foreach ( ELEVATION_FORM_MANAGER_CAPS as $cap ) {
			$user->add_cap( $cap );
		}
		update_user_meta( $user_id, '_fluent_forms_has_role', 1 );
		update_user_meta( $user_id, '_fluent_forms_has_specific_forms_permission', 'yes' );
		update_user_meta( $user_id, '_fluent_forms_allowed_forms', elevation_site_manager_form_ids() ); // [] = none yet
		update_user_meta( $user_id, '_elevation_form_access', 1 );
		return;
	}
	if ( get_user_meta( $user_id, '_elevation_form_access', true ) ) {
		foreach ( ELEVATION_FORM_MANAGER_CAPS as $cap ) {
			$user->remove_cap( $cap );
		}
		foreach ( $meta_keys as $key ) {
			delete_user_meta( $user_id, $key );
		}
	}
}

foreach ( [ 'set_user_role', 'add_user_role', 'remove_user_role', 'user_register' ] as $elevation_hook ) {
	add_action( $elevation_hook, static fn ( $user_id ) => elevation_sync_form_access( (int) $user_id ), 20 );
}

function elevation_form_access_version(): string {
	return md5( wp_json_encode( elevation_site_manager_form_ids() ) . '|' . ELEVATION_ROLES_VERSION );
}

function elevation_sync_all_form_access(): void {
	$ids = array_merge(
		get_users( [ 'role__in' => [ 'site_manager' ], 'fields' => 'ID' ] ),
		get_users( [ 'meta_key' => '_elevation_form_access', 'fields' => 'ID' ] ) // phpcs:ignore WordPress.DB.SlowDBQuery -- a few users.
	);
	foreach ( array_unique( array_map( 'intval', $ids ) ) as $id ) {
		elevation_sync_form_access( $id );
	}
	update_option( 'elevation_form_access_version', elevation_form_access_version(), false );
}
add_action( 'elevation_forms_seeded', 'elevation_sync_all_form_access' );
add_action( 'admin_init', static function () {
	if ( get_option( 'elevation_form_access_version' ) !== elevation_form_access_version() ) {
		elevation_sync_all_form_access();
	}
} );

function elevation_gift_aid_keep_message(): string {
	return __( 'Gift Aid declarations can\'t be deleted: HMRC requires them to be kept for six years after the last gift. To cancel one, add a note to the entry saying "Cancelled" and the date.', 'elevation-core' );
}

add_action( 'fluentform/before_deleting_entries', static function ( $ids, $formId ) {
	if ( 'gift-aid' === elevation_form_key( (int) $formId ) ) {
		throw new \Exception( elevation_gift_aid_keep_message() );
	}
}, 1, 2 );

add_filter( 'fluentform/entry_statuses_for_mutation', static function ( $statuses, $formId = 0 ) {
	if ( 'gift-aid' === elevation_form_key( (int) $formId ) ) {
		unset( $statuses['trashed'] );
	}
	return $statuses;
}, 10, 2 );

add_action( 'fluentform/before_form_delete', static function ( $formId ) {
	if ( 'gift-aid' === elevation_form_key( (int) $formId ) ) {
		throw new \Exception( elevation_gift_aid_keep_message() );
	}
}, 1 );

// "Delete entries after submission" or an auto-delete period switched on for Gift Aid is switched off again
// before the entry is stored, so the declaration is always kept.
add_action( 'fluentform/before_insert_submission', static function ( $insertData, $data, $form ) {
	if ( 'gift-aid' !== elevation_form_key_of( $form ) ) {
		return;
	}
	$helper = \FluentForm\App\Helpers\Helper::class;
	if ( $helper::isEntryAutoDeleteEnabled( $form->id ) ) {
		$settings                               = (array) $helper::getFormMeta( $form->id, 'formSettings', [] );
		$settings['delete_entry_on_submission'] = 'no';
		$helper::setFormMeta( $form->id, 'formSettings', $settings );
	}
	\FluentForm\App\Models\FormMeta::remove( $form->id, 'auto_delete_days' );
}, 1, 3 );
