jQuery(document).ready( function($) { 

    $('.page-title-action').hide();

    var postID = document.getElementById('post_ID') != null ? document.getElementById('post_ID').value : 0;

    // Initialize the CodeMirror editor
    if ( $('#ccj_content').length > 0 ) {
        var content_mode = $("#ccj_content").attr('mode');
        if ( content_mode == 'html' ) {
              var content_mode = {
                name: "htmlmixed",
                scriptTypes: [{matches: /\/x-handlebars-template|\/x-mustache/i,
                mode: null}]
                 };
        }

		CCJ.codemirror.mode = content_mode;
		CCJ.codemirror.extraKeys.F11 = function(cm) {
        	cm.setOption("fullScreen", !cm.getOption("fullScreen"));
			fullscreen_buttons( true );
			var cookies = (getCookie('ccj-' + postID) || '0,0,0,0').split(',');
			document.cookie = 'ccj-' + postID + '=' + [cookies[0], cookies[1], cookies[2], 1].join(',') + '; SameSite=Lax';
		};
        CCJ.codemirror.extraKeys.Esc = function(cm) {
			if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
			fullscreen_buttons( false );
			var cookies = (getCookie('ccj-' + postID) || '0,0,0,0').split(',');
			document.cookie = 'ccj-' + postID + '=' + [cookies[0], cookies[1], cookies[2], 0].join(',') + '; SameSite=Lax';
		};

        var editor = CodeMirror.fromTextArea(document.getElementById("ccj_content"), CCJ.codemirror);

		// Code folding
		editor.setOption("lineNumbers", true);
		editor.setOption("lineWrapping", true);
		editor.setOption("foldGutter", true);
		editor.setOption("gutters", ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]);
		CCJ.codemirror.extraKeys["Ctrl-Q"] = function(cm){ cm.foldCode(cm.getCursor()); };

		// Note: ccj-postID cookie will save cursor line, cursor character, editor height and fullscreen values
		var cookies = (getCookie('ccj-' + postID) || '0,0,0,0').split(',');

        // Make the editor resizable
        var cm_width = $('#title').width() + 16;
		var cm_height = (parseFloat(cookies[2]) >= 200) ? parseFloat(cookies[2]) : 500;
        editor.setSize(cm_width, cm_height);

        $('.CodeMirror').resizable({
            resize: function() {
                editor.setSize($(this).width(), $(this).height());
            } ,
            maxWidth: cm_width,
            minWidth: cm_width,
            minHeight: 200
            
        });

        $(window).resize(function () { 
            var cm_width = $('#title').width() + 16;
            var cm_height = $('.CodeMirror').height();
            editor.setSize(cm_width, cm_height);
        });

        // Code Beautifier
        $("#ccj-beautifier").click(function(e){
            CodeMirror.commands["selectAll"](editor);
            editor.autoFormatRange(editor.getCursor(true), editor.getCursor(false));
            editor.setCursor(0);
            e.preventDefault();
        });

		// Autocomplete
		if ( CCJ.autocomplete === '1' ) {
			editor.on( "keyup", function ( cm, event ) {
				if ( ! cm.state.completionActive && event.keyCode > 64 && event.keyCode < 91 ) {
					CodeMirror.commands.autocomplete( cm, null, { completeSingle: false } );
				}
			});
		}

        // Saving cursor state
        editor.on('cursorActivity', function () {
            var curPos = editor.getCursor();
            document.cookie = 'ccj-' + postID + '=' + [curPos.line, curPos.ch, cookies[2], cookies[3]].join(',') + '; SameSite=Lax';
        });

        // Restoring cursor state
        editor.setCursor(parseFloat(cookies[0]), parseFloat(cookies[1]));

		// Save the editor's height
		editor.on('refresh', function() {
			var height = ( !editor.getOption('fullScreen') ) ? $('.CodeMirror').height() : cookies[2];
        	var curPos = editor.getCursor();
			document.cookie = 'ccj-' + postID + '=' + [curPos.line, curPos.ch, height, Number(editor.getOption('fullScreen'))].join(',') + '; SameSite=Lax';
		});

		// Save the custom code when hitting "Ctrl-S"
		editor.on('keydown', function(cm, event) {
			if ( ! event.ctrlKey && ! event.metaKey || event.which !== 83 ) return;

			var height = ( !editor.getOption('fullScreen') ) ? $('.CodeMirror').height() : cookies[2];
        	var curPos = editor.getCursor();
			document.cookie = 'ccj-' + postID + '=' + [curPos.line, curPos.ch, height, Number(editor.getOption('fullScreen'))].join(',') + '; SameSite=Lax';
			
			$("form#post").submit();
            event.preventDefault();
            return false;
		});


		// Restoring fullscreen 
		editor.setOption("fullScreen", parseFloat(cookies[3]));
        fullscreen_buttons( Boolean(parseFloat(cookies[3])) );

		// Action for the `fullscreen` button
		$("#ccj-fullscreen-button").click( function() {
			editor.triggerOnKeyDown({type: 'keydown', keyCode: 122});
		});

		$("#publish").click(function(e){
			var cookies = (getCookie('ccj-' + postID) || '0,0,0,0').split(',');
			var curPos = editor.getCursor();
			document.cookie = 'ccj-' + postID + '=' + [curPos.line, curPos.ch, cookies[2], Number(editor.getOption('fullScreen'))].join(',') + '; SameSite=Lax';
		});
    }

    // Enable the tipsy 
    $('span[rel=tipsy].tipsy-no-html').tipsy({fade: true, gravity: 's'});
    $('span[rel=tipsy]').tipsy({fade: true, gravity: 's', html: true});

    // Toggle the buttons when in fullscreen mode
    function fullscreen_buttons( mode ) {
        editor.focus();
        if ( mode === true ) {
            $("#publish").css({
                'position'  : 'fixed',
                'right'     : '40px',
                'bottom'    : '40px',
                'z-index'   : 100005,
            });
        } else {
            $("#publish").css({
                'position'  : 'static',
                'right'     : 'initial',
                'bottom'    : 'initial',
                'z-index'   : 10,
            });
        }
    }


    // For post.php or post-new.php pages show the code's title in the page title
    if ( $('#titlediv #title').length > 0 ) {
        var new_title = $("input[name=custom_code_language]").val().toUpperCase() + ' - ' + $('#titlediv #title').val();
        if( $('#titlediv #title').val().length > 0 ) {
            $(document).prop('title', new_title );
        }
        $('#titlediv #title').change(function() {
            if ( $(this).val().length > 0 ) {
                $(document).prop('title', new_title);
            } 
        });
    }


    // Make the inactive rows opaque
    if ( $('.dashicons-star-empty.ccj_row').length > 0 ) {
        $('.dashicons-star-empty.ccj_row').each(function(){
            $(this).parent().parent().parent().css('opacity', '0.4');
        });
    }

    // Activate/deactivate codes with AJAX
    $(".ccj_activate_deactivate").click( function(e) {
        var url = $(this).attr('href');
        var code_id = $(this).attr('data-code-id');
        e.preventDefault(); 
        $.ajax({
            url: url, 
            success: function(data){
                if (data === 'yes') {
                    ccj_activate_deactivate(code_id, false);
                }
                if (data === 'no') {
                    ccj_activate_deactivate(code_id, true);
                }
            }
        });
    });


	// The "After <body> tag" option cannot go together with the "In Admin" option
	custom_code_type_change();
	$( 'input[name=custom_code_type]' ).on( 'change', custom_code_type_change );
	function custom_code_type_change() {
		if ( $( 'input[name=custom_code_type]:checked' ).val() === 'body_open' ) {
			$( '#custom_code_side-admin' ).prop( 'disabled', true );
			if ( $( 'input[name=custom_code_side]:checked' ).val() === 'admin' ) {
				$( '#custom_code_side-admin' ).prop( 'checked', 'checked' );
			}
		} else {
			$( '#custom_code_side-admin' ).prop( 'disabled', false );
		}
	}
	custom_code_side_change();
	$( 'input[name=custom_code_side]' ).on( 'change', custom_code_side_change );
	function custom_code_side_change() {
		if ( $( 'input[name=custom_code_side]:checked' ).val() === 'admin' ) {
			$( '#custom_code_type-body_open' ).prop( 'disabled', true );
		} else {
			$( '#custom_code_type-body_open' ).prop( 'disabled', false );
			if ( $( 'input[name=custom_code_type]:checked' ).val() === 'body_open' ) {
				$( '#custom_code_type-body_open' ).prop( 'checked', true );
			}
		}
	}


    // Toggle the signs for activating/deactivating codes
    function ccj_activate_deactivate(code_id, action) {
        var row = $('tr#post-'+code_id);
        if ( action === true ) {
            row.css('opacity', '1');
            row.find('.row-actions .ccj_activate_deactivate')
                .text(CCJ.deactivate)
                .attr('title', CCJ.active_title);
            row.find('td.active .dashicons')
                .removeClass('dashicons-star-empty')
                .addClass('dashicons-star-filled');
            row.find('td.active .ccj_activate_deactivate')
                .attr('title', CCJ.active_title);
            $('#activate-action span').text(CCJ.active);
            $('#activate-action .ccj_activate_deactivate').text(CCJ.deactivate);
        } else {
            row.css('opacity', '0.4');
            row.find('.row-actions .ccj_activate_deactivate')
                .text(CCJ.activate)
                .attr('title', CCJ.deactive_title);
            row.find('td.active .dashicons')
                .removeClass('dashicons-star-filled')
                .addClass('dashicons-star-empty');
            row.find('td.active .ccj_activate_deactivate')
                .attr('title', CCJ.deactive_title);
            $('#activate-action span').text(CCJ.inactive);
            $('#activate-action .ccj_activate_deactivate').text(CCJ.activate);
        }
    }

    function getCookie(name) {
        var value = '; ' + document.cookie;
        var parts = value.split('; ' + name + '=');
        if (parts.length === 2) return parts.pop().split(';').shift();
    }



    // Permalink slug
    $( '#titlediv' ).on( 'click', '.ccj-edit-slug', function() {
		var i, 
			$el, revert_e,
			c = 0,
            slug_value = $('#editable-post-name').html(),
			real_slug = $('#post_name'),
			revert_slug = real_slug.val(),
			permalink = $( '#sample-permalink' ),
			permalinkOrig = permalink.html(),
			permalinkInner = $( '#sample-permalink a' ).html(),
            permalinkHref = $('#sample-permalink a').attr('href'),
			buttons = $('#ccj-edit-slug-buttons'),
			buttonsOrig = buttons.html(),
			full = $('#editable-post-name-full');

		// Deal with Twemoji in the post-name.
		full.find( 'img' ).replaceWith( function() { return this.alt; } );
		full = full.html();

		permalink.html( permalinkInner );

		// Save current content to revert to when cancelling.
		$el = $( '#editable-post-name' );
		revert_e = $el.html();

		if ( typeof postL10n === 'undefined' || postL10n.cancel === '' || postL10n.ok === '' ) {
			postL10n = {
				ok     : wp.i18n.__( 'OK' ),
				cancel : wp.i18n.__( 'Cancel' ),
			}
		}

        buttons.html( '<button type="button" class="save button button-small">' + postL10n.ok + '</button> <button type="button" class="cancel button-link">' + postL10n.cancel + '</button>' );


        // Save permalink changes.
		buttons.children( '.save' ).click( function() {
			var new_slug = $el.children( 'input' ).val();

			if ( new_slug == $('#editable-post-name-full').text() ) {
				buttons.children('.cancel').click();
				return;
			}

			$.post(
				ajaxurl,
				{
					action: 'ccj_permalink',
					code_id: $('#post_ID').val(),
					new_slug: new_slug,
                    permalink: permalinkHref, 
					filetype: $('#editable-post-name-full').data('filetype'), 
					ccj_permalink_nonce: $('#ccj-permalink-nonce').val()
				},
				function(data) {
					var box = $('#edit-slug-box');
					box.html(data);
					if (box.hasClass('hidden')) {
						box.fadeIn('fast', function () {
							box.removeClass('hidden');
						});
					}
				}
			);
		});

		// Cancel editing of permalink.
		buttons.children( '.cancel' ).click( function() {
			$('#view-post-btn').show();
			$el.html(revert_e);
			buttons.html(buttonsOrig);
			permalink.html(permalinkOrig);
			real_slug.val(revert_slug);
			$( '.ccj-edit-slug' ).focus();
		});

		$el.html( '<input type="text" name="new_slug" id="new-post-slug" value="' + slug_value + '" autocomplete="off" />' ).children( 'input' ).keydown( function( e ) {
			var key = e.which;
			// On [enter], just save the new slug, don't save the post.
			if ( 13 === key ) {
				e.preventDefault();
				buttons.children( '.save' ).click();
			}
			// On [esc] cancel the editing.
			if ( 27 === key ) {
				buttons.children( '.cancel' ).click();
			}
		} ).keyup( function() {
			real_slug.val( this.value );
		}).focus();


    });


});

