/** "Group details" for Connect Groups: about, when it meets, where, and who gets "Ask to join" requests. */
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { CheckboxControl, SelectControl, TextControl, TextareaControl, ToggleControl, BaseControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

const DAYS = [ [ '', 'Not set yet' ], [ 'monday', 'Monday' ], [ 'tuesday', 'Tuesday' ], [ 'wednesday', 'Wednesday' ], [ 'thursday', 'Thursday' ], [ 'friday', 'Friday' ], [ 'saturday', 'Saturday' ], [ 'sunday', 'Sunday' ] ];
const FREQUENCIES = [ { value: 'weekly', label: 'Every week' }, { value: 'fortnightly', label: 'Every other week' } ];
const TYPES = [ { slug: 'geography-based', label: 'Geography-based' }, { slug: 'interest-based', label: 'Interest-based' } ];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INBOX = ( window.elevationGroupDefaults?.connectGroupInbox || '' ).trim();

const Heading = ( { children } ) => <h3 style={ { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', margin: '16px 0 8px', color: '#757575' } }>{ children }</h3>;

function Fields() {
	const [ meta, setMeta ] = useEntityProp( 'postType', 'connect_group', 'meta' );
	const [ excerpt, setExcerpt ] = useEntityProp( 'postType', 'connect_group', 'excerpt' );
	const [ types, setTypes ] = useEntityProp( 'postType', 'connect_group', 'group_category' );
	const [ areas, setAreas ] = useEntityProp( 'postType', 'connect_group', 'group_area' );
	const { typeTerms, areaTerms } = useSelect( ( select ) => ( {
		typeTerms: select( 'core' ).getEntityRecords( 'taxonomy', 'group_category', { per_page: -1 } ),
		areaTerms: select( 'core' ).getEntityRecords( 'taxonomy', 'group_area', { per_page: -1 } ),
	} ), [] );
	const { lockPostSaving, unlockPostSaving, removeEditorPanel } = useDispatch( 'core/editor' );
	const m = meta || {};
	const set = ( key ) => ( value ) => setMeta( { ...m, [ key ]: value } );

	// An empty stored email means "use the Connect Groups inbox", so show the inbox and store '' unless it differs.
	const stored = ( m.group_leader_email || '' ).trim();
	const shownEmail = stored !== '' ? stored : INBOX;
	const badEmail = stored !== '' && ! EMAIL.test( stored );
	const setEmail = ( value ) => setMeta( { ...m, group_leader_email: value.trim().toLowerCase() === INBOX.toLowerCase() ? '' : value } );

	useEffect( () => {
		removeEditorPanel( 'post-excerpt' );
		removeEditorPanel( 'taxonomy-panel-group_area' );
		removeEditorPanel( 'taxonomy-panel-group_category' );
	}, [ removeEditorPanel ] );
	useEffect( () => {
		( badEmail ? lockPostSaving : unlockPostSaving )( 'elevation-group' );
		return () => unlockPostSaving( 'elevation-group' );
	}, [ badEmail, lockPostSaving, unlockPostSaving ] );

	const typeOptions = [ { value: '', label: 'Choose a type' } ];
	for ( const t of TYPES ) {
		const term = ( typeTerms || [] ).find( ( x ) => x.slug === t.slug );
		if ( term ) {
			typeOptions.push( { value: String( term.id ), label: t.label } );
		}
	}
	const chosen = ( types || [] ).find( ( id ) => typeOptions.some( ( o ) => o.value === String( id ) ) );
	const sortedAreas = [ ...( areaTerms || [] ) ].sort( ( a, b ) => a.name.localeCompare( b.name ) );
	const toggleArea = ( id, on ) => setAreas( on ? [ ...( areas || [] ), id ] : ( areas || [] ).filter( ( x ) => x !== id ) );

	return (
		<PluginDocumentSettingPanel name="elevation-group" title="Group details" initialOpen>
			<Heading>About</Heading>
			<TextareaControl label="Description" help="One or two sentences shown on the group's card." value={ excerpt || '' } onChange={ setExcerpt } />
			<SelectControl
				label="Group type"
				help="Geography-based groups serve an area; interest-based groups are open to anyone, wherever they live."
				value={ chosen ? String( chosen ) : '' }
				options={ typeOptions }
				onChange={ ( value ) => setTypes( value ? [ Number( value ) ] : [] ) }
			/>
			<ToggleControl
				label="Taking new members"
				help={ m.group_accepting === false ? 'Off shows "Full right now, ask about the next one".' : 'On shows "Ask to join".' }
				checked={ m.group_accepting !== false }
				onChange={ set( 'group_accepting' ) }
			/>

			<Heading>When it meets</Heading>
			<SelectControl
				label="Meets on"
				help="Leave as 'Not set yet' to show 'Day and time to be confirmed'."
				value={ m.group_meeting_day || '' }
				options={ DAYS.map( ( [ value, label ] ) => ( { value, label } ) ) }
				onChange={ set( 'group_meeting_day' ) }
			/>
			<TextControl label="Time" type="time" help="Shown on the site as, for example, 8:00 pm." value={ m.group_meeting_time || '' } onChange={ set( 'group_meeting_time' ) } />
			<SelectControl
				label="How often"
				help="Every other week shows, for example, 'Every other Sunday'."
				value={ m.group_frequency === 'fortnightly' ? 'fortnightly' : 'weekly' }
				options={ FREQUENCIES }
				onChange={ set( 'group_frequency' ) }
			/>

			<Heading>Where</Heading>
			<BaseControl label="Areas" help="Used by the Area filter. Leave empty for interest-based groups.">
				{ sortedAreas.map( ( term ) => (
					<CheckboxControl key={ term.id } label={ term.name } checked={ ( areas || [] ).includes( term.id ) } onChange={ ( on ) => toggleArea( term.id, on ) } />
				) ) }
			</BaseControl>
			<TextareaControl label="Towns covered" help="One town per line. Used by the town search on the Connect Groups page." value={ m.group_towns || '' } onChange={ set( 'group_towns' ) } />

			<Heading>Leader and requests</Heading>
			<TextControl label="Leader's name" help="Only the first name is shown on the site." value={ m.group_leader_name || '' } onChange={ set( 'group_leader_name' ) } />
			<TextControl
				label="Ask to join email"
				type="email"
				help="Where this group's 'Ask to join' requests are emailed. Leave as the Connect Groups inbox unless the group leader should get them directly. Never shown on the site."
				value={ shownEmail }
				onChange={ setEmail }
			/>
			{ badEmail && <p style={ { color: '#CC3B3B', marginTop: -8 } }>That email address doesn't look right, so the group can't be saved yet.</p> }
		</PluginDocumentSettingPanel>
	);
}

function GroupPanel() {
	const type = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostType(), [] );
	return type === 'connect_group' ? <Fields /> : null;
}

registerPlugin( 'elevation-group-panel', { render: GroupPanel } );
