<?php
/**
 * Plugin main class file.
 *
 * @package StandaloneTech
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Main plugin calss
 */
final class Easy_Store_Info {
	/**
	 * The single instance of the class.
	 *
	 * @var %PLUGIN_SLUG%
	 * @since 1.0.0
	 */
	protected static $instance = null;

	/**
	 * Main instance
	 *
	 * @return class object
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->includes();
		$this->load_plugin_textdomain();
		add_action( 'init', array( $this, 'register_shortcodes' ) );
		// AJAX handlers for authenticated users (settings saved from frontend)
		add_action( 'wp_ajax_esi_save_settings', array( $this, 'ajax_save_settings' ) );
	}

	/**
	 * Check request
	 *
	 * @param string $type Type.
	 * @return bool
	 */
	private function is_request( $type ) {
		switch ( $type ) {
			case 'admin':
				return is_admin();
			case 'ajax':
				return defined( 'DOING_AJAX' );
			case 'cron':
				return defined( 'DOING_CRON' );
			case 'frontend':
				return ( ! is_admin() || defined( 'DOING_AJAX' ) ) && ! defined( 'DOING_CRON' );
		}
		return false;
	}

	/**
	 * Load plugin files
	 */
	public function includes() {
		if ( $this->is_request( 'admin' ) ) {
			include_once EASY_STORE_INFO_ABSPATH . 'includes/class-easy-store-info-admin.php';
		}

		if ( $this->is_request( 'frontend' ) ) {
			include_once EASY_STORE_INFO_ABSPATH . 'includes/class-easy-store-info-frontend.php';
		}

		if ( $this->is_request( 'ajax' ) ) {
			include_once EASY_STORE_INFO_ABSPATH . 'includes/class-easy-store-info-ajax.php';
		}
	}

	/**
	 * Text Domain loader
	 */
	public function load_plugin_textdomain() {
		$locale = is_admin() && function_exists( 'get_user_locale' ) ? get_user_locale() : get_locale();
		$locale = apply_filters( 'plugin_locale', $locale, 'easy-store-info' );

		unload_textdomain( 'easy-store-info' );
		load_textdomain( 'easy-store-info', WP_LANG_DIR . '/easy-store-info/easy-store-info-' . $locale . '.mo' );
		load_plugin_textdomain( 'easy-store-info', false, plugin_basename( dirname( EASY_STORE_INFO_PLUGIN_FILE ) ) . '/languages' );
	}

	/**
	 * Register the shortcodes used by the plugin
	 */
	public function register_shortcodes() {
		add_shortcode( 'esi_store_hours', array( $this, 'shortcode_store_hours' ) );
		add_shortcode( 'esi_media_grid', array( $this, 'shortcode_media_grid' ) );
		add_shortcode( 'esi_settings', array( $this, 'shortcode_settings' ) );
	}

	/**
	 * Shortcode: show opening hours from Google Places
	 */
	public function shortcode_store_hours( $atts = array() ) {
		$api_key = get_option( 'esi_google_api_key', '' );
		$place_id = get_option( 'esi_place_id', '' );
		if ( empty( $api_key ) || empty( $place_id ) ) {
			return '<p>Please configure the store Place ID and API key.</p>';
		}
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
			if ( is_wp_error( $response ) ) {
				return '<p>Could not fetch opening hours.</p>';
			}
			$body = wp_remote_retrieve_body( $response );
			$json = json_decode( $body );
			if ( isset( $json->result->opening_hours ) ) {
				$data = $json->result->opening_hours;
				set_transient( $transient_key, $data, HOUR_IN_SECONDS );
			} else {
				return '<p>No opening hours available.</p>';
			}
		}
		if ( empty( $data ) || empty( $data->weekday_text ) ) {
			return '<p>No opening hours available.</p>';
		}
		$out = '<div class="esi-opening-hours"><ul>';
		foreach ( $data->weekday_text as $line ) {
			$out .= '<li>' . esc_html( $line ) . '</li>';
		}
		$out .= '</ul></div>';
		return $out;
	}

	/**
	 * Shortcode: media grid (2 rows x 4 cols)
	 */
	public function shortcode_media_grid( $atts = array() ) {
		$grid = get_option( 'esi_media_grid', array() );
		// Ensure 8 slots
		$grid = array_pad( $grid, 8, 0 );
		$out = '<div class="esi-media-grid">';
		foreach ( $grid as $idx => $att_id ) {
			$out .= '<div class="esi-media-item" data-index="' . esc_attr( $idx ) . '">';
			if ( $att_id && $attachment = get_post( $att_id ) ) {
				$mime = get_post_mime_type( $att_id );
				$url = wp_get_attachment_url( $att_id );
				$thumb = wp_get_attachment_image( $att_id, 'medium' );
				$out .= '<a class="esi-lightbox" href="' . esc_url( $url ) . '" data-mime="' . esc_attr( $mime ) . '">';
				$out .= $thumb;
				$out .= '</a>';
			} else {
				$out .= '<div class="esi-media-empty"></div>';
			}
			$out .= '</div>';
		}
		$out .= '</div>';
		return $out;
	}

	/**
	 * Shortcode: frontend settings page with login
	 */
	public function shortcode_settings( $atts = array() ) {
		if ( ! is_user_logged_in() ) {
			$args = array( 'redirect' => get_permalink(), 'echo' => false );
			return '<div class="esi-login-form">' . wp_login_form( $args ) . '</div>';
		}
		// Enqueue media and scripts/styles
		wp_enqueue_media();
		wp_enqueue_script( 'esi-frontend', plugins_url( 'assets/js/frontend.js', EASY_STORE_INFO_PLUGIN_FILE ), array( 'jquery' ), '1.0.0', true );
		wp_localize_script( 'esi-frontend', 'esiSettings', array(
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'nonce' => wp_create_nonce( 'esi-save-settings' ),
		) );
		wp_enqueue_style( 'esi-frontend-style', plugins_url( 'assets/css/frontend.css', EASY_STORE_INFO_PLUGIN_FILE ) );

		$api_key = esc_attr( get_option( 'esi_google_api_key', '' ) );
		$place_id = esc_attr( get_option( 'esi_place_id', '' ) );
		$grid = get_option( 'esi_media_grid', array() );
		$grid = array_pad( $grid, 8, 0 );

		ob_start();
		?>
		<div class="esi-settings-wrap">
			<form id="esi-settings-form">
				<h3>Google Places</h3>
				<label>API Key<br/><input type="text" name="esi_google_api_key" value="<?php echo $api_key; ?>"/></label><br/>
				<label>Place ID<br/><input type="text" name="esi_place_id" value="<?php echo $place_id; ?>"/></label>

				<h3>Media Grid</h3>
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
				<p>
					<button class="button button-primary" type="submit">Save Settings</button>
				</p>
			</form>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * AJAX: save settings
	 */
	public function ajax_save_settings() {
		if ( ! is_user_logged_in() ) {
			wp_send_json_error( 'not_logged_in', 403 );
		}
		check_ajax_referer( 'esi-save-settings', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'forbidden', 403 );
		}
		$api_key = isset( $_POST['esi_google_api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_google_api_key'] ) ) : '';
		$place_id = isset( $_POST['esi_place_id'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_place_id'] ) ) : '';
		$grid = isset( $_POST['esi_media_grid'] ) && is_array( $_POST['esi_media_grid'] ) ? array_map( 'absint', $_POST['esi_media_grid'] ) : array();
		update_option( 'esi_google_api_key', $api_key );
		update_option( 'esi_place_id', $place_id );
		update_option( 'esi_media_grid', $grid );
		wp_send_json_success();
	}

	/**
	 * Load template
	 *
	 * @param string $template_name Tempate Name.
	 * @param array  $args args.
	 * @param string $template_path Template Path.
	 * @param string $default_path Default path.
	 */
	public function get_template( $template_name, $args = array(), $template_path = '', $default_path = '' ) {
		if ( $args && is_array( $args ) ) {
			extract( $args ); // phpcs:ignore
		}
		$located = $this->locate_template( $template_name, $template_path, $default_path );
		include $located;
	}

	/**
	 * Locate template file
	 *
	 * @param string $template_name template_name.
	 * @param string $template_path template_path.
	 * @param string $default_path default_path.
	 * @return string
	 */
	public function locate_template( $template_name, $template_path = '', $default_path = '' ) {
		$default_path = apply_filters( 'easy-store-info_template_path', $default_path );
		if ( ! $template_path ) {
			$template_path = 'easy-store-info';
		}
		if ( ! $default_path ) {
			$default_path = EASY_STORE_INFO_ABSPATH . 'templates/';
		}
		// Look within passed path within the theme - this is priority.
		$template = locate_template( array( trailingslashit( $template_path ) . $template_name, $template_name ) );
		// Add support of third party plugin.
		$template = apply_filters( 'easy-store-info_locate_template', $template, $template_name, $template_path, $default_path );
		// Get default template.
		if ( ! $template ) {
			$template = $default_path . $template_name;
		}
		return $template;


}

