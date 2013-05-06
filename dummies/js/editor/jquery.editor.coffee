"use strict"

do ($ = jQuery) ->

	$.fn.call = (callback) ->
		if callback then callback()

	$editorSidebar = $ '.editor-sidebar'
	$sidebarHeader = $ '> header', $editorSidebar
	$sidebarContent = $ 'section.editor-sidebar-content', $editorSidebar

	columnsPrefix = 'columns-'

	openSidebar = ->
		$editorSidebar.addClass('open');

		setTimeout setColumnCount, 300

	getColumnsCount = ->
		$editorSidebar.data 'columns'

	closeSidebar = ->
		prefColumnsCount = getColumnsCount()
		$editorSidebar
			.removeClass('open')
		
		setTimeout ->
				$editorSidebar.removeClass columnsPrefix + prefColumnsCount
			, 300

		


	toggleSidebar = ->
		if $editorSidebar.hasClass 'open'
			closeSidebar()
		else
			openSidebar()

	setSidebarHeight = ->
		$sidebarContent.css
			'height': $(window).height() - $sidebarHeader.outerHeight()
			#'margin-top': $sidebarHeader.height()
	
	setColumnCount = ->
		width = parseInt $sidebarContent.width(), 10

		prefColumnsCount = getColumnsCount()
		columnsCount = Math.floor width / 75

		if columnsCount
			$editorSidebar
				.removeClass(columnsPrefix + prefColumnsCount)
				.addClass(columnsPrefix + columnsCount)
				.data('columns', columnsCount)

	# merge methods
	onResizeSidebar = ->
		setSidebarHeight()
		setColumnCount()

	# toggle sidebar
	$('#show-editor-sidebar').on 'click', ->
		toggleSidebar()

	
	# ! --- Image List ---
	
	$imageList = $ '.image-list', $editorSidebar

	if $imageList.length
		$('a', $imageList).on 'click', ->
			$('.selected', $imageList).not(@).removeClass 'selected'

			$(@).toggleClass 'selected'


		false

	# register events
	$.addOnWindowResize 'editor.sidebar.height', onResizeSidebar

	setSidebarHeight()
	setColumnCount()
	@

