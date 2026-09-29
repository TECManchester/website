<?php
/**
 * Title: Home hero
 * Slug: elevation/home-hero
 * Categories: elevation
 * Description: Full-height hero with the Church Settings slideshow, headline, two buttons and the service facts.
 */
?>
<!-- wp:group {"tagName":"section","align":"full","className":"site-hero","backgroundColor":"ink","textColor":"white","layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull site-hero has-white-color has-ink-background-color has-text-color has-background"><!-- wp:elevation/hero-slideshow {"align":"full"} /-->

<!-- wp:group {"className":"site-hero__content","layout":{"type":"constrained","contentSize":"760px","justifyContent":"left"}} -->
<div class="wp-block-group site-hero__content"><!-- wp:heading {"level":1,"textColor":"white","fontSize":"hero"} -->
<h1 class="wp-block-heading has-white-color has-text-color has-hero-font-size">Making greatness <mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-green-color">common.</mark></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"site-hero__lead"} -->
<p class="site-hero__lead">We're a Spirit-filled family in the heart of Manchester on one mission. Wherever you're coming from, there's a place for you here.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-size-lg has-arrow"} -->
<div class="wp-block-button is-size-lg has-arrow"><a class="wp-block-button__link wp-element-button" href="/im-new">Plan your visit</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-ghost-on-dark is-size-lg has-play"} -->
<div class="wp-block-button is-style-ghost-on-dark is-size-lg has-play"><a class="wp-block-button__link wp-element-button" href="/watch">Watch online</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:group {"className":"site-hero__facts","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-group site-hero__facts"><!-- wp:group {"className":"site-hero__fact","layout":{"type":"default"}} -->
<div class="wp-block-group site-hero__fact"><!-- wp:group {"className":"site-hero__fact-label","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group site-hero__fact-label"><!-- wp:elevation/icon {"name":"clock","size":18,"textColor":"green"} /-->

<!-- wp:paragraph -->
<p>{service.day}s {service.startTime}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"site-hero__fact-sub"} -->
<p class="site-hero__fact-sub">{service.arrivalNote}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"site-hero__fact","layout":{"type":"default"}} -->
<div class="wp-block-group site-hero__fact"><!-- wp:group {"className":"site-hero__fact-label","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group site-hero__fact-label"><!-- wp:elevation/icon {"name":"map-pin","size":18,"textColor":"green"} /-->

<!-- wp:paragraph -->
<p>{location.venue}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"site-hero__fact-sub"} -->
<p class="site-hero__fact-sub">{location.campus} · {location.postcode}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
