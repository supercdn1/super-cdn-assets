( function ( $, window ) {
    "use strict";

    var $window = $( window ),
        $body   = $( 'body' ),
        isRtl   = $body.hasClass( 'rtl' );

    /**
     * Sticky Header
     *
     * @since 4.0.0
     */
    window.reahomesStickyHeader = function ( selector, widthThreshold = 1023, widthComparison = '>' ) {
        const stickyHeader = $( selector );

        if ( ! stickyHeader.length ) {
            return;
        }

        const $window      = $( window ),
              offset       = 100,
              headerHeight = stickyHeader.height();

        // Debounce function to limit how often a function is called
        const debounce = function ( func, delay ) {
            let timeout;
            return function () {
                const context = this,
                      args    = arguments;
                clearTimeout( timeout );
                timeout = setTimeout( function () {
                    func.apply( context, args );
                }, delay );
            };
        };

        // Function to handle comparison based on the passed operator
        const compareWidth = function ( windowWidth, threshold, operator ) {
            switch ( operator ) {
                case '>':
                    return windowWidth > threshold;
                case '>=':
                    return windowWidth >= threshold;
                case '<':
                    return windowWidth < threshold;
                case '<=':
                    return windowWidth <= threshold;
                default:
                    return windowWidth > threshold;
            }
        };

        const handleScroll = function () {
            const scrollTop   = $window.scrollTop();
            const windowWidth = $window.width();

            // Check width using the dynamic comparison operator
            if ( compareWidth( windowWidth, widthThreshold, widthComparison ) && scrollTop > ( headerHeight + offset ) ) {
                stickyHeader.addClass( 'sticked' );
            } else {
                stickyHeader.removeClass( 'sticked' );
            }
        };

        // Attach scroll event with debounce for better performance
        $window.on( 'scroll', debounce( handleScroll, 10 ) );

        // Ensure the width is checked on resize too
        $window.on( 'resize', debounce( handleScroll, 50 ) );
    };

    /**
     * Mega Menu Behavior
     *
     * Handles positioning and display logic for the RealHomes Mega Menu
     * in Modern and Ultra layouts. Ensures correct alignment when the
     * WordPress admin bar is visible and improves event performance
     * using delegated listeners.
     *
     * @since 4.4.5
     */
    ( function ( $ ) {
        // Early return if mega menu is not enabled
        if ( ! $body.hasClass( 'rh-mega-menu-enabled' ) ) {
            return;
        }

        const $wpAdminBar      = $( '#wpadminbar' );
        const wpAdminBarHeight = $wpAdminBar.length ? $wpAdminBar.outerHeight() : 0;
        const $megaMenuItems   = $( 'li.has-realhomes-mega-menu' );

        /**
         * Adjust Mega Menu position on hover or focus.
         * Supports both fullwidth and default-width layouts.
         */
        $megaMenuItems.on( 'mouseenter focusin', function () {
            const $menuItem       = $( this );
            const $megaMenu       = $menuItem.find( '.realhomes-mega-menu' ).first();
            const isFullOrDefault = $menuItem.hasClass( 'realhomes-mega-menu-fullwidth' ) || $menuItem.hasClass( 'realhomes-mega-menu-default-width' );

            if ( isFullOrDefault && $megaMenu.length ) {
                const itemOffset = $menuItem.offset();
                const itemHeight = $menuItem.outerHeight();

                $megaMenu.css( {
                    top : `${itemOffset.top + itemHeight - wpAdminBarHeight}px`
                } );
            }
        } );
    } )( jQuery );

    /**
     * Initializes the similar properties filters.
     *
     * @since 3.13
     */
    function similarPropertiesFilters() {
        const similarPropertiesFiltersWrap = $( '#similar-properties-filters-wrapper' );

        if ( similarPropertiesFiltersWrap.length ) {
            const similarPropertiesFilters = similarPropertiesFiltersWrap.find( 'a' ),
                  similarPropertiesWrapper = $( '#similar-properties-wrapper' ),
                  similarProperties        = $( '#similar-properties' ),
                  similarPropertiesHtml    = similarProperties.html(),
                  similarNonce             = similarPropertiesFiltersWrap.data( 'similar-properties-request-nonce' );

            // Check for localized similar properties data
            if ( typeof similarPropertiesData !== "undefined" ) {

                const design           = similarPropertiesData.design;
                let buttonClass        = 'rh-btn rh-btn-primary';
                let buttonClassCurrent = 'rh-btn rh-btn-secondary';

                if ( 'classic' === design ) {
                    buttonClass        = '';
                    buttonClassCurrent = 'current';
                }

                similarPropertiesFiltersWrap.on( 'click', 'a', function ( event ) {
                    event.preventDefault();

                    const self           = $( this );
                    const propertyFilter = self.data( 'similar-properties-filter' );

                    // Update UI for the selected filter button
                    similarPropertiesFilters.removeClass( buttonClassCurrent ).addClass( buttonClass );
                    self.removeClass( buttonClass ).addClass( buttonClassCurrent );

                    // Handle recommended properties (no AJAX required)
                    if ( 'recommended' === propertyFilter ) {
                        similarProperties.html( similarPropertiesHtml );
                        return;
                    }

                    // Make AJAX request to filter similar properties
                    $.ajax( {
                        url        : ajaxurl,
                        type       : 'post',
                        dataType   : 'json', // Expect JSON response
                        data       : {
                            action              : 'realhomes_filter_similar_properties',
                            property_id         : similarPropertiesData.propertyId,
                            properties_per_page : similarPropertiesData.propertiesPerPage,
                            property_filter     : propertyFilter,
                            design              : design,
                            nonce               : similarNonce
                        },
                        beforeSend : function () {
                            similarPropertiesWrapper.addClass( 'loading' );
                        },
                        success    : function ( response ) {
                            similarPropertiesWrapper.removeClass( 'loading' );

                            if ( response.success ) {
                                similarProperties.html( response.data );
                            } else {

                                console.warn( response.data.message || 'An unknown error occurred.' );
                                similarProperties.html(
                                    '<div class="error-message">' +
                                    ( response.data.message || 'An error occurred while fetching similar properties.' ) +
                                    '</div>'
                                );
                            }
                        },
                        error      : function ( jqXHR, textStatus, errorThrown ) {
                            // Remove loading state
                            similarPropertiesWrapper.removeClass( 'loading' );

                            // Handle HTTP errors (e.g., 404, 500, timeout)
                            console.error( 'AJAX Error:', textStatus, errorThrown );
                            similarProperties.html( '<div class="error-message">An error occurred while loading similar properties. Please try again later.</div>' );
                        }
                    } );
                } );

            } else {
                // Hide filters when no data available
                similarPropertiesFiltersWrap.hide();
            }
        }
    }

    /**
     * Adds css class in body to stack the floating features div if the property agent sticky bar exists in DOM.
     *
     * @since 3.14
     */
    function agentStickyBarHandler() {
        const agentStickyBar = $( '#property-agent-contact-methods-wrapper' );

        if ( 767 > $( window ).width() && agentStickyBar.length ) {
            $( 'body' ).addClass( 'has-agent-sticky-bar' );
        }
    }

    /**
     * Handles collapsible property features/amenities toggle functionality.
     *
     * Automatically shows/hides features based on:
     * - User-defined visible count from customizer settings
     * - Responsive button visibility (desktop/mobile/both)
     * - Screen size changes via resize listener
     *
     * When toggle button is hidden on current device, all features are automatically displayed.
     * When toggle button is visible, features beyond the visible count are initially hidden.
     *
     * @since 4.5.1
     */
    function rhFeaturesToggle() {
        const $btns = $( '.rh-features-toggle-btn' );

        if ( ! $btns.length ) {
            return;
        }

        $btns.each( function () {
            const $btn  = $( this );
            const $list = $btn.siblings( '.rh-features-toggle' );

            if ( ! $list.length ) {
                return;
            }

            // MOVED INSIDE: Ensure each button keeps its unique count/label
            const defaultLabel = $btn.text();
            const activeLabel  = $btn.data( 'toggle-label' );
            const visibleCount = parseInt( $btn.data( 'visible-count' ) ) || 6;

            function isButtonVisible() {
                return $btn.is( ':visible' ) && $btn.css( 'display' ) !== 'none';
            }

            // Attach the initialization logic to the element so we can call it externally
            $btn.on( 'rh:reinit', function () {
                const $hiddenItems = $list.find( 'li:nth-child(n+' + ( visibleCount + 1 ) + ')' );

                if ( isButtonVisible() ) {
                    if ( ! $list.hasClass( 'is-expanded' ) ) {
                        $hiddenItems.hide();
                        $btn.removeClass( 'is-active' )
                        .text( defaultLabel )
                        .attr( 'aria-expanded', 'false' );
                    }
                } else {
                    $hiddenItems.show();
                    $list.removeClass( 'is-expanded' );
                    $btn.removeClass( 'is-active' );
                }
            } );

            // Run initial state
            $btn.trigger( 'rh:reinit' );

            // Set width based on its own unique text
            const initialWidth = $btn.outerWidth();
            if ( initialWidth > 0 ) {
                $btn.css( 'min-width', initialWidth );
            }

            $btn.on( 'click', function ( event ) {
                event.preventDefault();

                if ( ! isButtonVisible() ) {
                    return;
                }

                const $hiddenItems = $list.find( 'li:nth-child(n+' + ( visibleCount + 1 ) + ')' );
                const isExpanded   = $list.hasClass( 'is-expanded' );

                $list.toggleClass( 'is-expanded' );
                $btn.toggleClass( 'is-active' );

                if ( isExpanded ) {
                    $hiddenItems.fadeTo( 200, 0, function () {
                        $( this ).slideUp( {
                            duration : 300,
                            easing   : 'swing',
                            complete : function () {
                                $btn.text( defaultLabel ).attr( 'aria-expanded', 'false' );
                            }
                        } );
                    } );
                } else {
                    $hiddenItems.css( 'opacity', 0 ).slideDown( {
                        duration : 300,
                        easing   : 'swing',
                        complete : function () {
                            $( this ).fadeTo( 200, 1 );
                            $btn.text( activeLabel ).attr( 'aria-expanded', 'true' );
                        }
                    } );
                }
            } );
        } );

        // Local resize listener to re-run initializeToggle
        let resizeTimer;
        $( window ).on( 'resize', function () {
            clearTimeout( resizeTimer );
            resizeTimer = setTimeout( function () {
                $btns.trigger( 'rh:reinit' );
            }, 250 );
        });
    }

    $( document ).ready( function () {
        // Remove the single property preloader when page is fully ready
        $body.removeClass( 'rh-single-property-preloader' );

        rhFeaturesToggle();

        function realhomesUnitSwitcher() {
            const $unitSwitcher = $( '#rh-measurement-unit-switcher-container' );

            if ( ! $unitSwitcher.length ) {
                return; // Exit if not found
            }

            const $switcherButton = $unitSwitcher.find( '#rh-current-measurement-unit' );
            const $optionsList    = $unitSwitcher.find( '.rh-measurement-units-list' );
            const $items          = $unitSwitcher.find( 'li' );
            const $nonce          = $unitSwitcher.find( '.rh-measurement-unit-switcher-nonce' ).val();

            $switcherButton.on( 'click', function ( e ) {
                e.preventDefault();
                $( this ).toggleClass( 'selected' );
                $optionsList.slideToggle( 200 );
            } );

            $( document ).on( 'click', function ( e ) {
                if ( ! $unitSwitcher.is( e.target ) && $unitSwitcher.has( e.target ).length === 0 ) {
                    $switcherButton.removeClass( 'selected' );
                    $optionsList.slideUp( 200 );
                }
            } );

            $items.on( 'click', function () {
                const $this = $( this );
                const value = $this.data( 'value' );

                $items.removeClass( 'selected' );
                $this.addClass( 'selected' );

                $switcherButton.html( $this.html() );

                $optionsList.slideUp( 200, function () {
                    $unitSwitcher.addClass( 'processing' );
                } );

                $.ajax( {
                    url     : ajaxurl,
                    type    : 'POST',
                    data    : {
                        action      : 'realhomes_switch_measurement_unit',
                        switch_unit : value,
                        nonce       : $nonce
                    },
                    success : function ( response ) {
                        if ( response.success ) {
                            $switcherButton.off();
                            $items.off();
                            location.reload();
                        } else {
                            $unitSwitcher.removeClass( 'processing' );
                            alert( response.data.message );
                        }
                    },
                    error   : function () {
                        $unitSwitcher.removeClass( 'processing' );
                        alert( unitSwitcherStrings.errorMessage );
                    }
                } );
            } );
        }

        realhomesUnitSwitcher();

        // Elementor Based Membership Packages Page
        let getStarted = document.querySelectorAll( '#membership-plans' );

        if ( typeof getStarted !== 'undefined' ) {

            let loginModel     = $( 'body' ).find( '.rh_login_modal_wrapper' );
            let membershipPage = dashboardData.membershipPage;
            let redirectTo     = document.querySelector( '.rh_login_modal_wrapper input[name="redirect_to"]' );

            if ( ! loginModel.length && typeof membershipPage !== 'undefined' ) {
                getStarted.forEach( function ( link ) {
                    link.setAttribute( 'href', membershipPage + '&submodule=checkout&package_id=' + link.getAttribute( "href" ).replace( '#', '' ) );
                } )
            } else {
                getStarted.forEach( function ( link ) {
                    link.addEventListener( 'click', function () {
                        if ( loginModel.length ) {
                            redirectTo.setAttribute( 'value', membershipPage + '&submodule=checkout&package_id=' + link.getAttribute( "href" ).replace( '#', '' ) );
                        }
                    } )
                } );
            }
        } // End of Membership Packages

        similarPropertiesFilters();
        agentStickyBarHandler();

        // TODO: need to find a way to run this code only on property single page.
        $window.on( 'resize', function () {
            agentStickyBarHandler();
        } );

        // Stop propagation of click event on favorites button when user is not logged in.
        $( '.add-favorites-without-login, .save-search-without-login' ).on( 'click', function ( event ) {
            event.stopPropagation();
        } );

        /*-----------------------------------------------------------------*/
        /* Save Searches for Email Alerts
        /*-----------------------------------------------------------------*/
        $( '#rh_save_search_btn' ).on( 'click', function ( e ) {
            e.preventDefault();
            let button          = $( this );
            let $form           = button.closest( 'form' );
            let searchArguments = $form.find('[name="search_args"]').val();
            let searchURL       = $form.find('[name="search_url"]').val();
            let nonce           = $form.find('[name="nonce"]').val();
            let icon            = button.find( 'i' );
            let savedLabel      = button.data( 'saved-label' );

            icon.addClass( 'fa-spin' );

            if ( button.hasClass( 'require-login' ) ) {

                // Prepare new alert object to store in local storage.
                let currentTime    = $form.find( '[name="current_time"]' ).val();
                let newSavedSearch = {
                    'wp_query_args' : searchArguments,
                    'query_str'     : searchURL,
                    'time'          : currentTime,
                    'search_id'     : null // Initially null, will be updated if user logs in
                };

                // Add new alert to the local storage.
                let oldSavedSearches = localStorage.getItem( 'realhomes_saved_searches' );
                let allSavedSearches = oldSavedSearches ? JSON.parse( oldSavedSearches ) : [];
                allSavedSearches.push( newSavedSearch );
                localStorage.setItem( 'realhomes_saved_searches', JSON.stringify( allSavedSearches ) );

                // Update the save alert button.
                button.addClass( 'search-saved' );
                icon.removeClass( 'fa-spin' );
                button.html( '<i class="far fa-bell"></i>' + savedLabel );

                // Open the login/register modal.
                let loginModal = $( 'body' ).find( '.rh_login_modal_wrapper' );
                if ( loginModal.length ) {
                    loginModal.css( "display", "flex" ).hide().fadeIn( 500 );
                } else {
                    window.location = button.data( 'login' );
                }

            } else {
                $.post( ajaxurl, {
                        nonce       : nonce,
                        action      : 'inspiry_save_search',
                        search_args : searchArguments,
                        search_url  : searchURL
                    },
                    function ( response ) {
                        response = JSON.parse( response );
                        if ( response.success ) {
                            let searchID = response.search_id; // Get the saved search ID

                            // Only save to local storage if user is not logged in
                            if ( ! $( 'body' ).hasClass( 'logged-in' ) ) {
                                let currentTime    = $form.find( '[name="current_time"]' ).val();
                                let newSavedSearch = {
                                    'wp_query_args' : searchArguments,
                                    'query_str'     : searchURL,
                                    'time'          : currentTime,
                                    'search_id'     : searchID // Store the saved search ID
                                };

                                let oldSavedSearches = localStorage.getItem( 'realhomes_saved_searches' );
                                let allSavedSearches = oldSavedSearches ? JSON.parse( oldSavedSearches ) : [];
                                allSavedSearches.push( newSavedSearch );
                                localStorage.setItem( 'realhomes_saved_searches', JSON.stringify( allSavedSearches ) );
                            }

                            // Update the save search button.
                            button.addClass( 'search-saved' );
                            icon.removeClass( 'fa-spin' );
                            button.html( '<i class="far fa-bell"></i>' + savedLabel );
                        }
                    }
                );
            }
        } );

        /*
         * Migrate saved searches from local storage to the server.
         */
        var allSavedSearches = JSON.parse( window.localStorage.getItem( 'realhomes_saved_searches' ) );

        if ( allSavedSearches && $( 'body' ).hasClass( 'logged-in' ) ) {
            $.ajax( {
                type    : 'GET',
                url     : ajaxurl,
                data    : {
                    action : 'realhomes_get_saved_search_migration_nonce'
                },
                success : function ( nonceResponse ) {
                    if ( nonceResponse !== 'false' ) {
                        $.ajax( {
                            type    : 'POST',
                            url     : ajaxurl,
                            data    : {
                                action         : 'realhomes_saved_searches_migration',
                                saved_searches : allSavedSearches,
                                _ajax_nonce    : nonceResponse
                            },
                            success : function ( response ) {
                                if ( response.success ) {
                                    // ✅ Correctly remove saved searches from local storage
                                    window.localStorage.removeItem( 'realhomes_saved_searches' );
                                }
                            }
                        } );
                    }
                }
            } );
        }

        /*-----------------------------------------------------------------*/
        /* Mortgage Calculator
        /*-----------------------------------------------------------------*/
        const mcPropertyWrapper = $( '.rh_property__mc_wrap, .rh-single-property-mortgage-calculator-v2' );

        if ( mcPropertyWrapper.length ) {
            const mcCostOverGraph = mcPropertyWrapper.find( '.mc_cost_over_graph' );

            let mc_reassign_fields = function ( $this = null ) {
                if ( 'object' === typeof $this && typeof $this.closest( '.rh_property__mc' ) ) {
                    $this          = $this.closest( '.rh_property__mc' );
                    mcState.fields = {
                        'term'               : $this.find( 'select.mc_term' ),
                        'interest_text'      : $this.find( '.mc_interset' ),
                        'interest_slider'    : $this.find( '.mc_interset_slider' ),
                        'price_text'         : $this.find( '.mc_home_price' ),
                        'price_slider'       : $this.find( '.mc_home_price_slider' ),
                        'downpayment_text'   : $this.find( '.mc_downpayment' ),
                        'downpayment_text_p' : $this.find( '.mc_downpayment_percent' ),
                        'downpayment_slider' : $this.find( '.mc_downpayment_slider' ),
                        'tax'                : $this.find( '.mc_cost_tax_value' ),
                        'hoa'                : $this.find( '.mc_cost_hoa_value' ),
                        'currency_sign'      : $this.find( '.mc_currency_sign' ),
                        'sign_position'      : $this.find( '.mc_sign_position' ),
                        'info_term'          : $this.find( '.mc_term_value' ),
                        'info_interest'      : $this.find( '.mc_interest_value' ),
                        'info_cost_interst'  : $this.find( '.mc_cost_interest span' ),
                        'info_cost_total'    : $this.find( '.mc_cost_total span' ),
                        'graph_interest'     : $this.find( '.mc_graph_interest' ),
                        'graph_tax'          : $this.find( '.mc_graph_tax' ),
                        'graph_hoa'          : $this.find( '.mc_graph_hoa' )
                    }

                    if ( mcCostOverGraph.length > 0 ) {
                        mcState.fields.info_cost_total = mcCostOverGraph;
                    }
                }
            }

            let mc_only_numeric = function ( data ) {
                if ( 'string' === typeof data ) {
                    return ( data.replace( /[^0-9-.]/g, '' ) ).replace( /^\./, '' ); // leave only numeric value.
                }
                return data;
            }

            let mc_input_focus = function () {
                $( this ).val( mc_only_numeric( $( this ).val() ) ); // leave only numeric value.
            }

            let mc_input_blur = function () {
                // percentage value.
                mcState.fields.interest_text.val( mc_only_numeric( mcState.fields.interest_text.val() ) + '%' );
                mcState.fields.downpayment_text_p.val( mc_only_numeric( mcState.fields.downpayment_text_p.val() ) + '%' );

                // formatted amount value.
                mcState.fields.price_text.val( mc_format_amount( mcState.fields.price_text.val() ) );
                mcState.fields.downpayment_text.val( mc_format_amount( mcState.fields.downpayment_text.val() ) );
            }

            let mc_format_amount = function ( amount ) {
                if ( 'after' === mcState.values.sign_position ) {
                    return new Intl.NumberFormat( 'en-us' ).format( mc_only_numeric( amount ) ) + mcState.values.currency_sign;
                }
                return mcState.values.currency_sign + new Intl.NumberFormat( 'en-us' ).format( mc_only_numeric( amount ) );
            }

            let mc_update_fields_values = function () {

                const $this = $( this );
                mc_reassign_fields( $this );
                mcState.values = mc_get_input_values(); // get all input values to be used for the calculation.

                if ( 'range' === $this.attr( 'type' ) ) {

                    if ( $this.hasClass( 'mc_interset_slider' ) ) { // Interest slider changed.

                        mcState.fields.interest_text.val( $this.val() + '%' ); // update interest percentage text field value.

                    } else if ( $this.hasClass( 'mc_home_price_slider' ) ) { // Price slider changed.

                        mcState.fields.price_text.val( mc_format_amount( $this.val() ) ); // update price text field value.

                        // update downpayment amount text field value according to the selected percentage.
                        let home_price  = $this.val();
                        let dp_percent  = mcState.values.downpayment_percent;
                        let downpayment = Math.round( ( home_price * dp_percent ) / 100 );

                        mcState.fields.downpayment_text.val( mc_format_amount( downpayment ) );

                    } else if ( $this.hasClass( 'mc_downpayment_slider' ) ) { // Downpayment slider.

                        mcState.fields.downpayment_text_p.val( $this.val() + '%' );

                        let home_price  = mcState.values.price;
                        let dp_percent  = $this.val();
                        let downpayment = Math.round( ( home_price * dp_percent ) / 100 );

                        mcState.fields.downpayment_text.val( mc_format_amount( downpayment ) );
                    }
                } else if ( 'text' === $this.attr( 'type' ) ) {

                    if ( $this.hasClass( 'mc_interset' ) ) {

                        mcState.fields.interest_slider.val( mcState.values.interest );

                    } else if ( $this.hasClass( 'mc_home_price' ) ) {

                        mcState.fields.price_slider.val( mcState.values.price );

                        let home_price  = mcState.values.price;
                        let dp_percent  = mcState.values.downpayment_percent;
                        let downpayment = Math.round( ( home_price * dp_percent ) / 100 );

                        mcState.fields.downpayment_text.val( mc_format_amount( downpayment ) );

                    } else if ( $this.hasClass( 'mc_downpayment_percent' ) ) {

                        mcState.fields.downpayment_slider.val( mcState.values.downpayment_percent );

                        let home_price  = mcState.values.price;
                        let dp_percent  = mcState.values.downpayment_percent;
                        let downpayment = ( home_price * dp_percent ) / 100;

                        mcState.fields.downpayment_text.val( mc_format_amount( downpayment ) );

                    } else if ( $this.hasClass( 'mc_downpayment' ) ) {

                        let home_price  = mcState.values.price;
                        let downpayment = mcState.values.downpayment;

                        let price      = ( home_price < downpayment ) ? downpayment : home_price;
                        let dp_percent = ( ( downpayment * 100 ) / price ).toFixed( 2 ).replace( /[.,]00$/, "" );

                        mcState.fields.downpayment_text_p.val( dp_percent + '%' );
                        mcState.fields.downpayment_slider.val( dp_percent );

                    }
                }

                mc_calculate();
            }

            let mc_get_input_values = function () {
                let interest            = mc_only_numeric( mcState.fields.interest_text.val() );
                let price               = mc_only_numeric( mcState.fields.price_text.val() );
                let downpayment         = mc_only_numeric( mcState.fields.downpayment_text.val() );
                let downpayment_percent = mc_only_numeric( mcState.fields.downpayment_text_p.val() );
                let tax                 = mc_only_numeric( mcState.fields.tax.val() );
                let hoa                 = mc_only_numeric( mcState.fields.hoa.val() );
                let currency_sign       = mcState.fields.currency_sign.val();
                let sign_position       = mcState.fields.sign_position.val();

                let mcInputVals = {
                    term                : parseInt( mcState.fields.term.val() ),
                    interest            : ( '' === interest.replace( '-', '' ) ) ? 0 : parseFloat( interest ),
                    price               : ( '' === price.replace( '-', '' ) ) ? 0 : parseFloat( price ),
                    downpayment         : ( '' === downpayment.replace( '-', '' ) ) ? 0 : parseFloat( downpayment ),
                    downpayment_percent : ( '' === downpayment_percent.replace( '-', '' ) ) ? 0 : parseFloat( downpayment_percent ),
                    tax                 : ( '' === tax.replace( '-', '' ) ) ? 0 : parseFloat( tax ),
                    hoa                 : ( '' === hoa.replace( '-', '' ) ) ? 0 : parseFloat( hoa ),
                    currency_sign       : ( '' === currency_sign ) ? '$' : currency_sign,
                    sign_position       : ( '' === sign_position ) ? 'before' : sign_position
                };

                return mcInputVals;
            }

            let mc_get_payment_calculate = function ( type ) {
                const values     = mcState.values;
                let home_price   = parseFloat( values.price ),
                    downpayment  = parseFloat( values.downpayment ),
                    loanBorrow   = home_price - downpayment,
                    totalTerms   = 12 * values.term,
                    interestRate = parseFloat( values.interest ) / 1200,
                    property_tax = parseFloat( values.tax ) || 0,
                    insurance    = parseFloat( values.insurance ) || 0,
                    otherDues    = parseFloat( values.hoa ) || 0;

                // Handle zero interest rate case
                let totalRepayment = 0;
                if ( parseInt( values.interest ) === 0 ) {
                    totalRepayment = loanBorrow;
                } else {
                    // Calculate monthly payment using the formula
                    let monthlyPayment = loanBorrow * ( interestRate * Math.pow( 1 + interestRate, totalTerms ) ) / ( Math.pow( 1 + interestRate, totalTerms ) - 1 );
                    totalRepayment     = monthlyPayment * totalTerms;
                }

                // Add property tax, insurance, and HOA dues
                totalRepayment += property_tax * values.term + insurance * values.term + otherDues * values.term;

                if ( type === "total" ) {
                    return Math.round( totalRepayment * 100 ) / 100;
                } else if ( type === "monthly" ) {
                    return Math.round( ( totalRepayment / totalTerms ) * 100 ) / 100;
                }
            };

            let mc_get_principle_interest = function () {
                return mc_get_payment_calculate( "total" );
            };

            let mc_get_payment_per_month = function () {
                return mc_get_payment_calculate( "monthly" );
            };

            let mc_get_data_percentage = function () {
                let principal_interest = mcState.principal_interest,
                    property_tax       = mcState.values.tax,
                    hoa_dues           = mcState.values.hoa,
                    total_payment      = principal_interest + property_tax + hoa_dues;

                // Calculate percentages
                let p_i = ( principal_interest * 100 ) / total_payment,
                    tax = ( property_tax * 100 ) / total_payment,
                    hoa = ( hoa_dues * 100 ) / total_payment;

                return {
                    p_i,
                    tax,
                    hoa
                };
            }

            // Function to update a circle's strokeDashoffset
            let updateCircle = function ( $circle, percentage ) {
                let r   = parseFloat( $circle.attr( 'r' ) );
                let c   = Math.PI * ( r * 2 );
                let pct = ( ( 100 - percentage ) / 100 ) * c;
                $circle.css( {
                    strokeDasharray  : c,
                    strokeDashoffset : pct
                } );
            };

            let mc_render_information = function () {
                let cost_prefix = mcState.fields.info_cost_total.attr( 'data-cost-prefix' );

                // Update calculated information.
                mcState.fields.info_term.text( mcState.values.term );
                mcState.fields.info_interest.text( mcState.values.interest );
                mcState.fields.info_cost_total.html( '<strong>' + mc_format_amount( mcState.payment_per_month ) + '</strong>' + cost_prefix ); // Per month container
                mcState.fields.info_cost_interst.text( mc_format_amount( mcState.principal_interest ) ); // Principal and Interest container

                if ( mcCostOverGraph.length > 0 ) {
                    // Update each circle
                    updateCircle( mcState.fields.graph_interest, mcState.percentage.p_i );
                    updateCircle( mcState.fields.graph_tax, mcState.percentage.p_i + mcState.percentage.tax );
                    updateCircle( mcState.fields.graph_hoa, mcState.percentage.p_i + mcState.percentage.tax + mcState.percentage.hoa );
                } else {
                    // Update bar graph and total cost.
                    mcState.fields.info_cost_total.text( mc_format_amount( mcState.payment_per_month ) ); // Per month container
                    mcState.fields.graph_interest.css( 'width', ( mcState.percentage.p_i ) + '%' );
                    mcState.fields.graph_tax.css( 'width', ( mcState.percentage.tax ) + '%' );
                    mcState.fields.graph_hoa.css( 'width', ( mcState.percentage.hoa ) + '%' );
                }
            }

            let mc_calculate = function () {
                mcState.values             = mc_get_input_values(); // get all input vaues to be used for the calculation.
                mcState.principal_interest = mc_get_principle_interest(); // caclcualte and get the Principal and Interest amount.
                mcState.payment_per_month  = mc_get_payment_per_month(); // calculate and get the per month payment to be paid.
                mcState.percentage         = mc_get_data_percentage(); // calculate and get the percentages of the data for the graph display.
                mc_render_information(); // Display the information on frontend side.
            }

            const mcState  = {};
            mcState.fields = {
                'term'               : $( 'select.mc_term' ),
                'interest_text'      : $( '.mc_interset' ),
                'interest_slider'    : $( '.mc_interset_slider' ),
                'price_text'         : $( '.mc_home_price' ),
                'price_slider'       : $( '.mc_home_price_slider' ),
                'downpayment_text'   : $( '.mc_downpayment' ),
                'downpayment_text_p' : $( '.mc_downpayment_percent' ),
                'downpayment_slider' : $( '.mc_downpayment_slider' ),
                'tax'                : $( '.mc_cost_tax_value' ),
                'hoa'                : $( '.mc_cost_hoa_value' ),
                'currency_sign'      : $( '.mc_currency_sign' ),
                'sign_position'      : $( '.mc_sign_position' ),
                'info_term'          : $( '.mc_term_value' ),
                'info_interest'      : $( '.mc_interest_value' ),
                'info_cost_interst'  : $( '.mc_cost_interest span' ),
                'info_cost_total'    : $( '.mc_cost_total span' ),
                'graph_interest'     : $( '.mc_graph_interest' ),
                'graph_tax'          : $( '.mc_graph_tax' ),
                'graph_hoa'          : $( '.mc_graph_hoa' )
            }

            if ( mcCostOverGraph.length > 0 ) {
                mcState.fields.info_cost_total = mcCostOverGraph;
            }

            mc_calculate(); // Initiate Mortgage Calculator.
            mc_input_blur(); // Format the amounts in the text fields.

            // Apply calculation action on calculator values change.
            $( '.rh_mc_field select, .rh_mc_field input[type=range]' ).on( 'change', mc_update_fields_values );
            $( '.rh_mc_field input[type=range]' ).on( 'input', mc_update_fields_values );
            $( '.rh_mc_field input[type=text]' ).on( 'keyup', mc_update_fields_values );

            // Add focus and blur actions on text input fields.
            $( '.rh_mc_field input[type=text]' ).on( 'focus', mc_input_focus );
            $( '.rh_mc_field input[type=text]' ).on( 'blur', mc_input_blur );
        }

        /*-----------------------------------------------------------------------------------*/
        /* Language Switcher
        /*-----------------------------------------------------------------------------------*/
        $body.on( 'click', '.inspiry-language', function ( e ) {
            if ( $( '.inspiry-language-switcher' )
                 .find( '.rh_languages_available' )
                 .children( '.inspiry-language' ).length > 0 ) {
                const wrapper_language_switcher = $( '.rh_wrapper_language_switcher' );
                wrapper_language_switcher.toggleClass( 'parent_open' );

                if ( wrapper_language_switcher.hasClass( 'parent_open' ) ) {
                    $( this ).addClass( 'open' );
                    $( '.rh_languages_available' ).fadeIn( 200 );

                } else {
                    $( this ).removeClass( 'open' );
                    $( '.rh_languages_available' ).fadeOut( 200 );

                }
            }
            e.stopPropagation();
        } );

        $( 'html' ).on( 'click', function () {
            $( '.rh_wrapper_language_switcher' ).removeClass( 'parent_open' );
            $( 'html .inspiry-language' ).removeClass( 'open' );
            $( '.rh_languages_available' ).fadeOut( 200 );
        } );

        /*-----------------------------------------------------------------------------------*/
        /* Partners Carousel
        /*-----------------------------------------------------------------------------------*/
        if ( jQuery().owlCarousel ) {
            $( '.brands-owl-carousel' ).owlCarousel( {
                nav                : true,
                dots               : false,
                navText            : ['<i class="fas fa-caret-left"></i>', '<i class="fas fa-caret-right"></i>'],
                loop               : true,
                autoplay           : true,
                autoplayTimeout    : 4500,
                autoplayHoverPause : true,
                margin             : 0,
                rtl                : isRtl,
                responsive         : {
                    0    : {
                        items : 1
                    },
                    480  : {
                        items : 2
                    },
                    768  : {
                        items : 3
                    },
                    992  : {
                        items : 4
                    },
                    1199 : {
                        items : 5
                    }
                }
            } );
        }

        /*-----------------------------------------------------------------------------------*/

        /* Agent form's validation script for property detail page.
        /*-----------------------------------------------------------------------------------*/
        function inspiryValidateForm( form ) {
            var $form            = $( form ),
                submitButton     = $form.find( '.submit-button' ),
                ajaxLoader       = $form.find( '.ajax-loader' ),
                messageContainer = $form.find( '.message-container' ),
                errorContainer   = $form.find( ".error-container" ),
                formOptions      = {
                    beforeSubmit : function () {
                        submitButton.attr( 'disabled', 'disabled' );
                        ajaxLoader.fadeIn( 'fast' ).css( "display", "inline-block" );
                        messageContainer.fadeOut( 'fast' );
                        errorContainer.fadeOut( 'fast' );
                    },
                    success      : function ( ajax_response, statusText, xhr, $form ) {
                        var response = $.parseJSON( ajax_response );
                        ajaxLoader.fadeOut( 'fast' );
                        submitButton.removeAttr( 'disabled' );
                        if ( response.success ) {
                            $form.resetForm();
                            messageContainer.html( response.message ).fadeIn( 'fast' );

                            // call reset function if it exists
                            if ( typeof inspiryResetReCAPTCHA == 'function' ) {
                                inspiryResetReCAPTCHA();
                            }

                            if ( typeof agentData !== 'undefined' ) {
                                setTimeout( function () {
                                    window.location.replace( agentData.redirectPageUrl );
                                }, 1000 );
                            } else {
                                setTimeout( function () {
                                    messageContainer.fadeOut( 'slow' )
                                }, 3000 );
                            }
                        } else {
                            errorContainer.html( response.message ).fadeIn( 'fast' );
                        }
                    }
                };

            $form.validate( {
                errorLabelContainer : errorContainer,
                submitHandler       : function ( form ) {
                    $( form ).ajaxSubmit( formOptions );
                }
            } );
        }

        if ( jQuery().validate && jQuery().ajaxSubmit ) {
            if ( $body.hasClass( 'single-property' ) ) {
                var getAgentForms = $( '.agent-form' );
                if ( getAgentForms.length ) {
                    $.each( getAgentForms, function ( i, form ) {
                        var id = $( form ).attr( "id" );
                        inspiryValidateForm( '#' + id );
                    } );
                }
            }
        }

        /*-----------------------------------------------------------------------------------*/
        /* Login Required Function
        /*-----------------------------------------------------------------------------------*/
        $( 'body' ).on( 'click', '.inspiry_submit_login_required', function ( e ) {
            e.preventDefault();
            $( '.rh_login_modal_wrapper' ).css( "display", "flex" ).hide().fadeIn( 500 );
        } );

        /*-----------------------------------------------------------------------------------*/
        /* Report property modal script.
        /*-----------------------------------------------------------------------------------*/
        if ( $body.hasClass( 'single-property' ) ) {
            const reportThisProperty = $( '.report-this-property' );
            if ( reportThisProperty.length ) {
                reportThisProperty.on( 'click', null, function ( event ) {
                    // Target model id
                    let targetModelID       = $( this ).attr( 'href' );
                    let reportPropertyModal = $( targetModelID );

                    if ( reportPropertyModal.length ) {
                        const reportPropertyForm    = $( "#report-property-form" ),
                              ajaxLoader            = reportPropertyForm.find( ".ajax-loader" ),
                              submitButton          = reportPropertyForm.find( "#btn-submit" ),
                              responseContainer     = reportPropertyForm.find( '#response-container' ),
                              errorContainer        = reportPropertyForm.find( '#error-container' ),
                              mainOptionsContainer  = reportPropertyForm.find( "#report-property-form-main-options" ),
                              childOptionsContainer = reportPropertyForm.find( "#report-property-form-child-options" ),
                              customMessage         = reportPropertyForm.find( "#feedback-custom-message" ),
                              backButton            = reportPropertyForm.find( "#btn-back" );

                        reportPropertyModal.css( "display", "flex" ).hide().fadeIn( 250 ).addClass( "show" );

                        reportPropertyModal.find( ".btn-close" ).on( 'click', function ( event ) {
                            reportPropertyModal.removeClass( "show" ).fadeOut( 250, function () {
                                reportPropertyModal.removeClass( "has-response" );
                                responseContainer.addClass( "hide" );
                                responseContainer.find( ".response-title" ).html( '' );
                                responseContainer.find( ".response-text" ).html( '' );
                                backButton.trigger( "click" );
                                reportPropertyForm.resetForm();
                            } );
                            event.preventDefault();
                        } );

                        reportPropertyForm.find( "#feedback-option-custom-parent-item" ).on( 'click', function ( event ) {
                            mainOptionsContainer.addClass( "hide" );
                            childOptionsContainer.removeClass( "hide" )
                            backButton.removeClass( "hide" );
                            errorContainer.hide();
                        } );

                        reportPropertyForm.find( "#feedback-child-option-custom-child-item" ).on( 'change', function ( event ) {
                            if ( $( this ).is( ":checked" ) ) {
                                customMessage.removeClass( "hide" );
                            } else {
                                customMessage.addClass( "hide" ).removeClass( 'error' );
                                errorContainer.hide();
                            }
                        } );

                        backButton.on( 'click', function ( event ) {
                            $( this ).addClass( "hide" );
                            reportPropertyForm.find( "input[type='radio']" ).prop( "checked", false );
                            reportPropertyForm.find( "input[type='checkbox']" ).prop( "checked", false );
                            childOptionsContainer.addClass( "hide" );
                            mainOptionsContainer.removeClass( "hide" );
                            customMessage.addClass( "hide" ).removeClass( 'error' );
                            errorContainer.hide();
                        } );

                        if ( jQuery().validate && jQuery().ajaxSubmit ) {
                            reportPropertyForm.validate( {
                                rules               : {
                                    "feedback-option"          : {
                                        required : true
                                    },
                                    "feedback-child-options[]" : {
                                        required : "#feedback-option-custom-parent-item:checked"
                                    },
                                    "feedback-custom-message"  : {
                                        required : "#feedback-child-option-custom-child-item:checked"
                                    }
                                },
                                errorLabelContainer : errorContainer,
                                submitHandler       : function ( form ) {
                                    reportPropertyForm.ajaxSubmit( {
                                        beforeSubmit : function () {
                                            ajaxLoader.fadeIn( "fast" ).css( "display", "inline-block" );
                                            submitButton.attr( "disabled", "disabled" );
                                            backButton.addClass( "hide" );
                                            responseContainer.addClass( "hide" );
                                            reportPropertyModal.removeClass( "has-response" )
                                            errorContainer.fadeOut( 250 );
                                        },
                                        success      : function ( ajax_response, statusText, xhr, form ) {
                                            const response = $.parseJSON( ajax_response );
                                            ajaxLoader.fadeOut( "fast" );
                                            submitButton.removeAttr( "disabled" );
                                            backButton.removeClass( "hide" );
                                            reportPropertyModal.addClass( "has-response" );
                                            responseContainer.removeClass( "hide" ).fadeIn( "fast" );
                                            responseContainer.find( ".response-title" ).html( response.title );
                                            responseContainer.find( ".response-text" ).html( response.message );

                                            if ( response.success ) {
                                                reportPropertyForm.resetForm();
                                            }
                                        }
                                    } );
                                }
                            } );
                        }
                    }

                    event.preventDefault();
                } );
            }

        }

        /*-----------------------------------------------------------------------------------*/
        /* BootStrap Select
        /*-----------------------------------------------------------------------------------*/
        window.inspirySelectPicker = function ( id ) {
            if ( jQuery().selectpicker ) {
                jQuery( id ).selectpicker( {
                    iconBase        : 'fas',
                    width           : "100%",
                    size            : 5,
                    tickIcon        : 'fa-check',
                    selectAllText   : '<span class="inspiry_select_bs_buttons inspiry_bs_select">' +
                                      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><polygon points="22.1 9 20.4 7.3 14.1 13.9 15.8 15.6 "/><polygon points="27.3 7.3 16 19.3 9.6 12.8 7.9 14.5 16 22.7 29 9 "/><polygon points="1 14.5 9.2 22.7 10.9 21 2.7 12.8 "/></svg>' +
                                      '</span>',
                    deselectAllText : '<span class="inspiry_select_bs_buttons inspiry_bs_deselect"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><style type="text/css">  \n' +
                                      '\t.rh-st0{fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:10;}\n' +
                                      '</style><path class="inspiry_des rh-st0" d="M3.4 10.5H20c3.8 0 7 3.1 7 7v0c0 3.8-3.1 7-7 7h-6"/><polyline class="inspiry_des rh-st0" points="8.4 15.5 3.4 10.5 8.4 5.5 "/></svg></span>'

                } );

                $( ".rh_sort_controls .inspiry_select_picker_trigger" ).click( function ( e ) {

                    if ( ! $( this ).hasClass( 'open' ) ) {
                        $( this ).addClass( 'open' );
                        e.stopPropagation();
                    } else {
                        $( this ).removeClass( 'open' );
                        e.stopPropagation();
                    }
                } );
            }
        };

        inspirySelectPicker( 'body .inspiry_select_picker_trigger' );
        inspirySelectPicker( 'body .widget_categories select' );
        inspirySelectPicker( 'body .widget_archive select' );

        // TODO: Remove this if it is not required.
        // inspirySelectPicker('.inspiry_select_picker_mod');

        $( ".inspiry_multi_select_picker_location" ).on( 'change', function ( e, clickedIndex, isSelected, previousValue ) {
            setTimeout( function () {
                $( '.inspiry_multi_select_picker_location' ).selectpicker( 'refresh' );
            }, 500 );
        } );

        $( ".inspiry_bs_submit_location" ).on( 'changed.bs.select', function () {
            $( '.inspiry_bs_submit_location' ).selectpicker( 'refresh' );
        } );

        $( ".inspiry_select_picker_status" ).on( 'changed.bs.select', function () {
            $( '.inspiry_select_picker_price' ).selectpicker( 'refresh' );
        } );

        $( '.inspiry_select_picker_trigger' ).on( 'show.bs.select', function () {
            $( this ).parents( '.rh_prop_search__option' ).addClass( 'inspiry_bs_is_open' )
        } );

        $( '.inspiry_select_picker_trigger' ).on( 'hide.bs.select', function () {
            $( this ).parents( '.rh_prop_search__option' ).removeClass( 'inspiry_bs_is_open' )
        } );

        var locationSuccessList = function ( data, thisParent, refreshList = false ) {
            if ( true === refreshList ) {
                thisParent.find( 'option' ).not( ':selected, .none' ).remove().end();
            }
            var getSelected = $( thisParent ).val();
            jQuery.each( data, function ( index, text ) {
                if ( getSelected ) {
                    if ( getSelected.indexOf( text[0] ) < 0 ) {
                        thisParent.append(
                            $( '<option value="' + text[0] + '">' + text[1] + '</option>' )
                        );
                    }
                } else {
                    thisParent.append(
                        $( '<option value="' + text[0] + '">' + text[1] + '</option>' )
                    );
                }
            } );
            thisParent.selectpicker( 'refresh' );
            $( parent ).find( 'ul.dropdown-menu li:first-of-type a' ).focus();
            $( parent ).find( 'input' ).focus();
        };

        var loaderFadeIn = function () {
            $( '.rh-location-ajax-loader' ).fadeIn( 'fast' );
        };

        var loaderFadeOut = function () {
            $( '.rh-location-ajax-loader' ).fadeOut( 'fast' );
        };

        var rhTriggerAjaxOnLoad = function ( thisParent, fieldValue = '' ) {

            $.ajax( {
                url        : localizeSelect.ajax_url,
                dataType   : 'json',
                delay      : 250, // delay in ms while typing when to perform a AJAX search
                data       : {
                    action : 'realhomes_get_location_options', // AJAX action for admin-ajax.php
                    query  : fieldValue
                    // TODO: review the commented code below and remove if it is not required.
                    // hideemptyfields: localizeSelect.hide_empty_locations,
                    // sortplpha: localizeSelect.sort_location,
                },
                beforeSend : loaderFadeIn(),
                success    : function ( data ) {
                    loaderFadeOut();
                    locationSuccessList( data, thisParent, true );
                }
            } );
        };

        var rhTriggerAjaxOnScroll = function ( thisParent, farmControl, fieldValue = '' ) {
            var paged = 2;
            farmControl.on( 'keyup', function ( e ) {
                paged      = 2;
                fieldValue = $( this ).val();
            } );

            $( 'div.inspiry_ajax_location_field div.inner' ).on( 'scroll', function () {
                var thisInner       = $( this );
                var thisInnerHeight = thisInner.innerHeight();
                var getScrollIndex  = thisInner.scrollTop() + thisInnerHeight;
                if ( getScrollIndex >= $( this )[0].scrollHeight ) {

                    $.ajax( {
                        url        : localizeSelect.ajax_url,
                        dataType   : 'json',
                        delay      : 250, // delay in ms while typing when to perform a AJAX search
                        data       : {
                            action : 'realhomes_get_location_options', // AJAX action for admin-ajax.php
                            query  : fieldValue,
                            page   : paged
                            // TODO: review the commented code below and remove if it is not required.
                            // hideemptyfields: localizeSelect.hide_empty_locations,
                            // sortplpha: localizeSelect.sort_location,
                        },
                        beforeSend : loaderFadeIn(),
                        success    : function ( data ) {
                            loaderFadeOut();
                            if ( ! $.trim( data ) ) {
                                $( '.rh-location-ajax-loader' ).fadeTo( "fast", 0 );
                            }

                            paged++;
                            locationSuccessList( data, thisParent, false );
                        }
                    } );
                }
            } );
        };

        var inspiryAjaxSelect = function ( parent, id ) {
            var farmControl = $( parent ).find( '.form-control' );
            var thisParent  = $( id );
            rhTriggerAjaxOnScroll( thisParent, farmControl );
            rhTriggerAjaxOnLoad( thisParent );
            farmControl.on( 'keyup', function ( e ) {
                var fieldValue = $( this ).val();
                fieldValue     = fieldValue.trim();
                var wordcounts = jQuery.trim( fieldValue ).length;
                // TODO: review the commented code below and remove if it is not required.
                // rhTriggerAjaxLoadMore(thisParent,fieldValue);
                $( '.rh-location-ajax-loader' ).fadeTo( "fast", 1 );
                if ( wordcounts > 0 ) {
                    $.ajax( {
                        url        : localizeSelect.ajax_url,
                        dataType   : 'json',
                        delay      : 250, // delay in ms while typing when to perform a AJAX search
                        data       : {
                            action : 'realhomes_get_location_options', // AJAX action for admin-ajax.php
                            query  : fieldValue
                            // TODO: review the commented code below and remove if it is not required.
                            // hideemptyfields: localizeSelect.hide_empty_locations,
                            // sortplpha: localizeSelect.sort_location,
                        },
                        beforeSend : loaderFadeIn(),
                        success    : function ( data ) {
                            loaderFadeOut();
                            thisParent.find( 'option' ).not( ':selected, .none' ).remove().end();
                            // TODO: review the commented code below and remove if it is not required.
                            // var options = [];
                            if ( fieldValue && data ) {
                                locationSuccessList( data, thisParent );
                            } else {
                                thisParent.find( 'option' ).not( ':selected, .none' ).remove().end();
                                thisParent.selectpicker( 'refresh' );
                                $( parent ).find( 'ul.dropdown-menu li:first-of-type a' ).focus();
                                $( parent ).find( 'input' ).focus();
                            }
                        }
                    } );
                    // TODO: review the commented code below and remove if it is not required.
                    // rhTriggerAjaxLoadMore(thisParent,fieldValue);
                } else {
                    rhTriggerAjaxOnLoad( thisParent );
                }
            } );
        };
        inspiryAjaxSelect( '.inspiry_ajax_location_wrapper', 'select.inspiry_ajax_location_field' );

        // Show on document ready to avoid glitching screen
        $( '.rhea_long_screen_header_temp' ).removeClass( 'rhea-hide-before-load' );
        $( '.rh_apply_sticky_wrapper_footer' ).removeClass( 'rhea-hide-before-load' );
        $( '.rh-custom-search-form-wrapper' ).removeClass( 'rhea-hide-before-load' );
        $( '.ere-custom-search-form-wrapper' ).removeClass( 'rhea-hide-before-load' );

        $( 'div' ).removeClass( 'rh-hide-before-ready' );
    } );

    // Remove class that hide elements before load to avoid glitching screen
    $( window ).on( 'load', function () {
        let hiddenContainers = $( 'div, form' );
        if ( hiddenContainers.hasClass( 'rh-hide-before-load' ) ) {
            hiddenContainers.removeClass( 'rh-hide-before-load' );
        }
    } );

    window.rhUltraTooltip = function ( selector ) {

        $( selector ).tooltip( {
            classes  : {
                "ui-tooltip" : "rh-ultra-tooltip"
            },
            position : {
                my    : "center bottom-10",
                at    : "center top",
                using : function ( position, feedback ) {
                    $( this ).css( position );
                    $( "<div>" )
                    .addClass( "arrow" )
                    .addClass( feedback.vertical )
                    .addClass( feedback.horizontal )
                    .appendTo( this );
                }
            }
        } );
    }

    $( document ).on( 'ready', function () {
        $( '.inspiry_show_on_doc_ready' ).show();
        rhUltraTooltip( '.rh-ui-tooltip' );
        //jQuery UI tooltip
    } );

    /**
     * Compare property template sticky table head script
     * Uses Sticky-kit plugin
     * URL: https://github.com/leafo/sticky-kit
     *
     * @since 4.1.1
     */
    function comparePropertyStickyHead() {
        const compareHead = $( '.sticky-compare-head, .sticky-head-smart' );
        if ( ! compareHead.length ) {
            return false;
        }

        let screenWidth = $( window ).width();
        if ( 1024 <= screenWidth ) {
            const $body   = $( 'body' );
            let offsetTop = 0;

            if ( $body.hasClass( 'admin-bar' ) ) {
                offsetTop += 32;
            }

            compareHead.stick_in_parent( { offset_top : offsetTop } )
        } else {
            compareHead.trigger( "sticky_kit:detach" );
        }
    }

    // Scripts to run on window load and resize events.
    $( window ).on( 'load resize', function () {
        comparePropertyStickyHead();
    } );

    /*-----------------------------------------------------------------------------------*/
    /* Favorite Properties
    /*-----------------------------------------------------------------------------------*/
    var addToFavorites = function ( e ) {
        e.preventDefault();

        if ( $( this ).hasClass( 'require-login' ) ) {
            var loginBox   = $( '.rh_menu__user_profile' );
            var loginModel = loginBox.find( '.rh_modal' );

            if ( loginModel.length ) {
                $( '.rh_login_modal_wrapper' ).css( "display", "flex" ).hide().fadeIn( 500 );
            } else {
                window.location = $( this ).data( 'login' );
            }
        } else {
            var favorite_link = $( this );
            var span_favorite = $( this ).parent().find( 'span.favorite-placeholder' );

            var propertyID = favorite_link.data( 'propertyid' );
            var ajax_url   = ajaxurl;

            if ( propertyID !== '' ) {
                if ( favorite_link.hasClass( 'user_logged_in' ) ) {
                    var add_to_favorite_options = {
                        type    : 'post',
                        url     : ajax_url,
                        data    : {
                            action      : 'add_to_favorite',
                            property_id : propertyID,
                            nonce       : favoritesLocalizedData.favorites_nonce
                        },
                        success : function ( response ) {
                            if ( response.success ) {
                                favorite_link.addClass( 'hide' );
                                span_favorite.delay( 200 ).removeClass( 'hide' );
                            } else {
                                console.error( response.data.message );
                            }
                        },
                        error   : function ( jqXHR, textStatus, errorThrown ) {
                            console.error( 'AJAX Error:', textStatus, errorThrown );
                        }
                    };
                    $.ajax( add_to_favorite_options );
                } else {
                    var currentIDs = window.localStorage.getItem( 'inspiry_favorites' );

                    if ( currentIDs ) {
                        window.localStorage.setItem( 'inspiry_favorites', currentIDs + ',' + propertyID );
                    } else {
                        window.localStorage.setItem( 'inspiry_favorites', propertyID );
                    }

                    favorite_link.addClass( 'hide' );
                    span_favorite.delay( 200 ).removeClass( 'hide' );
                }
            }

        }
    };
    $( 'body' ).on( 'click', 'a.add-to-favorite', addToFavorites );

    var favorite_properties = window.localStorage.inspiry_favorites; // Get local favorite properties data.

    // Display favorited button and favorite properties on favorite page.
    if ( favorite_properties && ! $( 'body' ).hasClass( 'logged-in' ) ) {

        // To display favorited button on page load.
        var property_ids = favorite_properties.split( ',' );
        property_ids.forEach( function ( element, index ) {
            var favorite_btn_wrap = $( '.favorite-btn-' + element );
            var favorite_link     = favorite_btn_wrap.find( 'a.add-to-favorite' );
            var span_favorite     = favorite_btn_wrap.find( 'span.favorite-placeholder' );

            $( favorite_link ).addClass( 'hide' );
            $( span_favorite ).delay( 200 ).removeClass( 'hide' );
        } );

        // Display favorite properties on the favorites page.
        var favorite_prop_page = $( '.favorite_properties_ajax' );
        if ( favorite_prop_page.length ) {
            var design_variation = 'classic';
            if ( $( 'body' ).hasClass( 'design_modern' ) ) {
                design_variation = 'modern';
            }

            var favorite_prop_options = {
                type     : 'post',
                dataType : 'html',
                url      : ajaxurl,
                data     : {
                    action           : 'display_favorite_properties',
                    prop_ids         : favorite_properties.split( ',' ),
                    design_variation : design_variation,
                    nonce            : favoritesLocalizedData.favorites_nonce
                },
                success  : function ( response ) {
                    if ( response.success ) {
                        favorite_prop_page.html( response.data );
                        remove_from_favorite( $( 'a.remove-from-favorite' ) ); // Assuming this function exists.
                    } else {
                        console.error( response.message ); // Log error message if something goes wrong.
                    }
                },
                error    : function ( jqXHR, textStatus, errorThrown ) {
                    console.error( 'AJAX Error:', textStatus, errorThrown );
                }
            };

            $.ajax( favorite_prop_options );
        }
    }

    // Migrate favorite properties from local to server.
    if ( favorite_properties && $( 'body' ).hasClass( 'logged-in' ) ) {
        var migrate_prop_options = {
            type    : 'post',
            url     : ajaxurl,
            data    : {
                action   : 'inspiry_favorite_prop_migration',
                prop_ids : favorite_properties.split( ',' )
            },
            success : function ( response ) {
                if ( 'true' === response ) {
                    window.localStorage.removeItem( 'inspiry_favorites' );
                }
            }
        };
        $.ajax( migrate_prop_options );
    }

    // Remove favorite properties.
    remove_from_favorite( $( 'a.remove-from-favorite' ) );
    remove_from_favorite( $( '.favorite-placeholder.highlight__red' ) );

    function remove_from_favorite( remove_button ) {
        remove_button.on( 'click', function ( event ) {

            event.preventDefault();

            var $this         = $( this );
            var property_item = $this.closest( '.favorite-btn-wrap' );

            if ( ! property_item.length ) {
                property_item = $this.closest( 'article' );
            }

            // If the user is not logged in, handle localStorage-based favorites.
            if ( ! remove_button.hasClass( 'user_logged_in' ) ) {
                var favorite_properties = window.localStorage.inspiry_favorites;

                if ( favorite_properties ) {
                    var prop_ids = favorite_properties.split( ',' ).map( function ( value ) {
                        return parseInt( value, 10 );
                    } );

                    const index = prop_ids.indexOf( $this.data( 'propertyid' ) );
                    if ( index > -1 ) {
                        if ( $this.hasClass( 'highlight__red' ) ) {
                            var favorite_link = property_item.find( 'a.add-to-favorite' );
                            var span_favorite = property_item.find( 'span.favorite-placeholder' );

                            $( span_favorite ).addClass( 'hide' );
                            $( favorite_link ).delay( 200 ).removeClass( 'hide' );
                        } else {
                            property_item.delay( 200 ).remove();
                        }

                        // Update localStorage after removing the property.
                        prop_ids.splice( index, 1 );
                        window.localStorage.setItem( 'inspiry_favorites', prop_ids.join( ',' ) );
                    }
                }

                return;
            }

            // Prevent duplicate clicks by adding a "processing" class.
            if ( $this.hasClass( 'processing' ) ) {
                return;
            }
            $this.addClass( 'processing' );

            var close = $( this ).find( 'i' );
            close.addClass( 'fa-spin' );

            // AJAX request to remove the property from favorites.
            var remove_favorite_request = $.ajax( {
                url      : ajaxurl,
                type     : "POST",
                data     : {
                    property_id : $this.data( 'propertyid' ),
                    action      : "remove_from_favorites",
                    nonce       : favoritesLocalizedData.favorites_nonce
                },
                dataType : "json"
            } );

            // Success callback for AJAX request.
            remove_favorite_request.done( function ( response ) {
                close.removeClass( 'fa-spin' );
                $this.removeClass( 'processing' ); // Remove the "processing" class.

                if ( response.success ) {
                    if ( $this.hasClass( 'highlight__red' ) ) {
                        var favorite_link = property_item.find( 'a.add-to-favorite' );
                        var span_favorite = property_item.find( 'span.favorite-placeholder' );

                        $( span_favorite ).addClass( 'hide' );
                        $( favorite_link ).delay( 200 ).removeClass( 'hide' );
                    } else {
                        property_item.delay( 200 ).remove();
                    }
                } else {
                    console.error( response.message || "An unknown error occurred." );
                }
            } );

            // Error callback for AJAX request.
            remove_favorite_request.fail( function ( jqXHR, textStatus, errorThrown ) {
                console.log( jqXHR, textStatus, errorThrown );
                close.removeClass( 'fa-spin' );
                $this.removeClass( 'processing' ); // Remove the "processing" class.

                console.error( 'AJAX Error:', textStatus, errorThrown );
            } );
        } );
    }

    // Ajax Pagination Fix
    window.realhomes_update_favorites = function () {
        remove_from_favorite( $( 'a.remove-from-favorite' ) );
        remove_from_favorite( $( '.favorite-placeholder.highlight__red' ) );
    }

    // Generating agent/agency stats doughnut charts
    $( '.stats-wrap .tax-stats-chart' ).each( function ( index, element ) {
        try {

            let thisObj = JSON.parse( element.dataset.chartStats ),
                labels  = thisObj.labels,
                values  = thisObj.values,
                colors  = thisObj.colors;

            // Validate and parse chart data
            if ( ! element.dataset.chartStats ) {
                console.error( "Missing 'data-chart-stats' on element:", element );
                return;
            }

            if ( ! thisObj.labels || ! thisObj.values || ! thisObj.colors ) {
                console.error( "Invalid chart data structure:", thisObj );
                return;
            }

            // Ensure the element is a valid canvas
            let ctx = element.getContext( '2d' );
            if ( ! ctx ) {
                console.error( "Canvas context could not be retrieved for:", element );
                return;
            }

            const data = {
                labels   : labels,
                datasets : [{
                    data            : values,
                    backgroundColor : colors,
                    hoverOffset     : 4
                }]
            };

            const config = {
                type    : 'doughnut',
                data    : data,
                options : {
                    responsive          : true,
                    maintainAspectRatio : true,
                    plugins             : {
                        legend  : {
                            display : false
                        },
                        tooltip : {
                            enabled : false // Disables tooltips on hover
                        }
                    }
                }
            };

            new Chart( element.getContext( '2d' ), config );

        } catch ( error ) {
            console.error( "Error generating chart:", error );
        }
    } );

    /**
     * Handles restoration of interactive form elements after BFCache navigation.
     *
     * Ensures that disabled fields are re-enabled and Bootstrap-select elements
     * are reinitialized when a page is restored from the browser’s back-forward cache (BFCache).
     *
     * @since 4.4.5
     */
    window.addEventListener( "pageshow", function ( event ) {
        // Check if page was restored from bfcache
        if ( event.persisted ) {
            // Re-enable any disabled fields
            document.querySelectorAll( '.rhea-ultra-search-form-fields [disabled]' ).forEach( el => {
                el.removeAttribute( 'disabled' );
            } );

            // Reinitialize Bootstrap-select
            if ( typeof jQuery !== 'undefined' && jQuery.fn.selectpicker ) {
                jQuery( '.rhea_multi_select_picker' ).selectpicker( 'refresh' );
            }
        }
    } );

} )( jQuery, window );