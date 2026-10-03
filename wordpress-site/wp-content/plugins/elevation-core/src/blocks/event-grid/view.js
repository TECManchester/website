/**
 * Events page (the grid with showPast): when the events calendar announces a picked date
 * (elevation:event-date), show only the cards on that date, past ones included, with a bar saying so and a
 * way back to the upcoming list. Without the calendar, or without JS, the page is the upcoming list.
 */
import model from '../event-calendar/model.js';

const { londonDateKey } = model;
const dayName = new Intl.DateTimeFormat( 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } );

document.querySelectorAll( '.wp-block-elevation-event-grid.event-grid-wrap' ).forEach( ( wrap ) => {
	const grid = wrap.querySelector( '.event-grid' );
	const empty = wrap.querySelector( '.event-grid__empty' );
	const bar = wrap.querySelector( '.events-filter' );
	const text = wrap.querySelector( '.events-filter__text' );
	const reset = wrap.querySelector( '.events-filter__reset' );
	if ( ! grid || ! bar || ! text || ! reset ) {
		return;
	}
	const heading = document.getElementById( 'events-heading' );
	const eyebrow = document.querySelector( '.events-eyebrow' );
	const original = { heading: heading?.textContent, eyebrow: eyebrow?.textContent };
	const cards = [ ...grid.querySelectorAll( '.event-card' ) ];
	const hasUpcoming = cards.some( ( card ) => ! card.classList.contains( 'is-past' ) );

	function show( card, on ) {
		card.hidden = ! on;
		if ( on ) {
			card.classList.add( 'is-visible' ); // Skip the scroll-reveal fade for cards appearing by filter.
		}
	}

	function setHeading( title, kicker ) {
		if ( heading ) {
			heading.textContent = title;
		}
		if ( eyebrow ) {
			eyebrow.textContent = kicker;
		}
	}

	function apply( date ) {
		if ( ! date ) {
			cards.forEach( ( card ) => show( card, ! card.classList.contains( 'is-past' ) ) );
			grid.hidden = ! hasUpcoming;
			if ( empty ) {
				empty.hidden = hasUpcoming;
			}
			bar.hidden = true;
			setHeading( original.heading, original.eyebrow );
			return;
		}
		let shown = 0;
		cards.forEach( ( card ) => {
			const on = ( card.dataset.dates || '' ).split( ',' ).includes( date );
			show( card, on );
			shown += on ? 1 : 0;
		} );
		const label = dayName.format( new Date( `${ date }T12:00:00Z` ) );
		grid.hidden = shown === 0;
		if ( empty ) {
			empty.hidden = true;
		}
		text.textContent = shown ? `${ shown } event${ shown > 1 ? 's' : '' } on ${ label }` : `Nothing on ${ label }`;
		bar.hidden = false;
		setHeading( label, date < londonDateKey( new Date() ) ? 'Looking back' : 'On this date' );
	}

	document.addEventListener( 'elevation:event-date', ( event ) => {
		const date = event.detail?.date || null;
		apply( date );
		// On narrow screens the calendar sits below the list, so bring the filtered list into view.
		if ( date && window.matchMedia( '(max-width: 1023px)' ).matches ) {
			( heading || wrap ).scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}
	} );

	reset.addEventListener( 'click', () => {
		apply( null );
		document.dispatchEvent( new CustomEvent( 'elevation:event-date-clear' ) );
	} );
} );
