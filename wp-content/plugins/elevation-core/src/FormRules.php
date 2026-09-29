<?php
namespace Elevation\Core;

/**
 * What each church form accepts (spec §6.10), in the redesign's wording. includes/forms.php calls errors()
 * from Fluent Forms' validation filter; FormSchema copies the required messages into the form definitions,
 * so the browser check and the server re-check say the same thing. Pure — no WordPress calls.
 */
final class FormRules {

	public const DECLARATION_VERSION = 'hmrc-2016-enduring-v1';
	public const DECLARATION_TEXT    = 'Please treat as Gift Aid donations all qualifying gifts of money made from the date of this declaration and in the past four years. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.';

	private const EMAIL_RE    = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';
	private const POSTCODE_RE = '/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i';
	private const PHONE_RE    = '/^\+?[0-9 ()\-.]{7,40}$/';
	private const PHONES      = [ 'phone', 'input_text_2' ];

	private const FIRST = 'Please tell us your first name.';
	private const LAST  = 'Please tell us your last name.';

	/** Form key => field path => message. A path into a name field uses a dot: "names.first_name". */
	private const REQUIRED = [
		'contact'      => [ 'name' => 'Please tell us your name.', 'email' => 'We need an email address to reply to.', 'message' => 'Please write your message.' ],
		'prayer'       => [ 'request' => 'Please tell us what we can pray for.' ],
		'gift-aid'     => [
			'first_name'           => 'Please give your first name.',
			'last_name'            => 'Please give your surname.',
			'address_line1'        => 'Please give your home address, including house name or number.',
			'postcode'             => 'Please give your full postcode.',
			'declaration_accepted' => 'Please confirm the declaration so we can claim Gift Aid.',
		],
		'newsletter'   => [ 'email' => 'Please enter a valid email address.' ],
		'g-squad'      => [ 'names.first_name' => self::FIRST, 'names.last_name' => self::LAST, 'email' => 'We need an email address so a team leader can reply.' ],
		'plan-a-visit' => [
			'names.first_name' => self::FIRST,
			'names.last_name'  => self::LAST,
			'email'            => 'We need an email address to send your confirmation to.',
			'visit_date'       => 'Please choose the date you plan to come.',
			'adults'           => 'Please enter how many adults are coming, from 1 to 20.',
		],
		'join-group'   => [ 'names.first_name' => self::FIRST, 'names.last_name' => self::LAST, 'email' => 'We need an email address so the group leader can reply.' ],
		'connect-card' => [ 'names.first_name' => self::FIRST, 'names.last_name' => self::LAST, 'email' => 'We need an email address to reply to.' ],
		'alpha'        => [
			'names.first_name' => self::FIRST,
			'names.last_name'  => self::LAST,
			'input_text_2'     => 'Please give a phone number.',
			'email'            => 'We need an email address to reply to.',
			'input_radio'      => 'Please choose an option.',
			'dropdown'         => 'Please choose your age range.',
			'input_radio_2'    => 'Please tell us how you heard about Alpha.',
		],
	];

	/** Field path => [maximum characters, name used in the "too long" message]. */
	private const LIMITS = [
		'name'             => [ 120, 'Your name' ],
		'names.first_name' => [ 120, 'First name' ],
		'names.last_name'  => [ 120, 'Last name' ],
		'title'            => [ 20, 'Title' ],
		'first_name'       => [ 120, 'First name' ],
		'last_name'        => [ 120, 'Surname' ],
		'email'            => [ 254, 'Email' ],
		'phone'            => [ 40, 'Phone' ],
		'input_text_2'     => [ 40, 'Phone' ],
		'subject'          => [ 200, 'Subject' ],
		'message'          => [ 5000, 'Your message' ],
		'request'          => [ 5000, 'Your prayer request' ],
		'notes'            => [ 5000, 'Notes' ],
		'description'      => [ 5000, 'Your prayer request' ],
		'description_1'    => [ 5000, 'Your comments' ],
		'address_line1'    => [ 200, 'Address' ],
		'address_line2'    => [ 200, 'Address line 2' ],
		'city'             => [ 100, 'Town or city' ],
		'postcode'         => [ 12, 'Postcode' ],
		'children_ages'    => [ 100, "Children's ages" ],
		'input_text'       => [ 200, 'Your answer' ],
	];

	public static function requiredMessage( string $key, string $path ): ?string {
		return self::REQUIRED[ $key ][ $path ] ?? null;
	}

	/** @return list<string> */
	public static function requiredPaths( string $key ): array {
		return array_keys( self::REQUIRED[ $key ] ?? [] );
	}

	public static function emailMessage( string $key ): string {
		return 'newsletter' === $key ? 'Please enter a valid email address.' : "That doesn't look like a valid email address.";
	}

	/**
	 * @param array $data    The submitted values, as Fluent Forms passes them (name fields are arrays).
	 * @param array $context visitDates: list<string> of bookable Y-m-d; groupIds: list<int> of joinable groups.
	 * @return array<string,string> Field path (or "restricted") => the first problem with it.
	 */
	public static function errors( string $key, array $data, array $context = [] ): array {
		$errors = [];
		foreach ( self::REQUIRED[ $key ] ?? [] as $path => $message ) {
			if ( self::isBlank( self::at( $data, $path ) ) ) {
				$errors[ $path ] = $message;
			}
		}
		foreach ( self::LIMITS as $path => [ $max, $label ] ) {
			if ( ! isset( $errors[ $path ] ) && mb_strlen( self::text( $data, $path ) ) > $max ) {
				$errors[ $path ] = "$label is too long — keep it under $max characters.";
			}
		}
		$email = self::text( $data, 'email' );
		if ( ! isset( $errors['email'] ) && '' !== $email && ! preg_match( self::EMAIL_RE, $email ) ) {
			$errors['email'] = self::emailMessage( $key );
		}
		foreach ( self::PHONES as $path ) {
			$phone = self::text( $data, $path );
			if ( ! isset( $errors[ $path ] ) && '' !== $phone && ! preg_match( self::PHONE_RE, $phone ) ) {
				$errors[ $path ] = "That doesn't look like a phone number.";
			}
		}
		return match ( $key ) {
			'gift-aid'     => self::giftAid( $data, $errors ),
			'plan-a-visit' => self::visit( $data, $errors, $context['visitDates'] ?? [] ),
			'join-group'   => self::joinGroup( $data, $errors, $context['groupIds'] ?? [] ),
			'connect-card' => self::optionalPostcode( $data, $errors ),
			default        => $errors,
		};
	}

	/** "m66pu" → "M6 6PU", as the redesign's normalisePostcode(). Too short to split: trimmed and upper-cased. */
	public static function normalisePostcode( string $value ): string {
		$compact = strtoupper( preg_replace( '/\s+/', '', $value ) ?? '' );
		if ( strlen( $compact ) < 5 ) {
			return strtoupper( trim( $value ) );
		}
		return substr( $compact, 0, -3 ) . ' ' . substr( $compact, -3 );
	}

	private static function giftAid( array $data, array $errors ): array {
		if ( ! isset( $errors['first_name'] ) && mb_strlen( preg_replace( '/[.\s]/u', '', self::text( $data, 'first_name' ) ) ?? '' ) < 2 ) {
			$errors['first_name'] = 'HMRC needs your full first name, not an initial.';
		}
		if ( ! isset( $errors['last_name'] ) && mb_strlen( self::text( $data, 'last_name' ) ) < 2 ) {
			$errors['last_name'] = 'Please give your surname.';
		}
		$address = self::text( $data, 'address_line1' );
		if ( ! isset( $errors['address_line1'] ) && ! preg_match( '/\d/', $address ) && mb_strlen( $address ) < 4 ) {
			$errors['address_line1'] = 'Please include your house name or number — HMRC requires it.';
		}
		if ( ! isset( $errors['postcode'] ) && ! preg_match( self::POSTCODE_RE, self::text( $data, 'postcode' ) ) ) {
			$errors['postcode'] = "That doesn't look like a full UK postcode.";
		}
		return $errors;
	}

	private static function optionalPostcode( array $data, array $errors ): array {
		$postcode = self::text( $data, 'postcode' );
		if ( ! isset( $errors['postcode'] ) && '' !== $postcode && ! preg_match( self::POSTCODE_RE, $postcode ) ) {
			$errors['postcode'] = "That doesn't look like a full UK postcode.";
		}
		return $errors;
	}

	private static function visit( array $data, array $errors, array $dates ): array {
		if ( ! isset( $errors['visit_date'] ) && ! in_array( self::text( $data, 'visit_date' ), $dates, true ) ) {
			$errors['visit_date'] = "That date isn't available any more — please choose another.";
		}
		foreach ( [ 'adults' => 1, 'children' => 0 ] as $path => $min ) {
			$value = self::text( $data, $path );
			if ( isset( $errors[ $path ] ) || ( '' === $value && 'children' === $path ) ) {
				continue;
			}
			if ( ! preg_match( '/^\d{1,2}$/', $value ) || (int) $value < $min || (int) $value > 20 ) {
				$errors[ $path ] = 'adults' === $path
					? 'Please enter how many adults are coming, from 1 to 20.'
					: 'Please enter how many children are coming, from 0 to 20.';
			}
		}
		return $errors;
	}

	private static function joinGroup( array $data, array $errors, array $groupIds ): array {
		$group = self::text( $data, 'group_id' );
		if ( '' !== $group && ( ! ctype_digit( $group ) || ! in_array( (int) $group, array_map( 'intval', $groupIds ), true ) ) ) {
			$errors['restricted'] = "That group isn't taking requests right now. Please choose another from the list, or leave it blank and we'll help you find one.";
		}
		return $errors;
	}

	private static function at( array $data, string $path ): mixed {
		$value = $data;
		foreach ( explode( '.', $path ) as $part ) {
			if ( ! is_array( $value ) || ! array_key_exists( $part, $value ) ) {
				return null;
			}
			$value = $value[ $part ];
		}
		return $value;
	}

	private static function text( array $data, string $path ): string {
		$value = self::at( $data, $path );
		return is_scalar( $value ) ? trim( (string) $value ) : '';
	}

	private static function isBlank( mixed $value ): bool {
		if ( is_array( $value ) ) {
			return [] === array_filter( $value, static fn ( $v ) => is_scalar( $v ) && '' !== trim( (string) $v ) );
		}
		return ! is_scalar( $value ) || '' === trim( (string) $value );
	}
}
