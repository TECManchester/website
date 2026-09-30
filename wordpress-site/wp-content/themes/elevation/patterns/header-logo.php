<?php
/**
 * Title: Header logo
 * Slug: elevation/header-logo
 * Inserter: no
 */
$elevation_ink   = esc_url( get_theme_file_uri( 'assets/images/logo-colour.png' ) );
$elevation_white = esc_url( get_theme_file_uri( 'assets/images/logo-white.png' ) );
?>
<!-- wp:html -->
<a class="site-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="{church.name} — home">
	<img class="site-logo__ink" src="<?php echo $elevation_ink; ?>" alt="" width="938" height="307" decoding="async">
	<img class="site-logo__white" src="<?php echo $elevation_white; ?>" alt="" width="938" height="307" decoding="async">
</a>
<!-- /wp:html -->
