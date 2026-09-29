<?php
namespace Elevation\Core;

/**
 * A Connect Group's meeting day and time, the leader's first name for the card, and the directory's filters
 * (spec §6.6). Pure — no WordPress calls.
 */
final class GroupFields {

	public const DAYS = [
		'monday'    => 'Monday',
		'tuesday'   => 'Tuesday',
		'wednesday' => 'Wednesday',
		'thursday'  => 'Thursday',
		'friday'    => 'Friday',
		'saturday'  => 'Saturday',
		'sunday'    => 'Sunday',
	];

	public static function day( mixed $value ): string {
		$day = is_string( $value ) ? strtolower( trim( $value ) ) : '';
		return isset( self::DAYS[ $day ] ) ? $day : '';
	}

	/** "19:30" (24-hour, from the editor's time input) or "". */
	public static function time( mixed $value ): string {
		return is_string( $value ) && preg_match( '/^(?:[01]\d|2[0-3]):[0-5]\d$/', trim( $value ) ) ? trim( $value ) : '';
	}

	public const FREQUENCIES = [ 'weekly', 'fortnightly' ];

	/** The longest a town line, or the town search box, may be. */
	public const TOWN_MAX = 60;

	/** "weekly" (the default) or "fortnightly"; anything else is weekly. */
	public static function frequency( mixed $value ): string {
		$frequency = is_string( $value ) ? strtolower( trim( $value ) ) : '';
		return in_array( $frequency, self::FREQUENCIES, true ) ? $frequency : 'weekly';
	}

	/** "Tuesdays · 7:30 pm", "Every other Sunday · 8:00 pm", a day alone, a time alone, or "". */
	public static function when( string $day, string $time, string $frequency = 'weekly' ): string {
		$parts = [];
		if ( isset( self::DAYS[ $day ] ) ) {
			$parts[] = 'fortnightly' === self::frequency( $frequency ) ? 'Every other ' . self::DAYS[ $day ] : self::DAYS[ $day ] . 's';
		}
		if ( '' !== self::time( $time ) ) {
			$parts[] = EventTime::formatTime( '2026-01-05T' . $time, '', false );
		}
		return implode( " \u{00B7} ", $parts );
	}

	/**
	 * One town per line, from the editor's textarea (string) or an array: tags stripped, trimmed, blanks and
	 * case-insensitive repeats dropped, each at most TOWN_MAX characters.
	 *
	 * @return list<string>
	 */
	public static function towns( mixed $value ): array {
		$lines = is_string( $value ) ? preg_split( '/\R/u', $value ) : ( is_array( $value ) ? $value : [] );
		$out   = [];
		$seen  = [];
		foreach ( (array) $lines as $line ) {
			if ( ! is_string( $line ) ) {
				continue;
			}
			$town = mb_substr( trim( strip_tags( $line ) ), 0, self::TOWN_MAX );
			$town = trim( $town );
			$key  = mb_strtolower( $town );
			if ( '' === $town || isset( $seen[ $key ] ) ) {
				continue;
			}
			$seen[ $key ] = true;
			$out[]        = $town;
		}
		return $out;
	}

	/** Lower-case, "&" as "and", every other run of non-letters/digits as one space: how towns are compared. */
	public static function townKey( string $value ): string {
		$key = str_replace( '&', ' and ', mb_strtolower( $value ) );
		return trim( (string) preg_replace( '/[^\p{L}\p{N}]+/u', ' ', $key ) );
	}

	/**
	 * Whether a visitor's search names one of a group's towns or boroughs: the same key, or a whole word (or run
	 * of words) inside a town ("Gatley" finds "Cheadle & Gatley"; "Sal" finds nothing).
	 *
	 * @param list<string> $towns
	 * @param list<string> $areas Borough names.
	 */
	public static function matchesTown( string $query, array $towns, array $areas ): bool {
		$q = self::townKey( $query );
		if ( '' === $q ) {
			return false;
		}
		foreach ( $areas as $area ) {
			if ( self::townKey( (string) $area ) === $q ) {
				return true;
			}
		}
		foreach ( $towns as $town ) {
			$key = self::townKey( (string) $town );
			if ( $key === $q || str_contains( ' ' . $key . ' ', ' ' . $q . ' ' ) ) {
				return true;
			}
		}
		return false;
	}

	public static function firstName( string $leader ): string {
		$leader = trim( (string) preg_replace( '/\s+/u', ' ', $leader ) );
		return '' === $leader ? '' : explode( ' ', $leader )[0];
	}

	/**
	 * @param array        $query      The request's query string ($_GET, unslashed).
	 * @param list<string> $areas      Area slugs that have published groups.
	 * @param list<string> $categories Group-type slugs that have published groups.
	 * @return array{area:string,type:string,meets:string,town:string}
	 */
	public static function filters( array $query, array $areas, array $categories ): array {
		$pick = static fn ( string $key, array $allowed ): string => is_string( $query[ $key ] ?? null ) && in_array( $query[ $key ], $allowed, true ) ? $query[ $key ] : '';
		$town = is_string( $query['town'] ?? null ) ? trim( mb_substr( trim( strip_tags( $query['town'] ) ), 0, self::TOWN_MAX ) ) : '';
		return [ 'area' => $pick( 'area', $areas ), 'type' => $pick( 'type', $categories ), 'meets' => $pick( 'meets', array_keys( self::DAYS ) ), 'town' => $town ];
	}
}
