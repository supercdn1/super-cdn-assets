( function ( $ ) {
    "use strict";

    $( document ).ready( function () {

        // defining variables for multiple use
        const $body = $( 'body' );
        let comparePropStorageKey = 'inspiry_compare';

        if ( typeof comparePropVars !== "undefined"   ) {
            comparePropStorageKey += comparePropVars.id
        }

        // Render the added properties to compare data after page load.
        render_compare_properties_data();

        // Required for Ajax Pagination.
        window.realhomes_update_compare_properties = function () {

            // Get compare properties data from localStorage.
            let properties_string = window.localStorage.getItem( comparePropStorageKey );

            if ( null != properties_string ) {
                let properties_array_string = properties_string.split( '||' );
                if ( Array.isArray( properties_array_string ) && properties_array_string.length && properties_array_string[0] !== '' ) {

                    // Preparing an array for add to compare button placeholder
                    let properties_array = [];

                    properties_array_string.forEach( function ( property ) {
                        properties_array.push( JSON.parse( property ) );
                    } );

                    properties_array.forEach( function ( property ) {
                        // Highlight the add to compare button.
                        add_to_compare_btn_placeholder( property.property_id, true );
                    } );
                }
            }
        }

        // Toggle the compare properties tray and its button.
        $( 'html' ).on( 'click', '.rh_floating_compare_button', function ( e ) {
            $( '.rh_wrapper_properties_compare' ).toggleClass( 'rh_compare_open' );
            $( '.rh_fixed_side_bar_compare' ).fadeToggle( 200 );
            e.stopPropagation();
        } );

        // Add property to compare.
        $body.on( 'click', 'a.rh_trigger_compare', function ( event ) {
            event.preventDefault();

            // Prepare property data that has to be added.
            let compare_link = $( this ); // Add to compare button.
            let property_id  = compare_link.parent().data( 'property-id' );

            // Do nothing if property ID is not defined.
            if ( undefined === property_id ) {
                return;
            }

            let property_img   = compare_link.parent().data( 'property-image' ),
                property_url   = compare_link.parent().data( 'property-url' ),
                property_title = compare_link.parent().data( 'property-title' );

            // Highlight the add to compare button.
            add_to_compare_btn_placeholder( property_id, true );

            // Apply properties compare limit.
            apply_compare_properties_limit();

            // Add property card to the compare tray.
            add_property_to_compare_tray( property_id, property_title, property_img, property_url );

            // Add property to localStorage.
            add_property_to_localStorage( property_id, property_title, property_img, property_url );

            // Update compare properties button url.
            update_compare_button_url();

            // Update compare properties tray counter with number of properties available to compare.
            update_compare_tray_counter();

            // Control the properties compare tray display.
            control_compare_tray_display();
        } );

        /**
         * Remove property from compare.
         * */
        $body.on( 'click', 'a.rh_compare__remove, span.compare-placeholder', function ( event ) {
            event.preventDefault();

            // Prepare property data that has to be removed.
            let compare_link  = $( this ),
                property_id   = parseInt( compare_link.data( 'property-id' ) ),
                property_card = compare_link.parents( '.rh_compare__slide' );

            const property_toggle_id     = parseInt( compare_link.parent().data( 'property-id' ) ),
                  property_toggle_card   = $( '.rh_compare__carousel' )
                  .find( `[data-property-id = ' ${property_toggle_id} ']` ),
                  property_toggle_remove = property_toggle_card.parents( '.rh_compare__slide' );

            // Remove highlight of add to compare button.
            add_to_compare_btn_placeholder( property_id, false );

            // Remove highlight of add to compare button.
            add_to_compare_btn_placeholder( property_toggle_id, false );

            // Remove property card from compare tray.
            property_card.remove();

            // Remove property card from compare tray.
            property_toggle_remove.remove();

            // Update compare properties tray counter with number of properties available to compare.
            update_compare_tray_counter();

            // Control the properties compare tray display.
            control_compare_tray_display();

            if ( compare_link.hasClass( 'highlight' ) ) {
                // Remove property from localStorage.
                remove_property_from_localStorage( property_toggle_id );
            } else {
                // Remove property from localStorage.
                remove_property_from_localStorage( property_id );
            }

            // Update compare properties button url.
            update_compare_button_url();
        } );

        // Render compare properties data on page load.
        function render_compare_properties_data() {

            // Get compare properties data from localStorage.
            let properties_string = window.localStorage.getItem( comparePropStorageKey );

            if ( null != properties_string ) {
                let properties_array_string = properties_string.split( '||' );
                if ( Array.isArray( properties_array_string ) && properties_array_string.length && properties_array_string[0] !== '' ) {

                    // Build array of array from array of strings.
                    let properties_array = [];
                    properties_array_string.forEach( function ( property ) {
                        properties_array.push( JSON.parse( property ) );
                    } );

                    properties_array.forEach( function ( property ) {

                        // Highlight the add to compare button.
                        add_to_compare_btn_placeholder( property.property_id, true );

                        // Add property card to the compare tray.
                        add_property_to_compare_tray( property.property_id, property.property_title, property.property_img, property.property_url );
                    } );

                    // Update compare properties tray counter with number of properties available to compare.
                    update_compare_tray_counter();

                    // Control the properties compare tray display.
                    control_compare_tray_display();

                    // Update compare properties button url.
                    update_compare_button_url();
                }
            }
        }

        // Control compare tray display.
        function control_compare_tray_display() {

            let wrapperPropertiesCompare  = $( '.rh_wrapper_properties_compare' ),
                compare_properties_number = $( '.rh_compare .rh_compare__carousel > div' ).length;

            if ( compare_properties_number !== 0 ) {

                // Show the compare tray button.
                wrapperPropertiesCompare.addClass( 'rh_has_compare_children' );
                $body.addClass( 'rh-has-compare-properties' );
            } else {

                // Remove active color of compare tray button.
                wrapperPropertiesCompare.removeClass( 'rh_compare_open' );

                // Hide compare tray button.
                wrapperPropertiesCompare.removeClass( 'rh_has_compare_children' );

                $body.removeClass( 'rh-has-compare-properties' );

                $( '.rh_fixed_side_bar_compare' ).fadeOut( 0 ); // Hide compare tray.
            }
        }

        // Update compare properties count in compare tray.
        function update_compare_tray_counter() {
            let compareCountWrap = $( '.rh_compare_count' );
            compareCountWrap.fadeOut( 200, function () {
                let getDivCount = $( 'body .rh_compare .rh_compare__carousel > div' ).length;
                $( '.rh_wrapper_properties_compare .rh_compare_count' ).html( ' ( ' + getDivCount + '/4 ) ' );
            } );
            compareCountWrap.fadeIn( 200 );
        }

        function add_to_compare_btn_placeholder( property_id, placeholder ) {

            let compareButton = $( '.compare-btn-' + property_id );

            // Highlight the add to compare button.
            if ( placeholder ) {
                compareButton.find( '.compare-placeholder' ).removeClass( 'hide' );
                compareButton.find( 'a.rh_trigger_compare' ).addClass( 'hide' );
            } else {
                compareButton.find( '.compare-placeholder' ).addClass( 'hide' );
                compareButton.find( 'a.rh_trigger_compare' ).removeClass( 'hide' );
            }
        }

        // Compare limit for exceeding more than four properties in compare.
        function apply_compare_properties_limit() {

            const notificationBar = $( '#rh_compare_action_notification' );

            // Remove the oldest property from the list if number of properties goes above four.
            let slides_number = $( '.rh_compare__carousel .rh_compare__slide' ).length;
            if ( slides_number >= 4 ) {
                $( '.rh_compare__carousel .rh_compare__slide:nth-child(1) a.rh_compare__remove' ).trigger( "click" );

                notificationBar.addClass( 'show' );
                setTimeout( function () {
                    notificationBar.removeClass( 'show' );
                }, 6000 );
            }
        }

        // Add property card to the properties compare tray.
        function add_property_to_compare_tray( property_id, property_title, property_img, property_url ) {
            $( '.rh_compare__carousel' ).append(
                '<div class="rh_compare__slide">' +
                '<div class="rh_compare__slide_img">' +
                '<div class="rh_compare_img_inner">' +
                '<a target="_blank" href="' + property_url + '"><img src="' + property_img + '" width="488" height="326" ></a>' +
                '<a class="rh_compare__remove" data-property-id=" ' + property_id + ' " href=" ' + property_url + ' " ><i><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" style="fill:none;stroke-linejoin:round;stroke-width:2;stroke:currentColor">' +
                '<line x1="18" x2="6" y1="6" y2="18"/>' +
                '<line x1="6" x2="18" y1="6" y2="18"/>' +
                '</svg></i></a>' +
                '</div>' +
                '<a target="_blank" href="' + property_url + '" class="rh_compare_view_title">' + property_title + '</a>' +
                '</div>' +
                '</div>'
            );
        }

        // Add property to the localStorage.
        function add_property_to_localStorage( property_id, property_title, property_img, property_url ) {
            // Prepare property data object.
            let property_obj = {
                property_id,
                property_title,
                property_url,
                property_img
            };

            let new_property = JSON.stringify( property_obj );

            /**
             * Add property to the localStorage.
             */
            // Get compare properties data from localStorage.
            let old_properties = window.localStorage.getItem( comparePropStorageKey );

            if ( '' !== old_properties && null !== old_properties ) {
                window.localStorage.setItem( comparePropStorageKey, old_properties + '||' + new_property );
            } else {
                window.localStorage.setItem( comparePropStorageKey, new_property );
            }
        }

        // Remove property from localStorage.
        function remove_property_from_localStorage( property_id ) {

            // Get compare properties data from localStorage.
            let properties_array_string = window.localStorage.getItem( comparePropStorageKey ).split( '||' );

            // Build an array of array from array of strings.
            let properties_array = [];
            properties_array_string.forEach( function ( property ) {
                properties_array.push( JSON.parse( property ) );
            } );

            // Prepare properties array except property to remove.
            let properties_array_filtered = $.grep( properties_array, function ( property ) {
                return property.property_id != property_id && property.property_id != undefined;
            } );

            let properties_string = '';
            properties_array_filtered.forEach( function ( property ) {
                if ( properties_string !== '' ) {
                    properties_string += '||';
                }
                properties_string += JSON.stringify( property );
            } );
            window.localStorage.setItem( comparePropStorageKey, properties_string );
        }

        // Update compare properties button url with properties ids.
        function update_compare_button_url() {

            const compare_link = $( '.rh_compare__submit' );
            if ( ! compare_link.length ) {
                return false;
            }

            let compareLink = compare_link.attr( 'href' );
            if ( ! compareLink ) {
                return false;
            }

            let properties_array_string = window.localStorage.getItem( comparePropStorageKey ).split( '||' );
            if ( Array.isArray( properties_array_string ) && properties_array_string.length && properties_array_string[0] !== '' ) {
                let compare_url   = new URL( compareLink );
                let search_params = compare_url.searchParams;

                let properties_array = [];
                properties_array_string.forEach( function ( property ) {
                    properties_array.push( JSON.parse( property ) );
                } );

                let property_ids = '';
                properties_array.forEach( function ( property ) {
                    if ( '' === property_ids ) {
                        property_ids = property.property_id;
                    } else {
                        property_ids += ',' + property.property_id;
                    }
                } );

                search_params.append( 'id', property_ids );
                compare_url.search = search_params.toString();
                compareLink        = compare_url.toString();
            }

            compare_link.attr( 'href', compareLink );
        }
    } );

    /**
     * Adding compare properties list share by email
     * */
    let shareButtonsWrap     = $( '.compare-share-buttons' ),
        shareMailBtn         = $( '.compare-share-buttons ul li' ),
        shareMailWrap        = $( '.share-by-mail-wrap' ),
        compareShareURL      = $( '#compare-share-url' ).val(),
        compareShareNonce    = $( '#compare-share-nonce' ).val(),
        compareShareProgress = $( '.compare-share-progress' ),
        compareEmailField    = $( '#compare-share-email' ),
        compareLoader        = $( '.compare-share-progress .loader' ),
        compareMessage       = $( '.compare-share-progress .message' );

    // Triggering email button to open/close email form
    shareMailBtn.on( 'click', '.email', function ( e ) {
        e.preventDefault();
        if ( $( this ).hasClass( 'active' ) ) {
            $( this ).removeClass( 'active' ).parent( 'li' ).parent( 'ul' ).css( 'left', '' ).css( 'opacity', '' );
            shareMailWrap.fadeOut( 100 );
        } else {
            let shareButtonsWrapLeft = $('body').hasClass('design_ultra') ? '92px' : '86.6px';
            $( this ).addClass( 'active' ).parent( 'li' ).parent( 'ul' ).css( 'left', shareButtonsWrapLeft ).css( 'opacity', '1' );
            shareMailWrap.fadeIn( 100 );
        }
    } );

    // Triggering close button for email form wrap
    shareMailWrap.on( 'click', '.mail-wrap-close', function () {
        shareMailBtn.find( '.email' ).removeClass( 'active' );
        shareButtonsWrap.find( 'ul' ).css( 'left', '' ).css( 'opacity', '' );
        shareMailWrap.hide( 100 );
    } );

    // Removing error message from email field upon keypress
    compareEmailField.on( 'keypress', null, function () {
        $( '.fields .email-error' ).remove();
    } );

    // Triggering email submit request
    shareMailWrap.on( 'click', '#compare-mail-submit', function ( e ) {
        e.preventDefault();

        let targetEmail         = compareEmailField.val(),
            emailErrorStatement = compareEmailField.data( 'error-statement' );

        // Checking if email is good to go
        if ( realhomes_is_email( targetEmail ) ) {
            shareMailWrap.find( '.fields, label' ).fadeOut( 200, function () {
                compareShareProgress.fadeIn( 200 );
            } );

            // Email ajax request
            $.ajax( {
                type     : 'post',
                dataType : 'html',
                url      : ajaxurl,
                data     : {
                    action        : 'realhomes_share_compare_list_by_email',
                    compare_url   : compareShareURL,
                    target_email  : targetEmail,
                    compare_nonce : compareShareNonce
                },
                success  : function ( response ) {

                    // Check if response is already parsed or needs parsing
                    if ( typeof response === 'string' ) {
                        response = JSON.parse( response );
                    }

                    if ( response.success ) {
                        compareLoader.fadeOut( 200, function () {
                            compareMessage.html( '<i class="far fa-check-circle done-icon"></i><br>' + response.message )
                            .fadeIn( 200 );
                            setTimeout( function () {
                                shareMailWrap.fadeOut( 200, function () {

                                    // All the form reset process
                                    compareMessage.hide();
                                    compareLoader.show();
                                    compareShareProgress.hide();
                                    shareMailBtn.find( '.email' ).removeClass( 'active' );
                                    shareButtonsWrap.find( 'ul' ).css( 'left', '' ).css( 'opacity', '' );
                                    shareButtonsWrap.find( '.share-by-mail-wrap' ).hide();
                                    shareMailWrap.find( '.fields, label' ).show();
                                    compareEmailField.val( '' );
                                    $( '.fields .email-error' ).remove();
                                } );
                            }, 1200 );
                        } );
                    }
                }
            } );
        } else {
            // Error message if wrong email is provided
            compareEmailField.after( '<span class="email-error">' + emailErrorStatement + '</span>' );
        }
    } );

} )( jQuery );

/**
 * To check if field or any variable has valid email ID
 * In case of multiple emails, it will still verify each one
 * */
if ( typeof realhomes_is_email !== 'function' ) {
    function realhomes_is_email( emails ) {
        // Check if the input is empty or contains only whitespace
        if ( ! emails.trim() ) {
            return false;
        }

        // Regular expression to match a valid email format
        let emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Split the string by commas, trim each email, and filter out any empty strings
        let emailList = emails.split( ',' ).map( email => email.trim() ).filter( email => email !== '' );

        // Check if every email in the list matches the regex pattern
        return emailList.every( email => emailReg.test( email ) );
    }
}