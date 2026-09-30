<?php
namespace Elevation\Core;

/** seed/redirects.txt: "<from> <to>" per line; # comments. Pure — no WordPress calls. */
final class Redirects {

	/** @return list<array{0:string, 1:string}> */
	public static function parse( string $text ): array {
		$pairs = [];
		foreach ( preg_split( '/\R/', $text ) as $i => $line ) {
			$line = trim( $line );
			if ( '' === $line || str_starts_with( $line, '#' ) ) {
				continue;
			}
			$where = 'Line ' . ( $i + 1 );
			$parts = preg_split( '/\s+/', $line );
			if ( 2 !== count( $parts ) ) {
				throw new \InvalidArgumentException( "$where: expected \"<from> <to>\"" );
			}
			[ $from, $to ] = $parts;
			if ( ! str_starts_with( $from, '/' ) || str_starts_with( $from, '//' ) ) {
				throw new \InvalidArgumentException( "$where: the source must be a path starting with one /" );
			}
			if ( ! ( ( str_starts_with( $to, '/' ) && ! str_starts_with( $to, '//' ) ) || str_starts_with( $to, 'https://' ) ) ) {
				throw new \InvalidArgumentException( "$where: the target must be a /path or an https:// URL" );
			}
			$pairs[] = [ $from, $to ];
		}
		return $pairs;
	}
}
