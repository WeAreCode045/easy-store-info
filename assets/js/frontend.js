/**
 * All of the JS for your frontend-specific functionality should be
 * included in this file.
 */
jQuery(function ($) {
    // Lightbox handler
    $(document).on('click', '.esi-lightbox', function (e) {
        e.preventDefault();
        var href = $(this).attr('href');
        var mime = $(this).data('mime') || '';
        var $overlay = $('<div class="esi-lightbox-overlay" />');
        var $content = $('<div class="esi-lightbox-content" />');
        if (mime.indexOf('image') !== -1 || href.match(/\.(jpg|jpeg|png|gif)(\?.*)?$/i)) {
            $content.append('<img src="' + href + '" alt="" />');
        } else if (mime.indexOf('video') !== -1 || href.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
            $content.append('<video controls src="' + href + '"></video>');
        } else if (mime.indexOf('audio') !== -1 || href.match(/\.(mp3|wav)(\?.*)?$/i)) {
            $content.append('<audio controls src="' + href + '"></audio>');
        } else {
            $content.append('<a href="' + href + '" target="_blank" rel="noopener">Open file</a>');
        }
        $overlay.append($content).appendTo('body').on('click', function (ev) {
            if (ev.target === this) { $(this).remove(); }
        });
    });

    // Settings page: media modal and save
    if ($('.esi-settings-wrap').length) {
        var frame;
        $(document).on('click', '.esi-add-media', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var $item = $btn.closest('.esi-media-item');
            if (frame) { frame.open(); return; }
            frame = wp.media({ title: 'Select media', button: { text: 'Select' }, multiple: false });
            frame.on('select', function () {
                var attachment = frame.state().get('selection').first().toJSON();
                $item.find('input[type=hidden]').val(attachment.id);
                var img = attachment.sizes && attachment.sizes.medium ? attachment.sizes.medium.url : attachment.url;
                $item.find('.esi-media-empty').replaceWith('<div class="esi-thumb-wrap"><img src="' + img + '" /></div>');
                $btn.replaceWith('<button class="esi-remove-media button" type="button">&times;</button>');
            });
            frame.open();
        });

        $(document).on('click', '.esi-remove-media', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var $item = $btn.closest('.esi-media-item');
            $item.find('input[type=hidden]').val(0);
            $item.find('.esi-thumb-wrap').replaceWith('<div class="esi-media-empty"></div>');
            $btn.replaceWith('<button class="esi-add-media button" type="button">+</button>');
        });

        $('#esi-settings-form').on('submit', function (e) {
            e.preventDefault();
            // Build ordered grid array from each media item input to ensure correct indexing
            var grid = [];
            $('.esi-media-item').each(function () {
                var val = $(this).find('input[type=hidden]').val() || 0;
                grid.push(parseInt(val, 10) || 0);
            });

            // Build POST payload with explicit esi_media_grid[] entries
            var data = [];
            for (var i = 0; i < grid.length; i++) {
                data.push({ name: 'esi_media_grid[]', value: grid[i] });
            }
            data.push({ name: 'action', value: 'esi_save_settings' });
            data.push({ name: 'nonce', value: esiSettings.nonce });

            $.post(esiSettings.ajax_url, data, function (res) {
                if (res.success) {
                    alert('Settings saved');
                } else {
                    alert('Error saving settings');
                }
            }).fail(function () {
                alert('AJAX error');
            });
        });
    }
});