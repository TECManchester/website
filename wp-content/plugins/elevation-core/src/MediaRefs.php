<?php
namespace Elevation\Core;

/**
 * Seed files refer to media by their path under seed/media: {{media:redesign/hero/x.jpg}} becomes the
 * attachment URL and {{media-id:…}} its ID. unresolve() turns an exported page back into refs.
 * Pure — no WordPress calls.
 */
final class MediaRefs {

	private const PATTERN = '/\{\{media(-id)?:([a-z0-9][a-z0-9._\/-]*)\}\}/';

	/** @return list<string> */
	public static function paths( string $content ): array {
		preg_match_all( self::PATTERN, $content, $m );
		return array_values( array_unique( $m[2] ) );
	}

	/** @param callable(string): (array{id:int,url:string}|null) $lookup */
	public static function replace( string $content, callable $lookup ): string {
		return (string) preg_replace_callback(
			self::PATTERN,
			static function ( array $m ) use ( $lookup ): string {
				$path = $m[2];
				if ( str_contains( $path, '..' ) ) {
					throw new \RuntimeException( "Unsafe media path: $path" );
				}
				$media = $lookup( $path );
				if ( null === $media ) {
					throw new \RuntimeException( "Unknown media (import it first): $path" );
				}
				return '-id' === $m[1] ? (string) (int) $media['id'] : (string) $media['url'];
			},
			$content
		);
	}

	/**
	 * Replace seeded attachments' URLs and IDs with refs again. IDs are only rewritten where blocks keep
	 * them: "id":N inside block comments, and the wp-image-N class.
	 *
	 * @param array<int, array{path:string, url:string}> $byId
	 */
	public static function unresolve( string $content, array $byId ): string {
		foreach ( $byId as $id => $media ) {
			$content = str_replace( $media['url'], '{{media:' . $media['path'] . '}}', $content );
			$content = preg_replace( '/\bwp-image-' . (int) $id . '\b/', 'wp-image-{{media-id:' . $media['path'] . '}}', $content );
		}
		return (string) preg_replace_callback(
			'/<!-- wp:[^>]*?-->/s',
			static function ( array $m ) use ( $byId ): string {
				return preg_replace_callback(
					'/"(id|mediaId)":(\d+)\b/',
					static fn ( array $n ) => isset( $byId[ (int) $n[2] ] ) ? '"' . $n[1] . '":{{media-id:' . $byId[ (int) $n[2] ]['path'] . '}}' : $n[0],
					$m[0]
				);
			},
			$content
		);
	}
}
