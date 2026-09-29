<?php
namespace Elevation\Core\Tests;

use Elevation\Core\EventFields;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class EventFieldsTest extends TestCase {

	public function test_date_times_are_normalised_to_minutes(): void {
		$this->assertSame( '2026-10-18T19:00', EventFields::normaliseDateTime( '2026-10-18T19:00:00' ) ); // the date picker's format
		$this->assertSame( '2026-10-18T19:00', EventFields::normaliseDateTime( ' 2026-10-18 19:00 ' ) );
		$this->assertSame( '2026-10-18T19:00', EventFields::normaliseDateTime( '2026-10-18T19:00' ) );
		foreach ( [ '', null, 42, [], '2026-10-18', '2026-13-01T10:00', '18/10/2026 19:00', '2026-10-18T19:00Z' ] as $bad ) {
			$this->assertSame( '', EventFields::normaliseDateTime( $bad ) );
		}
	}

	/** @return array<string, array{mixed, string}> */
	public static function urls(): array {
		return [
			'site path'           => [ '/contact', '/contact' ],
			'path with anchor'    => [ '/im-new#plan-a-visit', '/im-new#plan-a-visit' ],
			'https'               => [ ' https://www.eventbrite.co.uk/e/123 ', 'https://www.eventbrite.co.uk/e/123' ],
			'http'                => [ 'http://example.org', '' ],
			'protocol-relative'   => [ '//evil.example/x', '' ],
			'javascript'          => [ 'javascript:alert(1)', '' ],
			'backslash trick'     => [ '/\\evil.example', '' ],
			'credentials in host' => [ 'https://user@evil.example', '' ],
			'bare word'           => [ 'contact', '' ],
			'not a string'        => [ [ '/x' ], '' ],
		];
	}

	#[DataProvider( 'urls' )]
	public function test_cta_urls_must_be_https_or_a_site_path( mixed $in, string $out ): void {
		$this->assertSame( $out, EventFields::normaliseCtaUrl( $in ) );
	}

	public function test_a_valid_event_has_no_errors(): void {
		$this->assertSame( [], EventFields::errors( [ 'start' => '2026-10-18T19:00:00', 'end' => '2026-10-20T16:00', 'cta_url' => '/contact' ], true ) );
		$this->assertSame( [], EventFields::errors( [ 'start' => '2026-10-18T19:00', 'end' => '2026-10-18T19:00' ], true ), 'end may equal start' );
	}

	public function test_start_is_required_only_to_publish(): void {
		$this->assertSame( [], EventFields::errors( [ 'start' => '' ], false ) );
		$this->assertSame( [ 'An event needs a start date and time before it can be published.' ], EventFields::errors( [ 'start' => '' ], true ) );
	}

	public function test_each_problem_is_named(): void {
		$this->assertSame(
			[
				"The start date and time aren't valid.",
				'The button link must start with https:// or with / for a page on this site.',
			],
			EventFields::errors( [ 'start' => 'next week', 'cta_url' => 'javascript:alert(1)' ], false )
		);
		$this->assertSame( [ 'The end must be the same as or after the start.' ], EventFields::errors( [ 'start' => '2026-10-18T19:00', 'end' => '2026-10-18T18:59' ], false ) );
		$this->assertSame( [ "The end date and time aren't valid." ], EventFields::errors( [ 'start' => '2026-10-18T19:00', 'end' => '2026-02-30T10:00' ], false ) );
	}
}
