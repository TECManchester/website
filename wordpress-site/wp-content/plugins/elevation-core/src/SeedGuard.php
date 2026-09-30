<?php
namespace Elevation\Core;

/**
 * Decides what the seed may do to a post. A post whose content no longer matches the hash stored
 * when it was last seeded has been edited by hand, and is left alone unless forced.
 */
final class SeedGuard {

	public const CREATE    = 'create';
	public const UPDATE    = 'update';
	public const UNCHANGED = 'unchanged';
	public const SKIP      = 'skip';

	public static function hash( string $content ): string {
		return sha1( trim( str_replace( "\r\n", "\n", $content ) ) );
	}

	public static function decide( ?string $storedHash, ?string $currentContent, string $newContent, bool $force ): string {
		if ( null === $currentContent ) {
			return self::CREATE;
		}
		$current = self::hash( $currentContent );
		if ( $current === self::hash( $newContent ) ) {
			return self::UNCHANGED;
		}
		if ( $force ) {
			return self::UPDATE;
		}
		return ( null !== $storedHash && $storedHash === $current ) ? self::UPDATE : self::SKIP;
	}
}
