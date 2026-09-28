<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Settings;
use PHPUnit\Framework\TestCase;

final class SettingsTest extends TestCase {

	public function test_defaults_match_the_redesign(): void {
		$s = Settings::resolve( [] );
		$this->assertSame( 'Sunday', Settings::get( $s, 'service.day' ) );
		$this->assertSame( '10:30am', Settings::get( $s, 'service.startTime' ) );
		$this->assertSame( 'Mary Seacole Building', Settings::get( $s, 'location.venue' ) );
		$this->assertSame( 'info@elevationmanchester.org', Settings::get( $s, 'contact.email' ) );
		$this->assertSame( 'info@elevationmanchester.org', Settings::get( $s, 'contact.welcomeInbox' ) );
		$this->assertSame( '1195403', Settings::get( $s, 'church.charityNumber' ) );
		$this->assertSame( 'G-0Q3764FCYN', Settings::get( $s, 'analytics.ga4MeasurementId' ) );
	}

	public function test_stored_value_overrides_default(): void {
		$s = Settings::resolve( [ 'service' => [ 'startTime' => '11:00am' ] ] );
		$this->assertSame( '11:00am', Settings::get( $s, 'service.startTime' ) );
		$this->assertSame( 'Sunday', Settings::get( $s, 'service.day' ) );
	}

	public function test_blank_required_value_falls_back_to_default(): void {
		$s = Settings::resolve( [ 'contact' => [ 'email' => '   ' ] ] );
		$this->assertSame( 'info@elevationmanchester.org', Settings::get( $s, 'contact.email' ) );
	}

	public function test_optional_value_may_be_blank(): void {
		$s = Settings::resolve( [ 'service' => [ 'doorsOpen' => '' ] ] );
		$this->assertSame( '', Settings::get( $s, 'service.doorsOpen' ) );
	}

	public function test_unknown_stored_keys_are_ignored(): void {
		$s = Settings::resolve( [ 'service' => [ 'bogus' => 'x' ], 'nope' => [ 'a' => 'b' ] ] );
		$this->assertNull( Settings::get( $s, 'service.bogus' ) );
		$this->assertNull( Settings::get( $s, 'nope.a' ) );
	}

	public function test_derived_location_values(): void {
		$s = Settings::resolve( [] );
		$this->assertSame(
			'Mary Seacole Building, University of Salford, Manchester M6 6PU',
			Settings::get( $s, 'location.full' )
		);
		$this->assertSame(
			'https://www.google.com/maps/search/?api=1&query=Mary%20Seacole%20Building%2C%20University%20of%20Salford%2C%20M6%206PU',
			Settings::get( $s, 'location.mapsUrl' )
		);
		$this->assertSame(
			'https://www.google.com/maps?q=Mary%20Seacole%20Building%2C%20University%20of%20Salford%2C%20M6%206PU&output=embed',
			Settings::get( $s, 'location.embedUrl' )
		);
	}

	public function test_prayer_inbox_falls_back_to_contact_email(): void {
		$s = Settings::resolve( [ 'contact' => [ 'email' => 'hello@example.org' ] ] );
		$this->assertSame( 'hello@example.org', Settings::get( $s, 'contact.prayerInbox' ) );

		$s = Settings::resolve( [ 'contact' => [ 'prayerInbox' => 'pastors@example.org' ] ] );
		$this->assertSame( 'pastors@example.org', Settings::get( $s, 'contact.prayerInbox' ) );
	}

	public function test_get_returns_branches_and_null_for_missing(): void {
		$s = Settings::resolve( [] );
		$this->assertIsArray( Settings::get( $s, 'socials' ) );
		$this->assertNull( Settings::get( $s, 'service.nothing' ) );
		$this->assertNull( Settings::get( $s, '' ) );
	}

	public function test_flatten_and_unflatten_round_trip(): void {
		$tree = [ 'a' => [ 'b' => 'x', 'c' => [ 'd' => 'y' ] ], 'e' => 'z' ];
		$flat = Settings::flatten( $tree );
		$this->assertSame( [ 'a.b' => 'x', 'a.c.d' => 'y', 'e' => 'z' ], $flat );
		$this->assertSame( $tree, Settings::unflatten( $flat ) );
	}

	public function test_public_values_exclude_secrets(): void {
		$s   = Settings::resolve( [ 'youtube' => [ 'apiKey' => 'SECRET' ] ] );
		$pub = Settings::publicValues( $s );
		$this->assertArrayNotHasKey( 'youtube.apiKey', $pub );
		$this->assertSame( 'TheElevationChurchManchester', $pub['youtube.channelHandle'] );
		$this->assertSame( '10:30am', $pub['service.startTime'] );
	}
}
