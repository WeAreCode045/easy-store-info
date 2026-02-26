// Editor script (copy of frontend-editor.js)
// This file was created to match requested structure: assets/js/editor.js

jQuery(function ($) {
    // Settings page: media modal and save
    var frame;
    var addBtnHtml = '<button class="esi-add-media button" type="button" aria-label="Add image">' +
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M12 5v14M5 12h14" stroke="#0b66b2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>';
    var removeBtnHtml = '<button class="esi-remove-media button" type="button" aria-label="Remove image">' +
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M3 6h18" stroke="#b00" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="#b00" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="#b00" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>';
    $(document).on('click', '.esi-add-media', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $item = $btn.closest('.esi-media-item');
            if (frame) {
                try { frame.off('select'); } catch (e) { }
                frame.on('select', function () {
                    var attachment = frame.state().get('selection').first().toJSON();
                    $item.find('input[type=hidden]').val(attachment.id);
                    var img = attachment.url || (attachment.sizes && attachment.sizes.full ? attachment.sizes.full.url : '');
                    var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + img + '" /></div>');
                    $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
                    $item.find('.esi-media-empty').replaceWith($thumb);
                    $btn.replaceWith(removeBtnHtml);
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
                $btn.replaceWith(removeBtnHtml);
            });
            frame.open();
    });

    $(document).on('click', '.esi-remove-media', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $item = $btn.closest('.esi-media-item');
        $item.find('input[type=hidden]').val(0);
            $item.find('.esi-thumb-wrap').replaceWith('<div class="esi-media-empty"></div>');
            $btn.replaceWith(addBtnHtml);
    });

    function initMediaDragSort() {
        $('.esi-drag-handle').each(function () { this.setAttribute('draggable', 'true'); });
        $('.esi-media-item').removeAttr('draggable');
        var dragSrcEl = null;
        var pointerDragging = false;

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
                persistGridOrder();
            }
            return false;
        });

        $(document).off('dragend.item').on('dragend.item', '.esi-drag-handle', function (e) {
            $('.esi-media-item').removeClass('drag-over');
            if (dragSrcEl) $(dragSrcEl).removeClass('dragging');
            dragSrcEl = null;
        });

        $(document).off('pointerdown.handle').on('pointerdown.handle', '.esi-drag-handle', function (ev) {
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
                debouncedPersist();
            }
            if (dragSrcEl) $(dragSrcEl).removeClass('dragging');
            dragSrcEl = null;
        });
    }

    initMediaDragSort();

    var $dzPlaceholder = $('.esi-dropzone-placeholder');
    if ($dzPlaceholder.length) {
        var $dz = $('<div class="esi-dropzone" tabindex="0"><div class="esi-dropzone-text">Ziehen Sie Bilder hierher oder klicken, um mehrere hochzuladen</div><div class="esi-dropzone-hint">(PNG, JPG, GIF)</div><div class="esi-dropzone-progress" aria-hidden="true"></div></div>');
        $dzPlaceholder.append($dz);

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

    var $selectedSlot = null;

    $(document).on('click', '.esi-media-item', function (e) {
        if ($(e.target).is('button') || $(e.target).is('input') || $(e.target).closest('button').length) return;
        $('.esi-media-item').removeClass('selected');
        $selectedSlot = $(this);
        $selectedSlot.addClass('selected');
    });

    function handleFiles(fileList) {
        if (!fileList || !fileList.length) return;
        var files = Array.prototype.slice.call(fileList);

        var $targets = $();
        if ($selectedSlot && $selectedSlot.length) {
            var startIdx = $selectedSlot.index();
            var $allItems = $('.esi-media-item');
            for (var s = startIdx; s < $allItems.length; s++) { $targets = $targets.add($($allItems.get(s))); }
            for (var s2 = 0; s2 < startIdx; s2++) { $targets = $targets.add($($allItems.get(s2))); }
        } else {
            $targets = $('.esi-media-item').filter(function () { var v = $(this).find('input[type=hidden]').val(); return !v || v === '0'; });
        }

        if (files.length > $targets.length) {
            var need = files.length - $targets.length;
            for (var a = 0; a < need; a++) { $targets = $targets.add(createEmptySlot()); }
        }

        $dz.addClass('uploading');
        var uploadIdx = 0;
        function nextUpload() {
            if (uploadIdx >= files.length) { $dz.removeClass('uploading'); return; }
            var file = files[uploadIdx];
            if (!file.type.match('image.*')) { uploadIdx++; nextUpload(); return; }
            var $target = $($targets.get(uploadIdx));
            if (!$target || !$target.length) { uploadIdx++; nextUpload(); return; }
            var $overlay = ("<div class='esi-upload-overlay'><div class='esi-upload-percent'>0%</div><div class='esi-upload-progress'><i style='width:0%'></i></div></div>");
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
                    if ($btn.length) { $btn.replaceWith(removeBtnHtml); }
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
        var $err = ("<div class='esi-upload-error'></div>").text(msg);
        var $retry = ("<button class='button' type='button'>Retry</button>");
        $retry.on('click', function () {
            var $parent = $overlay.closest('.esi-media-item');
            $overlay.remove();
            alert('Please try re-uploading by dropping the file again or using the dropzone.');
        });
        $overlay.append($err).append($retry);
    }

    function createEmptySlot() {
        var $grid = $('.esi-media-grid');
        var idx = $grid.find('.esi-media-item').length;
        var $item = ("<div class='esi-media-item' data-index='" + idx + "'>");
        $item.append('<button type="button" class="esi-drag-handle" aria-label="Drag to reorder">☰</button>');
        $item.append('<div class="esi-media-empty"></div>');
        $item.append('<input type="hidden" name="esi_media_grid[]" value="0" />');
        $item.append(addBtnHtml);
        $grid.append($item);
        initMediaDragSort();
        return $item;
    }

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

    function persistGridOrder() {
        var grid = [];
        $('.esi-media-item').each(function () {
            var val = $(this).find('input[type=hidden]').val() || 0;
            grid.push(parseInt(val, 10) || 0);
        });
        var data = [];
        for (var i = 0; i < grid.length; i++) { data.push({ name: 'esi_media_grid[]', value: grid[i] }); }
        data.push({ name: 'action', value: 'esi_save_settings' });
        var layoutVal = $('#esi_grid_layout').length ? $('#esi_grid_layout').val() : null;
        if (layoutVal) { data.push({ name: 'esi_grid_layout', value: layoutVal }); }
        if (typeof esiSettings !== 'undefined') {
            data.push({ name: 'nonce', value: esiSettings.nonce });
            return $.post(esiSettings.ajax_url, data).done(function (res) {
                if (res && res.success && res.data && res.data.opening_hours_html) {
                    $('#esi-opening-hours-placeholder').html(res.data.opening_hours_html);
                }
            }).fail(function () {
            });
        }
        return $.Deferred().resolve();
    }

    function debounce(fn, wait) {
        var t;
        return function () {
            var ctx = this, args = arguments;
            clearTimeout(t);
            t = setTimeout(function () { fn.apply(ctx, args); }, wait);
        };
    }

    var debouncedPersist = debounce(function () { persistGridOrder(); }, 700);

    $('#esi-settings-form').on('submit', function (e) {
        e.preventDefault();
        var grid = [];
        $('.esi-media-item').each(function () {
            var val = $(this).find('input[type=hidden]').val() || 0;
            grid.push(parseInt(val, 10) || 0);
        });

        var data = [];
        for (var i = 0; i < grid.length; i++) {
            data.push({ name: 'esi_media_grid[]', value: grid[i] });
        }
        data.push({ name: 'action', value: 'esi_save_settings' });
        var layoutVal2 = $('#esi_grid_layout').length ? $('#esi_grid_layout').val() : null;
        if (layoutVal2) { data.push({ name: 'esi_grid_layout', value: layoutVal2 }); }
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
});
