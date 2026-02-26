<?php
/**
 * The frontend-specific functionality of the plugin (migrated here).
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
            $base = untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) );
            wp_enqueue_style( 'easy-store-info-frontend', $base . '/assets/css/frontend.css', array(), '1.0.0', 'all' );
            // register editor-only CSS (do not enqueue globally)
            wp_register_style( 'easy-store-info-editor', $base . '/assets/css/editor.css', array(), '1.0.0', 'all' );
        }

        /**
         * Register the JavaScript for the frontend area.
         */
        public function enqueue_scripts() {
            $base = untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) );
            // frontend display script
            wp_enqueue_script( 'easy-store-info-frontend', $base . '/assets/js/frontend.js', array( 'jquery' ), '1.0.0', false );
            // register editor script (not enqueued globally)
            wp_register_script( 'easy-store-info-editor', $base . '/assets/js/editor.js', array( 'jquery' ), '1.0.0', false );
            // localize settings for both frontend and editor scripts
            $local = array(
                'ajax_url' => admin_url( 'admin-ajax.php' ),
                'nonce' => wp_create_nonce( 'esi-save-settings' ),
                'rest_nonce' => wp_create_nonce( 'wp_rest' ),
                'grid_nonce' => wp_create_nonce( 'esi-save-grid' ),
            );
            wp_localize_script( 'easy-store-info-frontend', 'esiSettings', $local );
            wp_localize_script( 'easy-store-info-editor', 'esiSettings', $local );
        }
    }
}

// Instantiate frontend handler to register enqueues.
new Easy_Store_Info_Frontend();

