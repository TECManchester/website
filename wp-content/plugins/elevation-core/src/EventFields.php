<?php
namespace Elevation\Core;

/**
 * Rules for an event's fields (spec §6.2): used to sanitise stored meta and to refuse a publish whose
 * dates or button link are wrong. Pure — no WordPress calls.
 */
final class EventFields {

	/** "2026-10-18T19:00", "…T19:00:00" (the editor's date picker) or "2026-10-18 19:00" → "2026-10-18T19:00"; else "". */
	public static function normaliseDateTime( mixed $value ): string {
		if ( ! is_string( $value ) || ! preg_match( '/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/', trim( $value ), $m ) ) {
			return '';
		}
		$local = $m[1] . 'T' . $m[2];
		return null === EventTime::parse( $local ) ? '' : $local;
	}

	/** An https:// URL or a path on this site ("/contact"); anything else becomes "". */
	public static function normaliseCtaUrl( mixed $value ): string {
		$url = is_string( $value ) ? trim( $value ) : '';
		if ( '' === $url || str_contains( $url, '\\' ) || preg_match( '/\s/', $url ) ) {
			return '';
		}
		if ( str_starts_with( $url, '/' ) && ! str_starts_with( $url, '//' ) ) {
			return $url;
		}
		return preg_match( '#^https://[a-z0-9.-]+(?::\d+)?(?:[/?\#].*)?$#i', $url ) ? $url : '';
	}

	/**
	 * @param array{start?:mixed, end?:mixed, cta_url?:mixed} $raw Values as submitted, before sanitising.
	 * @return list<string> Sentences for the editor, in field order.
	 */
	public static function errors( array $raw, bool $publishing ): array {
		$errors   = [];
		$startRaw = is_string( $raw['start'] ?? null ) ? trim( $raw['start'] ) : '';
		$endRaw   = is_string( $raw['end'] ?? null ) ? trim( $raw['end'] ) : '';
		$ctaRaw   = is_string( $raw['cta_url'] ?? null ) ? trim( $raw['cta_url'] ) : '';
		$start    = self::normaliseDateTime( $startRaw );
		$end      = self::normaliseDateTime( $endRaw );

		if ( '' !== $startRaw && '' === $start ) {
			$errors[] = "The start date and time aren't valid.";
		} elseif ( '' === $start && $publishing ) {
			$errors[] = 'An event needs a start date and time before it can be published.';
		}
		if ( '' !== $endRaw && '' === $end ) {
			$errors[] = "The end date and time aren't valid.";
		} elseif ( '' !== $start && '' !== $end && $end < $start ) {
			$errors[] = 'The end must be the same as or after the start.';
		}
		if ( '' !== $ctaRaw && '' === self::normaliseCtaUrl( $ctaRaw ) ) {
			$errors[] = 'The button link must start with https:// or with / for a page on this site.';
		}
		return $errors;
	}
}
