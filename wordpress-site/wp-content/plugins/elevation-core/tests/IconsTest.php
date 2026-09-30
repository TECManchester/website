<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Icons;
use PHPUnit\Framework\TestCase;

final class IconsTest extends TestCase {

	public function test_known_icon_is_decorative_svg(): void {
		$svg = Icons::svg( 'clock' );
		$this->assertStringStartsWith( '<svg ', $svg );
		$this->assertStringContainsString( 'aria-hidden="true"', $svg );
		$this->assertStringContainsString( 'class="lucide lucide-clock"', $svg );
		$this->assertStringEndsWith( '</svg>', $svg );
	}

	public function test_unknown_icon_is_empty(): void {
		$this->assertSame( '', Icons::svg( 'not-an-icon' ) );
		$this->assertSame( '', Icons::svg( '../clock' ) );
	}

	public function test_extra_class_is_escaped(): void {
		$this->assertStringContainsString( 'class="lucide lucide-play is-filled &quot;x"', Icons::svg( 'play', 'is-filled "x' ) );
	}

	public function test_block_enum_matches_the_icon_set(): void {
		$block = json_decode( (string) file_get_contents( __DIR__ . '/../src/blocks/icon/block.json' ), true );
		$this->assertSame( Icons::names(), $block['attributes']['name']['enum'] );
		$this->assertCount( 24, Icons::names() );
	}
}
