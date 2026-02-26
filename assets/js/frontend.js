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

        // Build items array and capture thumbnail src if present in DOM
        var items = $all.map(function () {
            var $el = $(this);
        var items = $all.map(function () {
            return {
                href: $(this).attr('href'),
                mime: $(this).data('mime') || ''
            };
        }).get();
            var href = $el.attr('href');
            var mime = $el.data('mime') || '';
            var thumb = '';
            var $img = $el.find('img.esi-thumb');
            if ($img.length) {
                thumb = $img.attr('src') || '';
            } else {
                var $vid = $el.find('video.esi-thumb');
                if ($vid.length) {
                    // prefer poster attribute if present
                    thumb = $vid.attr('poster') || $vid.attr('src') || '';
                }
            }
            return { href: href, mime: mime, thumb: thumb };
        }).get();

        var idx = $all.index($clicked);

        var $overlay = $('<div class="esi-lightbox-overlay" />');
        var $wrap = $('<div class="esi-lightbox-wrap" />');
        var $content = $('<div class="esi-lightbox-content" />');
        var $prev = $('<button class="esi-lb-nav esi-lb-prev" aria-label="Previous">‹</button>');
        var $next = $('<button class="esi-lb-nav esi-lb-next" aria-label="Next">›</button>');
        var $close = $('<button class="esi-lb-close" aria-label="Close">×</button>');
        var $thumbs = $('<div class="esi-lb-thumbs" />');

        function createMediaElement(it) {
            var href = it.href;
            var mime = it.mime || '';
            if (mime.indexOf('image') !== -1 || href.match(/\.(jpg|jpeg|png|gif)(\?.*)?$/i)) {
                return $('<img src="' + href + '" alt="" class="esi-lb-media" />');
            }
            if (mime.indexOf('video') !== -1 || href.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
                return $('<video controls class="esi-lb-media video" src="' + href + '"></video>');
            }
            if (mime.indexOf('audio') !== -1 || href.match(/\.(mp3|wav)(\?.*)?$/i)) {
                return $('<audio controls class="esi-lb-media audio" src="' + href + '"></audio>');
            }
            return $('<a href="' + href + '" target="_blank" rel="noopener">Open file</a>');
        }

        function show(i, direction) {
            if (i < 0) i = items.length - 1;
            if (i >= items.length) i = 0;
            direction = typeof direction === 'undefined' ? 0 : direction;
            var it = items[i];
            var $old = $content.find('.esi-lb-media');
            var $new = createMediaElement(it);
            if (direction >= 0) $new.addClass('enter-from-right'); else $new.addClass('enter-from-left');
            $content.append($new);
            // force reflow
            $new[0].offsetHeight;
            if ($old.length) {
                if (direction >= 0) {
                    $old.addClass('exit-to-left');
                    $new.removeClass('enter-from-right').addClass('enter-to-center');
                } else {
                    $old.addClass('exit-to-right');
                    $new.removeClass('enter-from-left').addClass('enter-to-center');
                }
                $old.one('transitionend webkitTransitionEnd oTransitionEnd', function () { $(this).remove(); });
            } else {
                $new.removeClass('enter-from-right enter-from-left').addClass('enter-to-center');
            }
            idx = i;
            // thumbs
            $thumbs.find('img').removeClass('active');
            $thumbs.find('img[data-index="' + idx + '"]').addClass('active');
            // ensure active thumb visible
            var $active = $thumbs.find('img.active');
            if ($active.length) {
                var left = $active.position().left + $thumbs.scrollLeft() - ($thumbs.width() / 2) + ($active.width() / 2);
                $thumbs.animate({ scrollLeft: left }, 200);
            }
        }

        // build thumbs
        items.forEach(function (it, i) {
            var $t;
            if (it.thumb) {
                $t = $('<img class="esi-lb-thumb" data-index="' + i + '" src="' + it.thumb + '" />');
            } else if (it.mime && it.mime.indexOf('video') === 0) {
                // show video element as thumb when no poster available
                $t = $('<video class="esi-lb-thumb" data-index="' + i + '" muted preload="metadata" src="' + it.href + '"></video>');
            } else {
                $t = $('<img class="esi-lb-thumb" data-index="' + i + '" src="' + it.href + '" />');
            }
            if (i === idx) $t.addClass('active');
            $thumbs.append($t);
        });

        $wrap.append($content).append($prev).append($next).append($close);
        $overlay.append($wrap).append($thumbs);
        $('body').append($overlay);
        show(idx, 0);

        function cleanup() { $overlay.remove(); $(document).off('keydown', keyHandler); }
        function keyHandler(ev) {
            if (ev.key === 'Escape') cleanup();
            if (ev.key === 'ArrowLeft') show(idx - 1, -1);
            if (ev.key === 'ArrowRight') show(idx + 1, 1);
        }

        $(document).on('keydown', keyHandler);
        $prev.on('click', function () { show(idx - 1, -1); });
        $next.on('click', function () { show(idx + 1, 1); });
        $close.on('click', cleanup);
        $overlay.on('click', function (e) { if (e.target === this) cleanup(); });
        $thumbs.on('click', '.esi-lb-thumb', function () { var i = parseInt($(this).attr('data-index'), 10); show(i, i > idx ? 1 : -1); });
    });
});