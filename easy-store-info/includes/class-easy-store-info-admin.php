<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @package StandaloneTech
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
if ( ! class_exists( 'Easy_Store_Info_Admin' ) ) {
	/**
	 * Plugin Easy_Store_Info_Admin Class.
	 */
	class Easy_Store_Info_Admin {
		/**
		 * Initialize the class and set its properties.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
				add_action( 'admin_menu', array( $this, 'register_menu' ) );
				add_action( 'admin_enqueue_scripts', array( $this, 'maybe_enqueue_assets' ) );
		}

		/**
		 * Register the stylesheets for the admin area.s
		 *
		 * @since    1.0.0
		 */
		public function enqueue_styles() {
			wp_enqueue_style( 'easy-store-info-admin', untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) ) . '/assets/css/admin.css', array(), '1.0.0', 'all' );
		}

		/**
		 * Register the JavaScript for the admin area.
		 *
		 * @since    1.0.0
		 */
		public function enqueue_scripts() {
			wp_enqueue_script( 'easy-store-info-admin', untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) ) . '/assets/js/admin.js', array( 'jquery' ), '1.0.0', true );
			wp_localize_script( 'easy-store-info-admin', 'esiAdmin', array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce' => wp_create_nonce( 'esi-save-settings' ),
			) );
		}

		/**
		 * Only enqueue admin assets on our settings page
		 */
		public function maybe_enqueue_assets( $hook ) {
			// settings page hook will be settings_page_easy_store_info
			if ( 'settings_page_easy_store_info' !== $hook ) {
				return;
			}
			$this->enqueue_styles();
			// enqueue WP media for image/video selection
			wp_enqueue_media();
			$this->enqueue_scripts();
		}

		/**
		 * Register settings menu
		 */
		public function register_menu() {
			add_options_page( 'Store Info Settings', 'Store Info', 'manage_options', 'easy_store_info', array( $this, 'render_settings_page' ) );
		}

		/**
		 * Render the admin settings page
		 */
		public function render_settings_page() {
			if ( ! current_user_can( 'manage_options' ) ) {
				wp_die( 'Insufficient permissions' );
			}
			// handle settings saved via AJAX; page will use AJAX save
			$api_key = esc_attr( get_option( 'esi_google_api_key', '' ) );
			$place_id = esc_attr( get_option( 'esi_place_id', '' ) );
			$grid = get_option( 'esi_media_grid', array() );
			$grid = array_pad( $grid, 8, 0 );
			?>
			<div class="wrap">
				<h1>Store Info Settings</h1>
				<form id="esi-settings-form">
					<h2>Google Places</h2>
					<table class="form-table">
						<tr>
							<th scope="row"><label for="esi_google_api_key">API Key</label></th>
							<td><input name="esi_google_api_key" id="esi_google_api_key" type="text" value="<?php echo $api_key; ?>" class="regular-text"/></td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_place_id">Place ID</label></th>
							<td><input name="esi_place_id" id="esi_place_id" type="text" value="<?php echo $place_id; ?>" class="regular-text"/></td>
						</tr>
					</table>

					<h2>Media Grid</h2>
					<div class="esi-media-grid esi-admin-grid">
						<?php foreach ( $grid as $i => $att_id ) : ?>
							<div class="esi-media-item" data-index="<?php echo esc_attr( $i ); ?>">
								<?php if ( $att_id && get_post( $att_id ) ) : $url = wp_get_attachment_url( $att_id ); $mime = get_post_mime_type( $att_id ); ?>
									<div class="esi-thumb-wrap">
										<?php echo wp_get_attachment_image( $att_id, 'medium' ); ?>
									</div>
									<input type="hidden" name="esi_media_grid[]" value="<?php echo esc_attr( $att_id ); ?>" />
									<button class="esi-remove-media button" type="button" title="Remove">&times;</button>
								<?php else: ?>
									<div class="esi-media-empty"></div>
									<input type="hidden" name="esi_media_grid[]" value="0" />
									<button class="esi-add-media button" type="button" title="Add">+</button>
								<?php endif; ?>
							</div>
						<?php endforeach; ?>
					</div>
					<p class="submit"><button class="button button-primary" type="submit">Save Settings</button></p>
				</form>
			</div>
			<?php
		}
	}
}

new Easy_Store_Info_Admin();
