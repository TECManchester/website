<?php
namespace Elevation\Core;

/**
 * 5 submissions per 10 minutes per IP per form (spec §6.10), as a sliding window over submission times.
 * Pure — the caller keeps the timestamps (a transient keyed by a salted hash of the IP).
 */
final class RateLimit {

	public const MAX    = 5;
	public const WINDOW = 600;

	/** @return list<int> The stamps inside the window ending now; junk and future stamps dropped. */
	public static function recent( array $stamps, int $now, int $window = self::WINDOW ): array {
		$kept = [];
		foreach ( $stamps as $stamp ) {
			if ( is_int( $stamp ) && $stamp > $now - $window && $stamp <= $now ) {
				$kept[] = $stamp;
			}
		}
		return $kept;
	}

	public static function allows( array $stamps, int $now, int $max = self::MAX, int $window = self::WINDOW ): bool {
		return count( self::recent( $stamps, $now, $window ) ) < $max;
	}

	/** Whole minutes (at least 1) until the oldest stamp leaves the window; 0 when there are none. */
	public static function waitMinutes( array $stamps, int $now, int $window = self::WINDOW ): int {
		$recent = self::recent( $stamps, $now, $window );
		return $recent ? max( 1, (int) ceil( ( min( $recent ) + $window - $now ) / 60 ) ) : 0;
	}

	public static function message( int $minutes ): string {
		$minutes = max( 1, $minutes );
		return sprintf( "That's a few submissions in a short time. Please wait about %d %s and try again.", $minutes, 1 === $minutes ? 'minute' : 'minutes' );
	}
}
