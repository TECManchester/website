<?php
/**
 * Plugin Name: Elevation Core
 * Description: Church Settings, content types and blocks for Elevation Church Manchester.
 * Version: 0.1.0
 * Requires at least: 7.1
 * Requires PHP: 8.3
 * Text Domain: elevation-core
 */

defined( 'ABSPATH' ) || exit;

define( 'ELEVATION_CORE_VERSION', '0.1.0' );
define( 'ELEVATION_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'ELEVATION_CORE_URL', plugin_dir_url( __FILE__ ) );

require_once ELEVATION_CORE_DIR . 'src/Settings.php';
require_once ELEVATION_CORE_DIR . 'src/Tokens.php';
require_once ELEVATION_CORE_DIR . 'src/SeedGuard.php';
require_once ELEVATION_CORE_DIR . 'src/MediaRefs.php';
require_once ELEVATION_CORE_DIR . 'src/Icons.php';
require_once ELEVATION_CORE_DIR . 'src/EmbedGate.php';

require_once ELEVATION_CORE_DIR . 'includes/settings.php';
require_once ELEVATION_CORE_DIR . 'includes/bindings.php';
require_once ELEVATION_CORE_DIR . 'includes/roles.php';
require_once ELEVATION_CORE_DIR . 'includes/settings-page.php';
require_once ELEVATION_CORE_DIR . 'includes/cli.php';
require_once ELEVATION_CORE_DIR . 'includes/navigation.php';
require_once ELEVATION_CORE_DIR . 'includes/consent.php';

register_activation_hook( __FILE__, 'elevation_install_roles' );

// Every compiled block in build/blocks/ registers itself from its block.json.
add_action( 'init', function () {
	foreach ( glob( ELEVATION_CORE_DIR . 'build/blocks/*/block.json' ) as $block_json ) {
		register_block_type( dirname( $block_json ) );
	}
} );
