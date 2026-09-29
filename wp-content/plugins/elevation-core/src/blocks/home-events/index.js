import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: () => {
		const blockProps = useBlockProps();
		const innerProps = useInnerBlocksProps( { style: { outline: '1px dashed #D7D9D6', padding: 12 } } );
		return (
			<div { ...blockProps }>
				<p style={ { margin: '0 0 8px', fontSize: 13, color: '#676767' } }>
					With events coming up, visitors see the next three and the weekly gathering strip. With none, they see this:
				</p>
				<div { ...innerProps } />
			</div>
		);
	},
	save: () => <InnerBlocks.Content />,
} );
