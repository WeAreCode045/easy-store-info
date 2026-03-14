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
        $('#esi-social-links .esi-social-row').each(function () {
            var url = $(this).find('.esi-social-url').val();
            if (url && url.trim()) {
                links.push({ icon: $(this).find('.esi-social-icon-value').val() || '', url: url.trim() });
            }
        });
        return links;
    }
    function buildIconList(opts, classes, selected) {
        var selLabel = (typeof esiSettings !== 'undefined' && esiSettings.select_icon) ? esiSettings.select_icon : 'Plattform-Symbol wählen';
        var $list = $('<div class="esi-social-icon-list" role="listbox" aria-label="' + selLabel + '"></div>');
        $.each(opts || {}, function (key, label) {
            var fa = (classes && classes[key]) ? classes[key] : 'fas fa-link';
            var sel = selected === key;
            var $btn = $('<button type="button" class="esi-social-icon-btn' + (sel ? ' is-selected' : '') + '" data-icon="' + key + '" title="' + label + '" aria-pressed="' + (sel ? 'true' : 'false') + '"><i class="' + fa + '" aria-hidden="true"></i></button>');
            $list.append($btn);
        });
        return $list;
    }
    $(document).on('click', '.esi-social-icon-btn', function () {
        var $row = $(this).closest('.esi-social-row');
        $row.find('.esi-social-icon-btn').removeClass('is-selected').attr('aria-pressed', 'false');
        $(this).addClass('is-selected').attr('aria-pressed', 'true');
        $row.find('.esi-social-icon-value').val($(this).data('icon') || '');
    });
    $(document).on('click', '.esi-social-add', function () {
        var opts = (typeof esiSettings !== 'undefined' && esiSettings.social_icon_options) ? esiSettings.social_icon_options : {};
        var classes = (typeof esiSettings !== 'undefined' && esiSettings.social_icon_classes) ? esiSettings.social_icon_classes : {};
        var $list = buildIconList(opts, classes, '');
        var $row = $('<div class="esi-social-row"></div>');
        var $top = $('<div class="esi-social-row-top"></div>');
        $top.append($list);
        var rmLabel = (typeof esiSettings !== 'undefined' && esiSettings.remove) ? esiSettings.remove : 'Entfernen';
        $top.append($('<button type="button" class="esi-social-remove button" aria-label="' + rmLabel + '">−</button>'));
        $row.append($top);
        $row.append($('<input type="hidden" class="esi-social-icon-value" value="" />'));
        $row.append($('<div class="esi-social-url-wrap"><input type="url" class="esi-social-url" placeholder="https://..." /></div>'));
        $('#esi-social-links').append($row);
    });
    $(document).on('click', '.esi-social-remove', function () {
        var $container = $('#esi-social-links');
        if ($container.find('.esi-social-row').length > 1) {
            $(this).closest('.esi-social-row').remove();
        }
    });
    $('#esi-general-info-form').on('submit', function (e) {
        e.preventDefault();
        var $form = $(this);
        var $msg = $form.find('.esi-general-message');
        $msg.removeClass('success error').text('');
        $form.find('button[type=submit]').prop('disabled', true);
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
            $form.find('button[type=submit]').prop('disabled', false);
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
    var addImgLbl = (typeof esiSettings !== 'undefined' && esiSettings.add_image) ? esiSettings.add_image : 'Bild hinzufügen';
    var remImgLbl = (typeof esiSettings !== 'undefined' && esiSettings.remove_image) ? esiSettings.remove_image : 'Bild entfernen';
    var addBtnHtml = '<button class="esi-add-media button" type="button" aria-label="' + addImgLbl + '">' +
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M12 5v14M5 12h14" stroke="#0b66b2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>';
    var removeBtnHtml = '<button class="esi-remove-media button" type="button" aria-label="' + remImgLbl + '">' +
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
            var selMedia = (typeof esiSettings !== 'undefined' && esiSettings.select_media) ? esiSettings.select_media : 'Medien auswählen';
            var selBtn = (typeof esiSettings !== 'undefined' && esiSettings.select) ? esiSettings.select : 'Auswählen';
            frame = wp.media({ title: selMedia, button: { text: selBtn }, multiple: false });
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
                // Instead of moving DOM nodes, swap the media content between cells
                swapMediaItems($dragging, $target);
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
                swapMediaItems($dragging, $targetItem);
                debouncedPersist();
            }
            if (dragSrcEl) $(dragSrcEl).removeClass('dragging');
            dragSrcEl = null;
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
                    if (res.data.weekday_text && res.data.weekday_text.length) {
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
            $row.find('.esi-time-row, .esi-break-wrap, .esi-break-times').toggleClass('is-disabled is-hidden', closed);
            $row.find('.esi-open-time, .esi-close-time, .esi-break-cb, .esi-break-start, .esi-break-end').prop('disabled', closed);
            if (closed) {
                $row.find('.esi-break-cb').prop('checked', false);
                $row.find('.esi-break-times').addClass('is-hidden');
            } else {
                var showBreak = $row.find('.esi-break-cb').is(':checked');
                $row.find('.esi-break-times').toggleClass('is-hidden', !showBreak);
            }
        });
        $(document).on('change', '.esi-break-cb', function () {
            var $row = $(this).closest('.esi-day-row');
            var enabled = $(this).is(':checked');
            $row.find('.esi-break-times').toggleClass('is-hidden', !enabled);
        });
        function validateBreakInRange(openVal, closeVal, breakStartVal, breakEndVal) {
            if (!openVal || !closeVal || !breakStartVal || !breakEndVal) return true;
            var toMin = function (t) {
                var p = (t || '00:00').split(':');
                return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
            };
            var o = toMin(openVal), c = toMin(closeVal), bs = toMin(breakStartVal), be = toMin(breakEndVal);
            if (c <= o) c += 24 * 60;
            if (be <= bs) be += 24 * 60;
            return o <= bs && bs < be && be <= c;
        }
        function collectManualHours() {
            var hours = {};
            $('.esi-day-row').each(function () {
                var $r = $(this);
                var day = parseInt($r.data('day'), 10);
                var closed = $r.find('.esi-closed-cb').is(':checked');
                var openVal = $r.find('.esi-open-time').val() || '09:00';
                var closeVal = $r.find('.esi-close-time').val() || '18:00';
                var breakEnabled = $r.find('.esi-break-cb').is(':checked') && !closed;
                var breakStart = $r.find('.esi-break-start').val() || '12:00';
                var breakEnd = $r.find('.esi-break-end').val() || '13:00';
                if (breakEnabled && !validateBreakInRange(openVal, closeVal, breakStart, breakEnd)) {
                    breakEnabled = false;
                    $r.find('.esi-break-cb').prop('checked', false);
                    $r.find('.esi-break-times').addClass('is-hidden');
                }
                hours[day] = {
                    closed: closed,
                    open: openVal,
                    close: closeVal,
                    break_enabled: breakEnabled,
                    break_start: breakStart,
                    break_end: breakEnd
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
        $('.esi-media-item').removeClass('selected');
        $selectedSlot = $(this);
        $selectedSlot.addClass('selected');
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
                    var $btn = $target.find('.esi-add-media');
                    if ($btn.length) { $btn.replaceWith(removeBtnHtml); }
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

    function collectFormData() {
        var data = [];
        var grid = [];
        $('.esi-media-item').each(function () {
            var val = $(this).find('input[type=hidden]').val() || 0;
            grid.push(parseInt(val, 10) || 0);
        });
        for (var i = 0; i < grid.length; i++) { data.push({ name: 'esi_media_grid[]', value: grid[i] }); }
        data.push({ name: 'action', value: 'esi_save_grid' });
        var layoutVal = $('#esi_grid_layout').length ? $('#esi_grid_layout').val() : null;
        if (layoutVal) { data.push({ name: 'esi_grid_layout', value: layoutVal }); }
        if (typeof esiSettings !== 'undefined') {
            data.push({ name: 'nonce', value: esiSettings.grid_nonce });
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
                        $it.find('.esi-add-media').replaceWith(removeBtnHtml);
                    }
                } else {
                    // empty state
                    if ($it.find('.esi-thumb-wrap').length) {
                        $it.find('.esi-thumb-wrap').replaceWith('<div class="esi-media-empty"></div>');
                    }
                    if ($it.find('.esi-add-media').length === 0) {
                        $it.find('.esi-remove-media').replaceWith(addBtnHtml);
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
