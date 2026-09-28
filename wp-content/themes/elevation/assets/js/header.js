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
		// Decorative, non-focusable copy so core's focus trap never lands on it.
		const white = logo.querySelector( '.site-logo__white' );
		const overlayLogo = document.createElement( 'span' );
		overlayLogo.className = 'site-logo site-logo--overlay';
		overlayLogo.setAttribute( 'aria-hidden', 'true' );
		if ( white ) {
			overlayLogo.append( white.cloneNode( true ) );
		}
		dialog.prepend( overlayLogo );
	}
	if ( content && extra ) {
		content.append( extra );
	}

	// Core computes its Tab-wrap targets before the overlay is visible, so the first open has no focus trap.
	// Wrap Tab / Shift+Tab inside the open overlay ourselves.
	const overlay = header.querySelector( '.wp-block-navigation__responsive-container' );
	if ( overlay ) {
		overlay.addEventListener( 'keydown', ( event ) => {
			if ( event.key !== 'Tab' || ! overlay.classList.contains( 'is-menu-open' ) ) {
				return;
			}
			const items = Array.from( overlay.querySelectorAll( 'a[href], button:not([disabled])' ) ).filter( ( el ) => el.offsetParent !== null );
			if ( ! items.length ) {
				return;
			}
			const first = items[ 0 ];
			const last = items[ items.length - 1 ];
			if ( event.shiftKey && document.activeElement === first ) {
				event.preventDefault();
				last.focus();
			} else if ( ! event.shiftKey && document.activeElement === last ) {
				event.preventDefault();
				first.focus();
			}
		} );
	}

	const here = window.location.pathname.replace( /\/+$/, '' ) || '/';
	header.querySelectorAll( '.site-nav a.wp-block-navigation-item__content' ).forEach( ( link ) => {
		const path = new URL( link.href, window.location.origin ).pathname.replace( /\/+$/, '' ) || '/';
		if ( path !== '/' && ( here === path || here.startsWith( path + '/' ) ) && ! link.hash ) {
			link.classList.add( 'is-active' );
		}
	} );
} )();
