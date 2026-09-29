<?php
namespace Elevation\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * The next service dates for the Plan a Visit form (spec §6.7), from Settings → Church's service day and
 * start time. Today counts until the service starts (London time). Pure — no WordPress calls.
 */
final class ServiceDates {

	private const DAYS = [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' ];

	/** "Sunday", "sundays", " SUNDAY " → "sunday"; anything else → "sunday". */
	public static function weekday( string $day ): string {
		$day = preg_replace( '/s$/', '', strtolower( trim( $day ) ) ) ?? '';
		return in_array( $day, self::DAYS, true ) ? $day : 'sunday';
	}

	/** "10:30am", "10.30 a.m.", "6pm", "18:30" → minutes after midnight; null if unreadable. */
	public static function startMinutes( string $time ): ?int {
		if ( ! preg_match( '/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*(?:m\.?)?\s*$/i', $time, $m ) || '' === trim( $time ) ) {
			return null;
		}
		$hour   = (int) $m[1];
		$minute = isset( $m[2] ) && '' !== $m[2] ? (int) $m[2] : null;
		$half   = strtolower( $m[3] ?? '' );
		if ( null !== $minute && $minute > 59 ) {
			return null;
		}
		if ( '' === $half ) {
			return ( null === $minute || $hour > 23 ) ? null : $hour * 60 + $minute;
		}
		if ( $hour < 1 || $hour > 12 ) {
			return null;
		}
		return ( $hour % 12 + ( 'p' === $half ? 12 : 0 ) ) * 60 + ( $minute ?? 0 );
	}

	/** @return list<array{value:string,label:string}> "2026-10-04" / "Sunday 4 October 2026", soonest first. */
	public static function next( string $day, string $startTime, DateTimeImmutable $now, int $count = 8 ): array {
		$local   = $now->setTimezone( new DateTimeZone( EventTime::TZ ) );
		$weekday = self::weekday( $day );
		$start   = self::startMinutes( $startTime ) ?? 24 * 60;
		$minutes = (int) $local->format( 'G' ) * 60 + (int) $local->format( 'i' );
		$first   = $local->setTime( 0, 0 );
		if ( strtolower( $local->format( 'l' ) ) !== $weekday || $minutes >= $start ) {
			$first = $first->modify( 'next ' . $weekday );
		}
		$dates = [];
		for ( $i = 0; $i < $count; $i++ ) {
			$date    = $first->modify( "+$i weeks" );
			$dates[] = [ 'value' => $date->format( 'Y-m-d' ), 'label' => $date->format( 'l j F Y' ) ];
		}
		return $dates;
	}
}
