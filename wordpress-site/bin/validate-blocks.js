// Block validation for every page and every elevation/* pattern.
// Paste into the browser console on any block-editor screen, e.g. /wp-admin/post-new.php?post_type=page,
// or run it with the browser tool's JavaScript action there. Prints and returns the invalid blocks.
// Local alternative (no wp-admin login): open http://localhost:8080/?elevation-validate-blocks=1
// and read window.elevationValidation ({ total, problems }); the same check is also in <pre id="elevation-validation">.
// The route lives in wp-content/mu-plugins/local-dev.php and only exists in the local environment.
( async () => {
	const pages = await wp.apiFetch( { path: '/wp/v2/pages?context=edit&per_page=100&status=publish,draft,private' } );
	const patterns = ( await wp.apiFetch( { path: '/wp/v2/block-patterns/patterns' } ) ).filter( ( p ) => p.name.startsWith( 'elevation/' ) );
	const sources = [
		...pages.map( ( p ) => [ `page ${ p.slug }`, p.content.raw ] ),
		...patterns.map( ( p ) => [ `pattern ${ p.name }`, p.content ] ),
	];
	const problems = [];
	const walk = ( label, blocks ) => blocks.forEach( ( block ) => {
		if ( block.name && ! block.isValid ) {
			problems.push( `${ label }: ${ block.name }` );
		}
		walk( label, block.innerBlocks || [] );
	} );
	for ( const [ label, raw ] of sources ) {
		walk( label, wp.blocks.parse( raw ) );
	}
	console.log( problems.length ? problems.join( '\n' ) : `All ${ sources.length } pages and patterns are valid.` );
	return problems;
} )();
