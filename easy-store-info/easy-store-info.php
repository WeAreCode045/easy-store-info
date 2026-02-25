<?php
/**
 * Plugin Name: easy-store-info
 * Plugin URI: https://standalonetech.com/
 * Description:easy-store-info Plugin.
 * Author: StandaloneTech
 * Author URI: https://standalonetech.com/
 * Version: 1.0.0
 * Requires at least: 6.0
 * Tested up to: 6.7
 *
 * Text Domain: easy-store-info
 * Domain Path: /languages/
 *
 * @package StandaloneTech
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define EASY-STORE-INFO_PLUGIN_FILE.
if ( ! defined( 'EASY-STORE-INFO_PLUGIN_FILE' ) ) {
	define( 'EASY-STORE-INFO_PLUGIN_FILE', __FILE__ );
}

// Define EASY-STORE-INFO_ABSPATH.
if ( ! defined( 'EASY-STORE-INFO_ABSPATH' ) ) {
	define( 'EASY-STORE-INFO_ABSPATH', dirname( __FILE__ ) . '/' );
}

// Include the main class.
if ( ! class_exists( 'EASY-STORE-INFO' ) ) {
	include_once dirname( __FILE__ ) . '/includes/class-easy-store-info.php';
}

if ( ! function_exists( 'easy-store-info' ) ) {
	/**
	 * Returns the main instance of WooWallet.
	 *
	 * @since  1.0.0
	 * @return EASY-STORE-INFO
	 */
	function easy-store-info() { //// phpcs:ignore
		return EASY-STORE-INFO::instance();
	}
}

easy-store-info();
