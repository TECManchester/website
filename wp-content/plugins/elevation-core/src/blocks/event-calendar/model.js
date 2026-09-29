/**
 * Calendar maths on "YYYY-MM-DD" strings. Pure; used by view.js and tests/js/event-calendar.test.cjs.
 * Event dates arrive as strings computed on the server in London time: doing date maths on Date objects
 * in the browser would move events across midnight for visitors in other timezones.
 */
const pad = ( n ) => String( n ).padStart( 2, '0' );
const parts = ( month ) => month.split( '-' ).map( Number );

function isMonth( value ) {
	return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test( value );
}

/** Cells for a Monday-first month grid: null for leading blanks, then each date. */
function monthCells( month ) {
	const [ y, m ] = parts( month );
	const lead = ( new Date( Date.UTC( y, m - 1, 1 ) ).getUTCDay() + 6 ) % 7;
	const days = new Date( Date.UTC( y, m, 0 ) ).getUTCDate();
	const cells = Array( lead ).fill( null );
	for ( let d = 1; d <= days; d++ ) {
		cells.push( `${ y }-${ pad( m ) }-${ pad( d ) }` );
	}
	return cells;
}

function shiftMonth( month, delta ) {
	const [ y, m ] = parts( month );
	const d = new Date( Date.UTC( y, m - 1 + delta, 1 ) );
	return `${ d.getUTCFullYear() }-${ pad( d.getUTCMonth() + 1 ) }`;
}

function groupByDate( items ) {
	const map = new Map();
	for ( const item of items ) {
		if ( ! map.has( item.date ) ) {
			map.set( item.date, [] );
		}
		map.get( item.date ).push( item );
	}
	return map;
}

function londonDateKey( date ) {
	return new Intl.DateTimeFormat( 'en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/London' } ).format( date );
}

function monthLabel( month ) {
	const [ y, m ] = parts( month );
	return new Intl.DateTimeFormat( 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' } ).format( new Date( Date.UTC( y, m - 1, 1 ) ) );
}

module.exports = { isMonth, monthCells, shiftMonth, groupByDate, londonDateKey, monthLabel };
