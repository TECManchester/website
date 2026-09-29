<?php
namespace Elevation\Core;

/**
 * Inline settings tokens: "{service.startTime}" in any rendered block becomes the setting's value.
 * Only keys the lookup knows are replaced, so CSS/JS braces and typos pass through untouched.
 */
final class Tokens {

	private const PATTERN = '/\{([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)\}/';

	/**
	 * @param bool $escape HTML-escape values (default; for markup). False for plain-text contexts.
	 * @param callable(string): (string|int|float|bool|null) $lookup
	 */
	public static function replace( string $html, callable $lookup, bool $escape = true ): string {
		if ( ! str_contains( $html, '{' ) ) {
			return $html;
		}
		return preg_replace_callback(
			self::PATTERN,
			static function ( array $m ) use ( $lookup, $escape ): string {
				$value = $lookup( $m[1] );
				if ( null === $value || ! is_scalar( $value ) ) {
					return $m[0];
				}
				return $escape ? htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' ) : (string) $value;
			},
			$html
		) ?? $html;
	}
}
