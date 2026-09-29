import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="video-alt3" label="Watch: page hero" instructions="“Watch & grow”, or “We're live right now” while the church is streaming on YouTube." />
		</div>
	),
} );
