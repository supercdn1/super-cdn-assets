/**
 * ES6 Class for Elementor Ultra Search Form and Search Form 2
 *
 * @since 2.2.0
 * */
class ultraSearchWidgetClass extends elementorModules.frontend.handlers.Base {

    getDefaultSettings() {
        return {
            selectors : {
                geoLocationAddress : '#geolocation-address-' + this.getID(),
                locationFieldWrap  : '#location-fields-wrap-' + this.getID(),
                geoRadiusSlider    : '#geolocation-radius-slider-wrapper-' + this.getID()
            }
        };
    }

    getDefaultElements() {
        const selectors = this.getSettings( 'selectors' );
        return {
            $geoLocationAddress : this.$element.find( selectors.geoLocationAddress ),
            $locationFieldWrap  : this.$element.find( selectors.locationFieldWrap ),
            $geoRadiusSlider    : this.$element.find( selectors.geoRadiusSlider )
        };
    }

    onInit() {
        const urlParams     = new URLSearchParams( window.location.search );
        const localizedData = window.localized || {};

        this.config = {
            debounceDelay : 500,
            scrollOffset  : 50,
            scrollSpeed   : 1000,
            loadingClass  : 'ajax-results-loading'
        };

        this.state = {
            fieldValues           : {},
            additionalFieldsArray : [],
            view                  : urlParams.get( 'rhea-properties-view' ) || 'grid',
            paged                 : 1,
            currentURL            : window.location.href,
            mapService            : localizedData.mapService || 'openstreetmaps',
            timer                 : null
        };

        // Cache nonce once
        this.nonce = localizedData.nonce || '';

        // Namespace for document-level events (unique per widget instance)
        this.eventNamespace = '.rheaSearch_' + this.getID();

        const additionalFields           = localizedData.additionalFields || [];
        this.state.additionalFieldsArray = additionalFields.map( field => field.field_key );

        this.ajaxXHR = {
            viewType   : null,
            listing    : null,
            map        : null,
            pagination : null
        };

        // Identify and cache the target properties widget
        this.initTargetWidget();

        super.onInit();

        this.updateFieldValues();
        this.bindEvents();
    }

    /**
     * Locate and cache the target properties widget element and its sub-containers.
     */
    initTargetWidget() {
        let $propertiesWidget;
        let targetId = this.getElementSettings( 'property_widget_id' );

        if ( targetId ) {
            $propertiesWidget = jQuery( '#' + targetId );
        }

        if ( ! $propertiesWidget || ! $propertiesWidget.length ) {
            $propertiesWidget = jQuery( '.rhea-ultra-properties-container' ).first();
            if ( $propertiesWidget.length && ! targetId ) {
                targetId = $propertiesWidget.attr( 'id' );
            }
        }

        if ( $propertiesWidget && $propertiesWidget.length ) {
            this.target = {
                targetId          : targetId,
                $parent           : $propertiesWidget.closest( '.elementor-widget-rhea-ultra-properties-widget-1' ),
                $propertiesWidget : $propertiesWidget,
                $stats            : $propertiesWidget.find( '.rhea-ultra-properties-top-bar-stats-wrapper' ),
                $results          : $propertiesWidget.find( '#rhea-filterable-properties-container' ),
                $pagination       : $propertiesWidget.find( '.pagination' )
            };
        } else {
            this.target = null;
        }
    }

    /**
     * Clean up event listeners, timers, and pending AJAX requests.
     */
    onDestroy() {
        // Abort any in-flight AJAX requests
        Object.values( this.ajaxXHR ).forEach( xhr => {
            if ( xhr && typeof xhr.abort === 'function' ) {
                xhr.abort();
            }
        } );

        // Clear debounce timer
        if ( this.state?.timer ) {
            clearTimeout( this.state.timer );
        }

        // Remove namespaced document-level events
        jQuery( document ).off( this.eventNamespace );

        // Remove form-level events
        const $form = this.$element.find( 'form' );
        $form.off( this.eventNamespace );

        super.onDestroy();
    }

    bindEvents() {
        this.loadUltraSearchWidget();
        this.bindInstantResultsEvents();
    }

    /**
     * Collect all search field values and normalize them.
     */
    updateFieldValues() {
        const $form     = this.$element.find( 'form' );
        const data      = $form.serializeArray();
        const rawValues = {};

        data.forEach( item => {
            const name  = item.name;
            const value = item.value;
            if ( ! value || value === 'any' || value === '-1' ) {
                return;
            }

            if ( rawValues[name] ) {
                if ( ! Array.isArray( rawValues[name] ) ) {
                    rawValues[name] = [rawValues[name]];
                }
                rawValues[name].push( value );
            } else {
                rawValues[name] = value;
            }
        } );

        const getVal           = ( key ) => rawValues[key] || rawValues[key + '[]'] || '';
        this.state.fieldValues = {
            additionalFieldsValues : [],
            features               : getVal( 'features' ) || [],
            locations              : getVal( 'location' ) || '',
            childLocation          : getVal( 'child-location' ) || '',
            grandchildLocation     : getVal( 'grandchild-location' ) || '',
            greatGrandchildLocation: getVal( 'great-grandchild-location' ) || '',
            types                  : getVal( 'type' ) || getVal( 'property-type' ) || '',
            statuses               : getVal( 'status' ) || '',
            agents                 : getVal( 'agents' ) || getVal( 'agent' ) || '',
            agencies               : getVal( 'agencies' ) || getVal( 'agency' ) || '',
            keywords               : getVal( 'keyword' ) || '',
            propertyID             : getVal( 'property-id' ) || '',
            bedrooms               : getVal( 'bedrooms' ) || '',
            bathrooms              : getVal( 'bathrooms' ) || '',
            minPrice               : getVal( 'min-price' ) || '',
            maxPrice               : getVal( 'max-price' ) || '',
            garages                : getVal( 'garages' ) || '',
            minArea                : getVal( 'min-area' ) || '',
            maxArea                : getVal( 'max-area' ) || '',
            minLotSize             : getVal( 'min-lot-size' ) || '',
            maxLotSize             : getVal( 'max-lot-size' ) || '',
            checkIn                : getVal( 'check-in' ) || '',
            checkOut               : getVal( 'check-out' ) || '',
            guests                 : getVal( 'guests' ) || '',
            geolocationAddress     : getVal( 'geolocation-address' ) || '',
            lat                    : getVal( 'lat' ) || '',
            lng                    : getVal( 'lng' ) || '',
            geolocationRadius      : getVal( 'geolocation-radius' ) || ''
        };

        // Process additional fields
        this.state.additionalFieldsArray.forEach( fieldKey => {
            const val = getVal( fieldKey );
            if ( val ) {
                this.state.fieldValues.additionalFieldsValues.push( [{
                    additional_field_name  : fieldKey,
                    additional_field_value : val
                }] );
            }
        } );
    }

    /**
     * Filter out empty or 'any' values
     */
    getActiveFilters() {
        const activeFilters = {};
        Object.entries( this.state.fieldValues ).forEach( ( [key, val] ) => {
            if ( key === 'additionalFieldsValues' ) {
                if ( val && val.length > 0 ) {
                    activeFilters[key] = val;
                }
                return;
            }

            if ( Array.isArray( val ) ) {
                if ( val.length > 0 && val.some( v => v && v !== 'any' && v !== '' ) ) {
                    activeFilters[key] = val;
                }
            } else if ( val && val !== 'any' && val !== '' ) {
                activeFilters[key] = val;
            }
        } );

        if ( this.state.view ) {
            activeFilters.view = this.state.view;
        }

        return activeFilters;
    }

    triggerSearchUpdate() {
        this.updateFieldValues();

        const activeFilters = this.getActiveFilters();
        const url           = this.getSanitizedURL();

        // Rebuild query from normalized fieldValues
        url.search = '';
        Object.entries( activeFilters ).forEach( ( [key, val] ) => {
            if ( key === 'view' ) {
                url.searchParams.set( 'rhea-properties-view', val );
                return;
            }

            if ( key === 'additionalFieldsValues' ) {
                val.forEach( fieldGroup => {
                    const field = fieldGroup[0];
                    url.searchParams.append( field.additional_field_name, field.additional_field_value );
                } );
                return;
            }

            if ( Array.isArray( val ) ) {
                val.forEach( v => url.searchParams.append( key + '[]', v ) );
            } else {
                url.searchParams.append( key, val );
            }
        } );

        this.updateBrowserURL( url );
        this.performAjaxSearch();
    }

    performAjaxSearch() {
        this.fetchListingResults();
        this.fetchMapResults();
    }

    fetchListingResults( page = 1 ) {
        if ( ! this.target ) {
            return;
        }

        if ( this.ajaxXHR.listing ) {
            this.ajaxXHR.listing.abort();
        }

        const $loader = this.target.$propertiesWidget.find( '.rhea-ultra-properties-inner-container' );
        $loader.addClass( this.config.loadingClass );

        this.target.$pagination.css( 'opacity', 0 );

        this.ajaxXHR.listing = jQuery.ajax( {
            url      : ajaxurl,
            type     : 'post',
            data     : {
                action          : 'realhomes_filter_ajax_search_results',
                nonce           : this.nonce,
                search_url      : this.state.currentURL,
                elementorWidget : true,
                page            : page,
                ...this.getTargetSettings(),
                ...this.getActiveFilters()
            },
            success  : ( response ) => {
                if ( response?.data ) {
                    this.updateResultsDOM( response.data );
                }
            },
            error    : ( jqXHR, textStatus ) => {
                if ( textStatus !== 'abort' ) {
                    console.warn( 'RealHomes AJAX search failed:', textStatus, jqXHR.responseText );
                }
            },
            complete : () => {
                $loader.removeClass( this.config.loadingClass );
                this.reinitThemeFeatures();
            }
        } );
    }

    updateResultsDOM( data ) {
        if ( ! this.target ) {
            return;
        }

        const {
                  stats,
                  search_results,
                  pagination
              } = data;

        if ( stats && this.target.$stats.length ) {
            this.target.$stats.html( stats );
        }

        if ( search_results && this.target.$results.length ) {
            if ( data.results_classes ) {
                this.target.$results.attr( 'class', data.results_classes );
            }
            this.target.$results.html( search_results );
        }

        if ( this.target.$pagination.length ) {
            if ( pagination ) {
                this.target.$pagination.html( pagination ).css( 'opacity', 1 );
            } else {
                this.target.$pagination.css( 'opacity', 0 );
            }
        }
    }

    fetchMapResults( paged = 1 ) {
        if ( this.ajaxXHR.map ) {
            this.ajaxXHR.map.abort();
        }

        this.ajaxXHR.map = jQuery.ajax( {
            url     : ajaxurl,
            type    : 'post',
            data    : {
                action : 'realhomes_map_ajax_search_results',
                nonce  : this.nonce,
                ...this.getActiveFilters(),
                page : paged
            },
            success : ( response ) => {
                if ( response?.data ) {
                    this.updateMapMarkers( response.data.propertiesData );
                }
            },
            error   : ( jqXHR, textStatus ) => {
                if ( textStatus !== 'abort' ) {
                    console.warn( 'RealHomes map AJAX failed:', textStatus );
                }
            }
        } );
    }

    getTargetSettings() {
        if ( this.target?.$parent?.length ) {
            const settings = this.target.$parent.data( 'settings' );
            if ( settings ) {
                // Force enable_search to 'yes' if this search form has instant results enabled
                if ( 'yes' === this.getElementSettings( 'enable_instant_results' ) ) {
                    settings['enable_search'] = 'yes';
                }
                return settings;
            }
        }
        return {};
    }

    updateMapMarkers( data ) {
        const service = this.state.mapService;
        if ( service === 'openstreetmaps' && typeof realhomes_update_open_street_map === 'function' ) {
            realhomes_update_open_street_map( data );
        } else if ( service === 'mapbox' && typeof realhomes_update_mapbox === 'function' ) {
            const $mapWrap = jQuery( '#listing-map' );
            if ( ! $mapWrap.length ) {
                jQuery( '#map-head' ).empty().append( '<div id="listing-map"></div>' );
            }
            realhomes_update_mapbox( data );
        } else if ( typeof realhomes_update_google_map === 'function' ) {
            realhomes_update_google_map( data );
        }

        // Update Elementor addon map widget (open-street-map.js listens for this event)
        const mapEvent         = jQuery.Event( 'rheaUpdateMapData' );
        mapEvent.mapProperties = JSON.stringify( data );
        jQuery( window ).trigger( mapEvent );
    }

    reinitThemeFeatures() {

        // Re-init favorite properties
        if ( typeof realhomes_update_favorites === 'function' ) {
            realhomes_update_favorites();
        }

        // Re-init compare properties
        if ( typeof realhomes_update_compare_properties === 'function' ) {
            realhomes_update_compare_properties();
        }

        // Re-init tooltips
        if ( typeof rhUltraTooltip === 'function' ) {
            rhUltraTooltip( '.rh-ui-tooltip' );
        }

        // Re-init infobox popups
        if ( typeof realhomesInfoboxPopupTrigger === 'function' ) {
            realhomesInfoboxPopupTrigger();
        }

        // Custom event for third-party extensions
        jQuery( document ).trigger( 'realhomes_ajax_search_updated' );
    }

    updateBrowserURL( url ) {
        const urlString       = url instanceof URL ? url.toString() : url;
        this.state.currentURL = urlString;
        window.history.pushState( {}, '', urlString );
    }

    getSanitizedURL() {
        const url = new URL( window.location.href );
        this._cleanPathname( url );
        return url;
    }

    buildPaginationURL( page ) {
        const url = new URL( window.location.href );

        // Clean pathname using helper
        this._cleanPathname( url );

        // Append /page/N/ for pages beyond the first
        if ( page > 1 ) {
            url.pathname += 'page/' + page + '/';
        }

        return url.toString();
    }

    _cleanPathname( url ) {
        // Strip any existing /page/N/ segment from the pathname
        url.pathname = url.pathname.replace( /\/page\/\d+\/?/, '/' );

        // Ensure trailing slash on the base path
        if ( ! url.pathname.endsWith( '/' ) ) {
            url.pathname += '/';
        }
    }

    bindInstantResultsEvents() {
        if ( 'yes' !== this.getElementSettings( 'enable_instant_results' ) ) {
            return;
        }

        const ns    = this.eventNamespace;
        const $form = this.$element.find( 'form' );

        // Standard Change Events
        const changeTriggers = [
            '.inspiry_select_picker_trigger',
            '.ajax-location-field',
            '.rh_keyword_field_wrapper',
            '.rh_mod_text_field input:not(#geolocation-address)',
            '.more-options-wrapper',
            '.rhea_price_slider',
            '.rhea_multi_select_picker',
            '.rhea_multi_select_picker_location',
            '.rhea_top_search_box select',
            '.rhea_top_search_box input',
            '.rhea-ultra-search-form-fields select',
            '.rhea-ultra-search-form-fields input',
            '.rhea-ultra-tabs-list input',
            '#geolocation-radius-slider',
            '#geolocation-address-' + this.getID()
        ].join( ', ' );
        $form.on( 'change' + ns + ' apply.daterangepicker' + ns + ' slidechange' + ns, changeTriggers, ( e ) => {
            e.stopImmediatePropagation();
            this.triggerSearchUpdate();
        } );

        // Keyup Search Events
        const keyupTriggers = [
            '.rh_mod_text_field input:not(#geolocation-address)',
            '.rh_keyword_field_wrapper input',
            '#keyword-txt',
            '#property-id-txt'
        ].join( ', ' );
        $form.on( 'keyup' + ns, keyupTriggers, ( e ) => {
            e.stopImmediatePropagation();
            clearTimeout( this.state.timer );
            this.state.timer = setTimeout( () => {
                this.triggerSearchUpdate();
            }, this.config.debounceDelay );
        } );

        // Guard: remaining events require a valid target widget
        if ( ! this.target ) {
            return;
        }

        // View Toggle Event
        jQuery( document ).on( 'click' + ns, `#${this.target.targetId} .rh-ultra-view-type a`, ( event ) => {
            event.preventDefault();

            const $button = jQuery( event.currentTarget );
            if ( $button.hasClass( 'active' ) ) {
                return;
            }

            this.state.view = $button.hasClass( 'list' ) ? 'list' : 'grid';

            // Update Browser URL and Fetch Results
            this.triggerSearchUpdate();

            // Update UI
            $button.addClass( 'active' ).siblings().removeClass( 'active' );
        } );

        // Pagination Event
        jQuery( document ).on( 'click' + ns, `#${this.target.targetId} .pagination > a`, ( event ) => {
            event.preventDefault();

            const $button = jQuery( event.currentTarget );

            if ( $button.hasClass( 'current' ) ) {
                return;
            }

            const page = parseInt( $button.attr( 'data-page' ) ) || 1;
            const url  = this.buildPaginationURL( page );

            // Fetch results via AJAX action
            this.fetchListingResults( page );
            this.fetchMapResults( page );
            this.updateBrowserURL( url );

            jQuery( 'html, body' ).stop( true, true ).animate( {
                scrollTop : this.target.$propertiesWidget.offset().top - this.config.scrollOffset
            }, this.config.scrollSpeed );
        } );
    }

    loadUltraSearchWidget() {
        const widgetID                 = this.getID(),
              widgetSettings           = this.getElementSettings(),
              widgetWrapID             = '#rhea-' + widgetID,
              geoLocationAddress       = this.elements.$geoLocationAddress,
              locationFieldsWrap       = this.elements.$locationFieldWrap,
              geolocationRadiusWrapper = this.elements.$geoRadiusSlider,
              TriggerCalender          = jQuery( widgetWrapID + ' .rhea-trigger-calender' ),
              searchSingleCheckIn      = jQuery( widgetWrapID + ' .rhea-single-check-in-search' ),
              searchCheckIn            = jQuery( widgetWrapID + ' .rhea-check-in-search' ),
              searchCheckOut           = jQuery( widgetWrapID + ' .rhea-check-out-search' );

        // if check in / check out fields exist
        if ( 0 < TriggerCalender.length ) {
            searchCheckOut.on( 'click', function () {
                TriggerCalender.trigger( 'click' );
            } );

            // Setting calendar options from localized calendar names and months data.
            let localeOptions = {
                firstDay : 1
            };

            if ( 'undefined' !== typeof ( availability_calendar_data ) ) {
                localeOptions.daysOfWeek = availability_calendar_data.day_name;
                localeOptions.monthNames = availability_calendar_data.month_name;
            }

            let searchPickerOptions = {
                autoApply       : true,
                drops           : 'down',
                opens           : 'right',
                autoUpdateInput : false,
                minDate         : new Date(),
                parentEl        : '#rhea-' + widgetID,
                locale          : {
                    ...localeOptions
                }
            };

            if ( searchCheckIn.val() && searchCheckOut.val() ) {
                searchPickerOptions.startDate = searchCheckIn.val();
                searchPickerOptions.endDate   = searchCheckOut.val();
            }

            TriggerCalender.daterangepicker( searchPickerOptions, function ( startDate, endDate, label ) {
                // Set focus to the check-in and check-out fields.
                searchCheckIn.parents( '.rh_mod_text_field' ).addClass( 'rh_mod_text_field_focused' );
                searchCheckOut.parents( '.rh_mod_text_field' ).addClass( 'rh_mod_text_field_focused' );

                // Setting the Check-In and Check-Out dates in their fields.
                searchCheckIn.val( startDate.format( 'YYYY-MM-DD' ) ).trigger( 'change' );
                searchCheckOut.val( endDate.format( 'YYYY-MM-DD' ) ).trigger( 'change' );
                searchSingleCheckIn.val( startDate.format( 'YYYY-MM-DD' ) + '  /  ' + endDate.format( 'YYYY-MM-DD' ) );
            } );
        }

        /*-----------------------------------------------------------------------------------*/
        /* Geolocation Field Places AutoComplete
        /*-----------------------------------------------------------------------------------*/
        if ( typeof google !== 'undefined' ) {
            const geoLocationWrap = geoLocationAddress.get( 0 );
            if ( geoLocationWrap ) {
                const autocomplete = new google.maps.places.Autocomplete( geoLocationWrap );
                // Set the data fields to return when the user selects a place.
                autocomplete.setFields( ['address_components', 'geometry', 'icon', 'name'] );

                // Handle place selection
                autocomplete.addListener( 'place_changed', () => {
                    const place = autocomplete.getPlace();
                    if ( place.geometry && place.geometry.location ) {
                        locationFieldsWrap.find( '.location-field-lat' ).val( place.geometry.location.lat() );
                        locationFieldsWrap.find( '.location-field-lng' ).val( place.geometry.location.lng() );
                    }
                } );
            }
        }

        /*-----------------------------------------------------------------------------------*/
        /* Geolocation Radius Slider for Properties Search Form
        /*-----------------------------------------------------------------------------------*/
        if ( geolocationRadiusWrapper.length ) {
            const geolocationRadiusSlider          = geolocationRadiusWrapper.find( '#geolocation-radius-slider-' + this.getID() );
            const geolocationRadiusWrapperSelector = geolocationRadiusWrapper.find( '#rh-geolocation-radius-' + this.getID() );
            geolocationRadiusSlider.slider( {
                range : 'max',
                value : geolocationRadiusSlider.data( 'value' ),
                min   : geolocationRadiusSlider.data( 'min-value' ),
                max   : geolocationRadiusSlider.data( 'max-value' ),
                slide : function ( event, ui ) {
                    geolocationRadiusWrapper.find( 'strong' )
                    .text( ui.value + ' ' + geolocationRadiusSlider.data( 'unit' ) );
                    geolocationRadiusWrapperSelector.val( ui.value );
                }
            } );
        }

    }
}

jQuery( window ).on( 'elementor/frontend/init', () => {
    const ultraSearchWidgetHandler = ( $element ) => {
        elementorFrontend.elementsHandler.addHandler( ultraSearchWidgetClass, {
            $element
        } );
    };

    elementorFrontend.hooks.addAction( 'frontend/element_ready/rhea-search-form-widget.default', ultraSearchWidgetHandler );
    elementorFrontend.hooks.addAction( 'frontend/element_ready/rhea-ultra-search-form-widget.default', ultraSearchWidgetHandler );
    elementorFrontend.hooks.addAction( 'frontend/element_ready/rhea-ultra-search-form-2-widget.default', ultraSearchWidgetHandler );
} );
