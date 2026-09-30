<?php
namespace Elevation\Core\Tests;

use Elevation\Core\GroupFields;
use PHPUnit\Framework\TestCase;

final class GroupFieldsTest extends TestCase {

	public function test_days_and_times_are_kept_only_when_valid(): void {
		$this->assertSame( 'tuesday', GroupFields::day( ' Tuesday ' ) );
		$this->assertSame( '', GroupFields::day( 'Tues' ) );
		$this->assertSame( '', GroupFields::day( [ 'monday' ] ) );
		$this->assertSame( '19:30', GroupFields::time( '19:30' ) );
		foreach ( [ '7:30', '24:00', '19:60', '7.30pm', '', null ] as $bad ) {
			$this->assertSame( '', GroupFields::time( $bad ), var_export( $bad, true ) );
		}
	}

	public function test_when_reads_like_the_rest_of_the_site(): void {
		$this->assertSame( "Tuesdays \u{00B7} 7:30 pm", GroupFields::when( 'tuesday', '19:30' ) );
		$this->assertSame( 'Sundays', GroupFields::when( 'sunday', '' ) );
		$this->assertSame( '12:00 pm', GroupFields::when( '', '12:00' ) );
		$this->assertSame( '', GroupFields::when( '', '' ) );
	}

	public function test_when_says_every_other_week_for_fortnightly_groups(): void {
		$this->assertSame( "Thursdays \u{00B7} 8:00 pm", GroupFields::when( 'thursday', '20:00', 'weekly' ) );
		$this->assertSame( "Sundays, every two weeks \u{00B7} 8:00 pm", GroupFields::when( 'sunday', '20:00', 'fortnightly' ) );
		$this->assertSame( 'Thursdays', GroupFields::when( 'thursday', '', 'weekly' ) );
		$this->assertSame( 'Sundays, every two weeks', GroupFields::when( 'sunday', '', 'fortnightly' ) );
		$this->assertSame( '8:00 pm', GroupFields::when( '', '20:00', 'fortnightly' ) );
		$this->assertSame( '', GroupFields::when( '', '', 'fortnightly' ) );
	}

	public function test_frequency_is_weekly_unless_fortnightly(): void {
		$this->assertSame( 'fortnightly', GroupFields::frequency( 'fortnightly' ) );
		$this->assertSame( 'fortnightly', GroupFields::frequency( ' Fortnightly ' ) );
		foreach ( [ 'weekly', 'monthly', '', null, [ 'fortnightly' ], 5 ] as $v ) {
			$this->assertSame( 'weekly', GroupFields::frequency( $v ), var_export( $v, true ) );
		}
	}

	public function test_towns_are_trimmed_unique_short_and_plain(): void {
		$in = "Hyde\n  hyde \r\n\n<b>Denton</b>\nAshton-under-Lyne\n" . str_repeat( 'x', 61 ) . "\n   \n" . str_repeat( 'y', 60 );
		$this->assertSame( [ 'Hyde', 'Denton', 'Ashton-under-Lyne', str_repeat( 'x', 60 ), str_repeat( 'y', 60 ) ], GroupFields::towns( $in ) );
		$this->assertSame( [ 'Hyde', 'Bury' ], GroupFields::towns( [ 'Hyde ', 'HYDE', '', 'Bury', [ 'x' ] ] ) );
		$this->assertSame( [], GroupFields::towns( null ) );
		$this->assertSame( [], GroupFields::towns( 12 ) );
	}

	public function test_town_keys_ignore_case_punctuation_and_ampersands(): void {
		$this->assertSame( GroupFields::townKey( 'Ashton-under-Lyne' ), GroupFields::townKey( 'ashton under lyne' ) );
		$this->assertSame( GroupFields::townKey( 'Cheadle & Gatley' ), GroupFields::townKey( 'cheadle and gatley' ) );
		$this->assertSame( 'cheadle and gatley', GroupFields::townKey( '  Cheadle & Gatley! ' ) );
		$this->assertSame( "l\u{00E9}igh", GroupFields::townKey( "L\u{00C9}igh" ) );
		$this->assertSame( '', GroupFields::townKey( '---' ) );
	}

	public function test_a_town_search_matches_towns_and_boroughs_by_whole_word(): void {
		$canaan = [ 'Oldham', 'Denton', 'Hyde', 'Ashton-under-Lyne', 'Droylsden' ];
		$areas  = [ 'Oldham', 'Tameside', 'Rochdale' ];
		$this->assertTrue( GroupFields::matchesTown( 'hyde', $canaan, $areas ) );
		$this->assertTrue( GroupFields::matchesTown( 'ASHTON UNDER LYNE', $canaan, $areas ) );
		$this->assertTrue( GroupFields::matchesTown( 'Tameside', $canaan, $areas ) );
		$this->assertFalse( GroupFields::matchesTown( 'Sal', $canaan, $areas ) );
		$this->assertFalse( GroupFields::matchesTown( '', $canaan, $areas ) );
		$this->assertFalse( GroupFields::matchesTown( '  ', $canaan, $areas ) );
		$this->assertFalse( GroupFields::matchesTown( 'Narnia', $canaan, $areas ) );

		$salem = [ 'Cheadle & Gatley', 'Hazel Grove & Bramhall' ];
		$this->assertTrue( GroupFields::matchesTown( 'Gatley', $salem, [ 'Stockport' ] ) );
		$this->assertTrue( GroupFields::matchesTown( 'Hazel Grove', $salem, [ 'Stockport' ] ) );
		$this->assertTrue( GroupFields::matchesTown( 'cheadle and gatley', $salem, [] ) );

		$zion = [ 'Salford', 'Sale', 'Eccles' ];
		$this->assertTrue( GroupFields::matchesTown( 'Sale', $zion, [] ) );
		$this->assertFalse( GroupFields::matchesTown( 'Sal', $zion, [] ) );
		$this->assertFalse( GroupFields::matchesTown( 'Sal', [ 'Salford', 'Sale' ], [ 'Salford' ] ) );
	}

	public function test_only_the_leaders_first_name_is_shown(): void {
		$this->assertSame( 'Grace', GroupFields::firstName( "  Grace   O'Brien-Example " ) );
		$this->assertSame( 'Tunde', GroupFields::firstName( 'Tunde' ) );
		$this->assertSame( '', GroupFields::firstName( '   ' ) );
	}

	public function test_filters_accept_known_values_only(): void {
		$areas = [ 'salford', 'online' ];
		$types = [ 'families' ];
		$this->assertSame( [ 'area' => 'salford', 'type' => 'families', 'meets' => 'tuesday', 'town' => '' ], GroupFields::filters( [ 'area' => 'salford', 'type' => 'families', 'meets' => 'tuesday' ], $areas, $types ) );
		$this->assertSame( [ 'area' => '', 'type' => '', 'meets' => '', 'town' => '' ], GroupFields::filters( [ 'area' => '<script>', 'type' => [ 'families' ], 'meets' => 'someday' ], $areas, $types ) );
		$this->assertSame( [ 'area' => '', 'type' => '', 'meets' => '', 'town' => '' ], GroupFields::filters( [], $areas, $types ) );
	}

	public function test_the_town_filter_is_trimmed_plain_and_short(): void {
		$this->assertSame( 'Hyde', GroupFields::filters( [ 'town' => '  Hyde ' ], [], [] )['town'] );
		$this->assertSame( 'alert(1)', GroupFields::filters( [ 'town' => '<script>alert(1)</script>' ], [], [] )['town'] );
		$this->assertSame( str_repeat( 'a', 60 ), GroupFields::filters( [ 'town' => str_repeat( 'a', 80 ) ], [], [] )['town'] );
		$this->assertSame( '', GroupFields::filters( [ 'town' => [ 'Hyde' ] ], [], [] )['town'] );
	}
}
