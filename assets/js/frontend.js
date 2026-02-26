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

        // Insert dropzone into editor sidebar placeholder (bulk upload)
        var $dzPlaceholder = $('.esi-dropzone-placeholder');
        if ($dzPlaceholder.length) {
            var $dz = $('<div class="esi-dropzone" tabindex="0"><div class="esi-dropzone-text">Ziehen Sie Bilder hierher oder klicken, um mehrere hochzuladen</div><div class="esi-dropzone-hint">(PNG, JPG, GIF)</div><div class="esi-dropzone-progress" aria-hidden="true"></div></div>');
            $dzPlaceholder.append($dz);

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
        // selected slot for targeted insertion
        var $selectedSlot = null;

        // click to select slot (only in editor)
        $(document).on('click', '.esi-media-item', function (e) {
            // ignore clicks on buttons/inputs
            if ($(e.target).is('button') || $(e.target).is('input') || $(e.target).closest('button').length) return;
            $('.esi-media-item').removeClass('selected');
            $selectedSlot = $(this);
            $selectedSlot.addClass('selected');
        });

        // Handle file list and upload via WP REST API
        function handleFiles(fileList) {
            if (!fileList || !fileList.length) return;
            var files = Array.prototype.slice.call(fileList);

            // Build list of target slots: if selectedSlot set, start there; otherwise use empties
            var $targets = $();
            if ($selectedSlot && $selectedSlot.length) {
                // start from selected index and go forward
                var startIdx = $selectedSlot.index();
                var $allItems = $('.esi-media-item');
                for (var s = startIdx; s < $allItems.length; s++) { $targets = $targets.add($($allItems.get(s))); }
                // then wrap around to earlier items
                for (var s2 = 0; s2 < startIdx; s2++) { $targets = $targets.add($($allItems.get(s2))); }
            } else {
                // use empty slots first
                $targets = $('.esi-media-item').filter(function () { var v = $(this).find('input[type=hidden]').val(); return !v || v === '0'; });
            }

            // If targets fewer than files, we'll auto-expand by adding new slots
            if (files.length > $targets.length) {
                var need = files.length - $targets.length;
                for (var a = 0; a < need; a++) { $targets = $targets.add(createEmptySlot()); }
            }

            $dz.addClass('uploading');
            var uploadIdx = 0;
            // sequential uploads to map files -> targets
            function nextUpload() {
                if (uploadIdx >= files.length) { $dz.removeClass('uploading'); return; }
                var file = files[uploadIdx];
                if (!file.type.match('image.*')) { uploadIdx++; nextUpload(); return; }
                var $target = $($targets.get(uploadIdx));
                if (!$target || !$target.length) { uploadIdx++; nextUpload(); return; }
                // create overlay UI
                var $overlay = $("<div class='esi-upload-overlay'><div class='esi-upload-percent'>0%</div><div class='esi-upload-progress'><i style='width:0%'></i></div></div>");
                $target.append($overlay);

                uploadFile(file, function (pct) {
                    $overlay.find('.esi-upload-percent').text(Math.round(pct) + '%');
                    $overlay.find('.esi-upload-progress > i').css('width', Math.round(pct) + '%');
                }).done(function (res) {
                    var attId = res.id || 0;
                    var src = res.source_url || res.source_url || '';
                    if (attId && src) {
                        var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + src + '" alt="" /></div>');
                        $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
                        $target.find('.esi-media-empty').replaceWith($thumb);
                        $target.find('input[type=hidden]').val(attId);
                        var $btn = $target.find('.esi-add-media');
                        if ($btn.length) { $btn.replaceWith('<button class="esi-remove-media button" type="button">&times;</button>'); }
                        $overlay.remove();
                        debouncedPersist();
                    } else {
                        showUploadError($overlay, 'Upload failed');
                    }
                }).fail(function (xhr, status, err) {
                    showUploadError($overlay, 'Upload error');
                }).always(function () {
                    uploadIdx++; nextUpload();
                });
            }
            nextUpload();
        }

        function showUploadError($overlay, msg) {
            $overlay.empty();
            var $err = $("<div class='esi-upload-error'></div>").text(msg);
            var $retry = $("<button class='button' type='button'>Retry</button>");
            $retry.on('click', function () {
                var $parent = $overlay.closest('.esi-media-item');
                // attempt to re-upload by simulating file selection (user must retry via dropzone)
                $overlay.remove();
                alert('Please try re-uploading by dropping the file again or using the dropzone.');
            });
            $overlay.append($err).append($retry);
        }

        function createEmptySlot() {
            var $grid = $('.esi-media-grid');
            var idx = $grid.find('.esi-media-item').length;
            var $item = $("<div class='esi-media-item' data-index='" + idx + "'>");
            $item.append('<button type="button" class="esi-drag-handle" aria-label="Drag to reorder">☰</button>');
            $item.append('<div class="esi-media-empty"></div>');
            $item.append('<input type="hidden" name="esi_media_grid[]" value="0" />');
            $item.append('<button class="esi-add-media button" type="button">+</button>');
            $grid.append($item);
            // re-init drag handles
            initMediaDragSort();
            return $item;
        }

        // Upload file to WP media via REST API
            // Upload file to WP media via REST API with progress callback
            function uploadFile(file, onProgress) {
            var url = window.location.origin + '/wp-json/wp/v2/media';
            var fd = new FormData();
            fd.append('file', file, file.name);
                return $.ajax({
                    url: url,
                    method: 'POST',
                    data: fd,
                    processData: false,
                    contentType: false,
                    xhr: function () {
                        var xhr = $.ajaxSettings.xhr();
                        if (xhr.upload && typeof onProgress === 'function') {
                            xhr.upload.addEventListener('progress', function (e) {
                                if (e.lengthComputable) {
                                    var pct = (e.loaded / e.total) * 100;
                                    onProgress(pct);
                                }
                            }, false);
                        }
                        return xhr;
                    },
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