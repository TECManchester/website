import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Placeholder } from '@wordpress/components';
import metadata from './block.json';

const FORMS = [
	[ 'contact', 'Contact' ],
	[ 'prayer', 'Prayer' ],
	[ 'gift-aid', 'Gift Aid' ],
	[ 'newsletter', 'Newsletter' ],
	[ 'g-squad', 'G-Squad sign-up' ],
	[ 'plan-a-visit', 'Plan a Visit' ],
	[ 'join-group', 'Join a Connect Group' ],
	[ 'connect-card', 'Connect card' ],
	[ 'alpha', 'Alpha registration' ],
];

registerBlockType( metadata.name, {
	edit( { attributes, setAttributes } ) {
		const label = ( FORMS.find( ( f ) => f[ 0 ] === attributes.form ) || [ '', attributes.form ] )[ 1 ];
		return (
			<div { ...useBlockProps() }>
				<InspectorControls>
					<PanelBody title="Form">
						<SelectControl
							label="Which form"
							value={ attributes.form }
							options={ FORMS.map( ( [ value, text ] ) => ( { value, label: text } ) ) }
							onChange={ ( form ) => setAttributes( { form } ) }
						/>
					</PanelBody>
				</InspectorControls>
				<Placeholder icon="feedback" label={ `Form: ${ label }` } instructions="Its questions, messages and emails are edited in wp-admin → Fluent Forms." />
			</div>
		);
	},
	save: () => null,
} );
