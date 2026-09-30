import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="calendar" label="Events calendar" instructions="Shows every published event by month. Nothing to set here: add or edit events under Events." />
		</div>
	),
} );
