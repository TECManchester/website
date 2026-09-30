<?php
defined( 'ABSPATH' ) || exit;

const ELEVATION_ROLES_VERSION = '1';

/** Site Manager = Editor + Church Settings + menus/Site Editor, without core site settings. */
function elevation_install_roles(): void {
	get_role( 'administrator' )?->add_cap( 'manage_church_settings' );

	$caps = get_role( 'editor' )?->capabilities ?? [];
	$caps['manage_church_settings'] = true;
	$caps['edit_theme_options']     = true;

	remove_role( 'site_manager' );
	add_role( 'site_manager', __( 'Site Manager', 'elevation-core' ), $caps );
	update_option( 'elevation_roles_version', ELEVATION_ROLES_VERSION );
}

add_action( 'init', function () {
	if ( get_option( 'elevation_roles_version' ) !== ELEVATION_ROLES_VERSION ) {
		elevation_install_roles();
	}
} );
