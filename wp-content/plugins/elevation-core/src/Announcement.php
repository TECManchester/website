<?php
namespace Elevation\Core;

use DateTimeImmutable;

/**
 * The announcement's schedule and settings (spec §6.5). Times are London wall-clock "Y-m-d\TH:i", as events.
 * The server answers "is one showing now?"; the browser re-checks the window with its own clock. Pure.
 */
final class Announcement {

	public const DEFAULT_DISMISS_HOURS = 24;

	public static function dismissHours( mixed $value ): int {
		if ( is_string( $value ) && ctype_digit( trim( $value ) ) ) {
			$value = (int) trim( $value );
		}
		return is_int( $value ) && $value >= 1 && $value <= 720 ? $value : self::DEFAULT_DISMISS_HOURS;
	}

	/** Switched on, and now is inside [starts, ends). Blank ends are open; an unreadable time hides it. */
	public static function isLive( bool $active, string $starts, string $ends, DateTimeImmutable $now ): bool {
		if ( ! $active ) {
			return false;
		}
		$from = '' === $starts ? null : EventTime::parse( $starts );
		$to   = '' === $ends ? null : EventTime::parse( $ends );
		if ( ( '' !== $starts && null === $from ) || ( '' !== $ends && null === $to ) ) {
			return false;
		}
		return ( null === $from || $now >= $from ) && ( null === $to || $now < $to );
	}

	/** "2026-10-05T09:00" → "2026-10-05T09:00:00+01:00" for the browser; "" or unreadable → null. */
	public static function iso( string $local ): ?string {
		return ( '' === $local ? null : EventTime::parse( $local ) )?->format( DATE_ATOM );
	}

	/** @return list<string> Sentences for the editor; empty when the settings can be saved. */
	public static function errors( array $raw ): array {
		$errors   = [];
		$startRaw = trim( (string) ( $raw['starts'] ?? '' ) );
		$endRaw   = trim( (string) ( $raw['ends'] ?? '' ) );
		$start    = EventFields::normaliseDateTime( $startRaw );
		$end      = EventFields::normaliseDateTime( $endRaw );
		if ( '' !== $startRaw && '' === $start ) {
			$errors[] = "The start date and time aren't valid.";
		}
		if ( '' !== $endRaw && '' === $end ) {
			$errors[] = "The end date and time aren't valid.";
		} elseif ( '' !== $start && '' !== $end && $end <= $start ) {
			$errors[] = 'The end must be after the start.';
		}
		$cta = trim( (string) ( $raw['cta_url'] ?? '' ) );
		if ( '' !== $cta && '' === EventFields::normaliseCtaUrl( $cta ) ) {
			$errors[] = 'The button link must start with https:// or with / for a page on this site.';
		}
		if ( ! self::validHours( $raw['dismiss_hours'] ?? self::DEFAULT_DISMISS_HOURS ) ) {
			$errors[] = '"Hide for" must be a whole number of hours from 1 to 720.';
		}
		return $errors;
	}

	private static function validHours( mixed $value ): bool {
		if ( is_string( $value ) ) {
			$value = trim( $value );
			if ( ! ctype_digit( $value ) ) {
				return false;
			}
			$value = (int) $value;
		}
		return is_int( $value ) && $value >= 1 && $value <= 720;
	}
}
