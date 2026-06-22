/**
 * RH Properties Widget V13 Class
 *
 * @since 2.4.0
 * */
class RHPropertiesWidgetV13Class extends elementorModules.frontend.handlers.Base {
    getDefaultSettings() {

        const widgetId = this.getID();
        return {
            selectors : {
                widget           : `#rh-properties-widget-${widgetId}`,
                thumbnailsSlider : `#thumbnails-slider-${widgetId}`,
                contentsSlider   : `#contents-slider-${widgetId}`,
                pagination       : `#swiper-pagination-${widgetId}`,
                slideContent     : `.swiper-slide`
            }
        };
    }

    getDefaultElements() {
        const selectors = this.getSettings( 'selectors' );
        const elements  = {
            $widget           : this.$element.find( selectors.widget ),
            $thumbnailsSlider : this.$element.find( selectors.thumbnailsSlider ),
            $contentsSlider   : this.$element.find( selectors.contentsSlider ),
            $pagination       : this.$element.find( selectors.pagination )
        };

        elements.$slides = elements.$thumbnailsSlider.find( selectors.slideContent );
        return elements;
    }

    getSwiperSettings() {
        const elementSettings = this.getElementSettings(),
              swiperOptions   = {
                  slidesPerView : 1,
                  spaceBetween  : 1,
                  speed         : elementSettings.speed,
                  loop          : 'yes' === elementSettings.infinite
              };

        return swiperOptions;
    }

    async onInit() {
        super.onInit( ...arguments );

        if ( ! this.elements.$thumbnailsSlider.length || 2 > this.elements.$slides.length ) {
            return;
        }

        await this.initSwiper();

        if ( 'yes' === this.getElementSettings().pause_on_hover ) {
            this.togglePauseOnHover( true );
        }
    }

    async initSwiper() {
        const Swiper                   = elementorFrontend.utils.swiper,
              thumbnailsSliderSettings = this.getSwiperSettings(),
              elementSettings          = this.getElementSettings();

        if ( 'fade' === elementSettings.thumbnails_slider_effect ) {
            thumbnailsSliderSettings.effect     = 'fade';
            thumbnailsSliderSettings.fadeEffect = {
                crossFade : true
            };
        }

        if ( 'yes' === elementSettings.autoplay ) {
            thumbnailsSliderSettings.autoplay = {
                delay                : elementSettings.autoplay_speed,
                disableOnInteraction : 'yes' === elementSettings.pause_on_interaction
            };
        }

        thumbnailsSliderSettings.pagination = {
            el           : `#swiper-pagination-${this.getID()} > .swiper-pagination-inner`,
            clickable    : true,
            renderBullet : ( index, classname ) => {
                return `<span class="${classname}" data-bullet-index="${index}"></span>`;
            }
        };

        // Initialize the property images slider
        this.thumbnailsSlider = await new Swiper( this.elements.$thumbnailsSlider, thumbnailsSliderSettings );

        if ( this.elements.$contentsSlider.length ) {
            const contentsSliderSettings = this.getSwiperSettings();

            if ( 'fade' === elementSettings.contents_slider_effect ) {
                contentsSliderSettings.effect     = 'fade';
                contentsSliderSettings.fadeEffect = {
                    crossFade : true
                };
            }

            // Initialize the content Swiper
            this.contentsSlider = await new Swiper( this.elements.$contentsSlider, contentsSliderSettings );

            // Synchronize slider
            this.thumbnailsSlider.controller.control = this.contentsSlider;
            this.contentsSlider.controller.control   = this.thumbnailsSlider;
        }

        // Initialize custom transition
        this.paginationTransition();
    }

    paginationTransition() {
        const $pagination = this.elements.$pagination.find( '.swiper-pagination-inner' );

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
        this.thumbnailsSlider.on( 'slideChange', () => {
            $pagination.find( '.swiper-pagination-bullet-active' ).trigger( 'click' );
        } );

        jQuery( window ).on( 'resize', () => {
            $pagination.find( '.swiper-pagination-bullet-active' ).trigger( 'click' );
        });
    }

    togglePauseOnHover( toggleOn ) {
        if ( toggleOn ) {
            this.elements.$widget.on( {
                mouseenter : () => {
                    this.thumbnailsSlider.autoplay.stop();

                    if ( this.elements.$contentsSlider.length ) {
                        this.contentsSlider.autoplay.stop();
                    }
                },
                mouseleave : () => {
                    this.thumbnailsSlider.autoplay.start();

                    if ( this.elements.$contentsSlider.length ) {
                        this.contentsSlider.autoplay.start();
                    }
                }
            } );
        } else {
            this.elements.$widget.off( 'mouseenter mouseleave' );
        }
    }
}

jQuery( window ).on( 'elementor/frontend/init', () => {
    const RHPropertiesWidgetV13Handler = ( $element ) => {
        elementorFrontend.elementsHandler.addHandler( RHPropertiesWidgetV13Class, { $element } );
    };

    elementorFrontend.hooks.addAction( 'frontend/element_ready/rh-properties-widget-v13.default', RHPropertiesWidgetV13Handler );
} );