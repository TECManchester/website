<?php
/**
 * Plugin Name: Local Dev Tweaks
 * Description: Local-environment-only helpers. Not for production.
 */

if ( wp_get_environment_type() !== 'local' ) {
	return;
}

// The live site serves SVG logos; allow SVG uploads locally so the importer can pull them.
add_filter( 'upload_mimes', function ( $mimes ) {
	$mimes['svg'] = 'image/svg+xml';
	return $mimes;
} );

add_filter( 'wp_check_filetype_and_ext', function ( $data, $file, $filename ) {
	if ( str_ends_with( strtolower( $filename ), '.svg' ) ) {
		$data['ext']  = 'svg';
		$data['type'] = 'image/svg+xml';
	}
	return $data;
}, 10, 3 );

// Deliver all local mail to Mailpit (http://localhost:8025) instead of the outside world.
add_action( 'phpmailer_init', function ( $mailer ) {
	$mailer->isSMTP();
	$mailer->Host        = 'mailpit';
	$mailer->Port        = 1025;
	$mailer->SMTPAuth    = false;
	$mailer->SMTPAutoTLS = false;
} );

// PHPMailer rejects the default From of wordpress@localhost (no TLD), so local mail needs a valid one.
add_filter( 'wp_mail_from', function ( $from ) {
	return 'wordpress@localhost' === $from ? 'wordpress@elevationmanchester.local' : $from;
} );

// Local pages must never count in the church's real GA4 property.
add_filter( 'elevation_consent_config', function ( array $config ) {
	$config['ga4'] = 'G-LOCAL0000';
	return $config;
} );

/*
 * Local block validator: http://localhost:8080/?elevation-validate-blocks=1
 * Parses every published page and elevation/* pattern with the block editor's own parser and
 * reports blocks it would flag as invalid in window.elevationValidation. No effect without the query var.
 */
add_action( 'wp_enqueue_scripts', function () {
	if ( ! isset( $_GET['elevation-validate-blocks'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return;
	}

	$handles = array( 'wp-blocks', 'wp-block-library', 'wp-format-library', 'wp-block-editor' );
	foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $name => $type ) {
		if ( str_starts_with( $name, 'elevation/' ) ) {
			$handles = array_merge( $handles, (array) $type->editor_script_handles );
		}
	}

	// The elevation-core editor bundle (formats, hooks); registered here because it is normally editor-only.
	$asset_file = WP_PLUGIN_DIR . '/elevation-core/build/editor/index.asset.php';
	if ( file_exists( $asset_file ) ) {
		$asset = include $asset_file;
		wp_register_script( 'elevation-editor-validate', plugins_url( 'build/editor/index.js', WP_PLUGIN_DIR . '/elevation-core/elevation-core.php' ), $asset['dependencies'], $asset['version'], true );
		$handles[] = 'elevation-editor-validate';
	}

	foreach ( array_unique( $handles ) as $handle ) {
		wp_enqueue_script( $handle );
	}
} );

add_action( 'wp_footer', function () {
	if ( ! isset( $_GET['elevation-validate-blocks'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return;
	}

	$sources = array();
	foreach ( get_posts( array( 'post_type' => 'page', 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'menu_order title', 'order' => 'ASC' ) ) as $page ) {
		$sources[] = array( 'page ' . $page->post_name, $page->post_content );
	}
	foreach ( WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $pattern ) {
		if ( str_starts_with( $pattern['name'], 'elevation/' ) ) {
			$sources[] = array( 'pattern ' . $pattern['name'], $pattern['content'] );
		}
	}
	foreach ( get_block_templates( array(), 'wp_template' ) as $template ) {
		if ( 'elevation' === $template->theme ) {
			$sources[] = array( 'template ' . $template->slug, $template->content );
		}
	}
	?>
<script type="application/json" id="elevation-validate-data"><?php echo wp_json_encode( array( 'sources' => $sources ), JSON_HEX_TAG | JSON_HEX_AMP ); ?></script>
<script>
( function () {
	const data = JSON.parse( document.getElementById( 'elevation-validate-data' ).textContent );
	if ( ! wp.blocks.getBlockType( 'core/paragraph' ) ) {
		wp.blockLibrary.registerCoreBlocks();
	}
	const problems = [];
	const walk = ( label, blocks ) => blocks.forEach( ( block ) => {
		if ( block.name && ! block.isValid ) {
			const issues = ( block.validationIssues || [] ).map( ( i ) => {
				const args = ( i.args || [] ).map( ( a ) => ( typeof a === 'string' ? a : JSON.stringify( a ) ) );
				return ( i.message || '' ).replace( /%[sd]/g, () => args.shift() );
			} );
			problems.push( { label, block: block.name, issues } );
		}
		walk( label, block.innerBlocks || [] );
	} );
	data.sources.forEach( ( [ label, raw ] ) => walk( label, wp.blocks.parse( raw ) ) );
	window.elevationValidation = { total: data.sources.length, problems };
	const pre = document.createElement( 'pre' );
	pre.id = 'elevation-validation';
	pre.textContent = JSON.stringify( window.elevationValidation, null, 2 );
	document.body.appendChild( pre );
} )();
</script>
	<?php
}, 100 );
