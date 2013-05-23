"use strict"

###*
 *
 *	static file drag and drop helper class
 * 
###

do ($ = jQuery) ->
	
	class JJFileUpload
		###*
		 * Uploads the dropped files (from the filesystem)
		 * @param  {Event} e               	The drop event
		 * @param  {jQuery} $dropzone       Where the files have been dropped
		 * @param  {string} postUrl         URL to post the files to
		 * @param  {Object} additionalData  additional POST data
		 * @param  {string} defaultErrorMsg Default error message
		 * @param  {string} filematch		String to match filenames to
		 * @param  {int} maxAllowed			Maximum allowed number of files
		 * @return {$.Deferred}             jQuery Deferred object
		###
		@do: (e, $dropzone, postUrl, additionalData, defaultErrorMsg, filematch, maxAllowed) ->
			errorMsg = null

			$dropzone.removeClass 'failed done'
			$('.progress-text, .progress', $dropzone).remove()

			# ! - Progress bar shit
			$progress = $('<div />', 
				class: 'progress'
			)
			.height(0)
			.appendTo $dropzone

			$progressText = $('<div />',
				class: 'progress-text'
			)
			.appendTo $dropzone

			files = e.dataTransfer.files
			formData = new FormData()

			if maxAllowed and files.length > maxAllowed then files = array_slice(files, 0, 3)

			$.each files, (index, file) ->
				# check if it's an image
				if not file.type.match filematch
					errorMsg = 'Sorry, but ' + file.name + ' is no image, bitch!'
				else
					formData.append file.name, file

			if additionalData
				for a,b of additionalData
					formData.append a, b

			if errorMsg 
				console.log errorMsg
				req = new $.Deferred()
				req.reject { error: errorMsg }
			else
				$dropzone.addClass 'uploading'
				req = $.ajax
					url: postUrl
					data: formData,
					processData: false,
					contentType: false,
					type: 'POST'
					xhr: ->
						xhr = new XMLHttpRequest()
						xhr.upload.onprogress = (evt) ->
							if evt.lengthComputable
								completed = Math.round((evt.loaded / evt.total) * 100) # floating point between 0 and 1
								$progressText.html(completed + '%')
								$progress.height completed + '%'
						xhr
			req.pipe (res) ->
				if not res.error then return res else return $.Deferred().reject res
			.fail (res) =>
				$dropzone.addClass 'failed'
				#msg = res.error || @.options.errorMsg
				$progressText.text defaultErrorMsg
				setTimeout ->
					$dropzone.removeClass 'dragover'
				, 3000
			.always ->
				$dropzone.removeClass 'uploading'
				#$progress.height

			.done ->
				$dropzone.addClass 'done'
				setTimeout ->
					$dropzone.removeClass 'dragover'
				, 1000
				

	window.JJFileUpload = JJFileUpload