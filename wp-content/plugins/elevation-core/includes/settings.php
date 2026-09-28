<?php
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

/** Resolved Church Settings for this request, plus request-time values like the year. */
function elevation_settings(): array {
	static $cache = null;
	if ( null === $cache ) {
		$stored            = get_option( Settings::OPTION, [] );
		$cache             = Settings::resolve( is_array( $stored ) ? $stored : [] );
		$cache['site']     = [ 'year' => (int) wp_date( 'Y' ) ];
	}
	return $cache;
}

function elevation_setting( string $key ): mixed {
	return Settings::get( elevation_settings(), $key );
}

/** Scalar, non-secret setting for public output (tokens and bindings); null otherwise. */
function elevation_public_setting( string $key ): string|int|float|bool|null {
	static $public = null;
	$public ??= Settings::publicValues( elevation_settings() );
	return $public[ $key ] ?? null;
}
