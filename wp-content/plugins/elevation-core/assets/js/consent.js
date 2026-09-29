/**
 * Consent runtime (spec §6.8): the banner, GA4 after analytics consent, embed gates and the
 * Privacy page controls. Needs consent-state.js; config in window.ecmConsentConfig = { ga4 }.
 */
( function () {
	const S = window.ecmConsentState;
	const config = window.ecmConsentConfig || {};
	const EVENT = 'ecm:consent-changed';

	const storage = {
		get: function ( key ) {
			try {
				return window.localStorage.getItem( key );
			} catch ( e ) {
				return null; // Private browsing can refuse storage: treat as "no choice yet".
			}
		},
		set: function ( key, value ) {
			try {
				if ( value === null ) {
					window.localStorage.removeItem( key );
				} else {
					window.localStorage.setItem( key, value );
				}
			} catch ( e ) {}
		},
	};

	const raw = storage.get( S.KEY );
	let state = S.parse( raw, storage.get( S.LEGACY_KEY ), Date.now() );
	if ( state && ! S.parse( raw, null, 0 ) ) {
		// Came from the redesign's legacy key: store it in the new format once and drop the old key.
		storage.set( S.KEY, S.serialise( state ) );
		storage.set( S.LEGACY_KEY, null );
	}

	/* ---------- GA4 ---------- */
	let gaLoaded = false;
	const gaId = /^G-[A-Z0-9]+$/.test( config.ga4 || '' ) ? config.ga4 : '';

	function loadAnalytics() {
		if ( ! gaId ) {
			return;
		}
		window[ 'ga-disable-' + gaId ] = false;
		if ( gaLoaded ) {
			return;
		}
		gaLoaded = true;
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () {
			window.dataLayer.push( arguments );
		};
		window.gtag( 'js', new Date() );
		window.gtag( 'config', gaId );
		const script = document.createElement( 'script' );
		script.async = true;
		script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent( gaId );
		document.head.appendChild( script );
	}

	function clearAnalytics() {
		if ( gaId ) {
			window[ 'ga-disable-' + gaId ] = true;
		}
		S.gaCookieNames( document.cookie ).forEach( function ( name ) {
			S.cookieDomains( window.location.hostname ).forEach( function ( domain ) {
				document.cookie = name + '=; Max-Age=0; path=/' + ( domain ? '; domain=' + domain : '' );
			} );
		} );
	}

	/* ---------- Embeds ---------- */
	function openEmbed( gate, focus ) {
		const template = gate && gate.querySelector( 'template' );
		if ( ! template ) {
			return;
		}
		gate.replaceChildren( template.content.cloneNode( true ) );
		gate.classList.add( 'is-loaded' );
		if ( focus ) {
			const frame = gate.querySelector( 'iframe' );
			if ( frame ) {
				frame.focus();
			}
		}
	}

	/* ---------- Banner ---------- */
	const banner = document.getElementById( 'ecm-consent' );
	let opener = null;

	function showBanner( withChoices ) {
		if ( ! banner ) {
			return;
		}
		banner.hidden = false;
		banner.querySelector( '.ecm-consent__choose' ).hidden = ! withChoices;
		banner.querySelector( '[name="analytics"]' ).checked = !! ( state && state.analytics );
		banner.querySelector( '[name="embeds"]' ).checked = !! ( state && state.embeds );
	}

	function hideBanner() {
		if ( banner ) {
			banner.hidden = true;
		}
		if ( opener ) {
			opener.focus();
			opener = null;
		}
	}

	/* ---------- Privacy page controls ---------- */
	function statusText() {
		if ( ! state ) {
			return "You haven't made a choice yet, so analytics is off and maps and videos wait until you click them.";
		}
		return ( state.analytics ? 'Analytics is on.' : 'Analytics is off.' ) +
			( state.embeds ? ' Maps and videos load automatically.' : ' Maps and videos wait until you click them.' );
	}

	function syncControls() {
		document.querySelectorAll( '[data-ecm-consent-controls]' ).forEach( function ( root ) {
			root.querySelector( '[data-ecm-status]' ).textContent = statusText();
			root.querySelector( '[name="analytics"]' ).checked = !! ( state && state.analytics );
			root.querySelector( '[name="embeds"]' ).checked = !! ( state && state.embeds );
			root.querySelector( '[data-ecm-controls-body]' ).hidden = false;
		} );
	}

	/* ---------- State ---------- */
	function sync() {
		if ( state && state.analytics ) {
			loadAnalytics();
		}
		if ( state && state.embeds ) {
			document.querySelectorAll( '[data-ecm-embed]:not(.is-loaded)' ).forEach( function ( gate ) {
				openEmbed( gate, false );
			} );
		}
		syncControls();
	}

	function apply( next ) {
		const before = state;
		state = next;
		storage.set( S.KEY, next ? S.serialise( next ) : null );
		if ( S.withdrewAnalytics( before, next ) ) {
			clearAnalytics();
		}
		sync();
		window.dispatchEvent( new CustomEvent( EVENT, { detail: state } ) );
	}

	document.addEventListener( 'click', function ( event ) {
		const load = event.target.closest( '[data-ecm-embed-load]' );
		if ( load ) {
			openEmbed( load.closest( '[data-ecm-embed]' ), true );
			return;
		}
		const open = event.target.closest( '[data-ecm-consent-open]' );
		if ( open && banner ) {
			event.preventDefault();
			opener = open;
			showBanner( true );
			banner.querySelector( '.ecm-consent__choose input' ).focus();
			return;
		}
		if ( event.target.closest( '[data-ecm-consent-clear]' ) ) {
			apply( S.choose( { type: 'clear' }, Date.now() ) );
			showBanner( false );
			return;
		}
		const action = event.target.closest( '[data-ecm-action]' );
		if ( ! action || ! banner ) {
			return;
		}
		const type = action.dataset.ecmAction;
		if ( type === 'choose' ) {
			showBanner( true );
			banner.querySelector( '.ecm-consent__choose input' ).focus();
			return;
		}
		apply( type === 'save'
			? S.choose( { type: 'save', analytics: banner.querySelector( '[name="analytics"]' ).checked, embeds: banner.querySelector( '[name="embeds"]' ).checked }, Date.now() )
			: S.choose( { type: type }, Date.now() ) );
		hideBanner();
	} );

	document.addEventListener( 'change', function ( event ) {
		const box = event.target.closest( '[data-ecm-consent-controls] input[type="checkbox"]' );
		if ( ! box ) {
			return;
		}
		const root = box.closest( '[data-ecm-consent-controls]' );
		apply( S.choose( { type: 'save', analytics: root.querySelector( '[name="analytics"]' ).checked, embeds: root.querySelector( '[name="embeds"]' ).checked }, Date.now() ) );
		if ( banner ) {
			banner.hidden = true;
		}
	} );

	if ( banner ) {
		banner.addEventListener( 'keydown', function ( event ) {
			if ( event.key === 'Escape' && state ) {
				hideBanner();
			}
		} );
	}

	window.addEventListener( 'storage', function ( event ) {
		if ( event.key !== S.KEY && event.key !== null ) {
			return; // Another key changed. A null key means another tab called localStorage.clear().
		}
		const before = state;
		state = S.parse( event.key === null ? null : event.newValue, null, Date.now() );
		if ( S.withdrewAnalytics( before, state ) ) {
			clearAnalytics();
		}
		sync();
		window.dispatchEvent( new CustomEvent( EVENT, { detail: state } ) );
		if ( ! state ) {
			showBanner( false );
		}
	} );

	document.querySelectorAll( '[data-ecm-embed-load]' ).forEach( function ( button ) {
		button.disabled = false;
	} );
	sync();
	if ( ! state ) {
		showBanner( false );
	}
	window.ecmConsent = {
		get: function () {
			return state;
		},
		open: function () {
			showBanner( true );
		},
	};
} )();
