<?php
/**
 * Main plugin class for Easy Store Info
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Easy_Store_Info {
	/**
	 * Instance
	 *
	 * @var Easy_Store_Info|null
	 */
	protected static $instance = null;

	/**
	 * Get instance
	 *
	 * @return Easy_Store_Info
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->includes();
		$this->load_plugin_textdomain();
		add_action( 'init', array( $this, 'register_shortcodes' ) );
		add_action( 'wp_ajax_esi_save_settings', array( $this, 'ajax_save_settings' ) );
	}

	/**
	 * Determine request type
	 *
	 * @param string $type
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
	 * Include files
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
	 * Load textdomain
	 */
	public function load_plugin_textdomain() {
		$locale = is_admin() && function_exists( 'get_user_locale' ) ? get_user_locale() : get_locale();
		$locale = apply_filters( 'plugin_locale', $locale, 'easy-store-info' );
		unload_textdomain( 'easy-store-info' );
		load_textdomain( 'easy-store-info', WP_LANG_DIR . '/easy-store-info/easy-store-info-' . $locale . '.mo' );
		load_plugin_textdomain( 'easy-store-info', false, plugin_basename( dirname( EASY_STORE_INFO_PLUGIN_FILE ) ) . '/languages' );
	}

	/**
	 * Register shortcodes
	 */
	public function register_shortcodes() {
		add_shortcode( 'esi_store_hours', array( $this, 'shortcode_store_hours' ) );
		add_shortcode( 'esi_media_grid', array( $this, 'shortcode_media_grid' ) );
		add_shortcode( 'esi_settings', array( $this, 'shortcode_settings' ) );
	}

	/**
	 * Shortcode: store hours
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
	 * Shortcode: media grid
	 */
	public function shortcode_media_grid( $atts = array() ) {
		$grid = get_option( 'esi_media_grid', array() );
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
	 * Shortcode: link to admin settings
	 */
	public function shortcode_settings() {
		if ( current_user_can( 'manage_options' ) ) {
			$link = admin_url( 'options-general.php?page=easy_store_info' );
			return '<p>Manage plugin settings in the admin: <a href="' . esc_url( $link ) . '">Store Info Settings</a></p>';
		}
		return '<p>Settings are available in the admin area.</p>';
	}

	/**
	 * AJAX save handler (admin only)
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

		// For admin saves, attempt to fetch opening hours and return them for verification.
		$opening_hours_html = '';
		if ( ! empty( $api_key ) && ! empty( $place_id ) ) {
			$hours = $this->fetch_place_opening_hours( $api_key, $place_id );
			if ( is_array( $hours ) && ! empty( $hours ) ) {
				$opening_hours_html = '<div class="esi-opening-hours"><h3>Fetched Opening Hours</h3><ul>';
				foreach ( $hours as $line ) {
					$opening_hours_html .= '<li>' . esc_html( $line ) . '</li>';
				}
				$opening_hours_html .= '</ul></div>';
			} else {
				$opening_hours_html = '<p>Could not fetch opening hours. Please check API key and Place ID.</p>';
			}
		}

		wp_send_json_success( array( 'opening_hours_html' => $opening_hours_html ) );
	}

	/**
	 * Fetch place opening hours from Google Places API
	 *
	 * @param string $api_key
	 * @param string $place_id
	 * @return array|false
	 */
	private function fetch_place_opening_hours( $api_key, $place_id ) {
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
				return false;
			}
			$body = wp_remote_retrieve_body( $response );
			$json = json_decode( $body );
			if ( isset( $json->result->opening_hours ) ) {
				$data = $json->result->opening_hours;
				set_transient( $transient_key, $data, HOUR_IN_SECONDS );
			} else {
				return false;
			}
		}
		if ( ! empty( $data ) && ! empty( $data->weekday_text ) ) {
			return (array) $data->weekday_text;
		}
		return false;
	}

	/**
	 * Load template
	 */
	public function get_template( $template_name, $args = array(), $template_path = '', $default_path = '' ) {
		if ( $args && is_array( $args ) ) {
			extract( $args ); // phpcs:ignore
		}
		$located = $this->locate_template( $template_name, $template_path, $default_path );
		include $located;
	}

	/**
	 * Locate template
	 */
	public function locate_template( $template_name, $template_path = '', $default_path = '' ) {
		$default_path = apply_filters( 'easy-store-info_template_path', $default_path );
		if ( ! $template_path ) {
			$template_path = 'easy-store-info';
		}
		if ( ! $default_path ) {
			$default_path = EASY_STORE_INFO_ABSPATH . 'templates/';
		}
		$template = locate_template( array( trailingslashit( $template_path ) . $template_name, $template_name ) );
		$template = apply_filters( 'easy-store-info_locate_template', $template, $template_name, $template_path, $default_path );
		if ( ! $template ) {
			$template = $default_path . $template_name;
		}
		return $template;
	}

}

