<?php
namespace Elevation\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Event dates and their wording, always in Europe/London (spec §6.2). Pure — no WordPress calls.
 *
 * Times are stored as London wall-clock strings "Y-m-d\TH:i" (what the editor's date picker gives), so a
 * stored 19:00 means 7pm in London whatever the server's timezone. String order is time order.
 */
final class EventTime {

	public const TZ = 'Europe/London';

	/** en-GB short months as the redesign's Intl formatting prints them (CLDR: "Sept"). */
	private const MONTHS_SHORT = [ 1 => 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ];

	public static function parse( string $local ): ?DateTimeImmutable {
		if ( ! preg_match( '/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/', $local, $m ) ) {
			return null;
		}
		if ( ! checkdate( (int) $m[2], (int) $m[3], (int) $m[1] ) || (int) $m[4] > 23 || (int) $m[5] > 59 ) {
			return null;
		}
		return new DateTimeImmutable( $local, new DateTimeZone( self::TZ ) );
	}

	public static function todayKey( DateTimeImmutable $now ): string {
		return $now->setTimezone( new DateTimeZone( self::TZ ) )->format( 'Y-m-d' );
	}

	public static function dateKey( string $local ): string {
		return null === self::parse( $local ) ? '' : substr( $local, 0, 10 );
	}

	/** The last day the event is on: the end's date, or the start's when there is no end. */
	public static function untilKey( string $start, string $end ): string {
		$startKey = self::dateKey( $start );
		if ( '' === $startKey ) {
			return '';
		}
		$endKey = self::dateKey( $end );
		return ( '' !== $endKey && $endKey > $startKey ) ? $endKey : $startKey;
	}

	public static function isUpcoming( string $start, string $end, DateTimeImmutable $now ): bool {
		$until = self::untilKey( $start, $end );
		return '' !== $until && $until >= self::todayKey( $now );
	}

	public static function isMultiDay( string $start, string $end ): bool {
		$endKey = self::dateKey( $end );
		return '' !== $endKey && '' !== self::dateKey( $start ) && $endKey !== self::dateKey( $start );
	}

	public static function formatTime( string $start, string $end, bool $tbc ): string {
		$from = self::parse( $start );
		if ( null === $from ) {
			return '';
		}
		if ( $tbc ) {
			return 'Time to be confirmed';
		}
		$first = $from->format( 'g:i a' );
		$to    = self::parse( $end );
		if ( null === $to || $end === $start || self::isMultiDay( $start, $end ) ) {
			return $first;
		}
		return $first . " \u{2013} " . $to->format( 'g:i a' );
	}

	public static function formatDate( string $local ): string {
		return self::parse( $local )?->format( 'l j F Y' ) ?? '';
	}

	/** "18 Oct – 20 Oct" for a multi-day event; otherwise the full date. */
	public static function formatRange( string $start, string $end ): string {
		if ( ! self::isMultiDay( $start, $end ) ) {
			return self::formatDate( $start );
		}
		return self::dayNumber( $start ) . ' ' . self::monthShort( $start ) . " \u{2013} " . self::dayNumber( $end ) . ' ' . self::monthShort( $end );
	}

	public static function dayNumber( string $local ): string {
		return self::parse( $local )?->format( 'j' ) ?? '';
	}

	public static function monthShort( string $local ): string {
		$date = self::parse( $local );
		return null === $date ? '' : self::MONTHS_SHORT[ (int) $date->format( 'n' ) ];
	}

	/** @return list<string> Every date the event is on, start first, at most $cap of them. */
	public static function dayKeys( string $start, string $end, int $cap = 31 ): array {
		$first = self::dateKey( $start );
		if ( '' === $first ) {
			return [];
		}
		$last = self::untilKey( $start, $end );
		$keys = [];
		$day  = new DateTimeImmutable( $first . 'T12:00', new DateTimeZone( self::TZ ) );
		while ( count( $keys ) < $cap && $day->format( 'Y-m-d' ) <= $last ) {
			$keys[] = $day->format( 'Y-m-d' );
			$day    = $day->modify( '+1 day' );
		}
		return $keys;
	}
}
