<?php
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

/** Resolved Church Settings for this request, plus request-time values like the year. */
function elevation_settings( bool $refresh = false ): array {
	static $cache = null;
	if ( null === $cache || $refresh ) {
		$stored            = get_option( Settings::OPTION, [] );
		$cache             = Settings::resolve( is_array( $stored ) ? $stored : [] );
		$cache['site']     = [ 'year' => (int) wp_date( 'Y' ) ];
		if ( $refresh ) {
			elevation_public_setting( '', true );
		}
	}
	return $cache;
}

function elevation_setting( string $key ): mixed {
	return Settings::get( elevation_settings(), $key );
}

/** Scalar, non-secret setting for public output (tokens and bindings); null otherwise. */
function elevation_public_setting( string $key, bool $refresh = false ): string|int|float|bool|null {
	static $public = null;
	if ( $refresh ) {
		$public = null;
	}
	$public ??= Settings::publicValues( elevation_settings() );
	return $public[ $key ] ?? null;
}
