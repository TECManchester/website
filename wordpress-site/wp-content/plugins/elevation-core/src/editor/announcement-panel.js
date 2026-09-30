/** "Announcement settings" for announcements: on/off, dates, button and how long "close" hides it. Mirrors Announcement::errors(). */
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { TextControl, ToggleControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

function firstError( m ) {
	const starts = ( m.announcement_starts || '' ).trim();
	const ends = ( m.announcement_ends || '' ).trim();
	if ( starts && ends && ends <= starts ) {
		return 'The end must be after the start.';
	}
	const url = ( m.announcement_cta_url || '' ).trim();
	if ( url && ! ( /^https:\/\//i.test( url ) || ( url.charAt( 0 ) === '/' && url.charAt( 1 ) !== '/' ) ) ) {
		return 'The button link must start with https:// or with / for a page on this site.';
	}
	const hours = m.announcement_dismiss_hours;
	if ( ! Number.isInteger( hours ) || hours < 1 || hours > 720 ) {
		return '"Hide for" must be a whole number of hours from 1 to 720.';
	}
	return '';
}

function Fields() {
	const [ meta, setMeta ] = useEntityProp( 'postType', 'announcement', 'meta' );
	const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
	const m = { announcement_dismiss_hours: 24, ...( meta || {} ) };
	const set = ( key ) => ( value ) => setMeta( { ...( meta || {} ), [ key ]: value } );
	const error = firstError( m );

	useEffect( () => {
		( error ? lockPostSaving : unlockPostSaving )( 'elevation-announcement' );
		return () => unlockPostSaving( 'elevation-announcement' );
	}, [ error, lockPostSaving, unlockPostSaving ] );

	return (
		<PluginDocumentSettingPanel name="elevation-announcement" title="Announcement settings" initialOpen>
			<ToggleControl
				label="Show this announcement"
				help="Only one announcement shows at a time: switching this on switches the others off."
				checked={ !! m.announcement_active }
				onChange={ set( 'announcement_active' ) }
			/>
			<TextControl label="Start showing" type="datetime-local" value={ m.announcement_starts || '' } onChange={ set( 'announcement_starts' ) } />
			<TextControl label="Stop showing" type="datetime-local" help="UK time. Leave blank to start now or keep showing." value={ m.announcement_ends || '' } onChange={ set( 'announcement_ends' ) } />
			<TextControl label="Button text" help={ 'Leave blank for "Find out more".' } value={ m.announcement_cta_label || '' } onChange={ set( 'announcement_cta_label' ) } />
			<TextControl label="Button link" help="https://… or a page on this site, like /im-new." value={ m.announcement_cta_url || '' } onChange={ set( 'announcement_cta_url' ) } />
			<TextControl
				label="Hide for (hours) after someone closes it"
				type="number"
				min={ 1 }
				max={ 720 }
				value={ m.announcement_dismiss_hours }
				onChange={ ( value ) => set( 'announcement_dismiss_hours' )( parseInt( value, 10 ) ) }
			/>
			{ error && <p style={ { color: '#CC3B3B', marginTop: -8 } }>{ error }</p> }
		</PluginDocumentSettingPanel>
	);
}

function AnnouncementPanel() {
	const type = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostType(), [] );
	return type === 'announcement' ? <Fields /> : null;
}

registerPlugin( 'elevation-announcement-panel', { render: AnnouncementPanel } );
