"use strict"

###
 # --- jQuery outer-click Plugin --------------------------
 # 
 # @see https://gist.github.com/kkosuge/3669605
 # 
 #  指定した要素以外のクリックでイベントを発火させる
 #  例： $("#notification-list").outerClick(function (event) { ... });
###
(($, elements, OUTER_CLICK) ->
  check = (event) ->
    i = 0
    l = elements.length
    target = event.target
    el = undefined

    while i < l
      el = elements[i]
      $.event.trigger OUTER_CLICK, event, el  if el isnt target and not ((if el.contains then el.contains(target) else (if el.compareDocumentPosition then el.compareDocumentPosition(target) & 16 else 1)))
      i++
  $.event.special[OUTER_CLICK] =
    setup: ->
      i = elements.length
      $.event.add document, "click", check  unless i
      elements[i] = this  if $.inArray(this, elements) < 0

    teardown: ->
      i = $.inArray(this, elements)
      if i >= 0
        elements.splice i, 1
        jQuery(this).unbind "click", check  unless elements.length

  $.fn[OUTER_CLICK] = (fn) ->
    (if fn then @bind(OUTER_CLICK, fn) else @trigger(OUTER_CLICK))
) jQuery, [], "outerClick"



# =========================================================


do ($ = jQuery) ->

	# ! --- jQuery Helper Methods -------------------------
	
	###
	 # select ranges within input fields
	 #
	 # @param int start
	 # @param int end
	###
	$.fn.selectRange = (start, end) ->
		end = start unless end
		@each ->
			if @setSelectionRange
				@focus()
				@setSelectionRange start, end
			else if @createTextRange
				range = @createTextRange()
				range.collapse true
				range.moveEnd "character", end
				range.moveStart "character", start
				range.select()


	# ! --- JJEditor --------------------------------------

	class JJEditor
		_contentTypes = {}
		_components = {}
		_storage = {}
		_events = {}

		debug: true

		attr:
			_namespace: 'editor-'
			type: 'type'
			name: 'name'
			scope: 'scope'
			placeholder: 'placeholder'
			options: 'options'
			handledBy: 'handled-by'
			componentId: 'component-id'
		
		constructor: (scope, components) ->
			if components is undefined
				components = scope
				scope = $ document

			@scope = if scope instanceof jQuery then scope else $ scope

			console.group 'EDITOR: add Components' if @debug
			$.map components, (component) =>
				console.log '- ' + component if @debug
				addComponent component
			
			console.groupEnd() if @debug

			# global bindings
			@.on 'change:\\', (e) =>
				@updateState e.fullName, e.value

			@.on 'editor.removeComponent', (e) =>
				console.log '@todo: remove component from state' if @debug
				console.log @.getState() if @debug
				#console.log e

			# create component instances
			@updateElements()

		getAttr: (name) ->
			if @attr[name] then @attr._namespace + @attr[name] else false


		###
		 # on, off, trigger via $.Callbacks() 
		 #
		 # @see http://stackoverflow.com/questions/9099555/jquery-bind-events-on-plain-javascript-objects
		###
		on: (name, callback) ->
			if not _events[name]
				_events[name] = $.Callbacks 'unique'

			_events[name].add callback

		off: (name, callback) ->
			if not _events[name] then return
			_events[name].remove callback

		trigger: (name, eventData) ->
			if @debug and name.indexOf ':' isnt -1
				console.group 'EDITOR: trigger ' + name
				#console.log eventData
				#console.groupEnd()

			if _events[name] then _events[name].fire eventData

		extractScope: (o) ->
			oo = {}
			t = undefined
			parts = undefined
			part = undefined
			
			for k of o
				t = oo
				parts = k.split(".")
				key = parts.pop()
				while parts.length
					part = parts.shift()
					t = t[part] = t[part] or {}
				t[key] = o[k]
			oo

		updateState: (scope, value) ->
			console.group 'EDITOR: update state' if @debug
			console.log 'scope: %s -> %O', scope, value if @debug

			obj = {}
			obj[scope] = value
			_storage = $.extend _storage, @extractScope(obj)

			console.log _storage if @debug
			console.groupEnd() if @debug

		getState: ->
			_storage


		# --- Dynamic Elements ----------------------------
		
		###
		 # adds a new component with the settings of the DOM element to the editor.
		 #
		 # @param $el jQuery element
		 #
		 # @return JJEditable
		###
		addElement: ($el) ->
			contentType = $el.data @getAttr('type')
			component = false

			if $el.attr @getAttr('handledBy')
				console.log 'already handled by the editor!'
				return component

			if -1 isnt $.inArray(contentType, Object.keys(_contentTypes))
				component = getComponentByContentType.call @, contentType

				$el.data @getAttr('componentId'), component.id
				component.init $el	
				console.log 'added element: %s', component.getDataFullName() if @debug

			component

		###
		 # removes the component instance associated with the given element
		###
		removeElement: ($el) ->
			console.group 'EDITOR: remove component' if @debug
			componentId = $el.data @getAttr('componentId')
			component = @getComponent componentId
			
			if component
				destroyComponent.call @, component
				console.groupEnd() if @debug
				return true

			false

		###
		 # removes an element by scope
		 #
		 # @example editor.removeElementByScope('Foo.Bar.Title');
		###
		removeElementByScope: (fullName) ->
			components = @getComponents()
			removed = false

			console.group 'EDITOR: remove component by scope: %s', fullName if @debug
			for i, component of components
				if fullName is component.getDataFullName()
					destroyComponent.call @, component
					removed = true

			console.groupEnd() if @debug
			removed

		###
		 # remove elements by scope
		 #
		 # @example editor.removeElementsByScope('Foo.Bar');
		 # @example editor.removeElementsByScope('Foo.Bar', ['Title, Description']);
		###
		removeElementsByScope: (scope, names = []) ->
			components = @getComponents()			
			removed = false

			all = true unless names.length

			console.group 'EDITOR: remove components by scope: %s, names: %O', scope, names if @debug
			for i, component of components
				if scope is component.getDataScope()
					if all or -1 isnt $.inArray(component.getDataName(), names)
						destroyComponent.call @, component
						removed = true

			console.groupEnd() if @debug
			removed

		###
		 # syncs the editor components with the current DOM-Structure
		###
		updateElements: ->
			handledBy = @getAttr 'handledBy'
			console.group 'EDITOR: update Elements' if @debug

			# check for new elements
			$('[data-' + @getAttr('type') + ']', @scope).each (i, el) =>
				$el = $ el
				if not $el.attr handledBy
					@addElement $el

			# check for removed elements
			for id, component of @getComponents()
				if not component.elementExists()
					destroyComponent.call @, component

			console.groupEnd() if @debug

			null

		###
		 # removes all component bindings and destroys the editor.
		###
		detroy: ->
			console.log 'going to destroy the editor and remove all'

			# destroy components
			for id, component of @getComponents()
				destroyComponent.call @, component

			# remove bindings
			@.off()

			for name, callbacks of _events
				callbacks.disable()
				callbacks.empty()

			false


		# --- Private Methods -----------------------------

		###
		 # registers a new component
		 #
		 # @private
		 # @param [string] name
		###
		addComponent = (name) ->
			if not window.editorComponents[name]
				throw new ReferenceError "The Component '#{name}' doesn't exists. Maybe you forgot to add it to the global 'window.editorComponents' namespace?"

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

		###
		 # @private
		 #
		###
		destroyComponent = (component) ->
			id = component.getId()
			console.log 'EDITOR: destroy component %s', component.getDataFullName() if @debug
			component.destroy()
			_components[id] = null
			delete _components[id]

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



	# end of JJEditor class -------------------------------


	###
	 # Abstract Editable Class
	 #
	 # @param [Editor] editor
	 # 
	 #
	 # Custom event names can be easily created and destroyed with the 'getNamespacedEventName' function
	 # @example
	 # 		$foo.on(this.getNamespacedEventName('click'), function() {
	 #			console.log('clicked');
	 #		});
	 #
	 #		$foo.off(this.getNamespacedEventName('click'));
	 #
	###
	class JJEditable 

		_prevValue: ''
		_value: ''
		_options: {}
		_dataName: ''
		_dataFullName: ''

		contentTypes: []

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
			element.attr @editor.getAttr('handledBy'), @id

			@updateValue true

		###
		 # returns a namespaced event name
		 # 
		 # @param [string] event name
		 # @return string
		###
		getEventName = (name) ->
			name = if -1 isnt name.indexOf '.' then name else @name + '.' + name
			
		# add component id to the event name
		getNamespacedEventName: (name) ->
			names = name.split ' '
			eventNames = []

			for n in names
				eventNames.push "#{n}.#{@id}"

			eventNames.join ' '

		trigger: (name, eventData = {}) ->
			eventData['senderId'] = @id
			name = getEventName.call @, name
			@editor.trigger name, eventData

		triggerScopeEvent: (type, eventData = {}) ->
			scope = @getDataScope()
			scope
			$.extend eventData, 
				name: @getDataName()
				scope: scope
				fullName: @getDataFullName()
				senderId: @id
			
			scopeNames = scope.split('.')

			# add global scope
			scopeNames.unshift '\\'

			# crawl down the scope and fire events
			for i, scopeName of scopeNames
				prefix = scopeNames.slice(0, i).join '.'
				prefix += '.' if prefix
				currScope = prefix + scopeName

				currScope = currScope.replace '\\.', ''

				# trigger
				@editor.trigger type + ':' + currScope, eventData

		triggerDataEvent: (type, eventData = {}) ->
			eventData['senderId'] = @id
			@editor.trigger type + ':' + @getDataFullName(), eventData

		on: (name, callback) ->
			name = getEventName.call @, name
			name = @getNamespacedEventName name
			@editor.on name, callback unless @editor

		off: (name, callback) ->
			name = getEventName.call @, name
			name = @getNamespacedEventName name
			@editor.off name, callback unless @editor

		# --- 
		
		getElement: ->
			@element

		###
		 # returns true if the element is still present in the documents DOM
		 # @see http://stackoverflow.com/a/4040848/520544
		 #
		 # @return boolean
		###
		elementExists: ->
			@element.closest('body').length > 0
		
		getId: ->
			@id

		###
		 # sets the value of the component
		 #
		 # @param [object] value
		 # @param [boolean] silent
		###
		setValue: (value, silent) ->
			if not silent and @_prevValue is value then return
				
			@_prevValue = @_value
			@_value = value

			#console.log 'set value silent: %s', silent
			if silent
				@editor.updateState @getDataFullName(), @_value
			else
				@triggerScopeEvent 'change',
					value: @_value
					prevValue: @_prevValue

				@triggerDataEvent 'change', 
					value		: @_value
					prevValue	: @_prevValue

				if typeof value is 'string'
					@render()

			true

		getValue: ->
			@_value

		###
		 # use this method if you're going bind an element property to the component value.
		 #
		 # @use DateEditable.updateValue as an example
		 #
		###
		updateValue: (silent) ->
			@setValue @getValueFromContent(), silent

		getValueFromContent: ->
			null

		getPlaceholder: ->
			placeholder = @element.attr @editor.getAttr 'placeholder'
			if placeholder then placeholder else 'PLACEHOLDER'

		getValueOrPlaceholder: ->
			value = @getValue()
			console.log 'value or placeholder: ' + value
			return if value then value else @getPlaceholder()

		# --- 
		
		setDataName: (dataName) ->
			getName = (dataName) ->
				dataName.split('.').slice(-1)[0]

			getNamespace = (dataName) ->
				prefix = '.'
				if dataName[0] is '\\'
					prefix = ''
					dataName = dataName.slice 1

				if dataName.lastIndexOf('.') isnt -1
					return prefix + dataName.slice 0, dataName.lastIndexOf('.')
				else
					return ''

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

				crawlDom @element, getNamespace(dataName)

			# ---

			if not dataName
				throw new Error 'Please add a data-' + @editor.getAttr('name') + ' attribute'

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
				@element.html @getValueOrPlaceholder()

		# ---
		
		destroy: ->
			@element.removeAttr @editor.getAttr('handledBy')

			@trigger 'editor.removeComponent', @.getDataFullName()

			#remove all event on the editor bound by this component
			@editor.off @getNamespacedEventName('editor')

			@editor = null



	###
	 # Abstract Popover Class
	###
	class JJPopoverEditable extends JJEditable

		_popoverContent: ''
		popoverClasses: []

		closeOnOuterClick: true
		
		position:
			at: 'right center'
			my: 'left center'

		constructor: (@editor) ->
			if @.constructor.name is 'PopoverEditable'
				throw new ReferenceError '"PopoverEditable" is an abstract class. Please use one of the subclasses instead.'

			super editor

		init: (element) ->
			super element

			#@.setValue element.html(), 

			element.qtip
				events:
					visible: (event, api) =>
						# set cursor to the end of the first input or textarea element
						$input = $('input, textarea', @api.tooltip).eq 0
						$input.selectRange $input.val().length

						# bind outer click to close the popup
						if @closeOnOuterClick
							@api.tooltip.one @getNamespacedEventName('outerClick'), =>
								@close()

						@
				
				content: 
					text: =>
						@getPopoverContent()
					title: ''

				position:
					at: @position.at
					my: @position.my
				
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
					classes: @getPopOverClasses()
					tip:
						width: 20
						height: 10

			@api = element.qtip 'api'

			@on 'editor.closepopovers', (eventData) =>
				if eventData.senderId isnt @id
					@close()

			element.on @getNamespacedEventName('click'), =>
				@toggle()

		getValueFromContent: ->
			@element.html()

		open: ->
			@element.addClass 'active'
			@trigger 'editor.closepopovers'
			@api.show()

		close: ->
			@element.removeClass 'active'
			@api.tooltip.unbind @getNamespacedEventName('outerClick')
			@api.hide()

		toggle: ->
			if @api.tooltip and $(@api.tooltip).hasClass('qtip-focus')
				@close()
			else
				@open()

		getPopOverClasses: ->
			(['editor-popover']).concat([@name], @popoverClasses).join ' '

		getPopoverContent: ->
			types = @contentTypes.join ', '
			return if @_popoverContent then @_popoverContent else "<h1>#{types} Editor</h1>"

		###
		 # @todo: update current popover content
		###
		setPopoverContent: (value) ->
			@_popoverContent = value

		destroy: ->
			@api.tooltip.unbind @getNamespacedEventName('outerClick')
			@element.off @getNamespacedEventName('click')

			super()


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
				.on(@getNamespacedEventName('keyup'), (e) =>
					@updateValue()
				)
				.on @getNamespacedEventName('click focus'), =>
					@trigger 'editor.closepopovers'

		getValueFromContent: ->
			@element.text()

		destroy: ->
			@element.removeAttr('contenteditable')
			@element.off @getNamespacedEventName('keyup click focus')

			super()


	###
	 # Date Component
	###
	class DateEditable extends JJPopoverEditable

		contentTypes: ['date']
		
		position:
			at: 'top left'
			my: 'bottom left'

		format: 'Y'

		init: (element) ->
			@$input = $ '<input type="text">'

			super element

			@$input.on @getNamespacedEventName('keyup'), (e) =>
				@updateValue()

			@setPopoverContent @.$input

		getValueFromContent: ->
			@$input.val()

		destroy: ->
			@$input.off @getNamespacedEventName('keyup')

			super()


	###
	 # Markdown Component
	###
	class MarkdownEditable extends JJPopoverEditable

		contentTypes: ['markdown']
		markdown: null
		markdownChangeTimeout: null

		previewClass: 'preview'
		popoverClasses: ['markdown']

		init: (element) ->
			super element

			element
				.on @getNamespacedEventName('focus'), =>
					@trigger 'editor.closepopovers'
				
			$text = $ '<textarea>',
				'class': @previewClass

			$text.val element.text()
			###
			 # @todo set silent value
			@setValue
				images: {}
				raw: $text.val()
			###

			$preview = $ '<div>', 
				'class': @previewClass

			@setPopoverContent $text

			# @todo fix initial change trigger!
			initialTriggerDone = false
			@markdown = new JJMarkdownEditor $text,
				preview : element
				contentGetter: 'val'
				onChange: (val) =>
					# dirty fix
					if not initialTriggerDone
						initialTriggerDone = true
						return

					console.log 'markdown changed'
					if @markdownChangeTimeout
						clearTimeout @markdownChangeTimeout

					@markdownChangeTimeout = setTimeout =>
						@setValue val
						if not val.raw
							@element.html @getPlaceholder()
					, 500
		
		destroy: ->
			@element.off @getNamespacedEventName('focus')
			@markdown.cleanup()
			@markdown = null

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
		console.log "changed '#{e.name}' within #{e.scope} from #{e.prevValue} to #{e.value}"

	editor.on 'change:My.Fucki.Image.Test', (e) ->
		console.log "changed Test from #{e.prevValue} to #{e.value}"

	window.$test = $test = $ '<h1 data-editor-type="inline" data-editor-name="\My.Fucki.Image.TestTitle">FooBar</h1>'
	$('.overview').prepend $test
	editor.updateElements()

	###
	testComponent = editor.addElement $test
	console.log testComponent
	console.log testComponent.getId()
	###

	# remove element from editor
	
	#$('[data-editor-name="Title"]').remove()
	#editor.updateElements()
	
	#editor.removeElement $('[data-editor-name="Title"]')
	#editor.removeElementsByScope 'Person'

	
	window.editor = editor



			