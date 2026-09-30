/**
 * Hero slideshow: a new photo every 6.5s (the 1.2s cross-fade is CSS). Never rotates with fewer
 * than two slides, under reduced motion, or while the tab is hidden.
 */
const SLIDE_MS = 6500;

document.querySelectorAll( '.wp-block-elevation-hero-slideshow.has-slides' ).forEach( ( root ) => {
	const slides = [ ...root.querySelectorAll( '.hero-slideshow__slide' ) ];
	if ( slides.length < 2 ) {
		return;
	}
	const reduce = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	let index = 0;
	let timer = null;

	const schedule = () => {
		clearTimeout( timer );
		if ( reduce.matches || document.hidden ) {
			return;
		}
		timer = setTimeout( () => {
			slides[ index ].classList.remove( 'is-active' );
			index = ( index + 1 ) % slides.length;
			slides[ index ].classList.add( 'is-active' );
			schedule();
		}, SLIDE_MS );
	};

	document.addEventListener( 'visibilitychange', schedule );
	reduce.addEventListener( 'change', schedule );
	schedule();
} );
