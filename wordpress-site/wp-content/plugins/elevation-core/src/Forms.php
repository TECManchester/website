<?php
namespace Elevation\Core;

/**
 * The church's nine forms (spec §6.10), by the key that pages, seed files and code use. Prayer and Gift Aid
 * entries are for Administrators only (spec §7). Pure — no WordPress calls.
 */
final class Forms {

	public const KEYS       = [ 'contact', 'prayer', 'gift-aid', 'newsletter', 'g-squad', 'plan-a-visit', 'join-group', 'connect-card', 'alpha' ];
	public const ADMIN_ONLY = [ 'prayer', 'gift-aid' ];

	public static function isKey( string $key ): bool {
		return in_array( $key, self::KEYS, true );
	}

	/** @return list<string> */
	public static function siteManagerKeys(): array {
		return array_values( array_diff( self::KEYS, self::ADMIN_ONLY ) );
	}
}
