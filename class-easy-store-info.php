<?php
class Easy_Store_Info {

	public function __construct() {
		// ...existing code...
	}

	public function locate_template( $template_name, $template_path = '', $default_path = '' ) {
		// ...existing code...
		// Get default template.
		if ( ! $template ) {
			$template = $default_path . $template_name;
		}
		return $template;
	}
}