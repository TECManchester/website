<?php
/**
 * Title: Text and map
 * Slug: elevation/two-col-text-media
 * Categories: elevation
 * Description: Heading, address and buttons beside a click-to-load map.
 */
?>
<!-- wp:group {"tagName":"section","align":"full","anchor":"find-us","backgroundColor":"grey-50","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull has-grey-50-background-color has-background" id="find-us" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"className":"split","layout":{"type":"default"}} -->
<div class="wp-block-group split"><!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:group {"className":"section-heading","layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group section-heading"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Find us</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Where we meet</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead"} -->
<p class="is-style-lead">We gather every {service.day} at {service.startTime} in the {location.venue} on the {location.campus} campus.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"address-block mt-8","layout":{"type":"default"}} -->
<div class="wp-block-group address-block mt-8"><!-- wp:paragraph -->
<p>{location.venue}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>{location.campus}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>{location.city} {location.postcode}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:buttons {"className":"mt-8"} -->
<div class="wp-block-buttons mt-8"><!-- wp:button {"className":"is-style-navy","linkTarget":"_blank","rel":"noreferrer noopener"} -->
<div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="{location.mapsUrl}" target="_blank" rel="noreferrer noopener">Open in Google Maps</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-ghost"} -->
<div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/contact">Ask us a question</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"media-frame","layout":{"type":"default"}} -->
<div class="wp-block-group media-frame"><!-- wp:elevation/embed-gate {"aspectRatio":"4/3"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
