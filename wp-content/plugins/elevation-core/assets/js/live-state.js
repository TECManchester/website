/** The live-status answer from /wp-json/elevation/v1/live — pure, shared by live-status.js and the node tests. */
( function ( root, factory ) {
	const api = factory();
	if ( typeof module === 'object' && module.exports ) {
		module.exports = api;
	} else {
		root.ecmLiveState = api;
	}
} )( typeof self !== 'undefined' ? self : this, function () {
	const STATES = [ 'live', 'upcoming', 'none' ];

	function parse( json ) {
		if ( ! json || typeof json !== 'object' || STATES.indexOf( json.state ) === -1 || ! json.blocks || typeof json.blocks !== 'object' || Array.isArray( json.blocks ) ) {
			return null;
		}
		const blocks = {};
		Object.keys( json.blocks ).forEach( function ( name ) {
			if ( typeof json.blocks[ name ] === 'string' ) {
				blocks[ name ] = json.blocks[ name ];
			}
		} );
		return { state: json.state, blocks: blocks };
	}

	function needsSwap( current, next ) {
		return !! next && next.state !== current && Object.keys( next.blocks ).length > 0;
	}

	return { parse: parse, needsSwap: needsSwap };
} );
