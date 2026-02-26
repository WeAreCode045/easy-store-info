<?php
/**
 * Plugin Name: easy-store-info
 * Plugin URI: https://code045.nl/
 * Description:easy-store-info Plugin.
 * Author: Code045
 * Author URI: https://code045.nl/
 * Version: 1.0.3
 * Requires at least: 6.0
 * Tested up to: 6.7
 *
 * Text Domain: easy-store-info
 * Domain Path: /languages/
 *
 * @package Code045
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define EASY_STORE_INFO_PLUGIN_FILE.
if ( ! defined( 'EASY_STORE_INFO_PLUGIN_FILE' ) ) {
	define( 'EASY_STORE_INFO_PLUGIN_FILE', __FILE__ );
}

// Define EASY_STORE_INFO_ABSPATH.
if ( ! defined( 'EASY_STORE_INFO_ABSPATH' ) ) {
	define( 'EASY_STORE_INFO_ABSPATH', dirname( __FILE__ ) . '/' );
}

// Include the main class.
if ( ! class_exists( 'Easy_Store_Info' ) ) {
	include_once dirname( __FILE__ ) . '/includes/class-easy-store-info.php';
}

if ( ! function_exists( 'easy_store_info' ) ) {
	/**
	 * Returns the main instance of WooWallet.
	 *
	 * @since  1.0.0
	 * @return Easy_Store_Info
	 */
	function easy_store_info() { //// phpcs:ignore
		return Easy_Store_Info::instance();
	}
}

add_action( 'plugins_loaded', 'easy_store_info' );

/**
 * Plugin activation: create role for frontend settings users.
 */
function esi_plugin_activate() {
	add_role( 'esi_manager', 'ESI Manager', array( 'read' => true, 'upload_files' => true, 'edit_posts' => true ) );
	// New role: Store Info Editor
	add_role( 'store_info_editor', 'Store Info Editor', array( 'read' => true, 'upload_files' => true, 'edit_posts' => true ) );
	// Grant capability to roles and administrator
	$r = get_role( 'esi_manager' );
	if ( $r ) { $r->add_cap( 'edit_store_info' ); }
	$r2 = get_role( 'store_info_editor' );
	if ( $r2 ) { $r2->add_cap( 'edit_store_info' ); }
	$admin = get_role( 'administrator' );
	if ( $admin ) { $admin->add_cap( 'edit_store_info' ); }
}

/**
 * Plugin deactivation: remove role.
 */
function esi_plugin_deactivate() {
	remove_role( 'esi_manager' );
	remove_role( 'store_info_editor' );
	// remove capability from administrator
	$admin = get_role( 'administrator' );
	if ( $admin ) { $admin->remove_cap( 'edit_store_info' ); }
}

register_activation_hook( __FILE__, 'esi_plugin_activate' );
register_deactivation_hook( __FILE__, 'esi_plugin_deactivate' );

/**
 * Prevent users with role esi_manager from accessing wp-admin.
 */
function esi_block_admin_for_esi_manager() {
	if ( is_admin() ) {
		$user = wp_get_current_user();
		// Block wp-admin for users who can edit store info but are not administrators
		if ( $user && user_can( $user, 'edit_store_info' ) && ! user_can( $user, 'manage_options' ) ) {
			// Allow AJAX and REST
			if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
				return;
			}
			wp_safe_redirect( home_url() );
			exit;
		}
	}
}
add_action( 'admin_init', 'esi_block_admin_for_esi_manager' );
