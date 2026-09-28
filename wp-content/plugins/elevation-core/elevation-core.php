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
