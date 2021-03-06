"use strict"

###*
 *
 * JJMarkdownEditor 
 * v.0.0.2
 *
 * (2013)
 * 
 * A jQuery Markdown Editor with input & preview area, featuring several extra markdown syntax extensions like [img {id}] and [embed {url}]
 * Requirements: 
 * 	- jQuery
 * 	- Tabby jQuery plugin
 * 	- marked_jjedit.js
 * 	- jquery.jjfileupload.js
 * 
###

do ($ = jQuery) ->

	class JJMarkdownEditor

		###*
		 * 
		 * Default options
		 * 
		###
		defaults :
			preview 					: '#preview'												# Specifies the preview area: Accepts either CSS-selector or jQuery object
			parsingDelay	 			: 200														# Interval in which the markdown should be parsed (in ms)
			dragAndDropAllowed			: true														# Defines whether DragAndDrop is allowed or not
			hideDropzoneDelay 			: 1000 														# Defines after which time the dropzone within the preview area fades out when the markdown field is left (in ms)
			errorMsg 					: 'Sorry, but there has been an error.' 					# Default error message
			contentGetter				: 'val'														# Defines how to retrieve the input area's data. Default is 'val' (thus $input.val())
			customParsers				: {}														# Defines which custom markdown parsers are active 
			customParserOptions			: {}														# Options to pass to the custom parsers. Format: { ParserName: OptionsObject }
			afterRender					: null														# Method to call after the markdown rendering has been done
			onChange					: null														# Function to pass the data to, after the parsing has been done
			onBlur						: null														# Method to call when the input area loses focus
			imageUrl					: '/imagery/images/docimage/'								# URL to post the images to
			placeholder					: 'PLACEHOLDER'												# Placeholder text to show in preview area if textarea is empty
			charlimit					: 0															# Max. length of input
			additionalPOSTData			: null														# additional data that will be POSTed when uploading images
			uploadResponseHandler		: null														# function that is called when an image has been uploaded. gets pased the server's response


		constructor : (selector, opts) ->
			# init member vars
			$input = null
			@$preview = null

			@currentDrag = null
			@inlineElementDragged = null
			@dragCount = 0
			@fileDragPermitted = true

			@pendingAjax = []
			@customParsers = {}

			@firstTimeRendered = false

			@.options = $.extend {}, @.defaults, opts
			@.$input = if selector instanceof jQuery then selector else $(selector)
			@.$input._val = @.$input[@.options.contentGetter]
			@.$preview = if @.options.preview instanceof jQuery then @.options.preview else $(@.options.preview)

			@.initialize()

		###*
		 *
		 * Static functions that allow DOM Elements to be dragged into the Preview area of any JJMarkdown Editor
		 * 
		###

		# private
		setAsActiveDraggable = (e) ->
			if e.type is 'dragstart' 
				set = $(e.target).data('md-tag')
				if not set then set = $(e.target).parent().data('md-tag')
				set = set.replace('\\[', '[').replace('\\]', ']')
			else
				set = null
			$.fireGlobalDragEvent e.type, e.target
			JJMarkdownEditor._activeDraggable = set

		@setAsDraggable : ($els) ->
			if not JJMarkdownEditor.draggables then JJMarkdownEditor.draggables = []
			# filter only those that have a md-tag
			$els = $els.filter '[data-md-tag]'
			if $els.length
				JJMarkdownEditor.draggables.push $els
				$els.on 'dragstart dragend', setAsActiveDraggable

		@cleanupDraggables: ->
			if JJMarkdownEditor.draggables
				$.each JJMarkdownEditor.draggables, (i, $els) ->
					$els.off 'dragstart dragend'


		# removes input-,preview- and dropzone, unbinding all events
		cleanup : ->
			@.$input.remove()
			@.$preview.remove()
			if @.$dropzone then @.$dropzone.remove()

		initialize : ->
			
			# setup the used custom parsers
			$.each @.options.customParsers, (key, parser) =>
				p = window[parser]
				if p
					opts = @.options.customParserOptions[key]
					@.customParsers[key] = new p(opts)

			$input = @.$input
			$preview = @.$preview
			_this = this

			# Support tabs in textarea and trigger a keyup to init preview
			$input.tabby().trigger 'keyup'

			@.delayTimeout = null

			# Bind textarea edit. Timeout parses Markdown
			$input.off('keyup').on 'keyup', (e) ->
				$this = $ @

				# check for charlimit
				charlimit = _this.options.charlimit
				if charlimit > 0 and $input._val().length > charlimit
					$input._val $input._val().substring(0, charlimit)

				if delayTimeout then clearTimeout delayTimeout
				delayTimeout = setTimeout ->
					_this.parseMarkdown()
				, _this.options.parsingDelay


			# Setup the scrolling listener
			$els = $input.add $preview
			scrollArea = null
			$els.on 'scroll', (e) ->
				$this = $(@)
				$partner = if $this.is($input) then $preview else $input

				# Block scroll change on current scrolling zone
				if scrollArea and scrollArea.is($partner) then return false

				# Scroll other view
				
				scrollArea = $this
				$partner[0].scrollTop = @.scrollTop * $partner[0].scrollHeight / @.scrollHeight		

				setTimeout ->
					scrollArea = null
				, 200

			_this.parseMarkdown()

			if @.options.dragAndDropAllowed
				@.dragAndDropSetup()

			@

		parseMarkdown : ->
			# kill pending ajax requests
			$.each @.pendingAjax, (i, pending) ->
				if pending.readyState isnt 4 and pending.abort then pending.abort()
			
			raw = @.$input._val()


			markdown = marked raw

			# Custom parsers, always need to pass the raw version
			seeds = []
			$.each @.customParsers, (i, parser) =>
				ids = parser.findIDs raw
				seed = parser.getData ids
				seeds.push seed
				if not parser.noAjax then @.pendingAjax.push seed

			$.when.apply($, seeds).then =>
				# assumes all ajax requests are done
				@.pendingAjax = []

				# convert everything
				$.each @.customParsers, (i, parser) =>
					markdown = parser.parseMarkdown markdown

				@.$preview.trigger 'markdown:replaced'
				# set to placeholder if no content
				if raw.length is 0
					@.$preview.html @.options.placeholder
				else
					@.$preview.html markdown
				@.inlineDragAndDropSetup()

				if @.options.afterRender then @.options.afterRender()
				data = { raw:raw }
				if @.customParsers.images then data.images = @.customParsers.images.returnIds()
				
				if @.options.onChange and @.firstTimeRendered then @.options.onChange data

				@firstTimeRendered = true

		# this sets up the drag and drop for files
		dragAndDropSetup : ->
			$preview = @.$preview

			dropzoneDelay = @.options.hideDropzoneDelay

			# !- Dragging over the preview container: show our image dropzone

			$preview.on 'dragover', (e) =>

				if not @.currentDrag
					@.currentDrag =
						$dropzone: $ '<div>',
							'class': 'dropzone'
					# increase dragcount and set it as data
					@.dragCount++
					$preview.data 'dragid', @.dragCount
					@.currentDrag.$dropzone.data 'dragid', @.dragCount

				_bindDropHandler()

				currDrag = @.currentDrag
				$dropzone = currDrag.$dropzone

				# clear the timeout for hiding the dropzone
				if currDrag.hideDropzoneTimeout then clearTimeout @.currentDrag.hideDropzoneTimeout

				# get the dragover target
				$target = $ e.target

				if not $target.is $dropzone

					# check if target is the preview container
					isContainer = false

					if $target.is($preview)
						isContainer = true
					# check if target is <p> or anything else. if anything else then get parent <p>
					else
						if not $target.attr('data-editor-pos')
							$temp = $target.closest('[data-editor-pos]')
							if $temp.length
								$target = $temp
							else
								$target = $preview
								isContainer = true

					func = if isContainer then 'appendTo' else 'insertBefore'

					currDrag.$target = $target
				
					$dropzone[func].call $dropzone, $target

			# This should prevent uploading when the file was dropped next to the dropzone or on an older dropzone that's still active
			$preview.on 'drop', (e) =>
				$target = $ e.originalEvent.originalTarget
				if @.currentDrag and not $target.is @.currentDrag.$dropzone
					_setHideDropzoneTimeout()
					return false

			_setHideDropzoneTimeout = =>
				if not @.currentDrag then return
				clearTimeout @.currentDrag.hideDropzoneTimeout
				@.currentDrag.hideDropzoneTimeout = setTimeout =>
					@.currentDrag.$dropzone.hide().detach().show()
				, dropzoneDelay

			# ! - leaving the preview area: remove the dropzone
			$preview.on 'dragleave', _setHideDropzoneTimeout

			_bindDropHandler = =>
				if @.currentDrag.dropHandlerBound then return false
				@.currentDrag.dropHandlerBound = true

				$dropzone = @.currentDrag.$dropzone

				# ! - dragging over our dropzone
				$dropzone.on 'dragenter', (e) ->
					$(@).addClass 'dragover'

				$dropzone.on 'dragleave', (e) ->
					$(@).removeClass 'dragover'

				# ! - dropping on our dropzone
				$dropzone.on 'drop', (e) =>

					$target = @.currentDrag.$target
					hideDropzoneTimeout = @.currentDrag.hideDropzoneTimeout

					if hideDropzoneTimeout then clearTimeout hideDropzoneTimeout

					# unbind shit
					$dropzone.off 'drop'

					# empty current drag object
					@.currentDrag = null

					# defer rerendering
					dfdParse = new $.Deferred()
					dfdParse.done =>
						$dropzone.remove()
						@.parseMarkdown()

					# inline moving of element
					if el = @.inlineElementDragged
						@.moveInlineElement $(el), $target
						@.inlineElementDragged = null
						dfdParse.resolve()
					# element moved in from outside the $preview-area
					else if md = JJMarkdownEditor._activeDraggable
						@.insertAtEditorPosByEl $target, md
						JJMarkdownEditor._activeDraggable = null
						dfdParse.resolve()
					# upload
					else if e.dataTransfer.files.length

						uploadDfd = JJFileUpload.do e, $dropzone, @.options.imageUrl, @.options.additionalPOSTData, @.options.errorMsg, 'image.*'

						uploadDfd.done (data) =>
					
							data = $.parseJSON data
							
							if @.options.uploadResponseHandler then @.options.uploadResponseHandler data

							rawMd = ''
							for obj in data
								rawMd += '[img ' + obj.id + ']'

							nl = '  \n\n'
							# insert rawMd at right position
							@.insertAtEditorPosByEl $target, rawMd + nl

							dfdParse.resolve()

					else
						# always remove dropzone
						$dropzone.remove()

		inlineDragAndDropSetup : () ->
			$preview = @.$preview

			# moving of single inline images
			$imgs = $preview.find('[data-md-tag]')
			_this = @
			$imgs.on 'dragstart', (e) ->
				_this.inlineElementDragged = @

			$imgs.on 'dragend', (e) =>
				@.inlineElementDragged = null

			$preview.on 'markdown:replace', ->
				# remove listeners
				$imgs.off 'dragstart dragend'
			

		# !- Convenience functions
		
		# moves $el above $target within the editor, if $target is $preview, append
		moveInlineElement : ($el, $target) ->
			mdTag = $el.data('md-tag').replace /\\/g, ''
			
			pos = $el.data('editor-pos')
			
			# add length to position because if the element is inserted before its original position
			if not ($target.is @.$preview) and ($target.data('editor-pos') < pos) then pos += mdTag.length
			# insert the mdTag in editor
			@.insertAtEditorPosByEl $target, mdTag
			# remove the obsolete moved mdTag
			@.removeAtEditorPos pos, mdTag


		removeAtEditorPos : (pos, md) ->
			val = @.$input._val()
			val = [val.slice(0, pos), val.slice(pos + md.length)].join ''
			@.$input._val val

		# inserts at the editor-pos of $el. if $el is the $preview-area, appends it
		insertAtEditorPosByEl : ($el, md) ->
			md += '  \n\n'
			val = @.$input._val()
			if $el.is @.$preview
				val = val + md
			else
				pos = $el.data 'editor-pos'
				val = [val.slice(0, pos), md, val.slice(pos)].join ''
			@.$input._val val

	# !- Custom Markdown parser
	
	CustomMarkdownParserInterface =
		findIDs : (raw) ->				# returns array of identification
		parseFound : (found) ->			# parses a found ID into the wished format
		getUrl : (reqIds) ->			# returns the URL to fetch missing data from the server
		getData : (ids) ->				# returns a $.Deferred, resolved should set @data to array of objects {id: , tag:}
		parseMarkdown: (md) ->			# parses and returns the markdown
		returnIds: ->					# returns an array of all currently used ids

	class CustomMarkdownParser
		url: ''
		constructor: (opts) ->
			@cache = []
			if opts
				for a,b of opts
					@[a] = b


	# implementation

	CustomMarkdownParser.prototype.findIDs = (raw) ->
		@_raw = raw
		replacements = []
		founds = []

		while cap = @rule.exec raw
			replacements.push cap
			found = @parseFound cap[1]

			if $.inArray(found, founds) < 0 then founds.push found

		@._tempReplacements = replacements

		founds

	CustomMarkdownParser.prototype.parseFound = (found) ->
		found

	CustomMarkdownParser.prototype.getUrl = (reqIds) ->
		@url + '?ids=' + reqIds.join(',')

	CustomMarkdownParser.prototype.getData = (ids) ->

		reqIds = []

		# this is our array of data we pass to the parse markdown function
		resolveData = []

		dfd = new $.Deferred()

		$.each ids, (i, id) =>
			found = null
			$.each @cache, (j, obj) ->
				if obj.id is id then found = obj
				return
			if not found then reqIds.push(id) else resolveData.push(found)

		if not reqIds.length
			@data = resolveData
			dfd.resolve()
			return dfd

		# get the missing data from the server
		url = @getUrl reqIds
		$.getJSON(url)
			.done (data) =>
				if $.isArray(data)
					@cache = @cache.concat data
					resolveData = resolveData.concat data

					@data = resolveData


	CustomMarkdownParser.prototype.parseMarkdown = (md) ->

		insertDataIntoRawTag = (rawTag, dataName, dataVal) ->
			ltp = rawTag.indexOf '>'
			[rawTag.slice(0, ltp), ' data-' + dataName + '="' + dataVal + '"', rawTag.slice(ltp)].join('')

		patternsUsed = []
		raw = @._raw
			
		usedIds = []
		$.each @._tempReplacements, (i, replace) =>
			obj = null
			id = @parseFound replace[1]
			$.each @data, (j, o) ->
				if o.id is id then obj = o
				return

			if obj
				usedIds.push obj.id
				# replace and insert the position within the editor
				pattern = replace[0].replace('[', '\\[').replace(']', '\\]')
				tag = insertDataIntoRawTag obj.tag, 'editor-pos' , replace['index']
				tag = insertDataIntoRawTag tag, 'md-tag', pattern
				md = md.replace replace[0], tag

		# cleanup
		@_raw = null
		@_tempReplacements = null
		@usedIds = $.unique usedIds
		md

	CustomMarkdownParser.prototype.returnIds = ->
		out = {ids: @usedIds}
		if @className then out.className = @className
		out


	window.JJMarkdownEditor = JJMarkdownEditor
	window.CustomMarkdownParser = CustomMarkdownParser
	