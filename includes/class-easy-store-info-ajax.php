<?php
/**
 * The ajax functionality of the plugin.
 *
 * @package StandaloneTech
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
if ( ! class_exists( 'Easy_Store_Info_Ajax' ) ) {
	/**
	 * Plugin Easy_Store_Info_Ajax Class.
	 */
	class Easy_Store_Info_Ajax {
		/**
		 * Initialize the class and set its properties.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			// AJAX endpoints could be registered here if needed for non-auth requests.
		}
	}
}

new Easy_Store_Info_Ajax();
