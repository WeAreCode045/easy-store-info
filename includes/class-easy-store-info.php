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
		$hours = $this->fetch_place_opening_hours( $api_key, $place_id );
		if ( false === $hours || empty( $hours ) ) {
			return '<p>Keine Öffnungszeiten verfügbar.</p>';
		}

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
		$out = '<div class="esi-opening-hours"><ul>';

		// Build CSS variable style attribute from options
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
		$closed_color = esc_attr( get_option( 'esi_style_closed_color', '#999999' ) );
		$closed_color_op = intval( get_option( 'esi_style_closed_color_opacity', 100 ) );
		$open_color = esc_attr( get_option( 'esi_style_open_color', '#222222' ) );
		$open_color_op = intval( get_option( 'esi_style_open_color_opacity', 100 ) );

		$bg_odd_rgba = $this->hex_to_rgba( $bg_odd, $bg_odd_op );
		$bg_even_rgba = $this->hex_to_rgba( $bg_even, $bg_even_op );
		$row_sep_rgba = $this->hex_to_rgba( $row_sep_color, $row_sep_op );
		$open_color_rgba = $this->hex_to_rgba( $open_color, $open_color_op );
		$closed_color_rgba = $this->hex_to_rgba( $closed_color, $closed_color_op );

		$style_attr = sprintf(
			'--esi-font-size:%spx;--esi-font-weight:%s;--esi-day-align:%s;--esi-time-align:%s;--esi-bg-odd:%s;--esi-bg-even:%s;--esi-row-sep-color:%s;--esi-row-sep-weight:%spx;--esi-open-color:%s;--esi-closed-color:%s',
			$font_size,
			$font_weight,
			$day_align,
			$time_align,
			$bg_odd_rgba,
			$bg_even_rgba,
			$row_sep_rgba,
			$row_sep_weight,
			$open_color_rgba,
			$closed_color_rgba
		);
		$out = '<div class="esi-opening-hours" style="' . esc_attr( $style_attr ) . '"><ul>';
		foreach ( $order as $day_index ) {
			$label = isset( $weekdays[ $day_index ] ) ? $weekdays[ $day_index ] : $day_index;
			$line = isset( $hours[ $day_index ] ) ? $hours[ $day_index ] : 'Geschlossen';
			$closed = ( 'Geschlossen' === $line || empty( $line ) );
			$li_class = $closed ? ' class="esi-closed"' : '';
			$out .= '<li' . $li_class . '><span class="esi-day">' . esc_html( $label ) . '</span><span class="esi-time">' . esc_html( $line ) . '</span></li>';
		}
		$out .= '</ul></div>';
		return $out;
	}

	/**
	 * Format opening hours periods into an array of day => times (H:i)
	 *
	 * @param string $api_key
	 * @param string $place_id
	 * @return array|false Array with keys 0-6 mapping to time strings or false on error
	 */
	public function fetch_place_opening_hours( $api_key, $place_id ) {
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
		// Build default result
		$result = array_fill( 0, 7, 'Geschlossen' );
		if ( ! empty( $data->periods ) && is_array( $data->periods ) ) {
			$per_day = array_fill( 0, 7, array() );
			foreach ( $data->periods as $period ) {
				if ( isset( $period->open->day, $period->open->time ) ) {
					$d = intval( $period->open->day );
					$open = $this->format_time_Hi( $period->open->time );
					if ( isset( $period->close->time ) ) {
						$close = $this->format_time_Hi( $period->close->time );
						$per_day[ $d ][] = $open . '–' . $close;
					} else {
						$per_day[ $d ][] = $open;
					}
				}
			}
			foreach ( $per_day as $d => $ranges ) {
				if ( ! empty( $ranges ) ) {
					$result[ $d ] = implode( ', ', $ranges );
				}
			}
		} elseif ( ! empty( $data->weekday_text ) && is_array( $data->weekday_text ) ) {
			// Fallback: attempt to parse weekday_text strings
			foreach ( $data->weekday_text as $i => $line ) {
				$parts = explode( ': ', $line, 2 );
				if ( 2 === count( $parts ) ) {
					$timestr = $parts[1];
					if ( stripos( $timestr, 'closed' ) !== false ) {
						$result[ $i ] = 'Geschlossen';
					} else {
						// Split by common range separators
						$ranges = preg_split( '/\s*[–—-]\s*/u', $timestr );
						$newranges = array();
						foreach ( $ranges as $r ) {
							preg_match_all( '/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/', $r, $m );
							if ( ! empty( $m[1] ) && count( $m[1] ) >= 2 ) {
								$open = date( 'H:i', strtotime( $m[1][0] ) );
								$close = date( 'H:i', strtotime( $m[1][1] ) );
								$newranges[] = $open . '–' . $close;
							} else {
								$newranges[] = $r;
							}
						}
						$result[ $i ] = implode( ', ', $newranges );
					}
				} else {
					$result[ $i ] = $line;
				}
			}
		}
		return $result;
	}

	/**
	 * Format time strings like '0900' into '09:00'
	 *
	 * @param string $time
	 * @return string
	 */
	private function format_time_Hi( $time ) {
		$time = trim( (string) $time );
		// If already in HH:MM format, try to normalize
		if ( preg_match( '/^\d{1,2}:\d{2}$/', $time ) ) {
			$parts = explode( ':', $time );
			return sprintf( '%02d:%02d', intval( $parts[0] ), intval( $parts[1] ) );
		}
		// If format is HHMM
		if ( preg_match( '/^(\d{1,2})(\d{2})$/', $time, $m ) ) {
			return sprintf( '%02d:%02d', intval( $m[1] ), intval( $m[2] ) );
		}
		// Fallback: try strtotime
		$ts = strtotime( $time );
		if ( $ts ) {
			return date( 'H:i', $ts );
		}
		return $time;
	}

	/**
	 * Convert hex color (with or without #) and opacity percent to rgba(...) string.
	 *
	 * @param string $hex
	 * @param int $opacity_percent 0-100
	 * @return string
	 */
	public function hex_to_rgba( $hex, $opacity_percent = 100 ) {
		$hex = ltrim( $hex, '#' );
		if ( strlen( $hex ) === 3 ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		if ( strlen( $hex ) !== 6 ) {
			return 'rgba(0,0,0,' . ( max(0, min(100, intval($opacity_percent)) ) / 100 ) . ')';
		}
		$r = hexdec( substr( $hex, 0, 2 ) );
		$g = hexdec( substr( $hex, 2, 2 ) );
		$b = hexdec( substr( $hex, 4, 2 ) );
		$a = max( 0, min( 100, intval( $opacity_percent ) ) ) / 100;
		return 'rgba(' . intval( $r ) . ',' . intval( $g ) . ',' . intval( $b ) . ',' . $a . ')';
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
		// Determine if current user is allowed to edit the media grid on the frontend
		$user = wp_get_current_user();
		$allowed_roles = array( 'esi_manager', 'store_info_editor', 'administrator' );
		$can_edit_frontend = is_user_logged_in() && $user && array_intersect( $allowed_roles, (array) $user->roles );

		if ( $can_edit_frontend ) {
			// Enqueue media scripts and ensure frontend script localized
			wp_enqueue_media();
			// frontend script and localization are enqueued via the frontend handler
			wp_enqueue_script( 'easy-store-info-frontend' );

			$grid = get_option( 'esi_media_grid', array() );
			$grid = array_pad( $grid, 8, 0 );
			$out = '<div class="esi-settings-wrap"><form id="esi-settings-form">';
			$out .= '<div class="esi-media-grid esi-admin-grid">';
			foreach ( $grid as $i => $att_id ) {
				$out .= '<div class="esi-media-item" data-index="' . esc_attr( $i ) . '">';
				if ( $att_id && get_post( $att_id ) ) {
					$url = wp_get_attachment_url( $att_id );
					$out .= '<div class="esi-thumb-wrap">' . wp_get_attachment_image( $att_id, 'medium' ) . '</div>';
					$out .= '<input type="hidden" name="esi_media_grid[]" value="' . esc_attr( $att_id ) . '" />';
					$out .= '<button class="esi-remove-media button" type="button">&times;</button>';
				} else {
					$out .= '<div class="esi-media-empty"></div>';
					$out .= '<input type="hidden" name="esi_media_grid[]" value="0" />';
					$out .= '<button class="esi-add-media button" type="button">+</button>';
				}
				$out .= '</div>';
			}
			$out .= '</div>';
			$out .= '<p class="submit"><button class="button button-primary" type="submit">Save Grid</button></p>';
			$out .= '</form></div>';
			return $out;
		}

		// Default: prompt to login or use admin
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
		// Allow two flows: admin saves (manage_options) or frontend grid saves for specific roles
		$user = wp_get_current_user();
		$frontend_roles = array( 'esi_manager', 'store_info_editor', 'administrator' );
		if ( current_user_can( 'manage_options' ) ) {
			// Admin: accept full payload
			$api_key = isset( $_POST['esi_google_api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_google_api_key'] ) ) : '';
			$place_id = isset( $_POST['esi_place_id'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_place_id'] ) ) : '';
			$grid = isset( $_POST['esi_media_grid'] ) && is_array( $_POST['esi_media_grid'] ) ? array_map( 'absint', $_POST['esi_media_grid'] ) : array();
			// Style settings
			$style_font_size = isset( $_POST['esi_style_font_size'] ) ? intval( $_POST['esi_style_font_size'] ) : intval( get_option( 'esi_style_font_size', 14 ) );
			$style_font_weight = isset( $_POST['esi_style_font_weight'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_style_font_weight'] ) ) : sanitize_text_field( get_option( 'esi_style_font_weight', '400' ) );
			$style_day_align = isset( $_POST['esi_style_day_align'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_style_day_align'] ) ) : sanitize_text_field( get_option( 'esi_style_day_align', 'left' ) );
			$style_time_align = isset( $_POST['esi_style_time_align'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_style_time_align'] ) ) : sanitize_text_field( get_option( 'esi_style_time_align', 'right' ) );
			$style_bg_odd = isset( $_POST['esi_style_bg_odd'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_bg_odd'] ) ) : sanitize_hex_color( get_option( 'esi_style_bg_odd', '#ffffff' ) );
			$style_bg_odd_op = isset( $_POST['esi_style_bg_odd_opacity'] ) ? intval( $_POST['esi_style_bg_odd_opacity'] ) : intval( get_option( 'esi_style_bg_odd_opacity', 100 ) );
			$style_bg_even = isset( $_POST['esi_style_bg_even'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_bg_even'] ) ) : sanitize_hex_color( get_option( 'esi_style_bg_even', '#f7f7f7' ) );
			$style_bg_even_op = isset( $_POST['esi_style_bg_even_opacity'] ) ? intval( $_POST['esi_style_bg_even_opacity'] ) : intval( get_option( 'esi_style_bg_even_opacity', 100 ) );
			$style_row_sep_color = isset( $_POST['esi_style_row_sep_color'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_row_sep_color'] ) ) : sanitize_hex_color( get_option( 'esi_style_row_sep_color', '#e5e5e5' ) );
			$style_row_sep_op = isset( $_POST['esi_style_row_sep_opacity'] ) ? intval( $_POST['esi_style_row_sep_opacity'] ) : intval( get_option( 'esi_style_row_sep_opacity', 100 ) );
			$style_row_sep_weight = isset( $_POST['esi_style_row_sep_weight'] ) ? intval( $_POST['esi_style_row_sep_weight'] ) : intval( get_option( 'esi_style_row_sep_weight', 1 ) );
			$style_closed_color = isset( $_POST['esi_style_closed_color'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_closed_color'] ) ) : sanitize_hex_color( get_option( 'esi_style_closed_color', '#999999' ) );
			$style_closed_color_op = isset( $_POST['esi_style_closed_color_opacity'] ) ? intval( $_POST['esi_style_closed_color_opacity'] ) : intval( get_option( 'esi_style_closed_color_opacity', 100 ) );
			$style_open_color = isset( $_POST['esi_style_open_color'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_open_color'] ) ) : sanitize_hex_color( get_option( 'esi_style_open_color', '#222222' ) );
			$style_open_color_op = isset( $_POST['esi_style_open_color_opacity'] ) ? intval( $_POST['esi_style_open_color_opacity'] ) : intval( get_option( 'esi_style_open_color_opacity', 100 ) );
			update_option( 'esi_google_api_key', $api_key );
			update_option( 'esi_place_id', $place_id );
			update_option( 'esi_media_grid', $grid );
			// Save style settings
			update_option( 'esi_style_font_size', $style_font_size );
			update_option( 'esi_style_font_weight', $style_font_weight );
			update_option( 'esi_style_day_align', $style_day_align );
			update_option( 'esi_style_time_align', $style_time_align );
			update_option( 'esi_style_bg_odd', $style_bg_odd );
			update_option( 'esi_style_bg_odd_opacity', $style_bg_odd_op );
			update_option( 'esi_style_bg_even', $style_bg_even );
			update_option( 'esi_style_bg_even_opacity', $style_bg_even_op );
			update_option( 'esi_style_row_sep_color', $style_row_sep_color );
			update_option( 'esi_style_row_sep_opacity', $style_row_sep_op );
			update_option( 'esi_style_row_sep_weight', $style_row_sep_weight );
			update_option( 'esi_style_closed_color', $style_closed_color );
			update_option( 'esi_style_closed_color_opacity', $style_closed_color_op );
			update_option( 'esi_style_open_color', $style_open_color );
			update_option( 'esi_style_open_color_opacity', $style_open_color_op );
		} elseif ( $user && user_can( $user, 'edit_store_info' ) ) {
			// Frontend capability: only allow updating the media grid
			$grid = isset( $_POST['esi_media_grid'] ) && is_array( $_POST['esi_media_grid'] ) ? array_map( 'absint', $_POST['esi_media_grid'] ) : array();
			// Normalize/pad to 8 slots to make per-item operations predictable
			$grid = array_pad( $grid, 8, 0 );
			update_option( 'esi_media_grid', $grid );
		} else {
			wp_send_json_error( 'forbidden', 403 );
		}

		// For admin saves: return the fully formatted, styled HTML using the shortcode
		$opening_hours_html = '';
		if ( current_user_can( 'manage_options' ) ) {
			$opening_hours_html = $this->shortcode_store_hours();
		}

		wp_send_json_success( array( 'opening_hours_html' => $opening_hours_html ) );
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

