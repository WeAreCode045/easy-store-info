// Editor script (copy of frontend-editor.js)
// This file was created to match requested structure: assets/js/editor.js

window.esiMapsLoaded = function () {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) return;
    var input = document.getElementById('esi_store_address');
    if (input) {
        var autocomplete = new google.maps.places.Autocomplete(input, { types: ['address'] });
        autocomplete.addListener('place_changed', function () {
            var place = autocomplete.getPlace();
            if (place && place.formatted_address) {
                input.value = place.formatted_address;
            }
        });
    }
};

jQuery(function ($) {
    // Only initialize editor bindings when frontend editor wrapper is present
    if ($('.esi-frontend-editor').length === 0) {
        return;
    }

    // Tab switching (General info | Media Gallery | Account)
    function switchMainTab(tab) {
        $('.esi-editor-tabs .esi-tab').removeClass('esi-tab-active').attr('aria-selected', 'false');
        $('.esi-editor-tabs .esi-tab[data-tab="' + tab + '"]').addClass('esi-tab-active').attr('aria-selected', 'true');
        $('.esi-tab-panel').prop('hidden', true);
        $('#esi-panel-' + tab).prop('hidden', false);
    }
    $(document).on('click', '.esi-editor-tabs .esi-tab', function () {
        switchMainTab($(this).data('tab'));
    });
    $(document).on('click', '.esi-tab-link', function (e) {
        e.preventDefault();
        var tab = $(this).data('tab');
        if (tab) { switchMainTab(tab); }
    });
    // Content tabs (About / Payment / Footer)
    $(document).on('click', '.esi-content-tabs .esi-content-tab', function () {
        var content = $(this).data('content');
        $('.esi-content-tabs .esi-content-tab').removeClass('esi-content-tab-active').attr('aria-selected', 'false');
        $(this).addClass('esi-content-tab-active').attr('aria-selected', 'true');
        $('.esi-content-panel').prop('hidden', true);
        $('.esi-content-' + content).prop('hidden', false);
    });

    // General info form
    function getWysiwygContent(id) {
        try {
            if (typeof tinymce !== 'undefined' && tinymce.get(id)) {
                return tinymce.get(id).getContent() || '';
            }
        } catch (e) {}
        return $('#' + id).val() || '';
    }
    function collectSocialLinks() {
        var links = [];
        $('#esi-social-links .esi-social-link-item').each(function () {
            var url = $(this).attr('data-url') || '';
            if (url && url.trim()) {
                links.push({ icon: $(this).attr('data-icon') || '', url: url.trim() });
            }
        });
        return links;
    }
    (function () {
        var $modal = $('#esi-add-social-modal');
        var $urlInput = $('#esi-modal-url');
        var $iconBtns = $modal.find('.esi-modal-icon-btn');
        var selectedIcon = '';
        function openModal() {
            $urlInput.val('');
            $iconBtns.removeClass('is-selected').attr('aria-selected', 'false');
            var $first = $iconBtns.first();
            if ($first.length) {
                $first.addClass('is-selected').attr('aria-selected', 'true');
                selectedIcon = $first.data('icon') || '';
            } else {
                selectedIcon = '';
            }
            $modal.attr('hidden', null);
            $urlInput.focus();
        }
        function closeModal() {
            $modal.attr('hidden', true);
        }
        $(document).on('click', '.esi-social-add', function () {
            openModal();
        });
        $(document).on('click', '.esi-modal-backdrop, .esi-modal-cancel', function () {
            closeModal();
        });
        $(document).on('click', '.esi-modal-icon-btn', function () {
            $iconBtns.removeClass('is-selected').attr('aria-selected', 'false');
            $(this).addClass('is-selected').attr('aria-selected', 'true');
            selectedIcon = $(this).data('icon') || '';
        });
        $urlInput.on('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); $modal.find('.esi-modal-save').click(); }
        });
        $(document).on('click', '.esi-modal-save', function () {
            var url = $urlInput.val() || '';
            url = url.trim();
            if (!url) return;
            var fa = (typeof esiSettings !== 'undefined' && esiSettings.social_icon_classes && esiSettings.social_icon_classes[selectedIcon]) ? esiSettings.social_icon_classes[selectedIcon] : 'fas fa-link';
            var $li = $('<li class="esi-social-link-item" data-icon="' + selectedIcon + '" data-url="' + url.replace(/"/g, '&quot;') + '"><i class="' + fa + '" aria-hidden="true"></i><span class="esi-social-link-url">' + $('<div/>').text(url).html() + '</span><button type="button" class="esi-social-remove button" aria-label="Entfernen">−</button></li>');
            $('#esi-social-links').append($li);
            closeModal();
        });
        $(document).on('keydown.esiAddSocialModal', function (e) {
            if ($modal.attr('hidden')) return;
            if (e.key === 'Escape') { closeModal(); }
        });
    })();
    $(document).on('click', '.esi-social-remove', function () {
        $(this).closest('.esi-social-link-item').remove();
    });
    $('#esi-general-info-form').on('submit', function (e) {
        e.preventDefault();
        var $form = $(this);
        var $msg = $('.esi-general-message');
        $msg.removeClass('success error').text('');
        $('.esi-right-save-wrap button[form="esi-general-info-form"]').prop('disabled', true);
        var oh = typeof window.esiCollectOpeningHours === 'function' ? window.esiCollectOpeningHours() : { use_google: true, manual_hours: {} };
        var data = {
            action: 'esi_save_general_info',
            nonce: esiSettings.general_info_nonce,
            esi_title: $('#esi_title').val() || '',
            esi_subtitle: $('#esi_subtitle').val() || '',
            esi_about_text: getWysiwygContent('esi_about_text'),
            esi_payment_details: getWysiwygContent('esi_payment_details'),
            esi_footer_text: getWysiwygContent('esi_footer_text'),
            esi_contact_email: $('#esi_contact_email').val() || '',
            esi_contact_phone: $('#esi_contact_phone').val() || '',
            esi_store_address: $('#esi_store_address').val() || '',
            esi_social_links: JSON.stringify(collectSocialLinks()),
            esi_use_google_hours: oh.use_google ? '1' : '0',
            esi_manual_hours: JSON.stringify(oh.manual_hours)
        };
        $.post(esiSettings.ajax_url, data).done(function (res) {
            if (res && res.success) {
                $msg.removeClass('error').addClass('success').text(res.data && res.data.message ? res.data.message : 'Gespeichert.');
            } else {
                $msg.removeClass('success').addClass('error').text(res.data && res.data.message ? res.data.message : 'Fehler.');
            }
        }).fail(function () {
            $msg.removeClass('success').addClass('error').text('Fehler beim Speichern.');
        }).always(function () {
            $('.esi-right-save-wrap button[form="esi-general-info-form"]').prop('disabled', false);
        });
    });

    // Password change form
    $('#esi-password-form').on('submit', function (e) {
        e.preventDefault();
        var $form = $(this);
        var $msg = $form.find('.esi-password-message');
        var newPw = $('#esi_new_password').val();
        var confirmPw = $('#esi_confirm_password').val();
        if (newPw !== confirmPw) {
            $msg.removeClass('success').addClass('error').text('Passwörter stimmen nicht überein.');
            return;
        }
        $msg.removeClass('success error').text('');
        $form.find('button[type=submit]').prop('disabled', true);
        $.post(esiSettings.ajax_url, {
            action: 'esi_change_password',
            nonce: esiSettings.password_nonce,
            current_password: $('#esi_current_password').val(),
            new_password: newPw
        }).done(function (res) {
            if (res && res.success) {
                $msg.removeClass('error').addClass('success').text(res.data && res.data.message ? res.data.message : 'Passwort gespeichert.');
                $form[0].reset();
            } else {
                $msg.removeClass('success').addClass('error').text(res.data && res.data.message ? res.data.message : 'Fehler.');
            }
        }).fail(function () {
            $msg.removeClass('success').addClass('error').text('Fehler beim Speichern.');
        }).always(function () {
            $form.find('button[type=submit]').prop('disabled', false);
        });
    });

    // Settings page: media modal and save
    var frame;
    var suppressRasterTileClick = false;
    var addImgLbl = (typeof esiSettings !== 'undefined' && esiSettings.add_image) ? esiSettings.add_image : 'Bild hinzufügen';
    var remImgLbl = (typeof esiSettings !== 'undefined' && esiSettings.remove_image) ? esiSettings.remove_image : 'Bild entfernen';
    var addBtnHtml = '<button class="esi-add-media button" type="button" aria-label="' + addImgLbl + '">' +
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M12 5v14M5 12h14" stroke="#0b66b2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>';
    var removeBtnHtml = '<button class="esi-remove-media button" type="button" aria-label="' + remImgLbl + '"><i class="fas fa-trash" aria-hidden="true"></i></button>';
    $(document).on('click', '.esi-add-media', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openWpMediaForItem($(this).closest('.esi-media-item'));
    });

    $(document).on('click', '.esi-remove-media', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $item = $btn.closest('.esi-media-item');
        $item.find('input[type=hidden]').val(0);
        $item.find('.esi-thumb-wrap').replaceWith('<div class="esi-media-empty"></div>');
        $item.find('.esi-media-actions').remove();
        $item.append(addBtnHtml);
    });

    function initMediaDragSort() {
        var dragSrcEl = null;
        var pointerDragging = false;
        var nativeDropHandled = false;
        var lastDropTarget = null;

        $('.esi-media-item').each(function () {
            this.setAttribute('draggable', 'true');
        });

        $(document).off('dragstart.handle').on('dragstart.handle', '.esi-media-item', function (e) {
            if ($(e.target).closest('button').length) return;
            var $item = $(this);
            dragSrcEl = $item.get(0);
            var dt = e.originalEvent.dataTransfer;
            dt.effectAllowed = 'move';
            dt.setData('text/plain', ' ');
            try { dt.setData('text/html', $item.get(0).innerHTML); } catch (err) {}
            $item.addClass('dragging');
        });

        $(document).off('dragover.item').on('dragover.item', '.esi-media-item', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var dt = e.originalEvent.dataTransfer;
            if (dt) dt.dropEffect = 'move';
            $(this).addClass('drag-over');
        });

        $(document).off('dragenter.item').on('dragenter.item', '.esi-media-item', function (e) {
            e.preventDefault();
            $(this).addClass('drag-over');
        });

        $(document).off('dragleave.item').on('dragleave.item', '.esi-media-item', function (e) {
            if (!$(this).get(0).contains(e.relatedTarget)) {
                $(this).removeClass('drag-over');
            }
        });

        $(document).off('drop.item').on('drop.item', '.esi-media-item', function (e) {
            e.preventDefault();
            e.stopPropagation();
            nativeDropHandled = true;
            var $target = $(this);
            $target.removeClass('drag-over');
            var $dragging = dragSrcEl ? $(dragSrcEl) : $();
            if ($dragging.length && $dragging[0] !== $target[0]) {
                swapMediaItems($dragging, $target);
                suppressRasterTileClick = true;
                persistGridOrder();
            }
        });

        $(document).off('dragend.item').on('dragend.item', '.esi-media-item', function (e) {
            $('.esi-media-item').removeClass('drag-over dragging');
            dragSrcEl = null;
            lastDropTarget = null;
        });

        $(document).off('pointerdown.handle').on('pointerdown.handle', '.esi-media-item', function (ev) {
            if ($(ev.target).closest('button').length) return;
            if (ev.originalEvent && ev.originalEvent.button && ev.originalEvent.button !== 0) return;
            pointerDragging = true;
            lastDropTarget = null;
            var $item = $(this);
            dragSrcEl = $item.get(0);
            $item.addClass('dragging');
            $item.get(0).setPointerCapture(ev.originalEvent.pointerId);
        });

        $(document).off('pointermove.handle').on('pointermove.handle', function (ev) {
            if (!pointerDragging || !dragSrcEl) return;
            ev.preventDefault();
            var targetEl = document.elementFromPoint(ev.originalEvent.clientX, ev.originalEvent.clientY);
            if (!targetEl) { lastDropTarget = null; return; }
            var $targetItem = $(targetEl).closest('.esi-media-item');
            $('.esi-media-item').removeClass('drag-over');
            if ($targetItem.length && $targetItem.get(0) !== dragSrcEl) {
                $targetItem.addClass('drag-over');
                lastDropTarget = $targetItem.get(0);
            } else {
                lastDropTarget = null;
            }
        });

        $(document).off('pointerup.handle pointercancel.handle').on('pointerup.handle pointercancel.handle', function (ev) {
            if (!pointerDragging) return;
            pointerDragging = false;
            if (nativeDropHandled) {
                nativeDropHandled = false;
                dragSrcEl = null;
                lastDropTarget = null;
                $('.esi-media-item').removeClass('drag-over dragging');
                return;
            }
            var $dragging = dragSrcEl ? $(dragSrcEl) : $();
            var $targetItem = lastDropTarget ? $(lastDropTarget) : $();
            if (!$targetItem.length) {
                var targetEl = document.elementFromPoint(ev.originalEvent.clientX, ev.originalEvent.clientY);
                $targetItem = targetEl ? $(targetEl).closest('.esi-media-item') : $();
            }
            $('.esi-media-item').removeClass('drag-over dragging');
            if ($targetItem.length && $dragging.length && $targetItem.get(0) !== $dragging.get(0)) {
                swapMediaItems($dragging, $targetItem);
                suppressRasterTileClick = true;
                debouncedPersist();
            }
            dragSrcEl = null;
            lastDropTarget = null;
        });
    }

    initMediaDragSort();

    // Opening hours editor (no auto-save; use Save General Info)
    (function () {
        var $toggle = $('#esi_use_google_hours');
        var $manualWrap = $('.esi-manual-hours-wrap');
        var $previewWrap = $('.esi-google-preview-wrap');
        if ($toggle.length) {
            $toggle.on('change', function () {
                var useGoogle = $(this).is(':checked');
                $manualWrap.toggle(!useGoogle);
                $previewWrap.toggle(useGoogle);
                if (useGoogle) { fetchGooglePlacesPreview(); }
            });
        }
        function fetchGooglePlacesPreview() {
            var $preview = $('#esi-google-places-preview');
            var $refresh = $('.esi-google-preview-refresh');
            if (!$preview.length) return;
            var loadingTxt = (typeof esiSettings !== 'undefined' && esiSettings.loading) ? esiSettings.loading : 'Vorschau wird geladen…';
            $preview.html('<p class="esi-google-preview-loading">' + loadingTxt + '</p>');
            $refresh.prop('disabled', true);
            $.post(typeof esiSettings !== 'undefined' ? esiSettings.ajax_url : '', {
                action: 'esi_fetch_google_places_preview',
                nonce: typeof esiSettings !== 'undefined' ? esiSettings.opening_hours_nonce : ''
            }).done(function (res) {
                if (res && res.success && res.data) {
                    var html = '';
                    if (res.data.preview_structured && res.data.preview_structured.length) {
                        html = '<ul class="esi-google-preview-list">';
                        res.data.preview_structured.forEach(function (row) {
                            var day = (row.day || '').replace(/</g, '&lt;');
                            var time = (row.time || '').replace(/</g, '&lt;');
                            html += '<li><span class="esi-preview-day">' + day + '</span><span class="esi-preview-time">' + time + '</span></li>';
                        });
                        html += '</ul>';
                    } else if (res.data.weekday_text && res.data.weekday_text.length) {
                        html = '<ul class="esi-google-preview-list">';
                        res.data.weekday_text.forEach(function (line) {
                            html += '<li>' + (line || '').replace(/</g, '&lt;') + '</li>';
                        });
                        html += '</ul>';
                    } else if (res.data.preview) {
                        html = '<pre class="esi-google-preview-pre">' + (res.data.preview || '').replace(/</g, '&lt;') + '</pre>';
                    }
                    if (!html && res.data.raw) {
                        html = '<details><summary>Raw response</summary><pre class="esi-google-preview-raw">' + (res.data.raw || '').replace(/</g, '&lt;') + '</pre></details>';
                    }
                    var noDataTxt = (typeof esiSettings !== 'undefined' && esiSettings.no_preview) ? esiSettings.no_preview : 'Keine Öffnungszeiten-Daten vorhanden.';
                    $preview.html(html || '<p>' + noDataTxt + '</p>');
                } else {
                    var errTxt = (typeof esiSettings !== 'undefined' && esiSettings.preview_error) ? esiSettings.preview_error : 'Vorschau konnte nicht geladen werden.';
                    $preview.html('<p class="esi-google-preview-error">' + (res.data && res.data.message ? res.data.message : errTxt) + '</p>');
                }
            }).fail(function () {
                var netErrTxt = (typeof esiSettings !== 'undefined' && esiSettings.network_error) ? esiSettings.network_error : 'Netzwerkfehler beim Laden der Vorschau.';
                $preview.html('<p class="esi-google-preview-error">' + netErrTxt + '</p>');
            }).always(function () {
                $refresh.prop('disabled', false);
            });
        }
        $(document).on('click', '.esi-google-preview-refresh', function () { fetchGooglePlacesPreview(); });
        if ($toggle.is(':checked') && $previewWrap.length) {
            fetchGooglePlacesPreview();
        }
        $(document).on('change', '.esi-closed-cb', function () {
            var $row = $(this).closest('.esi-day-row');
            var closed = $(this).is(':checked');
            $row.find('.esi-time-row').toggleClass('is-disabled', closed);
            $row.find('.esi-open-time, .esi-close-time').prop('disabled', closed);
        });
        function collectManualHours() {
            var hours = {};
            $('.esi-day-row').each(function () {
                var $r = $(this);
                var day = parseInt($r.data('day'), 10);
                var closed = $r.find('.esi-closed-cb').is(':checked');
                var openVal = $r.find('.esi-open-time').val() || '09:00';
                var closeVal = $r.find('.esi-close-time').val() || '18:00';
                hours[day] = {
                    closed: closed,
                    open: openVal,
                    close: closeVal
                };
            });
            return hours;
        }
        window.esiCollectOpeningHours = function () {
            return {
                use_google: $('#esi_use_google_hours').length ? $('#esi_use_google_hours').is(':checked') : true,
                manual_hours: collectManualHours()
            };
        };
    })();

    var $dzPlaceholder = $('.esi-dropzone-placeholder');
    if ($dzPlaceholder.length) {
        var $dz = $('<div class="esi-dropzone" tabindex="0"><div class="esi-dropzone-text">Ziehen Sie Bilder oder Videos hierher oder klicken, um mehrere hochzuladen</div><div class="esi-dropzone-hint">(PNG, JPG, GIF, MP4)</div><div class="esi-dropzone-progress" aria-hidden="true"></div></div>');
        $dzPlaceholder.append($dz);

        $dz.on('click', function () {
            var $input = $('<input type="file" accept="image/*,video/*" multiple style="display:none">');
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

    // Generate a thumbnail image from a video URL and replace the empty slot.
    function generateVideoThumbnail($empty, src) {
        if (!$empty || !src) return;
        try {
            var video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.preload = 'metadata';
            video.muted = true;
            video.src = src;
            // choose a small seek time (0.1s) after load
            var seeked = function () {
                try {
                    var canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth || 320;
                    canvas.height = video.videoHeight || 180;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    var dataURL = canvas.toDataURL('image/jpeg');
                    var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + dataURL + '" alt="" /></div>');
                    $empty.replaceWith($thumb);
                } catch (err) {
                    // fallback: leave as empty
                }
                // cleanup
                video.removeEventListener('seeked', seeked);
                video.src = '';
            };
            var loaded = function () {
                try {
                    // clamp to within duration
                    var t = 0.1;
                    if (video.duration && video.duration < t) t = Math.max(0, video.duration / 2);
                    video.currentTime = t;
                } catch (e) {
                    // if seeking fails, still try to draw on loadeddata
                    seeked();
                }
            };
            video.addEventListener('loadeddata', loaded);
            video.addEventListener('seeked', seeked);
            // load
            video.load();
        } catch (err) {
            // ignore
        }
    }

    $(document).on('click', '.esi-media-item', function (e) {
        if ($(e.target).is('button') || $(e.target).is('input') || $(e.target).closest('button').length) return;
        if (suppressRasterTileClick) {
            suppressRasterTileClick = false;
            return;
        }
        $('.esi-media-item').removeClass('selected');
        $selectedSlot = $(this);
        $selectedSlot.addClass('selected');
        if (typeof wp !== 'undefined' && wp.media) {
            openWpMediaForItem($selectedSlot);
        }
    });

    // On init: generate thumbnails for video slots that exposed data-video-src
    $('.esi-media-empty[data-video-src]').each(function () {
        var $el = $(this);
        var src = $el.attr('data-video-src');
        if (src) generateVideoThumbnail($el, src);
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
                // Allow images and videos
                if (!file.type.match('image.*') && !file.type.match('video.*')) { uploadIdx++; nextUpload(); return; }
            var $target = $($targets.get(uploadIdx));
            if (!$target || !$target.length) { uploadIdx++; nextUpload(); return; }
                    var $overlay = $("<div class='esi-upload-overlay'><div class='esi-upload-percent'>0%</div><div class='esi-upload-progress'><i style='width:0%'></i></div></div>");
                    $target.append($overlay);

                // Show immediate preview for images/videos using local object URL
                try {
                    var localSrc = null;
                    if (file.type.match('image.*')) {
                        localSrc = URL.createObjectURL(file);
                        var $empty = $target.find('.esi-media-empty');
                        if ($empty.length) {
                            var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + localSrc + '" alt="" /></div>');
                            $empty.replaceWith($thumb);
                        }
                    } else if (file.type.match('video.*')) {
                        localSrc = URL.createObjectURL(file);
                        var $emptyV = $target.find('.esi-media-empty');
                        if ($emptyV.length) {
                            generateVideoThumbnail($emptyV, localSrc);
                        }
                    }
                    // revoke after a short delay (poster preserved in DOM as data URL)
                    (function (url) { if (url && url.indexOf('blob:') === 0) { setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 5000); } })(localSrc);
                } catch (err) {}

            uploadFile(file, function (pct) {
                $overlay.find('.esi-upload-percent').text(Math.round(pct) + '%');
                $overlay.find('.esi-upload-progress > i').css('width', Math.round(pct) + '%');
            }).done(function (res) {
                var attId = (res && res.id) ? res.id : 0;
                var src = (res && (res.source_url || res.source_url)) ? (res.source_url || res.source_url) : '';
                var mime = (res && res.mime_type) ? res.mime_type : (res && res.mime) ? res.mime : '';
                if (attId && src) {
                    // if video, attempt to generate a thumbnail from the uploaded video file
                    if (mime && mime.indexOf && mime.indexOf('video') === 0) {
                        // ensure we have an empty slot element to replace
                        var $empty = $target.find('.esi-media-empty');
                        if ($empty.length) {
                            generateVideoThumbnail($empty, src);
                        } else {
                            var $thumb = $('<div class="esi-thumb-wrap"><video class="esi-thumb" src="' + src + '" muted preload="metadata"></video>');
                            $target.find('.esi-media-empty').replaceWith($thumb);
                        }
                    } else {
                        var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + src + '" alt="" /></div>');
                        $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
                        $target.find('.esi-media-empty').replaceWith($thumb);
                    }
                    $target.find('input[type=hidden]').val(attId);
                    var $addBtn = $target.find('.esi-add-media');
                    if ($addBtn.length) {
                        $addBtn.remove();
                        $target.prepend('<div class="esi-media-actions">' + removeBtnHtml + '</div>');
                    }
                    $overlay.remove();
                    debouncedPersist();
                } else {
                    showUploadError($overlay, (typeof esiSettings !== 'undefined' && esiSettings.upload_failed) ? esiSettings.upload_failed : 'Upload fehlgeschlagen');
                }
            }).fail(function (xhr, status, err) {
                showUploadError($overlay, (typeof esiSettings !== 'undefined' && esiSettings.upload_failed) ? esiSettings.upload_failed : 'Upload fehlgeschlagen');
            }).always(function () {
                uploadIdx++; nextUpload();
            });
        }
        nextUpload();
    }

    function showUploadError($overlay, msg) {
        $overlay.empty();
        var $err = $("<div class='esi-upload-error'></div>").text(msg);
        var retryTxt = (typeof esiSettings !== 'undefined' && esiSettings.retry) ? esiSettings.retry : 'Erneut versuchen';
        var $retry = $("<button class='button' type='button'>" + retryTxt + "</button>");
        $retry.on('click', function () {
            var $parent = $overlay.closest('.esi-media-item');
            $overlay.remove();
            var retryHint = (typeof esiSettings !== 'undefined' && esiSettings.retry_upload_hint) ? esiSettings.retry_upload_hint : 'Bitte versuchen Sie den Upload erneut.';
            alert(retryHint);
        });
        $overlay.append($err).append($retry);
    }

    function createEmptySlot() {
        var $grid = $('.esi-media-grid');
        var idx = $grid.find('.esi-media-item').length;
        var $item = $("<div class='esi-media-item' data-index='" + idx + "'></div>");
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

    function collectFormData() {
        var grid = [];
        $('.esi-media-item').each(function () {
            var val = $(this).find('input[type=hidden]').val() || 0;
            grid.push(parseInt(val, 10) || 0);
        });
        // Plain object so jQuery serializes esi_media_grid as a PHP array (esi_media_grid[]=…).
        var data = {
            action: 'esi_save_grid',
            esi_media_grid: grid
        };
        if (typeof esiSettings !== 'undefined') {
            data.nonce = esiSettings.grid_nonce;
        }
        if ($('#esi_grid_layout').length) {
            data.esi_grid_layout = $('#esi_grid_layout').val() || '2x4';
        }
        return data;
    }

    function persistGridOrder() {
        var data = collectFormData();
        if (typeof esiSettings !== 'undefined') {
            return $.post(esiSettings.ajax_url, data).fail(function () {});
        }
        return $.Deferred().resolve();
    }

    // Swap media content between two grid items (hidden value, thumbnail and buttons)
    function swapMediaItems($a, $b) {
        try {
            var aVal = parseInt($a.find('input[type=hidden]').val() || 0, 10) || 0;
            var bVal = parseInt($b.find('input[type=hidden]').val() || 0, 10) || 0;
            // attempt to read src from existing thumb if present
            var aSrc = $a.find('.esi-thumb-wrap img').attr('src') || '';
            var bSrc = $b.find('.esi-thumb-wrap img').attr('src') || '';

            // helper to apply a value to an item
            var apply = function ($it, val, src) {
                $it.find('input[type=hidden]').val(val);
                if (val && val !== 0) {
                    var $thumb = $it.find('.esi-thumb-wrap');
                    if (!$thumb.length) {
                        $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + (src || '') + '" /></div>');
                        $it.find('.esi-media-empty').replaceWith($thumb);
                    } else {
                        $thumb.html('<img class="esi-thumb" src="' + (src || '') + '" />');
                    }
                    $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
                    // ensure remove button exists
                    if ($it.find('.esi-remove-media').length === 0) {
                        $it.find('.esi-add-media').remove();
                        $it.prepend('<div class="esi-media-actions">' + removeBtnHtml + '</div>');
                    }
                } else {
                    // empty state
                    if ($it.find('.esi-thumb-wrap').length) {
                        $it.find('.esi-thumb-wrap').replaceWith('<div class="esi-media-empty"></div>');
                    }
                    if ($it.find('.esi-add-media').length === 0) {
                        $it.find('.esi-media-actions').remove();
                        $it.append(addBtnHtml);
                    }
                }
            };

            // apply swapped values
            apply($a, bVal, bSrc);
            apply($b, aVal, aSrc);
        } catch (err) {
            // fallback: move DOM nodes if swap fails
            try { $b.after($a); } catch (e) {}
        }
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

    function applyAttachmentToMediaItem($item, attachment) {
        var mime = (attachment.mime || '').toString();
        var type = (attachment.type || '').toString();
        var isVideo = mime.indexOf('video/') === 0 || type === 'video';
        var url = attachment.url || (attachment.sizes && attachment.sizes.full ? attachment.sizes.full.url : '') || '';
        $item.find('input[type=hidden]').val(attachment.id);
        $item.find('.esi-thumb-wrap').remove();
        $item.find('.esi-media-empty').remove();
        var $hidden = $item.find('input[type=hidden]');
        if (isVideo && url) {
            var $empty = $('<div class="esi-media-empty"></div>');
            $hidden.before($empty);
            generateVideoThumbnail($empty, url);
        } else {
            var $thumb = $('<div class="esi-thumb-wrap"><img class="esi-thumb" src="' + url + '" alt="" /></div>');
            $thumb.find('img').removeAttr('width').removeAttr('height').removeAttr('style').removeAttr('srcset').removeAttr('sizes');
            $hidden.before($thumb);
        }
        $item.find('.esi-add-media').remove();
        $item.find('.esi-media-actions').remove();
        $item.prepend('<div class="esi-media-actions">' + removeBtnHtml + '</div>');
        debouncedPersist();
    }

    function openWpMediaForItem($item) {
        if (typeof wp === 'undefined' || !wp.media || !$item || !$item.length) {
            return;
        }
        var selMedia = (typeof esiSettings !== 'undefined' && esiSettings.select_media) ? esiSettings.select_media : 'Medien auswählen';
        var selBtn = (typeof esiSettings !== 'undefined' && esiSettings.select) ? esiSettings.select : 'Auswählen';
        function onSelect() {
            var attachment = frame.state().get('selection').first().toJSON();
            applyAttachmentToMediaItem($item, attachment);
        }
        if (frame) {
            try { frame.off('select'); } catch (err) { }
            frame.on('select', onSelect);
            frame.open();
            return;
        }
        frame = wp.media({ title: selMedia, button: { text: selBtn }, multiple: false });
        frame.on('select', onSelect);
        frame.open();
    }

    // When layout select changes, immediately adjust DOM grid to match new slot count
    $(document).on('change', '#esi_grid_layout', function () {
        var layout = $(this).val() || '2x4';
        var parts = layout.split('x');
        var rows = parseInt(parts[0], 10) || 2;
        var cols = parseInt(parts[1], 10) || 4;
        var slots = Math.max(1, rows * cols);
        var $grid = $('.esi-media-grid');
        if (!$grid.length) return;
        // update grid class (remove previous esi-grid-* classes)
        $grid.removeClass(function (index, className) {
            return (className.match(/(^|\s)esi-grid-\S+/g) || []).join(' ');
        }).addClass('esi-grid-' + layout);

        var $items = $grid.find('.esi-media-item');
        var current = $items.length;
        if (current < slots) {
            var need = slots - current;
            for (var i = 0; i < need; i++) { createEmptySlot(); }
        } else if (current > slots) {
            // remove extra items from the end
            for (var r = current - 1; r >= slots; r--) {
                var $rem = $($grid.find('.esi-media-item').get(r));
                if ($rem && $rem.length) { $rem.remove(); }
            }
        }
        // persist new layout and grid state
        debouncedPersist();
    });

    $('#esi-editor-form').on('submit', function (e) {
        e.preventDefault();
        var data = collectFormData();

        var savedTxt = (typeof esiSettings !== 'undefined' && esiSettings.settings_saved) ? esiSettings.settings_saved : 'Einstellungen gespeichert';
        var errTxt = (typeof esiSettings !== 'undefined' && esiSettings.save_error) ? esiSettings.save_error : 'Fehler beim Speichern';
        var ajaxErrTxt = (typeof esiSettings !== 'undefined' && esiSettings.ajax_error) ? esiSettings.ajax_error : 'AJAX-Fehler';
        $.post(esiSettings.ajax_url, data, function (res) {
            if (res.success) {
                alert(savedTxt);
            } else {
                alert(errTxt);
            }
        }).fail(function () {
            alert(ajaxErrTxt);
        });
    });
});
