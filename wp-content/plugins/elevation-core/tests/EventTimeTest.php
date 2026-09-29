<?php
namespace Elevation\Core\Tests;

use DateTimeImmutable;
use DateTimeZone;
use Elevation\Core\EventTime;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class EventTimeTest extends TestCase {

	private static function utc( string $iso ): DateTimeImmutable {
		return new DateTimeImmutable( $iso, new DateTimeZone( 'UTC' ) );
	}

	public function test_parse_accepts_only_real_london_wall_clock_times(): void {
		$this->assertSame( '2026-10-18 19:00 Europe/London', EventTime::parse( '2026-10-18T19:00' )?->format( 'Y-m-d H:i e' ) );
		foreach ( [ '', '2026-10-18', '2026-10-18T19:00:00', '2026-02-30T10:00', '2026-10-18T24:00', '2026-10-18T19:60', 'tomorrow', '2026-10-18T19:00Z' ] as $bad ) {
			$this->assertNull( EventTime::parse( $bad ), $bad );
		}
	}

	public function test_today_is_londons_date_not_the_servers(): void {
		// 23:30 UTC on 24 Oct 2026 is 00:30 BST on 25 Oct (the clocks change at 01:00 UTC that night).
		$this->assertSame( '2026-10-25', EventTime::todayKey( self::utc( '2026-10-24T23:30:00' ) ) );
		// In winter (GMT) London and UTC agree.
		$this->assertSame( '2026-12-01', EventTime::todayKey( self::utc( '2026-12-01T23:30:00' ) ) );
		// 00:30 BST on 1 Jun is still 31 May in UTC.
		$this->assertSame( '2026-06-01', EventTime::todayKey( self::utc( '2026-05-31T23:30:00' ) ) );
	}

	public function test_upcoming_uses_the_london_midnight_boundary(): void {
		$justAfterLondonMidnight = self::utc( '2026-06-30T23:05:00' ); // 00:05 BST, 1 July
		$this->assertFalse( EventTime::isUpcoming( '2026-06-30T19:00', '2026-06-30T21:00', $justAfterLondonMidnight ), 'finished last night' );
		$this->assertTrue( EventTime::isUpcoming( '2026-07-01T19:00', '', $justAfterLondonMidnight ), 'tonight' );
		$lateSameDay = self::utc( '2026-06-30T22:55:00' ); // 23:55 BST, 30 June
		$this->assertTrue( EventTime::isUpcoming( '2026-06-30T19:00', '2026-06-30T21:00', $lateSameDay ), 'earlier today still counts all day' );
	}

	public function test_multi_day_event_in_progress_stays_upcoming(): void {
		$now = self::utc( '2026-10-19T12:00:00' );
		$this->assertTrue( EventTime::isUpcoming( '2026-10-18T10:00', '2026-10-20T16:00', $now ) );
		$this->assertFalse( EventTime::isUpcoming( '2026-10-16T10:00', '2026-10-18T16:00', $now ) );
		$this->assertSame( '2026-10-20', EventTime::untilKey( '2026-10-18T10:00', '2026-10-20T16:00' ) );
		$this->assertSame( '2026-10-18', EventTime::untilKey( '2026-10-18T10:00', '' ) );
	}

	/** @return array<string, array{string, string, bool, string}> */
	public static function times(): array {
		return [
			'start only'            => [ '2026-10-18T19:00', '', false, '7:00 pm' ],
			'same-day range'        => [ '2026-10-18T19:00', '2026-10-18T21:30', false, "7:00 pm \u{2013} 9:30 pm" ],
			'end equals start'      => [ '2026-10-18T19:00', '2026-10-18T19:00', false, '7:00 pm' ],
			'morning and noon'      => [ '2026-10-18T09:05', '2026-10-18T12:00', false, "9:05 am \u{2013} 12:00 pm" ],
			'multi-day: start only' => [ '2026-10-18T10:00', '2026-10-20T16:00', false, '10:00 am' ],
			'TBC wins'              => [ '2026-10-18T12:00', '2026-10-18T14:00', true, 'Time to be confirmed' ],
			'unparseable'           => [ 'soon', '', false, '' ],
		];
	}

	#[DataProvider( 'times' )]
	public function test_format_time( string $start, string $end, bool $tbc, string $expected ): void {
		$this->assertSame( $expected, EventTime::formatTime( $start, $end, $tbc ) );
	}

	public function test_dates_and_ranges(): void {
		$this->assertSame( 'Monday 5 October 2026', EventTime::formatDate( '2026-10-05T10:30' ) ); // no comma after the weekday (spec §6.2)
		$this->assertSame( "18 Oct \u{2013} 20 Oct", EventTime::formatRange( '2026-10-18T10:00', '2026-10-20T16:00' ) );
		$this->assertSame( "30 Sept \u{2013} 2 Oct", EventTime::formatRange( '2026-09-30T10:00', '2026-10-02T16:00' ) );
		$this->assertSame( 'Sunday 18 October 2026', EventTime::formatRange( '2026-10-18T10:00', '2026-10-18T16:00' ) );
		$this->assertTrue( EventTime::isMultiDay( '2026-10-18T22:00', '2026-10-19T01:00' ) );
		$this->assertFalse( EventTime::isMultiDay( '2026-10-18T10:00', '' ) );
		$this->assertSame( [ '18', 'Oct' ], [ EventTime::dayNumber( '2026-10-18T19:00' ), EventTime::monthShort( '2026-10-18T19:00' ) ] );
		$this->assertSame( [ '7', 'Sept' ], [ EventTime::dayNumber( '2026-09-07T19:00' ), EventTime::monthShort( '2026-09-07T19:00' ) ] );
		$this->assertSame( '2026-10-18', EventTime::dateKey( '2026-10-18T19:00' ) );
		$this->assertSame( '', EventTime::dateKey( 'nope' ) );
	}

	public function test_day_keys_cover_every_day_up_to_the_cap(): void {
		$this->assertSame( [ '2026-10-18' ], EventTime::dayKeys( '2026-10-18T19:00', '' ) );
		$this->assertSame( [ '2026-10-31', '2026-11-01', '2026-11-02' ], EventTime::dayKeys( '2026-10-31T10:00', '2026-11-02T12:00' ) );
		$this->assertCount( 31, EventTime::dayKeys( '2026-01-01T10:00', '2026-12-31T10:00' ) );
		$this->assertSame( [ '2026-10-18' ], EventTime::dayKeys( '2026-10-18T19:00', '2026-10-17T10:00' ), 'end before start' );
		$this->assertSame( [], EventTime::dayKeys( 'nope', '' ) );
	}

	public function test_unparseable_start_returns_empty(): void {
		$now = self::utc( '2026-10-19T12:00:00' );
		$this->assertSame( '', EventTime::untilKey( 'nope', '2026-10-20T10:00' ) );
		$this->assertFalse( EventTime::isUpcoming( 'nope', '2026-10-20T10:00', $now ) );
		$this->assertSame( [], EventTime::dayKeys( 'nope', '2026-10-20T10:00' ) );
	}
}
