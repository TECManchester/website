/** "Group details" for Connect Groups: description, day, time, leader and whether it takes new members. */
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { SelectControl, TextControl, TextareaControl, ToggleControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

const DAYS = [ [ '', 'Choose a day' ], [ 'monday', 'Monday' ], [ 'tuesday', 'Tuesday' ], [ 'wednesday', 'Wednesday' ], [ 'thursday', 'Thursday' ], [ 'friday', 'Friday' ], [ 'saturday', 'Saturday' ], [ 'sunday', 'Sunday' ] ];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Fields() {
	const [ meta, setMeta ] = useEntityProp( 'postType', 'connect_group', 'meta' );
	const [ excerpt, setExcerpt ] = useEntityProp( 'postType', 'connect_group', 'excerpt' );
	const { lockPostSaving, unlockPostSaving, removeEditorPanel } = useDispatch( 'core/editor' );
	const m = meta || {};
	const set = ( key ) => ( value ) => setMeta( { ...m, [ key ]: value } );
	const email = ( m.group_leader_email || '' ).trim();
	const badEmail = email !== '' && ! EMAIL.test( email );

	useEffect( () => {
		removeEditorPanel( 'post-excerpt' );
	}, [ removeEditorPanel ] );
	useEffect( () => {
		( badEmail ? lockPostSaving : unlockPostSaving )( 'elevation-group' );
		return () => unlockPostSaving( 'elevation-group' );
	}, [ badEmail, lockPostSaving, unlockPostSaving ] );

	return (
		<PluginDocumentSettingPanel name="elevation-group" title="Group details" initialOpen>
			<TextareaControl label="Description" help="One or two sentences for the group's card." value={ excerpt || '' } onChange={ setExcerpt } />
			<SelectControl label="Meets on" value={ m.group_meeting_day || '' } options={ DAYS.map( ( [ value, label ] ) => ( { value, label } ) ) } onChange={ set( 'group_meeting_day' ) } />
			<TextControl label="Time" type="time" value={ m.group_meeting_time || '' } onChange={ set( 'group_meeting_time' ) } />
			<TextControl label="Leader's name" help="Only the first name is shown on the site." value={ m.group_leader_name || '' } onChange={ set( 'group_leader_name' ) } />
			<TextControl
				label="Leader's email"
				type="email"
				help="Never shown on the site. Requests to join this group are emailed here and to the welcome team."
				value={ m.group_leader_email || '' }
				onChange={ set( 'group_leader_email' ) }
			/>
			{ badEmail && <p style={ { color: '#CC3B3B', marginTop: -8 } }>That email address doesn't look right, so the group can't be saved yet.</p> }
			<ToggleControl
				label="Taking new members"
				help={ m.group_accepting === false ? 'The card says "Full right now, ask about the next one".' : 'The card says "Ask to join".' }
				checked={ m.group_accepting !== false }
				onChange={ set( 'group_accepting' ) }
			/>
		</PluginDocumentSettingPanel>
	);
}

function GroupPanel() {
	const type = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostType(), [] );
	return type === 'connect_group' ? <Fields /> : null;
}

registerPlugin( 'elevation-group-panel', { render: GroupPanel } );
