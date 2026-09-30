<?php
namespace Elevation\Core\Tests;

use Elevation\Core\SeedGuard;
use PHPUnit\Framework\TestCase;

final class SeedGuardTest extends TestCase {

	public function test_missing_post_is_created(): void {
		$this->assertSame( SeedGuard::CREATE, SeedGuard::decide( null, null, 'new', false ) );
	}

	public function test_identical_content_is_unchanged(): void {
		$h = SeedGuard::hash( 'same' );
		$this->assertSame( SeedGuard::UNCHANGED, SeedGuard::decide( $h, 'same', 'same', false ) );
	}

	public function test_untouched_post_is_updated(): void {
		$h = SeedGuard::hash( 'v1' );
		$this->assertSame( SeedGuard::UPDATE, SeedGuard::decide( $h, 'v1', 'v2', false ) );
	}

	public function test_hand_edited_post_is_skipped(): void {
		$h = SeedGuard::hash( 'v1' );
		$this->assertSame( SeedGuard::SKIP, SeedGuard::decide( $h, 'v1 edited in wp-admin', 'v2', false ) );
	}

	public function test_existing_post_never_seeded_is_skipped(): void {
		$this->assertSame( SeedGuard::SKIP, SeedGuard::decide( null, 'someone else wrote this', 'v2', false ) );
	}

	public function test_force_overwrites_a_hand_edit(): void {
		$h = SeedGuard::hash( 'v1' );
		$this->assertSame( SeedGuard::UPDATE, SeedGuard::decide( $h, 'edited', 'v2', true ) );
	}

	public function test_force_with_identical_content_is_unchanged(): void {
		$this->assertSame( SeedGuard::UNCHANGED, SeedGuard::decide( null, 'same', 'same', true ) );
	}

	public function test_hash_ignores_line_endings_and_outer_whitespace(): void {
		$this->assertSame( SeedGuard::hash( "a\nb" ), SeedGuard::hash( "  a\r\nb\n" ) );
	}
}
