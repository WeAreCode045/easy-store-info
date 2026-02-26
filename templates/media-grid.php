<?php
/**
 * Template: media-grid
 * Variables expected: $grid (array of attachment IDs), $layout (string like '2x4')
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div class="esi-media-grid esi-grid-<?php echo esc_attr( $layout ); ?>">
    <?php foreach ( $grid as $idx => $att_id ) : ?>
        <div class="esi-media-item" data-index="<?php echo esc_attr( $idx ); ?>">
            <?php if ( ! empty( $editor ) ) : ?>
                <button type="button" class="esi-drag-handle" aria-label="Drag to reorder">☰</button>
                <?php if ( $att_id && get_post( $att_id ) ) :
                    $url = wp_get_attachment_url( $att_id );
                    $mime = get_post_mime_type( $att_id );
                    // Prefer an image-size thumbnail if available, otherwise expose video src for client-side poster generation
                    $thumb_url = wp_get_attachment_image_url( $att_id, 'medium' );
                ?>
                    <?php if ( $thumb_url ) : ?>
                        <div class="esi-thumb-wrap"><img class="esi-thumb" src="<?php echo esc_url( $thumb_url ); ?>" alt="" /></div>
                    <?php else : ?>
                        <?php if ( strpos( (string) $mime, 'video/' ) === 0 ) : ?>
                            <div class="esi-media-empty" data-video-src="<?php echo esc_url( $url ); ?>" data-mime="<?php echo esc_attr( $mime ); ?>"></div>
                        <?php else : ?>
                            <div class="esi-thumb-wrap"><img class="esi-thumb" src="<?php echo esc_url( $url ); ?>" alt="" /></div>
                        <?php endif; ?>
                    <?php endif; ?>
                    <input type="hidden" name="esi_media_grid[]" value="<?php echo esc_attr( $att_id ); ?>" />
                    <button class="esi-remove-media button" type="button" aria-label="Remove image"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="#b00" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="#b00" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="#b00" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <?php else : ?>
                    <div class="esi-media-empty"></div>
                    <input type="hidden" name="esi_media_grid[]" value="0" />
                    <button class="esi-add-media button" type="button" aria-label="Add image"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="#0b66b2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <?php endif; ?>
            <?php else : ?>
                <?php if ( $att_id && get_post( $att_id ) ) :
                    $mime = get_post_mime_type( $att_id );
                    $url = wp_get_attachment_url( $att_id );
                    $thumb_url = $url;
                ?>
                    <a class="esi-lightbox" href="<?php echo esc_url( $url ); ?>" data-mime="<?php echo esc_attr( $mime ); ?>">
                        <img class="esi-thumb" src="<?php echo esc_url( $thumb_url ); ?>" alt="" />
                    </a>
                <?php else : ?>
                    <div class="esi-media-empty"></div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
</div>
