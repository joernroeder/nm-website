"use strict"

do ($ = jQuery) ->

	class JJMarkdownEditor

		defaults :
			preview 			: '#preview'								# preview container selector
			convertingDelay 	: 200								# interval in which the textarea is parsed (in ms)
			hideDropzoneDelay 	: 1000 							# (ms) defines after which time the dropzone for images fades out when the Markdown field is left
			imageUrl 			: '/_md_/images/docimage' 					# url to which the image requests should refer
			errorMsg 			: 'Sorry, but there has been an error.' 	# default upload error message
			contentGetter		: 'val'

		$input : null
		$preview: null

		currentDrag : null
		inlineElementDragged : null
		dragCount: 0
		fileDragPermitted: true

		imageCache : []

		rules :
			img: /\[img\s{1,}(.*?)\]/gi

		constructor : (selector, opts) ->
			@.options = $.extend {}, @.defaults, opts
			@.$input = if selector instanceof jQuery then selector else $(selector)
			@.$input._val = @.$input[@.options.contentGetter]
			@.$preview = if @.options.preview instanceof jQuery then @.options.preview else $(@.options.preview)
			@.initialize()

		_cleanupEvents : ->
			@.$input.off 'keyup scroll'
			@.$preview.off 'scroll dragover dragleave'
			@.$dropzone.off 'drop'


		initialize : ->
			# Support tabs in textarea and trigger a keyup to init preview
			$input = @.$input
			$input.tabby().trigger 'keyup'
			$preview = @.$preview

			_this = this

			@.delayTimeout = null

			# Bind textarea edit. Timeout parses Markdown
			$input.off('keyup').on 'keyup', (e) ->
				$this = $ @
				if delayTimeout then clearTimeout delayTimeout
				delayTimeout = setTimeout ->
					_this.parseMarkdown()
				, _this.options.convertingDelay

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

			@.dragAndDropSetup()

			@

		parseMarkdown : ->

			# @todo cleanup listeners
			raw = @.$input._val()
			markdown = marked raw

			# CUSTOM MARKDOWN
			 
			# 1. replace single images
			
			imgIds = []
			imgReplacements = []
			
			while cap = @.rules.img.exec(markdown)
					imgReplacements.push cap
					id = parseInt cap[1]
					if $.inArray(id, imgIds) < 0 then imgIds.push parseInt(cap[1])


			markdownImageDfd = @.requestImagesByIds(imgIds)
			markdownImageDfd.done =>
				patternsUsed = []
				cache = @.imageCache
				$.each imgReplacements, (i, replace) =>
					do (replace) =>
						$.each cache, (j, obj) =>
							if obj.id is parseInt(replace[1])
								# replace and insert the position within the editor
								
								pattern = replace[0].replace('[', '\\[').replace(']', '\\]')
								exp = new RegExp(pattern, 'gi')
							
								# only execute if pattern hasn't been used already
								if $.inArray(pattern, patternsUsed) < 0
									while cap = exp.exec(raw)
										tag = @.insertDataIntoRawTag obj.tag, 'editor-pos' , cap['index']
										tag = @.insertDataIntoRawTag tag, 'md-tag', pattern

										markdown = markdown.replace replace[0], tag

								patternsUsed.push pattern

			$.when(markdownImageDfd).then =>
				@.$preview.trigger 'markdown:replaced'
				@.$preview.html markdown
				@.inlineDragAndDropSetup()
				window.picturefill()


		requestImagesByIds : (ids) ->
			dfd = new $.Deferred()
			_this = @
			reqIds = []
			$.each ids, (i, id) ->
				do (id) ->
					found = false
					$.each _this.imageCache, (j, obj) ->
						found = true
					if not found then reqIds.push id

			# get the missing images from the server
			if not reqIds.length
				dfd.resolve()
				return dfd
			url = @.options.imageUrl + '?ids=' + reqIds.join(',')

			$.getJSON(url)
				.done (data) =>
					if $.isArray(data)
						@.imageCache = @.imageCache.concat data

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

				# ! - dropping on our dropzone: upload and handle response shit!
				@.currentDrag.$dropzone.on 'drop', (e) =>

					$dropzone = @.currentDrag.$dropzone
					$target = @.currentDrag.$target
					hideDropzoneTimeout = @.currentDrag.hideDropzoneTimeout

					if hideDropzoneTimeout then clearTimeout hideDropzoneTimeout

					# unbind shit
					$dropzone.off 'drop'

					# empty current drag object
					@.currentDrag = null

					# inline moving of element
					if @.inlineElementDragged
						$el = $ @.inlineElementDragged

						if $target.is $preview
							@.moveElementToEditorBottom $el
						else
							@.moveElementAbove $el, $target

						$dropzone.remove()
						# rerender
						@.parseMarkdown()
					else
					# upload
					if e.dataTransfer.files.length
						errorMsg = null

						# ! - Progress bar shit
						$progressBar = $('<div />',
								class: 'progress-bar')
							.appendTo $dropzone
						$progressBar.append $('<div />')

						_xhrProgress = (e) =>
							if e.lengthComputable
								completed = (e.loaded / e.total) * 100 # floating point between 0 and 1
								$progressBar.find('div').css('width', completed + '%')
				
						files = e.dataTransfer.files
						formData = new FormData()

						$.each files, (index, file) ->
							# check if it's an image
							if not file.type.match 'image.*'
								errorMsg = 'Sorry, but ' + file.name + ' is no image, bitch!'
							else
								formData.append file.name, file

						if errorMsg 
							console.log errorMsg
							req = new $.Deferred()
							req.reject { error: errorMsg }
						else
							req = $.ajax
								url: @.options.imageUrl
								data: formData,
								processData: false,
								contentType: false,
								type: 'POST'
								xhr: ->
									xhr = new XMLHttpRequest()
									xhr.upload.addEventListener 'progress', _xhrProgress, false
									xhr
						req.pipe (res) ->
							if not res.error then return res else return $.Deferred().reject res
						.fail (res) =>
							#msg = res.error || @.options.errorMsg
							$dropzone.append '<p>' + @.options.errorMsg + '</p>'
						.done (data) =>
					
							data = $.parseJSON data
							imgs = []
							rawMd = ''
							for obj in data
								@.imageCache.push obj
								rawMd += '[img ' + obj.id + ']'

							$dropzone.remove()

							nl = '  \n\n'

							# insert rawMd at right position
							if $target.is($preview)
								@.$input._val @.$input._val() + rawMd + nl
							else
								@.insertAtEditorPos $target, rawMd + nl

							# rerender
							@.parseMarkdown();


						.always =>
							$progressBar.remove()

		inlineDragAndDropSetup : () ->
			$preview = @.$preview

			# moving of single inline images
			$imgs = $preview.find('[data-md-tag][data-picture]')
			_this = @
			$imgs.on 'dragstart', (e) ->
				_this.inlineElementDragged = @

			$imgs.on 'dragend', (e) =>
				@.inlineElementDragged = null

			$preview.on 'markdown:replace', ->
				# remove listeners
				$imgs.off 'dragstart dragend'
			

		# !- Convenience functions
		
		# moves $el above $target within the editor
		moveElementAbove : ($el, $target) ->
			mdTag = $el.data('md-tag').replace /\\/g, ''
			# add lenght to position because we insert it before we remove it
			pos = $el.data('editor-pos') + mdTag.length

			# insert the mdTag in editor
			@.insertAtEditorPos $target, mdTag
			# remove the obsolete moved mdTag
			@.removeAtEditorPos pos, mdTag

		# moves $el to the editor bottom
		moveElementToEditorBottom : ($el) ->
			mdTag = $el.data('md-tag').replace /\\/g, ''
			pos = $el.data('editor-pos')
			@.removeAtEditorPos pos, mdTag
			@.$input._val(@.$input._val() + mdTag)


		removeAtEditorPos : (pos, md) ->
			val = @.$input._val()
			val = [val.slice(0, pos), val.slice(pos + md.length)].join ''
			@.$input._val val

		insertAtEditorPos : ($el, md) ->
			pos = $el.data 'editor-pos'
			val = @.$input._val()
			val = [val.slice(0, pos), md, val.slice(pos)].join ''
			@.$input._val val

		insertDataIntoRawTag : (rawTag, dataName, dataVal) ->
			ltp = rawTag.indexOf '>'
			[rawTag.slice(0, ltp), ' data-' + dataName + '="' + dataVal + '"', rawTag.slice(ltp)].join('');



	window.JJMarkdownEditor = JJMarkdownEditor