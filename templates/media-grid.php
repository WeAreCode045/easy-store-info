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
        </div>
    <?php endforeach; ?>
</div>
