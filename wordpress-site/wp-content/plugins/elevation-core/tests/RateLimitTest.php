<?php
namespace Elevation\Core\Tests;

use Elevation\Core\RateLimit;
use PHPUnit\Framework\TestCase;

final class RateLimitTest extends TestCase {

	public function test_five_in_ten_minutes_then_a_wait(): void {
		$now    = 10_000;
		$stamps = [ $now - 590, $now - 400, $now - 300, $now - 200 ];
		$this->assertTrue( RateLimit::allows( $stamps, $now ) );
		$stamps[] = $now - 10;
		$this->assertFalse( RateLimit::allows( $stamps, $now ) );
		$this->assertSame( 1, RateLimit::waitMinutes( $stamps, $now ) ); // the oldest leaves in 10s
		$this->assertTrue( RateLimit::allows( $stamps, $now + 11 ) );
	}

	public function test_waits_are_rounded_up_to_whole_minutes(): void {
		$now = 10_000;
		$this->assertSame( 10, RateLimit::waitMinutes( array_fill( 0, 5, $now ), $now ) );
		$this->assertSame( 0, RateLimit::waitMinutes( [], $now ) );
	}

	public function test_junk_and_future_stamps_are_ignored(): void {
		$this->assertSame( [ 9_900 ], RateLimit::recent( [ 'x', null, 9_000, 9_900, 20_000 ], 10_000 ) );
	}

	public function test_the_message(): void {
		$this->assertSame( "That's a few submissions in a short time. Please wait about 1 minute and try again.", RateLimit::message( 1 ) );
		$this->assertSame( "That's a few submissions in a short time. Please wait about 7 minutes and try again.", RateLimit::message( 7 ) );
		$this->assertSame( "That's a few submissions in a short time. Please wait about 1 minute and try again.", RateLimit::message( 0 ) );
	}
}
