import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import metadata from './block.json';

const PARTS = {
	back: '← All events link',
	summary: 'Summary (the excerpt)',
	details: 'Date, time and place',
	cta: 'Button (when the event has a link)',
	'getting-there': 'Getting there box',
	'no-description': 'Note shown when the event has no description',
};

registerBlockType( metadata.name, {
	edit: ( { attributes: { part }, setAttributes } ) => (
		<div { ...useBlockProps( { style: { padding: 8, border: '1px dashed #D7D9D6', fontSize: 13 } } ) }>
			<InspectorControls>
				<PanelBody title="Show">
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label="Part of the event"
						value={ part }
						options={ Object.entries( PARTS ).map( ( [ value, label ] ) => ( { value, label } ) ) }
						onChange={ ( v ) => setAttributes( { part: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			Event: { PARTS[ part ] }
		</div>
	),
} );
