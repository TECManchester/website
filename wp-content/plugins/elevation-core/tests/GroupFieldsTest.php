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

	public function test_only_the_leaders_first_name_is_shown(): void {
		$this->assertSame( 'Grace', GroupFields::firstName( "  Grace   O'Brien-Example " ) );
		$this->assertSame( 'Tunde', GroupFields::firstName( 'Tunde' ) );
		$this->assertSame( '', GroupFields::firstName( '   ' ) );
	}

	public function test_filters_accept_known_values_only(): void {
		$areas = [ 'salford', 'online' ];
		$types = [ 'families' ];
		$this->assertSame( [ 'area' => 'salford', 'type' => 'families', 'meets' => 'tuesday' ], GroupFields::filters( [ 'area' => 'salford', 'type' => 'families', 'meets' => 'tuesday' ], $areas, $types ) );
		$this->assertSame( [ 'area' => '', 'type' => '', 'meets' => '' ], GroupFields::filters( [ 'area' => '<script>', 'type' => [ 'families' ], 'meets' => 'someday' ], $areas, $types ) );
		$this->assertSame( [ 'area' => '', 'type' => '', 'meets' => '' ], GroupFields::filters( [], $areas, $types ) );
	}
}
