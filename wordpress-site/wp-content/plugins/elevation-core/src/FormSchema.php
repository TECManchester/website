<?php
namespace Elevation\Core;

/**
 * Turns a short form definition (seed/forms/*.json, format in Plan 5 Task 2) into what Fluent Forms stores:
 * the form_fields JSON, the formSettings overrides and one array per email notification. Required fields
 * and their messages come from FormRules, so seed files can't disagree with the server-side check.
 * Pure — no WordPress calls.
 */
final class FormSchema {

	private const ELEMENTS = [
		'text'       => 'input_text',
		'tel'        => 'input_text',
		'email'      => 'input_email',
		'textarea'   => 'textarea',
		'number'     => 'input_number',
		'select'     => 'select',
		'radio'      => 'input_radio',
		'checkboxes' => 'input_checkbox',
		'checkbox'   => 'input_checkbox',
		'name'       => 'input_name',
		'hidden'     => 'input_hidden',
		'consent'    => 'terms_and_condition',
		'html'       => 'custom_html',
		'section'    => 'section_break',
	];

	/** Fluent Forms' editor templates (app/Services/FormBuilder/DefaultElements.php), so the forms stay editable there. */
	private const TEMPLATES = [
		'input_text'          => 'inputText',
		'input_email'         => 'inputText',
		'input_number'        => 'inputText',
		'textarea'            => 'inputTextarea',
		'select'              => 'select',
		'input_radio'         => 'inputCheckable',
		'input_checkbox'      => 'inputCheckable',
		'input_name'          => 'nameFields',
		'input_hidden'        => 'inputHidden',
		'terms_and_condition' => 'termsCheckbox',
		'custom_html'         => 'customHTML',
		'section_break'       => 'sectionBreak',
	];

	/** @return array{key:string,title:string,form_fields:array,settings:array,notifications:list<array>,primaryEmail:string} */
	public static function compile( array $def ): array {
		$key = (string) ( $def['key'] ?? '' );
		if ( ! Forms::isKey( $key ) ) {
			throw new \InvalidArgumentException( "Unknown form key \"$key\"." );
		}
		$title = trim( (string) ( $def['title'] ?? '' ) );
		if ( '' === $title ) {
			throw new \InvalidArgumentException( "$key: the form needs a title." );
		}
		$paths  = [];
		$fields = [];
		$n      = 0;
		foreach ( (array) ( $def['rows'] ?? [] ) as $row ) {
			$cells    = is_array( $row ) && array_is_list( $row ) ? $row : [ $row ];
			$compiled = [];
			foreach ( $cells as $cell ) {
				$compiled[] = self::field( $key, is_array( $cell ) ? $cell : [], $paths, ++$n );
			}
			$fields[] = 1 === count( $compiled ) ? $compiled[0] : self::container( $cells, $compiled, ++$n );
		}
		if ( ! $fields ) {
			throw new \InvalidArgumentException( "$key: the form has no fields." );
		}
		foreach ( FormRules::requiredPaths( $key ) as $path ) {
			if ( ! in_array( $path, $paths, true ) ) {
				throw new \InvalidArgumentException( "$key: FormRules requires \"$path\", but the form has no such field." );
			}
		}
		$notifications = [];
		foreach ( (array) ( $def['notifications'] ?? [] ) as $notification ) {
			$notifications[] = self::notification( $key, is_array( $notification ) ? $notification : [] );
		}
		return [
			'key'           => $key,
			'title'         => $title,
			'form_fields'   => [ 'fields' => $fields, 'submitButton' => self::submit( (string) ( $def['submit'] ?? 'Send' ) ) ],
			'settings'      => self::settings( is_array( $def['success'] ?? null ) ? $def['success'] : [] ),
			'notifications' => $notifications,
			'primaryEmail'  => in_array( 'email', $paths, true ) ? 'email' : '',
		];
	}

	private static function field( string $key, array $f, array &$paths, int $n ): array {
		$type    = (string) ( $f['type'] ?? '' );
		$element = self::ELEMENTS[ $type ] ?? null;
		if ( null === $element ) {
			throw new \InvalidArgumentException( "$key: field type \"$type\" isn't supported." );
		}
		$name  = (string) ( $f['name'] ?? '' );
		$label = (string) ( $f['label'] ?? '' );
		if ( ! in_array( $type, [ 'html', 'section' ], true ) ) {
			if ( ! preg_match( '/^[a-z][a-z0-9_]*$/', $name ) ) {
				throw new \InvalidArgumentException( "$key: field name \"$name\" must be lower-case letters, digits and underscores." );
			}
			if ( in_array( $name, $paths, true ) ) {
				throw new \InvalidArgumentException( "$key: two fields are called \"$name\"." );
			}
			$paths[] = $name;
		}
		$field = [
			'element'        => $element,
			'attributes'     => [ 'name' => $name, 'value' => (string) ( $f['value'] ?? '' ), 'class' => '', 'placeholder' => (string) ( $f['placeholder'] ?? '' ) ],
			'settings'       => [
				'container_class'    => (string) ( $f['class'] ?? '' ),
				'label'              => $label,
				'label_placement'    => '',
				'admin_field_label'  => (string) ( $f['adminLabel'] ?? $label ),
				'help_message'       => (string) ( $f['help'] ?? '' ),
				'validation_rules'   => [ 'required' => self::required( $key, $name ) ],
				'conditional_logics' => self::conditions( $f['showIf'] ?? null ),
			],
			'editor_options' => [ 'title' => $label, 'icon_class' => '', 'template' => self::TEMPLATES[ $element ] ],
			'uniqElKey'      => 'el_' . $n,
		];
		if ( isset( $f['autocomplete'] ) ) {
			$field['attributes']['autocomplete'] = (string) $f['autocomplete'];
		}
		switch ( $type ) {
			case 'text':
			case 'tel':
				$field['attributes'] += [ 'type' => $type, 'maxlength' => '' ];
				$field['settings']   += [ 'prefix_label' => '', 'suffix_label' => '', 'is_unique' => 'no' ];
				break;
			case 'email':
				$field['attributes']['type']                  = 'email';
				$field['settings']['validation_rules']['email'] = self::rule( true, FormRules::emailMessage( $key ) );
				$field['settings']['is_unique']               = 'no';
				break;
			case 'textarea':
				$field['attributes'] += [ 'rows' => (int) ( $f['rows'] ?? 4 ), 'cols' => 2, 'maxlength' => '' ];
				break;
			case 'number':
				$field['attributes'] += [ 'type' => 'number', 'min' => (string) ( $f['min'] ?? '' ), 'max' => (string) ( $f['max'] ?? '' ), 'inputmode' => 'numeric' ];
				$field['settings']   += [ 'number_step' => '', 'numeric_formatter' => '', 'prefix_label' => '', 'suffix_label' => '' ];
				break;
			case 'select':
			case 'radio':
			case 'checkboxes':
				$options = self::options( $f );
				if ( ! $options && empty( $f['dynamic'] ) ) {
					throw new \InvalidArgumentException( "$key: \"$name\" has no options." );
				}
				$field['settings'] += [ 'advanced_options' => $options, 'dynamic_default_value' => '', 'calc_value_status' => false, 'randomize_options' => 'no' ];
				if ( 'select' === $type ) {
					unset( $field['attributes']['placeholder'] );
					$field['attributes']['id']         = '';
					$field['settings']['placeholder']  = (string) ( $f['placeholder'] ?? '' );
					$field['settings']['enable_select_2'] = 'no';
				} else {
					$field['attributes']['type']       = 'radio' === $type ? 'radio' : 'checkbox';
					$field['settings']['display_type'] = '';
					$field['settings']['layout_class'] = '';
					if ( 'checkboxes' === $type ) {
						$field['attributes']['value'] = [];
					}
				}
				break;
			case 'checkbox':
				$field['attributes']                     = [ 'type' => 'checkbox', 'name' => $name, 'value' => [], 'class' => '' ];
				$field['settings']['label']              = '';
				$field['settings']['admin_field_label']  = (string) ( $f['adminLabel'] ?? $label );
				$field['settings']['advanced_options']   = [ [ 'label' => $label, 'value' => 'yes', 'calc_value' => '' ] ];
				$field['settings'] += [ 'dynamic_default_value' => '', 'calc_value_status' => false, 'randomize_options' => 'no', 'display_type' => '', 'layout_class' => '' ];
				break;
			case 'name':
				foreach ( [ 'first_name', 'last_name' ] as $part ) {
					$paths[] = "$name.$part";
				}
				$field['attributes'] = [ 'name' => $name, 'data-type' => 'name-element' ];
				$field['settings']   = [
					'container_class'    => (string) ( $f['class'] ?? '' ),
					'admin_field_label'  => (string) ( $f['adminLabel'] ?? 'Name' ),
					'conditional_logics' => self::conditions( null ),
					'label_placement'    => 'top',
				];
				$field['fields']     = [
					'first_name'  => self::namePart( $key, $name, 'first_name', (string) ( $f['first'] ?? 'First name' ), 'given-name', true ),
					'middle_name' => self::namePart( $key, $name, 'middle_name', 'Middle name', 'additional-name', false ),
					'last_name'   => self::namePart( $key, $name, 'last_name', (string) ( $f['last'] ?? 'Last name' ), 'family-name', true ),
				];
				break;
			case 'hidden':
				$field['attributes'] = [ 'type' => 'hidden', 'name' => $name, 'value' => (string) ( $f['value'] ?? '' ) ];
				$field['settings']   = [ 'admin_field_label' => $label ?: $name ];
				break;
			case 'consent':
				$field['attributes']              = [ 'type' => 'checkbox', 'name' => $name, 'value' => false, 'class' => '' ];
				$field['settings']['tnc_html']    = (string) ( $f['html'] ?? '' );
				$field['settings']['has_checkbox'] = true;
				break;
			case 'html':
				$field['attributes'] = [];
				$field['settings']   = [ 'html_codes' => (string) ( $f['html'] ?? '' ), 'conditional_logics' => self::conditions( null ), 'container_class' => (string) ( $f['class'] ?? '' ) ];
				break;
			case 'section':
				$field['attributes'] = [ 'id' => '', 'class' => (string) ( $f['class'] ?? '' ) ];
				$field['settings']   = [ 'label' => $label, 'description' => (string) ( $f['html'] ?? '' ), 'align' => 'left', 'conditional_logics' => self::conditions( null ) ];
				break;
		}
		return $field;
	}

	private static function namePart( string $key, string $name, string $part, string $label, string $autocomplete, bool $visible ): array {
		return [
			'element'        => 'input_text',
			'attributes'     => [ 'type' => 'text', 'name' => $part, 'value' => '', 'id' => '', 'class' => '', 'placeholder' => '', 'maxlength' => '', 'autocomplete' => $autocomplete ],
			'settings'       => [
				'container_class'    => '',
				'label'              => $label,
				'help_message'       => '',
				'visible'            => $visible,
				'label_placement'    => '',
				'validation_rules'   => [ 'required' => self::required( $key, "$name.$part" ) ],
				'conditional_logics' => [],
			],
			'editor_options' => [ 'template' => 'inputText' ],
		];
	}

	private static function container( array $cells, array $compiled, int $n ): array {
		$columns = [];
		foreach ( $compiled as $i => $field ) {
			$width     = isset( $cells[ $i ]['width'] ) ? (float) $cells[ $i ]['width'] : round( 100 / count( $compiled ), 2 );
			$columns[] = [ 'width' => $width, 'left' => '', 'fields' => [ $field ] ];
		}
		return [
			'element'        => 'container',
			'attributes'     => [],
			'settings'       => [ 'container_class' => 'form-row form-row--' . count( $compiled ), 'conditional_logics' => self::conditions( null ), 'container_width' => '', 'is_width_auto_calc' => true ],
			'columns'        => $columns,
			'editor_options' => [ 'title' => 'Container', 'icon_class' => 'dashicons dashicons-align-center' ],
			'uniqElKey'      => 'el_' . $n,
		];
	}

	private static function submit( string $label ): array {
		return [
			'uniqElKey'      => 'el_submit',
			'element'        => 'button',
			'attributes'     => [ 'type' => 'submit', 'class' => '' ],
			'settings'       => [
				'align'            => 'left',
				'button_style'     => '',
				'container_class'  => '',
				'help_message'     => '',
				'background_color' => '',
				'button_size'      => 'lg',
				'color'            => '',
				'button_ui'        => [ 'type' => 'default', 'text' => $label, 'img_url' => '' ],
			],
			'editor_options' => [ 'title' => 'Submit Button' ],
		];
	}

	private static function settings( array $success ): array {
		$html = '<div class="form-success"><h3 class="form-success__title">' . self::esc( (string) ( $success['heading'] ?? 'Thank you' ) ) . '</h3>';
		if ( '' !== (string) ( $success['text'] ?? '' ) ) {
			$html .= '<p>' . self::esc( (string) $success['text'] ) . '</p>';
		}
		if ( '' !== (string) ( $success['more'] ?? '' ) ) {
			$html .= '<p class="form-success__more">' . self::esc( (string) $success['more'] ) . '</p>';
		}
		return [
			'confirmation' => [ 'redirectTo' => 'samePage', 'messageToShow' => $html . '</div>', 'customPage' => null, 'samePageFormBehavior' => 'hide_form', 'customUrl' => null ],
			'layout'       => [ 'labelPlacement' => 'top', 'helpMessagePlacement' => 'under_input', 'errorMessagePlacement' => 'inline', 'asteriskPlacement' => 'asterisk-right', 'cssClassName' => '' ],
		];
	}

	private static function notification( string $key, array $n ): array {
		$to      = trim( (string) ( $n['to'] ?? '' ) );
		$subject = trim( (string) ( $n['subject'] ?? '' ) );
		$body    = is_array( $n['body'] ?? null ) ? implode( "\n", array_map( 'strval', $n['body'] ) ) : (string) ( $n['body'] ?? '' );
		if ( '' === $to || '' === $subject || '' === trim( $body ) ) {
			throw new \InvalidArgumentException( "$key: each notification needs to, subject and body." );
		}
		$field = str_starts_with( $to, 'field:' ) ? substr( $to, 6 ) : '';
		$if    = (string) ( $n['if'] ?? '' );
		return [
			'name'           => (string) ( $n['name'] ?? $subject ),
			'sendTo'         => [
				'type'    => '' !== $field ? 'field' : 'email',
				'email'   => '' !== $field ? '' : $to,
				'field'   => $field,
				'routing' => [ [ 'input_value' => '', 'field' => '', 'operator' => '=', 'value' => '' ] ],
			],
			'fromName'       => '{church.name}',
			'fromEmail'      => '',
			'replyTo'        => (string) ( $n['replyTo'] ?? '' ),
			'bcc'            => '',
			'cc'             => '',
			'subject'        => $subject,
			'message'        => $body,
			'asPlainText'    => 'no',
			'enabled'        => true,
			'conditionals'   => [
				'status'     => '' !== $if,
				'type'       => 'all',
				'conditions' => [ [ 'field' => $if, 'operator' => '' !== $if ? '!=' : '=', 'value' => '' ] ],
			],
			'email_template' => '',
			'elevation'      => (string) ( $n['role'] ?? '' ),
		];
	}

	private static function required( string $key, string $path ): array {
		$message = FormRules::requiredMessage( $key, $path );
		return self::rule( null !== $message, $message ?? '' );
	}

	private static function rule( bool $on, string $message ): array {
		return [ 'value' => $on, 'message' => $message, 'global' => false, 'global_message' => '' ];
	}

	private static function conditions( mixed $showIf ): array {
		if ( ! is_array( $showIf ) || '' === (string) ( $showIf['field'] ?? '' ) ) {
			return [ 'type' => 'any', 'status' => false, 'conditions' => [ [ 'field' => '', 'value' => '', 'operator' => '' ] ] ];
		}
		return [ 'type' => 'any', 'status' => true, 'conditions' => [ [ 'field' => (string) $showIf['field'], 'value' => (string) ( $showIf['value'] ?? '' ), 'operator' => '=' ] ] ];
	}

	/** @return list<array{label:string,value:string,calc_value:string}> */
	private static function options( array $f ): array {
		$options = [];
		foreach ( (array) ( $f['options'] ?? [] ) as $option ) {
			$value     = is_array( $option ) ? (string) ( $option[0] ?? '' ) : (string) $option;
			$label     = is_array( $option ) ? (string) ( $option[1] ?? $value ) : $value;
			$options[] = [ 'label' => $label, 'value' => $value, 'calc_value' => '' ];
		}
		return $options;
	}

	private static function esc( string $text ): string {
		return htmlspecialchars( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}
}
