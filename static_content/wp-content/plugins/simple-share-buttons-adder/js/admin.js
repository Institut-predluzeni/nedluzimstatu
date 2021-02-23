/**
 * Simple Share Buttons Adder.
 *
 * @package SimpleShareButtonsAdder
 */

/* exported SimpleShareButtonsAdder */
var SimpleShareButtonsAdder = ( function( $, wp ) {
    'use strict';

    return {
        /**
         * Holds data.
         */
        data: {},

        /**
         * Boot plugin.
         *
         * @param data
         */
        boot: function( data ) {
            this.data = data;

            $( document ).ready( function() {
                this.init();
            }.bind( this ) );
        },

        /**
         * Initialize plugin.
         */
        init: function() {
            this.$plusContainer = $( '#plus-share-buttons' );
            this.$shareContainer = $( '#share-bar' );
            this.$gdprContainer = $('.gdpr-platform');
            this.switchCheckboxes();
            this.colorPicker();
            $('[data-toggle="tooltip"]').tooltip();
            this.dragSort();
            this.extractIncludeList();
            this.listen();

            // Create admin style to fill.
            $( 'body.wp-admin' ).siblings( 'head' ).append( '<style type="text/css" id="simple-share-buttons-adder-styles-inline-css"></style>' );

            // Fill it.
            this.updateInlineStyle();

            // Set GDPR purposes.
            this.setPurposes($('.gdpr-config').is(':visible'));

            // Check if terms accepted and create property if doesn't exist.
            if ('true' === $('.ssba-admin-wrap').attr('data-accepted') &&
                !this.data.propertyid) {
                this.createProperty();
            }
        },

        /**
         * Listener events.
         */
        listen: function() {
            var self = this;
            var timer = '';

            // Scroll to anchor in vendor list.
            // Send user input to category search AFTER they stop typing.
            $('body').on( 'keyup', '.vendor-search input', function( e ) {
                clearTimeout( timer );

                timer = setTimeout( function() {
                    self.scrollToAnchor($(this).val());
                }.bind( this ), 500 );
            } );

            // New color select.
            this.$gdprContainer.on('click', "#sharethis-form-color .color", function() {
                $('#sharethis-form-color .color').removeClass('selected');
                $(this).addClass('selected');
            });

            // clear or show choices.
            this.$gdprContainer.on('click', '#clear-choices', function(e) {
                e.preventDefault();
                e.stopPropagation();

                $( '.purpose-item input' ).prop( 'checked', false );
            });

            // clear or show choices.
            this.$gdprContainer.on('click', '#see-st-choices', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $('.purpose-item input[name="purposes[1]"]').prop('checked', true);
                $('.purpose-item input[name="purposes[3]"][value="consent"]').prop('checked', true);
                $('.purpose-item input[name="purposes[5]"][value="consent"]').prop('checked', true);
                $('.purpose-item input[name="purposes[6]"][value="consent"]').prop('checked', true);
                $('.purpose-item input[name="purposes[9]"][value="legitimate"]').prop('checked', true);
                $('.purpose-item input[name="purposes[10]"][value="legitimate"]').prop('checked', true);
            });

            // Uncheck radio if click on selected box.
            $('body').on( 'click', '.gdpr-platform .lever', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const theInput = $( e.currentTarget ).siblings( 'input' );

                if ( theInput.is( ':checked' ) ) {
                    theInput.prop( 'checked', false )
                } else {
                    theInput.prop( 'checked', true )
                }
            } );

            // Close review us.
            $('body').on('click', '#close-review-us', function() {
                wp.ajax.post( 'ssba_ajax_hide_review', {
                    nonce: self.data.nonce
                } ).always( function( results ) {
                    $('.ssba-review-us').fadeOut();
                });
            });

            // If selecting a tab.
            $( 'body' ).on( 'click', '.ssba-classic-tab, .ssba-modern-tab, .ssba-bar-tab, .ssba-gdpr', function(event) {
                var selection = 'classic';

                if ( $( this ).hasClass( 'ssba-modern-tab') ) {
                    selection = 'modern';
                }

                if ( $( this ).hasClass( 'ssba-bar-tab') ) {
                    selection = 'bar';
                }

                if ( $( this ).hasClass( 'ssba-gdpr') ) {
                    selection = 'gdpr';
                }

                $( '#ssba_selected_tab' ).val( selection );

                self.adminForm( event, this, true );
            } );

            // When changing image sets.
            $( 'body' ).on( 'change', '#ssba_image_set', function() {
                var imageSet = $( this ).val();

                self.changeImageSets( imageSet );
            } );

            // Image uploads.
            $( 'body' ).on( 'click', '.ssbpUpload', function( event ) {
                var field = $( this ).attr( 'data-ssbp-input' );

                event.preventDefault();
                self.imageUploads( field );
            } );

            // SSBA admin form.
            $( 'body' ).on( 'click', '#submit', function( event ) {
                event.preventDefault();

                self.adminForm( event, this, false );
            } );

            // Select preview.
            $( 'body' ).on( 'change', '#ssba_plus_button_style, #ssba_bar_style', function() {
                var selectId = '#' + $( this ).attr( 'id' ),
                    selection = $( selectId + ' option:selected' ).val(),
                    target = '#ssba-preview-2';

                if ( '#ssba_plus_button_style' === selectId ) {
                    target = '#ssba-preview';
                }

                self.preview( selection, target );
            } );

            // Share bar preview position.
            $( 'body' ).on( 'change', '#ssba_bar_position', function() {
                var position = $( '#ssba_bar_position option:selected' ).val();

                self.barPosition( position );
            } );

            // Classic button preview.
            $( 'body' ).on( 'change', '#ssba_image_set', function() {
                var selection = $( '#ssba_image_set option:selected' ).val();

                self.classicPreview( selection, '', '-1', 'img' );
            } );

            this.$plusContainer.on( 'change', '#ssba_plus_height, #ssba_plus_width, #ssba_plus_icon_size, #ssba_plus_margin', function() {
                var id = $( this ).attr( 'id' ),
                    selection = $( this ).val(),
                    type;

                if ( 'ssba_plus_height' === id ) {
                    type = 'height';
                    find = 'a';

                    self.updateInlineStyle();
                }

                if ( 'ssba_plus_width' === id ) {
                    type = 'width';
                    find = 'a';
                }

                if ( 'ssba_plus_icon_size' === id ) {
                    type = 'font-size';
                    find = 'a:before';
                    selection = selection + 'px';

                    self.updateInlineStyle();
                }

                if ( 'ssba_plus_margin' === id ) {
                    type = 'margin';
                    find = '';
                    selection = selection + 'px';
                }

                self.classicPreview( selection, type, '', find );
            } );

            this.$shareContainer.on( 'change', '#ssba_bar_height, #ssba_bar_width, #ssba_bar_icon_size, #ssba_bar_margin', function() {
                var id = $( this ).attr( 'id' ),
                    selection = $( this ).val(),
                    type;

                if ( 'ssba_bar_height' === id ) {
                    type = 'height';
                    find = 'a';

                    self.updateInlineStyle();
                }

                if ( 'ssba_bar_width' === id ) {
                    type = 'width';
                    find = 'a';
                }

                if ( 'ssba_bar_icon_size' === id ) {
                    type = 'font-size';
                    find = 'a:before';
                    selection = selection + 'px';

                    self.updateInlineStyle();
                }

                if ( 'ssba_bar_margin' === id ) {
                    type = 'margin';
                    find = '';
                    selection = selection + 'px';
                }

                self.classicPreview( selection, type, '-2', find );
            } );

            // Classic button css preview.
            $( 'body' ).on( 'change', '#ssba_size, #ssba_padding, #ssba_align', function() {
                var value = $( this ).val(),
                    id = $( this ).attr( 'id' ),
                    type = 'padding',
                    target = 'li';

                if ( 'ssba_size' === id ) {
                    type = 'height';
                }

                if ( 'ssba_align' === id ) {
                    target = 'ul';
                    type = 'text-align';
                }

                self.classicCss( type, value, target, '-1' );
            } );

            $( 'body' ).on( 'keydown keyup', '#ssba_padding', function( e ){
                if ( $( this ).val() > 50
                    && e.keyCode !== 46 // delete
                    && e.keyCode !== 8 // backspace
                ) {
                    e.preventDefault();
                    $( this ).val(50);
                }
            });

            // Plus button css preview.
            this.$plusContainer.on( 'change', '#ssba_plus_align', function() {
                var value = $( this ).val(),
                    id = $( this ).attr( 'id' ),
                    type,
                    target = '';

                if ( 'ssba_plus_align' === id ) {
                    target = 'ul';
                    type = 'text-align';
                }

                self.classicCss( type, value, target, '' );
            } );

            // Update icon and other non DOM style preview.
            this.$plusContainer.on( 'change', '#ssba_plus_icon_size', function() {
                self.updateInlineStyle();
            } );

            // Class button bar text css preview.
            $( 'body' ).on( 'change', '.share-text-prev input, .share-text-prev select', function() {
                var value = $( this ).val(),
                    id = $( this ).attr( 'id' ),
                    type,
                    sel_value = $( '#' + id + ' option:selected' ).val(),
                    tab = $( this ).closest( '.tab-pane' ).attr( 'id' );

                if ( 'ssba_share_text' === id || 'ssba_plus_share_text' === id ) {
                    type = 'html';
                }

                if ( 'ssba_font_color' === id || 'ssba_plus_font_color' === id ) {
                    type = 'color';
                }

                if ( 'ssba_font_family' === id || 'ssba_plus_font_family' === id ) {
                    type = 'font-family';
                    value = sel_value;
                }

                if ( 'ssba_font_size' === id || 'ssba_plus_font_size' === id ) {
                    type = 'font-size';
                    value = value + 'px';
                }

                if ( 'ssba_font_weight' === id || 'ssba_plus_font_weight' === id ) {
                    type = 'font-weight';
                    value = sel_value;
                }

                if ( ( 'ssba_text_placement' === id || 'ssba_plus_text_placement' === id ) && 'above' !== value && 'below' !== value ) {
                    type = 'float';
                    value = sel_value;
                }

                if ( ( 'ssba_text_placement' === id || 'ssba_plus_text_placement' === id ) && ( 'above' === value || 'below' === value ) ) {
                    type = 'placement';
                }

                self.classicTextCss( type, value, '#' + tab + ' .ssba-share-text-prev' );
            } );

            // Class button share text css preview.
            $( 'body' ).on( 'change', '.share-cont-prev input', function() {
                var value = $( this ).val(),
                    id = $( this ).attr( 'id' ),
                    type,
                    bWidth = $( '#ssba_border_width' ).val() + 'px',
                    bColor = $( '#ssba_div_border' ).val(),
                    target = '.ssba-preview-content';

                if ( 'ssba_div_padding' === id ) {
                    type = 'padding';

                    if ( 50 <= parseInt( value ) ) {
                        value = value + 'px';
                    } else {
                        value = '50px';
                    }

                    target = '#ssba-preview-1';
                }

                if ( 'ssba_div_background' === id ) {
                    type = 'background';
                }

                if ( 'ssba_div_border' === id ) {
                    type = 'border';
                    value = bWidth + ' solid ' + value;
                    target = '#ssba-preview-1';
                }

                if ( 'ssba_border_width' === id ) {
                    type = 'border';
                    value = value + 'px solid ' + bColor;
                    target = '#ssba-preview-1';
                }

                self.classicTextCss( type, value, target );
            } );

            // Container radius switch.
            $( 'body' ).on( 'switchChange.bootstrapSwitch', '#ssba_div_rounded_corners', function( event, state ) {
                var type = 'border-radius',
                    value = '0';

                if ( state ) {
                    value = '10px';
                }

                self.classicTextCss( type, value, '#ssba-preview-1' );
            } )

            // Share count switch.
            $( 'body' ).on( 'switchChange.bootstrapSwitch', '#ssba_show_share_count', function( event, state ) {
                var type = $( '#ssba_share_count_style option:selected' ).val();

                if ( state ) {
                    $( '#ssba-preview-1 .ssbp-list li' ).each( function() {
                        $( this ).find( 'span' ).addClass( 'ssba_sharecount' ).addClass( 'ssba_' + type );
                    } );
                } else {
                    $( '#ssba-preview-1 .ssbp-list li' ).each( function() {
                        $( this ).find( 'span' ).removeClass( 'ssba_sharecount' ).removeClass( 'ssba_' + type );
                    } );
                }
            } );

            // Share plus count switch.
            $( 'body' ).on( 'switchChange.bootstrapSwitch', '#ssba_plus_show_share_count', function( event, state ) {
                if ( state ) {
                    $( '#ssba-preview .ssbp-list li' ).each( function() {
                        $( this ).find( 'span' ).css( 'display', 'block' );
                    } );
                } else {
                    $( '#ssba-preview .ssbp-list li' ).each( function() {
                        $( this ).find( 'span' ).hide();
                    } );
                }
            } );

            // Share share bar count switch.
            $( 'body' ).on( 'switchChange.bootstrapSwitch', '#ssba_bar_show_share_count', function( event, state ) {
                if ( state ) {
                    $( '#ssba-preview-2 .ssbp-list li' ).each( function() {
                        $( this ).find( 'span' ).css( 'display', 'block' );
                    } );
                } else {
                    $( '#ssba-preview-2 .ssbp-list li' ).each( function() {
                        $( this ).find( 'span' ).hide();
                    } );
                }
            } );

            // Share count style.
            $( 'body' ).on( 'change', '#ssba_bar_count_style', function() {
                var type = $( '#ssba_bar_count_style option:selected' ).val();

                $( '#ssba-preview-1 .ssbp-list li' ).each( function() {
                    $( this ).find( 'span' ).removeClass( 'ssba_default' ).removeClass( 'ssba_white' ).removeClass( 'ssba_blue' ).addClass( 'ssba_' + type );
                } );
            } );

            // Swap classic and plus buttons.
            $( 'body' ).on( 'switchChange.bootstrapSwitch', '#ssba_new_buttons', function( event, state ) {
                self.swapButtons( state );
            } );

            // Toggle button menus when arrows are clicked.
            $( 'body' ).on( 'click', '.accor-wrap .accor-tab', function() {
                var type = $( this ).find( 'span.accor-arrow' );

                self.updateAccors( type.html(), type );
            } );

            // Add class to preview when scrolled to.
            $( window ).on( 'scroll', function(){
                var stickyTop = $( '#ssba-preview-title' ).offset().top,
                    stickyPlusTop = $( '#ssba-preview-title-2' ).offset().top;

                if ( $( window ).scrollTop() >= stickyTop ) {
                    $( '.master-ssba-prev-wrap, #ssba-preview-1' ).addClass( 'ssba-sticky' );
                } else {
                    $( '.master-ssba-prev-wrap, #ssba-preview-1' ).removeClass( 'ssba-sticky' );
                }

                if ( $( window ).scrollTop() >= stickyPlusTop ) {
                    $( '.master-ssba-prev-wrap2, #ssba-preview' ).addClass( 'ssba-sticky' );
                } else {
                    $( '.master-ssba-prev-wrap2, #ssba-preview' ).removeClass( 'ssba-sticky' );
                }
            } );

            // Network selection change.
            $( 'body' ).on( 'mouseout', '#ssbasort2, #ssbasort1', function() {
                var list = $( '#ssba_selected_buttons' ).val().split( ',' );

                self.updateNetworkPreview( list, '-1', 'img' );
            } );

            // Network share selection change.
            $( 'body' ).on( 'mouseout', '#ssbasort4, #ssbasort3', function() {
                var list = $( '#ssba_selected_bar_buttons' ).val().split( ',' );

                self.updateNetworkPreview( list, '-2', 'div.ssbp-text' );
            } );

            // Network plus selection change.
            $( 'body' ).on( 'mouseout', '#ssbasort6, #ssbasort5', function() {
                var list = $( '#ssba_selected_plus_buttons' ).val().split( ',' );

                self.updateNetworkPreview( list, '', 'div.ssbp-text' );
            } );

            // Add id to color picker submit.
            $( 'body' ).on( 'focus', '.ssba-colorpicker', function() {
                var id = $( this ).attr( 'id' );

                $( '.colpick_submit' ).attr( 'id', id );
            } );

            // Dismiss notice.
            $( 'body' ).on( 'click', '.ssba-tab-container blockquote .notice-dismiss', function() {
                var type = $( this ).attr( 'id' );

                // Save dismiss status to database.
                self.dismissNotice( type );
            } );

            // Copy text from read only input fields.
            $( 'body' ).on( 'click', '#ssba-copy-shortcode', function() {
                self.copyText( $( '.ssba-buttons-shortcode' ) );
            } );

            // Enable GDPR.
            $('body').on('click', '#enable-gdpr', function() {
               self.enableGdpr( true );
            });
        },

        /**
         * Switch for checkboxes.
         */
        switchCheckboxes: function() {
            $('.ssba-admin-wrap input:checkbox').bootstrapSwitch( {
                onColor: 'primary',
                size: 'normal'
            } );
        },

        /**
         * Color picker.
         */
        colorPicker: function() {
            $( '.ssba-colorpicker' ).colpick( {
                layout: 'hex',
                submit: 1,
                onSubmit: function( hsb, hex, rgb, el, colid ) {
                    $( el ).val( '#' + hex );
                    $( el ).css( 'border-color', '#' + hex );
                    $( el ).colpickHide();
                }
            } );
        },

        /**
         * Add drag and sort functions to include table.
         */
        dragSort: function() {
            $( '#ssbasort1, #ssbasort2, #ssbasort3, #ssbasort4, #ssbasort5, #ssbasort6' ).sortable( {
                connectWith: '.ssbaSortable'
            } ).disableSelection();
        },

        /**
         * Extract and add include list to hidden field.
         */
        extractIncludeList: function() {
            $( '#ssba_selected_buttons' ).val( $( '#ssbasort2 li' ).map( function() {

                // For each <li> in the list, return its inner text and let .map() build an array of those values.
                return $( this ).attr( 'id' );
            } ).get() );

            // After a change, extract and add include list to hidden field.
            $( '.ssbp-wrap' ).mouseout( function() {
                $( '#ssba-preview-1 .ssbp-list' ).html();
                $( '#ssba_selected_buttons' ).val( $( '#ssbasort2 li' ).map( function() {

                    // For each <li> in the list, return its inner text and let .map()
                    // build an array of those values.
                    return $( this ).attr( 'id' );
                } ).get() );
            } );

            $( '#ssba_selected_bar_buttons' ).val( $( '#ssbasort4 li' ).map( function() {

                // For each <li> in the list, return its inner text and let .map() build an array of those values.
                return $( this ).attr( 'id' );
            } ).get() );

            // After a change, extract and add include list to hidden field.
            $( '.ssbp-wrap' ).mouseout( function() {
                $( '#ssba_selected_bar_buttons' ).val( $( '#ssbasort4 li' ).map( function() {

                    // For each <li> in the list, return its inner text and let .map()
                    // build an array of those values.
                    return $( this ).attr( 'id' );
                } ).get() );
            } );

            $( '#ssba_selected_plus_buttons' ).val( $( '#ssbasort6 li' ).map( function() {

                // For each <li> in the list, return its inner text and let .map() build an array of those values.
                return $( this ).attr( 'id' );
            } ).get() );

            // After a change, extract and add include list to hidden field.
            $( '.ssbp-wrap' ).mouseout( function() {
                $( '#ssba_selected_plus_buttons' ).val( $( '#ssbasort6 li' ).map( function() {

                    // For each <li> in the list, return its inner text and let .map()
                    // build an array of those values.
                    return $( this ).attr( 'id' );
                } ).get() );
            } );
        },

        /**
         * When changing image sets.
         *
         * @param imageSet
         */
        changeImageSets: function( imageSet ) {
            if ( 'custom' === imageSet ) {
                $( '#ssba-custom-images' ).fadeIn( 100 );
            } else {
                $( '#ssba-custom-images' ).fadeOut( 100 );
            }
        },

        /**
         * Image Uploads
         *
         * @param field
         */
        imageUploads: function( field ) {
            var custom_uploader = wp.media.frames.file_frame = wp.media({
                title: 'Add Image',
                button: {
                    text: 'Add Image'
                },
                multiple: false
            } ),
                button,
                buttonClass;

            custom_uploader.on( 'select', function() {
                var attachment = custom_uploader.state().get( 'selection' ).first().toJSON();
                $( '#' + field ).val( attachment.url );

                // Update button preview.
                button = field.replace( 'ssba_custom_', '' );
                buttonClass = '.ssbp-li--' + button;

                $( buttonClass + ' img' ).attr( 'src', attachment.url );
            } );
            custom_uploader.open();
        },

        /**
         * SSBA admin form.
         *
         * @param event
         * @param submit
         * @param tabSelect
         */
        adminForm: function ( event, submit, tabSelect ) {
            var ssbaData = $('#ssba-admin-form').serialize(),
                ssba_selected_tab = $('#ssba_selected_tab').val(),
                gdpr_config = this.getConfig();

            // Show spinner to show save in progress.
            $('button.ssba-btn-save').html('<i class="fa fa-spinner fa-spin"></i>');

            // Disable all inputs.
            $( ':input' ).prop( 'disabled', true );
            $( '.ssba-admin-wrap input:checkbox' ).bootstrapSwitch( 'disabled', true );

            var theData = {
                ssbaData: ssbaData,
                ssba_selected_tab: ssba_selected_tab,
                gdpr_config: gdpr_config
            };

            if (undefined !== this.data.token && '' !== this.data.token) {

                // Update st config.
                $.ajax({
                    url: 'https://platform-api.sharethis.com/v1.0/property/product',
                    method: 'POST',
                    async: false,
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify({
                        'secret': this.data.token,
                        'id': this.data.propertyid,
                        'product': 'gdpr-compliance-tool-v2',
                        'config': gdpr_config
                    })
                });
            }

            $.post(
                $( submit ).prop( 'action' ),
                theData,
                function() {

                    // Show success.
                    $( 'button.ssba-btn-save-success' ).fadeIn( 100 ).delay( 2500 ).fadeOut( 200 );

                    // Re-enable inputs and reset save button.
                    $( ':input' ).prop( 'disabled', false );
                    $( '.ssba-admin-wrap input:checkbox' ).bootstrapSwitch( 'disabled', false );
                    $( 'button.ssba-btn-save' ).html( '<i class="fa fa-floppy-o"></i>' );
                }
            ).always( function( response ) {

                // Refresh page.
                if (!tabSelect) {
                    location.reload();
                }
            } ); // End post.
        },

        /**
         * Update the preview buttons with selected theme.
         *
         * @param selection
         * @param target
         */
        preview: function( selection, target ) {
            var position = $( '#ssba_bar_position option:selected' ).val(),
                newClass;

            if ( '#ssba-preview' === target ) {
                position = $( '#ssba_plus_align option:selected' ).val();
            }

            newClass = 'ssbp-wrap ssbp--theme-' + selection + ' ' + position;

            $( target ).attr( 'class', newClass );
        },

        /**
         * Update class on share bar preview to switch position.
         *
         * @param position
         */
        barPosition: function( position ) {
            if ( 'right' === position ) {
                $( '#ssba-preview-2' ).removeClass( 'left' );
            } else {
                $( '#ssba-preview-2' ).removeClass( 'right' );
            }

            $( '#ssba-preview-2' ).addClass( position );
        },

        /**
         * Add message to classic tab when plus buttons are enabled.
         *
         * @param value
         */
        swapButtons: function( value ) {
            if ( value ) {
                $( '#classic-share-buttons blockquote.yellow:first-of-type' ).show();
            } else {
                $( '#classic-share-buttons blockquote.yellow:first-of-type' ).hide();
            }
        },

        /**
         * Toggle the accordions.
         *
         * @param type
         * @param arrow
         */
        updateAccors: function( type, arrow ) {
            var closestButton = $( arrow ).parent( '.accor-tab' ).parent( '.accor-wrap' );

            if ( '►' === type ) {

                // Show the button configs.
                closestButton.find( '.accor-content' ).slideDown();

                // Change the icon next to title.
                closestButton.find( '.accor-arrow' ).html( '&#9660;' );
            } else {

                // Show the button configs.
                closestButton.find( '.accor-content' ).slideUp();

                // Change the icon next to title.
                closestButton.find( '.accor-arrow' ).html( '&#9658;' );
            }
        },

        /**
         * Change classic preview css.
         *
         * @param style
         * @param value
         * @param target
         * @param button
         */
        classicCss: function( style, value, target, button ) {
            var lineHeight,
                width;

            if ( 'li' === target ) {
                $( '#ssba-preview' + button + ' .ssbp-list li' ).each( function () {
                    $( this ).find( 'img' ).css( style, value );

                    if ( 'height' === style ) {
                        lineHeight = parseInt( $( '#ssba_padding' ).val() ) + parseInt( value ) + 3 + 'px';

                        $( '#ssba-preview' + button + ' .ssba-share-text-prev' ).css( 'line-height', lineHeight );
                        $( '#ssba-preview' + button + ' ul li img' ).css( 'line-height', lineHeight );
                    }

                    if ( 'padding' === style ) {
                        width = parseInt( $( '#ssba_size' ).val() ) + parseInt( value ) + 3 + 'px';

                        $( '#ssba-preview' + button + ' .ssba-share-text-prev' ).css( 'line-height', lineHeight );
                        $( '#ssba-preview' + button + ' ul li img' ).css( 'line-height', lineHeight );
                    }
                } );
            }

            if ( 'ul' === target ) {
                $( '#ssba-preview' + button ).css( style, value );
            }
        },

        /**
         * Change images used in classic preview.
         *
         * @param selection
         * @param target
         * @param button
         * @param find
         */
        classicPreview: function( selection, target, button, find, type ) {
            var title,
                imgSrc,
                height = $( '#ssba_' + type + '_height' ).val(),
                margin = $( '#ssba_plus_margin' ).val(),
                placement = $( '#ssba_plus_text_placement option:selected' ).val(),
                lineHeight,
                self = this;

            if ( '' === height ) {
                height = 48;
            }

            if ( '' === margin ) {
                margin = 0;
            }

            lineHeight = parseInt( height ) + parseInt( margin ) * 2;

            if ( ( 'height' === target || 'margin' === target ) && ( '' === button || '-1' === button ) && ( 'above' !== placement && 'below' !== placement ) ) {
                $( '#ssba-preview' + button + ' .ssba-share-text-prev' ).css( 'line-height', lineHeight + 'px' );
                $( '#ssba-preview' + button + ' ul li img' ).css( 'line-height', lineHeight + 'px' );
            }

            if ( 'height' === target && 'share' === type ) {
                self.updateInlineStyle();
            }

            $( '#ssba-preview' + button + ' .ssbp-list li' ).each( function() {
                if ( '' === target ) {
                    title = $( this ).find( find ).attr( 'title' ).toLowerCase();
                    imgSrc = self.data.site + selection + '/' + title.replace( /[^a-zA-Z 0-9]+/g, '' ).replace( ' ', '_' ) + '.png';

                    if ( 'custom' !== selection ) {
                        $( this ).find( find ).attr( 'src', imgSrc );
                    } else {
                        $( this ).find( find ).attr( 'src', '' );
                    }
                }

                if ( '' !== find ) {
                    $( this ).find( find ).css( target, selection );
                } else {
                    $( this ).css( target, selection );
                }
            } );
        },

        /**
         * Update the share text styling.
         *
         * @param type
         * @param value
         * @param target
         */
        classicTextCss: function( type, value, target ) {
            var height = $( '#ssba_plus_height' ).val(),
                margin = $( '#ssba_plus_margin' ).val(),
                cheight = $( '#ssba_size' ).val(),
                cmargin = $( '#ssba_padding' ).val() * 2,
                lineHeight,
                clineHeight;

            if ( '' === height || '' === cheight ) {
                height = 48;
                cheight = 48;
            }

            if ( '' === margin || '' === cmargin ) {
                margin = 0;
                cmargin = 0;
            }

            lineHeight = parseInt( height ) + parseInt( margin ) * 2;
            clineHeight = parseInt( cheight ) + parseInt( cmargin );

            if ( 'float' === type ) {
                $( '#ssba-preview-1 .ssba-share-text-prev' ).css( 'line-height', clineHeight + 'px' );
                $( '#ssba-preview-1 ul li img' ).css( 'line-height', clineHeight + 'px' );
            }

            if ( 'html' !== type && 'placement' !== type ) {
                $( target ).css( type, value );
            }

            if ( 'html' === type ) {
                $( target ).html( value );
            }

            if ( 'placement' === type && 'above' === value ) {
                $( target ).css( { 'float' : 'none', 'display' : 'inline' } );
                $( '.ssba-share-text-prev' ).css( 'line-height', 'inherit' );
            }

            if ( 'placement' === type && 'below' === value ) {
                $( target ).css( { 'display' : 'table-footer-group', 'float' : 'none' } );
                $( '.ssba-share-text-prev' ).css( 'line-height', 'inherit' );
            }
        },

        /**
         * Update the networks in the preview with new list.
         *
         * @param list
         * @param number
         * @param type
         */
        updateNetworkPreview: function( list, number, type ) {
            $( '#ssba-preview' + number + ' .ssbp-list li' ).addClass( 'ssba-hide-button' );
            $.each( list, function( index, id ) {
                $( '#ssba-preview' + number + ' .ssbp-list li' ).each( function() {
                    var newid = $( this ).find( type ).attr( 'title' ).toLowerCase().replace( '+', '' ).replace( ' ', '_' );

                    if ( id === newid ) {
                        $( this ).removeClass( 'ssba-hide-button' );
                    }
                } );
            } );
        },

        /**
         * Update style for non DOM styles.
         */
        updateInlineStyle: function() {
            var iconSize = $( '#ssba_plus_icon_size' ).val(),
                iconLineHeight = $( '#ssba_plus_height' ).val(),
                iconColor = $( '#ssba_plus_icon_color' ).val(),
                iconColorHover = $( '#ssba_plus_icon_hover_color' ).val(),
                buttonColorHover = $( '#ssba_plus_button_hover_color' ).val(),
                iconSizeBar = $( '#ssba_bar_icon_size' ).val(),
                iconLineHeightBar = $( '#ssba_bar_height' ).val(),
                iconColorBar = $( '#ssba_bar_icon_color' ).val(),
                iconColorHoverBar = $( '#ssba_bar_icon_hover_color' ).val(),
                buttonColorHoverBar = $( '#ssba_bar_button_hover_color' ).val(),
                newStyle = '#ssba-preview .ssbp-li--facebook_save { line-height: ' + iconLineHeight + 'px; } #ssba-preview .ssbp-btn:before{ font-size: ' + iconSize + 'px; line-height: ' + iconLineHeight + 'px; color: ' + iconColor + '; } #ssba-preview .ssbp-btn:hover::before { color: ' + iconColorHover + '; } #ssba-preview .ssbp-btn:hover { background: ' + buttonColorHover + '!important; } #ssba-preview-2 .ssbp-btn:before{ font-size: ' + iconSizeBar + 'px; line-height: ' + iconLineHeightBar + 'px; color: ' + iconColorBar + '; } #ssba-preview-2 .ssbp-btn:hover::before { color: ' + iconColorHoverBar + '; } #ssba-preview-2 .ssbp-btn:hover { background: ' + buttonColorHoverBar + '!important; }';

            $( '#simple-share-buttons-adder-styles-inline-css' ).html( newStyle );
        },

        /**
         * Add dismiss status to blockquote notices.
         *
         * @param type
         */
        dismissNotice: function (type) {

            // Send newsletter id to the test function.
            wp.ajax.post('dismiss_notice', {
                type: type,
                nonce: this.data.nonce
            }).always(function (response) {

                // Hide notice.
                $('#' + type).closest('blockquote').hide();
            });
        },

        /**
         * Copy text to clipboard
         *
         * @param copiedText
         */
        copyText: function ( copiedText ) {
            copiedText.select();
            document.execCommand('copy');
        },

        /**
         * Create property for new account.
         *
         */
        createProperty: function ( fromGdpr ) {
            var self = this;

            const theData = JSON.stringify({
                domain: this.data.homeUrl,
                is_simpleshare: true,
                product: 'simple-share',
            });

            $.ajax( {
                    url: 'https://platform-api.sharethis.com/v1.0/property',
                    method: 'POST',
                    async: false,
                    contentType: 'application/json; charset=utf-8',
                    data: theData,
                    success: function ( results ) {
                        wp.ajax.post( 'ssba_ajax_add_creds', {
                            propertyId: results._id,
                            token: results.secret,
                            nonce: self.data.nonce
                        } ).always( function ( results ) {
                        } );
                    }
                }
            );
        },
        /**
         * Helper function to grab config of GDPR options.
         *
         * @param {bool} first If first enable.
         */
        getConfig: function ( first ) {
            var config,
                enabled = first ? true : $('#sharethis-enabled').is(':checked'),
                publisherPurposes = [],
                publisherRestrictions = {},
                display = $( '#sharethis-user-type option:selected' ).val(),
                name = $( '#sharethis-publisher-name' ).val(),
                scope = $( '#sharethis-consent-type option:selected' ).val(),
                color = $( '#sharethis-form-color .color.selected' ).attr('data-value'),
                language = $( '#st-language' ).val();

            $('.vendor-table-cell-wrapper label input:checked').each( function( index, value ) {
                var vendorId = $(value).attr('data-id');
                if (vendorId) {
                    publisherRestrictions[vendorId] = true;
                }
            });

            $('#publisher-purpose input:checked').each( function( index, value ) {
                var theId = $(value).attr('data-id'),
                    legit = 'consent' !== $(value).val();

                publisherPurposes.push({ 'id': theId, 'legitimate_interest' : legit });
            });

            config = {
                enabled: enabled,
                display: display,
                publisher_name: name,
                publisher_purposes: publisherPurposes,
                publisher_restrictions: publisherRestrictions,
                language: language,
                color: color,
                scope: scope,
            };

            return config;
        },
        /**
         * Helper function to set gdpr purpose radio fields.
         * @param configVisible
         */
        setPurposes: function (configVisible) {
            const self = this;

            if (!configVisible) {
                return;
            }

            $("#publisher-purpose .purpose-item input").prop('checked', false);
            $("#publisher-purpose .purpose-item input[name='purposes[1]']").bootstrapSwitch( 'state', false );

            if (this.data['publisher_purposes']) {
                this.data['publisher_purposes'].map((purpVal) => {
                    var legit = 'true' === purpVal['legitimate_interest'] || true === purpVal['legitimate_interest'],
                        consent = 'false' === purpVal['legitimate_interest'] || false === purpVal['legitimate_interest'];

                    $( `#publisher-purpose .purpose-item input[name="purposes[${purpVal.id}]"][value="legitimate"]` ).prop( 'checked', legit );
                    $( `#publisher-purpose .purpose-item input[name="purposes[${purpVal.id}]"][value="consent"]` ).prop( 'checked', consent );

                    if ('1' === purpVal.id) {
                        $("#publisher-purpose .purpose-item input[name='purposes[1]']").bootstrapSwitch( 'state', consent );
                    }
                } );
            }

            if ( undefined !== self.data['publisher_restrictions'] ) {
                $( ".vendor-table-body .vendor-table-cell-wrapper input" ).prop( 'checked', false );
                $( ".vendor-table-body .vendor-table-cell-wrapper input" ).bootstrapSwitch( 'state', false );

                $.map( self.data['publisher_restrictions'], function ( id, venVal ) {
                    if ( id ) {
                        $( `.vendor-table-body .vendor-table-cell-wrapper input[type="checkbox"][data-id="${venVal}"]` ).prop( 'checked', true );
                        $( `.vendor-table-body .vendor-table-cell-wrapper input[type="checkbox"][data-id="${venVal}"]` ).bootstrapSwitch( 'state', true );
                    }
                } );
            }
        },

        /**
         * Enable gdpr product.
         *
         * @param {bool} first Is it first enable.
         */
        enableGdpr: function( first ) {
            const self = this;
            const config = this.getConfig( first );

            $.ajax({
                url: 'https://platform-api.sharethis.com/v1.0/property/product',
                method: 'POST',
                async: false,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify({
                    'secret': self.data.token,
                    'id': self.data.propertyid,
                    'product': 'gdpr-compliance-tool-v2',
                    'config': config
                }),
                success: function ( results ) {
                    wp.ajax.post( 'ssba_ajax_update_gdpr', {
                        config: config,
                        nonce: self.data.nonce
                    } ).always( function ( results ) {
                    } );
                }
            });

            $('.gdpr-landing').hide();
            $('.gdpr-config').show();
        },

        scrollToAnchor: function(aid) {
            var aTag = $("a[name='"+ aid.toLowerCase() +"']");

            $('.vendor-table-body').animate({
                scrollTop: 0
            }, 0).animate({
                scrollTop: aTag.offset().top - 1100
            }, 0);
        },
    };
} )( window.jQuery, window.wp );
