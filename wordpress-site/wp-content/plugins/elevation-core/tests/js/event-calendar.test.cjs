const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const M = require( '../../src/blocks/event-calendar/model.js' );

test( 'months start on Monday with blank leading cells', () => {
	const oct = M.monthCells( '2026-10' ); // 1 Oct 2026 is a Thursday
	assert.deepEqual( oct.slice( 0, 4 ), [ null, null, null, '2026-10-01' ] );
	assert.equal( oct.at( -1 ), '2026-10-31' );
	assert.equal( oct.length, 3 + 31 );
	const feb = M.monthCells( '2027-02' ); // 1 Feb 2027 is a Monday
	assert.equal( feb[ 0 ], '2027-02-01' );
	assert.equal( feb.length, 28 );
	assert.equal( M.monthCells( '2026-11' )[ 6 ], '2026-11-01' ); // a Sunday: six blanks first
	assert.equal( M.monthCells( '2028-02' ).at( -1 ), '2028-02-29' );
} );

test( 'shifting months crosses years', () => {
	assert.equal( M.shiftMonth( '2026-12', 1 ), '2027-01' );
	assert.equal( M.shiftMonth( '2026-01', -1 ), '2025-12' );
	assert.equal( M.shiftMonth( '2026-10', 0 ), '2026-10' );
} );

test( 'events group by date, keeping order', () => {
	const map = M.groupByDate( [ { date: '2026-10-18', title: 'A' }, { date: '2026-10-19', title: 'B' }, { date: '2026-10-18', title: 'C' } ] );
	assert.deepEqual( map.get( '2026-10-18' ).map( ( e ) => e.title ), [ 'A', 'C' ] );
	assert.equal( map.get( '2026-10-20' ), undefined );
} );

test( 'today is London’s date for visitors anywhere', () => {
	// 01:30 UTC on 26 Oct 2026 = 01:30 GMT on the 26th in London (clocks went back on the 25th), but 21:30 on the 25th in New York.
	assert.equal( M.londonDateKey( new Date( '2026-10-26T01:30:00Z' ) ), '2026-10-26' );
	// 23:30 UTC on 30 Jun = 00:30 BST on 1 Jul in London, still 30 Jun in New York.
	assert.equal( M.londonDateKey( new Date( '2026-06-30T23:30:00Z' ) ), '2026-07-01' );
} );

test( 'month labels and month validation', () => {
	assert.equal( M.monthLabel( '2026-10' ), 'October 2026' );
	assert.equal( M.isMonth( '2026-10' ), true );
	for ( const bad of [ '', '2026-13', '2026-1', 'October', undefined ] ) {
		assert.equal( M.isMonth( bad ), false, String( bad ) );
	}
} );
