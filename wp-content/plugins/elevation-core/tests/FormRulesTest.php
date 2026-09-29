<?php
namespace Elevation\Core\Tests;

use Elevation\Core\FormRules;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class FormRulesTest extends TestCase {

	private const CONTACT = [ 'name' => 'Ada', 'email' => 'ada@example.com', 'message' => 'Hello' ];

	public function test_a_complete_contact_message_passes(): void {
		$this->assertSame( [], FormRules::errors( 'contact', self::CONTACT ) );
	}

	public function test_required_fields_use_the_redesign_wording_and_whitespace_counts_as_empty(): void {
		$this->assertSame(
			[
				'name'    => 'Please tell us your name.',
				'email'   => 'We need an email address to reply to.',
				'message' => 'Please write your message.',
			],
			FormRules::errors( 'contact', [ 'name' => '   ', 'email' => '', 'message' => "\n\t" ] )
		);
		$this->assertSame( 'Please tell us your name.', FormRules::requiredMessage( 'contact', 'name' ) );
		$this->assertNull( FormRules::requiredMessage( 'contact', 'phone' ) );
		$this->assertNull( FormRules::requiredMessage( 'nope', 'name' ) );
		$this->assertSame( [ 'name', 'email', 'message' ], FormRules::requiredPaths( 'contact' ) );
		$this->assertSame( [], FormRules::requiredPaths( 'nope' ) );
	}

	public function test_name_fields_are_checked_by_sub_field(): void {
		$errors = FormRules::errors( 'g-squad', [ 'names' => [ 'first_name' => 'Ada', 'last_name' => ' ' ], 'email' => 'ada@example.com' ] );
		$this->assertSame( [ 'names.last_name' => 'Please tell us your last name.' ], $errors );
	}

	public function test_bad_email_and_phone_are_refused_but_optional_blanks_pass(): void {
		$errors = FormRules::errors( 'contact', [ 'email' => 'ada@', 'phone' => 'call me' ] + self::CONTACT );
		$this->assertSame( "That doesn't look like a valid email address.", $errors['email'] );
		$this->assertSame( "That doesn't look like a phone number.", $errors['phone'] );
		$this->assertSame( [], FormRules::errors( 'contact', [ 'phone' => '' ] + self::CONTACT ) );
		$this->assertSame( [], FormRules::errors( 'contact', [ 'phone' => '+44 (0)7469 062220' ] + self::CONTACT ) );
		$this->assertSame( [ 'email' => 'Please enter a valid email address.' ], FormRules::errors( 'newsletter', [ 'email' => 'nope' ] ) );
	}

	public function test_prayer_email_is_optional_but_checked_when_given(): void {
		$this->assertSame( [], FormRules::errors( 'prayer', [ 'request' => 'For my mum' ] ) );
		$this->assertSame( [ 'email' => "That doesn't look like a valid email address." ], FormRules::errors( 'prayer', [ 'request' => 'x', 'email' => 'x@y' ] ) );
	}

	public function test_over_long_text_names_the_field_and_the_limit(): void {
		$errors = FormRules::errors( 'contact', [ 'message' => str_repeat( 'é', 5001 ) ] + self::CONTACT );
		$this->assertSame( [ 'message' => 'Your message is too long — keep it under 5000 characters.' ], $errors );
		$this->assertSame( [], FormRules::errors( 'contact', [ 'message' => str_repeat( '🙏', 5000 ) ] + self::CONTACT ) );
	}

	public function test_names_are_short_and_never_links_or_addresses(): void {
		$visit = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'Lovelace' ], 'email' => 'a@example.com', 'visit_date' => '2026-10-04', 'adults' => '2' ];
		$ctx   = [ 'visitDates' => [ '2026-10-04' ] ];
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', $visit, $ctx ) );
		$long = $visit;
		$long['names']['first_name'] = str_repeat( 'a', 51 );
		$this->assertSame( [ 'names.first_name' => 'First name is too long — keep it under 50 characters.' ], FormRules::errors( 'plan-a-visit', $long, $ctx ) );
		$fifty = $visit;
		$fifty['names']['first_name'] = str_repeat( 'a', 50 );
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', $fifty, $ctx ) );
		foreach ( [ 'see http://x.co', 'https://x.co', 'www.x.co', 'a@b.c' ] as $bad ) {
			$link = $visit;
			$link['names']['last_name'] = $bad;
			$this->assertSame( [ 'names.last_name' => 'Please enter just your name.' ], FormRules::errors( 'plan-a-visit', $link, $ctx ), $bad );
		}
		$this->assertSame( [ 'name' => 'Please enter just your name.' ], FormRules::errors( 'contact', [ 'name' => 'http://x.co' ] + self::CONTACT ) );
		$this->assertSame( [ 'name' => 'Your name is too long — keep it under 50 characters.' ], FormRules::errors( 'prayer', [ 'name' => str_repeat( 'n', 51 ), 'request' => 'x' ] ) );
	}

	public function test_gift_aid_names_are_limited_too(): void {
		$errors = FormRules::errors( 'gift-aid', [ 'first_name' => str_repeat( 'a', 51 ), 'last_name' => 'www.x.co', 'address_line1' => '1 High St', 'postcode' => 'M1 1AA', 'declaration_accepted' => 'yes' ] );
		$this->assertSame( 'First name is too long — keep it under 50 characters.', $errors['first_name'] );
		$this->assertSame( 'Please enter just your name.', $errors['last_name'] );
	}

	public function test_html_is_just_text_to_the_rules(): void {
		$this->assertSame( [], FormRules::errors( 'contact', [ 'message' => '<script>alert(1)</script> & "quotes"' ] + self::CONTACT ) );
	}

	#[DataProvider( 'giftAidCases' )]
	public function test_gift_aid_rules( array $change, array $expected ): void {
		$base = [
			'first_name'           => 'Ada',
			'last_name'            => 'Lovelace',
			'address_line1'        => '12 Crescent Road',
			'postcode'             => 'M6 6PU',
			'declaration_accepted' => 'on',
		];
		$this->assertSame( $expected, FormRules::errors( 'gift-aid', array_merge( $base, $change ) ) );
	}

	public static function giftAidCases(): array {
		return [
			'complete'            => [ [], [] ],
			'initial only'        => [ [ 'first_name' => 'A.' ], [ 'first_name' => 'HMRC needs your full first name, not an initial.' ] ],
			'spaced initials'     => [ [ 'first_name' => 'A . ' ], [ 'first_name' => 'HMRC needs your full first name, not an initial.' ] ],
			'two letters is fine' => [ [ 'first_name' => 'Jo' ], [] ],
			'blank first name'    => [ [ 'first_name' => '' ], [ 'first_name' => 'Please give your first name.' ] ],
			'short surname'       => [ [ 'last_name' => 'L' ], [ 'last_name' => 'Please give your surname.' ] ],
			'no house number'     => [ [ 'address_line1' => 'Rd' ], [ 'address_line1' => 'Please include your house name or number — HMRC requires it.' ] ],
			'house name is fine'  => [ [ 'address_line1' => 'Rose Cottage' ], [] ],
			'blank address'       => [ [ 'address_line1' => ' ' ], [ 'address_line1' => 'Please give your home address, including house name or number.' ] ],
			'lower-case postcode' => [ [ 'postcode' => 'm66pu' ], [] ],
			'half a postcode'     => [ [ 'postcode' => 'M6' ], [ 'postcode' => "That doesn't look like a full UK postcode." ] ],
			'not ticked'          => [ [ 'declaration_accepted' => '' ], [ 'declaration_accepted' => 'Please confirm the declaration so we can claim Gift Aid.' ] ],
		];
	}

	public function test_postcodes_are_normalised_like_the_redesign(): void {
		$this->assertSame( 'M6 6PU', FormRules::normalisePostcode( ' m66pu ' ) );
		$this->assertSame( 'SW1A 1AA', FormRules::normalisePostcode( 'sw1a1aa' ) );
		$this->assertSame( 'M6 6PU', FormRules::normalisePostcode( 'M6   6PU' ) );
		$this->assertSame( 'M6', FormRules::normalisePostcode( ' m6 ' ) );
	}

	public function test_a_visit_date_must_be_one_on_offer_now(): void {
		$data    = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com', 'visit_date' => '2026-10-04', 'adults' => '2' ];
		$context = [ 'visitDates' => [ '2026-10-04', '2026-10-11' ] ];
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', $data, $context ) );
		$this->assertSame(
			[ 'visit_date' => "That date isn't available any more — please choose another." ],
			FormRules::errors( 'plan-a-visit', [ 'visit_date' => '2026-09-27' ] + $data, $context )
		);
		$this->assertSame( [ 'visit_date' => 'Please choose the date you plan to come.' ], FormRules::errors( 'plan-a-visit', [ 'visit_date' => '' ] + $data, $context ) );
	}

	public function test_visitor_numbers(): void {
		$data    = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com', 'visit_date' => '2026-10-04' ];
		$context = [ 'visitDates' => [ '2026-10-04' ] ];
		$adults  = 'Please enter how many adults are coming, from 1 to 20.';
		foreach ( [ '0', '21', '-1', '1.5', 'two', '' ] as $bad ) {
			$this->assertSame( [ 'adults' => $adults ], FormRules::errors( 'plan-a-visit', [ 'adults' => $bad ] + $data, $context ), "adults=$bad" );
		}
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', [ 'adults' => '1', 'children' => '' ] + $data, $context ) );
		$this->assertSame( [], FormRules::errors( 'plan-a-visit', [ 'adults' => '20', 'children' => '0' ] + $data, $context ) );
		$this->assertSame(
			[ 'children' => 'Please enter how many children are coming, from 0 to 20.' ],
			FormRules::errors( 'plan-a-visit', [ 'adults' => '2', 'children' => '30' ] + $data, $context )
		);
	}

	public function test_join_group_accepts_blank_or_a_listed_group_only(): void {
		$data    = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com' ];
		$context = [ 'groupIds' => [ 12, 40 ] ];
		$refused = [ 'restricted' => "That group isn't taking requests right now. Please choose another from the list, or leave it blank and we'll help you find one." ];
		$this->assertSame( [], FormRules::errors( 'join-group', [ 'group_id' => '' ] + $data, $context ) );
		$this->assertSame( [], FormRules::errors( 'join-group', [ 'group_id' => '40' ] + $data, $context ) );
		$this->assertSame( $refused, FormRules::errors( 'join-group', [ 'group_id' => '41' ] + $data, $context ) );
		$this->assertSame( $refused, FormRules::errors( 'join-group', [ 'group_id' => '12abc' ] + $data, $context ) );
		$this->assertSame( $refused, FormRules::errors( 'join-group', [ 'group_id' => '12' ] + $data ) );
	}

	public function test_a_connect_card_postcode_is_optional_but_must_look_right(): void {
		$data = [ 'names' => [ 'first_name' => 'Ada', 'last_name' => 'L' ], 'email' => 'ada@example.com' ];
		$this->assertSame( [], FormRules::errors( 'connect-card', $data ) );
		$this->assertSame( [], FormRules::errors( 'connect-card', [ 'postcode' => 'm6 6pu' ] + $data ) );
		$this->assertSame( [ 'postcode' => "That doesn't look like a full UK postcode." ], FormRules::errors( 'connect-card', [ 'postcode' => 'Salford' ] + $data ) );
	}

	public function test_alpha_keeps_the_live_field_names(): void {
		$errors = FormRules::errors( 'alpha', [] );
		$this->assertSame( [ 'names.first_name', 'names.last_name', 'input_text_2', 'email', 'input_radio', 'dropdown', 'input_radio_2' ], array_keys( $errors ) );
	}

	public function test_an_unknown_form_only_gets_the_generic_checks(): void {
		$this->assertSame( [], FormRules::errors( 'nope', [ 'anything' => 'x' ] ) );
	}

	public function test_the_declaration_is_the_hmrc_wording(): void {
		$this->assertSame( 'hmrc-2016-enduring-v1', FormRules::DECLARATION_VERSION );
		$this->assertStringStartsWith( 'Please treat as Gift Aid donations all qualifying gifts of money made from the date of this declaration and in the past four years.', FormRules::DECLARATION_TEXT );
		$this->assertStringEndsWith( 'it is my responsibility to pay any difference.', FormRules::DECLARATION_TEXT );
	}
}
