<?php
/**
 * The church's Fluent Forms at run time (spec §6.7, §6.10). Forms are found by their seed key
 * (form meta "_elevation_form_key", written by `wp elevation forms seed`), never by database ID.
 */
defined( 'ABSPATH' ) || exit;

/** @return array<string,int> form key => Fluent Forms form ID. Empty when Fluent Forms isn't installed. */
function elevation_form_ids( bool $refresh = false ): array {
	static $ids = null;
	if ( null === $ids || $refresh ) {
		global $wpdb;
		$ids   = [];
		$table = $wpdb->prefix . 'fluentform_form_meta';
		if ( $table === $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) ) {
			foreach ( $wpdb->get_results( "SELECT form_id, value FROM $table WHERE meta_key = '_elevation_form_key' ORDER BY form_id" ) as $row ) { // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name only.
				$ids[ (string) $row->value ] ??= (int) $row->form_id;
			}
		}
	}
	return $ids;
}

function elevation_form_id( string $key ): int {
	return elevation_form_ids()[ $key ] ?? 0;
}

function elevation_form_key( int $id ): ?string {
	$key = array_search( $id, elevation_form_ids(), true );
	return false === $key ? null : $key;
}
