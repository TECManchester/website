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

	/** "Tuesdays · 7:30 pm", "Tuesdays", "7:30 pm" or "". */
	public static function when( string $day, string $time ): string {
		$parts = [];
		if ( isset( self::DAYS[ $day ] ) ) {
			$parts[] = self::DAYS[ $day ] . 's';
		}
		if ( '' !== self::time( $time ) ) {
			$parts[] = EventTime::formatTime( '2026-01-05T' . $time, '', false );
		}
		return implode( " \u{00B7} ", $parts );
	}

	public static function firstName( string $leader ): string {
		$leader = trim( (string) preg_replace( '/\s+/u', ' ', $leader ) );
		return '' === $leader ? '' : explode( ' ', $leader )[0];
	}

	/**
	 * @param array        $query      The request's query string ($_GET, unslashed).
	 * @param list<string> $areas      Area slugs that have published groups.
	 * @param list<string> $categories Group-type slugs that have published groups.
	 * @return array{area:string,type:string,meets:string}
	 */
	public static function filters( array $query, array $areas, array $categories ): array {
		$pick = static fn ( string $key, array $allowed ): string => is_string( $query[ $key ] ?? null ) && in_array( $query[ $key ], $allowed, true ) ? $query[ $key ] : '';
		return [ 'area' => $pick( 'area', $areas ), 'type' => $pick( 'type', $categories ), 'meets' => $pick( 'meets', array_keys( self::DAYS ) ) ];
	}
}
