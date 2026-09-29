<?php
namespace Elevation\Core;

/**
 * Which third-party players the embed gate may load. Anything else renders nothing, so the privacy
 * notice's list of processors stays true whatever an editor pastes in.
 */
final class EmbedGate {

	private const RULES = [
		'map'   => [ 'hosts' => [ 'www.google.com', 'maps.google.com' ], 'path' => '/maps' ],
		'video' => [ 'hosts' => [ 'www.youtube-nocookie.com' ], 'path' => '/embed/' ],
		'audio' => [ 'hosts' => [ 'www.podbean.com' ], 'path' => '/player-v2/' ],
	];

	public static function allowedSrc( string $kind, string $src ): ?string {
		$rule  = self::RULES[ $kind ] ?? null;
		$parts = parse_url( $src );
		if ( null === $rule || ! is_array( $parts ) || 'https' !== ( $parts['scheme'] ?? '' ) ) {
			return null;
		}
		// A backslash or userinfo can make browsers and parse_url disagree about the host.
		if ( str_contains( $src, '\\' ) || isset( $parts['user'] ) || isset( $parts['pass'] ) ) {
			return null;
		}
		$host_ok = in_array( strtolower( $parts['host'] ?? '' ), $rule['hosts'], true );
		$path_ok = str_starts_with( $parts['path'] ?? '', $rule['path'] );
		return $host_ok && $path_ok ? $src : null;
	}

	/** @return array{button:string, note:string, icon:string, title:string}|array{} */
	public static function copy( string $kind ): array {
		return [
			'map'   => [ 'button' => 'Show the map', 'note' => 'Loads from Google Maps', 'icon' => 'map-pin', 'title' => 'Find us on the map' ],
			'video' => [ 'button' => 'Play the video', 'note' => 'Loads from YouTube', 'icon' => 'play', 'title' => 'Watch the video' ],
			'audio' => [ 'button' => 'Play the podcast', 'note' => 'Loads from Podbean', 'icon' => 'headphones', 'title' => 'Listen to the podcast' ],
		][ $kind ] ?? [];
	}
}
