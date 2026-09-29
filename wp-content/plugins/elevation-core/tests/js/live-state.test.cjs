const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const L = require( '../../assets/js/live-state.js' );

test( 'a well-formed answer is kept, with only string blocks', () => {
	assert.deepEqual( L.parse( { state: 'live', blocks: { 'elevation/watch-hero': '<section></section>', bad: 3 } } ), { state: 'live', blocks: { 'elevation/watch-hero': '<section></section>' } } );
} );

test( 'anything else is no answer', () => {
	for ( const bad of [ null, 'live', {}, { state: 'LIVE', blocks: {} }, { state: 'live' }, { state: 'live', blocks: [] } ] ) {
		assert.equal( L.parse( bad ), null );
	}
} );

test( 'swap only when the state changed and there is something to swap in', () => {
	const next = L.parse( { state: 'live', blocks: { 'elevation/home-watch': '<div></div>' } } );
	assert.equal( L.needsSwap( 'none', next ), true );
	assert.equal( L.needsSwap( 'live', next ), false );
	assert.equal( L.needsSwap( 'none', null ), false );
	assert.equal( L.needsSwap( 'none', L.parse( { state: 'live', blocks: {} } ) ), false );
} );
