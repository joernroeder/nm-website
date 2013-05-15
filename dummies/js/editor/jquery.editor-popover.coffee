"use strict"

do ($ = jQuery) ->

	class JJEditor
		_contentTypes = {}
		_components = {}
		events = {}

		attr:
			_namespace: 'editor-'
			type: 'type'
			name: 'name'
			scope: 'scope'
			options: 'options'
		
		constructor: (components) ->
			$.map components, (component) =>
				addComponent component

			init.call @

		getAttr: (name) ->
			if @attr[name] then @attr._namespace + @attr[name] else false


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
			if name.indexOf ':' isnt -1
				console.group 'EDITOR: trigger ' + name
				console.log eventData
				console.groupEnd()

			if events[name] then events[name].fire eventData

		triggerScope: (type, scope, eventData) ->
			return ''

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
	class JJEditable 

		_prevValue: ''
		_value: ''
		_options: {}
		_dataName: ''
		_dataFullName: ''

		contentTypes: []

		extractName: (o) ->
			oo = {}
			for k of o
				t = oo
				parts = k.split(".")
				key = parts.pop()
				while parts.length
					part = parts.shift()
					t = t[part] = t[part] or {}
				t[key] = o[k]
			oo

		constructor: (@editor) ->
			@name = @.constructor.name.toLowerCase()
			#@setValue @name

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

			#obj = {}
			#obj[@getDataFullName()] = @getValue()

			#console.log @extractName(obj)
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
			#console.log name
			@editor.trigger name, eventData

		triggerScopeEvent: (type, eventData = {}) ->
			eventData['name'] = @getDataName()
			eventData['senderId'] = @id
			@editor.trigger type + ':' + @getDataScope(), eventData

		triggerDataEvent: (type, eventData = {}) ->
			eventData['senderId'] = @id
			@editor.trigger type + ':' + @getDataFullName(), eventData

		on: (name, callback) ->
			name = getEventName name
			@editor.on name, callback

		off: (name, callback) ->
			name = getEventName name
			@editor.off name, callback

		# --- 
		
		setValue: (value) ->
			if @_prevValue is value then return
				
			@_prevValue = @_value
			@_value = value
			@triggerScopeEvent 'change',
				value: @_value
				prevValue: @_prevValue
			@triggerDataEvent 'change', 
				value		: @_value
				prevValue	: @_prevValue

			@render()

		getValue: ->
			@_value

		updateValue: ->
			@setValue @getValueFromContent()

		getValueFromContent: ->
			return ''

		# --- 
		
		setDataName: (dataName) ->
			getName = (dataName) ->
				dataName.split('.').slice(-1)[0]

			getNamespace = (dataName) ->
				start = if dataName[0] is '\\' then 1 else 0
				dataName.slice start, dataName.lastIndexOf('.')

			getElementScope = =>
				scopeDataName = @editor.getAttr 'scope'
				cleanUpScopeName = (name) ->
					if name[0] is '\\' then name.slice 1 else name
				crawlDom = ($el, currentScope) ->
					$scopeEl = $el.closest "[data-#{scopeDataName}]"
					if $scopeEl.length
						scopeName = $scopeEl.data scopeDataName
						currentScope = scopeName + currentScope

						if scopeName[0] isnt '\\'
							currentScope = crawlDom $scopeEl.parent(), '.' + currentScope
						else 
							return cleanUpScopeName currentScope
					# found a complete stack
					else if currentScope[0] is '\\'
						return cleanUpScopeName currentScope

					# couldn't find a complete stack
					else
						throw new Error "Couldn't find a complete scope for #{getName(dataName)}. Maybe you forgot to add a Backslash at the beginning of your stack? \Foo.Bar.FooBar"

				crawlDom @element, ''

			# ---

			if not dataName
				throw new Error 'Please add a data-' + @editor.getAttr('name') + ' attribute'

			console.log 'setDataName: ' + dataName

			if dataName[0] is '\\' 
				scope = getNamespace dataName# else getElementScope() + getNamespace
			else
				scope = getElementScope()

			name = getName dataName
			@_dataScope = scope
			@_dataName = name

		setOptions: (@_options) ->

		# ---

		getDataScope: ->
			@_dataScope

		getDataFullName: ->
			"#{@_dataScope}.#{@_dataName}"

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
	class JJPopoverEditable extends JJEditable

		_popoverContent: ''

		constructor: (@editor) ->
			if @.constructor.name is 'PopoverEditable'
				throw new ReferenceError '"PopoverEditable" is an abstract class. Please use one of the subclasses instead.'

			super editor

		init: (element) ->
			super element

			#console.log @getDataName()

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

		#getValueFromContent: ->

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
	class InlineEditable extends JJEditable

		contentTypes: ['inline']

		init: (element) ->
			super element

			element
				.attr('contenteditable', true)
				.on('keyup', (e) =>
					@updateValue()
				)
				.on 'click focus', =>
					@trigger 'editor.closepopovers'

		getValueFromContent: ->
			@element.text()


	###
	 # Date Component
	###
	class DateEditable extends JJPopoverEditable

		contentTypes: ['date']

		format: 'Y'

		init: (element) ->
			super element

			$input = $ '<input type="text">'
			$input.on 'keyup', (e) =>
				@updateValue()

			@setPopoverContent $input

		getValueFromContent: ->
			@element.val()


	###
	 # Markdown Component
	###
	class MarkdownEditable extends JJPopoverEditable

		contentTypes: ['markdown']
		markdown: null
		markdownChangeTimeout: null

		previewClass: 'preview'

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
				'class': @previewClass

			$text.val(element.text())

			$preview = $ '<div>', 
				'class': @previewClass

			@setPopoverContent $text

			@markdown = new JJMarkdownEditor $text,
				preview : element
				contentGetter: 'val'
				onChange: (val) =>
					if @markdownChangeTimeout
						clearTimeout @markdownChangeTimeout

					@markdownChangeTimeout = setTimeout =>
						@setValue val
					, 1000

			

		open: ->
			super()


	class SplitMarkdownEditable extends MarkdownEditable
		
		contentTypes: ['markdown-split']
		
		previewClass: 'preview split'



	# ! --- Implementation --------------------------------


	# publish base
	window.editorComponents = {}

	window.editorComponents.JJEditable = JJEditable
	window.editorComponents.JJPopoverEditable = JJPopoverEditable


	# publish sub classes	
	window.editorComponents.InlineEditable = InlineEditable
	window.editorComponents.DateEditable = DateEditable
	window.editorComponents.MarkdownEditable = MarkdownEditable
	window.editorComponents.SplitMarkdownEditable = SplitMarkdownEditable

	# construction
	
	# init file transfer
	jQuery.event.props.push 'dataTransfer'
	# disable drag'n'drop for whole document
	
	$(document).on 'dragover drop', (e) ->
		e.preventDefault()

	editor = new JJEditor [
		'InlineEditable'
		'DateEditable'
		'MarkdownEditable',
		'SplitMarkdownEditable'
	]

	editor.on 'change:My.Fucki.Image', (e) ->
		console.log "changed #{e.name} from #{e.prevValue} to #{e.value}"

	editor.on 'change:My.Fucki.Image.Title', (e) ->
		console.log "changed Image.Title from #{e.prevValue} to #{e.value}"





	window.editor = editor



			