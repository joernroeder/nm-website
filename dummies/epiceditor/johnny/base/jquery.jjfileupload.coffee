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
		 * @param  {string} defaultErrorMsg Default error message
		 * @param  {stirng} filematch		String to match filenames to
		 * @param  {int} maxAllowed			Maximum allowed number of files
		 * @return {$.Deferred}             jQuery Deferred object
		###
		@do: (e, $dropzone, postUrl, defaultErrorMsg, filematch, maxAllowed) ->
			errorMsg = null

			# ! - Progress bar shit
			$progress = $('<div />',
					class: 'progress')
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
								completed = (evt.loaded / evt.total) * 100 # floating point between 0 and 1
								$progress.html(completed + '%')
						xhr
			req.pipe (res) ->
				if not res.error then return res else return $.Deferred().reject res
			.fail (res) =>
				#msg = res.error || @.options.errorMsg
				$dropzone.append '<p>' + defaultErrorMsg + '</p>'
			.always =>
				$dropzone.removeClass 'uploading'
				$progress.remove()

	window.JJFileUpload = JJFileUpload