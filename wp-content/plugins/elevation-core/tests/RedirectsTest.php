<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Redirects;
use PHPUnit\Framework\TestCase;

final class RedirectsTest extends TestCase {

	public function test_parses_pairs_skipping_comments_and_blank_lines(): void {
		$text = "# old pages\n\n/home /\n/volunteer   /get-involved#serve\r\n/x https://example.org/y\n";
		$this->assertSame( [ [ '/home', '/' ], [ '/volunteer', '/get-involved#serve' ], [ '/x', 'https://example.org/y' ] ], Redirects::parse( $text ) );
	}

	/** @return array<string, array{string}> */
	public static function bad(): array {
		return [
			'one field'            => [ "/home\n" ],
			'three fields'         => [ "/a /b /c\n" ],
			'source not a path'    => [ "home /\n" ],
			'protocol-relative'    => [ "//evil.example /\n" ],
			'plain http target'    => [ "/a http://example.org\n" ],
			'javascript target'    => [ "/a javascript:alert(1)\n" ],
		];
	}

	#[\PHPUnit\Framework\Attributes\DataProvider( 'bad' )]
	public function test_rejects_bad_lines_naming_the_line( string $text ): void {
		$this->expectException( \InvalidArgumentException::class );
		$this->expectExceptionMessage( 'Line 1' );
		Redirects::parse( $text );
	}
}
