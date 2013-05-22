"use strict"

do ($ = jQuery) ->

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

		dragAndDropSetup : ->
			$dropzone = @.$dropzone

			$dropzone.on 'dragenter', (e) ->
				$(@).addClass 'dragover'

			$dropzone.on 'dragleave', (e) ->
				$(@).removeClass 'dragover'

			$dropzone.on 'drop', (e) =>
				@.deferredUpload(e)
					.always ->
						$dropzone.add($('body')).removeClass 'dragover'



	class JJSingleImageUploadZone extends JJUploadZone

		constructor: (selector, opts) ->
			super(selector, opts)
			@.dragAndDropSetup()

		setAsActiveDraggable : (e) ->
			if e.type is 'dragstart' then @._activeDraggableId = $(e.target).data('id') else @._activeDraggableId = null

		setAsDraggable: ($el) ->
			if not @.draggables then @.draggables = []
			if $el.length
				@.draggables.push $el
				$el.on 'dragstart dragend', (e) =>
					@.setAsActiveDraggable e

		cleanup: ->
			super()
			if @.draggables 
				for $draggable in @.draggables
					$draggable.off 'dragstart dragend'

		dragAndDropSetup: ->
			$dropzone = @.$dropzone

			$dropzone.on 'dragenter', (e) ->
				$(@).addClass 'dragover'

			$dropzone.on 'dragleave drop', (e) ->
				$(@).removeClass 'dragover'

			$dropzone.on 'drop', (e) =>
				if id = @._activeDraggableId
					@._activeDraggableId = null
					data = @.options.getFromCache id
					@.options.responseHandler data
				else if e.dataTransfer.files.length
					@.deferredUpload e





	window.JJSimpleImagesUploadZone = JJSimpleImagesUploadZone
	window.JJSingleImageUploadZone = JJSingleImageUploadZone