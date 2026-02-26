/**
 * All of the JS for your frontend-specific functionality should be
 * included in this file.
 */
jQuery(function ($) {
    // Slider lightbox handler (supports previous/next)
    $(document).on('click', '.esi-lightbox', function (e) {
        e.preventDefault();
        var $clicked = $(this);
        var $all = $('.esi-lightbox');
        if (!$all.length) return;

        // Build items array
        var items = $all.map(function () {
            return {
                href: $(this).attr('href'),
                mime: $(this).data('mime') || ''
            };
        }).get();

        var idx = $all.index($clicked);

        var $overlay = $('<div class="esi-lightbox-overlay" />');
        var $container = $('<div class="esi-lightbox-wrap" />');
        var $content = $('<div class="esi-lightbox-content" />');
        var $prev = $('<button class="esi-lb-nav esi-lb-prev" aria-label="Previous">‹</button>');
        var $next = $('<button class="esi-lb-nav esi-lb-next" aria-label="Next">›</button>');

        function render(i) {
            $content.empty();
            var it = items[i];
            if (!it) return;
            var href = it.href;
            var mime = it.mime;
            if (mime.indexOf('image') !== -1 || href.match(/\.(jpg|jpeg|png|gif)(\?.*)?$/i)) {
                $content.append('<img src="' + href + '" alt="" class="esi-lb-media" />');
            } else if (mime.indexOf('video') !== -1 || href.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
                $content.append('<video controls class="esi-lb-media" src="' + href + '"></video>');
            } else if (mime.indexOf('audio') !== -1 || href.match(/\.(mp3|wav)(\?.*)?$/i)) {
                $content.append('<audio controls class="esi-lb-media" src="' + href + '"></audio>');
            } else {
                $content.append('<a href="' + href + '" target="_blank" rel="noopener">Open file</a>');
            }
        }

        function show(index) {
            if (index < 0) index = items.length - 1;
            if (index >= items.length) index = 0;
            idx = index;
            render(idx);
        }

        $prev.on('click', function (ev) { ev.stopPropagation(); show(idx - 1); });
        $next.on('click', function (ev) { ev.stopPropagation(); show(idx + 1); });

        // Close handler
        $overlay.on('click', function (ev) {
            if (ev.target === this) { close(); }
        });

        function keyHandler(ev) {
            if (ev.key === 'Escape') { close(); }
            if (ev.key === 'ArrowLeft') { show(idx - 1); }
            if (ev.key === 'ArrowRight') { show(idx + 1); }
        }

        function close() {
            $(document).off('keydown', keyHandler);
            $overlay.remove();
        }

        // Assemble and open
        $container.append($prev, $content, $next);
        $overlay.append($container).appendTo('body');
        show(idx);
        $(document).on('keydown', keyHandler);
    });

    // Settings page: media modal and save
    if ($('.esi-settings-wrap').length) {
        var frame;
        $(document).on('click', '.esi-add-media', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var $item = $btn.closest('.esi-media-item');
                if (frame) {
                    // Rebind select handler for the currently clicked item
                    try { frame.off('select'); } catch (e) { /* ignore */ }
                    frame.on('select', function () {
                        var attachment = frame.state().get('selection').first().toJSON();
                        $item.find('input[type=hidden]').val(attachment.id);
                        var img = attachment.url || (attachment.sizes && attachment.sizes.full ? attachment.sizes.full.url : '');
                        var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + img + '" /></div>');
                        $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
                        $item.find('.esi-media-empty').replaceWith($thumb);
                        $btn.replaceWith('<button class="esi-remove-media button" type="button">&times;</button>');
                    });
                    frame.open();
                    return;
                }
                frame = wp.media({ title: 'Select media', button: { text: 'Select' }, multiple: false });
                frame.on('select', function () {
                    var attachment = frame.state().get('selection').first().toJSON();
                    $item.find('input[type=hidden]').val(attachment.id);
                        var img = attachment.url || (attachment.sizes && attachment.sizes.full ? attachment.sizes.full.url : '');
                        var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + img + '" /></div>');
                    $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
                    $item.find('.esi-media-empty').replaceWith($thumb);
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