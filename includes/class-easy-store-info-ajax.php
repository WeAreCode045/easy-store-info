<?php
/**
 * The ajax functionality of the plugin.
 *
 * @package Code045
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
if ( ! class_exists( 'Easy_Store_Info_Ajax' ) ) {
	/**
	 * Plugin Easy_Store_Info_AJAX Class.
	 */
	class Easy_Store_Info_Ajax {
		/**
		 * Initialize the class and set its properties.
		 */
		public function __construct() {
			// AJAX endpoints could be registered here if needed for non-auth requests.
		}
	}
}


// Instantiate ajax handler to register any AJAX endpoints if needed.
new Easy_Store_Info_Ajax();
