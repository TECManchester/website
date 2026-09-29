/** Settings → Church: pick a hero slide image from the Media Library. */
( function () {
	document.querySelectorAll( '.elevation-slide' ).forEach( function ( row ) {
		const input = row.querySelector( '.elevation-slide__id' );
		const preview = row.querySelector( '.elevation-slide__preview' );
		const remove = row.querySelector( '.elevation-slide__remove' );
		let frame = null;
		row.querySelector( '.elevation-slide__choose' ).addEventListener( 'click', function () {
			frame = frame || wp.media( { title: 'Choose a slideshow photo', library: { type: 'image' }, multiple: false, button: { text: 'Use this photo' } } );
			frame.off( 'select' ).on( 'select', function () {
				const image = frame.state().get( 'selection' ).first().toJSON();
				input.value = String( image.id );
				preview.src = ( image.sizes && image.sizes.medium ? image.sizes.medium : image ).url;
				preview.hidden = false;
				remove.hidden = false;
			} );
			frame.open();
		} );
		remove.addEventListener( 'click', function () {
			input.value = '';
			preview.hidden = true;
			remove.hidden = true;
		} );
	} );
} )();
