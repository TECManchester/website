<?php
namespace Elevation\Core\Tests;

use Elevation\Core\MediaRefs;
use PHPUnit\Framework\TestCase;

final class MediaRefsTest extends TestCase {

	private function lookup(): callable {
		$known = [
			'redesign/hero/hero-worship.jpg' => [ 'id' => 12, 'url' => 'http://localhost:8080/wp-content/uploads/hero-worship.jpg' ],
			'live/etracts/god-is-not-partial.jpg' => [ 'id' => 40, 'url' => 'http://localhost:8080/wp-content/uploads/god-is-not-partial.jpg' ],
		];
		return static fn ( string $path ) => $known[ $path ] ?? null;
	}

	public function test_replaces_url_and_id_refs(): void {
		$in  = '<!-- wp:image {"id":{{media-id:redesign/hero/hero-worship.jpg}}} --><img src="{{media:redesign/hero/hero-worship.jpg}}" class="wp-image-{{media-id:redesign/hero/hero-worship.jpg}}"/>';
		$out = MediaRefs::replace( $in, $this->lookup() );
		$this->assertSame( '<!-- wp:image {"id":12} --><img src="http://localhost:8080/wp-content/uploads/hero-worship.jpg" class="wp-image-12"/>', $out );
	}

	public function test_content_without_refs_is_unchanged(): void {
		$html = '<p>{service.day}s at {service.startTime} {{not a ref}}</p>';
		$this->assertSame( $html, MediaRefs::replace( $html, $this->lookup() ) );
	}

	public function test_unknown_path_throws_naming_it(): void {
		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'redesign/hero/missing.jpg' );
		MediaRefs::replace( '<img src="{{media:redesign/hero/missing.jpg}}">', $this->lookup() );
	}

	public function test_parent_directory_paths_are_rejected(): void {
		$this->expectException( \RuntimeException::class );
		MediaRefs::replace( '{{media:redesign/../../wp-config.php}}', static fn () => [ 'id' => 1, 'url' => 'x' ] );
	}

	public function test_paths_are_distinct_in_order_of_first_use(): void {
		$in = '{{media:b/two.jpg}} {{media-id:a/one.jpg}} {{media:b/two.jpg}}';
		$this->assertSame( [ 'b/two.jpg', 'a/one.jpg' ], MediaRefs::paths( $in ) );
	}

	public function test_unresolve_is_the_inverse_of_replace(): void {
		$seed     = '<!-- wp:image {"id":{{media-id:redesign/hero/hero-worship.jpg}},"sizeSlug":"large"} --><figure><img src="{{media:redesign/hero/hero-worship.jpg}}" class="wp-image-{{media-id:redesign/hero/hero-worship.jpg}}"/></figure><p>Room 12, "id":12 in prose stays.</p>';
		$resolved = MediaRefs::replace( $seed, $this->lookup() );
		$byId     = [ 12 => [ 'path' => 'redesign/hero/hero-worship.jpg', 'url' => 'http://localhost:8080/wp-content/uploads/hero-worship.jpg' ] ];
		$this->assertSame( $seed, MediaRefs::unresolve( $resolved, $byId ) );
	}
}
