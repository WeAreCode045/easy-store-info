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
                    }
                    window.alert('Settings saved');
                } else {
                    window.alert('Error saving settings');
                }
        }).fail(function () {
            window.alert('AJAX error');
        });
    });
});