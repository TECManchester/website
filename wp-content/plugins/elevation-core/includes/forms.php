<?php
/**
 * The church's Fluent Forms at run time (spec §6.7, §6.10). Forms are found by their seed key
 * (form meta "_elevation_form_key", written by `wp elevation forms seed`), never by database ID.
 */
use Elevation\Core\EventTime;
use Elevation\Core\FormRules;
use Elevation\Core\RateLimit;
use Elevation\Core\ServiceDates;

defined( 'ABSPATH' ) || exit;

/** @return array<string,int> form key => Fluent Forms form ID. Empty when Fluent Forms isn't installed. */
function elevation_form_ids( bool $refresh = false ): array {
	static $ids = null;
	if ( null === $ids || $refresh ) {
		global $wpdb;
		$ids   = [];
		$table = $wpdb->prefix . 'fluentform_form_meta';
		if ( $table === $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) ) {
			foreach ( $wpdb->get_results( "SELECT form_id, value FROM $table WHERE meta_key = '_elevation_form_key' ORDER BY form_id" ) as $row ) { // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name only.
				$ids[ (string) $row->value ] ??= (int) $row->form_id;
			}
		}
	}
	return $ids;
}

function elevation_form_id( string $key ): int {
	return elevation_form_ids()[ $key ] ?? 0;
}

function elevation_form_key( int $id ): ?string {
	$key = array_search( $id, elevation_form_ids(), true );
	return false === $key ? null : $key;
}

/** The seed key of a Fluent Forms form object (or null for forms that aren't the church's). */
function elevation_form_key_of( mixed $form ): ?string {
	return is_object( $form ) && isset( $form->id ) ? elevation_form_key( (int) $form->id ) : null;
}

/** @return list<array{value:string,label:string}> The next 8 service dates for the current Church Settings. */
function elevation_visit_dates( ?DateTimeImmutable $now = null ): array {
	return ServiceDates::next( (string) elevation_setting( 'service.day' ), (string) elevation_setting( 'service.startTime' ), $now ?? new DateTimeImmutable( 'now' ), 8 );
}

// Settings smartcodes: {contact.welcomeInbox}, {service.startTime}, {location.full}, … in recipients, subjects,
// email bodies and success messages resolve to the current Church Settings when the email is sent.
foreach ( [ 'church', 'service', 'location', 'contact', 'socials', 'giving' ] as $elevation_group ) {
	add_filter( "fluentform/smartcode_group_$elevation_group", static function ( $property ) use ( $elevation_group ) {
		$value = elevation_public_setting( $elevation_group . '.' . $property );
		return null === $value ? $property : esc_html( (string) $value );
	} );
}

// {elevation.declaration} inside a form's own HTML (the Gift Aid declaration box). Check the third argument's
// shape in EditorShortcodeParser.php (around line 150): it may be the handler string rather than an array.
add_filter( 'fluentform/editor_shortcode_callback_group_elevation', static function ( $value, $form, $handler ) {
	$property = is_array( $handler ) ? (string) end( $handler ) : (string) $handler;
	return in_array( $property, [ 'declaration', 'elevation.declaration' ], true ) ? esc_html( FormRules::DECLARATION_TEXT ) : $value;
}, 10, 3 );

/**
 * Whether a field path ("email", "names.first_name") is in the submitted form. $fields is the form's input
 * list keyed by field name, as Fluent Forms passes it to the validation filter.
 */
function elevation_form_has_field( array $fields, string $path ): bool {
	$parts = explode( '.', $path );
	if ( ! isset( $fields[ $parts[0] ] ) ) {
		return false;
	}
	$sub = $fields[ $parts[0] ]['fields'] ?? null;
	return count( $parts ) < 2 || ! is_array( $sub ) || isset( $sub[ $parts[1] ] );
}

add_filter( 'fluentform/validation_errors', static function ( $errors, $formData, $form, $fields = null ) {
	$key = elevation_form_key_of( $form );
	if ( null === $key ) {
		return $errors;
	}
	$context = [];
	if ( 'plan-a-visit' === $key ) {
		$context['visitDates'] = array_column( elevation_visit_dates(), 'value' );
	}
	if ( 'join-group' === $key ) {
		$context['groupIds'] = function_exists( 'elevation_joinable_group_ids' ) ? elevation_joinable_group_ids() : [];
	}
	foreach ( FormRules::errors( $key, (array) $formData, $context ) as $path => $message ) {
		// A field staff deleted or renamed in Fluent Forms can't be filled in, so it can't block the form.
		// Kept whatever the form holds: Gift Aid (HMRC), the visit date and the group check.
		if ( is_array( $fields ) && $fields && 'gift-aid' !== $key && ! in_array( $path, [ 'visit_date', 'restricted' ], true ) && ! elevation_form_has_field( $fields, $path ) ) {
			continue;
		}
		$field            = elevation_form_error_key( $path );
		// Fluent Forms' own message for the same rule wins, except for the visit date: its option check says only
		// "The given data was invalid" for a date that was on an older page, and ours explains it.
		$errors[ $field ] = ( 'visit_date' === $field || ! isset( $errors[ $field ] ) ) ? [ $message ] : $errors[ $field ];
	}
	if ( ! $errors ) {
		$wait = elevation_form_rate_wait( $key );
		if ( $wait ) {
			$errors['restricted'] = [ RateLimit::message( $wait ) ];
		}
	}
	return $errors;
}, 10, 4 );

/** "names.first_name" → "names[first_name]", the key Fluent Forms uses for a sub-field's errors (checked locally). */
function elevation_form_error_key( string $path ): string {
	$parts = explode( '.', $path );
	$first = array_shift( $parts );
	return $first . ( $parts ? '[' . implode( '][', $parts ) . ']' : '' );
}

function elevation_form_rate_transient( string $key ): ?string {
	$ip = filter_var( $_SERVER['REMOTE_ADDR'] ?? '', FILTER_VALIDATE_IP ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- validated as an IP.
	return $ip ? 'elevation_rl_' . md5( $key . '|' . $ip . '|' . wp_salt( 'nonce' ) ) : null;
}

/** Minutes until this visitor may send the form again, or 0 when they may send it now. */
function elevation_form_rate_wait( string $key ): int {
	$transient = elevation_form_rate_transient( $key );
	if ( ! $transient ) {
		return 0;
	}
	$stamps = (array) get_transient( $transient );
	return RateLimit::allows( $stamps, time() ) ? 0 : RateLimit::waitMinutes( $stamps, time() );
}

add_action( 'fluentform/submission_inserted', static function ( $entryId, $formData, $form ) {
	$key       = elevation_form_key_of( $form );
	$transient = $key ? elevation_form_rate_transient( $key ) : null;
	if ( $transient ) {
		$stamps   = RateLimit::recent( (array) get_transient( $transient ), time() );
		$stamps[] = time();
		set_transient( $transient, $stamps, RateLimit::WINDOW );
	}
}, 5, 3 );

// What is stored: normalised postcodes, and the Gift Aid wording and version set here, never from the browser.
add_filter( 'fluentform/insert_response_data', static function ( $formData, $formId ) {
	$key = elevation_form_key( (int) $formId );
	if ( in_array( $key, [ 'gift-aid', 'connect-card' ], true ) && isset( $formData['postcode'] ) && '' !== trim( (string) $formData['postcode'] ) ) {
		$formData['postcode'] = FormRules::normalisePostcode( (string) $formData['postcode'] );
	}
	if ( 'gift-aid' === $key ) {
		$formData['declaration_text']    = FormRules::DECLARATION_TEXT;
		$formData['declaration_version'] = FormRules::DECLARATION_VERSION;
	}
	return $formData;
}, 10, 2 );

// No visitor IP addresses in church form entries (Plan 5 ruling); the rate limit reads REMOTE_ADDR itself.
add_filter( 'fluentform/filter_insert_data', static function ( $data ) {
	if ( is_array( $data ) && elevation_form_key( (int) ( $data['form_id'] ?? 0 ) ) ) {
		unset( $data['ip'] );
	}
	return $data;
}, 20 );

// Honeypot on for every church form; Fluent Forms' own look off (the theme's forms.css styles them).
add_filter( 'fluentform/honeypot_status', static fn ( $on, $formId = 0 ) => elevation_form_key( (int) $formId ) ? true : $on, 10, 2 );
add_filter( 'fluentform/load_default_public', static fn ( $load, $form = null ) => elevation_form_key_of( $form ) ? false : $load, 10, 2 );

// The Plan a Visit date list, computed when the form is shown.
add_filter( 'fluentform/rendering_field_data_select', static function ( $data, $form ) {
	if ( 'plan-a-visit' !== elevation_form_key_of( $form ) || 'visit_date' !== ( $data['attributes']['name'] ?? '' ) ) {
		return $data;
	}
	$data['settings']['advanced_options'] = array_map(
		static fn ( array $d ) => [ 'label' => $d['label'], 'value' => $d['value'], 'calc_value' => '' ],
		elevation_visit_dates()
	);
	return $data;
}, 10, 2 );

/** {elevation.*} values in email subjects and bodies that need the submitted data. */
function elevation_form_placeholders( string $text, array $data, bool $html ): string {
	if ( ! str_contains( $text, '{elevation.' ) ) {
		return $text;
	}
	$ticked = static fn ( string $field ): bool => in_array( 'yes', (array) ( $data[ $field ] ?? [] ), true );
	$plain  = static fn ( string $s ): string => $html ? esc_html( $s ) : wp_strip_all_tags( $s );
	$date   = (string) ( $data['visit_date'] ?? '' );
	$group  = function_exists( 'elevation_group_name' ) ? elevation_group_name( (int) ( $data['group_id'] ?? 0 ) ) : '';
	return strtr( $text, [
		'{elevation.visitDate}'     => $plain( ( '' !== $date ? EventTime::formatDate( $date . 'T12:00' ) : '' ) ?: 'a date to be confirmed' ),
		'{elevation.urgentLine}'    => $ticked( 'is_urgent' ) ? ( $html ? '<p><strong>*** MARKED URGENT ***</strong></p>' : '*** MARKED URGENT ***' ) : '',
		'{elevation.prayerFrom}'    => $plain( trim( (string) ( $data['name'] ?? '' ) ) ?: 'Anonymous' ),
		'{elevation.shareWithTeam}' => $ticked( 'share_with_team' ) ? 'yes' : 'no — keep confidential',
		'{elevation.groupName}'     => $plain( '' !== $group ? $group : 'Not sure yet — please help them choose' ),
	] );
}

add_filter( 'fluentform/email_subject', static function ( $subject, $notification, $data, $form ) {
	$key = elevation_form_key_of( $form );
	if ( 'prayer' === $key && in_array( 'yes', (array) ( $data['is_urgent'] ?? [] ), true ) ) {
		return 'URGENT prayer request';
	}
	return $key ? elevation_form_placeholders( (string) $subject, (array) $data, false ) : $subject;
}, 10, 4 );

// A Join Group request for a group with no leader email: an empty subject makes Fluent Forms skip the
// "Group leader" notification (it would otherwise call wp_mail with no recipient and log a failed send).
add_filter( 'fluentform/email_subject', static function ( $subject, $notification, $data, $form ) {
	if ( 'join-group' === elevation_form_key_of( $form ) && 'group-leader' === ( $notification['elevation'] ?? '' )
		&& function_exists( 'elevation_group_leader_email' ) && '' === elevation_group_leader_email( (int) ( ( (array) $data )['group_id'] ?? 0 ) ) ) {
		return '';
	}
	return $subject;
}, 20, 4 );

// Church emails carry no "Powered by FluentForm" credit, and Fluent Forms' form analytics never store visitor IPs.
add_filter( 'fluentform/email_template_footer_credit', '__return_empty_string' );
add_filter( 'fluentform/disabled_analytics', '__return_true', 20 );

add_filter( 'fluentform/submission_message_parse', static function ( $body, $entryId, $data, $form ) {
	$body = elevation_form_placeholders( (string) $body, (array) $data, true );
	// {all_data} prints field labels, which can hold settings tokens ("Which {service.day} are you coming?").
	return elevation_form_key_of( $form ) ? elevation_replace_tokens( $body ) : $body;
}, 10, 4 );

// Fluent Forms only applies a notification's From name when it also has a From address, and ours use WordPress's
// own. So mail that would say "WordPress" says the church's name instead.
add_filter( 'wp_mail_from_name', static function ( $name ) {
	return 'WordPress' === $name ? ( (string) elevation_public_setting( 'church.name' ) ?: $name ) : $name;
} );
