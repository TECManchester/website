<?php
/**
 * Title: Giving cards
 * Slug: elevation/give-cards
 * Categories: elevation
 * Description: Online giving, bank transfer and cheque.
 */
?>
<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:group {"className":"is-style-card-flat card--feature","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat card--feature"><!-- wp:elevation/icon {"name":"hand-coins","size":28} /-->

<!-- wp:heading -->
<h2 class="wp-block-heading">Give online</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The quickest way to give — card, PayPal balance, Apple Pay or Google Pay. You can make a one-off gift or set up a recurring one.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"linkTarget":"_blank","rel":"noreferrer noopener"} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{giving.paypalUrl}" target="_blank" rel="noreferrer noopener">Give securely now</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:paragraph {"className":"card-note"} -->
<p class="card-note">You'll be taken to PayPal's secure donation page. A PayPal account isn't required to give by card.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:separator {"className":"give-separator"} -->
<hr class="wp-block-separator has-alpha-channel-opacity give-separator"/>
<!-- /wp:separator -->

<!-- wp:group {"className":"section-heading","layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group section-heading"><!-- wp:paragraph {"className":"is-style-eyebrow"} -->
<p class="is-style-eyebrow">Other ways</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Prefer not to give online?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"is-style-lead"} -->
<p class="is-style-lead">Both of these work just as well.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"grid-2 mt-10","layout":{"type":"default"}} -->
<div class="wp-block-group grid-2 mt-10"><!-- wp:group {"className":"is-style-card-flat","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat"><!-- wp:elevation/icon {"name":"building-2"} /-->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Bank transfer</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"dl-label"} -->
<p class="dl-label">Account name</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-value"} -->
<p class="dl-value">{giving.bankAccountName}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-label"} -->
<p class="dl-label">Account number</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-value is-mono"} -->
<p class="dl-value is-mono">{giving.bankAccountNumber}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-label"} -->
<p class="dl-label">Sort code</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"dl-value is-mono"} -->
<p class="dl-value is-mono">{giving.bankSortCode}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"card-note"} -->
<p class="card-note">These details are also shown on screen on a {service.day}. If anything you see elsewhere differs from this, please check with us in person before sending money.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"is-style-card-flat","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-card-flat"><!-- wp:elevation/icon {"name":"mail"} /-->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Cheque</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Make cheques payable to:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"cheque-payee"} -->
<p class="cheque-payee">{giving.chequePayableTo}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Hand it to a member of the team on a {service.day} and we'll make sure it reaches the right place.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->
