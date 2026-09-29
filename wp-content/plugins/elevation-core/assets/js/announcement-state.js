/** The announcement answer and the dismissal rule (spec §6.5) — pure, shared by announcement.js and the node tests. */
( function ( root, factory ) {
	const api = factory();
	if ( typeof module === 'object' && module.exports ) {
		module.exports = api;
	} else {
		root.ecmAnnouncementState = api;
	}
} )( typeof self !== 'undefined' ? self : this, function () {
	const HOUR = 3600000;

	function hours( value ) {
		const n = Number( value );
		return Number.isInteger( n ) && n >= 1 && n <= 720 ? n : 24;
	}

	function safeUrl( url ) {
		return typeof url === 'string' && ( /^https:\/\//i.test( url ) || ( url.charAt( 0 ) === '/' && url.charAt( 1 ) !== '/' ) ) ? url : '';
	}

	function parse( json ) {
		const a = json && json.announcement;
		if ( ! a || typeof a !== 'object' || ! Number.isInteger( a.id ) || ! Number.isInteger( a.version ) || typeof a.title !== 'string' ) {
			return null;
		}
		return {
			id: a.id,
			version: a.version,
			title: a.title,
			body: typeof a.body === 'string' ? a.body : '',
			image: a.image && typeof a.image.src === 'string' ? a.image : null,
			ctaLabel: typeof a.ctaLabel === 'string' && a.ctaLabel.trim() ? a.ctaLabel : 'Find out more',
			ctaUrl: safeUrl( a.ctaUrl ),
			dismissHours: hours( a.dismissHours ),
			startsAt: typeof a.startsAt === 'string' ? a.startsAt : null,
			endsAt: typeof a.endsAt === 'string' ? a.endsAt : null,
		};
	}

	function storageKey( a ) {
		return 'ecm-announcement-' + a.id + '-' + a.version;
	}

	function inWindow( a, nowMs ) {
		const start = a.startsAt ? Date.parse( a.startsAt ) : NaN;
		const end = a.endsAt ? Date.parse( a.endsAt ) : NaN;
		return ( isNaN( start ) || nowMs >= start ) && ( isNaN( end ) || nowMs < end );
	}

	/** As the redesign: show unless dismissed less than dismissHours ago. */
	function shouldShow( a, stored, nowMs ) {
		if ( ! a || ! inWindow( a, nowMs ) ) {
			return false;
		}
		const at = Number( stored );
		if ( stored === null || stored === undefined || stored === '' || ! Number.isFinite( at ) ) {
			return true;
		}
		return nowMs - at > a.dismissHours * HOUR;
	}

	/** localStorage when it works; memory for this page view when it throws (private mode, blocked storage). */
	function store( getStorage ) {
		const memory = {};
		return {
			get( key ) {
				try {
					const s = getStorage();
					if ( s ) {
						return s.getItem( key );
					}
				} catch ( e ) {}
				return Object.prototype.hasOwnProperty.call( memory, key ) ? memory[ key ] : null;
			},
			set( key, value ) {
				memory[ key ] = String( value );
				try {
					const s = getStorage();
					if ( s ) {
						s.setItem( key, String( value ) );
					}
				} catch ( e ) {}
			},
		};
	}

	return { parse, storageKey, inWindow, shouldShow, store };
} );
