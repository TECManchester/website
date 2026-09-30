<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use Elevation\Core\ServiceDates;
use PHPUnit\Framework\TestCase;

final class ServiceDatesTest extends TestCase {

	public function test_the_next_eight_sundays_from_a_wednesday(): void {
		$dates = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-09-30T12:00:00+01:00' ) );
		$this->assertCount( 8, $dates );
		$this->assertSame( [ 'value' => '2026-10-04', 'label' => 'Sunday 4 October 2026' ], $dates[0] );
		$this->assertSame( '2026-11-22', $dates[7]['value'] );
	}

	public function test_today_counts_until_the_service_starts_in_london(): void {
		$before = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-10-04T09:29:00Z' ) ); // 10:29 BST
		$after  = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-10-04T09:30:00Z' ) ); // 10:30 BST
		$this->assertSame( '2026-10-04', $before[0]['value'] );
		$this->assertSame( '2026-10-11', $after[0]['value'] );
	}

	public function test_the_london_date_is_used_near_midnight_and_across_the_clock_change(): void {
		$dates = ServiceDates::next( 'Sunday', '10:30am', new DateTimeImmutable( '2026-10-24T23:30:00Z' ) ); // Sun 25 Oct 00:30 BST
		$this->assertSame( '2026-10-25', $dates[0]['value'] );
		$this->assertSame( '2026-11-01', $dates[1]['value'] ); // after the change to GMT, still a Sunday
	}

	public function test_other_days_and_spellings(): void {
		$now = new DateTimeImmutable( '2026-09-30T12:00:00Z' ); // Wednesday
		$this->assertSame( '2026-10-03', ServiceDates::next( 'saturdays', '6pm', $now, 1 )[0]['value'] );
		$this->assertSame( '2026-10-04', ServiceDates::next( 'Funday', '10:30am', $now, 1 )[0]['value'] ); // unknown → Sunday
		$this->assertSame( [], ServiceDates::next( 'Sunday', '10:30am', $now, 0 ) );
	}

	public function test_start_times(): void {
		$this->assertSame( 630, ServiceDates::startMinutes( '10:30am' ) );
		$this->assertSame( 630, ServiceDates::startMinutes( '10.30 a.m.' ) );
		$this->assertSame( 1080, ServiceDates::startMinutes( '6pm' ) );
		$this->assertSame( 720, ServiceDates::startMinutes( '12pm' ) );
		$this->assertSame( 30, ServiceDates::startMinutes( '12:30am' ) );
		$this->assertSame( 1110, ServiceDates::startMinutes( '18:30' ) );
		foreach ( [ '', 'soon', '13pm', '10:75', '18' ] as $bad ) {
			$this->assertNull( ServiceDates::startMinutes( $bad ), $bad );
		}
	}

	public function test_an_unreadable_start_time_keeps_today_all_day(): void {
		$dates = ServiceDates::next( 'Sunday', 'mid-morning', new DateTimeImmutable( '2026-10-04T20:00:00Z' ), 1 );
		$this->assertSame( '2026-10-04', $dates[0]['value'] );
	}
}
