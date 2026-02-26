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
            // Only the handle is draggable; keep items non-draggable
            $('.esi-drag-handle').each(function () { this.setAttribute('draggable', 'true'); });
            $('.esi-media-item').removeAttr('draggable');
            var dragSrcEl = null;
            var pointerDragging = false;

            // Desktop / native drag via handle
            $(document).off('dragstart.handle').on('dragstart.handle', '.esi-drag-handle', function (e) {
                var $item = $(this).closest('.esi-media-item');
                dragSrcEl = $item.get(0);
                e.originalEvent.dataTransfer.effectAllowed = 'move';
                try { e.originalEvent.dataTransfer.setData('text/html', dragSrcEl.outerHTML); } catch (err) {}
                $item.addClass('dragging');
            });

            $(document).off('dragover.item').on('dragover.item', '.esi-media-item', function (e) {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
                $(this).addClass('drag-over');
                return false;
            });

            $(document).off('dragleave.item').on('dragleave.item', '.esi-media-item', function (e) {
                $(this).removeClass('drag-over');
            });

            $(document).off('drop.item').on('drop.item', '.esi-media-item', function (e) {
                e.preventDefault();
                var $target = $(this);
                $target.removeClass('drag-over');
                var $dragging = $(dragSrcEl);
                    if ($dragging.length && $dragging[0] !== $target[0]) {
                    if ($target.index() > $dragging.index()) { $target.after($dragging); }
                    else { $target.before($dragging); }
                    // immediate save on drop
                    persistGridOrder();
                }
                return false;
            });

            $(document).off('dragend.item').on('dragend.item', '.esi-drag-handle', function (e) {
                $('.esi-media-item').removeClass('drag-over');
                if (dragSrcEl) $(dragSrcEl).removeClass('dragging');
                dragSrcEl = null;
            });

            // Pointer-based fallback for touch devices: handle pointerdown on handle
            $(document).off('pointerdown.handle').on('pointerdown.handle', '.esi-drag-handle', function (ev) {
                // only respond to primary button / touch
                if (ev.originalEvent && ev.originalEvent.button && ev.originalEvent.button !== 0) return;
                pointerDragging = true;
                var $handle = $(this);
                dragSrcEl = $handle.closest('.esi-media-item').get(0);
                $(dragSrcEl).addClass('dragging');
                $handle.get(0).setPointerCapture(ev.originalEvent.pointerId);
            });

            $(document).off('pointermove.handle').on('pointermove.handle', function (ev) {
                if (!pointerDragging || !dragSrcEl) return;
                ev.preventDefault();
                var targetEl = document.elementFromPoint(ev.originalEvent.clientX, ev.originalEvent.clientY);
                if (!targetEl) return;
                var $targetItem = $(targetEl).closest('.esi-media-item');
                $('.esi-media-item').removeClass('drag-over');
                if ($targetItem.length && $targetItem.get(0) !== dragSrcEl) {
                    $targetItem.addClass('drag-over');
                }
            });

            $(document).off('pointerup.handle pointercancel.handle').on('pointerup.handle pointercancel.handle', function (ev) {
                if (!pointerDragging) return;
                pointerDragging = false;
                var targetEl = document.elementFromPoint(ev.originalEvent.clientX, ev.originalEvent.clientY);
                var $targetItem = targetEl ? $(targetEl).closest('.esi-media-item') : $();
                var $dragging = $(dragSrcEl);
                $('.esi-media-item').removeClass('drag-over');
                if ($targetItem.length && $dragging.length && $targetItem.get(0) !== $dragging.get(0)) {
                    if ($targetItem.index() > $dragging.index()) { $targetItem.after($dragging); }
                    else { $targetItem.before($dragging); }
                    // on pointer-based interaction use debounced save to avoid many rapid requests
                    debouncedPersist();
                }
                if (dragSrcEl) $(dragSrcEl).removeClass('dragging');
                dragSrcEl = null;
            });
        }

        // init drag sort on load
        initMediaDragSort();

        // Insert dropzone into editor wrapper (bulk upload)
        var $editorWrap = $('.esi-editor-wrapper');
        if ($editorWrap.length) {
            var $dz = $('<div class="esi-dropzone" tabindex="0"><div class="esi-dropzone-text">Ziehen Sie Bilder hierher oder klicken, um mehrere hochzuladen</div><div class="esi-dropzone-hint">(PNG, JPG, GIF)</div><div class="esi-dropzone-progress" aria-hidden="true"></div></div>');
            $editorWrap.prepend($dz);

            // Click to open file picker
            $dz.on('click', function () {
                var $input = $('<input type="file" accept="image/*" multiple style="display:none">');
                $input.on('change', function () { handleFiles(this.files); $input.remove(); });
                $(document.body).append($input);
                $input.trigger('click');
            });

            $dz.on('dragover', function (e) { e.preventDefault(); e.stopPropagation(); $dz.addClass('dragover'); });
            $dz.on('dragleave drop', function (e) { e.preventDefault(); e.stopPropagation(); $dz.removeClass('dragover'); });
            $dz.on('drop', function (e) {
                var dt = e.originalEvent.dataTransfer;
                if (!dt || !dt.files) return;
                handleFiles(dt.files);
            });
        }

        // Handle file list and upload via WP REST API
        function handleFiles(fileList) {
            if (!fileList || !fileList.length) return;
            var files = Array.prototype.slice.call(fileList);
            var emptyInputs = $('.esi-media-item').find('input[type=hidden]').filter(function () { return !this.value || this.value === '0'; });
            if (emptyInputs.length === 0) {
                alert('Keine freien Slots verfügbar. Leeren Sie einen Slot oder ändern Sie das Grid-Layout.');
                return;
            }
            var maxUploads = Math.min(files.length, emptyInputs.length);
            $dz.addClass('uploading');
            var uploadCount = 0;
            files.slice(0, maxUploads).forEach(function (file, i) {
                // only images
                if (!file.type.match('image.*')) { return; }
                uploadFile(file).done(function (res) {
                    // res should be attachment object
                    var attId = res.id || 0;
                    var src = res.source_url || res.source_url || '';
                    if (!attId || !src) return;
                    // assign to next empty slot
                    var $input = $(emptyInputs.get(uploadCount));
                    var $item = $input.closest('.esi-media-item');
                    var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + src + '" alt="" /></div>');
                    $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
                    $item.find('.esi-media-empty').replaceWith($thumb);
                    $input.val(attId);
                    // replace add button with remove if present
                    var $btn = $item.find('.esi-add-media');
                    if ($btn.length) { $btn.replaceWith('<button class="esi-remove-media button" type="button">&times;</button>'); }
                    uploadCount++;
                    // save state after each successful upload (debounced behavior already applied elsewhere)
                    debouncedPersist();
                }).fail(function () {
                    // ignore single failure
                }).always(function () {
                    if (--maxUploads <= 0) { $dz.removeClass('uploading'); }
                });
            });
        }

        // Upload file to WP media via REST API
        function uploadFile(file) {
            var url = window.location.origin + '/wp-json/wp/v2/media';
            var fd = new FormData();
            fd.append('file', file, file.name);
            // jQuery deferred
            return $.ajax({
                url: url,
                method: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                beforeSend: function (xhr) {
                    if (typeof esiSettings !== 'undefined' && esiSettings.rest_nonce) {
                        xhr.setRequestHeader('X-WP-Nonce', esiSettings.rest_nonce);
                    }
                }
            });
        }

        // Persist current grid order via AJAX (auto-save)
        function persistGridOrder() {
            var grid = [];
            $('.esi-media-item').each(function () {
                var val = $(this).find('input[type=hidden]').val() || 0;
                grid.push(parseInt(val, 10) || 0);
            });
            var data = [];
            for (var i = 0; i < grid.length; i++) { data.push({ name: 'esi_media_grid[]', value: grid[i] }); }
            data.push({ name: 'action', value: 'esi_save_settings' });
            // use esiSettings (localized by frontend handler)
            if (typeof esiSettings !== 'undefined') {
                data.push({ name: 'nonce', value: esiSettings.nonce });
                return $.post(esiSettings.ajax_url, data).done(function (res) {
                    // optionally update preview returned by server for admin users
                    if (res && res.success && res.data && res.data.opening_hours_html) {
                        $('#esi-opening-hours-placeholder').html(res.data.opening_hours_html);
                    }
                }).fail(function () {
                    // ignore failures silently for now
                });
            }
            return $.Deferred().resolve();
        }

        // Simple debounce helper
        function debounce(fn, wait) {
            var t;
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