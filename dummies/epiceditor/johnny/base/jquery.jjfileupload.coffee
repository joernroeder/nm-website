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
		 * @param  {int} maxAllowed			Maximum allowed number of files
		 * @return {$.Deferred}             jQuery Deferred object
		###
		@do: (e, $dropzone, postUrl, defaultErrorMsg, maxAllowed) ->
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

			if maxAllowed and files.length > maxAllowed then files = array_slice(files, 0, 3)

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
					url: postUrl
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
				$dropzone.append '<p>' + defaultErrorMsg + '</p>'
			.always =>
				$progressBar.remove()

	window.JJFileUpload = JJFileUpload