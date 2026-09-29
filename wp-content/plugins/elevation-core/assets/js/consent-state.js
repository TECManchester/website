/**
 * The consent record — pure functions shared by the browser runtime (consent.js) and the node tests.
 * Stored in localStorage "ecm.consent" as { analytics, embeds, version, ts }.
 */
( function ( root, factory ) {
	const api = factory();
	if ( typeof module === 'object' && module.exports ) {
		module.exports = api;
	} else {
		root.ecmConsentState = api;
	}
} )( typeof self !== 'undefined' ? self : this, function () {
	const VERSION = 1;
	const KEY = 'ecm.consent';
	const LEGACY_KEY = 'ecm.consent.embeds';

	function record( analytics, embeds, now ) {
		return { analytics: analytics, embeds: embeds, version: VERSION, ts: now };
	}

	function parseRecord( raw ) {
		if ( typeof raw !== 'string' ) {
			return null;
		}
		try {
			const value = JSON.parse( raw );
			if ( value && value.version === VERSION && typeof value.analytics === 'boolean' && typeof value.embeds === 'boolean' ) {
				return record( value.analytics, value.embeds, Number( value.ts ) || 0 );
			}
		} catch ( e ) {}
		return null;
	}

	/** The visitor's choice, or null for "not chosen". legacyRaw is the redesign's embeds-only key. */
	function parse( raw, legacyRaw, now ) {
		const current = parseRecord( raw );
		if ( current ) {
			return current;
		}
		if ( legacyRaw === 'granted' || legacyRaw === 'declined' ) {
			return record( false, legacyRaw === 'granted', now );
		}
		return null;
	}

	function choose( action, now ) {
		switch ( action.type ) {
			case 'acceptAll':
				return record( true, true, now );
			case 'rejectAll':
				return record( false, false, now );
			case 'save':
				return record( !! action.analytics, !! action.embeds, now );
			case 'clear':
				return null;
		}
		throw new Error( 'Unknown consent action: ' + action.type );
	}

	function serialise( state ) {
		return JSON.stringify( state );
	}

	function withdrewAnalytics( before, after ) {
		return !! ( before && before.analytics ) && ! ( after && after.analytics );
	}

	/** Names of the GA cookies (_ga, _ga_<id>, _gat) present in a document.cookie string. */
	function gaCookieNames( cookieString ) {
		return String( cookieString || '' )
			.split( ';' )
			.map( function ( part ) {
				return part.split( '=' )[ 0 ].trim();
			} )
			.filter( function ( name ) {
				return /^_ga/.test( name );
			} );
	}

	/** Domains a cookie for this host may have been set on: host-only (''), then each parent. */
	function cookieDomains( hostname ) {
		const parts = String( hostname ).split( '.' );
		const out = [ '' ];
		for ( let i = 0; i < parts.length - 1; i++ ) {
			out.push( '.' + parts.slice( i ).join( '.' ) );
		}
		return out;
	}

	return { VERSION, KEY, LEGACY_KEY, parse, choose, serialise, withdrewAnalytics, gaCookieNames, cookieDomains };
} );
