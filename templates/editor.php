<?php
/**
 * Template: frontend editor (settings shortcode)
 * Variables: $grid, $layout, $use_google_hours, $manual_hours, $weekdays, $user_display_name, $general_info
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
if ( ! is_user_logged_in() ) {
    auth_redirect();
}
$use_google = isset( $use_google_hours ) ? (bool) $use_google_hours : true;
$manual = isset( $manual_hours ) && is_array( $manual_hours ) ? $manual_hours : array();
$weekdays_list = isset( $weekdays ) && is_array( $weekdays ) ? $weekdays : array( 0 => 'Sonntag', 1 => 'Montag', 2 => 'Dienstag', 3 => 'Mittwoch', 4 => 'Donnerstag', 5 => 'Freitag', 6 => 'Samstag' );
$order = array( 1, 2, 3, 4, 5, 6, 0 );
$display_name = isset( $user_display_name ) ? esc_html( $user_display_name ) : '';
$general = isset( $general_info ) && is_array( $general_info ) ? $general_info : array();
$title_val = isset( $general['title'] ) ? $general['title'] : '';
$subtitle_val = isset( $general['subtitle'] ) ? $general['subtitle'] : '';
$about = isset( $general['about_text'] ) ? $general['about_text'] : '';
$payment = isset( $general['payment_details'] ) ? $general['payment_details'] : '';
$footer = isset( $general['footer_text'] ) ? $general['footer_text'] : '';
$contact_email = isset( $general['contact_email'] ) ? $general['contact_email'] : '';
$store_address = isset( $general['store_address'] ) ? $general['store_address'] : '';
$social_links = isset( $general['social_links'] ) && is_array( $general['social_links'] ) ? $general['social_links'] : array();
if ( empty( $social_links ) ) {
    $social_links = array( array( 'icon' => '', 'url' => '' ) );
}
$editor_settings = array( 'textarea_rows' => 6, 'media_buttons' => true, 'teeny' => true, 'quicktags' => true, 'textarea_name' => 'esi_wysiwyg_placeholder', 'editor_class' => 'esi-wysiwyg' );
?>
<div class="esi-settings-wrap esi-frontend-editor">
    <header class="esi-editor-header">
        <p class="esi-welcome-msg"><?php echo esc_html( sprintf( __( 'Willkommen, %s', 'easy-store-info' ), $display_name ) ); ?></p>
        <nav class="esi-editor-tabs" role="tablist">
            <button type="button" class="esi-tab esi-tab-active" role="tab" data-tab="general" aria-selected="true"><?php esc_html_e( 'General info', 'easy-store-info' ); ?></button>
            <button type="button" class="esi-tab" role="tab" data-tab="media" aria-selected="false"><?php esc_html_e( 'Media Gallery', 'easy-store-info' ); ?></button>
            <button type="button" class="esi-tab" role="tab" data-tab="account" aria-selected="false"><?php esc_html_e( 'Account', 'easy-store-info' ); ?></button>
        </nav>
    </header>

    <!-- Tab: General info -->
    <div class="esi-tab-panel esi-tab-general" role="tabpanel" id="esi-panel-general">
        <form id="esi-general-info-form" class="esi-general-form">
            <div class="esi-general-two-col">
                <div class="esi-general-left">
                    <div class="esi-form-section">
                        <label for="esi_title"><?php esc_html_e( 'Title', 'easy-store-info' ); ?></label>
                        <input type="text" id="esi_title" name="esi_title" value="<?php echo esc_attr( $title_val ); ?>" class="esi-input-wide" />
                    </div>
                    <div class="esi-form-section">
                        <label for="esi_subtitle"><?php esc_html_e( 'Subtitle', 'easy-store-info' ); ?></label>
                        <input type="text" id="esi_subtitle" name="esi_subtitle" value="<?php echo esc_attr( $subtitle_val ); ?>" class="esi-input-wide" />
                    </div>
                    <div class="esi-form-section">
                        <label><?php esc_html_e( 'About text', 'easy-store-info' ); ?></label>
                        <?php
                        wp_editor( $about, 'esi_about_text', array_merge( $editor_settings, array( 'textarea_name' => 'esi_about_text' ) ) );
                        ?>
                    </div>
                    <div class="esi-form-section">
                        <label><?php esc_html_e( 'Payment details', 'easy-store-info' ); ?></label>
                        <?php
                        wp_editor( $payment, 'esi_payment_details', array_merge( $editor_settings, array( 'textarea_name' => 'esi_payment_details' ) ) );
                        ?>
                    </div>
                    <div class="esi-form-section">
                        <label><?php esc_html_e( 'Footer text', 'easy-store-info' ); ?></label>
                        <?php
                        wp_editor( $footer, 'esi_footer_text', array_merge( $editor_settings, array( 'textarea_name' => 'esi_footer_text' ) ) );
                        ?>
                    </div>
                    <div class="esi-form-section esi-social-links-wrap">
                        <label><?php esc_html_e( 'Social media links', 'easy-store-info' ); ?></label>
                        <div class="esi-social-links" id="esi-social-links">
                            <?php foreach ( $social_links as $idx => $link ) : ?>
                            <div class="esi-social-row">
                                <input type="text" class="esi-social-icon" placeholder="<?php esc_attr_e( 'Icon (e.g. facebook, instagram)', 'easy-store-info' ); ?>" value="<?php echo esc_attr( $link['icon'] ?? '' ); ?>" />
                                <input type="url" class="esi-social-url" placeholder="https://..." value="<?php echo esc_url( $link['url'] ?? '' ); ?>" />
                                <button type="button" class="esi-social-remove button" aria-label="<?php esc_attr_e( 'Remove', 'easy-store-info' ); ?>">−</button>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        <button type="button" class="esi-social-add button button-secondary"><?php esc_html_e( '+ Add link', 'easy-store-info' ); ?></button>
                    </div>
                    <div class="esi-form-section">
                        <label for="esi_contact_email"><?php esc_html_e( 'Contact e-mail', 'easy-store-info' ); ?></label>
                        <input type="email" id="esi_contact_email" name="esi_contact_email" value="<?php echo esc_attr( $contact_email ); ?>" class="esi-input-wide" />
                    </div>
                </div>
                <div class="esi-general-right">
                    <div class="esi-form-section">
                        <label for="esi_store_address"><?php esc_html_e( 'Store address', 'easy-store-info' ); ?></label>
                        <textarea id="esi_store_address" name="esi_store_address" rows="5" class="esi-input-wide"><?php echo esc_textarea( $store_address ); ?></textarea>
                    </div>
                    <div class="esi-form-section esi-opening-hours-editor">
                        <h4 class="esi-oh-title"><?php esc_html_e( 'Öffnungszeiten', 'easy-store-info' ); ?></h4>
                        <div class="esi-oh-toggle-wrap">
                            <label class="esi-toggle-label">
                                <span class="esi-toggle-text"><?php esc_html_e( 'Google Places verwenden', 'easy-store-info' ); ?></span>
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
                                    <label class="esi-check-closed"><input type="checkbox" class="esi-closed-cb" <?php checked( $closed ); ?> /> <?php esc_html_e( 'Geschlossen', 'easy-store-info' ); ?></label>
                                    <div class="esi-time-row<?php echo $closed ? ' is-disabled' : ''; ?>">
                                        <input type="time" class="esi-open-time" value="<?php echo $open; ?>" <?php echo $closed ? 'disabled' : ''; ?> />
                                        <span>–</span>
                                        <input type="time" class="esi-close-time" value="<?php echo $close; ?>" <?php echo $closed ? 'disabled' : ''; ?> />
                                    </div>
                                    <label class="esi-break-wrap"><input type="checkbox" class="esi-break-cb" <?php checked( $break_enabled ); ?> <?php echo $closed ? 'disabled' : ''; ?> /> <?php esc_html_e( 'Pause', 'easy-store-info' ); ?></label>
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
                </div>
            </div>
            <p class="esi-form-actions">
                <button type="submit" class="button button-primary"><?php esc_html_e( 'Save General Info', 'easy-store-info' ); ?></button>
            </p>
            <p class="esi-general-message" aria-live="polite"></p>
        </form>
    </div>

    <!-- Tab: Media Gallery -->
    <div class="esi-tab-panel esi-tab-media" role="tabpanel" id="esi-panel-media" hidden>
        <form id="esi-editor-form">
            <div class="esi-editor-panel">
                <div class="esi-editor-left">
                    <?php $this->get_template( 'media-grid.php', array( 'grid' => $grid, 'layout' => $layout, 'editor' => true ) ); ?>
                </div>
                <aside class="esi-editor-sidebar">
                    <p class="esi-editor-instructions"><?php esc_html_e( 'Ziehen Sie Elemente mit dem Griff ☰, um die Reihenfolge zu ändern. Änderungen werden automatisch gespeichert.', 'easy-store-info' ); ?></p>
                    <div class="esi-layout-control">
                        <label for="esi_grid_layout"><?php esc_html_e( 'Grid layout', 'easy-store-info' ); ?></label>
                        <select id="esi_grid_layout" name="esi_grid_layout">
                            <?php
                            $layouts = array( '2x3' => '2 × 3', '2x4' => '2 × 4', '2x5' => '2 × 5', '3x3' => '3 × 3', '3x4' => '3 × 4', '3x5' => '3 × 5' );
                            foreach ( $layouts as $key => $lbl ) {
                                $sel = selected( $layout, $key, false );
                                echo '<option value="' . esc_attr( $key ) . '" ' . $sel . '>' . esc_html( $lbl ) . '</option>';
                            }
                            ?>
                        </select>
                    </div>
                    <div class="esi-dropzone-placeholder"></div>
                    <div class="esi-sidebar-actions">
                        <button class="button button-primary esi-save-button" type="submit"><?php esc_html_e( 'Save Grid', 'easy-store-info' ); ?></button>
                    </div>
                </aside>
            </div>
        </form>
    </div>

    <!-- Tab: Account -->
    <div class="esi-tab-panel esi-tab-account" role="tabpanel" id="esi-panel-account" hidden>
        <div class="esi-accounts-panel">
            <h3 class="esi-accounts-title"><?php esc_html_e( 'Passwort ändern', 'easy-store-info' ); ?></h3>
            <form id="esi-password-form" class="esi-password-form">
                <p class="esi-form-row">
                    <label for="esi_current_password"><?php esc_html_e( 'Aktuelles Passwort', 'easy-store-info' ); ?></label>
                    <input type="password" id="esi_current_password" name="current_password" autocomplete="current-password" required />
                </p>
                <p class="esi-form-row">
                    <label for="esi_new_password"><?php esc_html_e( 'Neues Passwort', 'easy-store-info' ); ?></label>
                    <input type="password" id="esi_new_password" name="new_password" autocomplete="new-password" minlength="8" required />
                    <span class="esi-hint"><?php esc_html_e( 'Mindestens 8 Zeichen', 'easy-store-info' ); ?></span>
                </p>
                <p class="esi-form-row">
                    <label for="esi_confirm_password"><?php esc_html_e( 'Passwort bestätigen', 'easy-store-info' ); ?></label>
                    <input type="password" id="esi_confirm_password" name="confirm_password" autocomplete="new-password" required />
                </p>
                <p class="esi-form-actions">
                    <button type="submit" class="button button-primary"><?php esc_html_e( 'Passwort speichern', 'easy-store-info' ); ?></button>
                </p>
                <p class="esi-password-message" aria-live="polite"></p>
            </form>
        </div>
    </div>
</div>
