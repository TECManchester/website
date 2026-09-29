import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes } ) => (
		<>
			<InspectorControls>
				<PanelBody title="Icon">
					<SelectControl
						label="Icon"
						value={ attributes.name }
						options={ metadata.attributes.name.enum.map( ( value ) => ( { label: value, value } ) ) }
						onChange={ ( name ) => setAttributes( { name } ) }
					/>
					<RangeControl label="Size (px)" value={ attributes.size } min={ 12 } max={ 96 } onChange={ ( size ) => setAttributes( { size } ) } />
					<ToggleControl label="Filled" checked={ attributes.filled } onChange={ ( filled ) => setAttributes( { filled } ) } />
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<ServerSideRender block={ metadata.name } attributes={ attributes } />
			</div>
		</>
	),
} );
