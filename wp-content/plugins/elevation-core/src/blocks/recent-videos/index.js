import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="video-alt3" label="Recent messages (YouTube)" instructions="The 12 latest videos from the YouTube channel in Settings → Church. They open on YouTube." />
		</div>
	),
} );
