"use strict"

do ($ = jQuery) ->

	class EditorSidebar
		
		$editorSidebar: null
		$sidebarHeader: null
		$sidebarContent: null

		columnsPrefix: 'columns-'

		constructor: ->
			@.$editorSidebar = $ '.editor-sidebar'
			@.$sidebarHeader = $ '> header', @.$editorSidebar
			@.$sidebarContent = $ 'section.editor-sidebar-content', @.$editorSidebar

			# toggle sidebar
			$('#show-editor-sidebar').on 'click', (el) =>
				$(el).blur().toggleClass 'active'
				@toggle()

				false
			
			# ! --- Image List ---
			
			$imageList = $ '.image-list', @.$editorSidebar

			if $imageList.length
				$('a', $imageList).on 'click', ->
					$('.selected', $imageList).not(@).removeClass 'selected'

					$(@).blur().toggleClass 'selected'

				false

			# register events
			$.addOnWindowResize 'editor.sidebar.height', =>
				@onResizeSidebar()

			@setSidebarHeight()
			@setColumnCount()

		open: ->
			@.$editorSidebar.addClass('open');

			setTimeout =>
				@setColumnCount()
			, 300

		close: ->
			prefColumnsCount = @getColumnsCount()
			@.$editorSidebar
				.removeClass('open')
			
			setTimeout =>
					@.$editorSidebar.removeClass @columnsPrefix + prefColumnsCount
				, 300

		toggle: ->
			if @.$editorSidebar.hasClass 'open'
				@close()
			else
				@open()

		setSidebarHeight: ->
			@.$sidebarContent.css
				'height': $(window).height() - @.$sidebarHeader.outerHeight()
				#'margin-top': $sidebarHeader.height()
		
		getColumnsCount: ->
			@.$editorSidebar.data 'columns'

		setColumnCount: ->
			width = parseInt @.$sidebarContent.width(), 10

			prefColumnsCount = @getColumnsCount()
			columnsCount = Math.floor width / 75

			if columnsCount
				@.$editorSidebar
					.removeClass(@columnsPrefix + prefColumnsCount)
					.addClass(@columnsPrefix + columnsCount)
					.data('columns', columnsCount)

		# bundle methods
		onResizeSidebar: ->
			@setSidebarHeight()
			@setColumnCount()


	# create sidebar
	win = window
	win.sidebar = new EditorSidebar()
	win.sidebar.open()

