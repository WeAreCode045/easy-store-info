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
        var $close = $('<button class="esi-lb-close" aria-label="Close">×</button>');
        var $thumbs = $('<div class="esi-lb-thumbs" />');

        function createMediaElement(it) {
            var href = it.href;
            var mime = it.mime;
            var $el;
            if (mime.indexOf('image') !== -1 || href.match(/\.(jpg|jpeg|png|gif)(\?.*)?$/i)) {
                $el = $('<img src="' + href + '" alt="" class="esi-lb-media" />');
            } else if (mime.indexOf('video') !== -1 || href.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
                $el = $('<video controls class="esi-lb-media video" src="' + href + '"></video>');
            } else if (mime.indexOf('audio') !== -1 || href.match(/\.(mp3|wav)(\?.*)?$/i)) {
                $el = $('<audio controls class="esi-lb-media audio" src="' + href + '"></audio>');
            } else {
                $el = $('<a href="' + href + '" target="_blank" rel="noopener">Open file</a>');
            }
            return $el;
        }

        function show(index, direction) {
            if (index < 0) index = items.length - 1;
            if (index >= items.length) index = 0;
            direction = typeof direction === 'undefined' ? 0 : direction;
            var newIdx = index;
            var it = items[newIdx];
            var $old = $content.find('.esi-lb-media');
            var $new = createMediaElement(it);
            // position incoming
            if (direction >= 0) {
                // next: incoming from right
                $new.addClass('enter-from-right');
            } else {
                // prev: incoming from left
                $new.addClass('enter-from-left');
            }
            $content.append($new);
            // force reflow
            $new[0].offsetHeight;
            // animate
            if ($old.length) {
                if (direction >= 0) {
                    $old.addClass('exit-to-left');
                    $new.removeClass('enter-from-right').addClass('enter-to-center');
                } else {
                    $old.addClass('exit-to-right');
                    $new.removeClass('enter-from-left').addClass('enter-to-center');
                }
                // after transition, remove old
                $old.one('transitionend webkitTransitionEnd oTransitionEnd', function () {
                    $(this).remove();
                });
            } else {
                $new.removeClass('enter-from-right enter-from-left').addClass('enter-to-center');
            }
            idx = newIdx;
            // update active thumb
            if ($thumbs && $thumbs.length) {
                $thumbs.find('img').removeClass('active');
                $thumbs.find('img[data-index="' + idx + '"]').addClass('active');
                // ensure active thumb visible
                show(idx);
                $(document).on('keydown', keyHandler);
            });
        });
            return function () {
                var ctx = this, args = arguments;
                clearTimeout(t);
                t = setTimeout(function () { fn.apply(ctx, args); }, wait);
            };
        }

        // Debounced wrapper to reduce rapid requests
        var debouncedPersist = debounce(function () { persistGridOrder(); }, 700);

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
            // include frontend layout setting when present
            var layoutVal = $('#esi_grid_layout').length ? $('#esi_grid_layout').val() : null;
            if (layoutVal) { data.push({ name: 'esi_grid_layout', value: layoutVal }); }
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