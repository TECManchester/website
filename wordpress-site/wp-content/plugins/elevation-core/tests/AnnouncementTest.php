<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use Elevation\Core\Announcement;
use PHPUnit\Framework\TestCase;

final class AnnouncementTest extends TestCase {

	public function test_dismiss_hours_default_to_24_outside_1_to_720(): void {
		$this->assertSame( 48, Announcement::dismissHours( 48 ) );
		$this->assertSame( 720, Announcement::dismissHours( '720' ) );
		foreach ( [ 0, 721, -3, '1.5', 'week', null, '' ] as $bad ) {
			$this->assertSame( 24, Announcement::dismissHours( $bad ), var_export( $bad, true ) );
		}
	}

	public function test_live_means_switched_on_and_inside_the_london_window(): void {
		$now = new DateTimeImmutable( '2026-10-05T08:30:00Z' ); // 09:30 BST
		$this->assertTrue( Announcement::isLive( true, '', '', $now ) );
		$this->assertFalse( Announcement::isLive( false, '', '', $now ) );
		$this->assertTrue( Announcement::isLive( true, '2026-10-05T09:30', '', $now ) );   // starts this minute
		$this->assertFalse( Announcement::isLive( true, '2026-10-05T09:31', '', $now ) );
		$this->assertFalse( Announcement::isLive( true, '', '2026-10-05T09:30', $now ) );  // ended this minute
		$this->assertTrue( Announcement::isLive( true, '2026-10-01T00:00', '2026-10-12T00:00', $now ) );
		$this->assertFalse( Announcement::isLive( true, 'soon', '', $now ) );              // unreadable: not shown
	}

	public function test_iso_times_carry_the_london_offset(): void {
		$this->assertSame( '2026-10-05T09:00:00+01:00', Announcement::iso( '2026-10-05T09:00' ) );
		$this->assertSame( '2026-11-05T09:00:00+00:00', Announcement::iso( '2026-11-05T09:00' ) );
		$this->assertNull( Announcement::iso( '' ) );
		$this->assertNull( Announcement::iso( 'nope' ) );
	}

	public function test_editor_errors(): void {
		$this->assertSame( [], Announcement::errors( [ 'starts' => '2026-10-01T09:00', 'ends' => '2026-10-02T09:00', 'cta_url' => '/im-new', 'dismiss_hours' => 24 ] ) );
		$this->assertSame(
			[
				'The end must be after the start.',
				'The button link must start with https:// or with / for a page on this site.',
				'"Hide for" must be a whole number of hours from 1 to 720.',
			],
			Announcement::errors( [ 'starts' => '2026-10-02T09:00', 'ends' => '2026-10-02T09:00', 'cta_url' => 'javascript:alert(1)', 'dismiss_hours' => 0 ] )
		);
		$this->assertSame( [ "The start date and time aren't valid." ], Announcement::errors( [ 'starts' => '2026-13-01T09:00' ] ) );
	}
}
