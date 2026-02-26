<?php
/**
 * Template: frontend editor (settings shortcode)
 * Variables expected: $grid (array), $layout (string), $opening_hours_html (optional)
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
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
