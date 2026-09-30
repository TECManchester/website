<?php
/** Block editor additions: the settings-token button and the large-button toggle (src/editor). */
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

/** Tokens offered in the editor: public settings people put in copy (not hero slides or tracking IDs). */
function elevation_editor_tokens(): array {
	$groups = [ 'church', 'service', 'location', 'contact', 'socials', 'giving', 'site' ];
	$tokens = [];
	foreach ( Settings::publicValues( elevation_settings() ) as $key => $value ) {
		if ( ! in_array( strtok( $key, '.' ), $groups, true ) ) {
			continue;
		}
		$tokens[] = [
			'key'   => $key,
			'label' => ucfirst( strtok( $key, '.' ) ) . ' · ' . elevation_settings_label( $key ),
			'value' => (string) $value,
		];
	}
	return $tokens;
}

add_action( 'enqueue_block_editor_assets', function () {
	$asset_file = ELEVATION_CORE_DIR . 'build/editor/index.asset.php';
	if ( ! is_readable( $asset_file ) ) {
		return;
	}
	$asset = include $asset_file;
	wp_enqueue_script( 'elevation-editor', ELEVATION_CORE_URL . 'build/editor/index.js', $asset['dependencies'], $asset['version'], true );
	wp_add_inline_script( 'elevation-editor', 'window.elevationTokens = ' . wp_json_encode( elevation_editor_tokens() ) . ';', 'before' );
	wp_add_inline_script( 'elevation-editor', 'window.elevationEventDefaults = ' . wp_json_encode( [ 'venue' => (string) elevation_setting( 'location.full' ) ] ) . ';', 'before' );
} );
