<?php
/** `wp elevation forms …`: the church's Fluent Forms from seed/forms/*.json (spec §6.10), plus small helpers. */
use Elevation\Core\FormSchema;
use Elevation\Core\Forms;
use Elevation\Core\SeedGuard;

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * ## EXAMPLES
 *     wp elevation forms seed /seed/forms [--force=contact,alpha]
 *     wp elevation forms id contact
 *     wp elevation forms list
 *     wp elevation forms reset-limits
 *     wp elevation forms purge-test-entries
 */
WP_CLI::add_command( 'elevation forms', function ( array $args, array $assoc ) {
	if ( ! function_exists( 'wpFluentForm' ) ) {
		WP_CLI::error( "Fluent Forms isn't active." );
	}
	switch ( $args[0] ?? '' ) {
		case 'seed':
			$force = array_values( array_filter( array_map( 'trim', explode( ',', (string) ( $assoc['force'] ?? '' ) ) ) ) );
			elevation_forms_seed( (string) ( $args[1] ?? '' ), $force );
			return;
		case 'id':
			$id = elevation_form_id( (string) ( $args[1] ?? '' ) );
			$id ? WP_CLI::line( (string) $id ) : WP_CLI::error( 'No church form has that key.' );
			return;
		case 'list':
			foreach ( Forms::KEYS as $key ) {
				WP_CLI::line( sprintf( '%-13s %s', $key, elevation_form_id( $key ) ?: '—' ) );
			}
			return;
		case 'reset-limits':
			global $wpdb;
			$rows = $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '\\_transient\\_elevation\\_rl\\_%' OR option_name LIKE '\\_transient\\_timeout\\_elevation\\_rl\\_%'" );
			WP_CLI::success( sprintf( 'Cleared %d rate-limit row(s).', (int) $rows ) );
			return;
		case 'purge-test-entries':
			if ( 'local' !== wp_get_environment_type() ) {
				WP_CLI::error( 'Test entries are only purged locally.' );
			}
			global $wpdb;
			$ids = $wpdb->get_col( "SELECT id FROM {$wpdb->prefix}fluentform_submissions WHERE response LIKE '%@example.com%'" );
			foreach ( [ 'fluentform_entry_details' => [ 'submission_id', '' ], 'fluentform_submission_meta' => [ 'response_id', '' ], 'fluentform_logs' => [ 'source_id', " AND source_type = 'submission_item'" ], 'fluentform_submissions' => [ 'id', '' ] ] as $table => [ $column, $extra ] ) {
				foreach ( array_chunk( array_map( 'intval', $ids ), 200 ) as $chunk ) {
					$wpdb->query( "DELETE FROM {$wpdb->prefix}$table WHERE $column IN (" . implode( ',', $chunk ) . ")$extra" ); // phpcs:ignore WordPress.DB.PreparedSQL -- integers only.
				}
			}
			WP_CLI::success( sprintf( 'Removed %d test entr%s (@example.com).', count( $ids ), 1 === count( $ids ) ? 'y' : 'ies' ) );
			return;
	}
	WP_CLI::error( 'Usage: wp elevation forms seed <dir> [--force=<keys>] | id <key> | list | reset-limits | purge-test-entries' );
} );

function elevation_forms_seed( string $dir, array $force ): void {
	$files = glob( rtrim( $dir, '/' ) . '/*.json' ) ?: [];
	sort( $files );
	if ( ! $files ) {
		WP_CLI::error( "No form definitions in $dir." );
	}
	$seen = [];
	foreach ( $files as $file ) {
		$def = json_decode( (string) file_get_contents( $file ), true );
		if ( ! is_array( $def ) ) {
			WP_CLI::error( basename( $file ) . ' is not valid JSON.' );
		}
		try {
			$form = FormSchema::compile( $def );
		} catch ( \InvalidArgumentException $e ) {
			WP_CLI::error( basename( $file ) . ': ' . $e->getMessage() );
		}
		if ( isset( $seen[ $form['key'] ] ) ) {
			WP_CLI::error( "Two files define the {$form['key']} form." );
		}
		$seen[ $form['key'] ] = true;
		elevation_forms_seed_one( $form, in_array( $form['key'], $force, true ) );
	}
	$missing = array_diff( Forms::KEYS, array_keys( $seen ) );
	if ( $missing ) {
		WP_CLI::warning( 'No definition for: ' . implode( ', ', $missing ) );
	}
	elevation_form_ids( true );
	do_action( 'elevation_forms_seeded' );
}

/** What the seed guard compares: title, fields, settings and notifications, re-encoded the same way each time. */
function elevation_forms_seed_content( string $title, string $fields_json, array $settings, array $notifications ): string {
	return (string) wp_json_encode( [ $title, json_decode( $fields_json, true ), $settings, $notifications ] );
}

function elevation_forms_seed_one( array $form, bool $force ): void {
	global $wpdb;
	$forms_table = $wpdb->prefix . 'fluentform_forms';
	$meta_table  = $wpdb->prefix . 'fluentform_form_meta';
	$key         = $form['key'];
	$settings    = array_replace_recursive( \FluentForm\App\Models\Form::getFormsDefaultSettings(), $form['settings'] );
	$fields_json = (string) wp_json_encode( $form['form_fields'] );
	$new         = elevation_forms_seed_content( $form['title'], $fields_json, $settings, $form['notifications'] );

	$id      = elevation_form_id( $key );
	$current = null;
	$stored  = null;
	if ( $id ) {
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT title, form_fields FROM $forms_table WHERE id = %d", $id ) );
		if ( $row ) {
			$meta    = static fn ( string $k ) => $wpdb->get_col( $wpdb->prepare( "SELECT value FROM $meta_table WHERE form_id = %d AND meta_key = %s ORDER BY id", $id, $k ) );
			$current = elevation_forms_seed_content(
				(string) $row->title,
				(string) $row->form_fields,
				json_decode( (string) ( $meta( 'formSettings' )[0] ?? '' ), true ) ?: [],
				array_map( static fn ( $v ) => json_decode( (string) $v, true ), $meta( 'notifications' ) )
			);
			$stored  = $meta( '_elevation_seed_hash' )[0] ?? null;
		} else {
			$id = 0; // the tag outlived its form
		}
	}

	$decision = SeedGuard::decide( $stored, $current, $new, $force );
	if ( SeedGuard::UNCHANGED === $decision ) {
		WP_CLI::log( "Unchanged form $key (#$id)" );
		return;
	}
	if ( SeedGuard::SKIP === $decision ) {
		WP_CLI::warning( "Skipped form $key (#$id): it was edited in Fluent Forms after it was seeded. Re-run with SEED_FORCE=\"form:$key\" to overwrite it." );
		return;
	}
	$now = current_time( 'mysql' );
	if ( SeedGuard::CREATE === $decision ) {
		$wpdb->insert( $forms_table, [
			'title'       => $form['title'],
			'status'      => 'published',
			'form_fields' => $fields_json,
			'has_payment' => 0,
			'type'        => 'form',
			'created_by'  => get_current_user_id(),
			'created_at'  => $now,
			'updated_at'  => $now,
		] );
		$id = (int) $wpdb->insert_id;
		$id || WP_CLI::error( "Couldn't create the $key form: " . $wpdb->last_error );
	} else {
		$wpdb->update( $forms_table, [ 'title' => $form['title'], 'form_fields' => $fields_json, 'status' => 'published', 'updated_at' => $now ], [ 'id' => $id ] );
	}
	$wpdb->query( $wpdb->prepare( "DELETE FROM $meta_table WHERE form_id = %d AND meta_key IN ('formSettings','notifications','_primary_email_field','_elevation_form_key','_elevation_seed_hash')", $id ) );
	$rows = [
		[ 'formSettings', wp_json_encode( $settings ) ],
		[ '_primary_email_field', $form['primaryEmail'] ],
		[ '_elevation_form_key', $key ],
		[ '_elevation_seed_hash', SeedGuard::hash( $new ) ],
	];
	foreach ( $form['notifications'] as $notification ) {
		$rows[] = [ 'notifications', wp_json_encode( $notification ) ];
	}
	foreach ( $rows as [ $meta_key, $value ] ) {
		$wpdb->insert( $meta_table, [ 'form_id' => $id, 'meta_key' => $meta_key, 'value' => (string) $value ] );
	}
	WP_CLI::log( ( SeedGuard::CREATE === $decision ? 'Created' : 'Updated' ) . " form $key (#$id)" );
}
