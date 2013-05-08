"use strict"

do ($ = jQuery) ->

	class Editor
		_contentTypes = {}
		_components = {}
		events = {}

		attr:
			namespace: 'editor-'
			type: 'type'
			name: 'name'
			options: 'options'
		
		constructor: (components) ->
			$.map components, (component) =>
				addComponent component

			init.call @

		getAttr: (name) ->
			if @attr[name] then @attr.namespace + @attr[name] else false


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

		###
		 # @private
		###
		init = ->
			$('[data-' + @getAttr('type') + ']').each (i, el) =>
				$el = $ el
				contentType = $el.data @getAttr('type')

				if -1 isnt $.inArray(contentType, Object.keys(_contentTypes))
					component = getComponentByContentType.call @, contentType
					#component.setElement $el
					$el.data 'editor-component-id', component.id
					component.init $el


		###
		 # registers a new component
		 #
		 # @private
		 # @param [string] name
		###
		addComponent = (name) ->
			if not window.editorComponents[name]
				throw new ReferenceError "The Component '#{name}' doesn't exists. Maybe you forgot to add it to the global 'window.editorComponents' namespace?"

			console.log 'add Component: ' + name
			component = new window.editorComponents[name](@)
			$.map component.contentTypes, (type) =>
				addContentType type, name

		###
		 # @private
		###
		getComponentByContentType = (type) ->
			lowerType = type.toLowerCase()
			componentName = _contentTypes[lowerType]
			
			return if componentName then createComponent.call @, componentName else null

		###
		 # @private
		###
		createComponent = (name) ->
			if window.editorComponents[name]
				component = new window.editorComponents[name](@)
				_components[component.id] = component
				return component

			else
				return null

		getComponent: (id) ->
			if _components[id] then _components[id] else null

		getComponents: ->
			_components


		###
		 #
		 # @private
		 #
		 # @param [string] content type
		 # @param [string] component name
		###
		addContentType = (type, componentName) ->
			lowerType = type.toLowerCase()
			if _contentTypes[lowerType]
				throw new Error 'Another Component (' + _contentTypes[lowerType] + ') is already handling the content-type "' + type + '"'
			else
				_contentTypes[lowerType] = componentName


		save: ->
			console.log 'save state!!'
			@trigger 'saved'



	###
	 # Abstract Editable Class
	 # 
	 # @param [Editor] editor
	###
	class Editable 

		_value: null
		_options: {}
		_dataName: ''

		contentTypes: []

		constructor: (@editor) ->
			@name = @.constructor.name.toLowerCase()
			@setValue @name

			# generate a unique id @link http://stackoverflow.com/a/2117523/520544
			@id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace /[xy]/g, (c) ->
				r = Math.random() * 16 | 0
				v = (if c is "x" then r else (r & 0x3 | 0x8))
				v.toString 16

			if @.constructor.name is 'Editable'
				throw new ReferenceError '"Editable" is an abstract class. Please use one of the subclasses instead.'

		# kick off your stuff from here!
		init: (@element) ->
			@setDataName element.data @editor.getAttr('name') 
			@setOptions element.data @editor.getAttr('options')

			console.log @getDataName()
			#console.warn 'subclass this method to run your custom code'

		###
		 # returns a namespaced event name
		 # 
		 # @param [string] event name
		 # @return string
		###
		getEventName = (name) ->
			name = if -1 isnt name.indexOf '.' then name else @name + '.' + name

		trigger: (name, eventData = {}) ->
			eventData['senderId'] = @id
			name = getEventName name
			@editor.trigger name, eventData

		on: (name, callback) ->
			name = getEventName name
			@editor.on name, callback

		off: (name, callback) ->
			name = getEventName name
			@editor.off name, callback

		# --- 
		
		setValue: (value) ->
			@_value = value
			@render()

		getValue: ->
			@_value

		# --- 
		
		setDataName: (@_dataName) ->
		setOptions: (@_options) ->

		# ---

		getDataName: ->
			@_dataName

		getOptions: ->
			@_options

		render: ->
			if @element
				@element.html @getValue()



	###
	 # Abstract Popover Class
	###
	class PopoverEditable extends Editable

		_popoverContent: ''

		constructor: (@editor) ->
			if @.constructor.name is 'PopoverEditable'
				throw new ReferenceError '"PopoverEditable" is an abstract class. Please use one of the subclasses instead.'

			super editor

		init: (element) ->
			super element

			element.qtip
				content: 
					text: =>
						@getPopoverContent()
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

		getPopoverContent: ->
			types = @contentTypes.join ', '
			return if @_popoverContent then @_popoverContent else "<h1>#{types} Editor</h1>"

		###
		 # @todo: update current popover content
		###
		setPopoverContent: (value) ->
			@_popoverContent = value


	# ! --- Editable Sub-Classes ---

	###
	 #
	###
	class InlineEditable extends Editable

		contentTypes: ['inline']

		init: (element) ->
			super element

			element
				.attr('contenteditable', true)
				.on 'click focus', =>
					@trigger 'editor.closepopovers'


	###
	 # Date Component
	###
	class DateEditable extends PopoverEditable

		contentTypes: ['date']

		format: 'Y'

		init: (element) ->
			super element

			@setPopoverContent $('<input type="text">')


	###
	 # Markdown Component
	###
	class MarkdownEditable extends PopoverEditable

		contentTypes: ['markdown']
		markdown: null

		init: (element) ->
			super element

			element
				#.attr('contenteditable', true)
				.on('focus', =>
					@trigger 'editor.closepopovers'
				)
				###
				.on 'blur', =>
					@close()
				###
			$text = $ '<textarea>',
				'class': 'preview'

			$text.val(element.text())

			$preview = $ '<div>', 
				'class': 'preview'

			@setPopoverContent $text

			@markdown = new JJMarkdownEditor $text,
				preview : element
				contentGetter: 'val'
			

		open: ->
			super()



	# ! --- Implementation --------------------------------


	# publish base
	window.editorComponents = {}

	window.editorComponents.Editable = Editable
	window.editorComponents.PopoverEditable = PopoverEditable


	# publish sub classes	
	window.editorComponents.InlineEditable = InlineEditable
	window.editorComponents.DateEditable = DateEditable
	window.editorComponents.MarkdownEditable = MarkdownEditable

	# construction
	
	# init file transfer
	jQuery.event.props.push 'dataTransfer'
	# disable drag'n'drop for whole document
	
	$(document).on 'dragover drop', (e) ->
		e.preventDefault()

	window.editor = new Editor [
		'InlineEditable'
		'DateEditable'
		'MarkdownEditable'
	]

			