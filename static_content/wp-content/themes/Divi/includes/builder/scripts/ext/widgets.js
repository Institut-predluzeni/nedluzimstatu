( function($) {

	$(function() {
		// WP 5.8 above - Widget Block Editor.
		var is_widgets_block_editor = $('.edit-widgets-block-editor').length > 0;

		// 1.a Appends widget area creator panel.
		var widget_writing_area = is_widgets_block_editor ? '.block-editor-writing-flow > div' : '.widget-liquid-right';
		$(widget_writing_area).append(et_pb_options.widget_info);

		var $create_box = $( '#et_pb_widget_area_create' ),
			$widget_name_input = $create_box.find( '#et_pb_new_widget_area_name' ),
			$et_pb_sidebars = $( 'div[id^=et_pb_widget_area_]' );

		// 1.b. Handles create widget area action.
		$create_box.find('.et_pb_create_widget_area').on('click', function(event) {
			var $this_el = $(this);

			event.preventDefault();

			if ( $widget_name_input.val() === '' ) return;

			$.ajax( {
				type: "POST",
				url: et_pb_options.ajaxurl,
				data:
				{
					action : 'et_pb_add_widget_area',
					et_admin_load_nonce : et_pb_options.et_admin_load_nonce,
					et_widget_area_name : $widget_name_input.val()
				},
				success: function( data ){
					$this_el.closest( '#et_pb_widget_area_create' ).find( '.et_pb_widget_area_result' ).hide().html( data ).slideToggle();
				}
			} );
		});

		// 2.a. Append custom widget area remove button and handles remove action.
		var et_pb_sidebars_append_delete_button = function() {
			// 2.a.1. Append custom widget area remove button.
			var widget_area_id = is_widgets_block_editor ? $(this).data('widget-area-id') : $(this).attr('id');
			var widget_wrapper = is_widgets_block_editor ? '.block-editor-block-list__block' : '.widgets-holder-wrap';
			var widget_title   = is_widgets_block_editor ? '.components-panel__body-toggle' : '.sidebar-name h2, .sidebar-name h3';

			$(this).closest(widget_wrapper).find(widget_title).before('<a href="#" class="et_pb_widget_area_remove" data-et-widget-area-id="' + widget_area_id + '">' + et_pb_options.delete_string + '</a>');

			// 2.a.1. andles remove widget area action.
			$('.et_pb_widget_area_remove').on('click', function(event) {
				var $this_el = $(this);

				event.preventDefault();

				$.ajax( {
					type: "POST",
					url: et_pb_options.ajaxurl,
					data:
					{
						action : 'et_pb_remove_widget_area',
						et_admin_load_nonce : et_pb_options.et_admin_load_nonce,
						et_widget_area_name : $this_el.data('et-widget-area-id'),
					},
					success: function( data ){
						$('a[data-et-widget-area-id="' + data + '"]').closest(widget_wrapper).remove();
					}
				} );

				return false;
			});
		};

		// 2.b. Appends custom widget area remove button on each custom sidebar.
		if (is_widgets_block_editor) {
			var widgetBlockListMutation = _.debounce(function(mutations, observer) {
				$('div[data-widget-area-id^=et_pb_widget_area_]').each(et_pb_sidebars_append_delete_button);

				// Disconnect once we know the delete buttons are added.
				if ($('.et_pb_widget_area_remove').length > 0) {
					observer.disconnect();
				}
			}, 1000);

			// Watch for widget block editor to load Widget Area blocks. There is no event to
			// know when those blocks are added on the editor, hence we use mutation observer.
			var widgetBlockListObserver = new MutationObserver(widgetBlockListMutation);

			widgetBlockListObserver.observe(document.querySelector('.block-editor-block-list__layout'), {childList: true});
		} else {
			$et_pb_sidebars.each(et_pb_sidebars_append_delete_button);
		}
	} );

} )(jQuery);