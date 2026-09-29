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
		$this->assertSame( 'connectgroup@elevationmanchester.org', Settings::get( $s, 'contact.connectGroupInbox' ) );
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

	public function test_arrival_copy_without_doors_open(): void {
		$s = Settings::resolve( [] );
		$this->assertSame( 'Come a little early for a coffee', Settings::get( $s, 'service.arrivalNote' ) );
		$this->assertSame( 'We start at 10:30am.', Settings::get( $s, 'service.startSentence' ) );
	}

	public function test_arrival_copy_with_doors_open(): void {
		$s = Settings::resolve( [ 'service' => [ 'doorsOpen' => '10:15am', 'startTime' => '11:00am' ] ] );
		$this->assertSame( 'Doors from 10:15am', Settings::get( $s, 'service.arrivalNote' ) );
		$this->assertSame( 'Doors open at 10:15am and we start at 11:00am.', Settings::get( $s, 'service.startSentence' ) );
	}

	public function test_derived_copy_is_not_a_stored_setting(): void {
		$this->assertArrayNotHasKey( 'service.arrivalNote', Settings::flatten( Settings::defaults() ) );
		$this->assertArrayHasKey( 'service.arrivalNote', Settings::publicValues( Settings::resolve( [] ) ) );
	}

	public function test_hero_slides_default_to_none(): void {
		$this->assertSame( [], Settings::heroSlides( Settings::resolve( [] ) ) );
		$this->assertArrayHasKey( 'hero.slide6.alt', Settings::flatten( Settings::defaults() ) );
	}

	public function test_hero_slides_keep_slot_order_and_skip_empty_slots(): void {
		$s = Settings::resolve( [ 'hero' => [
			'slide5' => [ 'image' => '31', 'focal' => '70% 26%', 'alt' => 'City' ],
			'slide2' => [ 'image' => '12', 'focal' => '62% 30%', 'alt' => 'Worship' ],
			'slide3' => [ 'image' => '', 'focal' => '10% 10%', 'alt' => 'Nothing' ],
		] ] );
		$this->assertSame( [
			[ 'image' => 12, 'focal' => '62% 30%', 'alt' => 'Worship' ],
			[ 'image' => 31, 'focal' => '70% 26%', 'alt' => 'City' ],
		], Settings::heroSlides( $s ) );
	}

	public function test_hero_slide_focal_falls_back_to_centre(): void {
		$s = Settings::resolve( [ 'hero' => [ 'slide1' => [ 'image' => '9', 'focal' => 'left; background:red', 'alt' => '' ] ] ] );
		$this->assertSame( '50% 50%', Settings::heroSlides( $s )[0]['focal'] );
	}

	public function test_hero_slide_with_non_numeric_image_is_skipped(): void {
		$s = Settings::resolve( [ 'hero' => [ 'slide1' => [ 'image' => 'abc' ] ] ] );
		$this->assertSame( [], Settings::heroSlides( $s ) );
	}
}
