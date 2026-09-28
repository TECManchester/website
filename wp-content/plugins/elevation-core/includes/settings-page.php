<?php
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

const ELEVATION_SETTINGS_PAGE = 'elevation-church';

/** Fields shown as a textarea rather than a one-line input. */
const ELEVATION_SETTINGS_TEXTAREAS = [ 'church.mission', 'church.bedrockText' ];

add_action( 'admin_init', function () {
	register_setting( ELEVATION_SETTINGS_PAGE, Settings::OPTION, [
		'type'              => 'array',
		'sanitize_callback' => 'elevation_sanitize_settings',
		'default'           => [],
	] );
} );

// options.php checks manage_options by default; Site Managers don't have it.
add_filter( 'option_page_capability_' . ELEVATION_SETTINGS_PAGE, fn () => 'manage_church_settings' );

add_action( 'admin_menu', function () {
	add_options_page(
		__( 'Church Settings', 'elevation-core' ),
		__( 'Church', 'elevation-core' ),
		'manage_church_settings',
		ELEVATION_SETTINGS_PAGE,
		'elevation_render_settings_page'
	);
} );

// Settings → Church is under the Settings menu, which Site Managers otherwise can't see.
add_action( 'admin_menu', function () {
	if ( current_user_can( 'manage_church_settings' ) && ! current_user_can( 'manage_options' ) ) {
		add_menu_page( __( 'Church Settings', 'elevation-core' ), __( 'Church', 'elevation-core' ),
			'manage_church_settings', ELEVATION_SETTINGS_PAGE, 'elevation_render_settings_page', 'dashicons-building', 80 );
	}
}, 11 );

/** Keep only known keys; clean each by what it holds. Blank values fall back at read time. */
function elevation_sanitize_settings( $input ): array {
	$input   = is_array( $input ) ? Settings::flatten( wp_unslash( $input ) ) : [];
	$allowed = Settings::flatten( Settings::defaults() );
	$clean   = [];
	foreach ( $allowed as $key => $default ) {
		if ( ! array_key_exists( $key, $input ) ) {
			continue;
		}
		$value = (string) $input[ $key ];
		if ( preg_match( '/(email|Inbox)$/', $key ) ) {
			$clean[ $key ] = sanitize_email( $value );
		} elseif ( preg_match( '/(url|Url)$/', $key ) ) {
			$clean[ $key ] = esc_url_raw( $value );
		} elseif ( in_array( $key, ELEVATION_SETTINGS_TEXTAREAS, true ) ) {
			$clean[ $key ] = sanitize_textarea_field( $value );
		} else {
			$clean[ $key ] = sanitize_text_field( $value );
		}
	}
	return Settings::unflatten( $clean );
}

function elevation_settings_label( string $key ): string {
	$last = substr( $key, strrpos( $key, '.' ) + 1 );
	return ucfirst( strtolower( trim( preg_replace( '/([A-Z0-9]+)/', ' $1', $last ) ) ) );
}

function elevation_render_settings_page(): void {
	if ( ! current_user_can( 'manage_church_settings' ) ) {
		return;
	}
	$stored = get_option( Settings::OPTION, [] );
	$stored = Settings::flatten( is_array( $stored ) ? $stored : [] );
	$groups = [];
	foreach ( Settings::flatten( Settings::defaults() ) as $key => $default ) {
		$groups[ strtok( $key, '.' ) ][ $key ] = $default;
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Church Settings', 'elevation-core' ); ?></h1>
		<p><?php esc_html_e( 'These details appear across the website. Leave a field blank to use the default shown.', 'elevation-core' ); ?></p>
		<form method="post" action="options.php">
			<?php settings_fields( ELEVATION_SETTINGS_PAGE ); ?>
			<?php foreach ( $groups as $group => $fields ) : ?>
				<h2><?php echo esc_html( ucfirst( $group ) ); ?></h2>
				<table class="form-table" role="presentation">
					<?php foreach ( $fields as $key => $default ) :
						$name  = Settings::OPTION . '[' . str_replace( '.', '][', $key ) . ']';
						$id    = 'elevation-' . str_replace( '.', '-', $key );
						$value = $stored[ $key ] ?? '';
						$type  = preg_match( '/(email|Inbox)$/', $key ) ? 'email' : ( preg_match( '/(url|Url)$/', $key ) ? 'url' : 'text' );
						if ( 'youtube.apiKey' === $key ) {
							$type = 'password';
						}
						?>
						<tr>
							<th scope="row"><label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( elevation_settings_label( $key ) ); ?></label></th>
							<td>
								<?php if ( in_array( $key, ELEVATION_SETTINGS_TEXTAREAS, true ) ) : ?>
									<textarea class="large-text" rows="3" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" placeholder="<?php echo esc_attr( $default ); ?>"><?php echo esc_textarea( $value ); ?></textarea>
								<?php else : ?>
									<input class="regular-text" type="<?php echo esc_attr( $type ); ?>" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" placeholder="<?php echo esc_attr( 'password' === $type ? '' : $default ); ?>" autocomplete="off">
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				</table>
			<?php endforeach; ?>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

// Resolved settings are cached per request; nothing to clear across requests.
