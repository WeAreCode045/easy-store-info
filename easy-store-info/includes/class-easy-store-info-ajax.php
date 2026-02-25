<?php
/**
 * The ajax functionality of the plugin.
 *
 * @package StandaloneTech
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
if ( ! class_exists( 'EASY-STORE-INFO_AJAX' ) ) {
	/**
	 * Plugin EASY-STORE-INFO_AJAX Class.
	 */
	class EASY-STORE-INFO_AJAX {
		/**
		 * Initialize the class and set its properties.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			// Your ajax hooks here.
		}
	}
}

new EASY-STORE-INFO_AJAX();
