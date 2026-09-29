/**
 * The site-wide announcement modal (spec §6.5; redesign announcement-modal.tsx). Asks the no-store endpoint
 * on each page view, then decides here with the browser's clock and the stored dismissal. Every way of
 * closing it (Escape, the backdrop, ×, "Not now", the button) counts as a dismissal.
 */
( function () {
	const config = window.ecmAnnouncement;
	const S = window.ecmAnnouncementState;
	if ( ! config || ! S || typeof fetch !== 'function' || typeof HTMLDialogElement === 'undefined' ) {
		return;
	}
	const store = S.store( () => window.localStorage );

	fetch( config.endpoint, { cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' } } )
		.then( ( response ) => ( response.ok ? response.json() : null ) )
		.then( ( json ) => {
			const a = S.parse( json );
			if ( a && S.shouldShow( a, store.get( S.storageKey( a ) ), Date.now() ) ) {
				open( a );
			}
		} )
		.catch( () => {} );

	function el( tag, className, text ) {
		const node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		if ( text ) {
			node.textContent = text;
		}
		return node;
	}

	function open( a ) {
		const key = S.storageKey( a );
		const dialog = el( 'dialog', 'ecm-announcement' );
		dialog.setAttribute( 'aria-labelledby', 'ecm-announcement-title' );
		const card = el( 'div', 'ecm-announcement__card' );
		if ( a.image ) {
			const media = el( 'div', 'ecm-announcement__media' );
			const img = el( 'img' );
			img.src = a.image.src;
			img.alt = '';
			img.width = a.image.width;
			img.height = a.image.height;
			media.appendChild( img );
			card.appendChild( media );
		}
		const body = el( 'div', 'ecm-announcement__body' );
		const title = el( 'h2', 'ecm-announcement__title', a.title );
		title.id = 'ecm-announcement-title';
		const text = el( 'div', 'ecm-announcement__text' );
		text.innerHTML = a.body; // wp_kses_post'd on the server, written by staff.
		const actions = el( 'div', 'ecm-announcement__actions' );
		if ( a.ctaUrl ) {
			const wrap = el( 'div', 'wp-block-button' );
			const link = el( 'a', 'wp-block-button__link wp-element-button', a.ctaLabel );
			link.href = a.ctaUrl;
			link.addEventListener( 'click', () => {
				// Close the dialog so an on-page anchor leaves no modal open with scroll locked. The 'close' event is
				// queued, so a link that navigates away could beat it: record the dismissal now as well.
				store.set( key, Date.now() );
				dialog.close();
			} );
			wrap.appendChild( link );
			actions.appendChild( wrap );
		}
		const later = el( 'div', 'wp-block-button is-style-ghost' );
		const laterButton = el( 'button', 'wp-block-button__link wp-element-button', 'Not now' );
		laterButton.type = 'button';
		laterButton.addEventListener( 'click', () => dialog.close() );
		later.appendChild( laterButton );
		actions.appendChild( later );
		body.append( title, text, actions );
		card.appendChild( body );
		const close = el( 'button', 'ecm-announcement__close' );
		close.type = 'button';
		close.setAttribute( 'aria-label', 'Close announcement' );
		close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
		close.addEventListener( 'click', () => dialog.close() );
		dialog.append( card, close );

		dialog.addEventListener( 'click', ( event ) => {
			if ( event.target === dialog ) {
				dialog.close(); // a click on the backdrop
			}
		} );
		dialog.addEventListener( 'close', () => {
			store.set( key, Date.now() );
			document.documentElement.classList.remove( 'has-announcement' );
			dialog.remove();
		} );
		window.addEventListener( 'storage', ( event ) => {
			if ( event.key === key && event.newValue && dialog.open ) {
				dialog.close(); // dismissed in another tab
			}
		} );

		document.body.appendChild( dialog );
		document.documentElement.classList.add( 'has-announcement' );
		dialog.showModal();
	}
} )();
