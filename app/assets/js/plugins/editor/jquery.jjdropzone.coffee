"use strict"

do ($ = jQuery) ->

	$.globalDragStart = $.Callbacks()
	$.globalDragEnd = $.Callbacks()

	$.dragLeaveTimeout = null

	$.fireGlobalDragEvent = (name, target, type = 'inline') ->
		eventName = if name is 'dragstart' then 'Start' else 'End'

		$['globalDrag' + eventName].fire
			type: type
			target: target

	$.globalDragStart.add (e) ->
		clearTimeout($.dragLeaveTimeout) if $.dragLeaveTimeout
		
		$('body').addClass 'dragover drag-' + e.type

	$.globalDragEnd.add (e) ->
		clearTimeout($.dragLeaveTimeout) if $.dragLeaveTimeout

		$.dragLeaveTimeout = setTimeout ->
			$('body').removeClass 'dragover drag-' + e.type
		, 200


	# ! ---

	class JJUploadZone
		fileMatch: 'image.*'

		defaults :
			url						: null					
			errorMsg 				: 'Sorry, but there has been an error.' 
			
			additionalData			: null
			responseHandler			: (data) ->
				console.log 'UPLOAD DATA'
				console.log data

		$dropzone: null
		maxAllowed: null

		constructor: (selector, opts) ->
			@.options = $.extend {}, @.defaults, opts
			@.$dropzone = if selector instanceof jQuery then selector else $(selector)
			@.$dropzone.addClass 'dropzone'

		cleanup : ->
			@.$dropzone.off 'dragenter dragleave drop'

		deferredUpload: (e) ->
			uploadDfd = JJFileUpload.do e, @.$dropzone, @.options.url, @.options.additionalData, @.options.errorMsg, @.fileMatch, @.maxAllowed
			uploadDfd.done (data) =>
				data = $.parseJSON data
				@.options.responseHandler data


	class JJSimpleImagesUploadZone extends JJUploadZone

		constructor: (selector, opts) ->
			super(selector, opts)
			@.dragAndDropSetup()

		dragAndDropSetup: ->
			$dropzone = @.$dropzone

			$dropzone.on 'dragenter', (e) ->
				$(@).addClass 'dragover'

			$dropzone.on 'dragleave', (e) ->
				$(@).removeClass 'dragover'

			$dropzone.on 'drop', (e) =>
				@.deferredUpload(e)
					.always ->
						$.fireGlobalDragEvent e.type, e.target
						$dropzone.removeClass 'dragover'



	class JJSingleImageUploadZone extends JJUploadZone

		constructor: (selector, opts) ->
			super(selector, opts)
			window.dropzoneIDCount++
			@dropzoneID = 'jjdrop-' + window.dropzoneIDCount
			@dragAndDropSetup()			

		setAsActiveDraggable : (e) ->
			if e.type is 'dragstart' 
				@._activeDraggableId = $(e.target).data('id')
				if not @._activeDraggableId
					@._activeDraggableId = $(e.target).parent().data 'id'

			else
				@._activeDraggableId = null

		setAsDraggable: ($el) ->
			if not @.draggables then @.draggables = []
			if $el.length
				@.draggables.push $el
				$el.on 'dragstart.' + @dropzoneID + ' dragend.' + @dropzoneID, (e) =>
					$.fireGlobalDragEvent e.type, e.target
					@.setAsActiveDraggable e

		cleanup: ->
			super()
			if @.draggables 
				for $draggable in @.draggables
					$draggable.off 'dragstart.' + @dropzoneID + ' dragend.' + @dropzoneID

		dragAndDropSetup: ->
			$dropzone = @.$dropzone

			$dropzone.on 'dragenter', (e) ->
				$(@).addClass 'dragover'

			$dropzone.on 'dragleave drop', (e) ->
				$(@).removeClass 'dragover'

			$dropzone.on 'drop', (e) =>
				$.fireGlobalDragEvent e.type, e.target
				if id = @._activeDraggableId
					@._activeDraggableId = null
					data = @.options.getFromCache id
					if data
						if data.done
							# is deferred
							data.done @.options.responseHandler
						else
							@.options.responseHandler data
				else if e.dataTransfer.files.length
					@.deferredUpload e



	window.dropzoneIDCount = 0

	window.JJSimpleImagesUploadZone = JJSimpleImagesUploadZone
	window.JJSingleImageUploadZone = JJSingleImageUploadZone