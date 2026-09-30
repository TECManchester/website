<?php
/** Privacy page controls; consent.js fills in the status and reveals the toggles. */
defined( 'ABSPATH' ) || exit;
?>
<div <?php echo get_block_wrapper_attributes( [ 'data-ecm-consent-controls' => '' ] ); ?>>
	<p class="consent-controls__status" data-ecm-status role="status">Your choices are saved in this browser. Turn on JavaScript to change them here.</p>
	<div class="consent-controls__body" data-ecm-controls-body hidden>
		<label class="consent-controls__option"><input type="checkbox" name="analytics"> Analytics (Google Analytics)</label>
		<label class="consent-controls__option"><input type="checkbox" name="embeds"> Maps and videos (Google Maps, YouTube, Podbean)</label>
		<button type="button" class="consent-controls__clear" data-ecm-consent-clear>Clear my choice</button>
	</div>
</div>
