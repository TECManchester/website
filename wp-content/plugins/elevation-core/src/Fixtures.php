<?php
namespace Elevation\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Helpers for seed/fixtures/*.json: dates relative to the day of seeding (so fixtures are always "coming
 * up") and plain-text descriptions as paragraph blocks. Pure — no WordPress calls.
 */
final class Fixtures {

	/** "+9 19:00" → nine days after today (London) at 19:00, as "Y-m-d\TH:i". "" stays "". */
	public static function when( string $relative, DateTimeImmutable $today ): string {
		if ( '' === $relative ) {
			return '';
		}
		if ( ! preg_match( '/^([+-]\d{1,3}) ([01]\d|2[0-3]):([0-5]\d)$/', $relative, $m ) ) {
			throw new \InvalidArgumentException( "Fixture date must look like \"+9 19:00\": $relative" );
		}
		$day = $today->setTimezone( new DateTimeZone( EventTime::TZ ) )->setTime( 12, 0 )->modify( $m[1] . ' days' );
		return $day->format( 'Y-m-d' ) . 'T' . $m[2] . ':' . $m[3];
	}

	public static function paragraphs( string $text ): string {
		$blocks = [];
		foreach ( preg_split( '/\n\s*\n/', trim( str_replace( "\r\n", "\n", $text ) ) ) ?: [] as $para ) {
			$para = trim( $para );
			if ( '' !== $para ) {
				$blocks[] = "<!-- wp:paragraph -->\n<p>" . htmlspecialchars( $para, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) . "</p>\n<!-- /wp:paragraph -->";
			}
		}
		return implode( "\n\n", $blocks );
	}
}
