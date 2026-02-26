<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @package Code045
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
		 * Register settings menu
		 */
		public function register_menu() {
			add_options_page( 'Store Info Settings', 'Store Info', 'manage_options', 'easy_store_info', array( $this, 'render_settings_page' ) );
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
			$this->enqueue_scripts();
		}

		/**
		 * Register the stylesheets for the admin area.
		 */
		public function enqueue_styles() {
			wp_enqueue_style( 'easy-store-info-admin', untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) ) . '/assets/css/admin.css', array(), '1.0.0', 'all' );
		}

		/**
		 * Register the JavaScript for the admin area.
		 */
		public function enqueue_scripts() {
			wp_enqueue_script( 'easy-store-info-admin', untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) ) . '/assets/js/admin.js', array( 'jquery' ), '1.0.0', true );
			wp_localize_script( 'easy-store-info-admin', 'esiAdmin', array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce' => wp_create_nonce( 'esi-save-settings' ),
			) );
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
			// Try to fetch opening hours for display if API key/place ID present
			$opening_hours_html = '';
			if ( ! empty( $api_key ) && ! empty( $place_id ) ) {
				$transient_key = 'esi_place_hours_' . md5( $place_id );
				$data = get_transient( $transient_key );
				if ( false === $data ) {
					$url = add_query_arg(
						array(
							'place_id' => rawurlencode( $place_id ),
							'fields' => 'opening_hours',
							'key' => rawurlencode( $api_key ),
						),
						'https://maps.googleapis.com/maps/api/place/details/json'
					);
					$response = wp_remote_get( $url );
					if ( ! is_wp_error( $response ) ) {
						$body = wp_remote_retrieve_body( $response );
						$json = json_decode( $body );
						if ( isset( $json->result->opening_hours ) ) {
							$data = $json->result->opening_hours;
							set_transient( $transient_key, $data, HOUR_IN_SECONDS );
						}
					}
				}
				if ( ! empty( $data ) && ! empty( $data->weekday_text ) ) {
					$opening_hours_html = '<div class="esi-opening-hours"><h3>Fetched Opening Hours</h3><ul>';
					foreach ( $data->weekday_text as $line ) {
						$opening_hours_html .= '<li>' . esc_html( $line ) . '</li>';
					}
					$opening_hours_html .= '</ul></div>';
				}
			}
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

					<h2>Display Styles</h2>
					<table class="form-table">
						<tr>
							<th scope="row"><label for="esi_style_font_size">Font size (px)</label></th>
							<td><input name="esi_style_font_size" id="esi_style_font_size" type="number" min="8" max="72" value="<?php echo esc_attr( get_option( 'esi_style_font_size', 14 ) ); ?>" class="small-text"/> px</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_font_weight">Font weight</label></th>
							<td>
								<select name="esi_style_font_weight" id="esi_style_font_weight">
									<?php $fw = get_option( 'esi_style_font_weight', '400' ); ?>
									<option value="300" <?php selected( $fw, '300' ); ?>>300</option>
									<option value="400" <?php selected( $fw, '400' ); ?>>400 (normal)</option>
									<option value="600" <?php selected( $fw, '600' ); ?>>600</option>
									<option value="700" <?php selected( $fw, '700' ); ?>>700 (bold)</option>
								</select>
							</td>
						</tr>
						<tr>
							<th scope="row">Alignment</th>
							<td>
								<label>Days: <select name="esi_style_day_align">
									<?php $da = get_option( 'esi_style_day_align', 'left' ); ?>
									<option value="left" <?php selected( $da, 'left' ); ?>>Left</option>
									<option value="center" <?php selected( $da, 'center' ); ?>>Center</option>
									<option value="right" <?php selected( $da, 'right' ); ?>>Right</option>
								</select></label>
								&nbsp;
								<label>Times: <select name="esi_style_time_align">
									<?php $ta = get_option( 'esi_style_time_align', 'right' ); ?>
									<option value="left" <?php selected( $ta, 'left' ); ?>>Left</option>
									<option value="center" <?php selected( $ta, 'center' ); ?>>Center</option>
									<option value="right" <?php selected( $ta, 'right' ); ?>>Right</option>
								</select></label>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_bg_odd">Background odd rows</label></th>
							<td><input name="esi_style_bg_odd" id="esi_style_bg_odd" type="color" value="<?php echo esc_attr( get_option( 'esi_style_bg_odd', '#ffffff' ) ); ?>" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_bg_even">Background even rows</label></th>
							<td><input name="esi_style_bg_even" id="esi_style_bg_even" type="color" value="<?php echo esc_attr( get_option( 'esi_style_bg_even', '#f7f7f7' ) ); ?>" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_row_sep_color">Row separator color</label></th>
							<td><input name="esi_style_row_sep_color" id="esi_style_row_sep_color" type="color" value="<?php echo esc_attr( get_option( 'esi_style_row_sep_color', '#e5e5e5' ) ); ?>" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_row_sep_weight">Row separator weight (px)</label></th>
							<td><input name="esi_style_row_sep_weight" id="esi_style_row_sep_weight" type="number" min="0" max="10" value="<?php echo esc_attr( get_option( 'esi_style_row_sep_weight', 1 ) ); ?>" class="small-text" /> px</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_closed_color">Closed day font color</label></th>
							<td><input name="esi_style_closed_color" id="esi_style_closed_color" type="color" value="<?php echo esc_attr( get_option( 'esi_style_closed_color', '#999999' ) ); ?>" /></td>
						</tr>
					</table>

					<div id="esi-opening-hours-placeholder">
						<?php echo $opening_hours_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</div>
					<p class="submit"><button class="button button-primary" type="submit">Save Settings</button></p>
				</form>
			</div>
			<?php
		}
	}
}

// Instantiate admin handler so hooks are registered.
new Easy_Store_Info_Admin();
