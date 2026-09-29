<?php
namespace Elevation\Core\Tests;

use Elevation\Core\FormSchema;
use PHPUnit\Framework\TestCase;

final class FormSchemaTest extends TestCase {

	private static function contact( array $change = [] ): array {
		return array_replace(
			[
				'key'           => 'contact',
				'title'         => 'Contact',
				'submit'        => 'Send message',
				'success'       => [ 'heading' => 'Message received', 'text' => 'Thanks & bye <b>' ],
				'rows'          => [
					[
						[ 'type' => 'text', 'name' => 'name', 'label' => 'Your name', 'autocomplete' => 'name' ],
						[ 'type' => 'email', 'name' => 'email', 'label' => 'Email' ],
					],
					[ 'type' => 'tel', 'name' => 'phone', 'label' => 'Phone' ],
					[ 'type' => 'textarea', 'name' => 'message', 'label' => 'Your message', 'rows' => 6 ],
				],
				'notifications' => [ [ 'name' => 'Office', 'to' => '{contact.email}', 'replyTo' => '{inputs.email}', 'subject' => 'Enquiry', 'body' => [ '<p>Hi</p>', '{all_data}' ] ] ],
			],
			$change
		);
	}

	public function test_a_two_field_row_becomes_a_two_column_container(): void {
		$form = FormSchema::compile( self::contact() );
		$row  = $form['form_fields']['fields'][0];
		$this->assertSame( 'container', $row['element'] );
		$this->assertCount( 2, $row['columns'] );
		$this->assertSame( 50.0, (float) $row['columns'][0]['width'] );
		$this->assertSame( 'name', $row['columns'][0]['fields'][0]['attributes']['name'] );
		$this->assertSame( 'name', $row['columns'][0]['fields'][0]['attributes']['autocomplete'] );
		$this->assertSame( 'input_email', $row['columns'][1]['fields'][0]['element'] );
	}

	public function test_required_rules_and_messages_come_from_form_rules(): void {
		$form  = FormSchema::compile( self::contact() );
		$name  = $form['form_fields']['fields'][0]['columns'][0]['fields'][0];
		$email = $form['form_fields']['fields'][0]['columns'][1]['fields'][0];
		$phone = $form['form_fields']['fields'][1];
		$this->assertTrue( $name['settings']['validation_rules']['required']['value'] );
		$this->assertSame( 'Please tell us your name.', $name['settings']['validation_rules']['required']['message'] );
		$this->assertSame( "That doesn't look like a valid email address.", $email['settings']['validation_rules']['email']['message'] );
		$this->assertFalse( $phone['settings']['validation_rules']['required']['value'] );
		$this->assertSame( 'tel', $phone['attributes']['type'] );
		$this->assertSame( 'input_text', $phone['element'] );
		$this->assertSame( 'email', $form['primaryEmail'] );
	}

	public function test_a_definition_missing_a_required_field_is_refused(): void {
		$def         = self::contact();
		$def['rows'] = array_slice( $def['rows'], 0, 2 ); // no "message"
		$this->expectExceptionMessage( 'contact: FormRules requires "message", but the form has no such field.' );
		FormSchema::compile( $def );
	}

	public function test_bad_definitions_are_refused_with_a_reason(): void {
		$cases = [
			'Unknown form key "nope".'                          => self::contact( [ 'key' => 'nope' ] ),
			'contact: two fields are called "email".'           => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'email', 'name' => 'email', 'label' => 'Again' ] ] ) ] ),
			'contact: field type "date" isn\'t supported.'      => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'date', 'name' => 'when' ] ] ) ] ),
			'contact: field name "Bad Name" must be lower-case' => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'text', 'name' => 'Bad Name' ] ] ) ] ),
			'contact: each notification needs to, subject and body.' => self::contact( [ 'notifications' => [ [ 'to' => '', 'subject' => 'x', 'body' => 'y' ] ] ] ),
			'contact: "pick" has no options.'                  => self::contact( [ 'rows' => array_merge( self::contact()['rows'], [ [ 'type' => 'select', 'name' => 'pick', 'options' => [] ] ] ) ] ),
		];
		foreach ( $cases as $message => $def ) {
			try {
				FormSchema::compile( $def );
				$this->fail( "accepted: $message" );
			} catch ( \InvalidArgumentException $e ) {
				$this->assertStringStartsWith( $message, $e->getMessage() );
			}
		}
	}

	public function test_name_fields_have_required_first_and_last_parts(): void {
		$form = FormSchema::compile( [
			'key'   => 'connect-card',
			'title' => 'Connect card',
			'rows'  => [ [ 'type' => 'name', 'name' => 'names' ], [ 'type' => 'email', 'name' => 'email', 'label' => 'Email' ] ],
		] );
		$names = $form['form_fields']['fields'][0];
		$this->assertSame( 'input_name', $names['element'] );
		$this->assertSame( 'First name', $names['fields']['first_name']['settings']['label'] );
		$this->assertSame( 'Please tell us your first name.', $names['fields']['first_name']['settings']['validation_rules']['required']['message'] );
		$this->assertTrue( $names['fields']['last_name']['settings']['validation_rules']['required']['value'] );
		$this->assertFalse( $names['fields']['middle_name']['settings']['visible'] );
		$this->assertSame( 'given-name', $names['fields']['first_name']['attributes']['autocomplete'] );
	}

	public function test_options_conditions_and_the_success_message(): void {
		$form = FormSchema::compile( self::contact( [
			'rows' => array_merge( self::contact()['rows'], [
				[ 'type' => 'radio', 'name' => 'how', 'label' => 'How?', 'options' => [ 'Friend', [ 'others', 'Other' ] ] ],
				[ 'type' => 'text', 'name' => 'how_other', 'label' => 'Tell us', 'showIf' => [ 'field' => 'how', 'value' => 'others' ] ],
			] ),
		] ) );
		$fields = $form['form_fields']['fields'];
		$this->assertSame( [ [ 'label' => 'Friend', 'value' => 'Friend', 'calc_value' => '' ], [ 'label' => 'Other', 'value' => 'others', 'calc_value' => '' ] ], $fields[3]['settings']['advanced_options'] );
		$this->assertTrue( $fields[4]['settings']['conditional_logics']['status'] );
		$this->assertSame( [ 'field' => 'how', 'value' => 'others', 'operator' => '=' ], $fields[4]['settings']['conditional_logics']['conditions'][0] );
		$this->assertSame( '<div class="form-success"><h3 class="form-success__title">Message received</h3><p>Thanks &amp; bye &lt;b&gt;</p></div>', $form['settings']['confirmation']['messageToShow'] );
		$this->assertSame( 'hide_form', $form['settings']['confirmation']['samePageFormBehavior'] );
		$this->assertSame( 'Send message', $form['form_fields']['submitButton']['settings']['button_ui']['text'] );
	}

	public function test_notifications(): void {
		$form = FormSchema::compile( self::contact( [
			'notifications' => [
				[ 'name' => 'Office', 'to' => '{contact.email}', 'replyTo' => '{inputs.email}', 'subject' => 'Enquiry', 'body' => [ '<p>Hi</p>', '{all_data}' ] ],
				[ 'to' => 'field:email', 'subject' => 'Thanks', 'body' => 'Bye', 'if' => 'phone', 'role' => 'group-leader' ],
			],
		] ) );
		[ $office, $visitor ] = $form['notifications'];
		$this->assertSame( [ 'email', '{contact.email}', '' ], [ $office['sendTo']['type'], $office['sendTo']['email'], $office['sendTo']['field'] ] );
		$this->assertSame( "<p>Hi</p>\n{all_data}", $office['message'] );
		$this->assertSame( '{inputs.email}', $office['replyTo'] );
		$this->assertSame( '{church.name}', $office['fromName'] );
		$this->assertFalse( $office['conditionals']['status'] );
		$this->assertTrue( $office['enabled'] );
		$this->assertSame( [ 'field', 'email' ], [ $visitor['sendTo']['type'], $visitor['sendTo']['field'] ] );
		$this->assertTrue( $visitor['conditionals']['status'] );
		$this->assertSame( [ 'field' => 'phone', 'operator' => '!=', 'value' => '' ], $visitor['conditionals']['conditions'][0] );
		$this->assertSame( 'group-leader', $visitor['elevation'] );
		$this->assertSame( 'Thanks', $visitor['name'] );
	}

	public function test_the_same_definition_compiles_to_the_same_json(): void {
		$this->assertSame( json_encode( FormSchema::compile( self::contact() ) ), json_encode( FormSchema::compile( self::contact() ) ) );
	}
}
