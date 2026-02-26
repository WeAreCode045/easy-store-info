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
			include_once EASY_STORE_INFO_ABSPATH . 'includes/class-easy-store-info-settings.php';
		}
		if ( $this->is_request( 'frontend' ) ) {
			include_once EASY_STORE_INFO_ABSPATH . 'includes/class-easy-store-info-editor.php';
		}
		if ( $this->is_request( 'ajax' ) ) {
			include_once EASY_STORE_INFO_ABSPATH . 'includes/class-easy-store-info-ajax.php';
		}
		// shortcodes shim (future split)
		include_once EASY_STORE_INFO_ABSPATH . 'includes/class-easy-store-info-shortcodes.php';
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
		$no_hours_available = false;
		if ( false === $hours || empty( $hours ) ) {
			// Continue but mark that no hours were available so we can render a styled message
			$hours = array_fill( 0, 7, 'Geschlossen' );
			$no_hours_available = true;
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

		// Compute open/closed state message based on current site time
		$now_ts = current_time( 'timestamp' );
		$tz = function_exists( 'wp_timezone' ) ? wp_timezone() : new DateTimeZone( date_default_timezone_get() );
		$today_index = intval( date( 'w', $now_ts ) );
		$state_html = '';
		$date_str = date_i18n( 'Y-m-d', $now_ts );

		// helper: normalize time strings like 900, 9.00, 09:00 to H:i
		$normalize_time = function( $t ) {
			$t = trim( html_entity_decode( strip_tags( (string) $t ), ENT_QUOTES | ENT_HTML5 ) );
			$t = str_replace( ["\xC2\xA0", "\u00A0", "\u202F"], ' ', $t );
			$t = trim( $t );
			$t = str_replace( '.', ':', $t );
			// if digits-only like 900 or 0900 -> insert colon before last two digits
			if ( preg_match( '/^[0-9]{3,4}$/', $t ) ) {
				$t = substr( $t, 0, -2 ) . ':' . substr( $t, -2 );
			}
			// ensure format H:i
			if ( preg_match( '/^(\d{1,2}):(\d{2})$/', $t, $mm ) ) {
				$h = intval( $mm[1] );
				$m = intval( $mm[2] );
				if ( $h >= 0 && $h <= 23 && $m >= 0 && $m <= 59 ) {
					return sprintf( '%02d:%02d', $h, $m );
				}
			}
			return false;
		};

		// helper: parse ranges from a day string into array of [open,close]
		$parse_ranges = function( $line ) use ( $normalize_time ) {
			$out = array();
			if ( empty( $line ) ) return $out;
			$line = trim( (string) $line );
			if ( '' === $line ) return $out;
			// treat common 'closed' words (case-insensitive)
			if ( preg_match( '/closed|geschlossen/i', $line ) ) return $out;
			// split on commas or semicolons
			$parts = preg_split( '/\s*[;,\n]\s*/u', $line );
			foreach ( $parts as $p ) {
				// allow various dash characters (hyphen, en/em dash)
				if ( preg_match( '/(\d{1,2}[:\.]?\d{2})\s*[\x{2012}\x{2013}\x{2014}\-–—]\s*(\d{1,2}[:\.]?\d{2})/u', $p, $m ) ) {
					$o = $normalize_time( $m[1] );
					$c = $normalize_time( $m[2] );
					if ( $o && $c ) {
						$out[] = array( 'open' => $o, 'close' => $c );
					}
				}
			}
			return $out;
		};

		$is_open = false;
		$closing_time = '';
		// check today's ranges
		if ( isset( $hours[ $today_index ] ) ) {
			$ranges = $parse_ranges( $hours[ $today_index ] );
			// if parsing failed, try to find today's entry by day name inside any provided strings
			if ( empty( $ranges ) && isset( $weekdays[ $today_index ] ) ) {
				$needle = $weekdays[ $today_index ];
				foreach ( $hours as $h ) {
					if ( is_string( $h ) && false !== stripos( $h, $needle ) ) {
						// attempt to extract portion after colon if present
						$parts = explode( ':', $h, 2 );
						$line_to_parse = count( $parts ) === 2 ? trim( $parts[1] ) : $h;
						$ranges = $parse_ranges( $line_to_parse );
						if ( ! empty( $ranges ) ) {
							break;
						}
					}
				}
			}
			foreach ( $ranges as $r ) {
				$open_dt = DateTime::createFromFormat( 'Y-m-d H:i', $date_str . ' ' . $r['open'], $tz );
				$close_dt = DateTime::createFromFormat( 'Y-m-d H:i', $date_str . ' ' . $r['close'], $tz );
				if ( $open_dt && $close_dt ) {
					// handle overnight ranges where close is past midnight (close time <= open time)
					if ( $close_dt->getTimestamp() <= $open_dt->getTimestamp() ) {
						$close_dt->modify('+1 day');
					}
					$open_ts = $open_dt->getTimestamp();
					$close_ts = $close_dt->getTimestamp();
					if ( $now_ts >= $open_ts && $now_ts <= $close_ts ) {
						$is_open = true;
						$closing_time = $close_dt->format( 'H:i' );
						break;
					}
				}
			}
		}

		if ( $is_open ) {
			$state_html = '<p class="esi-open-state">Wir sind heute geöffnet bis ' . esc_html( $closing_time ) . '.</p>';
		} else {
			// find next opening (today later or next days)
			$found = false;
			// check remaining ranges today for future openings
			if ( isset( $hours[ $today_index ] ) ) {
				$ranges = $parse_ranges( $hours[ $today_index ] );
				foreach ( $ranges as $r ) {
					$open_dt = DateTime::createFromFormat( 'Y-m-d H:i', $date_str . ' ' . $r['open'], $tz );
					if ( $open_dt && $open_dt->getTimestamp() > $now_ts ) {
						$found = true;
						$when_text = 'heute';
						$next_open_time = $open_dt->format( 'H:i' );
						break;
					}
				}
			}
			// search next days
			if ( ! $found ) {
				for ( $i = 1; $i <= 7; $i++ ) {
					$idx = ( $today_index + $i ) % 7;
					if ( isset( $hours[ $idx ] ) && 'Geschlossen' !== $hours[ $idx ] ) {
						$parts = $parse_ranges( $hours[ $idx ] );
						if ( ! empty( $parts ) ) {
							$target_date = date_i18n( 'Y-m-d', $now_ts + ( $i * DAY_IN_SECONDS ) );
							$open_dt = DateTime::createFromFormat( 'Y-m-d H:i', $target_date . ' ' . $parts[0]['open'], $tz );
							if ( $open_dt ) {
								$found = true;
								if ( $i === 1 ) {
									$when_text = 'morgen';
								} else {
									$weekdays = array(
										0 => 'Sonntag',
										1 => 'Montag',
										2 => 'Dienstag',
										3 => 'Mittwoch',
										4 => 'Donnerstag',
										5 => 'Freitag',
										6 => 'Samstag',
									);
									$when_text = isset( $weekdays[ $idx ] ) ? $weekdays[ $idx ] : $target_date;
								}
								$next_open_time = $open_dt->format( 'H:i' );
									break;
							}
						}
						// If we didn't find ranges, try to parse by weekday name inside the provided string
						if ( empty( $parts ) && isset( $weekdays[ $idx ] ) ) {
							$candidate = $hours[ $idx ];
							if ( is_string( $candidate ) && false !== stripos( $candidate, $weekdays[ $idx ] ) ) {
								$sp = explode( ':', $candidate, 2 );
								$line_to_parse = count( $sp ) === 2 ? trim( $sp[1] ) : $candidate;
								$parts = $parse_ranges( $line_to_parse );
								if ( ! empty( $parts ) ) {
									$target_date = date_i18n( 'Y-m-d', $now_ts + ( $i * DAY_IN_SECONDS ) );
									$open_dt = DateTime::createFromFormat( 'Y-m-d H:i', $target_date . ' ' . $parts[0]['open'], $tz );
									if ( $open_dt ) {
										$found = true;
										if ( $i === 1 ) {
											$when_text = 'morgen';
										} else {
											$when_text = $weekdays[ $idx ];
										}
										$next_open_time = $open_dt->format( 'H:i' );
										break;
									}
								}
							}
							// fallback: search all entries for weekday name and parse
							if ( ! $found ) {
								foreach ( $hours as $h ) {
									if ( is_string( $h ) && false !== stripos( $h, $weekdays[ $idx ] ) ) {
										$sp = explode( ':', $h, 2 );
										$line_to_parse = count( $sp ) === 2 ? trim( $sp[1] ) : $h;
										$parts = $parse_ranges( $line_to_parse );
										if ( ! empty( $parts ) ) {
											$target_date = date_i18n( 'Y-m-d', $now_ts + ( $i * DAY_IN_SECONDS ) );
											$open_dt = DateTime::createFromFormat( 'Y-m-d H:i', $target_date . ' ' . $parts[0]['open'], $tz );
											if ( $open_dt ) {
												$found = true;
												if ( $i === 1 ) {
													$when_text = 'morgen';
												} else {
													$when_text = $weekdays[ $idx ];
												}
												$next_open_time = $open_dt->format( 'H:i' );
												break 2;
											}
										}
									}
								}
							}
						}
					}
				}
			}

			if ( $found ) {
				// build natural phrase: 'heute um HH:MM', 'morgen um HH:MM', or 'am <Wochentag> um HH:MM'
				if ( isset( $when_text ) && 'heute' === $when_text ) {
					$when_phrase = 'heute um ' . $next_open_time;
				} elseif ( isset( $when_text ) && 'morgen' === $when_text ) {
					$when_phrase = 'morgen um ' . $next_open_time;
				} else {
					$when_phrase = 'am ' . ( isset( $when_text ) ? $when_text : '' ) . ' um ' . $next_open_time;
				}
				$state_html = '<p class="esi-open-state">Zurzeit geschlossen — wir öffnen ' . esc_html( $when_phrase ) . '.</p>';
			} else {
				$state_html = '<p class="esi-open-state">Keine Öffnungszeiten verfügbar.</p>';
			}
		}

		// (style_attr computed below) -- ensure we append state_html when rendering

		// Build CSS variable style attribute from options
		$font_size = intval( get_option( 'esi_style_font_size', 14 ) );
		$font_weight = esc_attr( get_option( 'esi_style_font_weight', '400' ) );
		$day_align = esc_attr( get_option( 'esi_style_day_align', 'left' ) );
		$time_align = esc_attr( get_option( 'esi_style_time_align', 'right' ) );
		$bg_odd = esc_attr( get_option( 'esi_style_bg_odd', '#ffffff' ) );
		$bg_odd_op = intval( get_option( 'esi_style_bg_odd_opacity', 100 ) );
		$bg_even = esc_attr( get_option( 'esi_style_bg_even', '#f7f7f7' ) );
		$bg_even_op = intval( get_option( 'esi_style_bg_even_opacity', 100 ) );
		// state / status line styles
		$state_bg = esc_attr( get_option( 'esi_style_state_bg', '#000000' ) );
		$state_bg_op = intval( get_option( 'esi_style_state_bg_opacity', 0 ) );
		$state_font_size = intval( get_option( 'esi_style_state_font_size', get_option( 'esi_style_font_size', 14 ) ) );
		$state_align = esc_attr( get_option( 'esi_style_state_align', 'left' ) );
		$state_padding = intval( get_option( 'esi_style_state_padding', 0 ) );
		$row_sep_color = esc_attr( get_option( 'esi_style_row_sep_color', '#e5e5e5' ) );
		$row_sep_op = intval( get_option( 'esi_style_row_sep_opacity', 100 ) );
		$row_sep_weight = intval( get_option( 'esi_style_row_sep_weight', 1 ) );
		$text_odd = esc_attr( get_option( 'esi_style_text_odd_color', '#222222' ) );
		$text_odd_op = intval( get_option( 'esi_style_text_odd_opacity', 100 ) );
		$text_even = esc_attr( get_option( 'esi_style_text_even_color', '#222222' ) );
		$text_even_op = intval( get_option( 'esi_style_text_even_opacity', 100 ) );

		$bg_odd_rgba = $this->hex_to_rgba( $bg_odd, $bg_odd_op );
		$bg_even_rgba = $this->hex_to_rgba( $bg_even, $bg_even_op );
		$row_sep_rgba = $this->hex_to_rgba( $row_sep_color, $row_sep_op );
		$text_odd_rgba = $this->hex_to_rgba( $text_odd, $text_odd_op );
		$text_even_rgba = $this->hex_to_rgba( $text_even, $text_even_op );
		$state_bg_rgba = $this->hex_to_rgba( $state_bg, $state_bg_op );

		$style_attr = sprintf(
			'--esi-font-size:%spx;--esi-font-weight:%s;--esi-day-align:%s;--esi-time-align:%s;--esi-bg-odd:%s;--esi-bg-even:%s;--esi-text-odd:%s;--esi-text-even:%s;--esi-row-sep-color:%s;--esi-row-sep-weight:%spx;--esi-row-sep-style:%s;--esi-state-bg:%s;--esi-state-font-size:%spx;--esi-state-align:%s;--esi-state-padding:%spx',
			$font_size,
			$font_weight,
			$day_align,
			$time_align,
			$bg_odd_rgba,
			$bg_even_rgba,
			$text_odd_rgba,
			$text_even_rgba,
			$row_sep_rgba,
			$row_sep_weight,
			esc_attr( get_option( 'esi_style_row_sep_style', 'solid' ) ),
			// state styles
			$state_bg_rgba,
			$state_font_size,
			$state_align,
			$state_padding
		);
		$out = '<div class="esi-opening-hours" style="' . esc_attr( $style_attr ) . '">' . $state_html . '<ul>';
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
		// layout option controls the number of slots shown
		$layout = get_option( 'esi_grid_layout', '2x4' );
		list( $rows, $cols ) = explode( 'x', $layout ) + array( 2, 4 );
		$rows = intval( $rows );
		$cols = intval( $cols );
		$slots = max( 1, $rows * $cols );
		$grid = array_pad( $grid, $slots, 0 );
		// Use template for rendering media grid
		ob_start();
		$this->get_template( 'media-grid.php', array( 'grid' => $grid, 'layout' => $layout ) );
		return (string) ob_get_clean();
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
			// Enqueue media scripts and ensure editor assets are available
			wp_enqueue_media();
			// enqueue the editor-only JS & CSS (registered by frontend loader)
			wp_enqueue_style( 'easy-store-info-editor' );
			wp_enqueue_script( 'easy-store-info-editor' );

			$grid = get_option( 'esi_media_grid', array() );
			$layout = get_option( 'esi_grid_layout', '2x4' );
			list( $rows, $cols ) = explode( 'x', $layout ) + array( 2, 4 );
			$rows = intval( $rows );
			$cols = intval( $cols );
			$slots = max( 1, $rows * $cols );
			$grid = array_pad( $grid, $slots, 0 );

			ob_start();
			$this->get_template( 'editor.php', array( 'grid' => $grid, 'layout' => $layout ) );
			return (string) ob_get_clean();
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
			$style_row_sep_style = isset( $_POST['esi_style_row_sep_style'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_style_row_sep_style'] ) ) : sanitize_text_field( get_option( 'esi_style_row_sep_style', 'solid' ) );
			$style_text_odd = isset( $_POST['esi_style_text_odd_color'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_text_odd_color'] ) ) : sanitize_hex_color( get_option( 'esi_style_text_odd_color', '#222222' ) );
			$style_text_odd_op = isset( $_POST['esi_style_text_odd_opacity'] ) ? intval( $_POST['esi_style_text_odd_opacity'] ) : intval( get_option( 'esi_style_text_odd_opacity', 100 ) );
			$style_text_even = isset( $_POST['esi_style_text_even_color'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_text_even_color'] ) ) : sanitize_hex_color( get_option( 'esi_style_text_even_color', '#222222' ) );
			$style_text_even_op = isset( $_POST['esi_style_text_even_opacity'] ) ? intval( $_POST['esi_style_text_even_opacity'] ) : intval( get_option( 'esi_style_text_even_opacity', 100 ) );
			// state / status line inputs
			$style_state_bg = isset( $_POST['esi_style_state_bg'] ) ? sanitize_hex_color( wp_unslash( $_POST['esi_style_state_bg'] ) ) : sanitize_hex_color( get_option( 'esi_style_state_bg', '#000000' ) );
			$style_state_bg_op = isset( $_POST['esi_style_state_bg_opacity'] ) ? intval( $_POST['esi_style_state_bg_opacity'] ) : intval( get_option( 'esi_style_state_bg_opacity', 0 ) );
			$style_state_font_size = isset( $_POST['esi_style_state_font_size'] ) ? intval( $_POST['esi_style_state_font_size'] ) : intval( get_option( 'esi_style_state_font_size', get_option( 'esi_style_font_size', 14 ) ) );
			$style_state_align = isset( $_POST['esi_style_state_align'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_style_state_align'] ) ) : sanitize_text_field( get_option( 'esi_style_state_align', 'left' ) );
			$style_state_padding = isset( $_POST['esi_style_state_padding'] ) ? intval( $_POST['esi_style_state_padding'] ) : intval( get_option( 'esi_style_state_padding', 0 ) );
			// grid layout option
			$allowed_layouts = array( '2x3','2x4','2x5','3x3','3x4','3x5' );
			$style_grid_layout = isset( $_POST['esi_grid_layout'] ) ? sanitize_text_field( wp_unslash( $_POST['esi_grid_layout'] ) ) : get_option( 'esi_grid_layout', '2x4' );
			if ( ! in_array( $style_grid_layout, $allowed_layouts, true ) ) {
				$style_grid_layout = '2x4';
			}
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
			update_option( 'esi_style_row_sep_style', $style_row_sep_style );
			update_option( 'esi_style_text_odd_color', $style_text_odd );
			update_option( 'esi_style_text_odd_opacity', $style_text_odd_op );
			update_option( 'esi_style_text_even_color', $style_text_even );
			update_option( 'esi_style_text_even_opacity', $style_text_even_op );
			// persist state options
			update_option( 'esi_style_state_bg', $style_state_bg );
			update_option( 'esi_style_state_bg_opacity', $style_state_bg_op );
			update_option( 'esi_style_state_font_size', $style_state_font_size );
			update_option( 'esi_style_state_align', $style_state_align );
			update_option( 'esi_style_state_padding', $style_state_padding );
			// persist grid layout
			update_option( 'esi_grid_layout', $style_grid_layout );
		} elseif ( $user && is_array( $user->roles ) && array_intersect( $frontend_roles, (array) $user->roles ) ) {
			// Frontend capability: only allow updating the media grid
			$grid = isset( $_POST['esi_media_grid'] ) && is_array( $_POST['esi_media_grid'] ) ? array_map( 'absint', $_POST['esi_media_grid'] ) : array();
			// Normalize/pad to 8 slots to make per-item operations predictable
			$grid = array_pad( $grid, 8, 0 );
			update_option( 'esi_media_grid', $grid );
			// Allow frontend editors to update grid layout as well
			if ( isset( $_POST['esi_grid_layout'] ) ) {
				$allowed_layouts = array( '2x3','2x4','2x5','3x3','3x4','3x5' );
				$layout = sanitize_text_field( wp_unslash( $_POST['esi_grid_layout'] ) );
				if ( in_array( $layout, $allowed_layouts, true ) ) {
					update_option( 'esi_grid_layout', $layout );
				}
			}
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

