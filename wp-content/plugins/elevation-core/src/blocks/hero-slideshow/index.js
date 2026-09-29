import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps( { style: { position: 'absolute', inset: 0 } } ) }>
			<ServerSideRender block={ metadata.name } />
		</div>
	),
} );
