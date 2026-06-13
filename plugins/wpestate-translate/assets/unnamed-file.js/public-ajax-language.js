/* global wprTranslateAjaxLang */
/**
 * Append the current language to front-end admin-ajax requests.
 *
 * @package WPR_Translate
 */
(function ($) {
    'use strict';

    if (typeof wprTranslateAjaxLang !== 'object' || !wprTranslateAjaxLang) {
        return;
    }

    var lang = wprTranslateAjaxLang.lang || '';
    var ajaxUrl = wprTranslateAjaxLang.ajaxUrl || '';

    if (!lang) {
        return;
    }

    var isAdminAjax = function (url) {
        if (!url) {
            return false;
        }

        if (ajaxUrl && url.indexOf(ajaxUrl) !== -1) {
            return true;
        }

        if (url.indexOf('admin-ajax.php') !== -1) {
            return true;
        }

        // WPResidence ships a custom AJAX endpoint (ajax_handler.php) that bypasses
        // wp-admin/admin-ajax.php when the wp_estate_use_custom_ajaxhandler option is on.
        // Treat it like admin-ajax so the lang parameter still reaches the server.
        return url.indexOf('ajax_handler.php') !== -1;
    };

    var hasLangParam = function (value) {
        if (!value || typeof value !== 'string') {
            return false;
        }

        return value.indexOf('lang=') !== -1;
    };

    $.ajaxPrefilter(function (options) {
        if (!options || !isAdminAjax(options.url || '')) {
            return;
        }

        if (hasLangParam(options.url || '')) {
            return;
        }

        var data = options.data;

        if (typeof data === 'string') {
            if (hasLangParam(data)) {
                return;
            }

            options.data = data ? data + '&lang=' + encodeURIComponent(lang) : 'lang=' + encodeURIComponent(lang);
            return;
        }

        if ($.isPlainObject(data)) {
            if (Object.prototype.hasOwnProperty.call(data, 'lang')) {
                return;
            }

            data.lang = lang;
            options.data = data;
            return;
        }

        if (data instanceof FormData) {
            if (data.has('lang')) {
                return;
            }

            data.append('lang', lang);
            options.data = data;
        }
    });
})(jQuery);
