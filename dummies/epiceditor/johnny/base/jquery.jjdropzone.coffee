"use strict"

do ($ = jQuery) ->

	class JJDropzone
		defaults :
			url						: null														# URL to post the files to
			errorMsg 				: 'Sorry, but there has been an error.' 					# Default error message
			className 				: null

		$dropzone: null
		fileMatch: null
		maxAllowed: null

		constructor : (selector, opts) ->
			@.options = $.extend {}, @.defaults, opts
			if @.options.doneHandler then @.doneHandler = @.options.doneHandler
			@.$dropzone = if selector instanceof jQuery then selector else $(selector)
			@.dragAndDropSetup()

		dragAndDropSetup : ->
			$dropzone = @.$dropzone

			$dropzone.on 'dragenter', (e) ->
				$(@).addClass 'dragactive'

			$dropzone.on 'dragleave drop', (e) ->
				$(@).removeClass 'dragactive'

			$dropzone.on 'drop', (e) =>
				# Drag and drop from within the document
				
				if JJMarkdownEditor._activeDraggable and (id = @.parseDraggableTag(JJMarkdownEditor._activeDraggable))
					dfd = new $.Deferred()
					found = false
					$.each @.cache, (i, obj) =>
						if obj.id is id 
							found = true
							@.doneHandler [obj]

					# request data
					if not found
						url = @.options.url + '?ids=' + id
						$.getJSON(url)
							.done (data) =>
								if $.isArray data
									@.addToCache data
									@.doneHandler data

				# Upload
				else if e.dataTransfer.files.length
					uploadDfd = JJFileUpload.do e, $dropzone, @.options.url, @.options.errorMsg, @.fileMatch, @.maxAllowed
					uploadDfd.done (data) =>
						data = $.parseJSON data
						@.addToCache data
						if className = @.options.className
							@.trigger 'newData', { className: className, data: data }

						@.doneHandler data
				

					

		addToCache : (data) ->
			if not @.cache then @.cache = []
			@.cache = @.cache.concat data



	# !- Custom shit

	class JJImageDropzone extends JJDropzone
		fileMatch: 'image.*'
		maxAllowed: 1
		cache: []

		parseDraggableTag: (tag) ->
			cap = SingleImgMarkdownParser.prototype.rule.exec tag
			if cap
				return parseInt(cap[1])
			null

		doneHandler: (data) ->
			data = data[0]
			@.$dropzone.html data[0].tag
			out = { id: data.id }
			if @.options.className then out.className = className
			if @.options.onChange then @.options.onChange out

			window.picturefill()


	window.JJImageDropzone = JJImageDropzone
