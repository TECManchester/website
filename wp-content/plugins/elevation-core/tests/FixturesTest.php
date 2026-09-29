<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use DateTimeZone;
use Elevation\Core\Fixtures;
use PHPUnit\Framework\TestCase;

final class FixturesTest extends TestCase {

	public function test_relative_days_and_a_time_become_london_wall_clock(): void {
		$today = new DateTimeImmutable( '2026-10-24T23:30:00', new DateTimeZone( 'UTC' ) ); // already 25 Oct in London
		$this->assertSame( '2026-11-03T19:00', Fixtures::when( '+9 19:00', $today ) );
		$this->assertSame( '2026-10-24T10:00', Fixtures::when( '-1 10:00', $today ) );
		$this->assertSame( '2026-10-25T07:30', Fixtures::when( '+0 07:30', $today ) );
		$this->assertSame( '', Fixtures::when( '', $today ) );
	}

	public function test_bad_relative_values_are_refused(): void {
		foreach ( [ '9 19:00', '+9', '+9 7pm', 'tomorrow', '+9 25:00' ] as $bad ) {
			try {
				Fixtures::when( $bad, new DateTimeImmutable( '2026-10-01T12:00:00Z' ) );
				$this->fail( "accepted $bad" );
			} catch ( \InvalidArgumentException $e ) {
				$this->assertStringContainsString( $bad, $e->getMessage() );
			}
		}
	}

	public function test_paragraphs_are_escaped_paragraph_blocks(): void {
		$this->assertSame(
			"<!-- wp:paragraph -->\n<p>Food &amp; games.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Bring &lt;everyone&gt;.</p>\n<!-- /wp:paragraph -->",
			Fixtures::paragraphs( "Food & games.\n\n\n  Bring <everyone>.  \n" )
		);
		$this->assertSame( '', Fixtures::paragraphs( "  \n\n " ) );
	}
}
