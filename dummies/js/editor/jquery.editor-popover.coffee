"use strict"

do ($ = jQuery) ->

	class Editor
		contentTypes = {}
		components = {}
		events = {}
		
		constructor: (components) ->
			$.map components, (component) =>
				@addComponent component

			init.call @

		###
		 # on, off, trigger via $.Callbacks() 
		 #
		 # @link http://stackoverflow.com/questions/9099555/jquery-bind-events-on-plain-javascript-objects
		###
		on: (name, callback) ->
			if not events[name]
				events[name] = $.Callbacks()

			events[name].add callback

		off: (name, callback) ->
			if not events[name] then return
			events[name].remove callback

		trigger: (name, eventData) ->
			if events[name] then events[name].fire eventData

		init = ->
			$('[data-editor-type]').each (i, el) =>
				$el = $ el
				contentType = $el.data 'editor-type'

				if -1 isnt $.inArray(contentType, Object.keys(contentTypes))
					component = @getComponentByContentType contentType
					#component.setElement $el
					component.init $el


		###
		 # registers a new component
		 #
		 # @public
		 #
		 # @param [string] name
		###
		addComponent: (name) ->
			console.log 'add Component: ' + name

			component = new window.editorComponents[name](@)
			$.map component.contentTypes, (type) =>
				addContentType type, name

			components[name] = []

		getComponentByContentType: (type) ->
			lowerType = type.toLowerCase()
			componentName = contentTypes[lowerType]
			
			return if componentName then @getComponent componentName else null

		getComponent: (name) ->
			if window.editorComponents[name]
				component = new window.editorComponents[name](@)
				components[name].push component
				return component
			else
				return null


		###
		 #
		 # @private
		 #
		 # @param [string] content type
		 # @param [string] component name
		###
		addContentType = (type, componentName) ->
			lowerType = type.toLowerCase()
			if contentTypes[lowerType]
				throw new Error 'Another Component (' + contentTypes[lowerType] + ') is already handling the content-type "' + type + '"'
			else
				contentTypes[lowerType] = componentName


	###
	 # Abstract Editable Class
	 # 
	 # @param [Editor] editor
	###
	class Editable 
		contentTypes: []

		constructor: (@editor) ->
			@name = @.constructor.name.toLowerCase()

			# generate a unique id @link http://stackoverflow.com/a/2117523/520544
			@id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace /[xy]/g, (c) ->
				r = Math.random() * 16 | 0
				v = (if c is "x" then r else (r & 0x3 | 0x8))
				v.toString 16

			if @.constructor.name is 'Editable'
				throw new ReferenceError '"Editable" is an abstract class. Please use one of the subclasses instead.'

		# kick off your stuff from here!
		init: (@element) ->
			console.log 'subclass this method to run your custom code'

		###
		 # returns a namespaced event name
		 # 
		 # @param [string] event name
		 # @return string
		###
		getEventName = (name) ->
			name = if -1 isnt name.indexOf '.' then name else @name + '.' + name

		trigger: (name, eventData = {}) ->
			eventData['sender'] = @id
			name = getEventName name
			@editor.trigger name, eventData

		on: (name, callback) ->
			name = getEventName name
			console.log name
			@editor.on name, callback

		off: (name, callback) ->
			name = getEventName name
			@editor.off name, callback
	###
	 #
	###
	class InlineEditable extends Editable

		contentTypes: ['inline']

		init: (@element) ->
			@element.attr 'contenteditable', true

			@trigger 'editor.closepopovers'


	class PopoverEditable extends Editable	

		init: (@element) ->
			element.qtip
				content: 
					text: @getContent()
					title: ''

				position:
					at: 'right center'
					my: 'left center'
				
					adjust:
						x: 10
						resize: true # @todo: own resize method
						method: 'flip shift'

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

			@api = element.qtip 'api'

			@on 'editor.closepopovers', (eventData) =>
				if eventData.sender isnt @id
					@close()

			element.on 'click', =>
				@toggle()

		open: ->
			@trigger 'editor.closepopovers'
			@api.show()

		close: ->
			@api.hide()

		toggle: ->
			if @api.tooltip and $(@api.tooltip).hasClass('qtip-focus')
				@close()
			else
				@open()

		getContent: ->
			types = @contentTypes.join ', '
			"<h1>#{types} Editor</h1>"

		#openPopovers: {}


	class DateEditable extends PopoverEditable

		contentTypes: ['date']


	class MarkdownEditable extends PopoverEditable

		contentTypes: ['markdown']



	# ! --- publish base classes ---
	window.editorComponents = {}

	#window..editorComponents.Editor = Editor
	window.editorComponents.Editable = Editable
	window.editorComponents.PopoverEditable = PopoverEditable


	# ! --- publish sub classes ---
	
	window.editorComponents.InlineEditable = InlineEditable
	window.editorComponents.DateEditable = DateEditable
	#window.editorComponents.MarkdownEditable = MarkdownEditable

	# construction
	window.editor = new Editor [
		'InlineEditable',
		'DateEditable',
		#'MarkdownEditable'
	]
			