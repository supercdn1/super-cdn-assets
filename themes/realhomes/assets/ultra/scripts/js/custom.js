( function ( $ ) {
    "use strict";

    const $window = $( window ),
          $body   = $( 'body' ),
          isRtl   = $body.hasClass( 'rtl' );

    /**
     * Sticky footer related code.
     */
    function footerStick() {
        $( '.rh_wrap_stick_footer' ).css( 'padding-bottom', $( '.rh_sticky_wrapper_footer' ).outerHeight() + 'px' )
    }

    /**
     * Form AJAX validation and submission
     * Validation Plugin : https://jqueryvalidation.org/
     * Form Ajax Plugin : http://www.malsup.com/jquery/form/
     *
     * @since 4.0.0
     */
    function realhomesValidateForm( form_id ) {
        const form = $( form_id );

        if ( ! form.length ) {
            return false;
        }

        const submitButton     = form.find( '.submit-button' ),
              ajaxLoader       = form.find( '.ajax-loader' ),
              messageContainer = form.find( '.message-container' ),
              errorContainer   = form.find( ".error-container" ),
              formOptions      = {
                  beforeSubmit : function () {
                      submitButton.attr( 'disabled', 'disabled' );
                      ajaxLoader.fadeIn( 'fast' );
                      messageContainer.fadeOut( 'fast' );
                      errorContainer.fadeOut( 'fast' );
                  },
                  success      : function ( ajax_response, statusText, xhr, $form ) {
                      const response = $.parseJSON( ajax_response );
                      ajaxLoader.fadeOut( 'fast' );
                      submitButton.removeAttr( 'disabled' );

                      if ( response.success ) {
                          form.resetForm();
                          messageContainer.html( response.message ).fadeIn( 'fast' );

                          // call reset function if it exists
                          if ( typeof inspiryResetReCAPTCHA == 'function' ) {
                              inspiryResetReCAPTCHA();
                          }

                          if ( typeof contactFromData !== 'undefined' ) {
                              setTimeout( function () {
                                  window.location.replace( contactFromData.redirectPageUrl );
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

        if ( jQuery().validate && jQuery().ajaxSubmit ) {
            form.validate( {
                errorLabelContainer : errorContainer,
                submitHandler       : function ( form ) {
                    $( form ).ajaxSubmit( formOptions );
                }
            } );
        }
    }

    // Contact form
    realhomesValidateForm( '#contact-form' );

    // Agent contact form
    realhomesValidateForm( '#agent-single-form' );

    // Agency contact form
    realhomesValidateForm( '#agency-single-form' );

    // Schedule A Tour form
    realhomesValidateForm( '#schedule-a-tour' );

    $( document ).ready( function () {

        // Sticky Headers
        reahomesStickyHeader('.rh-sticky-header');
        reahomesStickyHeader('.rh-mobile-sticky-header', 1024, '<');

        /**
         * Datepicker for Single Property
         */
        let singleProperty = document.querySelector( '.single-property' );
        if ( singleProperty ) {
            let satForm = document.getElementById( 'schedule-a-tour' );
            if ( satForm ) {
                $( "#sat-date" ).datepicker( {
                    minDate  : 0,
                    showAnim : 'slideDown',
                    beforeShow : function ( input, inst ) {
                        inst.dpDiv[0].classList.add( 'schedule-section-wrapper' );
                    }
                } );
            }
        }

        /**
         * Sliders
         */
        if ( jQuery().flexslider ) {

            // Gallery Post Slider
            const galleryPostSlider = $( '.gallery-post-slider' );
            if ( galleryPostSlider.length ) {
                galleryPostSlider.flexslider( {
                    animation  : "slide",
                    slideshow  : false,
                    controlNav : false,
                    prevText   : "<i class='fas fa-caret-left'></i>",
                    nextText   : "<i class='fas fa-caret-right'></i>",
                    start      : function ( slider ) {
                        galleryPostSlider.find( '.clone' ).children().removeAttr( "data-fancybox" );
                    }
                } );
            }
        }

        /**
         * Single Property Slider
         */
        var singlePropertySlider           = $( '.rh-ultra-property-slider' );
        var singlePropertyCarousel         = $( '.rh-ultra-horizontal-carousel-trigger' );
        var singlePropertyVerticalCarousel = $( '.rh-ultra-vertical-carousel-trigger' );

        // Responsive Nav
        $( '.rh-ultra-responsive-nav' ).hcOffcanvasNav( {
            disableAt    : 1139,
            insertClose  : true,
            insertBack   : true,
            labelClose   : mobileNavLabels.labelClose,
            labelBack    : mobileNavLabels.labelBack,
            levelSpacing : 40,
            // levelTitleAsBack: true,
            // pushContent: '.rh_section',
            customToggle : '.rh-responsive-toggle'
        } );

        let syncEnable = '';
        let centerMode = false;


        singlePropertyCarousel.on( 'init', function ( event, slick ) {
            if ( singlePropertyCarousel.data( 'count' ) > singlePropertyCarousel.find( '.slick-active' ).length ) {
                syncEnable = singlePropertyCarousel;
                centerMode = true;
            }
        } );

        singlePropertyVerticalCarousel.on( 'init', function ( event, slick ) {
            if ( singlePropertyVerticalCarousel.data( 'count' ) > singlePropertyVerticalCarousel.find( '.slick-active' ).length ) {
                syncEnable = singlePropertyCarousel;
                centerMode = true;
            }
        } );

        singlePropertySlider.on( 'init afterChange', function ( event, slick ) {

            if ( syncEnable === '' ) {
                singlePropertyCarousel.find( '.slick-slide' ).removeClass( 'slick-current' );
                singlePropertyCarousel.find( '.slick-slide' ).eq( slick.currentSlide ).addClass( "slick-current" );
            }

        } );

        singlePropertyCarousel.slick( {
            slidesToShow   : 6,
            slidesToScroll : 1,
            asNavFor       : singlePropertySlider,
            // dots: false,
            infinite       : true,
            centerMode     : centerMode,
            focusOnSelect  : true,
            touchThreshold : 200,
            arrows         : false,
            centerPadding  : '0',
            rtl            : isRtl,
            responsive     : [
                {
                    breakpoint : 1200,
                    settings   : {
                        slidesToShow : 4
                    }
                },
                {
                    breakpoint : 767,
                    settings   : {

                        slidesToShow : 3
                    }
                }
            ]
        } );
        singlePropertyVerticalCarousel.slick( {
            slidesToShow    : 3,
            vertical        : true,
            verticalSwiping : true,
            slidesToScroll  : 1,
            asNavFor        : singlePropertySlider,
            // dots: false,
            infinite       : true,
            centerMode     : centerMode,
            focusOnSelect  : true,
            touchThreshold : 200,
            arrows         : false,
            centerPadding  : '0',
            responsive     : [
                {
                    breakpoint : 1200,
                    settings   : {
                        slidesToShow    : 3,
                        vertical        : false,
                        verticalSwiping : false,
                        rtl             : isRtl
                    }
                }
            ]
        } );

        singlePropertySlider.slick( {
            slidesToShow   : 1,
            slidesToScroll : 1,
            arrows         : true,
            fade           : true,
            adaptiveHeight : true,
            infinite       : true,
            rtl            : isRtl,
            asNavFor       : syncEnable
            // asNavFor: singlePropertyCarousel,
        } );

        /**
         * Property Ratings
         */
        if ( jQuery().barrating ) {
            $( '#rate-it' ).barrating( {
                theme         : 'fontawesome-stars',
                initialRating : 5
            } );
        }

        /**
         * AJAX Pagination for Listing & Archive Pages
         */
        const propertiesSection = $( '#properties-listing' );

        if ( propertiesSection.hasClass( 'ajax-pagination' ) ) {
            const propertiesContainer = propertiesSection.find( '.rh-ultra-list-box, .rh-ultra-grid-box' ),
                  svgLoader           = propertiesSection.find( '.svg-loader' ),
                  paginationContainer = $( '.rh_pagination' ),
                  statsContainer      = $( '.rh_pagination__stats' ),
                  mapServiceType      = localized.mapService.toString(),
                  page_id             = statsContainer.data( 'page-id' );

            let cards_container = 'rh-ultra-list-box';
            if ( propertiesSection.find( '.rh-ultra-grid-box' ).length ) {
                cards_container = 'rh-ultra-grid-box';
            }

            $( 'body' ).on( 'click', '.rh-ultra-pagination .rh_pagination > a', function ( e ) {
                e.preventDefault();
                let currentButton = $( this );
                svgLoader.slideDown( 'fast' );
                propertiesContainer.fadeTo( 'slow', 0.5 );
                $( '.rh_pagination > a' ).removeClass( 'current' );
                currentButton.addClass( 'current' );
                let current_page = parseInt( currentButton.attr( 'data-page-number' ) );
                statsContainer.attr( 'data-page', current_page );
                paginationContainer.load( currentButton.attr( 'href' ) + ' ' + '.rh_pagination' );
                statsContainer.load( currentButton.attr( 'href' ) + ' ' + '.rh_pagination__stats' );

                let url = currentButton.attr( 'href' ) + ' ' + '.' + cards_container + ' > *';

                propertiesContainer.load( url, function ( response, status, xhr ) {
                        if ( status == 'success' ) {
                            propertiesContainer.fadeTo( 100, 1, function () {
                            } );
                            svgLoader.slideUp( 'fast' );

                            $( 'html, body' ).animate( {
                                scrollTop : propertiesSection.find( '.' + cards_container ).offset().top - 120
                            }, 1000 );

                            inspirySelectPicker( 'body .inspiry_select_picker_trigger' );
                            rhUltraTooltip( '.rh-ui-tooltip' );

                        } else {
                            propertiesContainer.fadeTo( 'slow', 1 );
                        }
                        if ( typeof realhomesInfoboxPopupTrigger === 'function' ) {
                            realhomesInfoboxPopupTrigger();
                        }

                        // Binding Favorites & Compare Properties Features
                        if ( typeof realhomes_update_favorites === 'function' ) {
                            realhomes_update_favorites();
                        }
                        if ( typeof realhomes_update_compare_properties === 'function' ) {
                            realhomes_update_compare_properties();
                        }
                    }
                );
                // If this pagination is for ajax search results
                if ( propertiesSection.hasClass( 'realhomes_ajax_search' ) ) {
                    realhomes_update_ajax_map_results( current_page );
                    let currentQueryStrings = statsContainer.data( 'query-strings' );
                    let searchURL           = $( '.rh_page' ).data( 'search-url' );
                    if ( current_page === 1 ) {
                        window.history.pushState( {}, '', searchURL + currentQueryStrings );
                    } else {
                        window.history.pushState( {}, '', searchURL + 'page/' + current_page + '/' + currentQueryStrings );
                    }
                } else {
                    $.ajax( {
                        url     : ajaxurl,
                        type    : 'post',
                        data    : {
                            action  : 'realhomes_map_ajax_search_results',
                            page_id : page_id,
                            page    : current_page
                        },
                        success : ( response ) => {
                            let propertiesMapData = response.data.propertiesData;
                            if ( typeof realhomes_update_open_street_map !== 'undefined' && typeof mapServiceType !== "undefined" && mapServiceType === 'openstreetmaps' ) {
                                realhomes_update_open_street_map( propertiesMapData );
                            } else if ( typeof realhomes_update_mapbox !== 'undefined' && typeof mapServiceType !== "undefined" && mapServiceType === 'mapbox' ) {
                                $( '#map-head' ).empty().append( '<div id="listing-map"></div>' );
                                realhomes_update_mapbox( propertiesMapData );
                            } else if ( typeof realhomes_update_google_map !== 'undefined' ) {
                                realhomes_update_google_map( propertiesMapData );
                            }
                        }
                    } );
                    window.history.pushState( {}, '', currentButton.attr( 'href' ) );
                }
                window.history.pushState( {}, '', currentButton.attr( 'href' ) );
            } );
        }

        /**
         * Property Floor Plans
         */
        $( '.rh-floor-plan-tab' ).click( function ( e ) {
            e.preventDefault();

            if ( ! $( this ).hasClass( 'rh-current-tab' ) ) {
                $( '.rh-floor-plan-tab' ).removeClass( 'rh-current-tab' );
                $( this ).addClass( 'rh-current-tab' );

                $( ".rh-floor-plan" ).removeClass( 'rh-active-tab' );
                $( ".rh-floor-plan[data-id='" + $( this ).attr( 'data-id' ) + "']" ).addClass( "rh-active-tab" );
            }
        } );

        $( '.rh_wrapper_property_videos_slider' ).slick( {
            slidesToShow   : 1,
            slidesToScroll : 1,
            arrows         : false,
            dots           : true,
            fade           : true
        } );

        /**
         * Post Nav Support
         */
        $( function () {
            var post_nav = $( '.inspiry-post-nav' );
            $( window ).on( 'scroll', function () {
                if ( $( window ).width() > 980 ) {
                    if ( $( this ).scrollTop() > 650 ) {
                        post_nav.fadeIn( 'fast' ).css( "display", "flex" );
                        return;
                    }
                }
                post_nav.fadeOut( 'fast' );
            } );
        } );

        /**
         * Scroll to Top
         */
        $( function () {
            const scroll_anchor = $( '#scroll-top' );

            $( window ).on( 'scroll', function () {
                if ( $( this ).scrollTop() > 250 ) {
                    scroll_anchor.addClass( 'show' );
                    return;
                }
                scroll_anchor.removeClass( 'show' );
            } );

            scroll_anchor.on( 'click', function ( event ) {
                event.preventDefault();
                $( 'html, body' ).animate( { scrollTop : 0 }, 'slow' );
            } );
        } );

        /**
         * Sidebar Properties Sliders
         */
        var ereSideBarSlider = $( '.ere-ultra-properties-slider' );

        ereSideBarSlider.each( function () {
            var thisContainer = $( this ).next( '.rh-ultra-widget-dots' );
            $( this ).owlCarousel( {
                stagePadding  : 0,
                singleItem    : true,
                loop          : false,
                dots          : true,
                nav           : true,
                items         : 1,
                margin        : 10,
                navText       : ['<i class="fas fa-caret-left"></i>', '<i class="fas fa-caret-right"></i>'],
                dotsContainer : thisContainer
            } );
        } );

        /**
         * Properties Sorting
         */
        function insertParam( key, value ) {
            key   = encodeURI( key );
            value = encodeURI( value );

            var kvp = document.location.search.substr( 1 ).split( '&' );

            var i = kvp.length;
            var x;
            while ( i-- ) {
                x = kvp[i].split( '=' );

                if ( x[0] == key ) {
                    x[1]   = value;
                    kvp[i] = x.join( '=' );
                    break;
                }
            }

            if ( i < 0 ) {
                kvp[kvp.length] = [key, value].join( '=' );
            }

            //this will reload the page, it's likely better to store this until finished
            document.location.search = kvp.join( '&' );
        }

        $( '#sort-properties' ).on( 'change', function () {
            var key   = 'sortby';
            var value = $( this ).val();
            insertParam( key, value );
        } );

        /**
         * Properties Gallery Isotope
         */
        if ( $.isFunction( $.fn.isotope ) ) {
            const container      = $( "#properties-gallery-container" ),
                  filterLinks    = $( "#filter-by a" ),
                  isotopeOptions = {
                      filter          : "*",
                      layoutMode      : 'fitRows',
                      itemSelector    : '.isotope-item',
                      animationEngine : 'best-available'
                  };

            // RTL support
            if ( isRtl ) {
                isotopeOptions.originLeft = false;
            }

            // To fix floating bugs due to variation in height
            setTimeout( function () {
                container.isotope( isotopeOptions );
            }, 1000 );

            filterLinks.on( 'click', function ( event ) {
                let self     = $( this ),
                    selector = self.data( 'filter' );

                container.isotope( { filter : '.' + selector } );
                filterLinks.removeClass( 'active' );
                self.addClass( 'active' );

                event.preventDefault();
            } );
        }

        // footerStick - Run on document ready.
        footerStick();

        function rhDecorateWhatsAppLink() {
            //set up the url
            var url = 'https://api.whatsapp.com/send?text=';

            var thisShareData = $( '.share-this' );

            //get property title
            var name = thisShareData.data( 'property-name' );

            //get property permalink
            var permalink = thisShareData.data( 'property-permalink' );

            //encode the text
            var encodedText = encodeURIComponent( name + ' ' + permalink );

            //find the link
            var whatsApp = $( ".inspiry_whats_app_share_link" );

            //set the href attribute on the link
            whatsApp.attr( 'href', url + encodedText );
        }

        rhDecorateWhatsAppLink();

        // Scripts to run on window load and resize events.
        $window.on( 'load resize', function () {
            footerStick();
        } );
    } );

} )( jQuery );