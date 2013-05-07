"use strict"

do ($ = jQuery) ->

	editorTypes = ['markdown']

	$('[contenteditable="true"][data-editor-type]').each (i, el) ->
		
		open = ->
			api.show()

		close = ->
			api.hide()

		toggle = ->
			if api.tooltip
				api.toggle()
			else
				open()

		getContent = ->
			console.log elType

			"<h1>#{elType} Editor</h1>"

		$el = $ el

		elType = $el.data 'editor-type'

		if -1 is $.inArray elType, editorTypes then return

		$el.qtip
			content: 
				text: getContent()
				title: ''

			position:
				at: 'right center'
				my: 'left center'
			show:
				event: false
				#ready: true

			hide: 
				event: false
				#inactive: 3000
				fixed: true
			style: 'editor-popover'

		api = $el.qtip 'api'

		console.log api

		$el.on 'click', ->
			toggle()
			