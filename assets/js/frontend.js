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
                var $active = $thumbs.find('img.active');
                if ($active.length) {
                    var aLeft = $active.position().left + $thumbs.scrollLeft();
                    var aRight = aLeft + $active.outerWidth();
                    var viewLeft = $thumbs.scrollLeft();
                    var viewRight = viewLeft + $thumbs.innerWidth();
                    if (aLeft < viewLeft) { $thumbs.animate({scrollLeft: aLeft}, 200); }
                    else if (aRight > viewRight) { $thumbs.animate({scrollLeft: aRight - $thumbs.innerWidth()}, 200); }
                }
            }
        }

        $prev.on('click', function (ev) { ev.stopPropagation(); show(idx - 1, -1); });
        $next.on('click', function (ev) { ev.stopPropagation(); show(idx + 1, 1); });

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

        // build thumbs strip
        items.forEach(function (it, i) {
            var $t = $('<img class="esi-lb-thumb" data-index="' + i + '" src="' + it.href + '" alt="" />');
            $thumbs.append($t);
        });
        $thumbs.on('click', 'img', function (ev) { ev.stopPropagation(); var i = parseInt($(this).data('index'), 10); show(i); });

        // Assemble and open
        $container.append($prev, $content, $next);
        $overlay.append($container).append($thumbs).append($close).appendTo('body');
        $close.on('click', function (ev) { ev.stopPropagation(); close(); });
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

        // Make media items draggable to reorder the grid
        function initMediaDragSort() {
            $('.esi-media-item').attr('draggable', 'true');
            var dragSrcEl = null;

            $(document).on('dragstart', '.esi-media-item', function (e) {
                dragSrcEl = this;
                e.originalEvent.dataTransfer.effectAllowed = 'move';
                try { e.originalEvent.dataTransfer.setData('text/html', this.outerHTML); } catch (err) {}
                $(this).addClass('dragging');
            });

            $(document).on('dragover', '.esi-media-item', function (e) {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
                $(this).addClass('drag-over');
                return false;
            });

            $(document).on('dragleave', '.esi-media-item', function (e) {
                $(this).removeClass('drag-over');
            });

            $(document).on('drop', '.esi-media-item', function (e) {
                e.preventDefault();
                var $target = $(this);
                $target.removeClass('drag-over');
                var $dragging = $(dragSrcEl);
                if ($dragging.length && $dragging[0] !== $target[0]) {
                    // Insert before or after depending on positions
                    if ($target.index() > $dragging.index()) {
                        $target.after($dragging);
                    } else {
                        $target.before($dragging);
                    }
                }
                return false;
            });

            $(document).on('dragend', '.esi-media-item', function () {
                $(this).removeClass('dragging');
                $('.esi-media-item').removeClass('drag-over');
            });
        }

        // init drag sort on load
        initMediaDragSort();

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