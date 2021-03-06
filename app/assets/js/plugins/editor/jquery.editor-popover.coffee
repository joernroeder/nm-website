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
	$.fn._selectRange = (start, end) ->
		end = start unless end
		@each ->
			if @['setSelectionRange']
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
		members: ->
			@_contentTypes	= {}
			@_components	= {}
			@_storage		= {}
			@_events		= {}

			@debug = false

			@attr =
				_namespace: 'editor-'
				type: 'type'
				name: 'name'
				scope: 'scope'
				placeholder: 'placeholder'
				options: 'options'
				handledBy: 'handled-by'
				componentId: 'component-id'

		constructor: (scope, components) ->
			@members()

			if components is undefined
				components = scope
				scope = $ document

			@scope = if scope instanceof jQuery then scope else $ scope

			console.group 'EDITOR: add Components' if @debug
			$.map components, (component) =>
				console.log '- ' + component if @debug
				addComponent.call @, component
			
			console.groupEnd() if @debug

			# global bindings
			@.on 'change:\\', (e) =>
				@updateState e.fullName, e.value, false, e.replace

			@.on 'editor.removeComponent', (fullName) =>
				@updateState fullName, null, false, true

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
			if not @_events[name]
				@_events[name] = $.Callbacks 'unique'

			@_events[name].add callback

		off: (name, callback) ->
			if not @_events[name] then return
			@_events[name].remove callback

		trigger: (name, eventData) ->
			if  @debug and name.indexOf ':' isnt -1
				console.group 'EDITOR: trigger ' + name
				console.log eventData
				console.groupEnd()

			if @_events[name] then @_events[name].fire eventData

		updateState: (scope, value, silent, replace) ->
			console.group 'EDITOR: update state' if @debug
			console.log 'scope: %s -> %O', scope, value if @debug

			replaced = false

			if replace
				scopeParts = scope.split '.'
				name = scopeParts.splice(-1)[0]				
				tmp = @_storage

				for i in scopeParts
					break if not tmp[i]
					tmp = tmp[i]
			
				if tmp[name]
					tmp[name] = value
					replaced = true
			
			if not replaced
				obj = {}
				obj[scope] = value
				@_storage = $.extend true, @_storage, extractScope.call(@, obj)

			#@_storage = trimObject.call @, @_storage

			console.log @_storage if @debug
			console.groupEnd() if @debug

			if not silent
				console.log @_storage if @debug
				console.log @getState() if @debug
				@trigger 'stateUpdate', @_storage

		getState: ->
			@_storage


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
				console.log 'already handled by the editor!' if @debug
				return component

			if -1 isnt $.inArray(contentType, Object.keys(@_contentTypes))
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
		destroy: ->
			console.log 'going to destroy the editor and remove all' if @debug

			# remove bindings
			@.off()

			for name, callbacks of @_events
				callbacks.disable()
				callbacks.empty()

			# destroy components
			for id, component of @getComponents()
				destroyComponent.call @, component

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
				addContentType.call @, type, name
			
		###
		 # @private
		###
		getComponentByContentType = (type) ->
			lowerType = type.toLowerCase()
			componentName = @_contentTypes[lowerType]
			
			return if componentName then createComponent.call @, componentName else null

		###
		 # @private
		###
		createComponent = (name) ->
			if window.editorComponents[name]
				component = new window.editorComponents[name](@)
				component.name = name.toLowerCase()
				@_components[component.id] = component
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
			@_components[id] = null
			$.map component.contentTypes, (type) =>
				if @_contentTypes[type]
					delete @_contentTypes[type]
			
			delete @_components[id]

		getComponent: (id) ->
			if @_components[id] then @_components[id] else null

		getComponents: ->
			@_components

		###
		 # returns an array with all components from the given className
		 #
		 # @param [string] type
		 #
		 # @return array
		###
		getComponentsByClassName: (className) ->
			components = @getComponents()
			results = []

			for id, component of components
				if component.name is className
					results.push component

			results

		###
		 # returns an array with all components from the given type
		 #
		 # @param [string] type
		 #
		 # @return array
		###
		getComponentsByType: (type) ->
			components = @getComponents()
			results = []

			for id, component of components
				if -1 isnt $.inArray type.toLowerCase(), component.contentTypes
					results.push component

			results

		###
		 # returns a Editor-Component by name
		 #
		 # @param [string] fullName
		 #
		 # @return JJEditable
		###
		getComponentByName: (fullName) ->
			components = @getComponents()

			for id, component of components
				if component.getDataFullName() is fullName
					return component

			null	


		###
		 #
		 # @private
		 #
		 # @param [string] content type
		 # @param [string] component name
		###
		addContentType = (type, componentName) ->
			lowerType = type.toLowerCase()
			if @_contentTypes[lowerType]
				console.error 'Another Component (' + @_contentTypes[lowerType] + ') is already handling the content-type "' + type + '"'
			else
				@_contentTypes[lowerType] = componentName

		###
		 #
		 # @private
		 #
		 # @param [object] Object
		###
		trimObject = (obj) ->
			for key, value of obj
				if typeof value is 'object'
					value = trimObject value

				if value is null or value is undefined or $.isEmptyObject obj[key]
					delete obj[key]

			obj

		###
		 # keys with dot syntax are divided into multi-dimensional objects.
		 #
		 # @private
		 #
		 # @param [object] Object
		 #
		###
		extractScope = (o) ->
			oo = {}
			t = undefined
			parts = undefined
			part = undefined
			
			for k of o
				t = oo
				parts = k.split '.'
				key = parts.pop()
				while parts.length
					part = parts.shift()
					t = t[part] = t[part] or {}
				t[key] = o[k]
			oo



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

		members: ->
			@_prevValue = ''
			@_value = ''
			@_options = {}
			@_dataName = ''
			@_dataFullName = ''

			@contentTypes = []
			@name = ''


		constructor: (@editor) ->
			@members()


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
			if not @element 
				console.log 'JJEditabel: no element found.'
				return

			@setDataName element.data(@editor.getAttr('name'))
			@updateOptions element.data(@editor.getAttr('options')), true
			element.attr @editor.getAttr('handledBy'), @id

			if @_options.elementClasses
				element.addClass @_options.elementClasses

			@updateValue true
			val = @getValue()

			if val and @isValidValue val
				@setValueToContent val
			else
				@setValueToContent @getPlaceholder(), true

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
		setValue: (value, silent, replace) ->
			if not silent and @_prevValue is value then return
			
			@_prevValue = @_value
			@_value = value

			#console.log 'set value silent: %s', silent
			if silent
				@editor.updateState @getDataFullName(), @getValue(), silent, replace
			else
				prevVal = @getPrevValue()
				val = @getValue()

				@triggerScopeEvent 'change',
					value		: val
					prevValue	: prevVal
					replace		: replace

				@triggerDataEvent 'change', 
					value		: val
					prevValue	: prevVal
					replace		: replace

				if typeof value is 'string'
					@render()

			true

		getValue: ->
			@_value

		getPrevValue: ->
			@_prevValue

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

		setValueToContent: (val, isPlaceholder) ->

		isValidValue: (val) ->
			return if val then true else false

		# ---
		
		getPlaceholder: ->
			placeholder = @element.data @editor.getAttr('placeholder')
			return if placeholder then placeholder else @getDataName()

		getValueOrPlaceholder: ->
			value = @getValue()
			console.log 'value or placeholder: ' + value if @debug
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

		# ---

		getDataScope: ->
			@_dataScope

		getDataFullName: ->
			"#{@_dataScope}.#{@_dataName}"

		getDataName: ->
			@_dataName

		# ---
		
		getOptions: ->
			@_options

		updateOptions: (options, silent) ->
			@_options = $.extend true, @_options, options
			@onOptionsUpdate() if not silent

		onOptionsUpdate: ->


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
	 
	 # @options:
	 #	repositionOnChange: true/false auto update popover position
	###
	class JJPopoverEditable extends JJEditable

		members: ->
			super()
			
			@_popoverContent = ''
			@popoverClasses = []

			@closeOnOuterClick = true
			@repositionOnChangeTimeout = null
		
		constructor: (@editor) ->
			if @.constructor.name is 'PopoverEditable'
				throw new ReferenceError '"PopoverEditable" is an abstract class. Please use one of the subclasses instead.'

			super editor

		init: (element) ->
			if not element
				console.log 'JJPopoverEditable: no element found.'
				return

			if not @_options.position
				@_options.position =
					at: 'right center'
					my: 'left center'

					adjust:
						x: 10
						resize: true # @todo: own resize method
						method: 'flip shift'

			@_options.repositionOnChange = true if @_options.repositionOnChange is undefined

			super element

			element.qtip
				events:
					render: (event, api) =>
						#console.log 'render'
						#pos = @getPosition()
						#console.log pos
						#for key in Object.keys(pos)
						#	api.set "position.#{key}", pos[key]
						##	console.log api.get "position.#{key}"
						#true

					visible: =>
						$input = $('input, textarea', @api.tooltip).eq 0
						# set cursor to the end of the first input or textarea element
						try 
							$input._selectRange $input.val().length
						catch e
							false

						# bind outer click to close the popup
						if @closeOnOuterClick
							@api.tooltip.one @getNamespacedEventName('outerClick'), =>
								@close()

						true

					move: (event, api) =>
						@onMove event

						true	
				content: 
					text: =>
						@getPopoverContent()
					title: ''

				position: @getPosition()

				show:
					event: false
					#ready: true

				hide: 
					event: false
					#inactive: 3000
					fixed: true

				prerender: true

				style: 
					classes: @getPopOverClasses()
					tip:
						width: 20
						height: 10

			@api = element.qtip 'api'

			@editor.on 'editor.closepopovers', (eventData) =>
				if not eventData or not eventData.senderId or eventData.senderId isnt @id
					@close()

			element.on @getNamespacedEventName('click'), (e) =>
				e.preventDefault()
				@toggle()
				false

			$(window).on @getNamespacedEventName('resize'), =>
				@updateTooltipDimensions()

			$('body').on @getNamespacedEventName('toggle.editor-sidebar'), (e) =>
				if e.name is 'opened' or e.name is 'close'
					@autoReposition()

		getValueFromContent: ->
			placeholder = @getPlaceholder()
			value = @element.html()

			return if placeholder is value then "" else value

		setValueToContent: (val, isPlaceholder) ->
			@element.html val

		onOptionsUpdate: ->
			pos = @getPosition()
			for key in Object.keys(pos)
				@element.qtip 'option', "position.#{key}", pos[key]
			

		getPosition: ->
			pos = if @_options.position then @_options.position else @position

			pos = $.extend true, pos, 
				adjust:
					screen: true
					resize: true
				viewport: $(window)

			pos

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
			dataName =  (@getDataFullName()).toLowerCase().replace '.', '-'
			(['editor-popover']).concat([@name, dataName], @popoverClasses).join ' '

		getPopoverContent: ->
			types = @contentTypes.join ', '
			return if @_popoverContent then @_popoverContent else "<input placeholder='#{types} Editor'>"

		###
		 # @todo: update current popover content
		###
		setPopoverContent: (value) ->
			@_popoverContent = value

		###
		 #
		###
		autoReposition: ->
			if not @_options.repositionOnChange then return

			if @repositionOnChangeTimeout
				clearTimeout @repositionOnChangeTimeout

			@repositionOnChangeTimeout = setTimeout =>
				console.log 'JJPopoverEditable: Popover reposition' if @debug
				@updateTooltipDimensions()
				@element.qtip 'reposition'
			, 100

			true

		onMove: (e) ->

		updateTooltipDimensions: ->

		destroy: ->
			if @api and @api.tooltip
				@api.tooltip.unbind @getNamespacedEventName('outerClick')

			@element.off @getNamespacedEventName('click')

			$('body').off @getNamespacedEventName('toggle.editor-sidebar')
			$(window).on @getNamespacedEventName('resize')

			super()


	# ! --- Editable Sub-Classes ---

	###
	 #
	###
	class InlineEditable extends JJEditable

		members: ->
			super()

			@contentTypes = ['inline']

		init: (element) ->
			super element

			element
				.attr('contenteditable', true)
				.on(@getNamespacedEventName('blur'), (e) =>
					@updateValue()
				)
				.on @getNamespacedEventName('click focus'), =>
					@trigger 'editor.closepopovers'

		getValueFromContent: ->
			@element.text()

		setValueToContent: (val, isPlaceholder) ->
			@element.html val

		destroy: ->
			@element.removeAttr('contenteditable')
			@element.off @getNamespacedEventName('keyup click focus')

			super()


	###
	 # Date Component
	###
	class DateEditable extends JJPopoverEditable

		members: ->
			super()
			
			@contentTypes = ['date']	
			@contentFormattedValue = ''

		init: (element) ->
			@$input = $ '<input type="text">'
			$datepicker = $ '<div class="datepicker">'
			$content = $('<div>')
				.append(@$input)
				.append $datepicker

			@_options.position =
					#at: 'bottom left'
					#my: 'top left'
					my: 'top right'
					at: 'top left'

					adjust:
						x: -5
						y: -18
						method: 'flip shift'

			super element

			@contentFormattedValue = @getPlaceholder()

			@$input.Zebra_DatePicker
				format: @getContentFormat()
				always_visible: $datepicker
				onChange: =>
					if @api
						@api.reposition()

				onClear: =>
					@contentFormattedValue = @getPlaceholder()
					@setValue null
					@render()

				onSelect: (format, ymd, date) =>
					@contentFormattedValue = format
					@setValue ymd
			
			@setPopoverContent $content

		updateValue: (silent) ->
			super silent

			@element.html @getValueOrPlaceholder()

		render: ->
			@element.html @contentFormattedValue

		setValueToContent: (val, isPlaceholder) ->
			if @$input.length and not isPlaceholder
				@$input.val val

		getFormat: ->
			@getOptions().format or 'Y-m-d'

		getContentFormat: ->
			@getOptions().contentFormat or @getFormat()


		destroy: ->
			@$input.off @getNamespacedEventName('keyup')

			super()


	###
	 # Markdown Component
	###
	class MarkdownEditable extends JJPopoverEditable

		members: ->
			super()

			@contentTypes = ['markdown']
			@markdown = null
			@markdownChangeTimeout = null

			@previewClass = 'preview'
			@popoverClasses = ['markdown']

		init: (element) ->
			super element

			element
				.on @getNamespacedEventName('focus'), =>
					@trigger 'editor.closepopovers'
				
			$text = $ '<textarea>',
				'class': @previewClass

			value = @getValue()
			$text.val value.raw

			$preview = $ '<div>', 
				'class': @previewClass

			@setPopoverContent $text

			
			# @todo fix initial change trigger!
			initialTriggerDone = false

			options = 
				placeholder: @getPlaceholder()
				preview : element
				contentGetter: 'val'
				onChange: (val) =>
					# dirty fix
					if not initialTriggerDone
						initialTriggerDone = true
						return

					#console.log 'markdown changed'
					if @markdownChangeTimeout
						clearTimeout @markdownChangeTimeout

					@autoReposition()

					@markdownChangeTimeout = setTimeout =>
						@setValue val
						if not val.raw
							@element.html @getPlaceholder()
					, 500
			
			$.extend options, @_options || {}
			
			@markdown = new JJMarkdownEditor $text, options

		isValidValue: (val) ->
			return if val and val.raw then true else false

		getValueFromContent: ->
			placeholder = @getPlaceholder()
			value = @element.text()
			
			return if placeholder isnt value then raw: value  else raw: ''
		
		destroy: ->
			@element.off @getNamespacedEventName('focus')
			@markdown.cleanup()
			@markdown = null

			super()


	class SplitMarkdownEditable extends MarkdownEditable
		
		members: ->
			super()
			
			@contentTypes = ['markdown-split']
			@previewClass = 'preview split'

		init: (element) ->
			@_options.position =
				#at: 'bottom left'
				#my: 'top left'
				my: 'top left'
				at: 'top left'
				type: 'fixed'
				target: [0,0]
	
				adjust:
					x: 0
					y: 0
					method: 'none' # manual width handling @onMove

			#@_options.repositionOnChange = false

			super element


		open: ->
			@trigger 'editor.open-split-markdown'
			@updateTooltipDimensions()
			#@editor.scope.addClass 'open-split-markdown'
			super()

		close: ->
			@trigger 'editor.close-split-markdown'
			#@editor.scope.removeClass 'open-split-markdown'
			super()

		updateTooltipDimensions: (e) ->
			elPos = @element.offset()
			
			@api.set('style.height', $(window).height() + top)
			@api.set('style.width', elPos.left - 10)

			true


	class SelectEditable extends JJPopoverEditable

		members: ->
			super()
			@contentTypes = ['select']
			@popoverClasses = ['selectable']
			@contentSeperator = ', '
			@_source = {}

		init: (element) ->
			if not @_options.position
				@_options.position =
						#at: 'bottom left'
						#my: 'top left'
						my: 'top left'
						at: 'bottom left'

						adjust:
							x: 0
							y: 0
							method: 'flip shift'

			@_source = element.data(@editor.attr._namespace + 'source') or {}

			super element

			@$set = $ '<div class="selectable-set">'
			@setPopoverContent @$set

			@setSource @_source

		onElementChange: (e, $el, value, id) ->
			true

		createPopupContent: ->
			@$set.empty()

			for i, source of @getSource()
				id = source.id or source.ID
				title = source.title or source.Title
				idAttr = @getDataName().toLowerCase() + '-item-' + id
				$label = $ '<label class="selectable-item" for="' + idAttr + '">' + title + '<label>'
				$input = $ '<input type="checkbox" name="' + @getDataName() + '" value="' + id + '" id="' + idAttr + '">'

				$input.prop 'checked', true if -1 isnt @getValueIndex id
				
				$input.on @getNamespacedEventName('change'), (e) =>
					value = @getValue()
					$target = $ e.target
					id = $target.val()
					id = parseInt id, 10 unless isNaN id
					index = @getValueIndex id
					isChecked = $target.prop 'checked'
					changed = false

					if false is @onElementChange e, $target, value, id
						# prevent default
						e.preventDefault();
						# reset checked
						$target.prop 'checked',  not isChecked

						return false

					if $target.is ':checked' 
						if -1 is index
							value.push id
							changed = true
					else if -1 isnt index
						value.splice index, 1
						changed = true

					if changed
						@setValue value
					true

				@$set.append $label.prepend($input)

			true

		onOptionsUpdate: ->
			@setSource @_options.source if @_options.source
			@contentSeperator = @_options.contentSeperator if @_options.contentSeperator

		getSeperator: ->
			@contentSeperator

		getSource: ->
			@_source

		setSource: (@_source, silent) ->
			@cleanupValue silent
			@createPopupContent()

		getValue: ->
			super().slice()

		getPrevValue: ->
			super().slice()

		getValueIndex: (id) ->
			$.inArray id, @getValue()

		isValidValue: (val) ->
			if val and val.length then true else false

		getValueFromContent: ->
			titles = @element.text().split @getSeperator()
			values = []
			for i, source of @getSource()
				title = source.title or source.Title
				if -1 isnt $.inArray title, titles
					values.push source.id

			values

		cleanupValue: (silent) ->
			value = @getValue()
			for i, val of value
				found = false
				for j, source of @getSource()
					id = source.id or source.ID
					found = true if val is id

				value.splice i, 1 if not found

			@setValue value, silent

		setValue: (value, silent, replace = true) ->
			super value, silent, replace
			@render()

		setValueToContent: (val, isPlaceholder) ->
			titles = []
			if val
				for i, source of @getSource()
					id = source.id or source.ID
					checked = false

					if -1 isnt $.inArray id, val
						title = source.title or source.Title
						titles.push title
						checked = true

					#update tooltip
					@updatePopoverContent title, id, checked


				@updateContent titles

		updatePopoverContent: (title, id, checked) ->
			if @$set
				input = @$set.find('#' + @getDataName().toLowerCase() + '-item-' + id)
				input.prop 'checked', checked

		updateContent: (titles) ->
			@element.html titles.join(@getSeperator())

		render: ->
			value = @getValue()
			if value and @isValidValue value
				@setValueToContent value
			else
				@element.html @getPlaceholder()

			#return if value then value else @getPlaceholder()
	
	class SelectPersonEditable extends SelectEditable

		members: ->
			super()
			@contentTypes = ['select-person']

		updateContent: (titles) ->
			prefix = if titles then ' &amp; ' else ''			
			@element.html prefix + titles.join(@getSeperator())



	class SelectListEditable extends SelectEditable

		members: ->
			super()
			@contentTypes = ['select-list']

		init: (element) ->
			if not @_options.position
				@_options.position =
						my: 'top right'
						at: 'top left'

						adjust:
							x: -10
							y: -16
							method: 'flip shift'

			super element

		updateContent: (titles) ->
			html = ''
			for title in titles
				html += '<li>' + title + '</li>'

			@element.html html

		render: ->
			value = @getValue()
			if value and @isValidValue value
				@setValueToContent value
			else
				@element.html '<li>' + @getPlaceholder() + '</li>'



	class SelectListConfirmEditable extends SelectListEditable

		members: ->
			super()
			@contentTypes = ['select-list-confirm']
			@_options = 
				confirm: 'Are you sure to do this?'

		init: (element) ->
			confirmTxt = element.data @editor.attr._namespace + 'confirm'

			if confirmTxt
				confirmOpts =
					confirm: confirmTxt

				@updateOptions confirmOpts, true

			super element

		getConfirm: ->
			@getOptions().confirm

		onElementChange: (e, $el, value, id) ->		
			confirm @getConfirm()



	class ModalEditable extends JJPopoverEditable

		members: ->
			super()
			@contentTypes = ['modal']

			@inputs = []
			@buttons = []

		init: (element) ->
			super element

			# defaults
			@_options = 
				fields: 
					Foo:
						placeholder: 'Bar'

				buttons:
					Submit: 
						type: 'submit'

					Cancel:
						type: 'cancel'



			@setFields element.data(@editor.attr._namespace + 'fields')
			@setButtons element.data(@editor.attr._namespace + 'buttons')

		getForm: ->
			$form = $('<form>').submit (e) =>
				e.preventDefault()
				@submit()

			$.each @inputs, (i, $input) ->
				$form.append $input

			$buttons = $ '<div class="buttons">'
			$.each @buttons, (i, $button) ->
				$buttons.append $button

			$form.append $buttons

		getFields: ->
			@getOptions().fields

		setFields: (fields) ->
			@_options.fields = fields if fields

			if @_options.fields
				for name, data of @_options.fields
					data.type = 'text' unless data.type
					data.placeholder = name unless data.placeholder

					$input = $ '<input type="' + data.type + '"name="' + name + '" placeholder="'+ data.placeholder + '"/>'
					@inputs.push $input

			@setPopoverContent()

		getButtons: ->
			@getOptions().buttons

		setButtons: (buttons) ->
			@_options.buttons = buttons if buttons

			if @_options.buttons
				for name, data of @_options.buttons
					if data.type is 'submit' or 'cancel'
						$btn = $ '<button type="' + data.type + '">' + name + '</button>'

						if data.type is 'submit'
							@_addSubmitEvent $btn

						else if data.type is 'cancel'
							@_addCancelEvent $btn

						@buttons.push $btn

			@setPopoverContent()

		_addSubmitEvent: ($btn, type = 'click') ->
			$btn.on type, (e) =>
				e.preventDefault()
				@submit()

				false

		submit: ->
			data = {}

			$.each @inputs, (i, input) =>
				$input = $ input
				data[$input.attr('name')] = $input.val()
			
			@setValue data
			@close()

		_addCancelEvent: ($btn) ->
			$btn.on 'click', (e) =>
				e.preventDefault()
				@close()
				false

		close: ->
			super()
			$('input, textarea', @api.tooltip).val('')


		getPopoverButtons: ->
			

			console.log $buttons

			$buttons

		setPopoverContent: (value) ->
			value = @getForm() unless value
			super value
			#super $(value).add(@getPopoverButtons())
		
		setValue: (value, silent) ->
			@triggerDataEvent 'submit', value unless silent




	# ! --- Implementation --------------------------------

	# make accessible
	window.JJEditor = JJEditor

	# publish base
	window.editorComponents = {}

	window.editorComponents.JJEditable = JJEditable
	window.editorComponents.JJPopoverEditable = JJPopoverEditable


	# publish sub classes	
	window.editorComponents.InlineEditable = InlineEditable
	window.editorComponents.DateEditable = DateEditable
	window.editorComponents.MarkdownEditable = MarkdownEditable
	window.editorComponents.SplitMarkdownEditable = SplitMarkdownEditable
	window.editorComponents.SelectEditable = SelectEditable
	window.editorComponents.SelectListEditable = SelectListEditable
	window.editorComponents.SelectPersonEditable = SelectPersonEditable
	window.editorComponents.SelectListConfirmEditable = SelectListConfirmEditable
	window.editorComponents.ModalEditable = ModalEditable

	# construction
	###
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

	editor.on 'change:Foo.My.Fucki.Image', (e) ->
		console.log "changed '#{e.name}' within #{e.scope} from #{e.prevValue} to #{e.value}"

	editor.on 'change:Foo.My.Fucki.Image.Test', (e) ->
		console.log "changed Test from #{e.prevValue} to #{e.value}"

	window.$test = $test = $ '<h1 data-editor-type="inline" data-editor-name="\My.Fucki.Image.TestTitle">FooBar</h1>'
	$('.overview').prepend $test
	editor.updateElements()
	###

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
	
	#window.editor = editor



			