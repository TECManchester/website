/**
 * Editor additions:
 * - "Insert church setting" on every rich-text toolbar: inserts {group.key}, which the site replaces
 *   with the current Church Settings value when the page is shown (spec §6.1).
 * - "Large button" toggle for core/button (adds is-size-lg alongside the colour style).
 * - "Event details" sidebar panel for events (event-panel.js).
 */
import { registerFormatType, insert } from '@wordpress/rich-text';
import { RichTextToolbarButton, InspectorControls } from '@wordpress/block-editor';
import { Popover, MenuGroup, MenuItem, SearchControl, PanelBody, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import './event-panel';

const TOKENS = window.elevationTokens || [];

function TokenButton( { value, onChange, contentRef } ) {
	const [ open, setOpen ] = useState( false );
	const [ search, setSearch ] = useState( '' );
	const needle = search.toLowerCase();
	const matches = TOKENS.filter( ( t ) => `${ t.label } ${ t.key } ${ t.value }`.toLowerCase().includes( needle ) ).slice( 0, 40 );
	return (
		<>
			<RichTextToolbarButton icon="database" title="Insert church setting" onClick={ () => setOpen( ( o ) => ! o ) } isActive={ open } />
			{ open && (
				<Popover anchor={ contentRef?.current } placement="bottom-start" onClose={ () => setOpen( false ) }>
					<div style={ { padding: 12, width: 340 } }>
						<SearchControl label="Find a setting" value={ search } onChange={ setSearch } />
						<MenuGroup label="Shows the current value from Settings → Church">
							{ matches.map( ( t ) => (
								<MenuItem
									key={ t.key }
									info={ String( t.value ) }
									onClick={ () => {
										onChange( insert( value, `{${ t.key }}` ) );
										setOpen( false );
									} }
								>
									{ t.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					</div>
				</Popover>
			) }
		</>
	);
}

registerFormatType( 'elevation/token', {
	title: 'Church setting',
	tagName: 'span',
	className: 'elevation-token',
	edit: TokenButton,
} );

const withLargeToggle = createHigherOrderComponent( ( BlockEdit ) => ( props ) => {
	if ( props.name !== 'core/button' ) {
		return <BlockEdit { ...props } />;
	}
	const classes = ( props.attributes.className || '' ).split( /\s+/ ).filter( Boolean );
	const large = classes.includes( 'is-size-lg' );
	const toggle = ( on ) => {
		const next = classes.filter( ( c ) => c !== 'is-size-lg' );
		if ( on ) {
			next.push( 'is-size-lg' );
		}
		props.setAttributes( { className: next.length ? next.join( ' ' ) : undefined } );
	};
	return (
		<>
			<BlockEdit { ...props } />
			<InspectorControls>
				<PanelBody title="Size">
					<ToggleControl label="Large button" checked={ large } onChange={ toggle } />
				</PanelBody>
			</InspectorControls>
		</>
	);
}, 'withLargeToggle' );

addFilter( 'editor.BlockEdit', 'elevation/button-size', withLargeToggle );
