<?php
namespace Elevation\Core;

/**
 * Church Settings: defaults (from the redesign's src/lib/church.ts), merge rules and derived values.
 * Pure — no WordPress calls — so it can be unit-tested.
 */
final class Settings {

	public const OPTION      = 'elevation_settings';
	public const SECRET_KEYS = [ 'youtube.apiKey' ];

	public static function defaults(): array {
		return [
			'church'    => [
				'name'             => 'Elevation Church Manchester',
				'legalName'        => 'The Elevation Church UK',
				'shortName'        => 'TEC Manchester',
				'tagline'          => 'Making Greatness Common',
				'mission'          => 'To empower you to achieve the highest level of distinction and greatness in life, serving God and humanity with passion.',
				'bedrockReference' => 'Matthew 23:11',
				'bedrockText'      => 'He who is greatest among you shall be your servant.',
				'launched'         => '1 May 2023',
				'charityNumber'    => '1195403',
			],
			'service'   => [
				'day'       => 'Sunday',
				'startTime' => '10:30am',
				'doorsOpen' => '',
			],
			'location'  => [
				'venue'     => 'Mary Seacole Building',
				'campus'    => 'University of Salford',
				'city'      => 'Manchester',
				'postcode'  => 'M6 6PU',
				'country'   => 'United Kingdom',
				'mapsQuery' => 'Mary Seacole Building, University of Salford, M6 6PU',
			],
			'contact'   => [
				'email'             => 'info@elevationmanchester.org',
				'phoneLabel'        => '07469 062220',
				'phoneTel'          => '+447469062220',
				'prayerInbox'       => '',
				'welcomeInbox'      => 'info@elevationmanchester.org',
				'connectGroupInbox' => 'connectgroup@elevationmanchester.org',
			],
			'socials'   => [
				'youtube'   => [ 'name' => 'YouTube', 'handle' => '@TheElevationChurchManchester', 'url' => 'https://www.youtube.com/@TheElevationChurchManchester' ],
				'instagram' => [ 'name' => 'Instagram', 'handle' => '@elevationmanchester', 'url' => 'https://www.instagram.com/elevationmanchester/' ],
				'facebook'  => [ 'name' => 'Facebook', 'handle' => '@elevationmanchester', 'url' => 'https://www.facebook.com/elevationmanchester' ],
				'x'         => [ 'name' => 'X', 'handle' => '@elevationmanche', 'url' => 'https://x.com/elevationmanche' ],
			],
			'giving'    => [
				'paypalUrl'         => 'https://www.paypal.com/donate/?hosted_button_id=L3ZEPY5K8QV6Y&source=qr',
				'bankAccountName'   => 'The Elevation Church UK MAN',
				'bankAccountNumber' => '49654219',
				'bankSortCode'      => '23-05-80',
				'chequePayableTo'   => 'The Elevation Church UK',
			],
			'hero'      => array_fill_keys(
				[ 'slide1', 'slide2', 'slide3', 'slide4', 'slide5', 'slide6' ],
				[ 'image' => '', 'focal' => '', 'alt' => '' ]
			),
			'analytics' => [
				'ga4MeasurementId' => 'G-0Q3764FCYN',
			],
			'youtube'   => [
				'channelHandle' => 'TheElevationChurchManchester',
				'apiKey'        => '',
			],
		];
	}

	/** Merge stored values over defaults, then add derived values. */
	public static function resolve( array $stored ): array {
		$settings = self::merge( self::defaults(), $stored );

		$loc = $settings['location'];
		$settings['location']['full']     = sprintf( '%s, %s, %s %s', $loc['venue'], $loc['campus'], $loc['city'], $loc['postcode'] );
		$settings['location']['mapsUrl']  = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $loc['mapsQuery'] );
		$settings['location']['embedUrl'] = 'https://www.google.com/maps?q=' . rawurlencode( $loc['mapsQuery'] ) . '&output=embed';

		$svc = $settings['service'];
		$settings['service']['arrivalNote']   = '' !== $svc['doorsOpen'] ? 'Doors from ' . $svc['doorsOpen'] : 'Come a little early for a coffee';
		$settings['service']['startSentence'] = '' !== $svc['doorsOpen']
			? sprintf( 'Doors open at %s and we start at %s.', $svc['doorsOpen'], $svc['startTime'] )
			: sprintf( 'We start at %s.', $svc['startTime'] );

		if ( '' === $settings['contact']['prayerInbox'] ) {
			$settings['contact']['prayerInbox'] = $settings['contact']['email'];
		}
		return $settings;
	}

	/**
	 * Only keys present in $defaults survive. A blank stored string falls back to a non-blank
	 * default, so a required value can't be cleared by accident. Keys whose default is '' are optional.
	 */
	private static function merge( array $defaults, array $stored ): array {
		$out = [];
		foreach ( $defaults as $key => $default ) {
			$value = $stored[ $key ] ?? null;
			if ( is_array( $default ) ) {
				$out[ $key ] = self::merge( $default, is_array( $value ) ? $value : [] );
			} elseif ( is_scalar( $value ) && ( '' !== trim( (string) $value ) || '' === $default ) ) {
				$out[ $key ] = trim( (string) $value );
			} else {
				$out[ $key ] = $default;
			}
		}
		return $out;
	}

	/** @return list<array{image:int, focal:string, alt:string}> Slides that have an image, in slot order. */
	public static function heroSlides( array $settings ): array {
		$slides = [];
		foreach ( (array) ( $settings['hero'] ?? [] ) as $slot ) {
			$image = (string) ( $slot['image'] ?? '' );
			if ( ! ctype_digit( $image ) || 0 === (int) $image ) {
				continue;
			}
			$focal    = (string) ( $slot['focal'] ?? '' );
			$slides[] = [
				'image' => (int) $image,
				'focal' => preg_match( '/^\d{1,3}% \d{1,3}%$/', $focal ) ? $focal : '50% 50%',
				'alt'   => (string) ( $slot['alt'] ?? '' ),
			];
		}
		return $slides;
	}

	public static function get( array $settings, string $key ): mixed {
		if ( '' === $key ) {
			return null;
		}
		$node = $settings;
		foreach ( explode( '.', $key ) as $part ) {
			if ( ! is_array( $node ) || ! array_key_exists( $part, $node ) ) {
				return null;
			}
			$node = $node[ $part ];
		}
		return $node;
	}

	/** @return array<string, scalar> */
	public static function flatten( array $tree, string $prefix = '' ): array {
		$flat = [];
		foreach ( $tree as $key => $value ) {
			$path = '' === $prefix ? (string) $key : $prefix . '.' . $key;
			if ( is_array( $value ) ) {
				$flat += self::flatten( $value, $path );
			} else {
				$flat[ $path ] = $value;
			}
		}
		return $flat;
	}

	public static function unflatten( array $flat ): array {
		$tree = [];
		foreach ( $flat as $path => $value ) {
			$node = &$tree;
			foreach ( explode( '.', (string) $path ) as $part ) {
				if ( ! isset( $node[ $part ] ) || ! is_array( $node[ $part ] ) ) {
					$node[ $part ] = [];
				}
				$node = &$node[ $part ];
			}
			$node = $value;
			unset( $node );
		}
		return $tree;
	}

	/** @return array<string, scalar> Every scalar setting except secrets, keyed by dotted path. */
	public static function publicValues( array $settings ): array {
		return array_diff_key( self::flatten( $settings ), array_flip( self::SECRET_KEYS ) );
	}
}
