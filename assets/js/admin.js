/**
 * All of the JS for your admin-specific functionality should be
 * included in this file.
 */
jQuery(function ($) {


    $('#esi-settings-form').on('submit', function (e) {
        e.preventDefault();
        var data = $(this).serializeArray();
        data.push({ name: 'action', value: 'esi_save_settings' });
        data.push({ name: 'nonce', value: esiAdmin.nonce });
        $.post(esiAdmin.ajax_url, data, function (res) {
            if (res && res.success) {
                    // Insert opening hours HTML if provided
                    if (res.data && res.data.opening_hours_html) {
                        $('#esi-opening-hours-placeholder').html(res.data.opening_hours_html);
                        // reapply current settings to the new preview
                        applySettingsToPreview();
                    }
                    window.alert('Settings saved');
                } else {
                    window.alert('Error saving settings');
                }
        }).fail(function () {
            window.alert('AJAX error');
        });
    });

    // Helper: convert hex + opacity% to rgba string
    function hexToRgba(hex, opacityPercent) {
        if (!hex) return 'rgba(0,0,0,' + (Math.max(0, Math.min(100, opacityPercent || 100)) / 100) + ')';
        hex = hex.replace('#','');
        if (hex.length === 3) {
            hex = hex.split('').map(function (h) { return h + h; }).join('');
        }
        if (hex.length !== 6) {
            return 'rgba(0,0,0,' + (Math.max(0, Math.min(100, opacityPercent || 100)) / 100) + ')';
        }
        var r = parseInt(hex.substring(0,2),16);
        var g = parseInt(hex.substring(2,4),16);
        var b = parseInt(hex.substring(4,6),16);
        var a = Math.max(0, Math.min(100, opacityPercent || 100)) / 100;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    // Apply current form settings to the preview and update swatches
    function applySettingsToPreview() {
        var $preview = $('#esi-opening-hours-placeholder').find('.esi-opening-hours').first();
        if (!$preview.length) return;

        // read inputs / selects
        var fontSize = $('#esi_style_font_size').val() || '14';
        var fontWeight = $('#esi_style_font_weight').val() || '400';
        var dayAlign = $('#esi_style_day_align').val() || 'left';
        var timeAlign = $('#esi_style_time_align').val() || 'right';

        var bgOdd = $('#esi_style_bg_odd').val() || '#ffffff';
        var bgOddOp = parseInt($('#esi_style_bg_odd_opacity').val() || 100, 10);
        var bgEven = $('#esi_style_bg_even').val() || '#f7f7f7';
        var bgEvenOp = parseInt($('#esi_style_bg_even_opacity').val() || 100, 10);
        var rowSep = $('#esi_style_row_sep_color').val() || '#e5e5e5';
        var rowSepOp = parseInt($('#esi_style_row_sep_opacity').val() || 100, 10);
        var rowSepWeight = parseInt($('#esi_style_row_sep_weight').val() || 1, 10);
        var rowSepStyle = $('#esi_style_row_sep_style').val() || 'solid';
        var textOdd = $('#esi_style_text_odd_color').val() || '#222222';
        var textOddOp = parseInt($('#esi_style_text_odd_opacity').val() || 100, 10);
        var textEven = $('#esi_style_text_even_color').val() || '#222222';
        var textEvenOp = parseInt($('#esi_style_text_even_opacity').val() || 100, 10);

        var bgOddRgba = hexToRgba(bgOdd, bgOddOp);
        var bgEvenRgba = hexToRgba(bgEven, bgEvenOp);
        var rowSepRgba = hexToRgba(rowSep, rowSepOp);
        
        var textOddRgba = hexToRgba(textOdd, textOddOp);
        var textEvenRgba = hexToRgba(textEven, textEvenOp);
        var stateBg = $('#esi_style_state_bg').val() || '#000000';
        var stateBgOp = parseInt($('#esi_style_state_bg_opacity').val() || 0, 10);
        var stateFontSize = parseInt($('#esi_style_state_font_size').val() || 14, 10);
        var stateAlign = $('#esi_style_state_align').val() || 'left';
        var statePadding = parseInt($('#esi_style_state_padding').val() || 0, 10);

        var stateBgRgba = hexToRgba(stateBg, stateBgOp);

        // set CSS variables on preview element
        var el = $preview.get(0);
        try {
            el.style.setProperty('--esi-font-size', fontSize + 'px');
            el.style.setProperty('--esi-font-weight', fontWeight);
            el.style.setProperty('--esi-day-align', dayAlign);
            el.style.setProperty('--esi-time-align', timeAlign);
            el.style.setProperty('--esi-bg-odd', bgOddRgba);
            el.style.setProperty('--esi-bg-even', bgEvenRgba);
            el.style.setProperty('--esi-row-sep-color', rowSepRgba);
            el.style.setProperty('--esi-row-sep-weight', rowSepWeight + 'px');
            el.style.setProperty('--esi-row-sep-style', rowSepStyle);
            el.style.setProperty('--esi-text-odd', textOddRgba);
            el.style.setProperty('--esi-text-even', textEvenRgba);
            el.style.setProperty('--esi-state-bg', stateBgRgba);
            el.style.setProperty('--esi-state-font-size', stateFontSize + 'px');
            el.style.setProperty('--esi-state-align', stateAlign);
            el.style.setProperty('--esi-state-padding', statePadding + 'px');
        } catch (e) {
            // ignore
        }

        // update the single swatch within each picker container (avoid targeting duplicates)
        $('#esi_style_bg_odd').closest('.esi-alpha-picker').find('.esi-color-swatch').first().css('background', bgOddRgba);
        $('#esi_style_bg_even').closest('.esi-alpha-picker').find('.esi-color-swatch').first().css('background', bgEvenRgba);
        $('#esi_style_row_sep_color').closest('.esi-alpha-picker').find('.esi-color-swatch').first().css('background', rowSepRgba);
        $('#esi_style_text_odd_color').closest('.esi-alpha-picker').find('.esi-color-swatch').first().css('background', textOddRgba);
        $('#esi_style_text_even_color').closest('.esi-alpha-picker').find('.esi-color-swatch').first().css('background', textEvenRgba);
        $('#esi_style_state_bg').closest('.esi-alpha-picker').find('.esi-color-swatch').first().css('background', stateBgRgba);
    }

    // Bind change listeners for live updates
    $('#esi-settings-form').on('input change', 'input, select', function () {
        applySettingsToPreview();
    });

    // initial apply on page load
    applySettingsToPreview();

    // Attempt to initialize BraadMartin alpha-color-picker instances when available.
    function initExternalAlphaPicker() {
        // Wait for global to be available; handle multiple possible global names
        var tryInit = function () {
            var lib = window.AlphaColorPicker || window.alphaColorPicker || window.alphaColor || null;
            if (!lib) {
                // library not present — nothing to do, built-in UI remains
                return;
            }

            // If the library exposes a constructor or init method, try to bind it
            $('.esi-alpha-picker').each(function () {
                var $wrap = $(this);
                var $color = $wrap.find('.esi-alpha-color');
                var $opacity = $wrap.find('.esi-alpha-opacity');

                try {
                    // Common patterns: new AlphaColorPicker(element, opts) or lib.init(element)
                    if (typeof window.AlphaColorPicker === 'function') {
                        // instantiate on the color input and sync opacity manually
                        var instance = new window.AlphaColorPicker($color[0]);
                        // if instance exposes onChange, hook it
                        if (instance && typeof instance.on === 'function') {
                            instance.on('change', function (val) {
                                // val may include alpha; if so, update inputs
                                if (val && val.hex) { $color.val(val.hex).trigger('input'); }
                                if (val && typeof val.alpha !== 'undefined') { $opacity.val(Math.round(val.alpha * 100)).trigger('input'); }
                            });
                        }
                    } else if (lib && typeof lib.init === 'function') {
                        try { lib.init($color[0]); } catch (e) {}
                    }
                } catch (e) {
                    // ignore any init errors — fallback UI remains
                }
            });
        };
        // Run init on next tick
        setTimeout(tryInit, 200);
    }

    // Try to initialize external picker
    initExternalAlphaPicker();
});