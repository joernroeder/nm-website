"use strict"

do ($ = jQuery) ->

	editorTypes = ['markdown', 'date', 'inline']
	openPopovers = {}

	$('[contenteditable="true"],[data-editor-type]').each (i, el) ->
		
		hideOpen = ->
			$.map openPopovers, (api, id) ->
				api.hide()
				delete openPopovers[api._id]

		open = ->
			hideOpen()
			api.show()
			openPopovers[api._id] = api

		close = ->
			api.hide()
			delete openPopovers[api._id]
			#openPopovers.push api

		toggle = ->
			if api.tooltip and $(api.tooltip).hasClass('qtip-focus')
				close()
			else
				open()

		getContent = ->
			"<h1>#{elType} Editor</h1>"

		_type = ''
		getType = ->
			if _type then return _type
			_type = if $el.attr 'contenteditable' then 'inline' else $el.data 'editor-type'

		$el = $ el

		elType = getType()

		if -1 is $.inArray elType, editorTypes then return

		$el.qtip
			content: 
				text: getContent()
				title: ''

			position:
				at: 'right center'
				my: 'left center'
				
				adjust:
					x: 10
					resize: true # @todo: own resize method

			show:
				event: false
				#ready: true

			hide: 
				event: false
				#inactive: 3000
				fixed: true

			style: 
				classes: 'editor-popover'
				tip:
					width: 20
					height: 10

		api = $el.qtip 'api'

		$el.on 'click', ->
			if getType() is 'inline'
				hideOpen()
			else
				toggle()
			