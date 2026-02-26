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
			// also load frontend styles for preview parity on settings page
			wp_enqueue_style( 'easy-store-info-frontend-preview', untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) ) . '/assets/css/frontend.css', array(), '1.0.0', 'all' );
		}

		/**
		 * Register the JavaScript for the admin area.
		 */
		public function enqueue_scripts() {
			// Load upstream BraadMartin alpha-color-picker from jsDelivr (full UI)
			wp_enqueue_style( 'alpha-color-picker-css', 'https://cdn.jsdelivr.net/gh/BraadMartin/components@master/alpha-color-picker/alpha-color-picker.css', array(), null );
			wp_enqueue_script( 'alpha-color-picker-js', 'https://cdn.jsdelivr.net/gh/BraadMartin/components@master/alpha-color-picker/alpha-color-picker.min.js', array( 'jquery' ), null, true );
			$base = untrailingslashit( plugins_url( '/', EASY_STORE_INFO_PLUGIN_FILE ) );
			wp_enqueue_script( 'easy-store-info-admin', $base . '/assets/js/admin.js', array( 'jquery', 'alpha-color-picker-js' ), '1.0.0', true );
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

			// Prepare color swatches for inputs (use main helper if available)
			$bg_odd_val = esc_attr( get_option( 'esi_style_bg_odd', '#ffffff' ) );
			$bg_odd_op_val = intval( get_option( 'esi_style_bg_odd_opacity', 100 ) );
			$bg_even_val = esc_attr( get_option( 'esi_style_bg_even', '#f7f7f7' ) );
			$bg_even_op_val = intval( get_option( 'esi_style_bg_even_opacity', 100 ) );
			$text_odd_val = esc_attr( get_option( 'esi_style_text_odd_color', '#222222' ) );
			$text_odd_op_val = intval( get_option( 'esi_style_text_odd_opacity', 100 ) );
			$text_even_val = esc_attr( get_option( 'esi_style_text_even_color', '#222222' ) );
			$text_even_op_val = intval( get_option( 'esi_style_text_even_opacity', 100 ) );
			$row_sep_val = esc_attr( get_option( 'esi_style_row_sep_color', '#e5e5e5' ) );
			$row_sep_op_val = intval( get_option( 'esi_style_row_sep_opacity', 100 ) );
			// state text styling
			$state_bg_val = esc_attr( get_option( 'esi_style_state_bg', '#000000' ) );
			$state_bg_op_val = intval( get_option( 'esi_style_state_bg_opacity', 0 ) );
			$state_font_size = intval( get_option( 'esi_style_state_font_size', get_option( 'esi_style_font_size', 14 ) ) );
			$state_align = esc_attr( get_option( 'esi_style_state_align', 'left' ) );
			$state_padding = intval( get_option( 'esi_style_state_padding', 0 ) );
			$bg_odd_swatch = $bg_even_swatch = $row_sep_swatch = 'rgba(0,0,0,1)';
			if ( class_exists( 'Easy_Store_Info' ) ) {
				$main = Easy_Store_Info::instance();
				if ( method_exists( $main, 'hex_to_rgba' ) ) {
					$bg_odd_swatch = $main->hex_to_rgba( $bg_odd_val, $bg_odd_op_val );
					$bg_even_swatch = $main->hex_to_rgba( $bg_even_val, $bg_even_op_val );
					$text_odd_swatch = $main->hex_to_rgba( $text_odd_val, $text_odd_op_val );
					$text_even_swatch = $main->hex_to_rgba( $text_even_val, $text_even_op_val );
					$row_sep_swatch = $main->hex_to_rgba( $row_sep_val, $row_sep_op_val );
					$state_bg_swatch = $main->hex_to_rgba( $state_bg_val, $state_bg_op_val );
				}
			}
			// Try to fetch opening hours for display if API key/place ID present
			$opening_hours_html = '';
			if ( ! empty( $api_key ) && ! empty( $place_id ) && class_exists( 'Easy_Store_Info' ) ) {
				$main = Easy_Store_Info::instance();
				$hours = $main->fetch_place_opening_hours( $api_key, $place_id );

				if ( is_array( $hours ) ) {
					// German weekday names (0=Sunday..6=Saturday)
					$weekdays = array(
						0 => 'Sonntag',
						1 => 'Montag',
						2 => 'Dienstag',
						3 => 'Mittwoch',
						4 => 'Donnerstag',
						5 => 'Freitag',
						6 => 'Samstag',
					);
					$order = array( 1, 2, 3, 4, 5, 6, 0 );

					// Build CSS variable style attribute for preview from saved options
					$font_size = intval( get_option( 'esi_style_font_size', 14 ) );
					$font_weight = esc_attr( get_option( 'esi_style_font_weight', '400' ) );
					$day_align = esc_attr( get_option( 'esi_style_day_align', 'left' ) );
					$time_align = esc_attr( get_option( 'esi_style_time_align', 'right' ) );
					$bg_odd = esc_attr( get_option( 'esi_style_bg_odd', '#ffffff' ) );
					$bg_odd_op = intval( get_option( 'esi_style_bg_odd_opacity', 100 ) );
					$bg_even = esc_attr( get_option( 'esi_style_bg_even', '#f7f7f7' ) );
					$bg_even_op = intval( get_option( 'esi_style_bg_even_opacity', 100 ) );
					$row_sep_color = esc_attr( get_option( 'esi_style_row_sep_color', '#e5e5e5' ) );
					$row_sep_op = intval( get_option( 'esi_style_row_sep_opacity', 100 ) );
					$row_sep_weight = intval( get_option( 'esi_style_row_sep_weight', 1 ) );

					// use main helper to convert hex to rgba if available, otherwise do simple conversion
					if ( method_exists( $main, 'hex_to_rgba' ) ) {
						$bg_odd_rgba = $main->hex_to_rgba( $bg_odd, $bg_odd_op );
						$bg_even_rgba = $main->hex_to_rgba( $bg_even, $bg_even_op );
						$row_sep_rgba = $main->hex_to_rgba( $row_sep_color, $row_sep_op );
						$text_odd_rgba = $main->hex_to_rgba( $text_odd_val, $text_odd_op_val );
						$text_even_rgba = $main->hex_to_rgba( $text_even_val, $text_even_op_val );
					} else {
						// fallback simple conversion
						$convert = function( $hex, $op ) {
							$h = ltrim( $hex, '#' );
							if ( strlen( $h ) === 3 ) { $h = $h[0] . $h[0] . $h[1] . $h[1] . $h[2] . $h[2]; }
							if ( strlen( $h ) !== 6 ) { return 'rgba(0,0,0,' . ( max(0, min(100, intval($op)) ) / 100 ) . ')'; }
							$r = hexdec( substr( $h, 0, 2 ) );
							$g = hexdec( substr( $h, 2, 2 ) );
							$b = hexdec( substr( $h, 4, 2 ) );
							$a = max( 0, min( 100, intval( $op ) ) ) / 100;
							return "rgba({$r},{$g},{$b},{$a})";
						};
						$bg_odd_rgba = $convert( $bg_odd, $bg_odd_op );
						$bg_even_rgba = $convert( $bg_even, $bg_even_op );
						$row_sep_rgba = $convert( $row_sep_color, $row_sep_op );
						$text_odd_rgba = $convert( $text_odd_val, $text_odd_op_val );
						$text_even_rgba = $convert( $text_even_val, $text_even_op_val );
					}

					$style_attr = sprintf(
						'--esi-font-size:%spx;--esi-font-weight:%s;--esi-day-align:%s;--esi-time-align:%s;--esi-bg-odd:%s;--esi-bg-even:%s;--esi-text-odd:%s;--esi-text-even:%s;--esi-row-sep-color:%s;--esi-row-sep-weight:%spx;--esi-row-sep-style:%s;--esi-state-bg:%s;--esi-state-font-size:%spx;--esi-state-align:%s;--esi-state-padding:%spx',
						$font_size,
						$font_weight,
						$day_align,
						$time_align,
						$bg_odd_rgba,
						$bg_even_rgba,
						// text colors
						$text_odd_rgba,
						$text_even_rgba,
						$row_sep_rgba,
						$row_sep_weight,
						esc_attr( get_option( 'esi_style_row_sep_style', 'solid' ) ),
						// state styles
						isset( $state_bg_swatch ) ? $state_bg_swatch : 'rgba(0,0,0,0)',
						$state_font_size,
						$state_align,
						$state_padding
					);

					$opening_hours_html = '<div class="esi-opening-hours" style="' . esc_attr( $style_attr ) . '"><ul>';
					foreach ( $order as $day_index ) {
						$label = isset( $weekdays[ $day_index ] ) ? $weekdays[ $day_index ] : $day_index;
						$line = isset( $hours[ $day_index ] ) ? $hours[ $day_index ] : 'Geschlossen';
						$closed = ( 'Geschlossen' === $line || empty( $line ) );
						$li_class = $closed ? ' class="esi-closed"' : '';
						$opening_hours_html .= '<li' . $li_class . '><span class="esi-day">' . esc_html( $label ) . '</span><span class="esi-time">' . esc_html( $line ) . '</span></li>';
					}
					$opening_hours_html .= '</ul></div>';
				}
			}
			?>
			<div class="wrap">
				<h1>Store Info Settings</h1>
				<form id="esi-settings-form">
					<div class="esi-admin-panel wrapper">
						<div class="keys">
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
						</div>
						<div class="styling">
							<div class="settings esi-admin-left">
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
							<td>
								<div class="esi-alpha-picker">
									<input name="esi_style_bg_odd" id="esi_style_bg_odd" class="esi-alpha-color" type="color" value="<?php echo $bg_odd_val; ?>" />
									<input name="esi_style_bg_odd_opacity" id="esi_style_bg_odd_opacity" class="esi-alpha-opacity" type="range" min="0" max="100" value="<?php echo esc_attr( get_option( 'esi_style_bg_odd_opacity', 100 ) ); ?>" />
									<span class="esi-alpha-value"><?php echo esc_attr( get_option( 'esi_style_bg_odd_opacity', 100 ) ); ?>%</span>
									<span class="esi-color-swatch" style="background: <?php echo esc_attr( $bg_odd_swatch ); ?>"></span>
								</div>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_bg_even">Background even rows</label></th>
							<td>
								<div class="esi-alpha-picker">
									<input name="esi_style_bg_even" id="esi_style_bg_even" class="esi-alpha-color" type="color" value="<?php echo $bg_even_val; ?>" />
									<input name="esi_style_bg_even_opacity" id="esi_style_bg_even_opacity" class="esi-alpha-opacity" type="range" min="0" max="100" value="<?php echo esc_attr( get_option( 'esi_style_bg_even_opacity', 100 ) ); ?>" />
									<span class="esi-alpha-value"><?php echo esc_attr( get_option( 'esi_style_bg_even_opacity', 100 ) ); ?>%</span>
									<span class="esi-color-swatch" style="background: <?php echo esc_attr( $bg_even_swatch ); ?>"></span>
								</div>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_text_odd_color">Odd row text color</label></th>
							<td>
								<div class="esi-alpha-picker">
									<input name="esi_style_text_odd_color" id="esi_style_text_odd_color" class="esi-alpha-color" type="color" value="<?php echo $text_odd_val; ?>" />
									<input name="esi_style_text_odd_opacity" id="esi_style_text_odd_opacity" class="esi-alpha-opacity" type="range" min="0" max="100" value="<?php echo esc_attr( get_option( 'esi_style_text_odd_opacity', 100 ) ); ?>" />
									<span class="esi-alpha-value"><?php echo esc_attr( get_option( 'esi_style_text_odd_opacity', 100 ) ); ?>%</span>
									<span class="esi-color-swatch" style="background: <?php echo esc_attr( $text_odd_swatch ); ?>"></span>
								</div>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_text_even_color">Even row text color</label></th>
							<td>
								<div class="esi-alpha-picker">
									<input name="esi_style_text_even_color" id="esi_style_text_even_color" class="esi-alpha-color" type="color" value="<?php echo $text_even_val; ?>" />
									<input name="esi_style_text_even_opacity" id="esi_style_text_even_opacity" class="esi-alpha-opacity" type="range" min="0" max="100" value="<?php echo esc_attr( get_option( 'esi_style_text_even_opacity', 100 ) ); ?>" />
									<span class="esi-alpha-value"><?php echo esc_attr( get_option( 'esi_style_text_even_opacity', 100 ) ); ?>%</span>
									<span class="esi-color-swatch" style="background: <?php echo esc_attr( $text_even_swatch ); ?>"></span>
								</div>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_row_sep_color">Row separator color</label></th>
							<td>
								<div class="esi-alpha-picker">
									<input name="esi_style_row_sep_color" id="esi_style_row_sep_color" class="esi-alpha-color" type="color" value="<?php echo $row_sep_val; ?>" />
									<input name="esi_style_row_sep_opacity" id="esi_style_row_sep_opacity" class="esi-alpha-opacity" type="range" min="0" max="100" value="<?php echo esc_attr( get_option( 'esi_style_row_sep_opacity', 100 ) ); ?>" />
									<span class="esi-alpha-value"><?php echo esc_attr( get_option( 'esi_style_row_sep_opacity', 100 ) ); ?>%</span>
									<span class="esi-color-swatch" style="background: <?php echo esc_attr( $row_sep_swatch ); ?>"></span>
								</div>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_row_sep_weight">Row separator weight (px)</label></th>
							<td><input name="esi_style_row_sep_weight" id="esi_style_row_sep_weight" type="number" min="0" max="10" value="<?php echo esc_attr( get_option( 'esi_style_row_sep_weight', 1 ) ); ?>" class="small-text" /> px</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_row_sep_style">Row separator style</label></th>
							<td>
								<select name="esi_style_row_sep_style" id="esi_style_row_sep_style">
									<?php $rss = get_option( 'esi_style_row_sep_style', 'solid' ); ?>
									<option value="solid" <?php selected( $rss, 'solid' ); ?>>Solid</option>
									<option value="dashed" <?php selected( $rss, 'dashed' ); ?>>Dashed</option>
									<option value="dotted" <?php selected( $rss, 'dotted' ); ?>>Dotted</option>
									<option value="double" <?php selected( $rss, 'double' ); ?>>Double</option>
									<option value="none" <?php selected( $rss, 'none' ); ?>>None</option>
								</select>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_state_bg">Status line background</label></th>
							<td>
								<div class="esi-alpha-picker">
									<input name="esi_style_state_bg" id="esi_style_state_bg" class="esi-alpha-color" type="color" value="<?php echo $state_bg_val; ?>" />
									<input name="esi_style_state_bg_opacity" id="esi_style_state_bg_opacity" class="esi-alpha-opacity" type="range" min="0" max="100" value="<?php echo esc_attr( get_option( 'esi_style_state_bg_opacity', 0 ) ); ?>" />
									<span class="esi-alpha-value"><?php echo esc_attr( get_option( 'esi_style_state_bg_opacity', 0 ) ); ?>%</span>
									<span class="esi-color-swatch" style="background: <?php echo esc_attr( $state_bg_swatch ); ?>"></span>
								</div>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_state_font_size">Status font size (px)</label></th>
							<td><input name="esi_style_state_font_size" id="esi_style_state_font_size" type="number" min="8" max="72" value="<?php echo esc_attr( $state_font_size ); ?>" class="small-text"/> px</td>
						</tr>
						<tr>
							<th scope="row">Status alignment</th>
							<td>
								<select name="esi_style_state_align" id="esi_style_state_align">
									<option value="left" <?php selected( $state_align, 'left' ); ?>>Left</option>
									<option value="center" <?php selected( $state_align, 'center' ); ?>>Center</option>
									<option value="right" <?php selected( $state_align, 'right' ); ?>>Right</option>
								</select>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_style_state_padding">Status padding (px)</label></th>
							<td><input name="esi_style_state_padding" id="esi_style_state_padding" type="number" min="0" max="40" value="<?php echo esc_attr( $state_padding ); ?>" class="small-text"/> px</td>
						</tr>
						<tr>
							<th scope="row"><label for="esi_grid_layout">Media grid layout</label></th>
							<td>
								<select name="esi_grid_layout" id="esi_grid_layout">
									<?php $gl = get_option( 'esi_grid_layout', '2x4' ); ?>
									<option value="2x3" <?php selected( $gl, '2x3' ); ?>>2 × 3</option>
									<option value="2x4" <?php selected( $gl, '2x4' ); ?>>2 × 4</option>
									<option value="2x5" <?php selected( $gl, '2x5' ); ?>>2 × 5</option>
									<option value="3x3" <?php selected( $gl, '3x3' ); ?>>3 × 3</option>
									<option value="3x4" <?php selected( $gl, '3x4' ); ?>>3 × 4</option>
									<option value="3x5" <?php selected( $gl, '3x5' ); ?>>3 × 5</option>
								</select>
								<p class="description">Choose rows × columns for the media grid.</p>
							</td>
						</tr>
                        
								</table>
								<p class="submit"><button class="button button-primary" type="submit">Save Settings</button></p>
							</div>
							<div class="preview esi-admin-right">
								<h2>Preview</h2>
								<div class="preview-bg">
									<div id="esi-opening-hours-placeholder">
										<?php echo $opening_hours_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
									</div>
								</div>
							</div>
						</div>
						</div>
					</div>
				</form>
			</div>
			<?php
		}
	}
}

// Instantiate admin handler so hooks are registered.
new Easy_Store_Info_Admin();
