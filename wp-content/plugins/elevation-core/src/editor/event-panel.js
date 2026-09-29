/**
 * "Event details" in the event editor's sidebar: when it starts and ends, whether the time is still
 * to be confirmed, where it is, and an optional button. The server refuses a publish with a missing
 * start, an end before the start or a bad link (includes/events.php); this panel says so first.
 */
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel, store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
import { BaseControl, Button, DateTimePicker, Dropdown, Notice, TextControl, ToggleControl } from '@wordpress/components';

const LOCK = 'elevation-event-details';
const DEFAULT_VENUE = ( window.elevationEventDefaults || {} ).venue || '';
const toMinutes = ( value ) => ( value ? String( value ).slice( 0, 16 ) : '' );
const okUrl = ( url ) => url === '' || ( /^\/(?!\/)/.test( url ) && ! url.includes( '\\' ) ) || /^https:\/\/[a-z0-9.-]+(:\d+)?([/?#]\S*)?$/i.test( url );
const label = ( value ) =>
	value
		? new Intl.DateTimeFormat( 'en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' } ).format( new Date( `${ value }:00Z` ) )
		: 'Not set';

function WhenControl( { title, value, onChange, allowClear } ) {
	return (
		<BaseControl label={ title } __nextHasNoMarginBottom>
			<Dropdown
				popoverProps={ { placement: 'left-start' } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button variant="secondary" onClick={ onToggle } aria-expanded={ isOpen } style={ { display: 'block', width: '100%', textAlign: 'left' } }>
						{ label( value ) }
					</Button>
				) }
				renderContent={ () => (
					<div style={ { padding: 8 } }>
						<DateTimePicker currentDate={ value || null } onChange={ ( next ) => onChange( toMinutes( next ) ) } is12Hour />
						{ allowClear && value && (
							<Button variant="link" isDestructive onClick={ () => onChange( '' ) }>
								Remove end
							</Button>
						) }
					</div>
				) }
			/>
		</BaseControl>
	);
}

function EventDetailsPanel() {
	const postType = useSelect( ( select ) => select( editorStore ).getCurrentPostType(), [] );
	const [ meta, setMeta ] = useEntityProp( 'postType', 'event', 'meta' );
	const { lockPostSaving, unlockPostSaving } = useDispatch( editorStore );
	const m = meta || {};
	const set = ( key ) => ( value ) => setMeta( { ...m, [ key ]: value } );

	const start = toMinutes( m.event_start );
	const end = toMinutes( m.event_end );
	const url = ( m.event_cta_url || '' ).trim();
	const problems = [];
	if ( start && end && end < start ) {
		problems.push( 'The end must be the same as or after the start.' );
	}
	if ( ! okUrl( url ) ) {
		problems.push( 'The button link must start with https:// or with / for a page on this site.' );
	}
	const blocked = problems.length > 0;

	useEffect( () => {
		if ( 'event' !== postType ) {
			return undefined;
		}
		blocked ? lockPostSaving( LOCK ) : unlockPostSaving( LOCK );
		return () => unlockPostSaving( LOCK );
	}, [ postType, blocked ] );

	if ( 'event' !== postType ) {
		return null;
	}
	return (
		<PluginDocumentSettingPanel name="elevation-event-details" title="Event details" initialOpen>
			{ ! start && <Notice status="warning" isDismissible={ false }>Add a start date and time before publishing.</Notice> }
			{ problems.map( ( p ) => (
				<Notice key={ p } status="error" isDismissible={ false }>{ p }</Notice>
			) ) }
			<WhenControl title="Starts" value={ start } onChange={ set( 'event_start' ) } />
			<WhenControl title="Ends (optional; can be another day)" value={ end } onChange={ set( 'event_end' ) } allowClear />
			<ToggleControl
				__nextHasNoMarginBottom
				label="Time to be confirmed"
				help="Shows “Time to be confirmed” instead of the times. The date is still used."
				checked={ !! m.event_time_tbc }
				onChange={ set( 'event_time_tbc' ) }
			/>
			<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label="Venue" help="Leave empty for our usual venue." placeholder={ DEFAULT_VENUE } value={ m.event_venue || '' } onChange={ set( 'event_venue' ) } />
			<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label="Button label" placeholder="Register" value={ m.event_cta_label || '' } onChange={ set( 'event_cta_label' ) } />
			<TextControl __nextHasNoMarginBottom __next40pxDefaultSize label="Button link" help="https://… or /page-on-this-site. Leave empty for no button." value={ m.event_cta_url || '' } onChange={ set( 'event_cta_url' ) } />
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'elevation-event-details', { render: EventDetailsPanel } );
