/**
 * Header behaviour core Navigation doesn't provide:
 * - solid/scrolled state after 80px, transparent "over hero" state on the front page;
 * - the service line, CTA buttons and white logo shown inside the mobile overlay;
 * - "active" link when the current path starts with the link's path (e.g. /about/what-we-believe).
 */
( () => {
	const header = document.querySelector( '.site-header' );
	if ( ! header ) {
		return;
	}
	const part = header.closest( '.wp-block-template-part' ) || header;
	const isHome = document.body.classList.contains( 'home' );

	const update = () => {
		const scrolled = window.scrollY > 80;
		part.classList.toggle( 'is-scrolled', scrolled );
		part.classList.toggle( 'is-over-hero', isHome && ! scrolled );
	};
	update();
	window.addEventListener( 'scroll', update, { passive: true } );
	window.addEventListener( 'pageshow', update );

	const dialog = header.querySelector( '.wp-block-navigation__responsive-dialog' );
	const content = header.querySelector( '.wp-block-navigation__responsive-container-content' );
	const extra = header.querySelector( '.site-header__overlay-extra' );
	const logo = header.querySelector( '.site-logo' );
	if ( dialog && logo ) {
		const overlayLogo = logo.cloneNode( true );
		overlayLogo.classList.add( 'site-logo--overlay' );
		overlayLogo.setAttribute( 'tabindex', '-1' );
		dialog.prepend( overlayLogo );
	}
	if ( content && extra ) {
		content.append( extra );
	}

	const here = window.location.pathname.replace( /\/+$/, '' ) || '/';
	header.querySelectorAll( '.site-nav a.wp-block-navigation-item__content' ).forEach( ( link ) => {
		const path = new URL( link.href, window.location.origin ).pathname.replace( /\/+$/, '' ) || '/';
		if ( path !== '/' && ( here === path || here.startsWith( path + '/' ) ) && ! link.hash ) {
			link.classList.add( 'is-active' );
		}
	} );
} )();
