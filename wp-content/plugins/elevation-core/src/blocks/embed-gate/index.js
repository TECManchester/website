import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, __experimentalNumberControl as NumberControl } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: ( { attributes, setAttributes } ) => (
		<>
			<InspectorControls>
				<PanelBody title="Embed">
					<SelectControl
						label="Type"
						value={ attributes.kind }
						options={ [ { label: 'Google map', value: 'map' }, { label: 'YouTube video (youtube-nocookie.com/embed/…)', value: 'video' }, { label: 'Podbean player', value: 'audio' } ] }
						onChange={ ( kind ) => setAttributes( { kind } ) }
					/>
					<TextControl label="Title" value={ attributes.title } onChange={ ( title ) => setAttributes( { title } ) } />
					<TextControl label="Embed address" help="Leave blank on a map to use the church's address." value={ attributes.src } onChange={ ( src ) => setAttributes( { src } ) } />
					<TextControl label="Open-in-new-tab link" value={ attributes.link } onChange={ ( link ) => setAttributes( { link } ) } />
					<SelectControl label="Shape" value={ attributes.aspectRatio } options={ [ { label: 'Wide (16:9)', value: '16/9' }, { label: 'Standard (4:3)', value: '4/3' } ] } onChange={ ( aspectRatio ) => setAttributes( { aspectRatio } ) } />
					<NumberControl label="Fixed height in px (0 = use the shape)" value={ attributes.height } min={ 0 } onChange={ ( height ) => setAttributes( { height: Number( height ) || 0 } ) } />
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<ServerSideRender block={ metadata.name } attributes={ attributes } />
			</div>
		</>
	),
} );
