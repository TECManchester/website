<?php
/**
 * Consent banner and runtime (spec §6.8). Nothing from Google loads until the visitor chooses.
 * The banner is printed first in <body> so keyboard and screen-reader users reach it first.
 */
defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', function () {
	$dir  = ELEVATION_CORE_DIR . 'assets/';
	$args = [ 'in_footer' => true, 'strategy' => 'defer' ];
	wp_register_script( 'elevation-consent-state', ELEVATION_CORE_URL . 'assets/js/consent-state.js', [], (string) filemtime( $dir . 'js/consent-state.js' ), $args );
	wp_enqueue_script( 'elevation-consent', ELEVATION_CORE_URL . 'assets/js/consent.js', [ 'elevation-consent-state' ], (string) filemtime( $dir . 'js/consent.js' ), $args );
	$config = apply_filters( 'elevation_consent_config', [ 'ga4' => (string) elevation_setting( 'analytics.ga4MeasurementId' ) ] );
	wp_add_inline_script( 'elevation-consent', 'window.ecmConsentConfig = ' . wp_json_encode( $config ) . ';', 'before' );
	wp_enqueue_style( 'elevation-consent', ELEVATION_CORE_URL . 'assets/css/consent.css', [], (string) filemtime( $dir . 'css/consent.css' ) );
} );

add_action( 'wp_body_open', function () {
	$privacy = esc_url( home_url( '/privacy/#cookies' ) );
	?>
	<section id="ecm-consent" class="ecm-consent" aria-labelledby="ecm-consent-title" hidden>
		<div class="ecm-consent__panel">
			<h2 id="ecm-consent-title" class="ecm-consent__title">Your privacy choices</h2>
			<p class="ecm-consent__text">We'd like to use Google Analytics to see how people use this site, and to show maps and videos from Google and Podbean. None of it loads until you say so. <a href="<?php echo $privacy; ?>">How we use your information</a></p>
			<div class="ecm-consent__choose" hidden>
				<label class="ecm-consent__option"><input type="checkbox" name="analytics"> <span><strong>Analytics</strong> Google Analytics counts visits and which pages help people. It sets _ga cookies.</span></label>
				<label class="ecm-consent__option"><input type="checkbox" name="embeds"> <span><strong>Maps &amp; videos</strong> Load Google Maps, YouTube and Podbean players without asking each time.</span></label>
				<button type="button" class="ecm-consent__btn" data-ecm-action="save">Save my choices</button>
			</div>
			<div class="ecm-consent__actions">
				<button type="button" class="ecm-consent__btn" data-ecm-action="acceptAll">Accept all</button>
				<button type="button" class="ecm-consent__btn" data-ecm-action="rejectAll">Reject all</button>
				<button type="button" class="ecm-consent__btn ecm-consent__btn--ghost" data-ecm-action="choose">Choose</button>
			</div>
		</div>
	</section>
	<?php
} );
