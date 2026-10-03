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

	/** An https:// link to join an online event (Zoom, Teams, YouTube…); a site path or anything else becomes "". */
	public static function normaliseOnlineUrl( mixed $value ): string {
		$url = self::normaliseCtaUrl( $value );
		return str_starts_with( $url, 'https://' ) ? $url : '';
	}

	/** Online when it has a join link, or the venue says so ("Zoom", "Online", "Teams", "Google Meet", "YouTube"). */
	public static function isOnline( string $venue, string $onlineUrl ): bool {
		return '' !== $onlineUrl || 1 === preg_match( '/\b(zoom|online|teams|google meet|meet\.google|youtube|livestream|webinar)\b/i', $venue );
	}

	/** The join button's label, naming the service when the link's host gives it away: "Join on Zoom", else "Join online". */
	public static function joinLabel( string $onlineUrl ): string {
		$host = strtolower( (string) parse_url( $onlineUrl, PHP_URL_HOST ) );
		foreach ( [ 'zoom.' => 'Zoom', 'teams.' => 'Teams', 'youtube.' => 'YouTube', 'youtu.be' => 'YouTube', 'meet.google' => 'Google Meet' ] as $needle => $name ) {
			if ( '' !== $host && str_contains( $host, $needle ) ) {
				return "Join on $name";
			}
		}
		return 'Join online';
	}

	/**
	 * @param array{start?:mixed, end?:mixed, cta_url?:mixed, online_url?:mixed} $raw Values as submitted, before sanitising.
	 * @return list<string> Sentences for the editor, in field order.
	 */
	public static function errors( array $raw, bool $publishing ): array {
		$errors   = [];
		$startRaw = is_string( $raw['start'] ?? null ) ? trim( $raw['start'] ) : '';
		$endRaw   = is_string( $raw['end'] ?? null ) ? trim( $raw['end'] ) : '';
		$ctaRaw   = is_string( $raw['cta_url'] ?? null ) ? trim( $raw['cta_url'] ) : '';
		$joinRaw  = is_string( $raw['online_url'] ?? null ) ? trim( $raw['online_url'] ) : '';
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
		if ( '' !== $joinRaw && '' === self::normaliseOnlineUrl( $joinRaw ) ) {
			$errors[] = 'The online link must start with https://.';
		}
		return $errors;
	}
}
