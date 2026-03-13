<?php
/**
 * Template: frontend editor (settings shortcode)
 * Variables expected: $grid (array), $layout (string), $use_google_hours (bool), $manual_hours (array), $weekdays (array)
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
// Redirect guests to the WP login page when accessing the frontend editor
if ( ! is_user_logged_in() ) {
    auth_redirect();
}
$use_google = isset( $use_google_hours ) ? (bool) $use_google_hours : true;
$manual = isset( $manual_hours ) && is_array( $manual_hours ) ? $manual_hours : array();
$weekdays_list = isset( $weekdays ) && is_array( $weekdays ) ? $weekdays : array( 0 => 'Sonntag', 1 => 'Montag', 2 => 'Dienstag', 3 => 'Mittwoch', 4 => 'Donnerstag', 5 => 'Freitag', 6 => 'Samstag' );
$order = array( 1, 2, 3, 4, 5, 6, 0 );
?>
<div class="esi-settings-wrap esi-frontend-editor"><form id="esi-editor-form">
    <div class="esi-editor-panel">
        <div class="esi-editor-left">
            <?php
            // Render media grid using the media-grid template in editor mode
            $this->get_template( 'media-grid.php', array( 'grid' => $grid, 'layout' => $layout, 'editor' => true ) );
            ?>
        </div>
        <aside class="esi-editor-sidebar">
            <p class="esi-editor-instructions">Ziehen Sie Elemente mit dem Griff ☰, um die Reihenfolge zu ändern. Änderungen werden automatisch gespeichert.</p>

            <div class="esi-opening-hours-editor">
                <h3 class="esi-oh-title">Öffnungszeiten</h3>
                <div class="esi-oh-toggle-wrap">
                    <label class="esi-toggle-label">
                        <span class="esi-toggle-text">Google Places verwenden</span>
                        <input type="checkbox" id="esi_use_google_hours" name="esi_use_google_hours" value="1" <?php checked( $use_google ); ?> class="esi-toggle-input" />
                        <span class="esi-toggle-switch"></span>
                    </label>
                </div>
                <div class="esi-manual-hours-wrap" style="<?php echo $use_google ? 'display:none' : ''; ?>">
                    <?php foreach ( $order as $day_idx ) :
                        $d = $manual[ $day_idx ] ?? array();
                        $closed = ! empty( $d['closed'] );
                        $open = isset( $d['open'] ) ? esc_attr( $d['open'] ) : '09:00';
                        $close = isset( $d['close'] ) ? esc_attr( $d['close'] ) : '18:00';
                        $break_enabled = ! empty( $d['break_enabled'] );
                        $break_start = isset( $d['break_start'] ) ? esc_attr( $d['break_start'] ) : '12:00';
                        $break_end = isset( $d['break_end'] ) ? esc_attr( $d['break_end'] ) : '13:00';
                        $label = isset( $weekdays_list[ $day_idx ] ) ? $weekdays_list[ $day_idx ] : $day_idx;
                    ?>
                    <div class="esi-day-row" data-day="<?php echo (int) $day_idx; ?>">
                        <span class="esi-day-label"><?php echo esc_html( $label ); ?></span>
                        <div class="esi-day-fields">
                            <label class="esi-check-closed">
                                <input type="checkbox" class="esi-closed-cb" <?php checked( $closed ); ?> /> Geschlossen
                            </label>
                            <div class="esi-time-row<?php echo $closed ? ' is-disabled' : ''; ?>">
                                <input type="time" class="esi-open-time" value="<?php echo $open; ?>" <?php echo $closed ? 'disabled' : ''; ?> />
                                <span>–</span>
                                <input type="time" class="esi-close-time" value="<?php echo $close; ?>" <?php echo $closed ? 'disabled' : ''; ?> />
                            </div>
                            <label class="esi-break-wrap">
                                <input type="checkbox" class="esi-break-cb" <?php checked( $break_enabled ); ?> <?php echo $closed ? 'disabled' : ''; ?> /> Pause
                            </label>
                            <div class="esi-break-times<?php echo ( $break_enabled && ! $closed ) ? '' : ' is-hidden'; ?>">
                                <input type="time" class="esi-break-start" value="<?php echo $break_start; ?>" <?php echo $closed ? 'disabled' : ''; ?> />
                                <span>–</span>
                                <input type="time" class="esi-break-end" value="<?php echo $break_end; ?>" <?php echo $closed ? 'disabled' : ''; ?> />
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="esi-layout-control">
                <label for="esi_grid_layout">Grid layout</label>
                <select id="esi_grid_layout" name="esi_grid_layout">
                    <?php
                    $layouts = array( '2x3' => '2 × 3', '2x4' => '2 × 4', '2x5' => '2 × 5', '3x3' => '3 × 3', '3x4' => '3 × 4', '3x5' => '3 × 5' );
                    foreach ( $layouts as $key => $label ) {
                        $sel = selected( $layout, $key, false );
                        echo '<option value="' . esc_attr( $key ) . '" ' . $sel . '>' . esc_html( $label ) . '</option>';
                    }
                    ?>
                </select>
            </div>
            <div class="esi-dropzone-placeholder"></div>
                <div class="esi-sidebar-actions">
                <button class="button button-primary esi-save-button" type="submit">Save Grid</button>
            </div>
        </aside>
    </div>
</form></div>
