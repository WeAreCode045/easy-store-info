<?php
/**
 * The frontend-specific functionality of the plugin.
 *
 * @package StandaloneTech
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
if ( ! class_exists( 'EASY-STORE-INFO_FRONTEND' ) ) {
	/**
	 * Plugin EASY-STORE-INFO_FRONTEND Class.
	 */
	class EASY-STORE-INFO_FRONTEND {
		/**
		 * Initialize the class and set its properties.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		}

		/**
		 * Register the stylesheets for the frontend area.s
		 *
		 * @since    1.0.0
		 */
		public function enqueue_styles() {
			wp_enqueue_style( 'easy-store-info-frontend', untrailingslashit( plugins_url( '/', EASY-STORE-INFO_PLUGIN_FILE ) ) . '/assets/css/frontend.css', array(), '1.0.0', 'all' );
		}

		/**
		 * Register the JavaScript for the frontend area.
		 *
		 * @since    1.0.0
		 */
		public function enqueue_scripts() {
			wp_enqueue_script( 'easy-store-info-frontend', untrailingslashit( plugins_url( '/', EASY-STORE-INFO_PLUGIN_FILE ) ) . '/assets/js/frontend.js', array( 'jquery' ), '1.0.0', false );
		}
	}
}

new EASY-STORE-INFO_FRONTEND();

