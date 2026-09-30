<?php
/**
 * Title: Sunday strip
 * Slug: elevation/sunday-strip
 * Categories: elevation
 * Description: Green strip for the weekly gathering, with time, place and a button.
 */
?>
<!-- wp:group {"className":"is-style-strip-green sunday-strip","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-strip-green sunday-strip"><!-- wp:group {"className":"sunday-strip__text","layout":{"type":"default"}} -->
<div class="wp-block-group sunday-strip__text"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Every week</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">{service.day} Gathering</h2>
<!-- /wp:heading -->

<!-- wp:group {"className":"sunday-strip__line","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group sunday-strip__line"><!-- wp:elevation/icon {"name":"clock","size":16} /-->

<!-- wp:paragraph -->
<p>{service.day}s at {service.startTime}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"sunday-strip__line","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group sunday-strip__line"><!-- wp:elevation/icon {"name":"map-pin","size":16} /-->

<!-- wp:paragraph -->
<p>{location.full}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-navy"} -->
<div class="wp-block-button is-style-navy"><a class="wp-block-button__link wp-element-button" href="/im-new">Plan your visit</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->
