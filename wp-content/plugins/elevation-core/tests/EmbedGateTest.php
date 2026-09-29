<?php
namespace Elevation\Core\Tests;

use Elevation\Core\EmbedGate;
use Elevation\Core\Settings;
use PHPUnit\Framework\TestCase;

final class EmbedGateTest extends TestCase {

	public function test_settings_map_embed_is_allowed(): void {
		$src = Settings::resolve( [] )['location']['embedUrl'];
		$this->assertSame( $src, EmbedGate::allowedSrc( 'map', $src ) );
	}

	public function test_nocookie_youtube_and_podbean_are_allowed(): void {
		$this->assertNotNull( EmbedGate::allowedSrc( 'video', 'https://www.youtube-nocookie.com/embed/abc123' ) );
		$this->assertNotNull( EmbedGate::allowedSrc( 'audio', 'https://www.podbean.com/player-v2/?i=ktx57-6f746-pbblog-playlist' ) );
	}

	/** @return array<string, array{string, string}> */
	public static function rejected(): array {
		return [
			'plain http'           => [ 'map', 'http://www.google.com/maps?q=x&output=embed' ],
			'lookalike host'       => [ 'map', 'https://www.google.com.evil.example/maps' ],
			'google, not maps'     => [ 'map', 'https://www.google.com/search?q=x' ],
			'tracking youtube'     => [ 'video', 'https://www.youtube.com/embed/abc123' ],
			'wrong kind for host'  => [ 'audio', 'https://www.youtube-nocookie.com/embed/abc123' ],
			'javascript url'       => [ 'video', 'javascript:alert(1)' ],
			'unknown kind'         => [ 'iframe', 'https://www.google.com/maps' ],
			'empty'                => [ 'map', '' ],
		];
	}

	#[\PHPUnit\Framework\Attributes\DataProvider( 'rejected' )]
	public function test_other_sources_are_rejected( string $kind, string $src ): void {
		$this->assertNull( EmbedGate::allowedSrc( $kind, $src ) );
	}

	public function test_copy_per_kind(): void {
		$this->assertSame( 'Show the map', EmbedGate::copy( 'map' )['button'] );
		$this->assertSame( 'Loads from YouTube', EmbedGate::copy( 'video' )['note'] );
		$this->assertSame( 'headphones', EmbedGate::copy( 'audio' )['icon'] );
		$this->assertSame( [], EmbedGate::copy( 'nope' ) );
	}
}
