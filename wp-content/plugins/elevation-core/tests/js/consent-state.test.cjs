const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const S = require( '../../assets/js/consent-state.js' );

const NOW = 1_780_000_000_000;
const record = ( analytics, embeds, ts = 5 ) => JSON.stringify( { analytics, embeds, version: 1, ts } );

test( 'no stored choice is null', () => {
	assert.equal( S.parse( null, null, NOW ), null );
} );

test( 'a valid record is read back', () => {
	assert.deepEqual( S.parse( record( true, false ), null, NOW ), { analytics: true, embeds: false, version: 1, ts: 5 } );
} );

test( 'corrupt, old-version or mistyped records are no choice', () => {
	assert.equal( S.parse( '{', null, NOW ), null );
	assert.equal( S.parse( JSON.stringify( { analytics: true, embeds: true, version: 0 } ), null, NOW ), null );
	assert.equal( S.parse( JSON.stringify( { analytics: 'yes', embeds: true, version: 1 } ), null, NOW ), null );
	assert.equal( S.parse( 'null', null, NOW ), null );
} );

test( 'the redesign legacy key migrates to embeds only, analytics off', () => {
	assert.deepEqual( S.parse( null, 'granted', NOW ), { analytics: false, embeds: true, version: 1, ts: NOW } );
	assert.deepEqual( S.parse( null, 'declined', NOW ), { analytics: false, embeds: false, version: 1, ts: NOW } );
	assert.equal( S.parse( null, 'maybe', NOW ), null );
} );

test( 'a current record wins over the legacy key', () => {
	assert.equal( S.parse( record( true, true ), 'declined', NOW ).embeds, true );
} );

test( 'choices', () => {
	assert.deepEqual( S.choose( { type: 'acceptAll' }, NOW ), { analytics: true, embeds: true, version: 1, ts: NOW } );
	assert.deepEqual( S.choose( { type: 'rejectAll' }, NOW ), { analytics: false, embeds: false, version: 1, ts: NOW } );
	assert.deepEqual( S.choose( { type: 'save', analytics: false, embeds: true }, NOW ), { analytics: false, embeds: true, version: 1, ts: NOW } );
	assert.equal( S.choose( { type: 'clear' }, NOW ), null );
	assert.throws( () => S.choose( { type: 'nope' }, NOW ) );
} );

test( 'withdrawing analytics is detected', () => {
	const on = { analytics: true, embeds: false };
	assert.equal( S.withdrewAnalytics( on, { analytics: false, embeds: true } ), true );
	assert.equal( S.withdrewAnalytics( on, null ), true );
	assert.equal( S.withdrewAnalytics( null, on ), false );
	assert.equal( S.withdrewAnalytics( { analytics: false }, null ), false );
} );

test( 'GA cookie names are found in document.cookie', () => {
	assert.deepEqual( S.gaCookieNames( '_ga=GA1.1; _ga_ABC123=GS1; _gid=x; theme=dark; _gat=1' ), [ '_ga', '_ga_ABC123', '_gat' ] );
	assert.deepEqual( S.gaCookieNames( '' ), [] );
} );

test( 'cookie domains cover host-only and each parent', () => {
	assert.deepEqual( S.cookieDomains( 'www.elevationmanchester.org' ), [ '', '.www.elevationmanchester.org', '.elevationmanchester.org' ] );
	assert.deepEqual( S.cookieDomains( 'localhost' ), [ '' ] );
} );
