/**
 * Fade-up on scroll for .reveal elements (redesign reveal.tsx). The hiding CSS only applies once
 * this has set data-reveal-ready, so without JS — or under reduced motion — everything stays visible.
 */
( () => {
	if ( ! ( 'IntersectionObserver' in window ) || window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		return;
	}
	document.documentElement.dataset.revealReady = 'true';
	const observer = new IntersectionObserver( ( entries ) => {
		for ( const entry of entries ) {
			if ( entry.isIntersecting ) {
				entry.target.classList.add( 'is-visible' );
				observer.unobserve( entry.target );
			}
		}
	}, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 } );
	document.querySelectorAll( '.reveal' ).forEach( ( el ) => observer.observe( el ) );
} )();
