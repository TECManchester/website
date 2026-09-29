const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const A = require( '../../assets/js/announcement-state.js' );

const HOUR = 3600000;
const answer = ( extra = {} ) => ( { announcement: { id: 7, version: 1759650000, title: 'Harvest', body: '<p>Hi</p>', image: null, ctaLabel: '', ctaUrl: '/im-new', dismissHours: 24, startsAt: null, endsAt: null, ...extra } } );

test( 'parse keeps a well-formed answer and fills the defaults', () => {
	const a = A.parse( answer() );
	assert.equal( a.ctaLabel, 'Find out more' );
	assert.equal( a.dismissHours, 24 );
	assert.equal( A.storageKey( a ), 'ecm-announcement-7-1759650000' );
} );

test( 'parse refuses anything else, and unsafe links', () => {
	for ( const bad of [ null, {}, { announcement: null }, { announcement: { id: '7', version: 1, title: 'x' } }, { announcement: { id: 7, version: 1 } } ] ) {
		assert.equal( A.parse( bad ), null );
	}
	assert.equal( A.parse( answer( { ctaUrl: 'javascript:alert(1)' } ) ).ctaUrl, '' );
	assert.equal( A.parse( answer( { ctaUrl: '//evil.example' } ) ).ctaUrl, '' );
	assert.equal( A.parse( answer( { dismissHours: 9999 } ) ).dismissHours, 24 );
} );

test( 'the browser re-checks the window with its own clock', () => {
	const now = Date.parse( '2026-10-05T09:30:00+01:00' );
	assert.equal( A.shouldShow( A.parse( answer( { startsAt: '2026-10-05T10:00:00+01:00' } ) ), null, now ), false );
	assert.equal( A.shouldShow( A.parse( answer( { endsAt: '2026-10-05T09:00:00+01:00' } ) ), null, now ), false );
	assert.equal( A.shouldShow( A.parse( answer( { startsAt: '2026-10-05T09:00:00+01:00', endsAt: '2026-10-06T09:00:00+01:00' } ) ), null, now ), true );
} );

test( 'a dismissal hides it for dismissHours, then it shows again', () => {
	const a = A.parse( answer( { dismissHours: 2 } ) );
	const now = 10 * HOUR;
	assert.equal( A.shouldShow( a, null, now ), true );
	assert.equal( A.shouldShow( a, String( now - HOUR ), now ), false );
	assert.equal( A.shouldShow( a, String( now - 2 * HOUR ), now ), false );
	assert.equal( A.shouldShow( a, String( now - 2 * HOUR - 1 ), now ), true );
	assert.equal( A.shouldShow( a, 'garbage', now ), true );
} );

test( 'the store falls back to memory when storage throws or is missing', () => {
	const throwing = A.store( () => {
		throw new Error( 'SecurityError' );
	} );
	assert.equal( throwing.get( 'k' ), null );
	throwing.set( 'k', 5 );
	assert.equal( throwing.get( 'k' ), '5' );
	const missing = A.store( () => null );
	missing.set( 'k', 'v' );
	assert.equal( missing.get( 'k' ), 'v' );
	const data = {};
	const real = A.store( () => ( { getItem: ( k ) => ( k in data ? data[ k ] : null ), setItem: ( k, v ) => ( data[ k ] = v ) } ) );
	real.set( 'k', 1 );
	assert.equal( data.k, '1' );
	assert.equal( real.get( 'k' ), '1' );
} );
