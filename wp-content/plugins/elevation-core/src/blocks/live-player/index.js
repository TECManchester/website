import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<Placeholder icon="controls-play" label="Watch: live player" instructions="Shows the live stream, or the next scheduled stream, from YouTube. Hidden otherwise." />
		</div>
	),
} );
