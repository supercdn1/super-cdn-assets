/**
 * RH Properties Widget V14 Class
 *
 * This class handles the functionality of the properties widget in Elementor,
 * which includes initializing a Swiper carousel, applying filters, and handling
 * AJAX requests for filtering properties based on their taxonomies.
 *
 * Features:
 * - Property slider with Swiper.js integration
 * - Supports grid layout with multiple rows
 * - Autoplay, navigation, pagination, and responsive settings
 * - AJAX-based property filtering by status, type, city, or feature
 *
 * @since 2.4.0
 */
class RHPropertiesWidgetV14Class extends elementorModules.frontend.handlers.Base {

    getDefaultSettings() {
        const widgetId       = this.getID(),
              widgetPrefix   = `rh-properties-widget-v14`,
              widgetSelector = `#${widgetPrefix}-${widgetId}`;
        return {
            selectors : {
                widget                 : widgetSelector,
                slider                 : `#${widgetPrefix}-slider-${widgetId}`,
                carouselPagination     : `#swiper-pagination-${widgetId}`,
                filtersContainer       : `#filters`,
                slideContent           : `.swiper-slide`,
                propertiesInner        : '.rh-properties-container-inner',
                propertiesStatsWrapper : '.rh-properties-widget-v14-stats-wrapper',
                paginationContainer    : '.rh-properties-widget-v14-pagination',
                paginationItems        : '.pagination a',
                loader                 : '.rh-properties-widget-v14-svg-loader',
                responseStats          : `${widgetSelector} .rh-properties-widget-v14-stats-wrapper > .rh-properties-widget-v14-stats`,
                responsePagination     : `${widgetSelector} .rh-properties-widget-v14-pagination > .pagination`,
                responseProperties     : `${widgetSelector} .rh-properties-container-inner > div`,
                loadMorePropContainer  : `${widgetSelector} #rh-load-more-properties`
            }
        };
    }

    getDefaultElements() {
        const selectors = this.getSettings( 'selectors' );
        const elements  = {
            $widget                : this.$element.find( selectors.widget ),
            $slider                : this.$element.find( selectors.slider ),
            $carouselPagination    : this.$element.find( selectors.carouselPagination ),
            $filtersContainer      : this.$element.find( selectors.filtersContainer ),
            $properties            : this.$element.find( selectors.propertiesInner ),
            $propertiesStats       : this.$element.find( selectors.propertiesStatsWrapper ),
            $pagination            : this.$element.find( selectors.paginationContainer ),
            $paginationItems       : this.$element.find( selectors.paginationItems ),
            $loader                : this.$element.find( selectors.loader ),
            $loadMorePropContainer : this.$element.find( selectors.loadMorePropContainer )
        };

        elements.$slides = elements.$slider.find( selectors.slideContent );
        return elements;
    }

    getSwiperSettings( newGridRows = 0 ) {
        const elementSettings = this.getElementSettings(),
              isGridEnabled   = 'yes' === elementSettings.grid_row;

        let gridRows = isGridEnabled ? 2 : 1;

        if ( 0 !== newGridRows ) {
            gridRows = newGridRows;
        }

        const swiperOptions = {
            slidesPerView : 3,
            spaceBetween  : 1,
            grid          : {
                rows : gridRows
            },
            speed         : elementSettings.speed,
            navigation    : {
                nextEl : `#swiper-button-next-${this.getID()}`,
                prevEl : `#swiper-button-prev-${this.getID()}`
            },
            pagination    : {
                el           : `#swiper-pagination-${this.getID()} > .swiper-pagination-inner`,
                clickable    : true,
                renderBullet : ( index, classname ) => `<span class="${classname}" data-bullet-index="${index}"></span>`
            },
            breakpoints   : {
                0    : {
                    slidesPerView : 1,
                    grid          : {
                        rows : 1
                    }
                },
                767  : {
                    slidesPerView : 2,
                    grid          : {
                        rows : 1
                    }
                },
                1200 : {
                    slidesPerView : 3,
                    grid          : {
                        rows : 1
                    }
                },
                1366 : {
                    slidesPerView : 3,
                    grid          : {
                        rows : gridRows
                    }
                }
            }
        };

        if ( ! isGridEnabled ) {
            swiperOptions.loop = 'yes' === elementSettings.infinite;
        }

        if ( 'yes' === elementSettings.autoplay ) {
            swiperOptions.autoplay = {
                delay                : elementSettings.autoplay_speed,
                disableOnInteraction : 'yes' === elementSettings.pause_on_interaction
            };
        }

        return swiperOptions;
    }

    async onInit() {
        super.onInit( ...arguments );
        const elementSettings = this.getElementSettings();

        if ( 'carousel' !== elementSettings.layout ) {
            if ( 'yes' === elementSettings.ajax_pagination && ! jQuery( '.rhea-properties-filter-widget' ).length ) {
                this.ajaxPagination();
                return;
            }

            if ( 'default' !== elementSettings.pagination_type ) {
                this.loadMoreProperties();
            }
        }

        if ( ! this.elements.$slider.length ) {
            return;
        }

        await this.initSwiper();

        if ( 'yes' === elementSettings.pause_on_hover ) {
            this.togglePauseOnHover( true );
        }

        this.bindFilterEvents(); // Bind filter click events on initialization
    }

    async initSwiper( updateGridRows = 0 ) {
        const Swiper         = elementorFrontend.utils.swiper;
        const elements       = this.getDefaultElements();
        const swiperSettings = this.getSwiperSettings( updateGridRows );

        // Initialize the properties slider
        this.destroySwiper(); // Ensure previous swiper is destroyed
        this.propertiesSlider = await new Swiper( elements.$slider, swiperSettings );

        // Initialize custom transition
        this.paginationTransition();
    }

    destroySwiper() {
        if ( this.propertiesSlider && this.propertiesSlider.destroy ) {
            this.propertiesSlider.destroy( true, true ); // Destroy and clean up swiper
        }
    }

    bindFilterEvents() {
        const elements           = this.getDefaultElements(),
              elementSettings    = this.getElementSettings(),
              $widget            = elements.$widget,
              $swiperWrapperHtml = elements.$widget.find( '.swiper-wrapper' ).html(),
              $filters           = elements.$filtersContainer.find( '.filter-btn' );

        elementSettings.thumbnail_size = $widget.data( 'thumb-size' );

        // Handle filter click event
        elements.$filtersContainer.on( 'click', '.filter-btn', ( event ) => {
            event.preventDefault();

            const $filterBtn = jQuery( event.currentTarget );

            if ( $filterBtn.hasClass( 'current' ) ) {
                return false;
            }

            this.handleFilterClick( $filterBtn, $swiperWrapperHtml, $filters, elements );
        } );
    }

    async handleFilterClick( $filterBtn, $swiperWrapperHtml, $filters, elements ) {
        const elementSettings = this.getElementSettings(),
              $wrapper        = elements.$widget.find( '.rh-properties-widget-v14-slider-wrapper' ),
              $innerWrapper   = elements.$widget.find( '.rh-properties-widget-v14-inner' ),
              swiperWrapper   = elements.$widget.find( '.swiper-wrapper' ),
              is_grid         = 'yes' === elementSettings.grid_row,
              propertyFilter  = $filterBtn.data( 'properties-filter' );

        $filters.removeClass( 'current loading' );
        $filterBtn.addClass( 'current' );

        $innerWrapper.fadeOut( 'fast' );

        if ( 'all' === propertyFilter ) {
            swiperWrapper.empty().html( $swiperWrapperHtml );

            if ( is_grid ) {
                this.initSwiper( 0 );
            }

            $innerWrapper.fadeIn( 500, function () {
                $wrapper.removeClass( 'loading' );
            } );

        } else {
            jQuery.ajax( {
                url        : ajax_object.ajax_url,
                type       : 'POST',
                data       : {
                    action   : 'rhea_properties_widget_v14_properties_filter',
                    taxonomy : $filterBtn.data( 'properties-taxonomy' ),
                    term     : propertyFilter,
                    settings : elementSettings,
                    nonce    : ajax_object.nonce
                },
                beforeSend : () => {
                    $filterBtn.addClass( 'loading' );
                    $wrapper.addClass( 'loading' );
                },
                success    : ( response ) => {
                    swiperWrapper.empty().html( response.data.props );

                    if ( is_grid ) {
                        let updateGridRows = ( response.data.foundProps > 5 ) ? 2 : 1;
                        this.initSwiper( updateGridRows );
                    }

                    $innerWrapper.fadeIn( 500, function () {
                        $filterBtn.removeClass( 'loading' );
                        $wrapper.removeClass( 'loading' );
                    } );

                },
                error      : ( xhr, status, error ) => {
                    console.log( "AJAX Error: " + error );
                }
            } );
        }
    }

    togglePauseOnHover( toggleOn ) {
        if ( toggleOn ) {
            this.elements.$widget.on( {
                mouseenter : () => this.propertiesSlider.autoplay.stop(),
                mouseleave : () => this.propertiesSlider.autoplay.start()
            } );
        } else {
            this.elements.$widget.off( 'mouseenter mouseleave' );
        }
    }

    ajaxPagination() {
        const $         = jQuery,
              selectors = this.getSettings( 'selectors' ),
              elements  = this.getDefaultElements();

        // Ajax pagination for grid and list layouts
        $( 'body' ).on( "click", `${selectors.widget} .rh-properties-widget-v14-pagination a`, function ( event ) {
            event.preventDefault();

            const $this          = $( this ),
                  currentPageNum = parseInt( $this.data( 'page' ) );

            if ( $this.hasClass( "current" ) ) {
                return false;
            }

            elements.$loader.slideDown();

            if ( typeof propertiesMapNewData !== "undefined" ) {
                $.ajax( {
                    url     : ajax_object.ajax_url,
                    type    : 'post',
                    data    : {
                        action          : 'rhea_map_properties_data',
                        paged           : currentPageNum,
                        properties_args : JSON.parse( propertiesMapNewData.rheaPropertiesArgs )
                    },
                    success : function ( response ) {
                        if ( response.data ) {
                            const rheaUpdateMapData = $.Event( 'rheaUpdateMapData', {
                                mapProperties : JSON.stringify( response.data )
                            } );
                            $( document ).trigger( rheaUpdateMapData );
                        }
                    }
                } );
            }

            $.ajax( {
                url     : $this.attr( 'href' ),
                method  : 'GET',
                success : function ( response ) {
                    elements.$loader.slideUp();

                    let $response = $( response );
                    elements.$propertiesStats.html( $response.find( selectors.responseStats ) );
                    elements.$pagination.html( $response.find( selectors.responsePagination ) );
                    elements.$properties.html( $response.find( selectors.responseProperties ) );

                    elements.$paginationItems.removeClass( 'current' );
                    $this.addClass( 'current' );

                    // Scroll to the top of the properties
                    $( 'html, body' ).animate( {
                        scrollTop : elements.$properties.offset().top - 120
                    }, 1000 );
                }
            } );

        } );
    }

    paginationTransition() {
        const $pagination = this.elements.$carouselPagination.find( '.swiper-pagination-inner' );

        // Add the custom active bullet indicator
        $pagination.append( '<span class="select-active-bullet"></span>' );

        const $selectActiveBullet = $pagination.find( '.select-active-bullet' );
        const $allBullets         = $pagination.find( '.swiper-pagination-bullet' );

        // Set the initial position and opacity of the active bullet indicator
        $selectActiveBullet.css( {
            left    : $allBullets.first().position().left,
            opacity : 1
        } );

        // Handle bullet clicks
        $pagination.on( 'click', '.swiper-pagination-bullet', ( event ) => {
            let target = jQuery( event.target ).position();
            $selectActiveBullet.animate( {
                top  : target.top,
                left : target.left
            } );
        } );

        // Update the active bullet indicator on slide change
        this.propertiesSlider.on( 'slideChange', () => {
            $pagination.find( '.swiper-pagination-bullet-active' ).trigger( 'click' );
        } );

        jQuery( window ).on( 'resize', () => {
            $pagination.find( '.swiper-pagination-bullet-active' ).trigger( 'click' );
        } );
    }

    loadMoreProperties() {
        const $                     = jQuery,
              elementSettings       = this.getElementSettings(),
              selectors             = this.getSettings( 'selectors' ),
              elements              = this.getDefaultElements(),
              loadMorePropContainer = elements.$loadMorePropContainer,
              loadMorePropButton    = loadMorePropContainer.find( 'a' ),
              paginationType        = elementSettings.pagination_type,
              nextPageURL           = `${window.location.origin}${window.location.pathname.replace( /\/$/, '' )}/page`;

        if ( ! loadMorePropContainer.length ) {
            return;
        }

        let isLoading       = false,
            currentPage     = 2,
            propertyPerPage = 6,
            maxProperties   = parseInt( elementSettings.properties_limit, 10 ) || 30,
            totalPages      = parseInt( loadMorePropContainer.data( 'page' ), 10 ),
            totalPosts      = parseInt( loadMorePropContainer.data( 'posts' ), 10 );

        if ( 'infinite_scroll' === paginationType && totalPosts > maxProperties ) {
            propertyPerPage = parseInt( elementSettings.posts_per_page, 10 );
            totalPages      = Math.ceil( maxProperties / propertyPerPage );
        }

        // Define observer outside so we can access for unobserve/disconnect
        let observer = null;

        const loadNextPage = () => {
            if ( isLoading || currentPage > totalPages ) {
                return;
            }

            isLoading = true;
            loadMorePropButton.addClass( 'disabled' );
            elements.$loader.slideDown();

            const pageUrl = `${nextPageURL}/${currentPage}/`;

            $.ajax( {
                url     : pageUrl,
                method  : 'GET',
                success : function ( response ) {
                    elements.$loader.slideUp();

                    const $response = $( response ).find( selectors.responseProperties );
                    if ( $response.length ) {
                        elements.$properties.append( $response );
                    }

                    currentPage++;
                    isLoading = false;

                    if ( currentPage > totalPages ) {
                        loadMorePropContainer.find( '.no-more-properties' ).removeClass( 'hidden' );

                        // Stop observing once max is reached
                        if ( observer ) {
                            observer.disconnect();
                        }
                    } else {
                        loadMorePropButton.removeClass( 'disabled' );
                    }
                },
                error   : function () {
                    elements.$loader.slideUp();
                    loadMorePropButton.removeClass( 'disabled' );
                    isLoading = false;
                }
            } );
        };

        if ( 'load_more' === paginationType ) {
            // Manual fallback for button
            loadMorePropButton.on( 'click', function ( event ) {
                event.preventDefault();
                loadNextPage();
            } );
        }

        // Set up Intersection Observer only for infinite scroll
        if ( 'infinite_scroll' === paginationType ) {
            const options = {
                root       : null,
                rootMargin : '200px', // loads earlier
                threshold  : 0.01 // tiny threshold to trigger quicker
            };

            let debounceTimer = null;

            observer = new IntersectionObserver( ( entries ) => {
                entries.forEach( entry => {
                    // Entry is intersecting and visible
                    if ( entry.isIntersecting ) {
                        // Debounce to avoid multiple triggers
                        if ( ! debounceTimer ) {
                            debounceTimer = setTimeout( () => {
                                loadNextPage();
                                debounceTimer = null;
                            }, 100 );
                        }
                    }
                } );
            }, options );

            observer.observe( loadMorePropContainer[0] );
        }
    }
}

jQuery( window ).on( 'elementor/frontend/init', () => {
    const rhPropertiesWidgetV14Handler = ( $element ) => {
        elementorFrontend.elementsHandler.addHandler( RHPropertiesWidgetV14Class, { $element } );
    };

    elementorFrontend.hooks.addAction( 'frontend/element_ready/rh-properties-widget-v14.default', rhPropertiesWidgetV14Handler );
} );
