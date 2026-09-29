<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Forms;
use PHPUnit\Framework\TestCase;

final class FormsTest extends TestCase {

	public function test_nine_keys_and_prayer_and_gift_aid_are_admin_only(): void {
		$this->assertCount( 9, Forms::KEYS );
		$this->assertTrue( Forms::isKey( 'plan-a-visit' ) );
		$this->assertFalse( Forms::isKey( 'Plan-a-visit' ) );
		$this->assertFalse( Forms::isKey( '' ) );
		$this->assertSame( [ 'contact', 'newsletter', 'g-squad', 'plan-a-visit', 'join-group', 'connect-card', 'alpha' ], Forms::siteManagerKeys() );
	}
}
