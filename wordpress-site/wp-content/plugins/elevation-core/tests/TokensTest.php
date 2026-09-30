<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Tokens;
use PHPUnit\Framework\TestCase;

final class TokensTest extends TestCase {

	private function lookup( array $values ): callable {
		return static fn ( string $key ) => $values[ $key ] ?? null;
	}

	public function test_replaces_known_tokens(): void {
		$out = Tokens::replace(
			'<p>{service.day}s at {service.startTime}</p>',
			$this->lookup( [ 'service.day' => 'Sunday', 'service.startTime' => '10:30am' ] )
		);
		$this->assertSame( '<p>Sundays at 10:30am</p>', $out );
	}

	public function test_escapes_html_in_values(): void {
		$out = Tokens::replace( '<p>{location.venue}</p>', $this->lookup( [ 'location.venue' => "Mary's <Hall> & \"Co\"" ] ) );
		$this->assertSame( '<p>Mary&#039;s &lt;Hall&gt; &amp; &quot;Co&quot;</p>', $out );
	}

	public function test_replaces_inside_attributes(): void {
		$out = Tokens::replace( '<a href="mailto:{contact.email}">x</a>', $this->lookup( [ 'contact.email' => 'info@example.org' ] ) );
		$this->assertSame( '<a href="mailto:info@example.org">x</a>', $out );
	}

	public function test_unknown_key_is_left_as_written(): void {
		$out = Tokens::replace( '<p>{service.statTime}</p>', $this->lookup( [ 'service.startTime' => '10:30am' ] ) );
		$this->assertSame( '<p>{service.statTime}</p>', $out );
	}

	public function test_non_token_braces_are_untouched(): void {
		// A lookup that answers every key: only the pattern itself can keep these intact.
		$always = static fn ( string $key ) => 'X';
		$html   = '<style>a{color:red}</style><script>var o={a:1};</script><p>{notatoken}</p>';
		$this->assertSame( $html, Tokens::replace( $html, $always ) );
		$this->assertSame( 'X', Tokens::replace( '{a.b}', $always ) );
	}

	public function test_unescaped_mode_leaves_values_raw(): void {
		$out = Tokens::replace( '{a.b}', $this->lookup( [ 'a.b' => 'M&S' ] ), false );
		$this->assertSame( 'M&S', $out );
	}

	public function test_numeric_values_are_stringified(): void {
		$out = Tokens::replace( '{site.year}', $this->lookup( [ 'site.year' => 2026 ] ) );
		$this->assertSame( '2026', $out );
	}
}
