<?php
/**
 * The frontend-specific functionality of the plugin.
 *
 * @package Code045
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
if ( ! class_exists( 'Easy_Store_Info_Frontend' ) ) {
	/**
	 * Plugin Easy_Store_Info_Frontend Class.
	 */
	class Easy_Store_Info_Frontend {
		/**
		 * Initialize the class and set its properties.
		 */
		public function __construct() {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		}

		/**
		 * Register the stylesheets for the frontend area.
		 */
		public function enqueue_styles() {
			wp_enqueue_style( 'easy-store-info-frontend', untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) ) . '/assets/css/frontend.css', array(), '1.0.0', 'all' );
		}

		/**
		 * Register the JavaScript for the frontend area.
		 */
		public function enqueue_scripts() {
			wp_enqueue_script( 'easy-store-info-frontend', untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) ) . '/assets/js/frontend.js', array( 'jquery' ), '1.0.0', false );
		}
	}
}

// Instantiate frontend handler to register enqueues.
new Easy_Store_Info_Frontend();

