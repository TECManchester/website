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
	// The saved API key is never sent back to the browser, so a blank field means "keep the current key".
	if ( array_key_exists( 'youtube.apiKey', $clean ) ) {
		$old_tree = get_option( Settings::OPTION, [] );
		$old      = Settings::flatten( is_array( $old_tree ) ? $old_tree : [] );
		$remove   = ! empty( $input['youtube.removeApiKey'] );
		if ( $remove ) {
			$clean['youtube.apiKey'] = '';
		} elseif ( '' === $clean['youtube.apiKey'] ) {
			$clean['youtube.apiKey'] = (string) ( $old['youtube.apiKey'] ?? '' );
		}
	}
	return Settings::unflatten( $clean );
}

function elevation_settings_label( string $key ): string {
	$parts = explode( '.', $key );
	$last  = array_pop( $parts );
	$words = trim( preg_replace( '/([A-Z0-9]+)/', ' $1', $last ) );
	$label = ucfirst( strtolower( $words ) );
	$label = preg_replace( '/\burl\b/i', 'URL', $label );
	// Nested groups (socials.youtube.url) lead with their brand so the four socials read differently.
	if ( count( $parts ) > 1 ) {
		$brand = end( $parts );
		$brand = [ 'youtube' => 'YouTube', 'x' => 'X' ][ $brand ] ?? ucfirst( $brand );
		$label = 'URL' === $label ? $brand . ' URL' : $brand . ' ' . strtolower( $label );
	}
	return $label;
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
	// options-general.php shows saved/error notices itself; the top-level page Site Managers get does not.
	global $parent_file;
	if ( 'options-general.php' !== $parent_file ) {
		settings_errors();
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
						$is_secret = in_array( $key, Settings::SECRET_KEYS, true );
						if ( $is_secret ) {
							$type = 'password';
							$has_key = '' !== $value;
							$value   = ''; // never output the stored secret
						}
						?>
						<tr>
							<th scope="row"><label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( elevation_settings_label( $key ) ); ?></label></th>
							<td>
								<?php if ( in_array( $key, ELEVATION_SETTINGS_TEXTAREAS, true ) ) : ?>
									<textarea class="large-text" rows="3" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" placeholder="<?php echo esc_attr( $default ); ?>"><?php echo esc_textarea( $value ); ?></textarea>
								<?php else : ?>
									<input class="regular-text" type="<?php echo esc_attr( $type ); ?>" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" placeholder="<?php echo esc_attr( $is_secret ? '' : $default ); ?>" autocomplete="<?php echo $is_secret ? 'new-password' : 'off'; ?>">
									<?php if ( $is_secret ) : ?>
										<p class="description">
											<strong><?php echo $has_key ? esc_html__( 'A key is saved.', 'elevation-core' ) : esc_html__( 'No key saved.', 'elevation-core' ); ?></strong>
											<?php esc_html_e( 'Leave blank to keep the current key.', 'elevation-core' ); ?>
										</p>
										<?php if ( $has_key ) : ?>
											<p><label><input type="checkbox" name="<?php echo esc_attr( Settings::OPTION ); ?>[youtube][removeApiKey]" value="1"> <?php esc_html_e( 'Remove the saved key', 'elevation-core' ); ?></label></p>
										<?php endif; ?>
									<?php endif; ?>
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
