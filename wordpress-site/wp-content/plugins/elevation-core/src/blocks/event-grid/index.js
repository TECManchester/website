import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import metadata from './block.json';

registerBlockType( metadata.name, {
	edit: ( { attributes: { limit, columns, excludeCurrent, showPast }, setAttributes } ) => {
		const blockProps = useBlockProps();
		const innerProps = useInnerBlocksProps( { style: { outline: '1px dashed #D7D9D6', padding: 12 } } );
		return (
			<div { ...blockProps }>
				<InspectorControls>
					<PanelBody title="Events">
						<RangeControl __nextHasNoMarginBottom __next40pxDefaultSize label="How many" min={ 1 } max={ 24 } value={ limit } onChange={ ( v ) => setAttributes( { limit: v } ) } />
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label="Columns on wide screens"
							value={ String( columns ) }
							options={ [ { label: '2', value: '2' }, { label: '3', value: '3' } ] }
							onChange={ ( v ) => setAttributes( { columns: Number( v ) } ) }
						/>
						<ToggleControl __nextHasNoMarginBottom label="Leave out the event being viewed" checked={ excludeCurrent } onChange={ ( v ) => setAttributes( { excludeCurrent: v } ) } />
						<ToggleControl
							__nextHasNoMarginBottom
							label="Let the calendar show past events"
							help="Past events are kept on the page, hidden, so picking a date in the Events calendar block can show what was on."
							checked={ showPast }
							onChange={ ( v ) => setAttributes( { showPast: v } ) }
						/>
					</PanelBody>
				</InspectorControls>
				<p style={ { margin: '0 0 8px', fontSize: 13, color: '#676767' } }>
					Shows up to { limit } upcoming events from Events. When nothing is coming up, visitors see this instead:
				</p>
				<div { ...innerProps } />
			</div>
		);
	},
	save: () => <InnerBlocks.Content />,
} );
