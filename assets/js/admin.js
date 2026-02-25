/**
 * All of the JS for your admin-specific functionality should be
 * included in this file.
 */
jQuery(function ($) {
    // Admin settings media + save handler
    var frame;
    $(document).on('click', '.esi-add-media', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $item = $btn.closest('.esi-media-item');
        if (frame) { frame.open(); return; }
        frame = wp.media({ title: 'Select media', button: { text: 'Select' }, multiple: false });
        frame.on('select', function () {
            var attachment = frame.state().get('selection').first().toJSON();
            $item.find('input[type=hidden]').val(attachment.id);
            var img = attachment.sizes && attachment.sizes.medium ? attachment.sizes.medium.url : attachment.url;
            $item.find('.esi-media-empty').replaceWith('<div class="esi-thumb-wrap"><img src="' + img + '" /></div>');
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

    $('#esi-settings-form').on('submit', function (e) {
        e.preventDefault();
        var data = $(this).serializeArray();
        data.push({ name: 'action', value: 'esi_save_settings' });
        data.push({ name: 'nonce', value: esiAdmin.nonce });
        $.post(esiAdmin.ajax_url, data, function (res) {
            if (res && res.success) {
                window.alert('Settings saved');
            } else {
                window.alert('Error saving settings');
            }
        }).fail(function () {
            window.alert('AJAX error');
        });
    });
});