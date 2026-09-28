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
