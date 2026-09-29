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
		if ( str_ends_with( $key, '.image' ) ) {
			$clean[ $key ] = '' === trim( $value ) ? '' : (string) absint( $value );
			continue;
		}
		if ( str_ends_with( $key, '.focal' ) ) {
			$clean[ $key ] = preg_match( '/^\d{1,3}% \d{1,3}%$/', trim( $value ) ) ? trim( $value ) : '';
			continue;
		}
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
	if ( 'contact.connectGroupInbox' === $key ) {
		return __( 'Connect Groups inbox', 'elevation-core' );
	}
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
				<?php if ( 'hero' === $group ) { elevation_render_hero_fields( $stored ); continue; } ?>
				<h2<?php echo 'youtube' === $group ? ' id="elevation-youtube"' : ''; ?>><?php echo esc_html( 'youtube' === $group ? 'YouTube' : ucfirst( $group ) ); ?></h2>
				<?php if ( 'youtube' === $group ) : ?>
					<p><?php esc_html_e( 'Watch and the home page show the latest videos from this channel, and switch to the live stream while you are streaming. Videos open on YouTube.', 'elevation-core' ); ?></p>
					<?php echo elevation_youtube_status_html(); // Escaped inside. ?>
				<?php endif; ?>
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
									<?php if ( 'contact.connectGroupInbox' === $key ) : ?>
										<p class="description"><?php esc_html_e( "Where 'Ask to join' requests from the Connect Groups page go.", 'elevation-core' ); ?></p>
									<?php endif; ?>
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
			<p><button type="submit" class="button" name="elevation_youtube_check" value="1"><?php esc_html_e( 'Save and check YouTube', 'elevation-core' ); ?></button></p>
		</form>
	</div>
	<?php
}

function elevation_render_hero_fields( array $stored ): void {
	?>
	<style>.elevation-slide__preview:not([hidden]){display:block}</style>
	<h2><?php esc_html_e( 'Home page slideshow', 'elevation-core' ); ?></h2>
	<p><?php esc_html_e( 'Up to six photos behind the home page headline. Keep the subject right of centre; the left side sits under the text. Focal point is the part to keep in frame on phones, as "horizontal% vertical%" (e.g. 62% 30%).', 'elevation-core' ); ?></p>
	<table class="form-table" role="presentation">
		<?php for ( $n = 1; $n <= 6; $n++ ) :
			$base  = "hero.slide$n";
			$name  = Settings::OPTION . "[hero][slide$n]";
			$id    = (int) ( $stored[ "$base.image" ] ?? 0 );
			$thumb = $id ? wp_get_attachment_image_url( $id, 'medium' ) : '';
			?>
			<tr class="elevation-slide">
				<th scope="row"><?php echo esc_html( sprintf( __( 'Slide %d', 'elevation-core' ), $n ) ); ?></th>
				<td>
					<input type="hidden" class="elevation-slide__id" name="<?php echo esc_attr( $name ); ?>[image]" value="<?php echo esc_attr( $id ?: '' ); ?>">
					<img class="elevation-slide__preview" <?php echo $thumb ? 'src="' . esc_url( (string) $thumb ) . '"' : 'hidden'; ?> alt="" style="max-width:240px;margin-bottom:8px">
					<button type="button" class="button elevation-slide__choose"><?php esc_html_e( 'Choose image', 'elevation-core' ); ?></button>
					<button type="button" class="button-link elevation-slide__remove" <?php echo $thumb ? '' : 'hidden'; ?>><?php esc_html_e( 'Remove', 'elevation-core' ); ?></button>
					<p><label><?php esc_html_e( 'Focal point', 'elevation-core' ); ?> <input type="text" class="small-text" name="<?php echo esc_attr( $name ); ?>[focal]" value="<?php echo esc_attr( (string) ( $stored[ "$base.focal" ] ?? '' ) ); ?>" placeholder="50% 50%" pattern="\d{1,3}% \d{1,3}%"></label></p>
					<p><label><?php esc_html_e( 'Description for screen readers', 'elevation-core' ); ?><br><input type="text" class="large-text" name="<?php echo esc_attr( $name ); ?>[alt]" value="<?php echo esc_attr( (string) ( $stored[ "$base.alt" ] ?? '' ) ); ?>"></label></p>
				</td>
			</tr>
		<?php endfor; ?>
	</table>
	<?php
}

add_action( 'admin_enqueue_scripts', function ( string $hook ) {
	if ( ! in_array( $hook, [ 'settings_page_' . ELEVATION_SETTINGS_PAGE, 'toplevel_page_' . ELEVATION_SETTINGS_PAGE ], true ) ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_script( 'elevation-hero-slides', ELEVATION_CORE_URL . 'assets/admin/hero-slides.js', [ 'media-editor' ], (string) filemtime( ELEVATION_CORE_DIR . 'assets/admin/hero-slides.js' ), true );
} );

// Resolved settings are cached per request; nothing to clear across requests.
