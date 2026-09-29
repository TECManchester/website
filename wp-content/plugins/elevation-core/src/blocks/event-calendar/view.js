/**
 * Draws the events calendar from the server's London date keys (render.php). All text goes in through
 * textContent, never innerHTML, so event titles can't inject markup.
 */
import model from './model.js';

const { isMonth, monthCells, shiftMonth, groupByDate, londonDateKey, monthLabel } = model;
const dayName = new Intl.DateTimeFormat( 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' } );

function el( tag, className, text ) {
	const node = document.createElement( tag );
	if ( className ) {
		node.className = className;
	}
	if ( text !== undefined ) {
		node.textContent = text;
	}
	return node;
}

document.querySelectorAll( '.wp-block-elevation-event-calendar' ).forEach( ( root ) => {
	let items = [];
	try {
		items = JSON.parse( root.dataset.events || '[]' );
	} catch ( e ) {
		items = [];
	}
	const byDate = groupByDate( Array.isArray( items ) ? items : [] );
	const today = londonDateKey( new Date() );
	let month = isMonth( root.dataset.month ) ? root.dataset.month : today.slice( 0, 7 );
	let selected = null;

	const card = root.querySelector( '.event-calendar' );
	const title = root.querySelector( '.event-calendar__title' );
	const grid = root.querySelector( '.event-calendar__grid' );
	const list = root.querySelector( '.event-calendar__list' );

	function renderList() {
		const events = selected ? byDate.get( selected ) || [] : [];
		list.replaceChildren(
			...events.map( ( event ) => {
				const li = el( 'li' );
				const a = el( 'a', 'event-calendar__event' );
				a.href = event.url;
				a.append( el( 'span', 'event-calendar__event-title', event.title ), el( 'span', 'event-calendar__event-time', event.time ) );
				li.append( a );
				return li;
			} )
		);
		list.hidden = events.length === 0;
	}

	function render( focusDate ) {
		title.textContent = monthLabel( month );
		grid.replaceChildren(
			...monthCells( month ).map( ( key ) => {
				const cell = el( 'div', 'event-calendar__cell' );
				if ( ! key ) {
					return cell;
				}
				const day = String( Number( key.slice( -2 ) ) );
				const events = byDate.get( key ) || [];
				const inner = events.length ? el( 'button', 'event-calendar__day has-events', day ) : el( 'span', 'event-calendar__day', day );
				if ( events.length ) {
					inner.type = 'button';
					inner.dataset.date = key;
					inner.setAttribute( 'aria-pressed', String( key === selected ) );
					inner.setAttribute( 'aria-label', `${ dayName.format( new Date( `${ key }T12:00:00Z` ) ) }: ${ events.length } event${ events.length > 1 ? 's' : '' }` );
					inner.addEventListener( 'click', () => {
						selected = selected === key ? null : key;
						render( key );
					} );
				}
				if ( key === today ) {
					inner.classList.add( 'is-today' );
					inner.setAttribute( 'aria-current', 'date' );
				}
				if ( key === selected ) {
					inner.classList.add( 'is-selected' );
				}
				cell.append( inner );
				return cell;
			} )
		);
		renderList();
		if ( focusDate ) {
			grid.querySelector( `[data-date="${ focusDate }"]` )?.focus();
		}
	}

	root.querySelectorAll( '.event-calendar__step' ).forEach( ( button ) => {
		button.addEventListener( 'click', () => {
			month = shiftMonth( month, Number( button.dataset.step ) );
			selected = null;
			render();
		} );
	} );

	card.hidden = false;
	root.querySelector( '.event-calendar__caption' ).hidden = false;
	render();
} );
