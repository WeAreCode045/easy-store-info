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
            wp_register_script( 'easy-store-info-editor', $base . '/assets/js/editor.js', array( 'jquery', 'media-views' ), '1.0.0', true );
            // localize settings for both frontend and editor scripts
            $icon_opts = array();
            $icon_classes = array();
            if ( class_exists( 'Easy_Store_Info' ) ) {
                $icon_opts = Easy_Store_Info::get_social_icon_options();
                foreach ( array_keys( $icon_opts ) as $key ) {
                    $icon_classes[ $key ] = Easy_Store_Info::get_social_icon_class( $key );
                }
            }
            $google_api_key = get_option( 'esi_google_api_key', '' );
            $local = array(
                'ajax_url'        => admin_url( 'admin-ajax.php' ),
                'google_api_key'  => $google_api_key,
                'loading'         => __( 'Vorschau wird geladen…', 'easy-store-info' ),
                'no_preview'      => __( 'Keine Öffnungszeiten-Daten vorhanden.', 'easy-store-info' ),
                'preview_error'   => __( 'Vorschau konnte nicht geladen werden.', 'easy-store-info' ),
                'network_error'   => __( 'Netzwerkfehler beim Laden der Vorschau.', 'easy-store-info' ),
                'select_icon'     => __( 'Plattform-Symbol wählen', 'easy-store-info' ),
                'remove'          => __( 'Entfernen', 'easy-store-info' ),
                'add_image'       => __( 'Bild hinzufügen', 'easy-store-info' ),
                'remove_image'    => __( 'Bild entfernen', 'easy-store-info' ),
                'select_media'    => __( 'Medien auswählen', 'easy-store-info' ),
                'insert_grid_images' => __( 'Bilder aus Mediathek wählen', 'easy-store-info' ),
                'bulk_clear_grid_confirm' => __( 'Alle Medien aus dem Raster entfernen? Dies kann nicht automatisch rückgängig gemacht werden.', 'easy-store-info' ),
                'select'          => __( 'Auswählen', 'easy-store-info' ),
                'upload_failed'   => __( 'Upload fehlgeschlagen', 'easy-store-info' ),
                'retry'           => __( 'Erneut versuchen', 'easy-store-info' ),
                'settings_saved'  => __( 'Einstellungen gespeichert', 'easy-store-info' ),
                'save_error'      => __( 'Fehler beim Speichern', 'easy-store-info' ),
                'ajax_error'      => __( 'AJAX-Fehler', 'easy-store-info' ),
                'retry_upload_hint'  => __( 'Bitte versuchen Sie den Upload erneut, indem Sie die Datei erneut ablegen oder die Ablagefläche nutzen.', 'easy-store-info' ),
                'drag_to_reorder'    => __( 'Zum Umsortieren ziehen', 'easy-store-info' ),
                'social_icon_options'  => $icon_opts,
                'social_icon_classes'  => $icon_classes,
                'nonce' => wp_create_nonce( 'esi-save-settings' ),
                'rest_nonce' => wp_create_nonce( 'wp_rest' ),
                'grid_nonce' => wp_create_nonce( 'esi-save-grid' ),
                'opening_hours_nonce' => wp_create_nonce( 'esi-save-opening-hours' ),
                'password_nonce' => wp_create_nonce( 'esi-change-password' ),
                'general_info_nonce' => wp_create_nonce( 'esi-save-general-info' ),
            );
            wp_localize_script( 'easy-store-info-frontend', 'esiSettings', $local );
            wp_localize_script( 'easy-store-info-editor', 'esiSettings', $local );
        }
    }
}

// Instantiate frontend handler to register enqueues.
new Easy_Store_Info_Frontend();

