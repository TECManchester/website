<?php
/**
 * Title: Date card
 * Slug: elevation/date-card
 * Categories: elevation
 * Description: A dark date tile with the event's title, day, time and place (the redesign's date-card block).
 */
?>
<!-- wp:group {"className":"date-card","layout":{"type":"default"}} -->
<div class="wp-block-group date-card"><!-- wp:group {"className":"date-card__tile","layout":{"type":"default"}} -->
<div class="wp-block-group date-card__tile"><!-- wp:paragraph {"className":"date-card__day"} -->
<p class="date-card__day">17</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"date-card__month"} -->
<p class="date-card__month">Aug</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Church in the Park</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"date-card__meta"} -->
<p class="date-card__meta">{service.day} · {service.startTime}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"date-card__meta"} -->
<p class="date-card__meta">{location.full}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
