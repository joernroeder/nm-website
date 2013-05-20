"use strict"

do ($ = jQuery) ->

	class JJSimpleImagesUploadZone
		fileMatch: 'image.*'
		cache: null

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
			@.dragAndDropSetup()

		cleanup : ->
			@.$dropzone.off 'dragenter dragleave drop'

		dragAndDropSetup : ->
			$dropzone = @.$dropzone

			$dropzone.on 'dragenter', (e) ->
				console.log 'dragging into it'
				$(@).addClass 'dragactive'

			$dropzone.on 'dragleave drop', (e) ->
				$(@).removeClass 'dragactive'

			$dropzone.on 'drop', (e) =>
				console.log 'dropping'
				if e.dataTransfer.files.length
					uploadDfd = JJFileUpload.do e, $dropzone, @.options.url, @.options.additionalData, @.options.errorMsg, @.fileMatch, @.maxAllowed
					uploadDfd.done (data) =>
						data = $.parseJSON data
						@.options.responseHandler data

	window.JJSimpleImagesUploadZone = JJSimpleImagesUploadZone