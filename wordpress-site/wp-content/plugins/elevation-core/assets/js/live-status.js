/**
 * Live swap (spec §6.4): on load, then every minute while the tab is visible, ask /elevation/v1/live
 * whether the stream state changed since this (possibly cached) page was rendered; if so, replace each
 * live block with the fresh HTML the server rendered for it. Without JS the rendered state stays.
 */
( function () {
	const M = window.ecmLiveState;
	const config = window.ecmLive || {};
	const blocks = () => Array.prototype.slice.call( document.querySelectorAll( '[data-live-block]' ) );
	if ( ! M || ! config.endpoint || ! blocks().length ) {
		return;
	}

	function swap( el, html ) {
		const tpl = document.createElement( 'template' );
		tpl.innerHTML = html.trim(); // Same-origin HTML, rendered and escaped by the server.
		const next = tpl.content.firstElementChild;
		if ( ! next ) {
			return;
		}
		// reveal.js only watched the original nodes: show swapped-in content straight away.
		[ next ].concat( Array.prototype.slice.call( next.querySelectorAll( '.reveal' ) ) ).forEach( function ( node ) {
			if ( node.classList.contains( 'reveal' ) ) {
				node.classList.add( 'is-visible' );
			}
		} );
		el.replaceWith( next );
		if ( window.ecmConsent && window.ecmConsent.scan ) {
			window.ecmConsent.scan( next );
		}
	}

	function check() {
		const first = blocks()[ 0 ];
		if ( ! first ) {
			return;
		}
		const url = config.endpoint + ( config.endpoint.indexOf( '?' ) === -1 ? '?' : '&' ) + 'post=' + encodeURIComponent( first.dataset.livePost || '0' );
		fetch( url, { cache: 'no-store', credentials: 'omit' } )
			.then( function ( res ) {
				return res.ok ? res.json() : null;
			} )
			.then( function ( json ) {
				const next = M.parse( json );
				if ( ! M.needsSwap( first.dataset.liveState, next ) ) {
					return;
				}
				blocks().forEach( function ( el ) {
					const html = next.blocks[ el.dataset.liveBlock ];
					if ( typeof html === 'string' ) {
						swap( el, html );
					}
				} );
			} )
			.catch( function () {} );
	}

	check();
	window.setInterval( function () {
		if ( ! document.hidden ) {
			check();
		}
	}, 60000 );
} )();
